import { useState } from 'preact/hooks'
import { getCardById, presetCards } from '../shared/cards'
import { CardPreview } from './CardPreview'
import { createLocalPlayer, MAX_PLAYER_NAME_LENGTH, type LocalPlayer } from './lobby'

export function App() {
  const [draftName, setDraftName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState(1)
  const [activePlayer, setActivePlayer] = useState<LocalPlayer | null>(null)
  const [formError, setFormError] = useState('')

  const selectedCard = getCardById(selectedCardId)
  const canStart = draftName.trim().length > 0 && draftName.trim().length <= MAX_PLAYER_NAME_LENGTH

  function startLocalPreview(event: Event) {
    event.preventDefault()
    try {
      setActivePlayer(createLocalPlayer(draftName, selectedCardId))
      setFormError('')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Spiel konnte nicht gestartet werden.')
    }
  }

  return (
    <main class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <span class="brand-mark" aria-hidden="true">B</span>
          <span class="brand-name">GW2 WvW Bingo</span>
          <span class="status-pill">Nur lokal · kein Mehrspieler</span>
        </header>

        {activePlayer === null ? (
          <section class="lobby" aria-labelledby="page-title">
            <div class="page-intro">
              <p class="eyebrow">Guild Wars 2 · World vs. World</p>
              <h1 id="page-title">Lobby</h1>
              <p class="lead">Wähle deinen Namen und eine der zehn WvW-Bingokarten. Du kannst deine Karte vor dem Start ansehen.</p>
            </div>

            <div class="lobby-layout">
              <section class="join-panel" aria-labelledby="join-title">
                <h2 id="join-title">Bingo beitreten</h2>
                <form class="join-form" onSubmit={startLocalPreview}>
                  <label for="player-name">Dein Name</label>
                  <input
                    id="player-name"
                    name="player-name"
                    type="text"
                    autoComplete="nickname"
                    maxLength={MAX_PLAYER_NAME_LENGTH}
                    placeholder="Spielername eingeben"
                    value={draftName}
                    onInput={(event) => {
                      setDraftName(event.currentTarget.value)
                      setFormError('')
                    }}
                    required
                  />
                  <label for="card-choice">Karte auswählen</label>
                  <select
                    id="card-choice"
                    name="card-choice"
                    value={selectedCardId}
                    onChange={(event) => setSelectedCardId(Number(event.currentTarget.value))}
                  >
                    {presetCards.map((card) => (
                      <option key={card.id} value={card.id}>{card.name}</option>
                    ))}
                  </select>
                  <button class="primary-button" type="submit" disabled={!canStart}>Bingo starten</button>
                  {formError && <p class="form-error" role="alert">{formError}</p>}
                  <p class="form-note">Jede Karte darf später auch von mehreren Spielern gewählt werden.</p>
                </form>
              </section>

              <aside class="players-panel" aria-labelledby="players-title">
                <div class="panel-heading">
                  <h2 id="players-title">Spielerübersicht</h2>
                  <span class="panel-count">0 Spieler</span>
                </div>
                <div class="empty-players">
                  <span class="empty-icon" aria-hidden="true">◎</span>
                  <strong>Noch keine Online-Spieler</strong>
                  <p>Die gemeinsame Lobby und der Live-Fortschritt kommen mit dem Mehrspieler-Backend.</p>
                </div>
              </aside>
            </div>

            <div class="preview-heading">
              <h2>Kartenvorschau</h2>
              <p>Die Vorschau ändert sich mit deiner Kartenauswahl.</p>
            </div>
            <CardPreview card={selectedCard} titleId="preview-title" />
            <div class="info-panel" role="note">
              <strong>Lokaler Prototyp</strong>
              <p>Der Start öffnet derzeit nur deine persönliche Kartenvorschau. Es werden noch keine Felder abgehakt oder Daten gespeichert. Andere Spieler können deine Sitzung noch nicht sehen.</p>
            </div>
          </section>
        ) : (
          <section class="player-view" aria-labelledby="page-title">
            <div class="player-heading">
              <div>
                <p class="eyebrow">Deine Karte · Lokale Vorschau</p>
                <h1 id="page-title">WvW Bingo</h1>
                <p class="lead">{activePlayer.name} · {getCardById(activePlayer.cardId).name}</p>
              </div>
              <button class="secondary-button" type="button" onClick={() => setActivePlayer(null)}>
                Zur Lobby
              </button>
            </div>
            <CardPreview card={getCardById(activePlayer.cardId)} titleId="preview-title" />
            <div class="info-panel" role="note">
              <strong>Spielansicht in Vorbereitung</strong>
              <p>Die Felder können noch nicht abgehakt werden. In Schritt 5 wird diese Vorschau zum klickbaren Bingo-Spiel. „Zur Lobby“ wechselt nur die Ansicht; es gibt noch keinen gespeicherten Fortschritt.</p>
            </div>
          </section>
        )}

        <footer class="footer">
          <span>Frontend · Lokale Vorschau</span>
          <span>Oberfläche: Deutsch</span>
        </footer>
      </div>
    </main>
  )
}
