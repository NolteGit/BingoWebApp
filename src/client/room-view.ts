import { getBingoProgress } from '../shared/bingo'
import type { ComparisonEntry } from './comparison'
import { checkedIndicesToMask, type OwnPlayer, type RoomSnapshot } from './room-api'

/** The same real players feed lobby and comparison. No demo data in room views. */
export function entriesFromRoom(room: RoomSnapshot): ComparisonEntry[] {
  return room.players.map(player => ({
    id: player.playerId,
    name: player.name,
    cardId: player.cardId,
    checkedMask: checkedIndicesToMask(player.checkedIndices),
    kind: 'player' as const,
    online: player.online,
  }))
}

export function maskForOwnPlayer(player: OwnPlayer | null): number {
  return checkedIndicesToMask(player?.checkedIndices ?? [12])
}

/** A compact status phrase; the counter itself is calculated from saved marks. */
export function playerStatus(player: OwnPlayer): string {
  const progress = getBingoProgress(maskForOwnPlayer(player))
  return `${progress.completedSquares}/25 Felder · ${progress.completedLines} Bingo`
}
