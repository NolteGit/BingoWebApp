import { generateRoomCode, normalizeRoomCode } from './room-code'
import type { RoomStub } from './room-model'

export interface ApiBindings {
  BINGO_ROOMS: { getByName(name: string): RoomStub }
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const json = (body: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })

const error = (status: number, code: string, message: string): Response =>
  json({ error: { code, message } }, status)

/** Same-origin API. The UI still runs as a local prototype in this milestone. */
export async function handleRequest(request: Request, env: ApiBindings): Promise<Response> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({ status: 'ok' })
  }

  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    // Disallow cross-origin browser mutations. Requests without Origin (e.g. curl) are allowed.
    const origin = request.headers.get('Origin')
    // Vite proxies /api from localhost:5173 to the local Worker on :8787.
    const localProxy = (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173')
    if (origin && origin !== url.origin && !localProxy) {
      return error(403, 'FORBIDDEN_ORIGIN', 'Anfragen von anderen Websites sind nicht erlaubt.')
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = generateRoomCode()
      const room = env.BINGO_ROOMS.getByName(roomCode)
      if (await room.initialize(roomCode)) {
        return json({ roomCode, roomUrl: `/r/${roomCode}` }, 201, { Location: `/r/${roomCode}` })
      }
    }
    return error(503, 'ROOM_CREATION_FAILED', 'Raum konnte nicht erstellt werden. Bitte erneut versuchen.')
  }

  const matched = /^\/api\/rooms\/([^/]+)$/.exec(url.pathname)
  if (matched && request.method === 'GET') {
    const roomCode = normalizeRoomCode(matched[1])
    if (!roomCode) return error(400, 'INVALID_ROOM_CODE', 'Ungültiger Raumcode.')
    const room = await env.BINGO_ROOMS.getByName(roomCode).getSnapshot()
    if (!room) return error(404, 'ROOM_NOT_FOUND', 'Raum nicht gefunden.')
    return json(room)
  }

  return error(404, 'NOT_FOUND', 'API-Endpunkt nicht gefunden.')
}
