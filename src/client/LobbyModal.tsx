import { useI18n } from './i18n'
import { useEffect, useRef } from 'preact/hooks'
import type { BingoCard } from '../shared/cards'
import { CardPreview } from './CardPreview'

export type LobbyModalMode = 'rules' | 'preview' | null

interface LobbyModalProps {
  mode: LobbyModalMode
  card: BingoCard
  onDismiss: () => void
  onAfterClose: () => void
}

/** Click-open modal works for mouse, keyboard and touch (no hover-only content). */
export function LobbyModal({ mode, card, onDismiss, onAfterClose }: LobbyModalProps) {
  const { t, cardName } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (mode !== null && !dialog.open) dialog.showModal()
    if (mode === null && dialog.open) dialog.close()
  }, [mode])

  return (
    <dialog
      ref={dialogRef}
      class={`lobby-modal${mode === 'preview' ? ' lobby-modal--preview' : ''}`}
      aria-labelledby="lobby-modal-title"
      onCancel={(event) => { event.preventDefault(); onDismiss() }}
      onClose={onAfterClose}
    >
      <div class="lobby-modal__header">
        <h2 id="lobby-modal-title">{mode === 'preview' ? t('previewCardTitle', {card: cardName(card.id)}) : t('rulesInfo')}</h2>
        <button class="secondary-button" type="button" onClick={onDismiss}>{t('close')}</button>
      </div>
      {mode === 'rules' ? (
        <div class="lobby-modal__body">
          <h3>{t('rulesHeading')}</h3>
          <ol class="lobby-rules">
            <li>{t('rule1Start')} <strong>Bonusfeld</strong> {t('rule1End')}</li>
            <li>{t('rule2')}</li>
            <li>{t('rule3')}</li>
            <li>{t('rule4Start')} <strong>“Bingo!”</strong></li>
          </ol>
          <h3>{t('cardChoices')}</h3>
          <p>{t('rulesCards')} <strong>{t('rulesCardsBold')}</strong> {t('rulesCardsEnd')}</p>
          <p class="lobby-modal__muted">{t('rulesSaved')}</p>
        </div>
      ) : mode === 'preview' ? (
        <div class="lobby-modal__body">
          <p class="lobby-modal__muted">{t('previewNote')}</p>
          <CardPreview card={card} titleId="lobby-preview-title" />
        </div>
      ) : null}
    </dialog>
  )
}
