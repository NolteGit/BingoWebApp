import { describe, expect, it } from 'vitest'
import { generateRoomCode, normalizeRoomCode, ROOM_CODE_LENGTH } from './room-code'

describe('room invite codes', () => {
  it('generates valid nontrivial 8-character codes', () => {
    const codes = Array.from({ length: 64 }, () => generateRoomCode())
    expect(codes.every((code) => code.length === ROOM_CODE_LENGTH && normalizeRoomCode(code) === code)).toBe(true)
    expect(new Set(codes).size).toBeGreaterThan(60)
  })
  it('normalizes lowercase and rejects malformed codes', () => {
    expect(normalizeRoomCode('abcdefgh')).toBe('ABCDEFGH')
    expect(normalizeRoomCode('AAAAAAA0')).toBeNull()
    expect(normalizeRoomCode('AAAAAAA/')).toBeNull()
    expect(normalizeRoomCode(' AAAAAAAA ')).toBeNull()
    expect(normalizeRoomCode('AAAAAAA')).toBeNull()
  })
})
