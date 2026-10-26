import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import type { ComparisonEntry } from './comparison'
import { ReadOnlyBoard } from './ReadOnlyBoard'

interface PlayerCardDetailProps {
  entry: ComparisonEntry
}

/** Identical read-only card presentation in both player-preview contexts. */
export function PlayerCardDetail({ entry }: PlayerCardDetailProps) {
  const progress = getBingoProgress(entry.checkedMask)
  const card = entry.card ?? getCardById(entry.cardId)

  return (
    <section class="player-card-detail" aria-label={`Kartenansicht von ${entry.name}`}>
      <div class="compare-selected__heading">
        <h3>{entry.name} {entry.kind === 'demo' && <span>(Beispiel)</span>}</h3>
        <p>{card.name} · {progress.completedSquares}/25 Felder · {progress.completedLines}/12 Bingo-Linien</p>
      </div>
      <ReadOnlyBoard card={card} checkedMask={entry.checkedMask} />
      <p class="form-note">Nur ansehen – die Felder können hier nicht geändert werden.</p>
    </section>
  )
}
