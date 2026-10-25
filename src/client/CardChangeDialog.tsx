import { useEffect, useRef } from 'preact/hooks'

interface CardChangeDialogProps {
  open: boolean
  nextCardName: string
  onCancel: () => void
  onConfirm: () => void
  onAfterClose: () => void
}

/** Switching presets discards local progress only after explicit confirmation. */
export function CardChangeDialog({ open, nextCardName, onCancel, onConfirm, onAfterClose }: CardChangeDialogProps) {
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
      aria-labelledby="change-card-title"
      aria-describedby="change-card-description"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      onClose={onAfterClose}
    >
      <h2 id="change-card-title">Karte wechseln?</h2>
      <p id="change-card-description">
        Wenn du zu <strong>{nextCardName}</strong> wechselst, werden deine bisherigen Häkchen und Bingo-Linien zurückgesetzt.
        Die aktuelle Karte bleibt erhalten, wenn du abbrichst.
      </p>
      <div class="exit-actions">
        <button class="secondary-button" type="button" onClick={onCancel} autoFocus>Abbrechen</button>
        <button class="danger-button" type="button" onClick={onConfirm}>Wechseln und zurücksetzen</button>
      </div>
    </dialog>
  )
}
