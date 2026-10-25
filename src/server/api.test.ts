import { describe, expect, it } from 'vitest'
import { handleRequest, type ApiBindings } from './api'
import type { RoomSnapshot } from './room-model'

function fakeEnvironment(): ApiBindings {
  const rooms = new Map<string, RoomSnapshot>()
  return {
    BINGO_ROOMS: {
      getByName(name) {
        return {
          async initialize(roomCode) {
            if (rooms.has(name)) return false
            rooms.set(name, {
              type: 'room.snapshot', roomCode, createdAt: '2026-10-25T00:00:00.000Z',
              revision: 0, firstBingo: null, players: [],
            })
            return true
          },
          async getSnapshot() { return rooms.get(name) ?? null },
        }
      },
    },
    ASSETS: { fetch: async () => new Response('<html>UI</html>') },
  }
}

const req = (path: string, method = 'GET', headers?: HeadersInit) =>
  new Request(`http://localhost:8787${path}`, { method, headers })

describe('room API routing', () => {
  it('creates an independent room and can read it back', async () => {
    const env = fakeEnvironment()
    const created = await handleRequest(req('/api/rooms', 'POST'), env)
    expect(created.status).toBe(201)
    const payload = await created.json() as { roomCode: string; roomUrl: string }
    expect(payload.roomUrl).toBe(`/r/${payload.roomCode}`)
    const response = await handleRequest(req(`/api/rooms/${payload.roomCode}`), env)
    expect(response.status).toBe(200)
    const snapshot = await response.json() as RoomSnapshot
    expect(snapshot.roomCode).toBe(payload.roomCode)
    expect(snapshot.revision).toBe(0)
    expect(snapshot.players).toEqual([])
    const second = await handleRequest(req('/api/rooms', 'POST'), env)
    const secondCode = (await second.json() as { roomCode: string }).roomCode
    expect(secondCode).not.toBe(payload.roomCode)
  })

  it('rejects unknown and invalid rooms without initializing them', async () => {
    const env = fakeEnvironment()
    expect((await handleRequest(req('/api/rooms/XXXXXXX0'), env)).status).toBe(400)
    const result = await handleRequest(req('/api/rooms/AAAAAAAA'), env)
    expect(result.status).toBe(404)
    expect((await result.json() as { error: { code: string } }).error.code).toBe('ROOM_NOT_FOUND')
  })

  it('rejects a cross-origin creation request and keeps non-API assets working', async () => {
    const env = fakeEnvironment()
    const blocked = await handleRequest(req('/api/rooms', 'POST', { Origin: 'https://other.example' }), env)
    expect(blocked.status).toBe(403)
    expect((await handleRequest(req('/api/rooms', 'POST', { Origin: 'http://localhost:5173' }), env)).status).toBe(201)
    const asset = await handleRequest(req('/'), env)
    expect(await asset.text()).toContain('UI')
  })

  it('returns an explicit not-found error for unsupported API routes', async () => {
    const result = await handleRequest(req('/api/rooms/AAAAAAAA/join', 'POST'), fakeEnvironment())
    expect(result.status).toBe(404)
  })
})
