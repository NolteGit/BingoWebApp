import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App compact local lobby', () => {
  it('shows a concise German lobby, ten card choices and on-demand info buttons', () => {
    const html = render(<App />)

    expect(html).toContain('GW2 Bingo')
    expect(html).toContain('Lobby')
    expect(html).toContain('Bingo beitreten')
    expect(html).toContain('Dein Name')
    expect(html).toContain('Karte auswählen')
    expect(html).toContain('Karte ansehen')
    expect(html).toContain('Regeln &amp; Infos')
    expect(html).toContain('Bingo starten')
    expect(html).toContain('Noch keine Spieler')
    expect(html).not.toContain('Mira') // comparison-only examples are never lobby participants
    expect(html).not.toContain('class="player-summary"')
    expect(html).toContain('Lokal')
    expect(html).toContain('Fortschritt wird beim Neuladen noch nicht gespeichert')
    expect(html.match(/<option\b/g)).toHaveLength(10)
    expect(html).not.toContain('role="gridcell"') // preview is hidden until requested
    expect(html).not.toContain('Jemand lacht im Discord')
    expect(html).not.toContain('Guild Wars 2 · World vs. World')
    expect(html).not.toContain('Verbunden') // no fake live multiplayer state
    expect(html).toContain('disabled') // no name entered yet
  })
})
