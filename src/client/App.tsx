import { useI18n } from './i18n'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { cardFromSnapshot, getCardById } from '../shared/cards'
import { isSquareChecked } from '../shared/bingo'
import { LobbyModal, type LobbyModalMode } from './LobbyModal'
import { PlayableBoard } from './PlayableBoard'
import { PrintableCard } from './PrintableCard'
import { CardPicker } from './CardPicker'
import { NewBingoDialog } from './NewBingoDialog'
import { PlayerOverviewDialog } from './PlayerOverviewDialog'
import { PlayerOverview } from './PlayerOverview'
import { UiIcon } from './UiIcon'
import { MAX_PLAYER_NAME_LENGTH } from './lobby'
import { entriesFromRoom, maskForOwnPlayer, playerStatus } from './room-view'
import { acceptIncomingSnapshot, connectLiveRoom } from './room-live'
import { CONNECTION_LABEL_KEYS, connectionState, recoverSavedState, saveSquareSafely } from './reliability'
import {
  ApiError, assertRoomSnapshot, createRoom, deleteOwnBingo, errorMessage, getOwnSession, getRoom, joinRoom,
  roomCodeFromPath, type OwnPlayer, type RoomSnapshot,
} from './room-api'

const POLL_MS = 5000

type View = 'lobby' | 'game'

/** The server owns game progress. This UI never clears stored marks on navigation. */
export function App() {
  const { locale, setLocale, t, cardName } = useI18n()
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
  const [playerAction, setPlayerAction] = useState<'restart' | 'leave' | null>(null)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const rulesButtonRef = useRef<HTMLButtonElement>(null)
  const newBingoButtonRef = useRef<HTMLButtonElement>(null)
  const leaveRoomButtonRef = useRef<HTMLButtonElement>(null)
  const playerDialogTriggerRef = useRef<HTMLButtonElement | null>(null)
  const lastLobbyTriggerRef = useRef<HTMLButtonElement | null>(null)
  const overviewButtonRef = useRef<HTMLButtonElement>(null)
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
      if (!cancelled) { setServerReachable(false); setMessage(errorMessage(error, locale)) }
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

  /** Navigating to the start screen never deletes a room, session, or checked square. */
  function returnToRoomStart() {
    if (working || saving || syncBlocked) return
    window.history.pushState({}, '', '/')
    setRoomCode(null)
    setRoom(null)
    setPlayer(null)
    setView('lobby')
    setOverviewOpen(false)
    setLobbyModal(null)
    setMessage('')
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
    } catch (error) { setMessage(errorMessage(error, locale)) }
    finally { setWorking(false) }
  }

  /** Both actions delete only the authenticated player's record; never the room. */
  async function removeOwnPlayer(action: 'restart' | 'leave' | null) {
    if (!action || !roomCode || !player || working || saving || syncBlocked || recovering || writeBusyRef.current) return
    const oldRoomCode = roomCode
    const oldPlayerId = player.playerId
    setWorking(true)
    setMessage('')
    try {
      const response = await deleteOwnBingo(oldRoomCode)
      if (currentRoomRef.current !== oldRoomCode || currentPlayerRef.current?.playerId !== oldPlayerId) return
      if (response.status !== 'deleted' || response.playerId !== oldPlayerId ||
        response.room?.roomCode !== oldRoomCode) {
        throw new Error(t('deleteUnconfirmed'))
      }
      const confirmedRoom = assertRoomSnapshot(response.room)
      setPlayer(null)
      setDraftName('')
      setSelectedCardId(1)
      setPlayerAction(null)
      setOverviewOpen(false)
      setView('lobby')
      if (action === 'leave') {
        // Navigate only after successful deletion; room and other players remain intact.
        window.history.pushState({}, '', '/')
        setRoomCode(null)
        setRoom(null)
        setMessage(t('roomLeft'))
      } else {
        setRoom(confirmedRoom)
        setMessage(t('bingoDeleted'))
      }
    } catch (error) {
      // A lost response must not silently discard the local confirmed state.
      setMessage(t('deleteFailure', {error: errorMessage(error, locale)}))
    } finally { setWorking(false) }
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
      try {
        const snapshot = assertRoomSnapshot(await getRoom(roomCode))
        setRoom(previous => acceptIncomingSnapshot(previous, snapshot) ? snapshot : previous)
      } catch { setMessage(t('joinedPending')) }
    } catch (error) { setMessage(errorMessage(error, locale)) }
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
        throw new Error(t('newerStatePending'))
      }
      setPlayer(previous => previous?.playerId === active.playerId ? recovered.player : previous)
      setRoom(previous => acceptIncomingSnapshot(previous, recovered.room) ? recovered.room : previous)
      setSyncBlocked(false)
      setServerReachable(true)
      setMessage(t('restored'))
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
        } catch { setMessage(t('savedOverviewSync')) }
      } else if (result.status === 'recovered') {
        setPlayer(previous => previous?.playerId === result.player.playerId &&
          previous.playerRevision <= result.player.playerRevision ? result.player : previous)
        setRoom(previous => acceptIncomingSnapshot(previous, result.room) ? result.room : previous)
        setServerReachable(true)
        setMessage(result.conflict
          ? t('conflict')
          : t('lostSave'))
      } else {
        setSyncBlocked(true)
        setServerReachable(false)
        setMessage(result.authFailed
          ? t('authUnverified')
          : t('saveUnverified'))
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
      setMessage(t('linkCopied'))
    } catch { setMessage(t('copyFallback')) }
  }

  return (
    <main class="page-shell">
      <div class="app-frame">
        <header class="topbar">
          <span class="brand-mark brand-mark--gw2" aria-hidden="true">2</span>
          <span class="brand-name">GW2 Bingo</span>
          <span class="status-pill">{roomCode ? t('roomCodeTag', {code: roomCode}) : t('multiplayer')}</span>
          <div class="language-switch" role="group" aria-label="Interface language">
            <button type="button" class={locale === 'de' ? 'language-switch__active' : ''}
              aria-pressed={locale === 'de'} onClick={() => { setLocale('de'); setMessage('') }}>DE</button>
            <span aria-hidden="true">/</span>
            <button type="button" class={locale === 'en' ? 'language-switch__active' : ''}
              aria-pressed={locale === 'en'} onClick={() => { setLocale('en'); setMessage('') }}>EN</button>
          </div>
        </header>

        {roomCode === null ? (
          <section class="lobby lobby--compact" aria-labelledby="page-title">
            <div class="lobby-header"><h1 id="page-title">{t('lobby')}</h1></div>
            <div class="join-panel room-entry">
              <h2>{t('createHeading')}</h2>
              <p>{t('createDescription')}</p>
              <button type="button" class="primary-button" disabled={working || hasInvalidRoomPath} onClick={() => void createNewRoom()}>
                <UiIcon name="plus" />{working ? t('creatingRoom') : t('createRoom')}
              </button>
              {hasInvalidRoomPath && <>
                <p role="alert">{t('invalidLink')}</p>
                <button class="secondary-button" type="button" onClick={() => { window.history.pushState({}, '', '/'); setMessage('') }}>{t('startPage')}</button>
              </>}
            </div>
          </section>
        ) : loadingRoom ? (
          <section class="lobby lobby--compact" aria-live="polite"><h1>{t('loadingRoom')}</h1></section>
        ) : !room ? (
          <section class="lobby lobby--compact">
            <h1>{t('roomUnavailable')}</h1>
            <p>{t('roomUnavailableNote')}</p>
            <button class="secondary-button" type="button" onClick={() => setLoadAttempt(previous => previous + 1)}>{t('retry')}</button>
            <button class="secondary-button" type="button" onClick={() => { window.history.pushState({}, '', '/'); setRoomCode(null); setMessage('') }}>{t('startPage')}</button>
          </section>
        ) : view === 'lobby' || !player ? (
          <section class="lobby lobby--compact" aria-labelledby="page-title">
            <div class="lobby-header">
              <div>
                <h1 id="page-title">{t('lobby')}</h1>
                <p class="lobby-header__subtitle">{t('createHeading')}</p>
              </div>
            </div>
            <div class="lobby-layout lobby-layout--three">
              <section class="join-panel" aria-labelledby="join-title">
                {player ? (
                  <>
                    <h2 id="join-title">{t('welcomeBack', {name: player.name})}</h2>
                    <p>{cardName(player.cardId)} · {playerStatus(player, locale)}</p>
                    <div class="returning-player-actions">
                      <button class="primary-button" type="button" onClick={() => { setMessage(''); setView('game') }}>{t('resume')}</button>
                      <button ref={newBingoButtonRef} class="secondary-button" type="button"
                        disabled={working || saving || recovering || syncBlocked}
                        onClick={() => { playerDialogTriggerRef.current = newBingoButtonRef.current; setPlayerAction('restart') }}>{t('restart')}</button>
                      <button ref={leaveRoomButtonRef} class="secondary-button" type="button"
                        disabled={working || saving || recovering || syncBlocked}
                        onClick={() => { playerDialogTriggerRef.current = leaveRoomButtonRef.current; setPlayerAction('leave') }}><UiIcon name="exit" />{t('leave')}</button>
                    </div>
                    <p class="form-note">{t('lobbyProgressNote')}</p>
                  </>
                ) : (
                  <>
                    <h2 id="join-title">{t('joinHeading')}</h2>
                    <form class="join-form" onSubmit={(event) => void join(event)}>
                      <label for="player-name">{t('yourName')}</label>
                      <input id="player-name" type="text" autoComplete="nickname" maxLength={MAX_PLAYER_NAME_LENGTH}
                        placeholder={t('namePlaceholder')} value={draftName}
                        onInput={event => { setDraftName(event.currentTarget.value); setMessage('') }} required />
                      <div class="card-field-label"><label for="card-choice">{t('selectCard')}</label></div>
                      <CardPicker value={selectedCardId} onChange={setSelectedCardId} />
                      <button class="primary-button" type="submit" disabled={!joinEnabled}>
                        {working ? t('joining') : t('startBingo')}
                      </button>
                    </form>
                  </>
                )}
              </section>
              <aside class="players-panel" aria-labelledby="players-title">
                <div class="panel-heading"><h2 id="players-title">{t('playerOverview')}</h2><span class="panel-count">{t('playerCount', {count: entries.length})}</span></div>
                <PlayerOverview entries={entries} />
                <p class="form-note">{liveConnected ? t('liveUpdate') : t('pollingUpdate')}</p>
              </aside>
              <aside class="room-tools" aria-label={t('roomCode')}>
                <div class="room-tools__card">
                  <span class="room-tools__label">{t('roomCode')}</span>
                  <strong class="room-tools__code">{roomCode}</strong>
                  <button class="secondary-button" type="button" onClick={() => void copyLink()}><UiIcon name="link" />{t('copyLink')}</button>
                </div>
                <button class="room-tools__rules" ref={rulesButtonRef} type="button"
                  onClick={() => showLobbyModal('rules', rulesButtonRef.current)}>
                  <UiIcon name="info" />
                  <span>{t('rulesInfo')}</span>
                  <span aria-hidden="true">›</span>
                </button>
              </aside>
            </div>
            <div class="room-navigation-footer">
              <button class="room-navigation-link" type="button" disabled={working || saving || syncBlocked}
                title={t('startPageHint')}
                onClick={returnToRoomStart}>{t('startPageNewRoom')}</button>
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
                <span class="room-card-label">{cardName(player.cardId)}</span>
                <button class="print-card-action" type="button" onClick={() => window.print()}>
                  <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                    aria-hidden="true" focusable="false">
                    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <path d="M6 14h12v7H6zM18 12h.01" />
                  </svg>
                  {t('printCard')}
                </button>
              </div>
              <div class="player-actions">
                <button ref={overviewButtonRef} class="secondary-button overview-trigger" type="button"
                  onClick={() => setOverviewOpen(true)}><UiIcon name="users" />{t('playerOverview')}</button>
                <button class="secondary-button" type="button" disabled={saving}
                  onClick={() => { setOverviewOpen(false); setView('lobby'); setMessage('') }}><UiIcon name="home" />{t('toLobby')}</button>
                <button ref={leaveRoomButtonRef} class="secondary-button" type="button"
                  disabled={working || saving || recovering || syncBlocked}
                  onClick={() => { playerDialogTriggerRef.current = leaveRoomButtonRef.current; setPlayerAction('leave') }}><UiIcon name="exit" />{t('leave')}</button>
              </div>
            </div>
            <div class={`save-status save-status--${connection}`} role="status" aria-live="polite">
              <span class="save-status__dot" aria-hidden="true" />
              <span>{t(CONNECTION_LABEL_KEYS[connection])}</span>
              {syncBlocked && <button class="preview-link" type="button" disabled={recovering}
                onClick={() => void recoverNow()}>{t('retrySync')}</button>}
            </div>
            <PlayableBoard card={cardFromSnapshot(player.cardId, player.card)} checkedMask={currentMask}
              onToggleSquare={index => void toggleSquare(index)} disabled={saving || syncBlocked || recovering || !browserOnline} />
            <PlayerOverviewDialog open={overviewOpen} entries={entries}
              live={liveConnected} onDismiss={() => setOverviewOpen(false)}
              onAfterClose={() => { setOverviewOpen(false); overviewButtonRef.current?.focus() }} />
          </section>
        )}
        <NewBingoDialog open={playerAction !== null} mode={playerAction ?? 'restart'} busy={working}
          onCancel={() => setPlayerAction(null)} onConfirm={() => void removeOwnPlayer(playerAction)}
          onAfterClose={() => playerDialogTriggerRef.current?.focus()} />
        {message && <p class="room-feedback" role="status">{message}</p>}
      </div>
      {room && player && view === 'game' && (
        <PrintableCard name={player.name} card={cardFromSnapshot(player.cardId, player.card)} />
      )}
    </main>
  )
}
