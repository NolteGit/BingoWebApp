import { describe, expect, it } from 'vitest'
import { handleRequest, type ApiBindings } from './api'
import { getBingoProgress, isFirstBingoTransition, setSquareChecked } from '../shared/bingo'
import type { SquareUpdateInput, SquareUpdateResult } from './room-model'
import type { PublicRoomPlayer, RoomSnapshot } from './room-model'
import type { JoinPlayerInput, OwnPlayer } from './player-session'

function fakeEnvironment(): ApiBindings {
  const rooms = new Map<string, { snapshot: RoomSnapshot; tokenPlayers: Map<string, OwnPlayer>; names: Set<string> }>()
  return {
    BINGO_ROOMS: {
      getByName(name) {
        return {
          async fetch(_request: Request) { return new Response('Unsupported in mock', { status: 501 }) },
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
          async setPlayerSquare(input: SquareUpdateInput): Promise<SquareUpdateResult> {
            const room = rooms.get(name)
            if (!room) return { status: 'room_not_found' }
            const owner = room.tokenPlayers.get(input.tokenHash)
            if (!owner) return { status: 'session_required' }
            const player = room.snapshot.players.find(item => item.playerId === owner.playerId)!
            const oldMask = player.checkedIndices.reduce((mask, index) => mask | (1 << index), 0)
            const newMask = setSquareChecked(oldMask, input.index, input.checked)
            const formatState = () => ({
              playerId: owner.playerId, checkedIndices: [...player.checkedIndices],
              completed: player.completed, completedLines: player.completedLines,
              hasBingo: player.hasBingo, playerRevision: owner.playerRevision,
              revision: room.snapshot.revision, firstBingo: room.snapshot.firstBingo,
            })
            if (newMask === oldMask) return { status: 'unchanged', state: formatState() }
            if (owner.playerRevision !== input.expectedPlayerRevision) {
              return { status: 'stale', state: formatState() }
            }
            const progress = getBingoProgress(newMask)
            owner.checkedIndices = [...progress.checkedIndices]
            owner.playerRevision += 1
            player.checkedIndices = [...progress.checkedIndices]
            player.playerRevision += 1
            player.completed = progress.completedSquares
            player.completedLines = progress.completedLines
            player.hasBingo = progress.hasBingo
            room.snapshot.revision += 1
            if (!room.snapshot.firstBingo && isFirstBingoTransition(oldMask, newMask)) {
              room.snapshot.firstBingo = { playerId: owner.playerId, name: owner.name,
                at: '2026-10-25T00:02:00.000Z' }
            }
            return { status: 'updated', state: formatState() }
          },
          async joinPlayer(input: JoinPlayerInput) {
            const room = rooms.get(name)
            if (!room) return { status: 'room_not_found' } as const
            if (room.names.has(input.nameKey)) return { status: 'name_taken' } as const
            const player: OwnPlayer = {
              playerId: input.playerId, name: input.name, cardId: input.cardId,
              cardVersion: input.cardVersion, checkedIndices: [12], playerRevision: 0, joinedAt: '2026-10-25T00:01:00.000Z',
            }
            const summary: PublicRoomPlayer = {
              playerId: input.playerId, name: input.name, cardId: input.cardId,
              cardVersion: input.cardVersion, card: input.cardSnapshot, checkedIndices: [12], playerRevision: 0,
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
    ROOM_CREATE_LIMITER: { limit: async () => ({ success: true }) },
    ROOM_JOIN_LIMITER: { limit: async () => ({ success: true }) },
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

describe('WebSocket entry guard', () => {
  it('requires an Upgrade header before routing to the room', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const response = await handleRequest(req(`/api/rooms/${code}/events`), env)
    expect(response.status).toBe(426)
  })

  it('rejects other browser origins before WebSocket upgrade', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const response = await handleRequest(new Request(`http://localhost:8787/api/rooms/${code}/events`, {
      headers: { Upgrade: 'websocket', Origin: 'https://evil.example' },
    }), env)
    expect(response.status).toBe(403)
  })

  it('routes trusted upgrades to the room Durable Object', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const response = await handleRequest(new Request(`http://localhost:8787/api/rooms/${code}/events`, {
      headers: { Upgrade: 'websocket', Origin: 'http://localhost:5173' },
    }), env)
    expect(response.status).toBe(501) // Mock Durable Object, not a real WebSocket.
  })
})

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


const square = (env: ApiBindings, code: string, index: number | string,
  checked: unknown, expectedPlayerRevision: unknown, cookie?: string, origin?: string) =>
  handleRequest(req(`/api/rooms/${code}/me/squares/${index}`, 'PUT', {
    cookie, origin, body: { checked, expectedPlayerRevision },
  }), env)

const cookieOf = (response: Response) => (response.headers.get('Set-Cookie') ?? '').split(';')[0]

describe('persistent square update contract', () => {
  it('stores explicit marks and undo in the public snapshot and /me', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const response = await join(env, code, 'Mira', 7)
    const cookie = cookieOf(response)
    const marked = await square(env, code, 4, true, 0, cookie)
    expect(marked.status).toBe(200)
    const result = await marked.json() as { checkedIndices: number[]; revision: number; playerRevision: number; status: string }
    expect(result).toMatchObject({ checkedIndices: [4, 12], revision: 2, playerRevision: 1, status: 'updated' })
    const own = await handleRequest(req(`/api/rooms/${code}/me`, 'GET', { cookie }), env)
    expect((await own.json() as { player: OwnPlayer }).player).toMatchObject({ checkedIndices: [4, 12], playerRevision: 1 })
    const snapshot = await handleRequest(req(`/api/rooms/${code}`), env)
    expect((await snapshot.json() as RoomSnapshot).players[0]).toMatchObject({ completed: 2, checkedIndices: [4, 12] })
    const undone = await square(env, code, 4, false, 1, cookie)
    expect((await undone.json() as { checkedIndices: number[]; playerRevision: number })).toMatchObject({ checkedIndices: [12], playerRevision: 2 })
  })

  it('is idempotent even if the successful response was lost', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const cookie = cookieOf(await join(env, code, 'Mira', 3))
    const first = await square(env, code, 8, true, 0, cookie)
    const again = await square(env, code, 8, true, 0, cookie)
    expect((await first.json() as { status: string }).status).toBe('updated')
    expect((await again.json() as { status: string; playerRevision: number; revision: number })).toMatchObject({
      status: 'unchanged', revision: 2, playerRevision: 1,
    })
  })

  it('rejects stale revisions instead of overwriting another tab', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const cookie = cookieOf(await join(env, code, 'Mira', 3))
    await square(env, code, 8, true, 0, cookie)
    const stale = await square(env, code, 8, false, 0, cookie)
    expect(stale.status).toBe(409)
    const body = await stale.json() as { error: { code: string }; current: { checkedIndices: number[] } }
    expect(body.error.code).toBe('STALE_PLAYER_REVISION')
    expect(body.current.checkedIndices).toEqual([8, 12])
    expect((await square(env, code, 8, false, 1, cookie)).status).toBe(200)
  })

  it('rejects invalid writes, cross-site requests, forged and other-room cookies', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const other = await createRoom(env)
    const cookie = cookieOf(await join(env, code, 'Mira', 3))
    expect((await square(env, code, 12, false, 0, cookie)).status).toBe(400)
    expect((await square(env, code, 25, true, 0, cookie)).status).toBe(400)
    expect((await square(env, code, '01', true, 0, cookie)).status).toBe(400)
    expect((await square(env, code, 2, 'true', 0, cookie)).status).toBe(400)
    expect((await square(env, code, 2, true, -1, cookie)).status).toBe(400)
    expect((await square(env, code, 2, true, 0)).status).toBe(401)
    expect((await square(env, other, 2, true, 0, cookie)).status).toBe(401)
    expect((await square(env, code, 2, true, 0, cookie, 'https://evil.example')).status).toBe(403)
  })

  it('records first bingo exactly once even after undo and another winner', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const mira = cookieOf(await join(env, code, 'Mira', 7))
    const tom = cookieOf(await join(env, code, 'Tom', 7))
    for (let i = 0; i < 5; i++) await square(env, code, i, true, i, mira)
    const snapshot = await handleRequest(req(`/api/rooms/${code}`), env)
    const first = (await snapshot.json() as RoomSnapshot).firstBingo
    expect(first?.name).toBe('Mira')
    await square(env, code, 0, false, 5, mira)
    for (let i = 0; i < 5; i++) await square(env, code, i, true, i, tom)
    const later = await handleRequest(req(`/api/rooms/${code}`), env)
    expect((await later.json() as RoomSnapshot).firstBingo).toEqual(first)
  })
})


describe('public launch rate limits and request guards', () => {
  it('does not create a room when the creator is rate-limited', async () => {
    const env = fakeEnvironment()
    const keys: string[] = []
    env.ROOM_CREATE_LIMITER = { limit: async ({ key }) => {
      keys.push(key)
      return { success: false }
    } }
    const response = await handleRequest(new Request('http://localhost:8787/api/rooms', {
      method: 'POST', headers: { 'CF-Connecting-IP': '198.51.100.3' },
    }), env)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect((await response.json() as {error: {code: string}}).error.code).toBe('RATE_LIMITED')
    expect(keys).toEqual(['198.51.100.3'])
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('prevents new joins when limited but allows a valid session to resume', async () => {
    const env = fakeEnvironment()
    const code = await createRoom(env)
    const initial = await join(env, code, 'Mira', 7)
    const cookie = cookieOf(initial)
    env.ROOM_JOIN_LIMITER = { limit: async () => ({ success: false }) }
    expect((await join(env, code, 'Tom', 8)).status).toBe(429)
    const resumed = await join(env, code, 'Ignored', 1, cookie)
    expect(resumed.status).toBe(200)
    expect((await resumed.json() as {resumed:boolean}).resumed).toBe(true)
    const room = await handleRequest(req(`/api/rooms/${code}`), env)
    expect((await room.json() as RoomSnapshot).players).toHaveLength(1)
  })

  it('blocks cross-site Fetch Metadata even when Origin is missing', async () => {
    const env = fakeEnvironment()
    const denied = await handleRequest(new Request('http://localhost:8787/api/rooms', {
      method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site' },
    }), env)
    expect(denied.status).toBe(403)
  })
})
