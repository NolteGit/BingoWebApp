import { assertRoomSnapshot, type RoomSnapshot } from './room-api'

/** Browser socket shares the room-scoped HttpOnly session cookie automatically. */
export function roomWebSocketUrl(origin: string, roomCode: string): string {
  const url = new URL(`/api/rooms/${encodeURIComponent(roomCode)}/events`, origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.href
}

/** Presence-only broadcasts may have the same storage revision. */
export function acceptIncomingSnapshot(current: RoomSnapshot | null, incoming: RoomSnapshot): boolean {
  return current === null || (current.roomCode === incoming.roomCode && incoming.revision >= current.revision)
}

export function parseLiveSnapshot(message: string, roomCode: string): RoomSnapshot | null {
  try {
    const payload: unknown = JSON.parse(message)
    if (!payload || typeof payload !== 'object') return null
    const snapshot = payload as RoomSnapshot
    return snapshot.roomCode === roomCode ? assertRoomSnapshot(snapshot) : null
  } catch {
    return null
  }
}

export interface LiveRoomConnection {
  close(): void
}

/** Reconnect with capped backoff. The UI polls whenever this socket is unavailable. */
export function connectLiveRoom(
  roomCode: string,
  onSnapshot: (snapshot: RoomSnapshot) => void,
  onConnection: (connected: boolean) => void,
): LiveRoomConnection {
  let stopped = false
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let retryMs = 1000

  function connect() {
    if (stopped) return
    try {
      socket = new WebSocket(roomWebSocketUrl(window.location.origin, roomCode))
    } catch {
      scheduleReconnect()
      return
    }
    const currentSocket = socket
    currentSocket.onopen = () => { if (!stopped) { retryMs = 1000; onConnection(true) } }
    currentSocket.onmessage = event => {
      if (stopped || typeof event.data !== 'string') return
      const snapshot = parseLiveSnapshot(event.data, roomCode)
      if (snapshot) onSnapshot(snapshot)
    }
    currentSocket.onerror = () => { currentSocket.close() }
    currentSocket.onclose = () => {
      if (stopped) return
      onConnection(false)
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== null) return
    const delay = Math.round(retryMs * (0.8 + Math.random() * 0.4))
    retryMs = Math.min(retryMs * 2, 30000)
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  connect()
  return {
    close() {
      stopped = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      socket?.close()
    },
  }
}
