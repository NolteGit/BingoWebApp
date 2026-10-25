import { describe, expect, it } from 'vitest'
import { acceptIncomingSnapshot, parseLiveSnapshot, roomWebSocketUrl } from './room-live'
import type { RoomSnapshot } from './room-api'

const snapshot = (revision: number, roomCode = 'ABCDEFGH'): RoomSnapshot => ({
  type: 'room.snapshot', roomCode, revision,
  createdAt: '2026-10-25T00:00:00Z', firstBingo: null, players: [],
})

describe('live room protocol', () => {
  it('uses ws on localhost and wss on HTTPS', () => {
    expect(roomWebSocketUrl('http://localhost:5173', 'ABCDEFGH')).toBe('ws://localhost:5173/api/rooms/ABCDEFGH/events')
    expect(roomWebSocketUrl('https://bingo.example', 'ABCDEFGH')).toBe('wss://bingo.example/api/rooms/ABCDEFGH/events')
  })
  it('discards messages for other rooms and invalid JSON', () => {
    expect(parseLiveSnapshot('bad JSON', 'ABCDEFGH')).toBeNull()
    expect(parseLiveSnapshot(JSON.stringify(snapshot(2, 'ABCDEFGJ')), 'ABCDEFGH')).toBeNull()
    expect(parseLiveSnapshot(JSON.stringify(snapshot(2)), 'ABCDEFGH')?.revision).toBe(2)
  })
  it('accepts equal revision for presence but rejects older state', () => {
    expect(acceptIncomingSnapshot(null, snapshot(1))).toBe(true)
    expect(acceptIncomingSnapshot(snapshot(2), snapshot(2))).toBe(true)
    expect(acceptIncomingSnapshot(snapshot(2), snapshot(1))).toBe(false)
    expect(acceptIncomingSnapshot(snapshot(2), snapshot(4, 'ABCDEFGJ'))).toBe(false)
  })
})
