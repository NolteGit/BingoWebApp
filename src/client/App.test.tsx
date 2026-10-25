import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App scaffold', () => {
  it('renders a German heading and clearly labels the local preview', () => {
    const html = render(<App />)

    expect(html).toContain('WvW Bingo')
    expect(html).toContain('Lokale Vorschau')
    expect(html).toContain('keine Live-Synchronisierung')
  })
})
