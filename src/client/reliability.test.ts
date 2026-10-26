import { getCardById, getFlatSquares } from '../shared/cards'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type OwnPlayer, type RoomSnapshot } from './room-api'
import { connectionState, recoverSavedState, saveSquareSafely, type ReliabilityApi } from './reliability'

const own: OwnPlayer = {
  playerId: 'p1', name: 'Alex', cardId: 7, cardVersion: 'wvw-v2', card: [...getFlatSquares(getCardById(7))], checkedIndices: [12],
  playerRevision: 1, joinedAt: '2026-10-25T00:00:00Z',
}
const room: RoomSnapshot = {
  type: 'room.snapshot', roomCode: 'ABCDEFGH', revision: 2, createdAt: '', firstBingo: null,
  players: [{ ...own, card: [...own.card], completed: 1, completedLines: 0, hasBingo: false, online: true }],
}
const response = { roomCode: 'ABCDEFGH', player: own, revision: 2 }
function api(): ReliabilityApi {
  return {
    getRoom: vi.fn().mockResolvedValue(room),
    getOwnSession: vi.fn().mockResolvedValue(response),
    saveSquare: vi.fn().mockResolvedValue({ playerId: 'p1', playerRevision: 2, checkedIndices: [0, 12],
      completed: 2, completedLines: 0, hasBingo: false, revision: 3, firstBingo: null, status: 'updated' }),
  }
}

describe('save/recovery safety', () => {
  it('uses the confirmed server answer for a successful write', async () => {
    const calls = api()
    const result = await saveSquareSafely('ABCDEFGH', own, 0, true, calls)
    expect(result.status).toBe('saved')
    expect(calls.saveSquare).toHaveBeenCalledWith('ABCDEFGH', 0, true, 1)
    expect(calls.getOwnSession).not.toHaveBeenCalled()
  })
  it('recovers truth after a lost response without resending the write', async () => {
    const calls = api()
    vi.mocked(calls.saveSquare).mockRejectedValue(new ApiError(0, 'NETWORK', 'offline'))
    vi.mocked(calls.getOwnSession).mockResolvedValue({ ...response, player: { ...own, checkedIndices: [0, 12], playerRevision: 2 } })
    const result = await saveSquareSafely('ABCDEFGH', own, 0, true, calls)
    expect(result.status).toBe('recovered')
    if (result.status === 'recovered') expect(result.player.checkedIndices).toEqual([0, 12])
    expect(calls.saveSquare).toHaveBeenCalledTimes(1)
  })
  it('resolves stale multi-tab writes by loading saved state', async () => {
    const calls = api()
    vi.mocked(calls.saveSquare).mockRejectedValue(new ApiError(409, 'STALE_PLAYER_REVISION', 'stale'))
    const result = await saveSquareSafely('ABCDEFGH', own, 0, true, calls)
    expect(result).toMatchObject({ status: 'recovered', conflict: true })
  })
  it('blocks if both the write and recovery fail', async () => {
    const calls = api()
    vi.mocked(calls.saveSquare).mockRejectedValue(new Error('timeout'))
    vi.mocked(calls.getOwnSession).mockRejectedValue(new Error('offline'))
    expect(await saveSquareSafely('ABCDEFGH', own, 0, true, calls)).toEqual({ status: 'blocked', authFailed: false })
  })
  it('refuses edits on a lost session', async () => {
    const calls = api()
    vi.mocked(calls.saveSquare).mockRejectedValue(new ApiError(401, 'SESSION_REQUIRED', 'auth'))
    expect(await saveSquareSafely('ABCDEFGH', own, 0, true, calls)).toEqual({ status: 'blocked', authFailed: true })
  })
  it('rejects wrong-player, wrong-room and older recovery responses', async () => {
    const calls = api()
    vi.mocked(calls.getOwnSession).mockResolvedValueOnce({ ...response, player: { ...own, playerId: 'p2' } })
    await expect(recoverSavedState('ABCDEFGH', 'p1', 1, calls)).rejects.toThrow()
    vi.mocked(calls.getOwnSession).mockResolvedValueOnce({ ...response, roomCode: 'IJKLMNOP' })
    await expect(recoverSavedState('ABCDEFGH', 'p1', 1, calls)).rejects.toThrow()
    await expect(recoverSavedState('ABCDEFGH', 'p1', 2, calls)).rejects.toThrow('older game state')
  })
  it('refuses malformed stored square data before allowing edits', async () => {
    const calls = api()
    vi.mocked(calls.getOwnSession).mockResolvedValue({ ...response, player: { ...own, checkedIndices: [0] } })
    await expect(recoverSavedState('ABCDEFGH', 'p1', 1, calls)).rejects.toThrow()
  })
  it('does not trust a malformed successful write response', async () => {
    const calls = api()
    vi.mocked(calls.saveSquare).mockResolvedValue({ playerId: 'p2', playerRevision: 2, checkedIndices: [12],
      completed: 1, completedLines: 0, hasBingo: false, revision: 3, firstBingo: null, status: 'updated' })
    expect((await saveSquareSafely('ABCDEFGH', own, 0, true, calls)).status).toBe('recovered')
  })
})

describe('connection indicator', () => {
  const base = { saving: false, recovering: false, blocked: false, online: true, serverReachable: true, live: true }
  it('differentiates live, polling, saving, recovering, and blocked', () => {
    expect(connectionState(base)).toBe('live')
    expect(connectionState({ ...base, live: false })).toBe('polling')
    expect(connectionState({ ...base, saving: true })).toBe('saving')
    expect(connectionState({ ...base, recovering: true })).toBe('recovering')
    expect(connectionState({ ...base, blocked: true })).toBe('unverified')
    expect(connectionState({ ...base, online: false })).toBe('offline')
  })
})
