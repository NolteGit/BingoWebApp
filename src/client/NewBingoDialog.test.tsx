import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { NewBingoDialog } from './NewBingoDialog'

const noop = () => undefined

describe('confirmed bingo reset', () => {
  it('shows a short confirmation with an explicit destructive action and a cancel action', () => {
    const markup = render(<NewBingoDialog open busy={false} onCancel={noop} onConfirm={noop} onAfterClose={noop} />)
    expect(markup).toContain('Neues Bingo starten?')
    expect(markup).toContain('alle Häkchen')
    expect(markup).toContain('Abbrechen')
    expect(markup).toContain('Löschen &amp; neu starten')
  })
  it('offers confirmed leave without implying deletion of other participants', () => {
    const markup = render(<NewBingoDialog mode="leave" open busy={false} onCancel={noop} onConfirm={noop} onAfterClose={noop} />)
    expect(markup).toContain('Raum verlassen?')
    expect(markup).toContain('Deine Karte und dein Fortschritt')
    expect(markup).toContain('Verlassen &amp; löschen')
    expect(markup).toContain('Abbrechen')
  })
  it('disables both actions while the deletion is in progress', () => {
    const markup = render(<NewBingoDialog open busy onCancel={noop} onConfirm={noop} onAfterClose={noop} />)
    expect(markup).toContain('Wird gelöscht…')
    expect(markup.match(/disabled/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
