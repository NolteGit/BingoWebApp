/** Small decorative UI icons. Text labels remain the accessible button names. */
export type UiIconName = 'users' | 'home' | 'exit' | 'link' | 'info' | 'plus'

export function UiIcon({ name }: { name: UiIconName }) {
  return (
    <svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" focusable="false">
      {name === 'users' && <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M17 5.4a3 3 0 0 1 0 5.2M17.5 14a5 5 0 0 1 3.5 4.8V20" />
      </>}
      {name === 'home' && <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9.5V21h14V9.5M10 21v-7h4v7" />
      </>}
      {name === 'exit' && <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="M13 8l4 4-4 4M17 12H8" />
      </>}
      {name === 'link' && <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>}
      {name === 'info' && <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
    </svg>
  )
}
