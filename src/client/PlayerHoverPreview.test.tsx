import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { cardFromSnapshot, RANDOM_CARD_ID } from '../shared/cards'
import { PlayerHoverPreview } from './PlayerHoverPreview'
import { positionPlayerPreview } from './player-preview-position'

const noop = () => undefined
const customLabels = Array.from({ length: 25 }, (_, index) => index === 12 ? 'Bonusfeld' : `Saved task ${index}`)
const mask = setSquareChecked(createInitialCheckedMask(), 0, true)
const entry = {
  id: 'player-1', name: 'Henrik', cardId: RANDOM_CARD_ID,
  card: cardFromSnapshot(RANDOM_CARD_ID, customLabels), checkedMask: mask,
  kind: 'player' as const, online: true,
}

describe('player hover preview', () => {
  it('shows the server-saved random objectives and confirmed progress, read-only', () => {
    const html = render(<PlayerHoverPreview entry={entry} left={12} top={20} pinned={false} onClose={noop} />)
    expect(html).toContain('Henrik')
    expect(html).toContain('Zufallskarte')
    expect(html).toContain('Saved task 0')
    expect(html).toContain('Saved task 24')
    expect(html).toContain('2/25')
    expect(html).toContain('FREIFELD')
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html.match(/play-square--checked/g)).toHaveLength(2)
    expect(html).not.toContain('Karte 1')
    expect(html).not.toContain('<button')
  })

  it('highlights all five squares of a completed Bingo line', () => {
    const bingoMask = [0, 1, 2, 3, 4].reduce((current, index) =>
      setSquareChecked(current, index, true), createInitialCheckedMask())
    const html = render(<PlayerHoverPreview entry={{ ...entry, checkedMask: bingoMask }}
      left={12} top={20} pinned={false} onClose={noop} />)
    expect(html).toContain('1/12 Bingo-Linien')
    expect(html.match(/play-square--winning/g)).toHaveLength(5)
  })

  it('offers an accessible close button when pinned for touch or keyboard users', () => {
    const html = render(<PlayerHoverPreview entry={entry} left={12} top={20} pinned onClose={noop} />)
    expect(html).toContain('player-hover-card--pinned')
    expect(html).toContain('Kartenvorschau schließen')
    expect(html.match(/<button/g)).toHaveLength(1)
  })

  it('places the preview beside a row when space permits, otherwise stays on screen', () => {
    expect(positionPlayerPreview({ left: 600, right: 800, top: 100 }, 1300, 900)).toEqual({ left: 812, top: 100 })
    expect(positionPlayerPreview({ left: 550, right: 790, top: 850 }, 1000, 900)).toEqual({ left: 106, top: 410 })
    const small = positionPlayerPreview({ left: 20, right: 290, top: 500 }, 320, 600)
    expect(small).toEqual({ left: 12, top: 110 })
    // The position must stay inside the minimum viewport margin even at the top-left edge.
    expect(positionPlayerPreview({ left: 4, right: 100, top: -20 }, 320, 400)).toEqual({ left: 12, top: 12 })
  })
})
