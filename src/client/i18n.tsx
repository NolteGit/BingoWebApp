import { createContext, type ComponentChildren } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'
import { RANDOM_CARD_ID } from '../shared/cards'

/** All human-facing UI copy belongs here. Bingo objective text stays in data/tasks.json. */
export const strings = {
  de: {
    multiplayer: 'Mehrspieler', roomCodeTag: 'Raum {code}', lobby: 'Lobby',
    createHeading: 'Gemeinsam Bingo spielen', createDescription: 'Erstelle einen Raum und teile den Link mit deinen Freunden. Wer später dazukommt, kann direkt mitspielen.',
    createRoom: 'Neuen Raum erstellen', creatingRoom: 'Raum wird erstellt…', invalidLink: 'Ungültiger Raumlink. Bitte den vollständigen Einladungslink verwenden.',
    startPage: 'Zur Startseite', loadingRoom: 'Lade Raum…', roomUnavailable: 'Raum nicht erreichbar', roomUnavailableNote: 'Der Raum konnte nicht geladen werden. Die gespeicherten Daten werden dadurch nicht gelöscht.',
    retry: 'Erneut laden', rulesInfo: 'Regeln & Infos', roomCode: 'Raumcode:', copyLink: 'Link kopieren',
    welcomeBack: 'Willkommen zurück, {name}', resume: 'Bingo fortsetzen', restart: 'Neues Bingo starten', leave: 'Raum verlassen',
    lobbyProgressNote: 'Dein Fortschritt bleibt beim Wechsel zur Lobby gespeichert.', joinHeading: 'Bingo beitreten',
    yourName: 'Dein Name', namePlaceholder: 'Spielername eingeben', selectCard: 'Karte auswählen', joining: 'Beitritt läuft…', startBingo: 'Bingo starten',
    playerOverview: 'Spielerübersicht', playerCount: '{count} Spieler', liveUpdate: 'Live verbunden – Änderungen erscheinen sofort.', pollingUpdate: 'Aktualisierung alle 5 Sekunden (Fallback).',
    startPageNewRoom: '← Zur Startseite (weiteren Raum erstellen)', startPageHint: 'Zur Startseite wechseln. Der bisherige Raum und Spielstand bleiben gespeichert.',
    compare: 'Spielerübersicht', toLobby: 'Zur Lobby', retrySync: 'Erneut prüfen',
    previewOnlyLive: 'Live verbunden. Die Vorschau ist schreibgeschützt.', previewOnlyPolling: 'Verbindung wird wiederhergestellt. Bis dahin Aktualisierung alle 5 Sekunden.',
    deleteUnconfirmed: 'Löschung konnte nicht bestätigt werden. Bitte erneut versuchen.', roomLeft: 'Du hast den Raum verlassen.',
    bingoDeleted: 'Altes Bingo gelöscht. Du kannst jetzt neu starten.', deleteFailure: 'Löschung nicht bestätigt: {error} Bitte ggf. Seite neu laden.',
    joinedPending: 'Beitritt erfolgreich. Die Spielerübersicht aktualisiert sich gleich.', savedOverviewSync: 'Feld gespeichert. Spielerübersicht wird wieder synchronisiert.', newerStatePending: 'Ein neuerer Spielstand wird noch abgeglichen.',
    restored: 'Verbindung wiederhergestellt. Gespeicherten Stand geladen – bitte letztes Häkchen prüfen.',
    conflict: 'Fortschritt wurde in einem anderen Tab geändert. Aktuellen Stand geladen – bitte erneut klicken.',
    lostSave: 'Speicherantwort verloren. Serverstand geprüft – bitte letztes Häkchen kontrollieren.',
    authUnverified: 'Spielsitzung nicht bestätigt. Fortschritt bleibt erhalten; Sitzung im selben Browser wiederherstellen.',
    saveUnverified: 'Speicherung unbestätigt. Prüfe den Serverstand automatisch – weitere Klicks vorerst gesperrt.',
    linkCopied: 'Einladungslink kopiert.', copyFallback: 'Bitte den Raumlink aus der Adresszeile kopieren.',
    card: 'Karte {id}', randomCard: 'Zufallskarte', freeField: 'FREIFELD', freeFieldAria: 'Freifeld',
    preview: 'Vorschau: {card}', previewSubtitle: '5 × 5 · Bonusfeld in der Mitte',
    availableCards: 'Verfügbare Bingokarten', previewPending: 'Vorschau · noch nicht übernommen', closePicker: 'Kartenauswahl schließen',
    sampleRandom: 'Beispielkarte – beim Start erhältst du eine neu gemischte Karte.', chooseCardDialog: 'Bingokarte auswählen',
    gameComparison: 'Spielervergleich', close: 'Schließen', comparisonDemo: 'Nur dein eigener Fortschritt ist echt. Mira und Tom sind Beispieldaten.',
    playerCardView: 'Kartenansicht von {name}', example: '(Beispiel)', cardDetail: '{card} · {squares}/25 Felder · {lines}/12 Bingo-Linien', readOnlyNote: 'Nur ansehen – die Felder können hier nicht geändert werden.',
    emptyPlayers: 'Noch keine Spieler', emptyPlayersNote: 'Sobald jemand beitritt, erscheint hier sein Fortschritt.',
    playersAndProgress: 'Spieler und Fortschritt', playerSummaryAria: '{name}, {card}, {squares} von 25 Feldern, {lines} Bingo-Linien. Karte ansehen',
    online: 'online', offline: 'offline', bingoCount: '{count} Bingo', cardOf: 'Karte von {name}', closePreview: 'Kartenvorschau schließen',
    readOnlyBoard: 'Schreibgeschützte Bingokarte: {card}', checked: 'abgehakt', unchecked: 'offen',
    gameCard: 'Bingokarte: {card}', ownCard: 'Deine Bingokarte: {card}', boardHelp: 'Ein Feld anklicken zum Abhaken, erneut anklicken zum Entfernen. Das Bonusfeld bleibt aktiv.',
    fields: 'Felder', bingoLines: 'Bingo-Linien', markedSquares: 'Abgehakte Felder',
    bingoWon: '🎉 BINGO! {count} {lines} geschafft!', lineSingular: 'Linie', linePlural: 'Linien',
    squareAria: 'Zeile {row}, Spalte {column}: {task}, {state}',
    restartTitle: 'Neues Bingo starten?', leaveTitle: 'Raum verlassen?',
    restartDescription: 'Deine bisherige Karte und alle Häkchen werden gelöscht.', leaveDescription: 'Deine Karte und dein Fortschritt werden gelöscht.',
    cancel: 'Abbrechen', deleting: 'Wird gelöscht…', confirmLeave: 'Verlassen & löschen', confirmRestart: 'Löschen & neu starten',
    rulesHeading: 'So funktioniert Bingo', rule1Start: 'Das mittlere', rule1End: 'ist ein Freifeld und zählt sofort.',
    rule2: 'Hake ein Feld ab, sobald das Ereignis während des Spiels passiert.',
    rule3: 'Führe Ereignisse nicht absichtlich herbei – der Spaß steht im Vordergrund.',
    rule4Start: 'Wer zuerst eine Reihe, Spalte oder Diagonale vervollständigt, ruft',
    cardChoices: 'Auswahl der Karten', rulesCards: 'Alle zehn Karten sind frei wählbar.',
    rulesCardsBold: 'Mehrere Spieler dürfen dieselbe Karte verwenden.', rulesCardsEnd: 'Jede Person verfolgt ihren Fortschritt unabhängig.',
    rulesSaved: 'Deine Karte wird im gemeinsamen Raum gespeichert. Mehrere Spieler können unabhängig dieselbe Karte wählen.',
    previewCardTitle: '{card} ansehen', previewNote: 'Nur ansehen: Die Karte wird erst mit „Bingo starten“ übernommen.',
    progressDiscard: 'Fortschritt verwerfen', exitCardTitle: 'Bingokarte verlassen?',
    exitCardDescription: 'Wenn du das Spiel verlässt, werden deine aktuelle Bingokarte und dein Fortschritt gelöscht. Im lokalen Prototyp bleibt nichts gespeichert. Ein Abbruch ändert nichts an deinen Häkchen.',
    exitAndDelete: 'Verlassen und löschen', changeCardTitle: 'Karte wechseln?',
    changeCardDescription1: 'Wenn du zu', changeCardDescription2: 'wechselst, werden deine bisherigen Häkchen und Bingo-Linien zurückgesetzt. Die aktuelle Karte bleibt erhalten, wenn du abbrichst.',
    changeAndReset: 'Wechseln und zurücksetzen',
    connectLive: 'Live · gespeichert', connectPolling: 'Verbunden · gespeichert (Abfrage)', connectSaving: 'Speichern…',
    connectRecovering: 'Synchronisiere…', connectOffline: 'Verbindung verloren · letzter bestätigter Stand',
    connectUnverified: 'Speicherung unbestätigt · Klicks gesperrt',
    unknownError: 'Unbekannter Fehler. Bitte erneut versuchen.', networkError: 'Keine Verbindung zum Server. Bitte erneut versuchen.', invalidResponse: 'Ungültige Serverantwort.', requestFailed: 'Anfrage fehlgeschlagen.',
    invalidRoomData: 'Ungültige Raumdaten.', invalidBoardData: 'Ungültige gespeicherte Bingokarte.',
    missingSessionPlayer: 'Spielsitzung passt nicht zum gespeicherten Spieler.', missingRoomPlayer: 'Spieler wurde in der Raumübersicht nicht gefunden.', oldServerProgress: 'Server meldet einen älteren als den zuletzt bestätigten Spielstand.',
    invalidSaveResponse: 'Ungültige Speicherbestätigung.',
    RATE_LIMITED: 'Zu viele Anfragen. Bitte in einer Minute erneut versuchen.', FORBIDDEN_ORIGIN: 'Anfragen von anderen Websites sind nicht erlaubt.',
    ROOM_CREATION_FAILED: 'Raum konnte nicht erstellt werden. Bitte erneut versuchen.', INVALID_ROOM_CODE: 'Ungültiger Raumcode.',
    UPGRADE_REQUIRED: 'WebSocket-Verbindung erforderlich.', ROOM_NOT_FOUND: 'Raum nicht gefunden.',
    PAYLOAD_TOO_LARGE: 'Anfrage ist zu groß.', INVALID_JSON: 'Ungültige JSON-Anfrage.',
    INVALID_NAME: 'Bitte einen Namen mit 2 bis 24 Zeichen eingeben.', INVALID_CARD: 'Bitte eine gültige Karte (1–10 oder Zufallskarte) auswählen.',
    NAME_TAKEN: 'Dieser Name ist bereits vergeben.', SESSION_REQUIRED: 'Keine gültige Spielsitzung für diesen Raum.',
    INVALID_SQUARE: 'Feldnummer muss zwischen 0 und 24 liegen.', INVALID_SQUARE_UPDATE: 'checked und expectedPlayerRevision sind erforderlich.',
    FREE_SQUARE_LOCKED: 'Das Bonusfeld kann nicht abgewählt werden.', STALE_PLAYER_REVISION: 'Fortschritt hat sich geändert. Bitte aktualisieren und erneut versuchen.',
    NOT_FOUND: 'API-Endpunkt nicht gefunden.', NETWORK: 'Keine Verbindung zum Server. Bitte erneut versuchen.', INVALID_RESPONSE: 'Ungültige Serverantwort.', REQUEST_FAILED: 'Anfrage fehlgeschlagen.',
  },
  en: {
    multiplayer: 'Multiplayer', roomCodeTag: 'Room {code}', lobby: 'Lobby',
    createHeading: 'Play Bingo together', createDescription: 'Create a room and share the link with your friends. Players can join later, too.',
    createRoom: 'Create new room', creatingRoom: 'Creating room…', invalidLink: 'Invalid room link. Please use the complete invitation link.',
    startPage: 'Back to start', loadingRoom: 'Loading room…', roomUnavailable: 'Room unavailable', roomUnavailableNote: 'The room could not be loaded. This does not delete any saved progress.',
    retry: 'Try again', rulesInfo: 'Rules & info', roomCode: 'Room code:', copyLink: 'Copy link',
    welcomeBack: 'Welcome back, {name}', resume: 'Resume Bingo', restart: 'Start a new Bingo', leave: 'Leave room',
    lobbyProgressNote: 'Your progress stays saved when you return to the lobby.', joinHeading: 'Join Bingo',
    yourName: 'Your name', namePlaceholder: 'Enter player name', selectCard: 'Choose card', joining: 'Joining…', startBingo: 'Start Bingo',
    playerOverview: 'Player overview', playerCount: '{count} players', liveUpdate: 'Live connection – updates appear instantly.', pollingUpdate: 'Refreshing every 5 seconds (fallback).',
    startPageNewRoom: '← Back to start (create another room)', startPageHint: 'Go back to the start screen. This room and all progress stay saved.',
    compare: 'Player overview', toLobby: 'Back to lobby', retrySync: 'Check again',
    previewOnlyLive: 'Live connection. Card previews are read-only.', previewOnlyPolling: 'Reconnecting. Updating every 5 seconds until then.',
    deleteUnconfirmed: 'Could not confirm deletion. Please try again.', roomLeft: 'You have left the room.',
    bingoDeleted: 'Previous Bingo deleted. You can now start again.', deleteFailure: 'Deletion not confirmed: {error} Please reload the page if needed.',
    joinedPending: 'You joined successfully. The player list will update shortly.', savedOverviewSync: 'Square saved. Player overview is synchronizing.', newerStatePending: 'A newer game state is still being synchronized.',
    restored: 'Connection restored. Saved state loaded – please check your last marked square.',
    conflict: 'Progress changed in another tab. Latest state loaded – please click again.',
    lostSave: 'Save response lost. Server state checked – please verify your last marked square.',
    authUnverified: 'Session could not be verified. Progress is preserved; restore the session in the same browser.',
    saveUnverified: 'Save unconfirmed. Checking the server state automatically – further clicks are blocked for now.',
    linkCopied: 'Invitation link copied.', copyFallback: 'Please copy the room link from the address bar.',
    card: 'Card {id}', randomCard: 'Random card', freeField: 'FREE SPACE', freeFieldAria: 'free space',
    preview: 'Preview: {card}', previewSubtitle: '5 × 5 · Free center space',
    availableCards: 'Available Bingo cards', previewPending: 'Preview · not selected yet', closePicker: 'Close card picker',
    sampleRandom: 'Example card – a new random card is created when you start.', chooseCardDialog: 'Choose Bingo card',
    gameComparison: 'Player comparison', close: 'Close', comparisonDemo: 'Only your own progress is real. Mira and Tom are examples.',
    playerCardView: "{name}'s card", example: '(Example)', cardDetail: '{card} · {squares}/25 squares · {lines}/12 Bingo lines', readOnlyNote: 'Preview only – you cannot change any squares here.',
    emptyPlayers: 'No players yet', emptyPlayersNote: 'Player progress will appear here once someone joins.',
    playersAndProgress: 'Players and progress', playerSummaryAria: '{name}, {card}, {squares} of 25 squares, {lines} Bingo lines. View card',
    online: 'online', offline: 'offline', bingoCount: '{count} Bingo', cardOf: 'Card of {name}', closePreview: 'Close card preview',
    readOnlyBoard: 'Read-only Bingo card: {card}', checked: 'checked', unchecked: 'unchecked',
    gameCard: 'Bingo card: {card}', ownCard: 'Your Bingo card: {card}', boardHelp: 'Click a square to mark it, click again to unmark it. The free center space stays marked.',
    fields: 'Squares', bingoLines: 'Bingo lines', markedSquares: 'Marked squares',
    bingoWon: '🎉 BINGO! {count} {lines} completed!', lineSingular: 'line', linePlural: 'lines',
    squareAria: 'Row {row}, column {column}: {task}, {state}',
    restartTitle: 'Start a new Bingo?', leaveTitle: 'Leave room?',
    restartDescription: 'Your current card and all marks will be deleted.', leaveDescription: 'Your card and progress will be deleted.',
    cancel: 'Cancel', deleting: 'Deleting…', confirmLeave: 'Leave & delete', confirmRestart: 'Delete & restart',
    rulesHeading: 'How Bingo works', rule1Start: 'The center', rule1End: 'is a free space and counts immediately.',
    rule2: 'Mark a square once its event happens during the game.',
    rule3: 'Do not intentionally cause events – having fun is the priority.',
    rule4Start: 'The first player to complete a row, column or diagonal calls',
    cardChoices: 'Card selection', rulesCards: 'All ten preset cards are available.',
    rulesCardsBold: 'Multiple players may choose the same card.', rulesCardsEnd: 'Everyone tracks their own progress.',
    rulesSaved: 'Your card is saved in the shared room. Several players can choose the same card independently.',
    previewCardTitle: 'View {card}', previewNote: 'Preview only: The card is selected when you choose “Start Bingo”.',
    progressDiscard: 'Discard progress', exitCardTitle: 'Leave Bingo card?',
    exitCardDescription: 'Leaving this game deletes your current card and progress. The local prototype does not save anything. Canceling keeps your marks.',
    exitAndDelete: 'Leave and delete', changeCardTitle: 'Change card?',
    changeCardDescription1: 'Switching to', changeCardDescription2: 'will reset your previous marks and Bingo lines. Canceling preserves the current card.',
    changeAndReset: 'Change and reset',
    connectLive: 'Live · saved', connectPolling: 'Connected · saved (polling)', connectSaving: 'Saving…',
    connectRecovering: 'Syncing…', connectOffline: 'Connection lost · last confirmed state',
    connectUnverified: 'Save unconfirmed · clicks disabled',
    unknownError: 'Unknown error. Please try again.', networkError: 'Cannot reach the server. Please try again.', invalidResponse: 'Invalid server response.', requestFailed: 'Request failed.',
    invalidRoomData: 'Invalid room data.', invalidBoardData: 'Invalid saved Bingo card.',
    missingSessionPlayer: 'The session does not match the saved player.', missingRoomPlayer: 'Player not found in the room overview.', oldServerProgress: 'The server reported an older game state than the last confirmed state.',
    invalidSaveResponse: 'Invalid save confirmation.',
    RATE_LIMITED: 'Too many requests. Please try again in a minute.', FORBIDDEN_ORIGIN: 'Requests from other websites are not allowed.',
    ROOM_CREATION_FAILED: 'Could not create a room. Please try again.', INVALID_ROOM_CODE: 'Invalid room code.',
    UPGRADE_REQUIRED: 'WebSocket upgrade required.', ROOM_NOT_FOUND: 'Room not found.',
    PAYLOAD_TOO_LARGE: 'Request is too large.', INVALID_JSON: 'Invalid JSON request.',
    INVALID_NAME: 'Enter a name containing 2 to 24 characters.', INVALID_CARD: 'Choose a valid card (1–10 or Random card).',
    NAME_TAKEN: 'This name is already in use.', SESSION_REQUIRED: 'No valid game session for this room.',
    INVALID_SQUARE: 'Square index must be between 0 and 24.', INVALID_SQUARE_UPDATE: 'checked and expectedPlayerRevision are required.',
    FREE_SQUARE_LOCKED: 'The free center space cannot be unchecked.', STALE_PLAYER_REVISION: 'Progress changed. Please refresh and try again.',
    NOT_FOUND: 'API endpoint not found.', NETWORK: 'Cannot reach the server. Please try again.', INVALID_RESPONSE: 'Invalid server response.', REQUEST_FAILED: 'Request failed.',
  },
} as const

export type Locale = keyof typeof strings
export type TranslationKey = keyof typeof strings.de
export type TranslationArgs = Record<string, string | number>

/** Keep replacements plain-text; Preact escapes any values when rendering. */
export function translate(locale: Locale, key: TranslationKey, vars: TranslationArgs = {}): string {
  const template: string = strings[locale][key]
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(vars[token] ?? `{${token}}`))
}

export function cardLabel(cardId: number, locale: Locale): string {
  return cardId === RANDOM_CARD_ID ? translate(locale, 'randomCard') : translate(locale, 'card', { id: cardId })
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}
const LanguageContext = createContext<LanguageContextValue>({ locale: 'de', setLocale: () => {} })

/** Fresh page loads always start in German; no cookie or localStorage is written. */
export function LanguageProvider({ children, initialLocale = 'de' }: { children: ComponentChildren; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const { locale, setLocale } = useContext(LanguageContext)
  const t = (key: TranslationKey, vars?: TranslationArgs) => translate(locale, key, vars)
  const cardName = (id: number) => cardLabel(id, locale)
  return { locale, setLocale, t, cardName }
}
