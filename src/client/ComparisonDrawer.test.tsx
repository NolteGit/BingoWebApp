import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { ComparisonDrawer } from './ComparisonDrawer'
import { ExitDialog } from './ExitDialog'
import { ReadOnlyBoard } from './ReadOnlyBoard'
import { getComparisonEntries } from './comparison'

const noop = () => undefined
const entries = getComparisonEntries({ name: 'Henrik', cardId: 2 }, createInitialCheckedMask())

describe('comparison drawer markup', () => {
  it('labels simulated players honestly, shows progress, and never creates board buttons', () => {
    const html = render(
      <ComparisonDrawer open entries={entries} selectedId="demo-mira" onSelect={noop} onDismiss={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('Spielervergleich')
    expect(html).toContain('Keine Live-Spieler')
    expect(html).toContain('Nur dein eigener Fortschritt ist echt')
    expect(html).toContain('Mira')
    expect(html).toContain('Tom')
    expect(html).toContain('Schreibgeschützte Bingokarte: Karte 7')
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html.match(/<button\b/g)).toHaveLength(4) // close and three player choices
  })

  it('has no clickable squares even when all marked, and keeps the center immutable visually', () => {
    const html = render(<ReadOnlyBoard card={getCardById(2)} checkedMask={setSquareChecked(createInitialCheckedMask(), 0, true)} />)
    expect(html.match(/<button\b/g)).toBeNull()
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html).toContain('FREIFELD')
    expect(html).toContain('abgehakt')
  })

  it('uses an actual modal confirmation with both cancel and destructive buttons', () => {
    const html = render(<ExitDialog open onCancel={noop} onConfirm={noop} onAfterClose={noop} />)
    expect(html).toContain('<dialog')
    expect(html).toContain('Bingokarte verlassen?')
    expect(html).toContain('Abbrechen')
    expect(html).toContain('Verlassen und löschen')
  })
})
