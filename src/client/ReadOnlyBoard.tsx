import { BINGO_LINES, getBingoProgress, isSquareChecked } from '../shared/bingo'
import { FREE_SQUARE_INDEX, getFlatSquares, type BingoCard } from '../shared/cards'

interface ReadOnlyBoardProps {
  card: BingoCard
  checkedMask: number
}

/** Comparison only: ordinary divs, no click handlers and no ability to change another card. */
export function ReadOnlyBoard({ card, checkedMask }: ReadOnlyBoardProps) {
  const progress = getBingoProgress(checkedMask)
  const winningSquares = new Set(progress.completedLineIndices.flatMap((line) => BINGO_LINES[line]))

  return (
    <div class="board-preview compare-board" role="group" aria-label={`Schreibgeschützte Bingokarte: ${card.name}`}>
      {getFlatSquares(card).map((objective, index) => {
        const checked = isSquareChecked(checkedMask, index)
        const isFree = index === FREE_SQUARE_INDEX
        const winning = winningSquares.has(index)
        return (
          <div
            key={`${card.id}-${index}`}
            class={`play-square compare-square${checked ? ' play-square--checked' : ''}${isFree ? ' play-square--free' : ''}${winning ? ' play-square--winning' : ''}`}
          >
            {checked && <span class="play-square__mark" aria-hidden="true">✓</span>}
            <span class="play-square__text">{objective}</span>
            {isFree && <small>FREIFELD</small>}
            <span class="sr-only">{isFree ? ', Freifeld' : checked ? ', abgehakt' : ', offen'}</span>
          </div>
        )
      })}
    </div>
  )
}
