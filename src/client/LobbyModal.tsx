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
        <h2 id="lobby-modal-title">{mode === 'preview' ? `${card.name} ansehen` : 'Regeln & Infos'}</h2>
        <button class="secondary-button" type="button" onClick={onDismiss}>Schließen</button>
      </div>
      {mode === 'rules' ? (
        <div class="lobby-modal__body">
          <h3>So funktioniert Bingo</h3>
          <ol class="lobby-rules">
            <li>Das mittlere <strong>Bonusfeld</strong> ist ein Freifeld und zählt sofort.</li>
            <li>Hake ein Feld ab, sobald das Ereignis während des Spiels passiert.</li>
            <li>Führe Ereignisse nicht absichtlich herbei – der Spaß steht im Vordergrund.</li>
            <li>Wer zuerst eine Reihe, Spalte oder Diagonale vervollständigt, ruft <strong>„Bingo!“</strong></li>
          </ol>
          <h3>Auswahl der Karten</h3>
          <p>Alle zehn Karten sind frei wählbar. <strong>Mehrere Spieler dürfen dieselbe Karte verwenden.</strong> Jede Person verfolgt ihren Fortschritt unabhängig.</p>
          <p class="lobby-modal__muted">Aktuell ist dies eine lokale Testversion: Es gibt noch keine gemeinsamen Spielräume oder dauerhafte Speicherung.</p>
        </div>
      ) : mode === 'preview' ? (
        <div class="lobby-modal__body">
          <p class="lobby-modal__muted">Nur ansehen: Die Karte wird erst mit „Bingo starten“ übernommen.</p>
          <CardPreview card={card} titleId="lobby-preview-title" />
        </div>
      ) : null}
    </dialog>
  )
}
