import { useI18n } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import type { ComparisonEntry } from './comparison'

interface PlayerListProps {
  entries: ReadonlyArray<ComparisonEntry>
  onPreview: (id: string, trigger: HTMLButtonElement) => void
  selectedId?: string | null
  detailId?: string
}

/** A single compact player summary, shared by lobby and comparison drawer. */
export function PlayerList({ entries, onPreview, selectedId = null, detailId }: PlayerListProps) {
  const { t, cardName } = useI18n()
  if (entries.length === 0) {
    return (
      <div class="empty-players">
        <strong>{t('emptyPlayers')}</strong>
        <p>{t('emptyPlayersNote')}</p>
      </div>
    )
  }

  return (
    <ul class="player-list" aria-label={t('playersAndProgress')}>
      {entries.map((entry) => {
        const progress = getBingoProgress(entry.checkedMask)
        return (
          <li key={entry.id}>
            <button
              class={`player-summary${selectedId === entry.id ? ' player-summary--selected' : ''}`}
              aria-expanded={selectedId === entry.id}
              aria-controls={selectedId === entry.id ? detailId : undefined}
              type="button"
              aria-label={t('playerSummaryAria', {name: entry.name, card: cardName(entry.cardId), squares: progress.completedSquares, lines: progress.completedLines})}
              onClick={(event) => onPreview(entry.id, event.currentTarget)}
            >
              <span class="player-summary__line">
                <strong>{entry.name}{entry.kind === 'demo' && <small class="player-summary__demo">Demo</small>}{entry.kind === 'player' && <small class="player-summary__demo">{` · ${entry.online ? t('online') : t('offline')}`}</small>}</strong>
                <span class="player-summary__card">{cardName(entry.cardId)}</span>
                <span class="player-summary__points">{progress.completedSquares}/25 · {t('bingoCount', {count: progress.completedLines})}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
