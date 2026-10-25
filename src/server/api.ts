import { cardCatalog, getCardById, getFlatSquares } from '../shared/cards'
import { generateRoomCode, normalizeRoomCode } from './room-code'
import {
  createSessionToken, extractSessionToken, hashSessionToken, parseCardId,
  parsePlayerName, sessionCookie,
} from './player-session'
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

/** Deny browser mutations from other origins; allow the local Vite proxy for dev. */
function validMutationOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return true // CLI requests have no Origin header.
  const url = new URL(request.url)
  const localProxy = (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
    (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173')
  return origin === url.origin || localProxy
}

async function getSessionPlayer(request: Request, room: RoomStub, roomCode: string) {
  const token = extractSessionToken(request.headers.get('Cookie'), roomCode)
  if (!token) return null
  return room.getPlayerByTokenHash(await hashSessionToken(token))
}

/** Same-origin API. The UI will consume room sessions in a later milestone. */
export async function handleRequest(request: Request, env: ApiBindings): Promise<Response> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

  if (url.pathname === '/api/health' && request.method === 'GET') return json({ status: 'ok' })

  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    if (!validMutationOrigin(request)) return error(403, 'FORBIDDEN_ORIGIN', 'Anfragen von anderen Websites sind nicht erlaubt.')
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = generateRoomCode()
      if (await env.BINGO_ROOMS.getByName(roomCode).initialize(roomCode)) {
        return json({ roomCode, roomUrl: `/r/${roomCode}` }, 201, { Location: `/r/${roomCode}` })
      }
    }
    return error(503, 'ROOM_CREATION_FAILED', 'Raum konnte nicht erstellt werden. Bitte erneut versuchen.')
  }

  const matched = /^\/api\/rooms\/([^/]+)(?:\/(join|me|events)(?:\/squares\/([^/]+))?)?$/.exec(url.pathname)
  if (matched) {
    const roomCode = normalizeRoomCode(matched[1])
    if (!roomCode) return error(400, 'INVALID_ROOM_CODE', 'Ungültiger Raumcode.')
    const room = env.BINGO_ROOMS.getByName(roomCode)
    const action = matched[2]

    // A browser WebSocket uses the same room-scoped HttpOnly cookie as REST.
    // The Durable Object authenticates it before accepting the connection.
    if (action === 'events' && request.method === 'GET') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return error(426, 'UPGRADE_REQUIRED', 'WebSocket-Verbindung erforderlich.')
      }
      if (!request.headers.has('Origin') || !validMutationOrigin(request)) {
        return error(403, 'FORBIDDEN_ORIGIN', 'Verbindung von dieser Website nicht erlaubt.')
      }
      return room.fetch(request)
    }

    if (!action && request.method === 'GET') {
      const snapshot = await room.getSnapshot()
      return snapshot ? json(snapshot) : error(404, 'ROOM_NOT_FOUND', 'Raum nicht gefunden.')
    }

    if (action === 'join' && request.method === 'POST') {
      if (!validMutationOrigin(request)) return error(403, 'FORBIDDEN_ORIGIN', 'Anfragen von anderen Websites sind nicht erlaubt.')
      // If an existing session is valid, never overwrite the card or create another player.
      const resumed = await getSessionPlayer(request, room, roomCode)
      if (resumed) {
        const snapshot = await room.getSnapshot()
        return json({ roomCode, player: resumed, revision: snapshot?.revision ?? 0, resumed: true })
      }
      const length = Number(request.headers.get('Content-Length') ?? '0')
      if (length > 1024) return error(413, 'PAYLOAD_TOO_LARGE', 'Anfrage ist zu groß.')
      let body: unknown
      try {
        const raw = await request.text()
        if (raw.length > 1024) return error(413, 'PAYLOAD_TOO_LARGE', 'Anfrage ist zu groß.')
        body = JSON.parse(raw)
      } catch {
        return error(400, 'INVALID_JSON', 'Ungültige JSON-Anfrage.')
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return error(400, 'INVALID_JSON', 'Ungültige JSON-Anfrage.')
      }
      const data = body as Record<string, unknown>
      const player = parsePlayerName(data.name)
      if (!player) return error(400, 'INVALID_NAME', 'Bitte einen Namen mit 2 bis 24 Zeichen eingeben.')
      const cardId = parseCardId(data.cardId)
      if (!cardId) return error(400, 'INVALID_CARD', 'Bitte eine gültige Karte (1–10) auswählen.')

      const token = createSessionToken()
      const result = await room.joinPlayer({
        playerId: crypto.randomUUID(), name: player.name, nameKey: player.nameKey, cardId,
        cardVersion: cardCatalog.cardVersion, cardSnapshot: [...getFlatSquares(getCardById(cardId))],
        tokenHash: await hashSessionToken(token),
      })
      if (result.status === 'room_not_found') return error(404, 'ROOM_NOT_FOUND', 'Raum nicht gefunden.')
      if (result.status === 'name_taken') return error(409, 'NAME_TAKEN', 'Dieser Name ist bereits vergeben.')
      const snapshot = await room.getSnapshot()
      return json({ roomCode, player: result.player, revision: snapshot?.revision ?? 0, resumed: false },
        201, { 'Set-Cookie': sessionCookie(roomCode, token, url.protocol === 'https:') })
    }

    if (action === 'me' && matched[3] !== undefined && request.method === 'PUT') {
      if (!validMutationOrigin(request)) return error(403, 'FORBIDDEN_ORIGIN', 'Anfragen von anderen Websites sind nicht erlaubt.')
      const indexText = matched[3]
      if (!/^(?:[0-9]|1[0-9]|2[0-4])$/.test(indexText)) {
        return error(400, 'INVALID_SQUARE', 'Feldnummer muss zwischen 0 und 24 liegen.')
      }
      const index = Number(indexText)
      const token = extractSessionToken(request.headers.get('Cookie'), roomCode)
      if (!token) return error(401, 'SESSION_REQUIRED', 'Keine gültige Spielsitzung für diesen Raum.')
      let body: unknown
      try {
        if (Number(request.headers.get('Content-Length') ?? '0') > 256) {
          return error(413, 'PAYLOAD_TOO_LARGE', 'Anfrage ist zu groß.')
        }
        const raw = await request.text()
        if (raw.length > 256) return error(413, 'PAYLOAD_TOO_LARGE', 'Anfrage ist zu groß.')
        body = JSON.parse(raw)
      } catch {
        return error(400, 'INVALID_JSON', 'Ungültige JSON-Anfrage.')
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return error(400, 'INVALID_JSON', 'Ungültige JSON-Anfrage.')
      }
      const data = body as Record<string, unknown>
      if (typeof data.checked !== 'boolean' ||
        typeof data.expectedPlayerRevision !== 'number' ||
        !Number.isSafeInteger(data.expectedPlayerRevision) || data.expectedPlayerRevision < 0) {
        return error(400, 'INVALID_SQUARE_UPDATE', 'checked und expectedPlayerRevision sind erforderlich.')
      }
      if (index === 12 && !data.checked) {
        return error(400, 'FREE_SQUARE_LOCKED', 'Das Bonusfeld kann nicht abgewählt werden.')
      }
      const result = await room.setPlayerSquare({
        tokenHash: await hashSessionToken(token), index, checked: data.checked,
        expectedPlayerRevision: data.expectedPlayerRevision,
      })
      if (result.status === 'room_not_found') return error(404, 'ROOM_NOT_FOUND', 'Raum nicht gefunden.')
      if (result.status === 'session_required') {
        return error(401, 'SESSION_REQUIRED', 'Keine gültige Spielsitzung für diesen Raum.')
      }
      if (result.status === 'stale') {
        return json({ error: { code: 'STALE_PLAYER_REVISION',
          message: 'Fortschritt hat sich geändert. Bitte aktualisieren und erneut versuchen.' },
          current: result.state }, 409)
      }
      return json({ ...result.state, status: result.status })
    }

    if (action === 'me' && matched[3] === undefined && request.method === 'GET') {
      const snapshot = await room.getSnapshot()
      if (!snapshot) return error(404, 'ROOM_NOT_FOUND', 'Raum nicht gefunden.')
      const player = await getSessionPlayer(request, room, roomCode)
      if (!player) return error(401, 'SESSION_REQUIRED', 'Keine gültige Spielsitzung für diesen Raum.')
      return json({ roomCode, player, revision: snapshot.revision })
    }
  }

  return error(404, 'NOT_FOUND', 'API-Endpunkt nicht gefunden.')
}
