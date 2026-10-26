import { useI18n } from './i18n'
import { useEffect, useRef } from 'preact/hooks'

type PlayerAction = 'restart' | 'leave'

interface NewBingoDialogProps {
  mode?: PlayerAction
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
  onAfterClose: () => void
}

/** No destructive action occurs until the user explicitly confirms. */
export function NewBingoDialog({ mode = 'restart', open, busy, onCancel, onConfirm, onAfterClose }: NewBingoDialogProps) {
  const { t } = useI18n()
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
      <h2 id="new-bingo-title">{mode === 'leave' ? t('leaveTitle') : t('restartTitle')}</h2>
      <p id="new-bingo-description">{mode === 'leave'
        ? t('leaveDescription')
        : t('restartDescription')}</p>
      <div class="new-bingo-dialog__actions">
        <button class="secondary-button" type="button" onClick={onCancel} disabled={busy} autoFocus>{t('cancel')}</button>
        <button class="danger-button" type="button" onClick={onConfirm} disabled={busy}>
          {busy ? t('deleting') : mode === 'leave' ? t('confirmLeave') : t('confirmRestart')}
        </button>
      </div>
    </dialog>
  )
}
