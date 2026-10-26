import { useI18n } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import type { ComparisonEntry } from './comparison'
import { ReadOnlyBoard } from './ReadOnlyBoard'

interface PlayerCardDetailProps {
  entry: ComparisonEntry
}

/** Identical read-only card presentation in both player-preview contexts. */
export function PlayerCardDetail({ entry }: PlayerCardDetailProps) {
  const { t, cardName } = useI18n()
  const progress = getBingoProgress(entry.checkedMask)
  const card = entry.card ?? getCardById(entry.cardId)

  return (
    <section class="player-card-detail" aria-label={t('playerCardView', {name: entry.name})}>
      <div class="compare-selected__heading">
        <h3>{entry.name} {entry.kind === 'demo' && <span>{t('example')}</span>}</h3>
        <p>{t('cardDetail', {card: cardName(card.id), squares: progress.completedSquares, lines: progress.completedLines})}</p>
      </div>
      <ReadOnlyBoard card={card} checkedMask={entry.checkedMask} />
      <p class="form-note">{t('readOnlyNote')}</p>
    </section>
  )
}
