import { DurableObject } from 'cloudflare:workers'
import { createInitialCheckedMask, getBingoProgress, isFirstBingoTransition, setSquareChecked } from '../shared/bingo'
import type { ApiBindings } from './api'
import type { FirstBingo, PublicRoomPlayer, RoomSnapshot, SavedProgress, SquareUpdateInput, SquareUpdateResult, RemovePlayerResult } from './room-model'
import { extractSessionToken, hashSessionToken } from './player-session'
import type { JoinPlayerInput, JoinResult, OwnPlayer } from './player-session'

/** Each room owns a SQLite database. All player records survive normal restarts. */
export class BingoRoom extends DurableObject<ApiBindings> {
  constructor(ctx: DurableObjectState, env: ApiBindings) {
    super(ctx, env)
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        room_code TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 0,
        first_bingo_player_id TEXT,
        first_bingo_name TEXT,
        first_bingo_at TEXT
      )
    `)
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_key TEXT NOT NULL UNIQUE,
        card_id INTEGER NOT NULL CHECK (card_id BETWEEN 1 AND 10),
        card_version TEXT NOT NULL,
        card_snapshot_json TEXT NOT NULL,
        checked_mask INTEGER NOT NULL,
        player_revision INTEGER NOT NULL DEFAULT 0,
        joined_at TEXT NOT NULL,
        last_modified_at TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE
      )
    `)
    // Step 8 databases predate player_revision. Add the column without resetting marks.
    const columns = ctx.storage.sql.exec('PRAGMA table_info(players)').toArray()
    if (!columns.some(column => column.name === 'player_revision')) {
      ctx.storage.sql.exec('ALTER TABLE players ADD COLUMN player_revision INTEGER NOT NULL DEFAULT 0')
    }
  }

  /** Read-only live channel. Authentication happens before the socket is accepted. */
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket erforderlich', { status: 426 })
    }
    const room = this.ctx.storage.sql.exec('SELECT room_code FROM room_meta WHERE id = 1').toArray()[0]
    if (!room) return new Response('Raum nicht gefunden', { status: 404 })
    const token = extractSessionToken(request.headers.get('Cookie'), String(room.room_code))
    if (!token) return new Response('Sitzung erforderlich', { status: 401 })
    const player = await this.getPlayerByTokenHash(await hashSessionToken(token))
    if (!player) return new Response('Sitzung erforderlich', { status: 401 })
    // Limit per-room sockets. This channel never accepts state-changing messages.
    if (this.ctx.getWebSockets().length >= 100) {
      return new Response('Raum hat zu viele Verbindungen', { status: 503 })
    }
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.ctx.acceptWebSocket(server, [`player:${player.playerId}`])
    server.serializeAttachment({ playerId: player.playerId })
    await this.broadcastSnapshot()
    return new Response(null, { status: 101, webSocket: client })
  }

  /** Cloudflare WebSocket Hibernation: no in-memory socket registry to lose. */
  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === 'resync') {
      const snapshot = await this.getSnapshot()
      if (snapshot) socket.send(JSON.stringify(snapshot))
    } else if (typeof message !== 'string' || message.length > 32) {
      socket.close(1008, 'Ungültige Nachricht')
    }
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    // Older local workerd compatibility dates require explicitly replying to close.
    try { socket.close() } catch { /* Already closed. */ }
    await this.broadcastSnapshot()
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    try { socket.close(1011, 'Verbindung unterbrochen') } catch { /* Already closed. */ }
    await this.broadcastSnapshot()
  }

  /** Push canonical public data only. Failed sends must never roll back saved marks. */
  private async broadcastSnapshot(): Promise<void> {
    try {
      const snapshot = await this.getSnapshot()
      if (!snapshot) return
      const payload = JSON.stringify(snapshot)
      for (const socket of this.ctx.getWebSockets()) {
        if (socket.readyState !== 1) continue
        try { socket.send(payload) } catch { /* A disconnected client will reconnect. */ }
      }
    } catch (error) {
      console.error('Live-Broadcast fehlgeschlagen (SQLite-Daten bleiben gespeichert)', error)
    }
  }

  /** Never overwrite an existing room when someone tries to create it again. */
  async initialize(roomCode: string): Promise<boolean> {
    const existing = this.ctx.storage.sql.exec('SELECT room_code FROM room_meta WHERE id = 1').toArray()
    if (existing.length > 0) return false
    const now = new Date().toISOString()
    this.ctx.storage.sql.exec(
      'INSERT INTO room_meta (id, room_code, created_at, last_activity_at, revision) VALUES (1, ?, ?, ?, 0)',
      roomCode, now, now,
    )
    return true
  }

  private toOwnPlayer(row: Record<string, unknown>): OwnPlayer {
    return {
      playerId: String(row.player_id), name: String(row.name), cardId: Number(row.card_id),
      cardVersion: String(row.card_version),
      checkedIndices: [...getBingoProgress(Number(row.checked_mask)).checkedIndices],
      playerRevision: Number(row.player_revision),
      joinedAt: String(row.joined_at),
    }
  }

  /** A valid bearer cookie can only resolve to its own player in this room. */
  async getPlayerByTokenHash(tokenHash: string): Promise<OwnPlayer | null> {
    const rows = this.ctx.storage.sql.exec(
      'SELECT player_id, name, card_id, card_version, checked_mask, player_revision, joined_at FROM players WHERE token_hash = ?',
      tokenHash,
    ).toArray()
    return rows.length ? this.toOwnPlayer(rows[0]) : null
  }

  async joinPlayer(input: JoinPlayerInput): Promise<JoinResult> {
    if (this.ctx.storage.sql.exec('SELECT room_code FROM room_meta WHERE id = 1').toArray().length === 0) {
      return { status: 'room_not_found' }
    }
    if (this.ctx.storage.sql.exec('SELECT player_id FROM players WHERE name_key = ?', input.nameKey).toArray().length) {
      return { status: 'name_taken' }
    }
    const now = new Date().toISOString()
    // No await between uniqueness check and insert: SQLite UNIQUE is the final safeguard.
    this.ctx.storage.sql.exec(
      `INSERT INTO players
        (player_id, name, name_key, card_id, card_version, card_snapshot_json,
         checked_mask, joined_at, last_modified_at, token_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.playerId, input.name, input.nameKey, input.cardId, input.cardVersion,
      JSON.stringify(input.cardSnapshot), createInitialCheckedMask(), now, now, input.tokenHash,
    )
    this.ctx.storage.sql.exec(
      'UPDATE room_meta SET revision = revision + 1, last_activity_at = ? WHERE id = 1', now,
    )
    await this.broadcastSnapshot()
    return { status: 'created', player: {
      playerId: input.playerId, name: input.name, cardId: input.cardId,
      cardVersion: input.cardVersion, checkedIndices: [12], playerRevision: 0, joinedAt: now,
    } }
  }


  private firstBingoFromRow(row: Record<string, unknown>): FirstBingo | null {
    return row.first_bingo_player_id === null || row.first_bingo_player_id === undefined
      ? null
      : { playerId: String(row.first_bingo_player_id), name: String(row.first_bingo_name),
          at: String(row.first_bingo_at) }
  }

  /** Atomic, authenticated, conditional SET (never an unreliable toggle). */
  async setPlayerSquare(input: SquareUpdateInput): Promise<SquareUpdateResult> {
    const result = this.ctx.storage.transactionSync((): SquareUpdateResult => {
      const rooms = this.ctx.storage.sql.exec(
        'SELECT revision, first_bingo_player_id, first_bingo_name, first_bingo_at FROM room_meta WHERE id = 1',
      ).toArray()
      if (!rooms.length) return { status: 'room_not_found' }
      const rows = this.ctx.storage.sql.exec(
        'SELECT player_id, name, checked_mask, player_revision FROM players WHERE token_hash = ?',
        input.tokenHash,
      ).toArray()
      if (!rows.length) return { status: 'session_required' }

      const row = rows[0]
      const room = rooms[0]
      const mask = Number(row.checked_mask)
      const currentPlayerRevision = Number(row.player_revision)
      // Route validation already rejects bad input; the pure game rules revalidate it.
      const desiredMask = setSquareChecked(mask, input.index, input.checked)
      const progressState = (currentMask: number, playerRevision: number,
        revision: number, firstBingo: FirstBingo | null): SavedProgress => {
        const progress = getBingoProgress(currentMask)
        return {
          playerId: String(row.player_id), checkedIndices: [...progress.checkedIndices],
          completed: progress.completedSquares, completedLines: progress.completedLines,
          hasBingo: progress.hasBingo, playerRevision, revision, firstBingo,
        }
      }
      const previousWinner = this.firstBingoFromRow(room)
      const currentRoomRevision = Number(room.revision)
      if (desiredMask === mask) {
        // Lost HTTP responses can be retried safely even with the old revision.
        return { status: 'unchanged', state: progressState(mask, currentPlayerRevision,
          currentRoomRevision, previousWinner) }
      }
      if (input.expectedPlayerRevision !== currentPlayerRevision) {
        return { status: 'stale', state: progressState(mask, currentPlayerRevision,
          currentRoomRevision, previousWinner) }
      }

      const now = new Date().toISOString()
      const winner = !previousWinner && isFirstBingoTransition(mask, desiredMask)
        ? { playerId: String(row.player_id), name: String(row.name), at: now }
        : previousWinner
      this.ctx.storage.sql.exec(
        'UPDATE players SET checked_mask = ?, player_revision = player_revision + 1, last_modified_at = ? WHERE player_id = ?',
        desiredMask, now, row.player_id,
      )
      this.ctx.storage.sql.exec(
        `UPDATE room_meta SET revision = revision + 1, last_activity_at = ?,
          first_bingo_player_id = ?, first_bingo_name = ?, first_bingo_at = ? WHERE id = 1`,
        now, winner?.playerId ?? null, winner?.name ?? null, winner?.at ?? null,
      )
      return { status: 'updated', state: progressState(desiredMask, currentPlayerRevision + 1,
        currentRoomRevision + 1, winner) }
    })
    if (result.status === 'updated') await this.broadcastSnapshot()
    return result
  }

  /** Remove only the player matching the private token; never delete the room. */
  async removePlayerByTokenHash(tokenHash: string): Promise<RemovePlayerResult> {
    const result = this.ctx.storage.transactionSync((): RemovePlayerResult => {
      const room = this.ctx.storage.sql.exec(
        'SELECT room_code FROM room_meta WHERE id = 1',
      ).toArray()
      if (!room.length) return { status: 'room_not_found' }
      const players = this.ctx.storage.sql.exec(
        'SELECT player_id FROM players WHERE token_hash = ?', tokenHash,
      ).toArray()
      if (!players.length) return { status: 'session_required' }
      const playerId = String(players[0].player_id)
      const now = new Date().toISOString()
      this.ctx.storage.sql.exec('DELETE FROM players WHERE player_id = ?', playerId)
      // A deleted participant must not remain the displayed room winner.
      this.ctx.storage.sql.exec(`
        UPDATE room_meta SET revision = revision + 1, last_activity_at = ?,
          first_bingo_player_id = CASE WHEN first_bingo_player_id = ? THEN NULL ELSE first_bingo_player_id END,
          first_bingo_name = CASE WHEN first_bingo_player_id = ? THEN NULL ELSE first_bingo_name END,
          first_bingo_at = CASE WHEN first_bingo_player_id = ? THEN NULL ELSE first_bingo_at END
        WHERE id = 1
      `, now, playerId, playerId, playerId)
      return { status: 'removed', playerId }
    })
    if (result.status === 'removed') {
      // A removed session can no longer receive live room snapshots.
      for (const socket of this.ctx.getWebSockets(`player:${result.playerId}`)) {
        try { socket.close(1000, 'Bingo neu gestartet') } catch { /* Already closed. */ }
      }
      await this.broadcastSnapshot()
    }
    return result
  }

  async getSnapshot(): Promise<RoomSnapshot | null> {
    const results = this.ctx.storage.sql.exec(
      'SELECT room_code, created_at, revision, first_bingo_player_id, first_bingo_name, first_bingo_at FROM room_meta WHERE id = 1',
    ).toArray()
    if (!results.length) return null
    const room = results[0]
    const rows = this.ctx.storage.sql.exec(
      'SELECT player_id, name, card_id, card_version, card_snapshot_json, checked_mask, player_revision FROM players ORDER BY joined_at, player_id',
    ).toArray()
    const players: PublicRoomPlayer[] = rows.map(row => {
      const progress = getBingoProgress(Number(row.checked_mask))
      return {
        playerId: String(row.player_id), name: String(row.name), cardId: Number(row.card_id),
        cardVersion: String(row.card_version), card: JSON.parse(String(row.card_snapshot_json)) as string[],
        checkedIndices: [...progress.checkedIndices], playerRevision: Number(row.player_revision), completed: progress.completedSquares,
        completedLines: progress.completedLines, hasBingo: progress.hasBingo,
        online: this.ctx.getWebSockets(`player:${String(row.player_id)}`).some(socket => socket.readyState === 1),
      }
    })
    return {
      type: 'room.snapshot', roomCode: String(room.room_code),
      createdAt: String(room.created_at), revision: Number(room.revision),
      firstBingo: this.firstBingoFromRow(room), players,
    }
  }
}
