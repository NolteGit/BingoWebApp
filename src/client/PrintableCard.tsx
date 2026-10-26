import './print-card.css'
import { useI18n } from './i18n'
import { FREE_SQUARE_INDEX, getFlatSquares, type BingoCard } from '../shared/cards'

interface PrintableCardProps {
  card: BingoCard
}

/** Anonymous, unmarked A4 paper card. The player's saved state never reaches this component. */
export function PrintableCard({ card }: PrintableCardProps) {
  const { t, cardName } = useI18n()
  return (
    <section class="print-sheet" aria-label="WvW Bingo">
      <div class="print-sheet__corners" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <header class="print-sheet__header">
        <div class="print-sheet__ribbon"><h1>WvW-BINGO</h1></div>
        <p class="print-sheet__card-name">• {cardName(card.id)} •</p>
      </header>
      <div class="print-sheet__grid">
        {getFlatSquares(card).map((task, index) => (
          <div key={index} class={`print-sheet__square${index === FREE_SQUARE_INDEX ? ' print-sheet__square--free' : ''}`}>
            <span class="print-sheet__task">{task}</span>
            {index === FREE_SQUARE_INDEX && <span class="print-sheet__free-note">{t('freeField')}</span>}
          </div>
        ))}
      </div>
      <footer class="print-sheet__rules">
        <h2>{t('printRulesTitle')}</h2>
        <div class="print-sheet__rule"><span class="print-sheet__rule-icon" aria-hidden="true">★</span><span>{t('printRule1')}</span></div>
        <div class="print-sheet__rule"><span class="print-sheet__rule-icon" aria-hidden="true">✓</span><span>{t('rule2')}</span></div>
        <div class="print-sheet__rule"><span class="print-sheet__rule-icon" aria-hidden="true">!</span><span>{t('rule3')}</span></div>
        <div class="print-sheet__rule"><span class="print-sheet__rule-icon" aria-hidden="true">◆</span><span>{t('rule4Start')} <strong>{t('printBingoCall')}</strong></span></div>
      </footer>
    </section>
  )
}
