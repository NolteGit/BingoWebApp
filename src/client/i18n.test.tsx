import { render } from 'preact-render-to-string'
import { describe, expect, it } from 'vitest'
import { createInitialCheckedMask } from '../shared/bingo'
import { getCardById } from '../shared/cards'
import { App } from './App'
import { CardPickerMenu } from './CardPicker'
import { LanguageProvider, cardLabel, strings, translate } from './i18n'
import { NewBingoDialog } from './NewBingoDialog'
import { PlayableBoard } from './PlayableBoard'

const noop = () => undefined

describe('German-first, English-capable interface', () => {
  it('ships matching German and English entries for each interface key', () => {
    expect(Object.keys(strings.de).sort()).toEqual(Object.keys(strings.en).sort())
    for (const key of Object.keys(strings.de) as Array<keyof typeof strings.de>) {
      expect(strings.en[key]).toBeTruthy()
    }
  })

  it('starts in German without a persisted language preference', () => {
    const markup = render(<LanguageProvider><App /></LanguageProvider>)
    expect(markup).toContain('Neuen Raum erstellen')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('>DE</button>')
    expect(markup).toContain('>EN</button>')
    expect(markup).not.toContain('Create new room')
  })

  it('renders entry controls and confirmation dialogs in English', () => {
    const markup = render(<LanguageProvider initialLocale="en">
      <App />
      <CardPickerMenu value={11} previewId={11} onChange={noop} onPreview={noop} onClose={noop} />
      <NewBingoDialog open busy={false} mode="leave" onCancel={noop} onConfirm={noop} onAfterClose={noop} />
    </LanguageProvider>)
    expect(markup).toContain('Create new room')
    expect(markup).toContain('Random card')
    expect(markup).toContain('Example card')
    expect(markup).toContain('Leave room?')
    expect(markup).toContain('Leave &amp; delete')
    expect(markup).not.toContain('Neuen Raum erstellen')
  })

  it('translates card labels without translating or changing bingo objectives', () => {
    const card = getCardById(1)
    const de = render(<LanguageProvider>
      <PlayableBoard card={card} checkedMask={createInitialCheckedMask()} onToggleSquare={noop} />
    </LanguageProvider>)
    const en = render(<LanguageProvider initialLocale="en">
      <PlayableBoard card={card} checkedMask={createInitialCheckedMask()} onToggleSquare={noop} />
    </LanguageProvider>)
    expect(de).toContain('Deine Bingokarte: Karte 1')
    expect(en).toContain('Your Bingo card: Card 1')
    expect(de).toContain('Jemand lacht im Discord')
    expect(en).toContain('Jemand lacht im Discord')
    expect(en).toContain('FREE SPACE')
    expect(de).toContain('FREIFELD')
    expect(cardLabel(11, 'de')).toBe('Zufallskarte')
    expect(cardLabel(11, 'en')).toBe('Random card')
  })

  it('uses locale-appropriate errors without relying on server message language', () => {
    expect(translate('en', 'NAME_TAKEN')).toBe('This name is already in use.')
    expect(translate('de', 'NAME_TAKEN')).toBe('Dieser Name ist bereits vergeben.')
    expect(translate('en', 'roomCodeTag', { code: 'ABCD1234' })).toBe('Room ABCD1234')
  })
})
