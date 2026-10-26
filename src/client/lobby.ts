import { getCardById } from '../shared/cards'

export const MAX_PLAYER_NAME_LENGTH = 24

/** Frontend-only identity used until the server creates authenticated player sessions. */
export interface LocalPlayer {
  readonly name: string
  readonly cardId: number
}

/** Validate the join form without inventing a room, player ID, or backend session. */
export function createLocalPlayer(rawName: string, cardId: number): LocalPlayer {
  if (typeof rawName !== 'string') {
    throw new TypeError('Player name must be text.')
  }

  const name = rawName.trim().replace(/\s+/g, ' ')
  if (!name || name.length > MAX_PLAYER_NAME_LENGTH) {
    throw new RangeError(`Player name must contain 1 to ${MAX_PLAYER_NAME_LENGTH} characters.`)
  }

  // This throws for any nonexistent preset, including non-integers.
  getCardById(cardId)
  return Object.freeze({ name, cardId })
}
