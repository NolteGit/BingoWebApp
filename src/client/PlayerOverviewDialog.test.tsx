import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask, setSquareChecked } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { PlayerOverviewDialog } from './PlayerOverviewDialog'
import { ExitDialog } from './ExitDialog'
import { PlayerOverview } from './PlayerOverview'
import { ReadOnlyBoard } from './ReadOnlyBoard'
import { getComparisonEntries } from './comparison'

const noop = () => undefined
const entries = getComparisonEntries({ name: 'Alex', cardId: 2 }, createInitialCheckedMask())

describe('shared player overview with read-only hover preview', () => {
  it('renders the same compact player list in the lobby and in-game dialog', () => {
    const list = render(<PlayerOverview entries={entries} />)
    const dialog = render(<PlayerOverviewDialog open entries={entries} live onDismiss={noop} onAfterClose={noop} />)
    expect(dialog).toContain('Spielerübersicht')
    expect(dialog).toContain('Live verbunden')
    for (const name of ['Alex', 'Mira', 'Tom']) {
      expect(list).toContain(name)
      expect(dialog).toContain(name)
    }
    expect(dialog.match(/class="player-summary"/g)).toHaveLength(3)
    expect(list.match(/class="player-summary"/g)).toHaveLength(3)
    // The board appears on hover/focus/tap, not before a player is selected.
    expect(dialog).not.toContain('class="play-square')
    expect(dialog).not.toContain('Kartenansicht von')
    expect(dialog).toContain('aria-expanded="false"')
    expect(dialog.match(/class="player-summary__button"/g)).toHaveLength(3)
    expect(dialog.match(/<button\b/g)).toHaveLength(4)
  })

  it('keeps the same empty state in both places', () => {
    const list = render(<PlayerOverview entries={[]} />)
    const dialog = render(<PlayerOverviewDialog open entries={[]} live={false} onDismiss={noop} onAfterClose={noop} />)
    expect(list).toContain('Noch keine Spieler')
    expect(dialog).toContain('Noch keine Spieler')
    expect(dialog).toContain('Aktualisierung alle 5 Sekunden')
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
