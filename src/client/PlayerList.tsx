import { useEffect, useRef, useState } from 'preact/hooks'
import { useI18n } from './i18n'
import { getBingoProgress } from '../shared/bingo'
import type { ComparisonEntry } from './comparison'
import { PlayerHoverPreview } from './PlayerHoverPreview'
import { positionPlayerPreview } from './player-preview-position'

interface PlayerListProps {
  entries: ReadonlyArray<ComparisonEntry>
}

/** Both lobby and in-game dialog inspect the same authoritative read-only snapshot. */
export function PlayerList({ entries }: PlayerListProps) {
  const { t, cardName } = useI18n()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [position, setPosition] = useState({ left: 12, top: 12 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const activeId = pinnedId ?? hoveredId
  const active = entries.find(entry => entry.id === activeId)

  function positionAt(button: HTMLButtonElement) {
    anchorRef.current = button
    setPosition(positionPlayerPreview(button.getBoundingClientRect(), window.innerWidth, window.innerHeight))
  }

  function reveal(id: string, button: HTMLButtonElement) {
    if (pinnedId && pinnedId !== id) setPinnedId(null)
    setHoveredId(id)
    positionAt(button)
  }

  function hide(id: string) {
    if (pinnedId !== id) setHoveredId(current => current === id ? null : current)
  }

  function closePreview() {
    setPinnedId(null)
    setHoveredId(null)
  }

  useEffect(() => {
    if (!activeId) return
    const reposition = () => {
      const button = anchorRef.current
      const list = wrapperRef.current?.querySelector('.player-list')
      if (!button?.isConnected || !list) return
      const rect = button.getBoundingClientRect()
      const visibleList = list.getBoundingClientRect()
      if (rect.bottom <= visibleList.top || rect.top >= visibleList.bottom) {
        closePreview()
        return
      }
      setPosition(positionPlayerPreview(rect, window.innerWidth, window.innerHeight))
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [activeId])

  useEffect(() => {
    if (!pinnedId) return
    const outsideClick = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) closePreview()
    }
    const outsideFocus = (event: FocusEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) closePreview()
    }
    document.addEventListener('pointerdown', outsideClick)
    document.addEventListener('focusin', outsideFocus)
    return () => {
      document.removeEventListener('pointerdown', outsideClick)
      document.removeEventListener('focusin', outsideFocus)
    }
  }, [pinnedId])

  if (entries.length === 0) {
    return (
      <div class="empty-players">
        <strong>{t('emptyPlayers')}</strong>
        <p>{t('emptyPlayersNote')}</p>
      </div>
    )
  }

  return (
    <div class="player-list-wrap" ref={wrapperRef} onKeyDown={event => {
      if (event.key === 'Escape' && active) { event.preventDefault(); event.stopPropagation(); closePreview() }
    }}>
      <ul class="player-list" aria-label={t('playersAndProgress')}>
        {entries.map(entry => {
          const progress = getBingoProgress(entry.checkedMask)
          return (
            <li key={entry.id} class={`player-summary${active?.id === entry.id ? ' player-summary--previewing' : ''}`}>
              <button type="button" class="player-summary__button"
                aria-expanded={active?.id === entry.id}
                aria-controls={active?.id === entry.id ? 'player-card-hover-preview' : undefined}
                aria-label={t('playerSummaryAria', { name: entry.name, card: cardName(entry.cardId),
                  squares: progress.completedSquares, lines: progress.completedLines })}
                onMouseEnter={event => reveal(entry.id, event.currentTarget)}
                onMouseLeave={() => hide(entry.id)}
                onFocus={event => reveal(entry.id, event.currentTarget)}
                onBlur={() => hide(entry.id)}
                onClick={event => {
                  if (pinnedId === entry.id) closePreview()
                  else { positionAt(event.currentTarget); setHoveredId(entry.id); setPinnedId(entry.id) }
                }}>
                <span class="player-summary__line">
                  <span class="player-summary__identity">
                    {entry.kind === 'player' && <span class={`player-summary__presence${entry.online ? ' player-summary__presence--online' : ''}`}
                      title={entry.online ? t('online') : t('offline')}
                      aria-label={entry.online ? t('online') : t('offline')} />}
                    <strong>{entry.name}</strong>
                    {entry.kind === 'demo' && <small class="player-summary__demo">Demo</small>}
                  </span>
                  <span class="player-summary__card">{cardName(entry.cardId)}</span>
                  <span class="player-summary__points">{progress.completedSquares}/25 · {t('bingoCount', { count: progress.completedLines })}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {active && <PlayerHoverPreview entry={active} {...position} pinned={pinnedId === active.id} onClose={closePreview} />}
    </div>
  )
}
