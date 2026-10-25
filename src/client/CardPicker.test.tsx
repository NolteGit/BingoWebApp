import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { CardPicker, CardPickerMenu } from './CardPicker'

const noop = () => {}

describe('card picker', () => {
  it('starts collapsed and shows the currently selected card', () => {
    const html = render(<CardPicker value={3} onChange={noop} />)
    expect(html).toContain('Karte 3')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('card-picker__popover')
  })

  it('offers ten cards and previews the hovered card independently of selection', () => {
    const html = render(<CardPickerMenu value={1} previewId={7} onChange={noop} onPreview={noop} onClose={noop} />)
    expect(html.match(/class="card-picker__option(?: card-picker__option--selected)?"/g)).toHaveLength(10)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('Karte 7')
    expect(html).toContain('Vorschau: Karte 7')
    expect(html).toContain('Bonusfeld')
    expect(html).toContain('Vorschau · noch nicht übernommen')
  })
})
