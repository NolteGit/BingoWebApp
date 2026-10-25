import { useEffect, useRef } from 'preact/hooks'
import { getBingoProgress } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { ReadOnlyBoard } from './ReadOnlyBoard'
import type { ComparisonEntry } from './comparison'

interface ComparisonDrawerProps {
  open: boolean
  entries: ReadonlyArray<ComparisonEntry>
  selectedId: string
  onSelect: (id: string) => void
  onDismiss: () => void
  onAfterClose: () => void
}

/** Native modal dialog handles focus trapping; Escape is an explicit cancel, not a destructive action. */
export function ComparisonDrawer({ open, entries, selectedId, onSelect, onDismiss, onAfterClose }: ComparisonDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0]
  const progress = selected ? getBingoProgress(selected.checkedMask) : null

  return (
    <dialog
      ref={dialogRef}
      class="comparison-dialog"
      aria-labelledby="compare-title"
      aria-describedby="compare-note"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClose={onAfterClose}
    >
      <div class="dialog-topline">
        <div>
          <p class="eyebrow">Lokale Vorschau</p>
          <h2 id="compare-title">Spielervergleich</h2>
        </div>
        <button class="secondary-button" type="button" onClick={onDismiss}>Schließen</button>
      </div>
      <p class="demo-disclaimer" id="compare-note">
        <strong>Keine Live-Spieler:</strong> Nur dein eigener Fortschritt ist echt. Mira und Tom sind feste Beispieldaten, um den Vergleich zu testen.
      </p>
      <div class="compare-layout">
        <nav class="compare-players" aria-label="Spieler auswählen">
          {entries.map((entry) => {
            const rowProgress = getBingoProgress(entry.checkedMask)
            return (
              <button
                key={entry.id}
                type="button"
                class={`compare-player${selected?.id === entry.id ? ' compare-player--active' : ''}`}
                aria-pressed={selected?.id === entry.id}
                onClick={() => onSelect(entry.id)}
              >
                <span class="compare-player__top"><strong>{entry.name}</strong><span>{entry.kind === 'self' ? 'Du · lokal' : 'Beispiel'}</span></span>
                <span class="compare-player__stats">{getCardById(entry.cardId).name} · {rowProgress.completedSquares}/25 Felder · {rowProgress.completedLines} Bingo</span>
                <span class="compare-player__bar" aria-hidden="true"><span style={{ width: `${rowProgress.completedSquares / 25 * 100}%` }} /></span>
              </button>
            )
          })}
        </nav>
        {selected && progress && (
          <section class="compare-selected" aria-labelledby="selected-compare-title">
            <div class="compare-selected__heading">
              <h3 id="selected-compare-title">{selected.name} <span>({selected.kind === 'self' ? 'deine Karte' : 'Beispiel'})</span></h3>
              <p>{getCardById(selected.cardId).name} · {progress.completedSquares}/25 Felder · {progress.completedLines}/12 Linien</p>
            </div>
            <ReadOnlyBoard card={getCardById(selected.cardId)} checkedMask={selected.checkedMask} />
            <p class="form-note">Nur ansehen – hier können keine Felder geändert werden.</p>
          </section>
        )}
      </div>
    </dialog>
  )
}
