import type { JoinPlayerInput, JoinResult, OwnPlayer } from './player-session'

/** Public, read-only room state. No session cookies or token hashes. */
export interface PublicRoomPlayer {
  playerId: string
  name: string
  cardId: number
  cardVersion: string
  card: string[]
  checkedIndices: number[]
  completed: number
  completedLines: number
  hasBingo: boolean
  online: boolean
}

export interface RoomSnapshot {
  type: 'room.snapshot'
  roomCode: string
  createdAt: string
  revision: number
  firstBingo: null
  players: PublicRoomPlayer[]
}

export interface RoomStub {
  initialize(roomCode: string): Promise<boolean>
  getSnapshot(): Promise<RoomSnapshot | null>
  joinPlayer(input: JoinPlayerInput): Promise<JoinResult>
  getPlayerByTokenHash(tokenHash: string): Promise<OwnPlayer | null>
}
