import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { getCardById, presetCards } from '../shared/cards'
import { isSquareChecked } from '../shared/bingo'
import { LobbyModal, type LobbyModalMode } from './LobbyModal'
import { PlayableBoard } from './PlayableBoard'
import { ComparisonDrawer } from './ComparisonDrawer'
import { PlayerOverview } from './PlayerOverview'
import { MAX_PLAYER_NAME_LENGTH } from './lobby'
import { entriesFromRoom, maskForOwnPlayer, playerStatus } from './room-view'
import { acceptIncomingSnapshot, connectLiveRoom } from './room-live'
import { CONNECTION_LABELS, connectionState, recoverSavedState, saveSquareSafely } from './reliability'
import {
  ApiError, assertRoomSnapshot, createRoom, errorMessage, getOwnSession, getRoom, joinRoom,
  roomCodeFromPath, type OwnPlayer, type RoomSnapshot,
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
  const [recovering, setRecovering] = useState(false)
  const [serverReachable, setServerReachable] = useState(true)
  const [browserOnline, setBrowserOnline] = useState(() =>
    typeof navigator === 'undefined' || navigator.onLine !== false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [liveConnected, setLiveConnected] = useState(false)
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
  // Mutable guards close the gap before Preact has rendered the new disabled state.
  const writeBusyRef = useRef(false)
  const recoveryBusyRef = useRef(false)
  const currentRoomRef = useRef(roomCode)
  const currentPlayerRef = useRef(player)
  currentRoomRef.current = roomCode
  currentPlayerRef.current = player

  useEffect(() => {
    const online = () => setBrowserOnline(true)
    const offline = () => { setBrowserOnline(false); setServerReachable(false) }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

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
      setServerReachable(true)
      setView(own ? 'game' : 'lobby')
    }).catch(error => {
      if (!cancelled) { setServerReachable(false); setMessage(errorMessage(error)) }
    }).finally(() => { if (!cancelled) setLoadingRoom(false) })
    return () => { cancelled = true }
  }, [roomCode, loadAttempt])

  // Room-scoped WebSocket; storage remains authoritative and reconnects are non-destructive.
  useEffect(() => {
    setLiveConnected(false)
    if (!roomCode || !player) return
    const connection = connectLiveRoom(roomCode, snapshot => {
      setServerReachable(true)
      setRoom(previous => acceptIncomingSnapshot(previous, snapshot) ? snapshot : previous)
      const own = snapshot.players.find(entry => entry.playerId === player.playerId)
      if (own) {
        // Another tab might have changed the same player's marks.
        setPlayer(previous => previous?.playerId === own.playerId &&
          own.playerRevision > previous.playerRevision
          ? { ...previous, checkedIndices: own.checkedIndices, playerRevision: own.playerRevision }
          : previous)
      }
    }, setLiveConnected)
    return () => { connection.close(); setLiveConnected(false) }
  }, [roomCode, player?.playerId])

  // Polling is a fallback when the live channel disconnects and an occasional safety refresh.
  useEffect(() => {
    if (!roomCode) return
    let cancelled = false
    async function refresh() {
      try {
        const snapshot = assertRoomSnapshot(await getRoom(roomCode!))
        if (!cancelled) {
          setRoom(previous => acceptIncomingSnapshot(previous, snapshot) ? snapshot : previous)
          setServerReachable(true)
        }
      } catch { if (!cancelled) setServerReachable(false) /* Keep confirmed state. */ }
    }
    const interval = window.setInterval(() => { void refresh() }, liveConnected ? 60000 : POLL_MS)
    const onVisible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { cancelled = true; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [roomCode, liveConnected])

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
  const connection = connectionState({ saving, recovering, blocked: syncBlocked, online: browserOnline,
    serverReachable, live: liveConnected })
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
      try {
        const snapshot = assertRoomSnapshot(await getRoom(roomCode))
        setRoom(previous => acceptIncomingSnapshot(previous, snapshot) ? snapshot : previous)
      }
      catch { setMessage('Beitritt erfolgreich. Die Spielerübersicht aktualisiert sich gleich.') }
    } catch (error) { setMessage(errorMessage(error)) }
    finally { setWorking(false) }
  }

  /** Safe recovery can be triggered manually, by a timer, or on reconnection. */
  const recoverNow = useCallback(async () => {
    const active = currentPlayerRef.current
    if (!roomCode || !active || recoveryBusyRef.current) return
    recoveryBusyRef.current = true
    setRecovering(true)
    try {
      const recovered = await recoverSavedState(roomCode, active.playerId, active.playerRevision)
      // Ignore a response for a room/player that was navigated away from in the meantime.
      if (currentRoomRef.current !== roomCode || currentPlayerRef.current?.playerId !== active.playerId) return
      if ((currentPlayerRef.current?.playerRevision ?? 0) > recovered.player.playerRevision) {
        throw new Error('Ein neuerer Spielstand wird noch abgeglichen.')
      }
      setPlayer(previous => previous?.playerId === active.playerId ? recovered.player : previous)
      setRoom(previous => acceptIncomingSnapshot(previous, recovered.room) ? recovered.room : previous)
      setSyncBlocked(false)
      setServerReachable(true)
      setMessage('Verbindung wiederhergestellt. Gespeicherten Stand geladen – bitte letztes Häkchen prüfen.')
    } catch {
      if (currentRoomRef.current === roomCode) {
        setSyncBlocked(true)
        setServerReachable(false)
      }
    } finally {
      recoveryBusyRef.current = false
      setRecovering(false)
    }
  }, [roomCode, player?.playerId])

  // A lost response does not require a manual refresh: verify the authoritative state
  // periodically and as soon as the browser comes online or the tab becomes visible.
  useEffect(() => {
    if (!syncBlocked || !roomCode || !player) return
    const attempt = () => { if (navigator.onLine !== false) void recoverNow() }
    const onVisible = () => { if (!document.hidden) attempt() }
    const interval = window.setInterval(attempt, 5000)
    window.addEventListener('online', attempt)
    document.addEventListener('visibilitychange', onVisible)
    attempt()
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', attempt)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [syncBlocked, roomCode, player?.playerId, recoverNow])

  async function toggleSquare(index: number) {
    if (!roomCode || !player || writeBusyRef.current || syncBlocked || recovering ||
      !browserOnline || index === 12) return
    writeBusyRef.current = true
    const activeRoom = roomCode
    const originalPlayer = player
    const desiredChecked = !isSquareChecked(currentMask, index)
    setSaving(true)
    setMessage('')
    try {
      const result = await saveSquareSafely(activeRoom, originalPlayer, index, desiredChecked)
      if (currentRoomRef.current !== activeRoom || currentPlayerRef.current?.playerId !== originalPlayer.playerId) return
      if (result.status === 'saved') {
        // Never roll back a newer revision received via WebSocket or another tab.
        setPlayer(previous => previous?.playerId === result.state.playerId &&
          previous.playerRevision <= result.state.playerRevision
          ? { ...previous, checkedIndices: result.state.checkedIndices,
              playerRevision: result.state.playerRevision }
          : previous)
        setServerReachable(true)
        try {
          const snapshot = assertRoomSnapshot(await getRoom(activeRoom))
          if (currentRoomRef.current === activeRoom) {
            setRoom(previous => acceptIncomingSnapshot(previous, snapshot) ? snapshot : previous)
          }
        } catch { setMessage('Feld gespeichert. Spielerübersicht wird wieder synchronisiert.') }
      } else if (result.status === 'recovered') {
        setPlayer(previous => previous?.playerId === result.player.playerId &&
          previous.playerRevision <= result.player.playerRevision ? result.player : previous)
        setRoom(previous => acceptIncomingSnapshot(previous, result.room) ? result.room : previous)
        setServerReachable(true)
        setMessage(result.conflict
          ? 'Karte wurde in einem anderen Tab geändert. Aktuellen Stand geladen – bitte erneut klicken.'
          : 'Speicherantwort verloren. Serverstand geprüft – bitte letztes Häkchen kontrollieren.')
      } else {
        setSyncBlocked(true)
        setServerReachable(false)
        setMessage(result.authFailed
          ? 'Spielsitzung nicht bestätigt. Fortschritt bleibt erhalten; Sitzung im selben Browser wiederherstellen.'
          : 'Speicherung unbestätigt. Prüfe den Serverstand automatisch – weitere Klicks vorerst gesperrt.')
      }
    } finally {
      writeBusyRef.current = false
      setSaving(false)
    }
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
            <button class="secondary-button" type="button" onClick={() => setLoadAttempt(previous => previous + 1)}>Erneut laden</button>
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
                <p class="form-note">{liveConnected ? 'Live verbunden – Änderungen erscheinen sofort.' : 'Aktualisierung alle 5 Sekunden (Fallback).'}</p>
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
            <div class={`save-status save-status--${connection}`} role="status" aria-live="polite">
              <span class="save-status__dot" aria-hidden="true" />
              <span>{CONNECTION_LABELS[connection]}</span>
              {syncBlocked && <button class="preview-link" type="button" disabled={recovering}
                onClick={() => void recoverNow()}>Erneut prüfen</button>}
            </div>
            <PlayableBoard card={getCardById(player.cardId)} checkedMask={currentMask}
              onToggleSquare={index => void toggleSquare(index)} disabled={saving || syncBlocked || recovering || !browserOnline} />
            <ComparisonDrawer open={comparisonOpen} entries={entries} selectedId={selectedComparisonId}
              onSelect={setSelectedComparisonId} onDismiss={() => setComparisonOpen(false)}
              onAfterClose={() => { setComparisonOpen(false); compareButtonRef.current?.focus() }}
              note={liveConnected ? 'Live verbunden. Die Vorschau ist schreibgeschützt.' : 'Verbindung wird wiederhergestellt. Bis dahin Aktualisierung alle 5 Sekunden.'} />
          </section>
        )}
        {message && <p class="room-feedback" role="status">{message}</p>}
      </div>
    </main>
  )
}
