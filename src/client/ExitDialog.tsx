import { useI18n } from './i18n'
import { useEffect, useRef } from 'preact/hooks'

interface ExitDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  onAfterClose: () => void
}

/** Native <dialog> supplies modal keyboard/focus behavior without an extra UI dependency. */
export function ExitDialog({ open, onCancel, onConfirm, onAfterClose }: ExitDialogProps) {
  const { t } = useI18n()
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
      <p class="eyebrow">{t('progressDiscard')}</p>
      <h2 id="exit-title">{t('exitCardTitle')}</h2>
      <p id="exit-description">
        {t('exitCardDescription')}
      </p>
      <div class="exit-actions">
        <button class="secondary-button" type="button" onClick={onCancel} autoFocus>{t('cancel')}</button>
        <button class="danger-button" type="button" onClick={onConfirm}>{t('exitAndDelete')}</button>
      </div>
    </dialog>
  )
}
