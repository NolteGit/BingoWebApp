import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { ComparisonDrawer } from './ComparisonDrawer'
import { ExitDialog } from './ExitDialog'
import { PlayerOverview, nextSelectedPlayerId } from './PlayerOverview'
import { ReadOnlyBoard } from './ReadOnlyBoard'
import { getComparisonEntries } from './comparison'

const noop = () => undefined
const entries = getComparisonEntries({ name: 'Alex', cardId: 2 }, createInitialCheckedMask())

describe('reusable player overview and previews', () => {
  it('collapses the selected player and switches directly to another player', () => {
    expect(nextSelectedPlayerId(null, 'demo-mira')).toBe('demo-mira')
    expect(nextSelectedPlayerId('demo-mira', 'demo-mira')).toBeNull()
    expect(nextSelectedPlayerId('demo-mira', 'demo-tom')).toBe('demo-tom')
  })

  it('opens comparison on the compact list with no card grid', () => {
    const html = render(
      <ComparisonDrawer open entries={entries} selectedId={null} onSelect={noop} onDismiss={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('Spielervergleich')
    expect(html).toContain('Nur dein eigener Fortschritt ist echt')
    expect(html).toContain('Mira')
    expect(html).toContain('Tom')
    expect(html).toContain('11/25 · 1 Bingo')
    expect(html.match(/class="player-summary(?:\s|")/g)).toHaveLength(3)
    expect(html).not.toContain('Schreibgeschützte Bingokarte')
    expect(html.match(/<button\b/g)).toHaveLength(4)
  })

  it('retains all player names and expands the selected card inline', () => {
    const html = render(
      <ComparisonDrawer open entries={entries} selectedId="demo-mira" onSelect={noop} onDismiss={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('class="comparison-dialog"')
    expect(html).toContain('Kartenansicht von Mira')
    expect(html).toContain('Karte von Mira')
    expect(html).toContain('Schreibgeschützte Bingokarte: Karte 7')
    expect(html.match(/class="player-summary(?:\s|")/g)).toHaveLength(3)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-controls="comparison-player-detail"')
    expect(html.match(/class="play-square compare-square/g)).toHaveLength(25)
    expect(html.match(/<button\b/g)).toHaveLength(5)
  })

  it('shares the summary/preview layout with lobby and keeps the empty state', () => {
    const populated = render(<PlayerOverview entries={entries} selectedId="demo-tom" onSelect={noop} detailId="lobby-player-detail" variant="lobby" />)
    expect(populated).toContain('Kartenansicht von Tom')
    expect(populated).toContain('aria-controls="lobby-player-detail"')
    expect(populated.match(/class="player-summary(?:\s|")/g)).toHaveLength(3)
    const empty = render(<PlayerOverview entries={[]} selectedId={null} onSelect={noop} detailId="lobby-player-detail" variant="lobby" />)
    expect(empty).toContain('Noch keine Spieler')
    expect(empty).not.toContain('Mira')
    expect(empty).not.toContain('player-overview__detail')
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
