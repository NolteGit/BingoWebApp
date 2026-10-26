import originalCards from '../../data/cards.json'
import originalTasks from '../../data/tasks.json'
import { describe, expect, it } from 'vitest'
import {
  cardCatalog,
  cardFromSnapshot,
  generateRandomCard,
  parseTaskPool,
  RANDOM_CARD_ID,
  taskPool,
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
    expect(cardCatalog.cardVersion).toBe('wvw-v2')
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
    expect(getCardById(RANDOM_CARD_ID).name).toBe('Random card')
    expect(() => getCardById(12)).toThrow(RangeError)
  })

  it('rejects wrong dimensions and empty objectives', () => {
    const missingColumn = cloneSource()
    missingColumn.cards[0].rows[0].pop()
    expect(() => parseCardCatalog(missingColumn)).toThrow(/contain 5 squares/)

    const emptyLabel = cloneSource()
    emptyLabel.cards[0].rows[0][0] = 't99999'
    expect(() => parseCardCatalog(emptyLabel)).toThrow(/unknown task ID/)
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


describe('editable task library and random cards', () => {
  it('contains one unique entry per task and at least 24 tasks', () => {
    expect(taskPool.size).toBeGreaterThanOrEqual(24)
    expect(new Set(taskPool.values()).size).toBe(taskPool.size)
  })

  it('changing task text updates all presets referencing its ID', () => {
    const changed = structuredClone(originalTasks)
    changed.tasks.t001 = 'Ein neuer gemeinsamer Text'
    const rebuilt = parseCardCatalog(originalCards, changed)
    expect(rebuilt.cards[0].rows[0][0]).toBe('Ein neuer gemeinsamer Text')
    expect(cardCatalog.cards[0].rows[0][0]).toBe('Jemand lacht im Discord')
  })

  it('rejects duplicate task labels and unknown references', () => {
    const changed = structuredClone(originalTasks)
    changed.tasks.t002 = changed.tasks.t001
    expect(() => parseTaskPool(changed)).toThrow(/duplicate task text/)
    const missing = structuredClone(originalTasks)
    delete (missing.tasks as Record<string, string>).t001
    expect(() => parseCardCatalog(originalCards, missing)).toThrow(/unknown task ID/)
  })

  it('creates unique tasks, exactly 25 squares, and one fixed center', () => {
    const first = generateRandomCard(() => 0)
    const second = generateRandomCard(max => max - 1)
    for (const card of [first, second]) {
      const squares = getFlatSquares(card)
      expect(card.id).toBe(RANDOM_CARD_ID)
      expect(squares).toHaveLength(25)
      expect(squares[12]).toBe('Bonusfeld')
      expect(squares.filter(t => t === 'Bonusfeld')).toHaveLength(1)
      expect(new Set(squares.filter(t => t !== 'Bonusfeld')).size).toBe(24)
      expect(cardFromSnapshot(11, squares).rows).toEqual(card.rows)
    }
    expect(getFlatSquares(first)).not.toEqual(getFlatSquares(second))
  })

  it('rejects broken stored card snapshots', () => {
    const squares = [...getFlatSquares(getCardById(1))]
    squares[12] = 'Fehler'
    expect(() => cardFromSnapshot(1, squares)).toThrow(/Bonusfeld/)
  })
})
