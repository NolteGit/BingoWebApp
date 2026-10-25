import { useEffect, useRef } from 'preact/hooks'

interface NewBingoDialogProps {
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
  onAfterClose: () => void
}

/** No destructive action occurs until the user explicitly confirms. */
export function NewBingoDialog({ open, busy, onCancel, onConfirm, onAfterClose }: NewBingoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} class="new-bingo-dialog" aria-labelledby="new-bingo-title"
      aria-describedby="new-bingo-description"
      onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}
      onClose={onAfterClose}>
      <h2 id="new-bingo-title">Neues Bingo starten?</h2>
      <p id="new-bingo-description">Deine bisherige Karte und alle Häkchen werden gelöscht.</p>
      <div class="new-bingo-dialog__actions">
        <button class="secondary-button" type="button" onClick={onCancel} disabled={busy} autoFocus>Abbrechen</button>
        <button class="danger-button" type="button" onClick={onConfirm} disabled={busy}>
          {busy ? 'Wird gelöscht…' : 'Löschen & neu starten'}
        </button>
      </div>
    </dialog>
  )
}
