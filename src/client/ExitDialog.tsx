import { useEffect, useRef } from 'preact/hooks'

interface ExitDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  onAfterClose: () => void
}

/** Native <dialog> supplies modal keyboard/focus behavior without an extra UI dependency. */
export function ExitDialog({ open, onCancel, onConfirm, onAfterClose }: ExitDialogProps) {
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
      class="exit-dialog"
      aria-labelledby="exit-title"
      aria-describedby="exit-description"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      onClose={onAfterClose}
    >
      <p class="eyebrow">Fortschritt verwerfen</p>
      <h2 id="exit-title">Bingokarte verlassen?</h2>
      <p id="exit-description">
        Wenn du das Spiel verlässt, werden deine aktuelle Bingokarte und dein Fortschritt gelöscht.
        Im lokalen Prototyp bleibt nichts gespeichert. Ein Abbruch ändert nichts an deinen Häkchen.
      </p>
      <div class="exit-actions">
        <button class="secondary-button" type="button" onClick={onCancel} autoFocus>Abbrechen</button>
        <button class="danger-button" type="button" onClick={onConfirm}>Verlassen und löschen</button>
      </div>
    </dialog>
  )
}
