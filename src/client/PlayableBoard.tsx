import { BINGO_LINES, getBingoProgress, isSquareChecked } from '../shared/bingo'
import { FREE_SQUARE_INDEX, getFlatSquares, type BingoCard } from '../shared/cards'

interface PlayableBoardProps {
  card: BingoCard
  checkedMask: number
  onToggleSquare: (index: number) => void
  disabled?: boolean
}

/** Presentational board. The parent owns checked state (later supplied by the server). */
export function PlayableBoard({ card, checkedMask, onToggleSquare, disabled = false }: PlayableBoardProps) {
  const progress = getBingoProgress(checkedMask)
  const winningSquares = new Set(
    progress.completedLineIndices.flatMap((lineIndex) => BINGO_LINES[lineIndex]),
  )

  return (
    <section class="play-area" aria-label={`Bingokarte: ${card.name}`}>
      <p class="sr-only" id="play-board-help">Ein Feld anklicken zum Abhaken, erneut anklicken zum Entfernen. Das Bonusfeld bleibt aktiv.</p>

      <div class="progress-header">
        <span><strong>{progress.completedSquares}/25</strong> Felder</span>
        <span><strong>{progress.completedLines}/12</strong> Bingo-Linien</span>
      </div>
      <progress
        class="game-progress-bar"
        max={25}
        value={progress.completedSquares}
        aria-label="Abgehakte Felder"
      />

      <div class="bingo-message" role="status" aria-live="polite" aria-atomic="true">
        {progress.hasBingo && (
          <strong>🎉 BINGO! {progress.completedLines} {progress.completedLines === 1 ? 'Linie' : 'Linien'} geschafft!</strong>
        )}
      </div>

      <div class="play-board-scroll">
        <div class="board-preview board-play" role="group" aria-label={`Deine Bingokarte: ${card.name}`} aria-describedby="play-board-help">
          {getFlatSquares(card).map((objective, index) => {
            const checked = isSquareChecked(checkedMask, index)
            const isFree = index === FREE_SQUARE_INDEX
            const winning = winningSquares.has(index)
            const row = Math.floor(index / 5) + 1
            const column = (index % 5) + 1
            return (
              <button
                key={`${card.id}-${index}`}
                type="button"
                class={`play-square${checked ? ' play-square--checked' : ''}${isFree ? ' play-square--free' : ''}${winning ? ' play-square--winning' : ''}`}
                aria-pressed={checked}
                aria-label={`Zeile ${row}, Spalte ${column}: ${objective}, ${isFree ? 'Freifeld' : checked ? 'abgehakt' : 'offen'}`}
                disabled={isFree || disabled}
                onClick={() => onToggleSquare(index)}
              >
                <span class="play-square__mark" aria-hidden="true">{checked ? '✓' : ''}</span>
                <span class="play-square__text">{objective}</span>
                {isFree && <small>FREIFELD</small>}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
