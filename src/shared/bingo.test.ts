import { describe, expect, it } from 'vitest'
import { FREE_SQUARE_INDEX, getCardById } from './cards'
import {
  assertValidCheckedMask,
  BINGO_LINES,
  countCheckedSquares,
  createInitialCheckedMask,
  getBingoProgress,
  getCheckedIndices,
  getCompletedLineIndices,
  INITIAL_CHECKED_MASK,
  isFirstBingoTransition,
  isSquareChecked,
  MAX_CHECKED_MASK,
  setSquareChecked,
} from './bingo'

function markSquares(indices: ReadonlyArray<number>, initialMask = createInitialCheckedMask()): number {
  return indices.reduce((mask, index) => setSquareChecked(mask, index, true), initialMask)
}

describe('25-square WvW bingo rules', () => {
  it('starts with the center checked and zero bingo lines', () => {
    const mask = createInitialCheckedMask()
    expect(mask).toBe(1 << FREE_SQUARE_INDEX)
    expect(mask).toBe(INITIAL_CHECKED_MASK)
    expect(getBingoProgress(mask)).toEqual({
      checkedMask: mask,
      checkedIndices: [12],
      completedSquares: 1,
      completedLines: 0,
      completedLineIndices: [],
      hasBingo: false,
    })
    expect(isSquareChecked(mask, 12)).toBe(true)
    expect(isSquareChecked(mask, 0)).toBe(false)
  })

  it('defines exactly the five rows, five columns and two diagonals in canonical order', () => {
    expect(BINGO_LINES).toHaveLength(12)
    expect(BINGO_LINES[0]).toEqual([0, 1, 2, 3, 4])
    expect(BINGO_LINES[5]).toEqual([0, 5, 10, 15, 20])
    expect(BINGO_LINES[10]).toEqual([0, 6, 12, 18, 24])
    expect(BINGO_LINES[11]).toEqual([4, 8, 12, 16, 20])
    expect(Object.isFrozen(BINGO_LINES)).toBe(true)
    expect(BINGO_LINES.every(Object.isFrozen)).toBe(true)
    expect(new Set(BINGO_LINES.map((line) => line.join(','))).size).toBe(12)
    for (const line of BINGO_LINES) {
      expect(line).toHaveLength(5)
      expect(new Set(line).size).toBe(5)
    }
  })

  it.each(BINGO_LINES.map((line, index) => [index, line] as const))(
    'recognizes completed bingo line %i even when it crosses the free center',
    (lineIndex, line) => {
      const mask = markSquares(line)
      const completed = getCompletedLineIndices(mask)
      expect(completed).toContain(lineIndex)
      expect(getBingoProgress(mask).hasBingo).toBe(true)
      expect(isFirstBingoTransition(INITIAL_CHECKED_MASK, mask)).toBe(true)
    },
  )

  it('has 12 lines after all squares are checked', () => {
    const mask = markSquares(Array.from({ length: 25 }, (_, i) => i))
    expect(mask).toBe(MAX_CHECKED_MASK)
    expect(countCheckedSquares(mask)).toBe(25)
    expect(getCheckedIndices(mask)).toEqual(Array.from({ length: 25 }, (_, i) => i))
    expect(getCompletedLineIndices(mask)).toEqual(Array.from({ length: 12 }, (_, i) => i))
    expect(getBingoProgress(mask).completedLines).toBe(12)
  })

  it('counts overlapping lines separately', () => {
    const mask = markSquares([...BINGO_LINES[0], ...BINGO_LINES[5]])
    expect(getCompletedLineIndices(mask)).toEqual([0, 5])
    expect(countCheckedSquares(mask)).toBe(10) // 5 + 5 - shared corner + free center
  })

  it('reverses a check without changing unrelated completed lines', () => {
    const rowAndColumn = markSquares([...BINGO_LINES[0], ...BINGO_LINES[5]])
    const afterUndo = setSquareChecked(rowAndColumn, 1, false)
    expect(getCompletedLineIndices(afterUndo)).toEqual([5])
    expect(isSquareChecked(afterUndo, 1)).toBe(false)
    expect(isSquareChecked(afterUndo, 12)).toBe(true)
    expect(setSquareChecked(afterUndo, 1, true)).toBe(rowAndColumn)
  })

  it('sets are idempotent and do not toggle on repeated events', () => {
    const once = setSquareChecked(INITIAL_CHECKED_MASK, 0, true)
    expect(setSquareChecked(once, 0, true)).toBe(once)
    const undone = setSquareChecked(once, 0, false)
    expect(setSquareChecked(undone, 0, false)).toBe(undone)
    expect(undone).toBe(INITIAL_CHECKED_MASK)
    expect(setSquareChecked(undone, 12, true)).toBe(undone)
    expect(() => setSquareChecked(undone, 12, false)).toThrow(/Bonusfeld/)
  })

  it('detects only the first 0 → bingo transition for a player', () => {
    const fourOfFive = markSquares([0, 1, 2, 3])
    const winningMask = setSquareChecked(fourOfFive, 4, true)
    expect(isFirstBingoTransition(fourOfFive, winningMask)).toBe(true)
    expect(isFirstBingoTransition(winningMask, winningMask)).toBe(false)
    expect(isFirstBingoTransition(winningMask, setSquareChecked(winningMask, 5, true))).toBe(false)
    expect(isFirstBingoTransition(winningMask, fourOfFive)).toBe(false)
  })

  it('keeps players independent even when they choose the same preset', () => {
    expect(getCardById(7).id).toBe(7)
    const firstPlayerMask = setSquareChecked(createInitialCheckedMask(), 0, true)
    const secondPlayerMask = createInitialCheckedMask()
    expect(getCheckedIndices(firstPlayerMask)).toEqual([0, 12])
    expect(getCheckedIndices(secondPlayerMask)).toEqual([12])
  })

  it.each([-1, 25, 1.5, NaN, Infinity, -Infinity])('rejects invalid square index %s', (index) => {
    expect(() => isSquareChecked(INITIAL_CHECKED_MASK, index)).toThrow(RangeError)
    expect(() => setSquareChecked(INITIAL_CHECKED_MASK, index, true)).toThrow(RangeError)
  })

  it.each([-1, 0, MAX_CHECKED_MASK + 1, 1.5, NaN, Infinity, -Infinity])(
    'rejects missing-center, out-of-range or malformed mask %s',
    (mask) => {
      expect(() => assertValidCheckedMask(mask)).toThrow(RangeError)
      expect(() => getBingoProgress(mask)).toThrow(RangeError)
      expect(() => setSquareChecked(mask, 0, true)).toThrow(RangeError)
    },
  )

  it('rejects a non-boolean checked argument at the runtime boundary', () => {
    expect(() => setSquareChecked(INITIAL_CHECKED_MASK, 0, 'true' as unknown as boolean)).toThrow(TypeError)
    expect(() => setSquareChecked(INITIAL_CHECKED_MASK, 0, 1 as unknown as boolean)).toThrow(TypeError)
  })
})
