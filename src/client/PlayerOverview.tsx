import { useEffect, useRef, useState } from 'preact/hooks'
import type { ComparisonEntry } from './comparison'
import { PlayerCardDetail } from './PlayerCardDetail'
import { PlayerList } from './PlayerList'

interface PlayerOverviewProps {
  entries: ReadonlyArray<ComparisonEntry>
  selectedId: string | null
  onSelect: (id: string | null) => void
  detailId: string
  variant: 'lobby' | 'comparison'
}

export interface PreviewBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export interface PreviewPosition {
  left: number
  top: number
  width: number
}

/** Pure placement function: prefer a side of the list, never move the player rows. */
export function positionPlayerPreview(bounds: PreviewBounds, viewportWidth: number, viewportHeight: number): PreviewPosition {
  const edge = 12
  const gap = 12
  const idealWidth = 480
  const leftRoom = bounds.left - edge - gap
  const rightRoom = viewportWidth - bounds.right - edge - gap
  const preferredWidth = 390

  let left: number
  let width: number
  let top = Math.max(edge, Math.min(bounds.top, viewportHeight - 550))

  if (rightRoom >= preferredWidth) {
    width = Math.min(idealWidth, rightRoom)
    left = bounds.right + gap
  } else if (leftRoom >= preferredWidth) {
    width = Math.min(idealWidth, leftRoom)
    left = bounds.left - gap - width
  } else if (Math.max(leftRoom, rightRoom) >= 330) {
    width = Math.min(idealWidth, Math.max(leftRoom, rightRoom))
    left = rightRoom > leftRoom ? bounds.right + gap : bounds.left - gap - width
  } else {
    // On narrow screens, overlay below (or above) the list; the rows never reflow.
    width = Math.min(idealWidth, viewportWidth - 2 * edge)
    left = edge
    top = bounds.bottom + gap < viewportHeight - 180
      ? bounds.bottom + gap
      : edge
  }

  return { left: Math.round(left), top: Math.round(top), width: Math.round(width) }
}

export function nextSelectedPlayerId(selectedId: string | null, clickedId: string): string | null {
  return selectedId === clickedId ? null : clickedId
}

/** Identical fixed-row leaderboard for lobby and comparison; read-only cards float beside it. */
export function PlayerOverview({ entries, selectedId, onSelect, detailId, variant }: PlayerOverviewProps) {
  const [position, setPosition] = useState<PreviewPosition | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = entries.find((entry) => entry.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) return
    const reposition = () => {
      const bounds = listRef.current?.getBoundingClientRect()
      if (bounds) setPosition(positionPlayerPreview(bounds, window.innerWidth, window.innerHeight))
    }
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [selected?.id])

  return (
    <div class={`player-overview player-overview--${variant}${selected ? ' player-overview--expanded' : ''}`}>
      <div ref={listRef} class="player-overview__list">
        <PlayerList
          entries={entries}
          selectedId={selected?.id ?? null}
          detailId={detailId}
          onPreview={(id) => onSelect(nextSelectedPlayerId(selected?.id ?? null, id))}
        />
      </div>
      {selected && (
        <div
          class="player-overview__detail"
          id={detailId}
          role="region"
          aria-label={`Karte von ${selected.name}`}
          style={{ left: position?.left ?? 12, top: position?.top ?? 12, width: position?.width ?? 480 }}
        >
          <button
            class="player-overview__close"
            type="button"
            aria-label="Kartenvorschau schließen"
            onClick={() => onSelect(null)}
          >×</button>
          <PlayerCardDetail entry={selected} />
        </div>
      )}
    </div>
  )
}
