import { describe, expect, it } from 'vitest'
import {
  createSessionToken, expiredSessionCookie, extractSessionToken, hashSessionToken, parseCardId,
  parsePlayerName, sessionCookie, sessionCookieName,
} from './player-session'

describe('player input and private cookies', () => {
  it('normalizes names and enforces length and control-character rules', () => {
    expect(parsePlayerName('  Mira   Nolte ')).toEqual({ name: 'Mira Nolte', nameKey: 'mira nolte' })
    expect(parsePlayerName('M')).toBeNull()
    expect(parsePlayerName('x'.repeat(25))).toBeNull()
    expect(parsePlayerName('Mi\u0000ra')).toBeNull()
    expect(parsePlayerName(123)).toBeNull()
    expect(parsePlayerName('Änne')?.nameKey).toBe('änne')
  })

  it('accepts integer card ids 1–10 only', () => {
    expect(parseCardId(1)).toBe(1)
    expect(parseCardId(10)).toBe(10)
    for (const value of [0, 11, 1.5, '7', null]) expect(parseCardId(value)).toBeNull()
  })

  it('generates unguessable tokens and room-scoped HttpOnly cookies', async () => {
    const token = createSessionToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
    expect(createSessionToken()).not.toBe(token)
    const hash = await hashSessionToken(token)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toBe(token)
    const cookie = sessionCookie('ABCDEFGH', token, true)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api/rooms/ABCDEFGH')
    expect(sessionCookie('ABCDEFGH', token, false)).not.toContain('; Secure')
    expect(sessionCookieName('ABCDEFGH')).toBe('bingo_session_ABCDEFGH')
    expect(extractSessionToken(`other=123; bingo_session_ABCDEFGH=${token}`, 'ABCDEFGH')).toBe(token)
    expect(extractSessionToken(`bingo_session_ZZZZZZZZ=${token}`, 'ABCDEFGH')).toBeNull()
    expect(extractSessionToken('bingo_session_ABCDEFGH=broken', 'ABCDEFGH')).toBeNull()
  })
  it('expires the exact room-scoped cookie without touching another room', () => {
    const expired = expiredSessionCookie('ABCDEFGH', true)
    expect(expired).toContain('bingo_session_ABCDEFGH=;')
    expect(expired).toContain('Path=/api/rooms/ABCDEFGH')
    expect(expired).toContain('Max-Age=0')
    expect(expired).toContain('HttpOnly')
    expect(expired).toContain('Secure')
    expect(expiredSessionCookie('ABCDEFGH', false)).not.toContain('; Secure')
  })

})
