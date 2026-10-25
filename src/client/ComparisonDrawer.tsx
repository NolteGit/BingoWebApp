import { useEffect, useRef } from 'preact/hooks'
import type { ComparisonEntry } from './comparison'
import { PlayerList } from './PlayerList'
import { PlayerCardDetail } from './PlayerCardDetail'

interface ComparisonDrawerProps {
  open: boolean
  entries: ReadonlyArray<ComparisonEntry>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDismiss: () => void
  onAfterClose: () => void
}

/** Starts on a compact leaderboard. Card details appear only after selecting a player. */
export function ComparisonDrawer({ open, entries, selectedId, onSelect, onDismiss, onAfterClose }: ComparisonDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selected = selectedId === null ? undefined : entries.find((entry) => entry.id === selectedId)
  const lastSelectedTrigger = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function showPlayer(id: string, trigger: HTMLButtonElement) {
    lastSelectedTrigger.current = trigger
    onSelect(id)
  }

  function backToList() {
    onSelect(null)
    // Focus the back button's replacement (selected player) after the next render.
    requestAnimationFrame(() => lastSelectedTrigger.current?.focus())
  }

  return (
    <dialog
      ref={dialogRef}
      class={`comparison-dialog${selected ? ' comparison-dialog--detail' : ''}`}
      aria-labelledby="compare-title"
      aria-describedby="compare-note"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClose={onAfterClose}
    >
      <div class="dialog-topline">
        <div>
          <h2 id="compare-title">Spielervergleich</h2>
        </div>
        <button class="secondary-button" type="button" onClick={onDismiss}>Schließen</button>
      </div>
      <p class="comparison-note" id="compare-note">
        Nur dein eigener Fortschritt ist echt. Mira und Tom sind Beispieldaten.
      </p>
      {selected ? (
        <div class="compare-detail">
          <button class="back-link" type="button" onClick={backToList}>← Zur Übersicht</button>
          <PlayerCardDetail entry={selected} />
        </div>
      ) : (
        <PlayerList entries={entries} onPreview={showPlayer} />
      )}
    </dialog>
  )
}
