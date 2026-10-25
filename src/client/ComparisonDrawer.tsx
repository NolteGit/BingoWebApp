import { useEffect, useRef } from 'preact/hooks'
import type { ComparisonEntry } from './comparison'
import { PlayerOverview } from './PlayerOverview'

interface ComparisonDrawerProps {
  open: boolean
  entries: ReadonlyArray<ComparisonEntry>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDismiss: () => void
  onAfterClose: () => void
  note?: string
}

/** The list remains visible while a player's card expands alongside or below it. */
export function ComparisonDrawer({ open, entries, selectedId, onSelect, onDismiss, onAfterClose, note }: ComparisonDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

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
        <h2 id="compare-title">Spielervergleich</h2>
        <button class="secondary-button" type="button" onClick={onDismiss}>Schließen</button>
      </div>
      <p class="comparison-note" id="compare-note">
        {note ?? 'Nur dein eigener Fortschritt ist echt. Mira und Tom sind Beispieldaten.'}
      </p>
      <PlayerOverview
        entries={entries}
        selectedId={selectedId}
        onSelect={onSelect}
        detailId="comparison-player-detail"
        variant="comparison"
      />
    </dialog>
  )
}
