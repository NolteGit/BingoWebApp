/** Keep the floating preview within the viewport and beside the selected row when possible. */
export function positionPlayerPreview(
  rect: Pick<DOMRect, 'left' | 'right' | 'top'>,
  viewportWidth: number,
  viewportHeight: number,
): { left: number; top: number } {
  const margin = 12
  const gap = 12
  const width = Math.min(432, Math.max(0, viewportWidth - 2 * margin))
  const height = Math.min(478, Math.max(0, viewportHeight - 2 * margin))
  const right = rect.right + gap
  const left = rect.left - width - gap
  return {
    left: right + width <= viewportWidth - margin ? right
      : left >= margin ? left
      : Math.max(margin, Math.min(rect.left, viewportWidth - margin - width)),
    top: Math.max(margin, Math.min(rect.top, viewportHeight - margin - height)),
  }
}
