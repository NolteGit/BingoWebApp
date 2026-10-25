import { useRef, useState } from 'preact/hooks'
import { getCardById, presetCards } from '../shared/cards'
import { createInitialCheckedMask, isSquareChecked, setSquareChecked } from '../shared/bingo'
import { LobbyModal, type LobbyModalMode } from './LobbyModal'
import { PlayableBoard } from './PlayableBoard'
import { ComparisonDrawer } from './ComparisonDrawer'
import { ExitDialog } from './ExitDialog'
import { getComparisonEntries } from './comparison'
import { createLocalPlayer, MAX_PLAYER_NAME_LENGTH, type LocalPlayer } from './lobby'

export function App() {
  const [draftName, setDraftName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState(1)
  const [activePlayer, setActivePlayer] = useState<LocalPlayer | null>(null)
  const [formError, setFormError] = useState('')
  const [lobbyModal, setLobbyModal] = useState<LobbyModalMode>(null)
  // Local-only for Step 5. Backend-owned state will replace this in multiplayer.
  const [checkedMask, setCheckedMask] = useState(createInitialCheckedMask())
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [selectedComparisonId, setSelectedComparisonId] = useState('demo-mira')
  const [exitOpen, setExitOpen] = useState(false)
  const rulesButtonRef = useRef<HTMLButtonElement>(null)
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const lastLobbyTriggerRef = useRef<HTMLButtonElement | null>(null)
  const compareButtonRef = useRef<HTMLButtonElement>(null)
  const exitButtonRef = useRef<HTMLButtonElement>(null)

  const selectedCard = getCardById(selectedCardId)
  const canStart = draftName.trim().length > 0 && draftName.trim().length <= MAX_PLAYER_NAME_LENGTH

  function showLobbyModal(mode: Exclude<LobbyModalMode, null>, trigger: HTMLButtonElement | null) {
    lastLobbyTriggerRef.current = trigger
    setLobbyModal(mode)
  }

  function startLocalPreview(event: Event) {
    event.preventDefault()
    try {
      const player = createLocalPlayer(draftName, selectedCardId)
      setCheckedMask(createInitialCheckedMask())
      setLobbyModal(null)
      setActivePlayer(player)
      setComparisonOpen(false)
      setSelectedComparisonId('demo-mira')
      setExitOpen(false)
      setFormError('')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Spiel konnte nicht gestartet werden.')
    }
  }

  function toggleSquare(index: number) {
    setCheckedMask((previous) => setSquareChecked(previous, index, !isSquareChecked(previous, index)))
  }

  function leaveLocalGame() {
    // Only explicit confirmation destroys the current local state.
    setExitOpen(false)
    setComparisonOpen(false)
    setActivePlayer(null)
    setCheckedMask(createInitialCheckedMask())
  }

  const comparisonEntries = activePlayer ? getComparisonEntries(activePlayer, checkedMask) : []

  return (
    <main class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <span class="brand-mark" aria-hidden="true">B</span>
          <span class="brand-name">GW2 Bingo</span>
          <span class="status-pill">Lokal</span>
        </header>

        {activePlayer === null ? (
          <section class="lobby lobby--compact" aria-labelledby="page-title">
            <div class="lobby-header">
              <h1 id="page-title">Lobby</h1>
              <button
                class="lobby-info-button"
                ref={rulesButtonRef}
                type="button"
                onClick={() => showLobbyModal('rules', rulesButtonRef.current)}
              >
                <span aria-hidden="true">ⓘ</span> Regeln & Infos
              </button>
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
                  <div class="card-field-label">
                    <label for="card-choice">Karte auswählen</label>
                    <button
                      class="preview-link"
                      ref={previewButtonRef}
                      type="button"
                      onClick={() => showLobbyModal('preview', previewButtonRef.current)}
                    >
                      Karte ansehen
                    </button>
                  </div>
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
                </form>
              </section>

              <aside class="players-panel" aria-labelledby="players-title">
                <div class="panel-heading">
                  <h2 id="players-title">Spielerübersicht</h2>
                  <span class="panel-count">0 Spieler</span>
                </div>
                <div class="empty-players">
                  <strong>Noch keine Spieler</strong>
                  <p>Die gemeinsame Übersicht wird mit dem Mehrspieler-Modus aktiviert.</p>
                </div>
              </aside>
            </div>

            <p class="lobby-local-note" role="note">
              Lokale Testversion – Fortschritt wird beim Neuladen noch nicht gespeichert.
            </p>
            <LobbyModal
              mode={lobbyModal}
              card={selectedCard}
              onDismiss={() => setLobbyModal(null)}
              onAfterClose={() => lastLobbyTriggerRef.current?.focus()}
            />
          </section>
        ) : (
          <section class="player-view" aria-labelledby="page-title">
            <div class="player-heading">
              <div>
                <p class="eyebrow">Deine Karte · Lokales Spiel</p>
                <h1 id="page-title">WvW Bingo</h1>
                <p class="lead">{activePlayer.name} · {getCardById(activePlayer.cardId).name}</p>
              </div>
              <div class="player-actions">
                <button
                  ref={compareButtonRef}
                  class="primary-button compare-trigger"
                  type="button"
                  onClick={() => setComparisonOpen(true)}
                >
                  Vergleich
                </button>
                <button ref={exitButtonRef} class="secondary-button" type="button" onClick={() => setExitOpen(true)}>
                  Zur Lobby
                </button>
              </div>
            </div>
            <PlayableBoard card={getCardById(activePlayer.cardId)} checkedMask={checkedMask} onToggleSquare={toggleSquare} />
            <div class="info-panel" role="note">
              <strong>Lokales Spiel · kein Mehrspieler</strong>
              <p>Deine Häkchen gelten nur in diesem Browserfenster und gehen beim Neuladen verloren. Der Vergleich enthält ausdrücklich gekennzeichnete Beispieldaten. „Zur Lobby“ fragt vor dem Löschen nach.</p>
            </div>
            <ComparisonDrawer
              open={comparisonOpen}
              entries={comparisonEntries}
              selectedId={selectedComparisonId}
              onSelect={setSelectedComparisonId}
              onDismiss={() => setComparisonOpen(false)}
              onAfterClose={() => { setComparisonOpen(false); compareButtonRef.current?.focus() }}
            />
            <ExitDialog
              open={exitOpen}
              onCancel={() => setExitOpen(false)}
              onConfirm={leaveLocalGame}
              onAfterClose={() => { setExitOpen(false); exitButtonRef.current?.focus() }}
            />
          </section>
        )}

        {activePlayer !== null && (
          <footer class="footer">
            <span>Lokales Spiel</span>
            <span>Keine Speicherung beim Neuladen</span>
          </footer>
        )}
      </div>
    </main>
  )
}
