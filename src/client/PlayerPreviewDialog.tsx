import { useEffect, useRef } from 'preact/hooks'
import type { ComparisonEntry } from './comparison'
import { PlayerCardDetail } from './PlayerCardDetail'

interface PlayerPreviewDialogProps {
  entry: ComparisonEntry | null
  onDismiss: () => void
  onAfterClose: () => void
}

/** Read-only popup for a player selected from the lobby player list. */
export function PlayerPreviewDialog({ entry, onDismiss, onAfterClose }: PlayerPreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (entry !== null && !dialog.open) dialog.showModal()
    if (entry === null && dialog.open) dialog.close()
  }, [entry])

  return (
    <dialog
      class="lobby-modal lobby-modal--preview player-preview-dialog"
      ref={dialogRef}
      aria-labelledby="lobby-player-preview-title"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClose={onAfterClose}
    >
      <div class="dialog-topline">
        <h2 id="lobby-player-preview-title">Spielerkarte</h2>
        <button class="secondary-button" type="button" onClick={onDismiss}>Schließen</button>
      </div>
      {entry && <PlayerCardDetail entry={entry} />}
    </dialog>
  )
}
