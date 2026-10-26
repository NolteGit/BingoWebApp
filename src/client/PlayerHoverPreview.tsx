import { useI18n } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import type { ComparisonEntry } from './comparison'
import { ReadOnlyBoard } from './ReadOnlyBoard'

interface PlayerHoverPreviewProps {
  entry: ComparisonEntry
  left: number
  top: number
  pinned: boolean
  onClose: () => void
}

/** One read-only, live snapshot preview for the lobby and the in-game overview. */
export function PlayerHoverPreview({ entry, left, top, pinned, onClose }: PlayerHoverPreviewProps) {
  const { t, cardName } = useI18n()
  const progress = getBingoProgress(entry.checkedMask)
  // A random card must use its saved server snapshot, never a new sample shuffle.
  const card = entry.card ?? getCardById(entry.cardId)

  return (
    <section id="player-card-hover-preview"
      class={`player-hover-card${pinned ? ' player-hover-card--pinned' : ''}`}
      style={{ left, top }} role="region" aria-label={t('playerCardView', { name: entry.name })}>
      <div class="player-hover-card__heading">
        <div>
          <h3>{entry.name}</h3>
          <p>{t('cardDetail', { card: cardName(card.id), squares: progress.completedSquares, lines: progress.completedLines })}</p>
        </div>
        {pinned && <button class="player-hover-card__close" type="button" onClick={onClose}
          aria-label={t('closePreview')} title={t('closePreview')}>×</button>}
      </div>
      <ReadOnlyBoard card={card} checkedMask={entry.checkedMask} />
      <p class="player-hover-card__hint">{t('readOnlyNote')}</p>
    </section>
  )
}
