import type { ComparisonEntry } from './comparison'
import { PlayerList } from './PlayerList'

interface PlayerOverviewProps {
  entries: ReadonlyArray<ComparisonEntry>
}

/** One summary-only view for the lobby and active-game dialog. */
export function PlayerOverview({ entries }: PlayerOverviewProps) {
  return (
    <div class="player-overview">
      <PlayerList entries={entries} />
    </div>
  )
}
