import { describe, expect, it } from 'vitest'
import { handleRequest, type ApiBindings } from './api'
import type { PublicRoomPlayer, RoomSnapshot } from './room-model'
import type { JoinPlayerInput, OwnPlayer } from './player-session'

function fakeEnvironment(): ApiBindings {
  const rooms = new Map<string, { snapshot: RoomSnapshot; tokenPlayers: Map<string, OwnPlayer>; names: Set<string> }>()
  return {
    BINGO_ROOMS: {
      getByName(name) {
        return {
          async initialize(roomCode) {
            if (rooms.has(name)) return false
            rooms.set(name, { snapshot: {
              type: 'room.snapshot', roomCode, createdAt: '2026-10-25T00:00:00.000Z',
              revision: 0, firstBingo: null, players: [],
            }, tokenPlayers: new Map(), names: new Set() })
            return true
          },
          async getSnapshot() { return rooms.get(name)?.snapshot ?? null },
          async getPlayerByTokenHash(hash) { return rooms.get(name)?.tokenPlayers.get(hash) ?? null },
          async joinPlayer(input: JoinPlayerInput) {
            const room = rooms.get(name)
            if (!room) return { status: 'room_not_found' } as const
            if (room.names.has(input.nameKey)) return { status: 'name_taken' } as const
            const player: OwnPlayer = {
              playerId: input.playerId, name: input.name, cardId: input.cardId,
              cardVersion: input.cardVersion, checkedIndices: [12], joinedAt: '2026-10-25T00:01:00.000Z',
            }
            const summary: PublicRoomPlayer = {
              playerId: input.playerId, name: input.name, cardId: input.cardId,
              cardVersion: input.cardVersion, card: input.cardSnapshot, checkedIndices: [12],
              completed: 1, completedLines: 0, hasBingo: false, online: false,
            }
            room.names.add(input.nameKey)
            room.tokenPlayers.set(input.tokenHash, player)
            room.snapshot.players.push(summary)
            room.snapshot.revision += 1
            return { status: 'created', player } as const
          },
        }
      },
    },
    ASSETS: { fetch: async () => new Response('<html>UI</html>') },
  }
}

const req = (path: string, method = 'GET', options: { cookie?: string; body?: unknown; origin?: string } = {}) =>
  new Request(`http://localhost:8787${path}`, {
    method,
    headers: {
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.origin ? { Origin: options.origin } : {}),
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

async function createRoom(env: ApiBindings): Promise<string> {
  const created = await handleRequest(req('/api/rooms', 'POST'), env)
  expect(created.status).toBe(201)
  return (await created.json() as { roomCode: string }).roomCode
}

const join = (env: ApiBindings, code: string, name: unknown, cardId: unknown, cookie?: string) =>
  handleRequest(req(`/api/rooms/${code}/join`, 'POST', { body: { name, cardId }, cookie }), env)

describe('room and player session API', () => {
  it('creates independent rooms and reads them back', async () => {
    const env = fakeEnvironment()
    const first = await createRoom(env)
    const response = await handleRequest(req(`/api/rooms/${first}`), env)
    expect((await response.json() as RoomSnapshot).players).toEqual([])
    expect(await createRoom(env)).not.toBe(first)
  })

  it('joins a player, creates a private cookie, and resumes without duplicating or changing the card', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const response = await join(env, code, 'Mira', 7)
    expect(response.status).toBe(201)
    const sessionCookie = response.headers.get('Set-Cookie') ?? ''
    expect(sessionCookie).toContain('HttpOnly')
    expect(sessionCookie).toContain('SameSite=Lax')
    expect(sessionCookie).toContain(`Path=/api/rooms/${code}`)
    const cookieHeader = sessionCookie.split(';')[0]
    const body = await response.json() as { player: OwnPlayer; resumed: boolean }
    expect(body.resumed).toBe(false)
    expect(body.player.checkedIndices).toEqual([12])

    const snapshotResponse = await handleRequest(req(`/api/rooms/${code}`), env)
    const snapshotText = await snapshotResponse.text()
    const snapshot = JSON.parse(snapshotText) as RoomSnapshot
    expect(snapshot.players).toHaveLength(1)
    expect(snapshot.players[0].card).toHaveLength(25)
    expect(snapshot.players[0].card[12]).toBe('Bonusfeld')
    expect(snapshot.players[0].cardId).toBe(7)
    expect(snapshot.revision).toBe(1)
    expect(snapshotText).not.toContain('tokenHash')
    expect(snapshotText).not.toContain('bingo_session_')

    const me = await handleRequest(req(`/api/rooms/${code}/me`, 'GET', { cookie: cookieHeader }), env)
    expect(me.status).toBe(200)
    expect((await me.json() as { player: OwnPlayer }).player.playerId).toBe(body.player.playerId)

    // Joining with an existing cookie must not create a second player or change card.
    const resumed = await join(env, code, 'Something else', 2, cookieHeader)
    expect(resumed.status).toBe(200)
    expect((await resumed.json() as { player: OwnPlayer; resumed: boolean }).resumed).toBe(true)
    const latest = await handleRequest(req(`/api/rooms/${code}`), env)
    expect((await latest.json() as RoomSnapshot).players).toHaveLength(1)
  })

  it('prevents case-insensitive duplicate names and allows independent cards', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    expect((await join(env, code, 'Mira', 1)).status).toBe(201)
    const duplicate = await join(env, code, '  MIRA ', 2)
    expect(duplicate.status).toBe(409)
    expect((await duplicate.json() as { error: { code: string } }).error.code).toBe('NAME_TAKEN')
    expect((await join(env, code, 'Tom', 1)).status).toBe(201)
    const snapshot = await handleRequest(req(`/api/rooms/${code}`), env)
    expect((await snapshot.json() as RoomSnapshot).players.map(player => player.cardId)).toEqual([1, 1])
  })

  it('rejects unknown rooms, invalid input and unauthenticated /me', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    expect((await join(env, 'AAAAAAAA', 'Mira', 1)).status).toBe(404)
    expect((await join(env, code, 'M', 1)).status).toBe(400)
    expect((await join(env, code, 'Mira', 11)).status).toBe(400)
    expect((await join(env, code, 'Mira', '1')).status).toBe(400)
    expect((await handleRequest(req(`/api/rooms/${code}/me`), env)).status).toBe(401)
    expect((await handleRequest(req('/api/rooms/XXXXXXX0'), env)).status).toBe(400)
  })

  it('isolates sessions by room and rejects a forged cookie', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const second = await createRoom(env)
    const response = await join(env, code, 'Mira', 2)
    const cookie = (response.headers.get('Set-Cookie') ?? '').split(';')[0]
    expect((await handleRequest(req(`/api/rooms/${second}/me`, 'GET', { cookie }), env)).status).toBe(401)
    const forged = `bingo_session_${code}=${'a'.repeat(64)}`
    expect((await handleRequest(req(`/api/rooms/${code}/me`, 'GET', { cookie: forged }), env)).status).toBe(401)
  })

  it('blocks cross-origin joins and leaves asset serving alone', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const blocked = await handleRequest(req(`/api/rooms/${code}/join`, 'POST', {
      body: { name: 'Mira', cardId: 1 }, origin: 'https://evil.example',
    }), env)
    expect(blocked.status).toBe(403)
    const allowed = await handleRequest(req(`/api/rooms/${code}/join`, 'POST', {
      body: { name: 'Mira', cardId: 1 }, origin: 'http://localhost:5173',
    }), env)
    expect(allowed.status).toBe(201)
    expect(await (await handleRequest(req('/'), env)).text()).toContain('UI')
  })
})
