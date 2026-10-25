import {
  ApiError, assertRoomSnapshot, checkedIndicesToMask, getOwnSession, getRoom, saveSquare,
  type OwnPlayer, type RoomSnapshot, type SquareResponse,
} from './room-api'

/** Only a complete, verified room + own-player read may unlock uncertain writes. */
export async function recoverSavedState(
  code: string,
  expectedPlayerId: string,
  minimumPlayerRevision: number,
  api: Pick<ReliabilityApi, 'getOwnSession' | 'getRoom'> = defaultApi,
): Promise<{ player: OwnPlayer; room: RoomSnapshot }> {
  const [session, snapshot] = await Promise.all([api.getOwnSession(code), api.getRoom(code)])
  const room = assertRoomSnapshot(snapshot)
  const player = session.player
  if (session.roomCode !== code || room.roomCode !== code || player.playerId !== expectedPlayerId) {
    throw new Error('Spielsitzung passt nicht zum gespeicherten Spieler.')
  }
  if (!room.players.some(entry => entry.playerId === player.playerId)) {
    throw new Error('Spieler wurde in der Raumübersicht nicht gefunden.')
  }
  if (player.playerRevision < minimumPlayerRevision) {
    throw new Error('Server meldet einen älteren als den zuletzt bestätigten Spielstand.')
  }
  checkedIndicesToMask(player.checkedIndices)
  return { player, room }
}

export interface ReliabilityApi {
  saveSquare: typeof saveSquare
  getOwnSession: typeof getOwnSession
  getRoom: typeof getRoom
}

const defaultApi: ReliabilityApi = { saveSquare, getOwnSession, getRoom }

export type SafeSaveResult =
  | { status: 'saved'; state: SquareResponse }
  | { status: 'recovered'; player: OwnPlayer; room: RoomSnapshot; conflict: boolean }
  | { status: 'blocked'; authFailed: boolean }

/** The server uses explicit set/unset requests. Never blindly resend an uncertain write. */
export async function saveSquareSafely(
  code: string,
  player: OwnPlayer,
  index: number,
  checked: boolean,
  api: ReliabilityApi = defaultApi,
): Promise<SafeSaveResult> {
  try {
    const saved = await api.saveSquare(code, index, checked, player.playerRevision)
    if (saved.playerId !== player.playerId || saved.playerRevision < player.playerRevision) {
      throw new Error('Ungültige Speicherbestätigung.')
    }
    checkedIndicesToMask(saved.checkedIndices)
    return { status: 'saved', state: saved }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { status: 'blocked', authFailed: true }
    // A lost HTTP response may mean the square *was* saved. Read canonical state first.
    try {
      const recovered = await recoverSavedState(code, player.playerId, player.playerRevision, api)
      return { status: 'recovered', ...recovered,
        conflict: error instanceof ApiError && error.code === 'STALE_PLAYER_REVISION' }
    } catch {
      // Do not guess if the write succeeded. Only a later verified read unlocks editing.
      return { status: 'blocked', authFailed: false }
    }
  }
}

export type ConnectionState = 'live' | 'polling' | 'saving' | 'recovering' | 'offline' | 'unverified'

export function connectionState(input: {
  saving: boolean; recovering: boolean; blocked: boolean; online: boolean;
  serverReachable: boolean; live: boolean
}): ConnectionState {
  if (input.recovering) return 'recovering'
  if (input.saving) return 'saving'
  if (input.blocked) return 'unverified'
  if (!input.online || !input.serverReachable) return 'offline'
  return input.live ? 'live' : 'polling'
}

export const CONNECTION_LABELS: Record<ConnectionState, string> = {
  live: 'Live · gespeichert',
  polling: 'Verbunden · gespeichert (Abfrage)',
  saving: 'Speichern…',
  recovering: 'Synchronisiere…',
  offline: 'Verbindung verloren · letzter bestätigter Stand',
  unverified: 'Speicherung unbestätigt · Klicks gesperrt',
}
