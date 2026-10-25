import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App local lobby', () => {
  it('renders the German join form, empty player list, and all ten card choices', () => {
    const html = render(<App />)

    expect(html).toContain('Lobby')
    expect(html).toContain('Bingo beitreten')
    expect(html).toContain('Dein Name')
    expect(html).toContain('Karte auswählen')
    expect(html).toContain('Bingo starten')
    expect(html).toContain('Noch keine Online-Spieler')
    expect(html).toContain('Nur lokal · kein Mehrspieler')
    expect(html.match(/<option\b/g)).toHaveLength(10)
    expect(html.match(/role="gridcell"/g)).toHaveLength(25)
    expect(html).toContain('Jemand lacht im Discord')
    expect(html).toContain('FREIFELD')
    expect(html).toContain('disabled') // no name entered yet
    expect(html).not.toContain('Verbunden') // never pretend there is a live room
  })
})
