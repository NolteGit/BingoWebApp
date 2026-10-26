import './print-card.css'
import { useI18n } from './i18n'
import { FREE_SQUARE_INDEX, getFlatSquares, type BingoCard } from '../shared/cards'

interface PrintableCardProps {
  name: string
  card: BingoCard
}

/** A clean, unmarked paper sheet. Never receives or renders checked-square state. */
export function PrintableCard({ name, card }: PrintableCardProps) {
  const { cardName } = useI18n()
  return (
    <section class="print-sheet" aria-label="GW2 Bingo">
      <header class="print-sheet__header">
        <div>
          <h1>GW2 Bingo</h1>
          <p class="print-sheet__name">{name}</p>
        </div>
        <span class="print-sheet__card-name">{cardName(card.id)}</span>
      </header>
      <div class="print-sheet__grid">
        {getFlatSquares(card).map((task, index) => (
          <div key={index} class={`print-sheet__square${index === FREE_SQUARE_INDEX ? ' print-sheet__square--free' : ''}`}>
            {task}
          </div>
        ))}
      </div>
    </section>
  )
}
