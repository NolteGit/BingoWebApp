import { useI18n } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import type { ComparisonEntry } from './comparison'

interface PlayerListProps {
  entries: ReadonlyArray<ComparisonEntry>
}

/** Read-only player summaries, shared by the lobby and the in-game overlay. */
export function PlayerList({ entries }: PlayerListProps) {
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
      {entries.map(entry => {
        const progress = getBingoProgress(entry.checkedMask)
        return (
          <li key={entry.id} class="player-summary">
            <span class="player-summary__line">
              <span class="player-summary__identity">
                {entry.kind === 'player' && <span class={`player-summary__presence${entry.online ? ' player-summary__presence--online' : ''}`}
                  title={entry.online ? t('online') : t('offline')}
                  aria-label={entry.online ? t('online') : t('offline')} />}
                <strong>{entry.name}</strong>
                {entry.kind === 'demo' && <small class="player-summary__demo">Demo</small>}
              </span>
              <span class="player-summary__card">{cardName(entry.cardId)}</span>
              <span class="player-summary__points">{progress.completedSquares}/25 · {t('bingoCount', { count: progress.completedLines })}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
