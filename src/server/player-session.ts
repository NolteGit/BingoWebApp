/** Session credentials are never part of public room snapshots. */
export interface JoinPlayerInput {
  playerId: string
  name: string
  nameKey: string
  cardId: number
  cardVersion: string
  cardSnapshot: string[]
  tokenHash: string
}

export type JoinResult =
  | { status: 'created'; player: OwnPlayer }
  | { status: 'name_taken' }
  | { status: 'room_not_found' }

export interface OwnPlayer {
  playerId: string
  name: string
  cardId: number
  cardVersion: string
  checkedIndices: number[]
  playerRevision: number
  joinedAt: string
}

/** Canonicalize names consistently before checking uniqueness inside a room. */
export function parsePlayerName(value: unknown): { name: string; nameKey: string } | null {
  if (typeof value !== 'string') return null
  const name = value.normalize('NFC').trim().replace(/\s+/gu, ' ')
  const length = Array.from(name).length
  if (length < 2 || length > 24 || /[\p{Cc}\p{Cf}]/u.test(name)) return null
  return { name, nameKey: name.toLocaleLowerCase('de-AT') }
}

export function parseCardId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10
    ? value : null
}

const HEX_TOKEN = /^[a-f0-9]{64}$/
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60

export function sessionCookieName(roomCode: string): string {
  return `bingo_session_${roomCode}`
}

export function extractSessionToken(header: string | null, roomCode: string): string | null {
  if (!header) return null
  const name = sessionCookieName(roomCode)
  for (const item of header.split(';')) {
    const segment = item.trim()
    if (segment.startsWith(`${name}=`)) {
      const token = segment.slice(name.length + 1)
      return HEX_TOKEN.test(token) ? token : null
    }
  }
  return null
}

export function createSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashSessionToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token)
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function sessionCookie(roomCode: string, token: string, isHttps: boolean): string {
  return `${sessionCookieName(roomCode)}=${token}; Path=/api/rooms/${roomCode}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${isHttps ? '; Secure' : ''}`
}

/** Match the original cookie's Path/flags so browsers actually remove it. */
export function expiredSessionCookie(roomCode: string, isHttps: boolean): string {
  return `${sessionCookieName(roomCode)}=; Path=/api/rooms/${roomCode}; HttpOnly; SameSite=Lax; Max-Age=0${isHttps ? '; Secure' : ''}`
}
