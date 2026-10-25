import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App multiplayer entry', () => {
  it('shows room creation on the root route without invented participants', () => {
    const html = render(<App />)
    expect(html).toContain('GW2 Bingo')
    expect(html).toContain('Neuen Raum erstellen')
    expect(html).not.toContain('Testansicht')
    expect(html).not.toContain('Mira')
    expect(html).not.toContain('Lokal · ungespeichert')
  })
})
