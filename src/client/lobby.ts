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
    throw new TypeError('Spielername muss Text sein.')
  }

  const name = rawName.trim().replace(/\s+/g, ' ')
  if (!name || name.length > MAX_PLAYER_NAME_LENGTH) {
    throw new RangeError(`Spielername muss 1 bis ${MAX_PLAYER_NAME_LENGTH} Zeichen haben.`)
  }

  // This throws for any nonexistent preset, including non-integers.
  getCardById(cardId)
  return Object.freeze({ name, cardId })
}
