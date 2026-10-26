import type { ComparisonEntry } from './comparison'
import { PlayerList } from './PlayerList'

interface PlayerOverviewProps {
  entries: ReadonlyArray<ComparisonEntry>
}

/** One player list with read-only preview for both lobby and active-game dialog. */
export function PlayerOverview({ entries }: PlayerOverviewProps) {
  return (
    <div class="player-overview">
      <PlayerList entries={entries} />
    </div>
  )
}
