/** Uppercase, reasonably unambiguous invite codes; no browser-provided room IDs. */
export const ROOM_CODE_LENGTH = 8
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

export function normalizeRoomCode(input: string): string | null {
  const value = input.toUpperCase()
  return CODE_PATTERN.test(value) ? value : null
}

export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}
