import { useEffect, useRef } from 'preact/hooks'
import { useI18n } from './i18n'
import type { ComparisonEntry } from './comparison'
import { PlayerOverview } from './PlayerOverview'

interface PlayerOverviewDialogProps {
  open: boolean
  entries: ReadonlyArray<ComparisonEntry>
  onDismiss: () => void
  onAfterClose: () => void
  live: boolean
}

/** The same player list and hover-card previews as the lobby. */
export function PlayerOverviewDialog({ open, entries, onDismiss, onAfterClose, live }: PlayerOverviewDialogProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} class="player-overview-dialog" aria-labelledby="overview-title"
      aria-describedby="overview-note"
      onCancel={event => { event.preventDefault(); onDismiss() }}
      onClose={onAfterClose}>
      <div class="dialog-topline">
        <div>
          <h2 id="overview-title">{t('playerOverview')}</h2>
          <p id="overview-note" class="overview-dialog__note">{live ? t('liveUpdate') : t('pollingUpdate')}</p>
        </div>
        <button class="secondary-button" type="button" onClick={onDismiss}>{t('close')}</button>
      </div>
      <div class="overview-dialog__summary">
        <span class="panel-count">{t('playerCount', { count: entries.length })}</span>
      </div>
      {open && <PlayerOverview entries={entries} />}
    </dialog>
  )
}
