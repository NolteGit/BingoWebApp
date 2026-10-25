import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import type { ComparisonEntry } from './comparison'

interface PlayerListProps {
  entries: ReadonlyArray<ComparisonEntry>
  onPreview: (id: string, trigger: HTMLButtonElement) => void
}

/** A single compact player summary, shared by lobby and comparison drawer. */
export function PlayerList({ entries, onPreview }: PlayerListProps) {
  if (entries.length === 0) {
    return (
      <div class="empty-players">
        <strong>Noch keine Spieler</strong>
        <p>Die gemeinsame Übersicht wird mit dem Mehrspieler-Modus aktiviert.</p>
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
              class="player-summary"
              type="button"
              aria-label={`${entry.name}, ${getCardById(entry.cardId).name}, ${progress.completedSquares} von 25 Feldern, ${progress.completedLines} Bingo-Linien. Karte ansehen`}
              onClick={(event) => onPreview(entry.id, event.currentTarget)}
            >
              <span class="player-summary__top">
                <strong>{entry.name}</strong>
                <span>{getCardById(entry.cardId).name}</span>
              </span>
              <span class="player-summary__stats">
                <span>{progress.completedSquares}/25 Felder</span>
                <span>{progress.completedLines} Bingo</span>
                {entry.kind === 'demo' && <span class="player-summary__demo">Beispiel</span>}
              </span>
              <span class="player-summary__track" aria-hidden="true">
                <span style={{ width: `${progress.completedSquares / 25 * 100}%` }} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
