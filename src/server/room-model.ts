import type { JoinPlayerInput, JoinResult, OwnPlayer } from './player-session'

/** Public, read-only room state. No session cookies or token hashes. */
export interface PublicRoomPlayer {
  playerId: string
  name: string
  cardId: number
  cardVersion: string
  card: string[]
  checkedIndices: number[]
  playerRevision: number
  completed: number
  completedLines: number
  hasBingo: boolean
  online: boolean
}

export interface FirstBingo {
  playerId: string
  name: string
  at: string
}

/** Canonical server progress returned after a square write or conflict. */
export interface SavedProgress {
  playerId: string
  checkedIndices: number[]
  completed: number
  completedLines: number
  hasBingo: boolean
  playerRevision: number
  revision: number
  firstBingo: FirstBingo | null
}

export interface SquareUpdateInput {
  tokenHash: string
  index: number
  checked: boolean
  expectedPlayerRevision: number
}

export type SquareUpdateResult =
  | { status: 'updated' | 'unchanged'; state: SavedProgress }
  | { status: 'stale'; state: SavedProgress }
  | { status: 'session_required' }
  | { status: 'room_not_found' }

export interface RoomSnapshot {
  type: 'room.snapshot'
  roomCode: string
  createdAt: string
  revision: number
  firstBingo: FirstBingo | null
  players: PublicRoomPlayer[]
}

export interface RoomStub {
  fetch(request: Request): Promise<Response>
  initialize(roomCode: string): Promise<boolean>
  getSnapshot(): Promise<RoomSnapshot | null>
  joinPlayer(input: JoinPlayerInput): Promise<JoinResult>
  getPlayerByTokenHash(tokenHash: string): Promise<OwnPlayer | null>
  setPlayerSquare(input: SquareUpdateInput): Promise<SquareUpdateResult>
}
