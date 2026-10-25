import type { BingoCard } from '../shared/cards'
import { FREE_SQUARE_INDEX, getFlatSquares } from '../shared/cards'

interface CardPreviewProps {
  card: BingoCard
  titleId: string
}

/** Shared read-only card until clickable squares are introduced in the next task. */
export function CardPreview({ card, titleId }: CardPreviewProps) {
  return (
    <section class="preview-area" aria-labelledby={titleId}>
      <div class="preview-caption">
        <h2 id={titleId}>{card.name}</h2>
        <span>5 × 5 · Bonusfeld in der Mitte</span>
      </div>
      <div class="board-preview" role="grid" aria-label={`Vorschau: ${card.name}`}>
        {getFlatSquares(card).map((objective, index) => (
          <div
            key={`${card.id}-${index}`}
            class={`preview-square${index === FREE_SQUARE_INDEX ? ' preview-square--free' : ''}`}
            role="gridcell"
            aria-label={index === FREE_SQUARE_INDEX ? `${objective}, Freifeld` : objective}
          >
            <span>{objective}</span>
            {index === FREE_SQUARE_INDEX && <small>FREIFELD</small>}
          </div>
        ))}
      </div>
    </section>
  )
}
