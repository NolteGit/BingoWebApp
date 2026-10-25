import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'

export interface RoomPlayer {
  playerId: string
  name: string
  cardId: number
  cardVersion: string
  card: string[]
  checkedIndices: number[]
  playerRevision: number
  completed: number
  completedLines: number
  hasBingo: boolean
  online: boolean
}

export interface RoomSnapshot {
  type: 'room.snapshot'
  roomCode: string
  createdAt: string
  revision: number
  firstBingo: { playerId: string; name: string; at: string } | null
  players: RoomPlayer[]
}

export interface OwnPlayer {
  playerId: string
  name: string
  cardId: number
  cardVersion: string
  checkedIndices: number[]
  playerRevision: number
  joinedAt: string
}

export interface SessionResponse {
  roomCode: string
  player: OwnPlayer
  revision: number
  resumed?: boolean
}

export interface SquareResponse {
  playerId: string
  checkedIndices: number[]
  playerRevision: number
  revision: number
  completed: number
  completedLines: number
  hasBingo: boolean
  firstBingo: RoomSnapshot['firstBingo']
  status: 'updated' | 'unchanged'
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** All calls use same-origin cookies. Session credentials never enter JavaScript. */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store',
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Keine Verbindung zum Server. Bitte erneut versuchen.')
  }
  let result: unknown
  try { result = await response.json() } catch {
    throw new ApiError(response.status, 'INVALID_RESPONSE', 'Ungültige Serverantwort.')
  }
  if (!response.ok) {
    const payload = result as { error?: { code?: string; message?: string } }
    throw new ApiError(response.status, payload?.error?.code ?? 'REQUEST_FAILED',
      payload?.error?.message ?? 'Anfrage fehlgeschlagen.')
  }
  return result as T
}

export function createRoom(): Promise<{ roomCode: string; roomUrl: string }> {
  return requestJson('/api/rooms', { method: 'POST' })
}
export function getRoom(code: string): Promise<RoomSnapshot> {
  return requestJson(`/api/rooms/${encodeURIComponent(code)}`)
}
export function getOwnSession(code: string): Promise<SessionResponse> {
  return requestJson(`/api/rooms/${encodeURIComponent(code)}/me`)
}
export function joinRoom(code: string, name: string, cardId: number): Promise<SessionResponse> {
  return requestJson(`/api/rooms/${encodeURIComponent(code)}/join`, {
    method: 'POST', body: JSON.stringify({ name, cardId }),
  })
}
export function deleteOwnBingo(code: string): Promise<{ status: 'deleted'; roomCode: string; playerId: string; room: RoomSnapshot }> {
  return requestJson(`/api/rooms/${encodeURIComponent(code)}/me`, { method: 'DELETE' })
}
export function saveSquare(code: string, index: number, checked: boolean, expectedPlayerRevision: number): Promise<SquareResponse> {
  return requestJson(`/api/rooms/${encodeURIComponent(code)}/me/squares/${index}`, {
    method: 'PUT', body: JSON.stringify({ checked, expectedPlayerRevision }),
  })
}

export function roomCodeFromPath(path: string): string | null {
  const match = /^\/r\/([A-Z0-9]{8})\/?$/i.exec(path)
  return match ? match[1].toUpperCase() : null
}

/** Validate server indices before converting to the shared bingo bitmask. */
export function checkedIndicesToMask(indices: readonly number[]): number {
  if (!Array.isArray(indices) || !indices.includes(12)) throw new Error('Ungültige gespeicherte Bingokarte.')
  let mask = createInitialCheckedMask()
  for (const index of indices) {
    mask = setSquareChecked(mask, index, true)
  }
  return mask
}

/** Don't let malformed or unknown card IDs reach the player overview. */
export function assertRoomSnapshot(snapshot: RoomSnapshot): RoomSnapshot {
  if (snapshot.type !== 'room.snapshot' || !Array.isArray(snapshot.players)) {
    throw new Error('Ungültige Raumdaten.')
  }
  for (const player of snapshot.players) {
    getCardById(player.cardId)
    checkedIndicesToMask(player.checkedIndices)
  }
  return snapshot
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler. Bitte erneut versuchen.'
}
