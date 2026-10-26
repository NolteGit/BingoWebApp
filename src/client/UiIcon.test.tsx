import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { UiIcon, type UiIconName } from './UiIcon'

const icons: UiIconName[] = ['users', 'home', 'exit', 'link', 'info', 'plus']

describe('decorative interface icons', () => {
  it.each(icons)('%s renders as a hidden SVG without replacing button text', name => {
    const markup = render(<button type="button"><UiIcon name={name} />Example action</button>)
    expect(markup).toContain('<svg')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('Example action')
  })
})
