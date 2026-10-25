import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { PlayableBoard } from './PlayableBoard'

const card = getCardById(7)
const noop = () => undefined

function renderBoard(mask: number): string {
  return render(<PlayableBoard card={card} checkedMask={mask} onToggleSquare={noop} />)
}

describe('local playable 5×5 board', () => {
  it('renders 25 keyboard-accessible buttons and starts with only the immutable center checked', () => {
    const html = renderBoard(createInitialCheckedMask())
    expect(html.match(/<button\b/g)).toHaveLength(25)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(24)
    expect(html).toContain('Bonusfeld')
    expect(html).toContain('FREIFELD')
    expect(html).toContain('disabled')
    expect(html).toContain('1/25')
    expect(html).toContain('0/12')
    expect(html).not.toContain('BINGO!')
    expect(html).toContain('Deine Bingokarte: Karte 7')
  })

  it('shows checked styling and the updated count after marking a square', () => {
    const mask = setSquareChecked(createInitialCheckedMask(), 0, true)
    const html = renderBoard(mask)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2)
    expect(html).toContain('2/25')
    expect(html).toContain('play-square--checked')
    expect(html).not.toContain('BINGO!')
  })

  it('announces a completed line and visually highlights its squares', () => {
    const mask = [0, 1, 2, 3, 4].reduce((previous, index) =>
      setSquareChecked(previous, index, true), createInitialCheckedMask())
    const html = renderBoard(mask)
    expect(html).toContain('BINGO!')
    expect(html).toContain('6/25')
    expect(html).toContain('1/12')
    expect(html.match(/play-square--winning/g)).toHaveLength(5)
    expect(html).toContain('aria-live="polite"')
  })

  it('removes the bingo notification when a square is unchecked', () => {
    const complete = [0, 1, 2, 3, 4].reduce((previous, index) =>
      setSquareChecked(previous, index, true), createInitialCheckedMask())
    const undone = setSquareChecked(complete, 1, false)
    expect(renderBoard(undone)).not.toContain('BINGO!')
    expect(renderBoard(undone)).toContain('0/12')
    expect(renderBoard(undone)).toContain('5/25')
  })
})
