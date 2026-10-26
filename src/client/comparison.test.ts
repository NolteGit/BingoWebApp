import { describe, expect, it } from 'vitest'
import { getBingoProgress, createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getComparisonEntries } from './comparison'

const player = { name: 'Alex', cardId: 2 }

describe('local comparison data', () => {
  it('contains the actual current player and exactly two explicitly labeled demos', () => {
    const entries = getComparisonEntries(player, createInitialCheckedMask())
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ id: 'self', name: 'Alex', cardId: 2, kind: 'self' })
    expect(entries.slice(1).map((entry) => entry.kind)).toEqual(['demo', 'demo'])
    expect(entries.slice(1).map((entry) => entry.cardId)).toEqual([7, 3])
  })

  it('shows the actual player marks after updates without changing the demo masks', () => {
    const before = getComparisonEntries(player, createInitialCheckedMask())
    const after = getComparisonEntries(player, setSquareChecked(createInitialCheckedMask(), 0, true))
    expect(getBingoProgress(before[0].checkedMask).completedSquares).toBe(1)
    expect(getBingoProgress(after[0].checkedMask).completedSquares).toBe(2)
    expect(after[1].checkedMask).toBe(before[1].checkedMask)
    expect(after[2].checkedMask).toBe(before[2].checkedMask)
    expect(getBingoProgress(after[1].checkedMask).completedLines).toBeGreaterThan(0)
  })

  it('rejects a malformed checked mask rather than displaying impossible totals', () => {
    expect(() => getComparisonEntries(player, 0)).toThrow()
  })
})
