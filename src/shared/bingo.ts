/** Pure, deterministic bingo rules shared by the future client and server. */
import { FREE_SQUARE_INDEX, GRID_SIZE } from './cards'

export const SQUARE_COUNT = GRID_SIZE * GRID_SIZE
export const MAX_CHECKED_MASK = (1 << SQUARE_COUNT) - 1
export const INITIAL_CHECKED_MASK = 1 << FREE_SQUARE_INDEX

/** Five rows, five columns, then the two diagonals; zero-based, row-major indices. */
export const BINGO_LINES: ReadonlyArray<ReadonlyArray<number>> = Object.freeze([
  Object.freeze([0, 1, 2, 3, 4]),
  Object.freeze([5, 6, 7, 8, 9]),
  Object.freeze([10, 11, 12, 13, 14]),
  Object.freeze([15, 16, 17, 18, 19]),
  Object.freeze([20, 21, 22, 23, 24]),
  Object.freeze([0, 5, 10, 15, 20]),
  Object.freeze([1, 6, 11, 16, 21]),
  Object.freeze([2, 7, 12, 17, 22]),
  Object.freeze([3, 8, 13, 18, 23]),
  Object.freeze([4, 9, 14, 19, 24]),
  Object.freeze([0, 6, 12, 18, 24]),
  Object.freeze([4, 8, 12, 16, 20]),
])

export interface BingoProgress {
  readonly checkedMask: number
  readonly checkedIndices: ReadonlyArray<number>
  readonly completedSquares: number
  readonly completedLines: number
  /** Positions in BINGO_LINES, useful for highlighting winning lines. */
  readonly completedLineIndices: ReadonlyArray<number>
  readonly hasBingo: boolean
}

/** Throw on malformed state rather than silently dropping bits or unchecking the free center. */
export function assertValidCheckedMask(mask: number): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > MAX_CHECKED_MASK) {
    throw new RangeError(`checkedMask must be a 25-bit unsigned integer (0..${MAX_CHECKED_MASK})`)
  }
  if ((mask & INITIAL_CHECKED_MASK) === 0) {
    throw new RangeError('checkedMask must include the free Bonusfeld at index 12')
  }
}

function assertValidSquareIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= SQUARE_COUNT) {
    throw new RangeError('square index must be an integer between 0 and 24')
  }
}

export function createInitialCheckedMask(): number {
  return INITIAL_CHECKED_MASK
}

export function isSquareChecked(mask: number, index: number): boolean {
  assertValidCheckedMask(mask)
  assertValidSquareIndex(index)
  return (mask & (1 << index)) !== 0
}

/** Explicit set/unset action (not toggle): repeated requests are idempotent. */
export function setSquareChecked(mask: number, index: number, checked: boolean): number {
  assertValidCheckedMask(mask)
  assertValidSquareIndex(index)
  if (typeof checked !== 'boolean') {
    throw new TypeError('checked must be a boolean')
  }
  if (index === FREE_SQUARE_INDEX && !checked) {
    throw new RangeError('The free Bonusfeld cannot be unchecked')
  }
  return checked ? mask | (1 << index) : mask & ~(1 << index)
}

export function getCheckedIndices(mask: number): ReadonlyArray<number> {
  assertValidCheckedMask(mask)
  const indices: number[] = []
  for (let index = 0; index < SQUARE_COUNT; index += 1) {
    if ((mask & (1 << index)) !== 0) indices.push(index)
  }
  return indices
}

export function countCheckedSquares(mask: number): number {
  assertValidCheckedMask(mask)
  let remaining = mask
  let count = 0
  while (remaining !== 0) {
    remaining &= remaining - 1
    count += 1
  }
  return count
}

/** Returns the indices of all completed rows/columns/diagonals, including overlapping lines. */
export function getCompletedLineIndices(mask: number): ReadonlyArray<number> {
  assertValidCheckedMask(mask)
  const completed: number[] = []
  BINGO_LINES.forEach((line, lineIndex) => {
    if (line.every((index) => (mask & (1 << index)) !== 0)) completed.push(lineIndex)
  })
  return completed
}

export function getBingoProgress(mask: number): BingoProgress {
  const checkedIndices = getCheckedIndices(mask)
  const completedLineIndices = getCompletedLineIndices(mask)
  return {
    checkedMask: mask,
    checkedIndices,
    completedSquares: checkedIndices.length,
    completedLines: completedLineIndices.length,
    completedLineIndices,
    hasBingo: completedLineIndices.length > 0,
  }
}

/** Player-level 0 → >=1 transition; room-first winner is decided by the server later. */
export function isFirstBingoTransition(previousMask: number, nextMask: number): boolean {
  return getCompletedLineIndices(previousMask).length === 0 &&
    getCompletedLineIndices(nextMask).length > 0
}
