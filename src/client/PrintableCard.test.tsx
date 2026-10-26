import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { cardFromSnapshot, getCardById, getFlatSquares, RANDOM_CARD_ID } from '../shared/cards'
import { LanguageProvider } from './i18n'
import { PrintableCard } from './PrintableCard'

const preset = getCardById(1)

describe('printable card', () => {
  it('prints an anonymous original 25-square card with decorative header and rules', () => {
    const html = render(<LanguageProvider><PrintableCard card={preset} /></LanguageProvider>)
    expect(html).toContain('WvW-BINGO')
    expect(html).not.toContain('Mira')
    expect(html).toContain('REGELN')
    expect(html).toContain('Das mittlere Feld ist ein Freifeld')
    expect(html).toContain('print-sheet__ribbon')
    expect(html.match(/class="print-sheet__rule"/g)).toHaveLength(4)
    expect(html).toContain('print-sheet__free-note')
    expect(html).toContain('Karte 1')
    expect(html.match(/class="print-sheet__square/g)).toHaveLength(25)
    for (const task of getFlatSquares(preset)) expect(html).toContain(task)
    expect(html).not.toContain('play-square--checked')
    expect(html).not.toContain('aria-pressed')
    expect(html).not.toContain('0/25')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('Link kopieren')
  })

  it('uses the real saved random-card snapshot and translates only the card label', () => {
    const squares = [...getFlatSquares(getCardById(RANDOM_CARD_ID))]
    squares[0] = 'Unique server-assigned objective'
    const assigned = cardFromSnapshot(RANDOM_CARD_ID, squares)
    const html = render(<LanguageProvider initialLocale="en"><PrintableCard card={assigned} /></LanguageProvider>)
    expect(html).toContain('Random card')
    expect(html).toContain('Unique server-assigned objective')
    expect(html).toContain('Bonusfeld')
    expect(html).toContain('RULES')
    expect(html.match(/class="print-sheet__square/g)).toHaveLength(25)
    expect(html).toContain('FREE SPACE')
  })

  it('never includes a player name or checked state in print markup', () => {
    const html = render(<PrintableCard card={preset} />)
    expect(html).not.toContain('print-sheet__name')
    expect(html).not.toContain('checkedMask')
    expect(html).not.toContain('Mira')
  })
})
