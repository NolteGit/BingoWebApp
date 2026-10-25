import { DurableObject } from 'cloudflare:workers'
import { createInitialCheckedMask, getBingoProgress } from '../shared/bingo'
import type { ApiBindings } from './api'
import type { PublicRoomPlayer, RoomSnapshot } from './room-model'
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
        joined_at TEXT NOT NULL,
        last_modified_at TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE
      )
    `)
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
      joinedAt: String(row.joined_at),
    }
  }

  /** A valid bearer cookie can only resolve to its own player in this room. */
  async getPlayerByTokenHash(tokenHash: string): Promise<OwnPlayer | null> {
    const rows = this.ctx.storage.sql.exec(
      'SELECT player_id, name, card_id, card_version, checked_mask, joined_at FROM players WHERE token_hash = ?',
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
    return { status: 'created', player: {
      playerId: input.playerId, name: input.name, cardId: input.cardId,
      cardVersion: input.cardVersion, checkedIndices: [12], joinedAt: now,
    } }
  }

  async getSnapshot(): Promise<RoomSnapshot | null> {
    const results = this.ctx.storage.sql.exec(
      'SELECT room_code, created_at, revision FROM room_meta WHERE id = 1',
    ).toArray()
    if (!results.length) return null
    const room = results[0]
    const rows = this.ctx.storage.sql.exec(
      'SELECT player_id, name, card_id, card_version, card_snapshot_json, checked_mask FROM players ORDER BY joined_at, player_id',
    ).toArray()
    const players: PublicRoomPlayer[] = rows.map(row => {
      const progress = getBingoProgress(Number(row.checked_mask))
      return {
        playerId: String(row.player_id), name: String(row.name), cardId: Number(row.card_id),
        cardVersion: String(row.card_version), card: JSON.parse(String(row.card_snapshot_json)) as string[],
        checkedIndices: [...progress.checkedIndices], completed: progress.completedSquares,
        completedLines: progress.completedLines, hasBingo: progress.hasBingo,
        online: false, // Presence will be derived from WebSockets in a later step.
      }
    })
    return {
      type: 'room.snapshot', roomCode: String(room.room_code),
      createdAt: String(room.created_at), revision: Number(room.revision),
      firstBingo: null, players,
    }
  }
}
