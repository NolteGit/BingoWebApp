import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { ComparisonDrawer } from './ComparisonDrawer'
import { ExitDialog } from './ExitDialog'
import { PlayerList } from './PlayerList'
import { PlayerPreviewDialog } from './PlayerPreviewDialog'
import { ReadOnlyBoard } from './ReadOnlyBoard'
import { getComparisonEntries } from './comparison'

const noop = () => undefined
const entries = getComparisonEntries({ name: 'Henrik', cardId: 2 }, createInitialCheckedMask())

describe('reusable player overview and previews', () => {
  it('opens comparison on a compact list with no card grid', () => {
    const html = render(
      <ComparisonDrawer open entries={entries} selectedId={null} onSelect={noop} onDismiss={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('Spielervergleich')
    expect(html).toContain('Nur dein eigener Fortschritt ist echt')
    expect(html).toContain('Mira')
    expect(html).toContain('Tom')
    expect(html).toContain('Beispiel')
    expect(html).toContain('11/25 Felder')
    expect(html).toContain('1 Bingo')
    expect(html.match(/class="player-summary"/g)).toHaveLength(3)
    expect(html).not.toContain('Schreibgeschützte Bingokarte')
    expect(html).not.toContain('Zur Übersicht')
    expect(html.match(/<button\b/g)).toHaveLength(4) // close + three player rows
  })

  it('shows a selected player card only after choosing that player', () => {
    const html = render(
      <ComparisonDrawer open entries={entries} selectedId="demo-mira" onSelect={noop} onDismiss={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('← Zur Übersicht')
    expect(html).toContain('Schreibgeschützte Bingokarte: Karte 7')
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html).not.toContain('class="player-summary"')
    expect(html.match(/<button\b/g)).toHaveLength(2) // close and back; grid is read-only
  })

  it('uses the same summary list in lobby and comparison, including its empty state', () => {
    const populated = render(<PlayerList entries={entries} onPreview={noop} />)
    expect(populated).toContain('Henrik')
    expect(populated).toContain('Karte 2')
    expect(populated.match(/class="player-summary"/g)).toHaveLength(3)
    const empty = render(<PlayerList entries={[]} onPreview={noop} />)
    expect(empty).toContain('Noch keine Spieler')
    expect(empty).not.toContain('Mira') // lobby must not invent online players
  })

  it('offers the lobby the identical read-only player card detail in a popup', () => {
    const html = render(<PlayerPreviewDialog entry={entries[1]} onDismiss={noop} onAfterClose={noop} />)
    expect(html).toContain('Spielerkarte')
    expect(html).toContain('Kartenansicht von Mira')
    expect(html).toContain('Schreibgeschützte Bingokarte: Karte 7')
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html.match(/<button\b/g)).toHaveLength(1) // close only
  })

  it('has no clickable squares and keeps the center immutable visually', () => {
    const html = render(<ReadOnlyBoard card={getCardById(2)} checkedMask={setSquareChecked(createInitialCheckedMask(), 0, true)} />)
    expect(html.match(/<button\b/g)).toBeNull()
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html).toContain('FREIFELD')
    expect(html).toContain('abgehakt')
  })

  it('preserves the destructive exit confirmation dialog', () => {
    const html = render(<ExitDialog open onCancel={noop} onConfirm={noop} onAfterClose={noop} />)
    expect(html).toContain('<dialog')
    expect(html).toContain('Bingokarte verlassen?')
    expect(html).toContain('Abbrechen')
    expect(html).toContain('Verlassen und löschen')
  })
})
