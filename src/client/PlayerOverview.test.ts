import { describe, expect, it } from 'vitest'
import { nextSelectedPlayerId, positionPlayerPreview } from './PlayerOverview'

describe('stable leaderboard with floating preview', () => {
  const list = { left: 510, right: 900, top: 190, bottom: 420 }

  it('opens, closes and switches using the same player row', () => {
    expect(nextSelectedPlayerId(null, 'demo-mira')).toBe('demo-mira')
    expect(nextSelectedPlayerId('demo-mira', 'demo-mira')).toBeNull()
    expect(nextSelectedPlayerId('demo-mira', 'demo-tom')).toBe('demo-tom')
  })

  it('uses available space to the left when the right side is too narrow', () => {
    const position = positionPlayerPreview(list, 965, 900)
    expect(position.left + position.width).toBeLessThan(list.left)
    expect(position.width).toBeGreaterThanOrEqual(390)
  })

  it('uses the right side if there is enough space', () => {
    const position = positionPlayerPreview({ left: 300, right: 550, top: 100, bottom: 300 }, 1400, 900)
    expect(position.left).toBeGreaterThan(550)
  })

  it('keeps the popup within a narrow viewport', () => {
    const position = positionPlayerPreview({ left: 10, right: 335, top: 90, bottom: 260 }, 350, 740)
    expect(position.left).toBeGreaterThanOrEqual(0)
    expect(position.left + position.width).toBeLessThanOrEqual(350)
    expect(position.top).toBeGreaterThanOrEqual(0)
  })
})
