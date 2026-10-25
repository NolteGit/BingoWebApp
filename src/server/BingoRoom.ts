import { DurableObject } from 'cloudflare:workers'
import type { RoomSnapshot } from './room-model'
import type { ApiBindings } from './api'

/** One durable SQLite database per room. Only room metadata is exposed in Step 7. */
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
  }

  /** Returns false if this code already owns a room; never overwrites stored state. */
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

  async getSnapshot(): Promise<RoomSnapshot | null> {
    const result = this.ctx.storage.sql.exec(
      'SELECT room_code, created_at, revision FROM room_meta WHERE id = 1',
    ).toArray()
    if (result.length === 0) return null
    const room = result[0]
    return {
      type: 'room.snapshot',
      roomCode: String(room.room_code),
      createdAt: String(room.created_at),
      revision: Number(room.revision),
      firstBingo: null,
      players: [],
    }
  }
}
