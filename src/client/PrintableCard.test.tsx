import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { cardFromSnapshot, getCardById, getFlatSquares, RANDOM_CARD_ID } from '../shared/cards'
import { LanguageProvider } from './i18n'
import { PrintableCard } from './PrintableCard'

const preset = getCardById(1)

describe('printable card', () => {
  it('prints the assigned name and 25 original objectives with no marks or progress', () => {
    const html = render(<LanguageProvider><PrintableCard name="Mira" card={preset} /></LanguageProvider>)
    expect(html).toContain('GW2 Bingo')
    expect(html).toContain('Mira')
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
    const html = render(<LanguageProvider initialLocale="en"><PrintableCard name="Alex" card={assigned} /></LanguageProvider>)
    expect(html).toContain('Random card')
    expect(html).toContain('Unique server-assigned objective')
    expect(html).toContain('Bonusfeld')
    expect(html.match(/class="print-sheet__square/g)).toHaveLength(25)
    expect(html).not.toContain('FREE SPACE')
  })

  it('escapes the player name instead of interpreting markup', () => {
    const html = render(<PrintableCard name={'<script>alert(1)</script>'} card={preset} />)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
