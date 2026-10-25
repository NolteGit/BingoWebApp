import { createPortal } from 'preact/compat'
import { useEffect, useRef, useState } from 'preact/hooks'
import { getCardById, presetCards } from '../shared/cards'
import { CardPreview } from './CardPreview'

interface CardPickerProps {
  value: number
  onChange: (cardId: number) => void
}

interface CardPickerMenuProps extends CardPickerProps {
  previewId: number
  onPreview: (cardId: number) => void
  onClose: () => void
  optionRefs?: { current: Array<HTMLButtonElement | null> }
}

/** Shared menu contents: hover/focus previews do not change the player's selection. */
export function CardPickerMenu({ value, onChange, previewId, onPreview, onClose, optionRefs }: CardPickerMenuProps) {
  return (
    <div class="card-picker__layout">
      <div class="card-picker__options" role="group" aria-label="Verfügbare Bingokarten">
        {presetCards.map((card, index) => (
          <button key={card.id} ref={element => { if (optionRefs) optionRefs.current[index] = element }}
            class={`card-picker__option${card.id === value ? ' card-picker__option--selected' : ''}`}
            type="button" aria-pressed={card.id === value}
            onMouseEnter={() => onPreview(card.id)} onFocus={() => onPreview(card.id)}
            onClick={() => onChange(card.id)}>
            {card.name}{card.id === value && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <div class="card-picker__detail">
        <div class="card-picker__detail-heading">
          <span>Vorschau · noch nicht übernommen</span>
          <button type="button" class="card-picker__close" onClick={onClose} aria-label="Kartenauswahl schließen">×</button>
        </div>
        <CardPreview card={getCardById(previewId)} titleId="card-picker-preview-title" />
      </div>
    </div>
  )
}

/** A custom picker is needed because native OS select menus cannot show reliable hover previews. */
export function CardPicker({ value, onChange }: CardPickerProps) {
  const [open, setOpen] = useState(false)
  const [previewId, setPreviewId] = useState(value)
  const [position, setPosition] = useState({ top: 12, left: 12 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  function close(restoreFocus = false) {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  function openPicker() {
    const rectangle = triggerRef.current?.getBoundingClientRect()
    if (!rectangle) return
    const width = Math.min(700, window.innerWidth - 24)
    // Anchor near the input, but prevent the preview from leaving the viewport.
    setPosition({
      left: Math.max(12, Math.min(rectangle.left, window.innerWidth - width - 12)),
      top: Math.max(12, Math.min(rectangle.top, window.innerHeight - Math.min(490, window.innerHeight - 24) - 12)),
    })
    setPreviewId(value)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    optionRefs.current[value - 1]?.focus()
    function outside(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && !triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        close()
      }
    }
    function dismissOnResize() { close() }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', dismissOnResize)
    window.addEventListener('scroll', dismissOnResize)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', dismissOnResize)
      window.removeEventListener('scroll', dismissOnResize)
    }
  }, [open, value])

  function handleKeyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); close(true); return }
    const current = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    const max = presetCards.length - 1
    const next = event.key === 'ArrowDown' ? Math.min(max, current + 1)
      : event.key === 'ArrowUp' ? Math.max(0, current - 1)
        : event.key === 'Home' ? 0 : event.key === 'End' ? max : -1
    if (next >= 0) {
      event.preventDefault()
      optionRefs.current[next]?.focus()
    }
  }

  return (
    <div class="card-picker">
      <button id="card-choice" ref={triggerRef} class="card-picker__trigger" type="button"
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? 'card-picker-popover' : undefined}
        onClick={() => open ? close(true) : openPicker()}>
        {getCardById(value).name}<span aria-hidden="true">⌄</span>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div id="card-picker-popover" ref={popoverRef} role="dialog" aria-label="Bingokarte auswählen"
          class="card-picker__popover" style={{ top: position.top, left: position.left }} onKeyDown={handleKeyboard}>
          <CardPickerMenu value={value} previewId={previewId} onPreview={setPreviewId}
            onChange={cardId => { onChange(cardId); close(true) }} onClose={() => close(true)} optionRefs={optionRefs} />
        </div>, document.body)}
    </div>
  )
}
