import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App card preview', () => {
  it('shows the German read-only preview and ten selectable cards', () => {
    const html = render(<App />)

    expect(html).toContain('WvW Bingo')
    expect(html).toContain('Lokale Vorschau')
    expect(html).toContain('keine Live-Synchronisierung')
    expect(html).toContain('Bingokarte auswählen')
    expect(html.match(/<option\b/g)).toHaveLength(10)
    expect(html.match(/role="gridcell"/g)).toHaveLength(25)
    expect(html).toContain('Jemand lacht im Discord')
    expect(html).toContain('FREIFELD')
    expect(html).toContain('noch nicht abgehakt')
  })
})
