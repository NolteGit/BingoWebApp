import originalCards from '../../data/cards.json'
import { describe, expect, it } from 'vitest'
import {
  cardCatalog,
  FREE_SQUARE_INDEX,
  getCardById,
  getFlatSquares,
  parseCardCatalog,
  presetCards,
} from './cards'

function cloneSource() {
  return structuredClone(originalCards)
}

describe('canonical WvW card catalog', () => {
  it('loads all ten cards in their original order and freezes their data', () => {
    expect(cardCatalog.cardVersion).toBe('wvw-v1')
    expect(presetCards.map((card) => card.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const card of presetCards) {
      expect(card.rows).toHaveLength(5)
      expect(getFlatSquares(card)).toHaveLength(25)
      expect(getFlatSquares(card)[FREE_SQUARE_INDEX]).toBe('Bonusfeld')
      expect(Object.isFrozen(card.rows)).toBe(true)
      expect(card.rows.every((row) => Object.isFrozen(row))).toBe(true)
    }
  })

  it('preserves objectives and square positions, not a randomized layout', () => {
    expect(getCardById(1).rows[0][0]).toBe('Jemand lacht im Discord')
    expect(getCardById(1).rows[0][4]).toBe('Gegner taucht plötzlich hinter der Gruppe auf')
    expect(getCardById(10).rows[4][4]).toBe('Alle im Discord lachen')
    expect(() => getCardById(11)).toThrow(RangeError)
  })

  it('rejects wrong dimensions and empty objectives', () => {
    const missingColumn = cloneSource()
    missingColumn.cards[0].rows[0].pop()
    expect(() => parseCardCatalog(missingColumn)).toThrow(/contain 5 squares/)

    const emptyLabel = cloneSource()
    emptyLabel.cards[0].rows[0][0] = '  '
    expect(() => parseCardCatalog(emptyLabel)).toThrow(/empty square/)
  })

  it('rejects a missing or duplicated free square', () => {
    const withoutCenter = cloneSource()
    withoutCenter.cards[0].rows[2][2] = 'Normal field'
    expect(() => parseCardCatalog(withoutCenter)).toThrow(/Bonusfeld/)

    const additionalCenter = cloneSource()
    additionalCenter.cards[1].rows[0][0] = 'Bonusfeld'
    expect(() => parseCardCatalog(additionalCenter)).toThrow(/Bonusfeld/)
  })

  it('rejects duplicate IDs and unsupported metadata', () => {
    const duplicateId = cloneSource()
    duplicateId.cards[1].id = 1
    expect(() => parseCardCatalog(duplicateId)).toThrow(/duplicate card ID/)

    const wrongIndex = cloneSource()
    wrongIndex.freeSquareIndex = 11
    expect(() => parseCardCatalog(wrongIndex)).toThrow(/index 12/)
  })
})
