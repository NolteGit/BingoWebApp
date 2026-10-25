import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { getCardById } from '../shared/cards'
import { LobbyModal } from './LobbyModal'

const noop = () => {}

describe('Lobby modal', () => {
  it('contains German game rules and a note that cards may be shared', () => {
    const html = render(<LobbyModal mode="rules" card={getCardById(1)} onDismiss={noop} onAfterClose={noop} />)

    expect(html).toContain('Bonusfeld')
    expect(html).toContain('Reihe, Spalte oder Diagonale')
    expect(html).toContain('Mehrere Spieler dürfen dieselbe Karte verwenden')
    expect(html).toContain('keine gemeinsamen Spielräume')
    expect(html).not.toContain('role="gridcell"')
    expect(html).toContain('Schließen')
  })

  it('shows all 25 squares of the chosen card only in preview mode', () => {
    const html = render(<LobbyModal mode="preview" card={getCardById(7)} onDismiss={noop} onAfterClose={noop} />)

    expect(html).toContain('Karte 7 ansehen')
    expect(html).toContain('Zerg folgt Dolyak statt Commander')
    expect(html.match(/role="gridcell"/g)).toHaveLength(25)
    expect(html).toContain('FREIFELD')
    expect(html).not.toContain('Mehrere Spieler dürfen dieselbe Karte verwenden')
  })
})
