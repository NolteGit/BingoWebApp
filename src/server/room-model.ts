/** Public contract. No authentication credentials or internal storage keys here. */
export interface RoomSnapshot {
  type: 'room.snapshot'
  roomCode: string
  createdAt: string
  revision: number
  firstBingo: null
  players: []
}

export interface RoomStub {
  initialize(roomCode: string): Promise<boolean>
  getSnapshot(): Promise<RoomSnapshot | null>
}
