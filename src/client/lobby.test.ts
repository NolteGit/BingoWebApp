import { describe, expect, it } from 'vitest'
import { createLocalPlayer, MAX_PLAYER_NAME_LENGTH } from './lobby'

describe('local player selection', () => {
  it('creates an immutable local selection for any available card', () => {
    const player = createLocalPlayer('  Mira   die   Erste  ', 7)
    expect(player).toEqual({ name: 'Mira die Erste', cardId: 7 })
    expect(Object.isFrozen(player)).toBe(true)
    expect(createLocalPlayer('Alex', 1).cardId).toBe(1)
    expect(createLocalPlayer('Alex', 10).cardId).toBe(10)
  })

  it('rejects blank names, overly long names, and invalid presets', () => {
    expect(() => createLocalPlayer('   ', 1)).toThrow()
    expect(() => createLocalPlayer('x'.repeat(MAX_PLAYER_NAME_LENGTH + 1), 1)).toThrow()
    expect(() => createLocalPlayer('Mira', 0)).toThrow()
    expect(() => createLocalPlayer('Mira', 11)).toThrow()
    expect(() => createLocalPlayer('Mira', 1.5)).toThrow()
  })
})
