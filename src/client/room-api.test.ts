import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, checkedIndicesToMask, createRoom, deleteOwnBingo, getOwnSession, joinRoom, roomCodeFromPath, saveSquare } from './room-api'
import { getBingoProgress } from '../shared/bingo'
import { entriesFromRoom } from './room-view'
import type { RoomSnapshot } from './room-api'

afterEach(() => vi.unstubAllGlobals())

describe('room integration', () => {
  it('parses only the intended room route', () => {
    expect(roomCodeFromPath('/r/9nc3l2p8')).toBe('9NC3L2P8')
    expect(roomCodeFromPath('/r/9NC3L2P8/')).toBe('9NC3L2P8')
    expect(roomCodeFromPath('/r/')).toBeNull()
    expect(roomCodeFromPath('/')).toBeNull()
    expect(roomCodeFromPath('/r/abc')).toBeNull()
  })

  it('reconstructs exactly the saved marks and rejects invalid data', () => {
    const mask = checkedIndicesToMask([0, 4, 12])
    expect(getBingoProgress(mask).checkedIndices).toEqual([0, 4, 12])
    expect(() => checkedIndicesToMask([0])).toThrow()
    expect(() => checkedIndicesToMask([12, 25])).toThrow()
  })

  it('maps public room players into one reusable leaderboard', () => {
    const room: RoomSnapshot = {
      type: 'room.snapshot', roomCode: '9NC3L2P8', createdAt: '', revision: 1, firstBingo: null,
      players: [{ playerId: 'p1', name: 'Mira', cardId: 7, cardVersion: 'wvw-v1', card: [],
        checkedIndices: [0, 12], playerRevision: 1, completed: 2, completedLines: 0,
        hasBingo: false, online: false }],
    }
    expect(entriesFromRoom(room)).toEqual([{ id: 'p1', name: 'Mira', cardId: 7, kind: 'player',
      checkedMask: checkedIndicesToMask([0, 12]), online: false }])
  })

  it('creates, joins and saves via same-origin cookie-authenticated calls', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ roomCode: '9NC3L2P8', roomUrl: '/r/9NC3L2P8' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player: { playerId: 'p1' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player: { playerId: 'p1' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'updated', checkedIndices: [0, 12], playerRevision: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await createRoom()
    await joinRoom('9NC3L2P8', 'Henrik', 7)
    await getOwnSession('9NC3L2P8')
    await saveSquare('9NC3L2P8', 0, true, 0)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/rooms/9NC3L2P8/join')
    expect(fetchMock.mock.calls[3][0]).toBe('/api/rooms/9NC3L2P8/me/squares/0')
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ credentials: 'same-origin', method: 'PUT',
      body: JSON.stringify({ checked: true, expectedPlayerRevision: 0 }) })
  })

  it('preserves explicit HTTP conflict metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409,
      json: async () => ({ error: { code: 'STALE_PLAYER_REVISION', message: 'Fortschritt geändert.' } }) }))
    await expect(saveSquare('9NC3L2P8', 0, true, 0))
      .rejects.toMatchObject({ status: 409, code: 'STALE_PLAYER_REVISION' } satisfies Partial<ApiError>)
  })

  it('deletes only the current room player using the private same-origin session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      status: 'deleted', roomCode: '9NC3L2P8', playerId: 'p1', room: {
        type: 'room.snapshot', roomCode: '9NC3L2P8', players: [], revision: 2,
      },
    }) })
    vi.stubGlobal('fetch', fetchMock)
    await deleteOwnBingo('9NC3L2P8')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/rooms/9NC3L2P8/me')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE', credentials: 'same-origin' })
  })

})
