import { translate, type Locale } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import { cardFromSnapshot } from '../shared/cards'
import type { ComparisonEntry } from './comparison'
import { checkedIndicesToMask, type OwnPlayer, type RoomSnapshot } from './room-api'

/** The same real players feed lobby and comparison. No demo data in room views. */
export function entriesFromRoom(room: RoomSnapshot): ComparisonEntry[] {
  return room.players.map(player => ({
    id: player.playerId,
    name: player.name,
    cardId: player.cardId,
    card: cardFromSnapshot(player.cardId, player.card),
    checkedMask: checkedIndicesToMask(player.checkedIndices),
    kind: 'player' as const,
    online: player.online,
  }))
}

export function maskForOwnPlayer(player: OwnPlayer | null): number {
  return checkedIndicesToMask(player?.checkedIndices ?? [12])
}

/** A compact status phrase; the counter itself is calculated from saved marks. */
export function playerStatus(player: OwnPlayer, locale: Locale = 'de'): string {
  const progress = getBingoProgress(maskForOwnPlayer(player))
  return `${progress.completedSquares}/25 ${translate(locale, 'fields')} · ${translate(locale, 'bingoCount', {count: progress.completedLines})}`
}
