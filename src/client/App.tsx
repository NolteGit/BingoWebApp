import { useEffect, useRef, useState } from 'preact/hooks'
import { getCardById, presetCards } from '../shared/cards'
import { isSquareChecked } from '../shared/bingo'
import { LobbyModal, type LobbyModalMode } from './LobbyModal'
import { PlayableBoard } from './PlayableBoard'
import { ComparisonDrawer } from './ComparisonDrawer'
import { PlayerOverview } from './PlayerOverview'
import { MAX_PLAYER_NAME_LENGTH } from './lobby'
import { entriesFromRoom, maskForOwnPlayer, playerStatus } from './room-view'
import {
  ApiError, assertRoomSnapshot, createRoom, errorMessage, getOwnSession, getRoom, joinRoom,
  roomCodeFromPath, saveSquare, type OwnPlayer, type RoomSnapshot,
} from './room-api'

const POLL_MS = 5000

type View = 'lobby' | 'game'

/** The server owns game progress. This UI never clears stored marks on navigation. */
export function App() {
  const [roomCode, setRoomCode] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : roomCodeFromPath(window.location.pathname))
  const [room, setRoom] = useState<RoomSnapshot | null>(null)
  const [player, setPlayer] = useState<OwnPlayer | null>(null)
  const [view, setView] = useState<View>('lobby')
  const [loadingRoom, setLoadingRoom] = useState(Boolean(roomCode))
  const [working, setWorking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncBlocked, setSyncBlocked] = useState(false)
  const [message, setMessage] = useState('')
  const [draftName, setDraftName] = useState('')
  const [selectedCardId, setSelectedCardId] = useState(1)
  const [lobbyModal, setLobbyModal] = useState<LobbyModalMode>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null)
  const [lobbyPreviewId, setLobbyPreviewId] = useState<string | null>(null)
  const rulesButtonRef = useRef<HTMLButtonElement>(null)
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const lastLobbyTriggerRef = useRef<HTMLButtonElement | null>(null)
  const compareButtonRef = useRef<HTMLButtonElement>(null)

  // Direct links (/r/CODE) restore the existing HttpOnly session without another join.
  useEffect(() => {
    if (!roomCode) return
    let cancelled = false
    setLoadingRoom(true)
    setRoom(null)
    setPlayer(null)
    setMessage('')
    setSyncBlocked(false)
    Promise.all([
      getRoom(roomCode).then(assertRoomSnapshot),
      getOwnSession(roomCode).catch(error => {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }),
    ]).then(([snapshot, own]) => {
      if (cancelled) return
      setRoom(snapshot)
      setPlayer(own?.player ?? null)
      setView(own ? 'game' : 'lobby')
    }).catch(error => {
      if (!cancelled) setMessage(errorMessage(error))
    }).finally(() => { if (!cancelled) setLoadingRoom(false) })
    return () => { cancelled = true }
  }, [roomCode])

  // Polling is temporary until Step 11 WebSockets. Never overwrite private in-flight marks.
  useEffect(() => {
    if (!roomCode) return
    let cancelled = false
    async function refresh() {
      try {
        const snapshot = assertRoomSnapshot(await getRoom(roomCode!))
        if (!cancelled) setRoom(snapshot)
      } catch { /* Keep the last known valid snapshot; show write failures separately. */ }
    }
    const interval = window.setInterval(() => { void refresh() }, POLL_MS)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [roomCode])

  // Warn only while an actual write is in flight; ordinary navigation never destroys a player.
  useEffect(() => {
    if (!saving) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [saving])

  // Allow browser back/forward between root and room URLs without stale session state.
  useEffect(() => {
    const onPop = () => {
      setRoomCode(roomCodeFromPath(window.location.pathname))
      setRoom(null)
      setPlayer(null)
      setView('lobby')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const selectedCard = getCardById(selectedCardId)
  const entries = room ? entriesFromRoom(room) : []
  const currentMask = maskForOwnPlayer(player)
  const joinEnabled = draftName.trim().length >= 2 && draftName.trim().length <= MAX_PLAYER_NAME_LENGTH && !working
  const hasInvalidRoomPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/r/') && !roomCode

  function showLobbyModal(mode: Exclude<LobbyModalMode, null>, trigger: HTMLButtonElement | null) {
    lastLobbyTriggerRef.current = trigger
    setLobbyModal(mode)
  }

  async function createNewRoom() {
    if (working) return
    setWorking(true)
    setMessage('')
    try {
      const created = await createRoom()
      window.history.pushState({}, '', created.roomUrl)
      setLoadingRoom(true)
      setRoomCode(created.roomCode)
      setView('lobby')
    } catch (error) { setMessage(errorMessage(error)) }
    finally { setWorking(false) }
  }

  async function join(event: Event) {
    event.preventDefault()
    if (!roomCode || working || player) return
    setWorking(true)
    setMessage('')
    try {
      const response = await joinRoom(roomCode, draftName.trim(), selectedCardId)
      setPlayer(response.player)
      setView('game')
      setLobbyModal(null)
      setSelectedComparisonId(null)
      try { setRoom(assertRoomSnapshot(await getRoom(roomCode))) }
      catch { setMessage('Beitritt erfolgreich. Die Spielerübersicht aktualisiert sich gleich.') }
    } catch (error) { setMessage(errorMessage(error)) }
    finally { setWorking(false) }
  }

  async function toggleSquare(index: number) {
    if (!roomCode || !player || saving || syncBlocked || index === 12) return
    const originalPlayer = player
    const desiredChecked = !isSquareChecked(currentMask, index)
    setSaving(true)
    setMessage('')
    try {
      const saved = await saveSquare(roomCode, index, desiredChecked, originalPlayer.playerRevision)
      setPlayer({ ...originalPlayer, checkedIndices: saved.checkedIndices,
        playerRevision: saved.playerRevision })
      try { setRoom(assertRoomSnapshot(await getRoom(roomCode))) }
      catch { setMessage('Häkchen gespeichert. Die Spielerübersicht konnte noch nicht aktualisiert werden.') }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'STALE_PLAYER_REVISION') {
        try {
          const latest = await getOwnSession(roomCode)
          setPlayer(latest.player)
          setRoom(assertRoomSnapshot(await getRoom(roomCode)))
          setSyncBlocked(false)
          setMessage('Deine Karte wurde zwischenzeitlich geändert. Aktueller Stand geladen – bitte Feld erneut auswählen.')
        } catch {
          setSyncBlocked(true)
          setMessage('Speicherstand konnte nicht geprüft werden. Weitere Klicks gesperrt, bitte Seite neu laden.')
        }
      } else if (error instanceof ApiError && error.status === 401) {
        setSyncBlocked(true)
        setMessage('Sitzung abgelaufen. Deine gespeicherten Felder wurden nicht gelöscht. Bitte dieselbe Browser-Sitzung verwenden.')
      } else {
        // A lost response might still have been persisted. Recover server truth before allowing another write.
        try {
          const latest = await getOwnSession(roomCode)
          setPlayer(latest.player)
          setRoom(assertRoomSnapshot(await getRoom(roomCode)))
          setSyncBlocked(false)
          setMessage('Verbindung unterbrochen. Gespeicherten Stand geladen. Bitte dein letztes Häkchen prüfen.')
        } catch {
          setSyncBlocked(true)
          setMessage('Speicherung nicht bestätigt. Bitte Verbindung prüfen und die Seite neu laden, bevor du weiterspielst.')
        }
      }
    } finally { setSaving(false) }
  }

  async function copyLink() {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${roomCode}`)
      setMessage('Einladungslink kopiert.')
    } catch { setMessage('Bitte den Raumlink aus der Adresszeile kopieren.') }
  }

  return (
    <main class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <span class="brand-mark" aria-hidden="true">B</span>
          <span class="brand-name">GW2 Bingo</span>
          <span class="status-pill">{roomCode ? `Raum ${roomCode}` : 'Mehrspieler'}</span>
        </header>

        {roomCode === null ? (
          <section class="lobby lobby--compact" aria-labelledby="page-title">
            <div class="lobby-header"><h1 id="page-title">Lobby</h1></div>
            <div class="join-panel room-entry">
              <h2>Gemeinsam Bingo spielen</h2>
              <p>Erstelle einen Raum und teile den Link mit deinen Freunden. Wer später dazukommt, kann direkt mitspielen.</p>
              <button type="button" class="primary-button" disabled={working || hasInvalidRoomPath} onClick={() => void createNewRoom()}>
                {working ? 'Raum wird erstellt…' : 'Neuen Raum erstellen'}
              </button>
              {hasInvalidRoomPath && <>
                <p role="alert">Ungültiger Raumlink. Bitte den vollständigen Einladungslink verwenden.</p>
                <button class="secondary-button" type="button" onClick={() => { window.history.pushState({}, '', '/'); setMessage('') }}>Zur Startseite</button>
              </>}
            </div>
          </section>
        ) : loadingRoom ? (
          <section class="lobby lobby--compact" aria-live="polite"><h1>Lade Raum…</h1></section>
        ) : !room ? (
          <section class="lobby lobby--compact">
            <h1>Raum nicht erreichbar</h1>
            <p>Der Raum konnte nicht geladen werden. Die gespeicherten Daten werden dadurch nicht gelöscht.</p>
            <button class="secondary-button" type="button" onClick={() => { window.history.pushState({}, '', '/'); setRoomCode(null); setMessage('') }}>Zur Startseite</button>
          </section>
        ) : view === 'lobby' || !player ? (
          <section class="lobby lobby--compact" aria-labelledby="page-title">
            <div class="lobby-header">
              <h1 id="page-title">Lobby</h1>
              <button class="lobby-info-button" ref={rulesButtonRef} type="button"
                onClick={() => showLobbyModal('rules', rulesButtonRef.current)}>
                <span aria-hidden="true">ⓘ</span> Regeln & Infos
              </button>
            </div>
            <div class="room-link-row">
              <span>Raumcode: <strong>{roomCode}</strong></span>
              <button class="secondary-button" type="button" onClick={() => void copyLink()}>Link kopieren</button>
            </div>
            <div class="lobby-layout">
              <section class="join-panel" aria-labelledby="join-title">
                {player ? (
                  <>
                    <h2 id="join-title">Willkommen zurück, {player.name}</h2>
                    <p>{getCardById(player.cardId).name} · {playerStatus(player)}</p>
                    <button class="primary-button" type="button" onClick={() => { setMessage(''); setView('game') }}>Bingo fortsetzen</button>
                    <p class="form-note">Dein Fortschritt bleibt beim Wechsel zur Lobby gespeichert.</p>
                  </>
                ) : (
                  <>
                    <h2 id="join-title">Bingo beitreten</h2>
                    <form class="join-form" onSubmit={(event) => void join(event)}>
                      <label for="player-name">Dein Name</label>
                      <input id="player-name" type="text" autoComplete="nickname" maxLength={MAX_PLAYER_NAME_LENGTH}
                        placeholder="Spielername eingeben" value={draftName}
                        onInput={event => { setDraftName(event.currentTarget.value); setMessage('') }} required />
                      <div class="card-field-label">
                        <label for="card-choice">Karte auswählen</label>
                        <button class="preview-link" ref={previewButtonRef} type="button"
                          onClick={() => showLobbyModal('preview', previewButtonRef.current)}>Karte ansehen</button>
                      </div>
                      <select id="card-choice" value={selectedCardId}
                        onChange={event => setSelectedCardId(Number(event.currentTarget.value))}>
                        {presetCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                      </select>
                      <button class="primary-button" type="submit" disabled={!joinEnabled}>
                        {working ? 'Beitritt läuft…' : 'Bingo starten'}
                      </button>
                    </form>
                  </>
                )}
              </section>
              <aside class="players-panel" aria-labelledby="players-title">
                <div class="panel-heading"><h2 id="players-title">Spielerübersicht</h2><span class="panel-count">{entries.length} Spieler</span></div>
                <PlayerOverview entries={entries} selectedId={lobbyPreviewId} onSelect={setLobbyPreviewId}
                  detailId="lobby-player-detail" variant="lobby" />
                <p class="form-note">Automatische Aktualisierung alle 5 Sekunden.</p>
              </aside>
            </div>
            <LobbyModal mode={lobbyModal} card={selectedCard}
              onDismiss={() => setLobbyModal(null)}
              onAfterClose={() => lastLobbyTriggerRef.current?.focus()} />
          </section>
        ) : (
          <section class="player-view player-view--compact" aria-labelledby="page-title">
            <div class="player-heading player-heading--compact">
              <div class="player-identity">
                <h1 id="page-title">{player.name}</h1>
                <span class="room-card-label">{getCardById(player.cardId).name}</span>
              </div>
              <div class="player-actions">
                <button ref={compareButtonRef} class="primary-button compare-trigger" type="button"
                  onClick={() => { setSelectedComparisonId(null); setComparisonOpen(true) }}>Vergleich</button>
                <button class="secondary-button" type="button" disabled={saving}
                  onClick={() => { setComparisonOpen(false); setView('lobby'); setMessage('') }}>Zur Lobby</button>
              </div>
            </div>
            <p class="save-indicator" role="status">{saving ? 'Speichern…' : syncBlocked ? 'Speicherstand unklar – bitte Seite neu laden' : 'Fortschritt wird serverseitig gespeichert'}</p>
            <PlayableBoard card={getCardById(player.cardId)} checkedMask={currentMask}
              onToggleSquare={index => void toggleSquare(index)} disabled={saving || syncBlocked} />
            <ComparisonDrawer open={comparisonOpen} entries={entries} selectedId={selectedComparisonId}
              onSelect={setSelectedComparisonId} onDismiss={() => setComparisonOpen(false)}
              onAfterClose={() => { setComparisonOpen(false); compareButtonRef.current?.focus() }}
              note="Spielerstände werden derzeit alle 5 Sekunden aktualisiert. Die Vorschau ist schreibgeschützt." />
          </section>
        )}
        {message && <p class="room-feedback" role="status">{message}</p>}
      </div>
    </main>
  )
}
