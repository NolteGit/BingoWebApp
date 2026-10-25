import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { CardChangeDialog } from './CardChangeDialog'

const noop = () => undefined

describe('card change confirmation', () => {
  it('warns that changing cards resets progress and offers a safe cancellation', () => {
    const html = render(
      <CardChangeDialog open nextCardName="Karte 9" onCancel={noop} onConfirm={noop} onAfterClose={noop} />,
    )
    expect(html).toContain('Karte wechseln?')
    expect(html).toContain('Karte 9')
    expect(html).toContain('bisherigen Häkchen und Bingo-Linien zurückgesetzt')
    expect(html).toContain('Abbrechen')
    expect(html).toContain('Wechseln und zurücksetzen')
    expect(html).toContain('aria-describedby="change-card-description"')
  })
})
