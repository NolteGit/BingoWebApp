import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import type { ComparisonEntry } from './comparison'

interface PlayerListProps {
  entries: ReadonlyArray<ComparisonEntry>
  onPreview: (id: string, trigger: HTMLButtonElement) => void
  selectedId?: string | null
  detailId?: string
}

/** A single compact player summary, shared by lobby and comparison drawer. */
export function PlayerList({ entries, onPreview, selectedId = null, detailId }: PlayerListProps) {
  if (entries.length === 0) {
    return (
      <div class="empty-players">
        <strong>Noch keine Spieler</strong>
        <p>Sobald jemand beitritt, erscheint hier sein Fortschritt.</p>
      </div>
    )
  }

  return (
    <ul class="player-list" aria-label="Spieler und Fortschritt">
      {entries.map((entry) => {
        const progress = getBingoProgress(entry.checkedMask)
        return (
          <li key={entry.id}>
            <button
              class={`player-summary${selectedId === entry.id ? ' player-summary--selected' : ''}`}
              aria-expanded={selectedId === entry.id}
              aria-controls={selectedId === entry.id ? detailId : undefined}
              type="button"
              aria-label={`${entry.name}, ${getCardById(entry.cardId).name}, ${progress.completedSquares} von 25 Feldern, ${progress.completedLines} Bingo-Linien. Karte ansehen`}
              onClick={(event) => onPreview(entry.id, event.currentTarget)}
            >
              <span class="player-summary__line">
                <strong>{entry.name}{entry.kind === 'demo' && <small class="player-summary__demo">Demo</small>}{entry.kind === 'player' && <small class="player-summary__demo">{entry.online ? ' · online' : ' · offline'}</small>}</strong>
                <span class="player-summary__card">{getCardById(entry.cardId).name}</span>
                <span class="player-summary__points">{progress.completedSquares}/25 · {progress.completedLines} Bingo</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
