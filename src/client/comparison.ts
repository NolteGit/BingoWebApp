import { createInitialCheckedMask, getBingoProgress, setSquareChecked } from '../shared/bingo'
import type { LocalPlayer } from './lobby'

/** Frontend-only examples. Never send these to a room API or present them as live participants. */
export interface ComparisonEntry {
  readonly id: string
  readonly name: string
  readonly cardId: number
  readonly checkedMask: number
  readonly kind: 'self' | 'demo' | 'player'
}

function makeDemoMask(indices: ReadonlyArray<number>): number {
  return indices.reduce((mask, index) => setSquareChecked(mask, index, true), createInitialCheckedMask())
}

export const DEMO_ENTRIES: ReadonlyArray<ComparisonEntry> = Object.freeze([
  Object.freeze({
    id: 'demo-mira', name: 'Mira', cardId: 7, kind: 'demo' as const,
    checkedMask: makeDemoMask([0, 1, 2, 3, 4, 5, 8, 10, 18, 20]),
  }),
  Object.freeze({
    id: 'demo-tom', name: 'Tom', cardId: 3, kind: 'demo' as const,
    checkedMask: makeDemoMask([0, 3, 5, 9, 16, 19, 21]),
  }),
])

/** Own entry uses the real local checked state; the other entries are labeled examples. */
export function getComparisonEntries(player: LocalPlayer, checkedMask: number): ReadonlyArray<ComparisonEntry> {
  // Validate the state at this boundary, just as the future server snapshot must be validated.
  getBingoProgress(checkedMask)
  return [
    { id: 'self', name: player.name, cardId: player.cardId, checkedMask, kind: 'self' },
    ...DEMO_ENTRIES,
  ]
}
