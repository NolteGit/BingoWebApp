import { useI18n } from './i18n'
import type { BingoCard } from '../shared/cards'
import { FREE_SQUARE_INDEX, getFlatSquares } from '../shared/cards'

interface CardPreviewProps {
  card: BingoCard
  titleId: string
}

/** Shared read-only card until clickable squares are introduced in the next task. */
export function CardPreview({ card, titleId }: CardPreviewProps) {
  const { t, cardName } = useI18n()
  return (
    <section class="preview-area" aria-labelledby={titleId}>
      <div class="preview-caption">
        <h2 id={titleId}>{cardName(card.id)}</h2>
        <span>{t('previewSubtitle')}</span>
      </div>
      <div class="board-preview" role="grid" aria-label={t('preview', { card: cardName(card.id) })}>
        {getFlatSquares(card).map((objective, index) => (
          <div
            key={`${card.id}-${index}`}
            class={`preview-square${index === FREE_SQUARE_INDEX ? ' preview-square--free' : ''}`}
            role="gridcell"
            aria-label={index === FREE_SQUARE_INDEX ? `${objective}, ${t('freeFieldAria')}` : objective}
          >
            <span>{objective}</span>
            {index === FREE_SQUARE_INDEX && <small>{t('freeField')}</small>}
          </div>
        ))}
      </div>
    </section>
  )
}
