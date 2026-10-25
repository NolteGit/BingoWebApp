# 03 — UI/UX specification (German end-user copy)

## Design goals

- Clickable 5×5 card remains readable at common second-monitor/window sizes.
- No mouse precision gymnastics: the **entire tile** is a button.
- Low distraction. High contrast checked/un-checked state; distinguish via **check icon + color**, never color alone.
- Player can start, mark, compare, or leave without navigating through multiple forms.
- The interface is **German throughout**; technical field names remain English internally.

## Lobby wireframe

```text
┌────────────────────────────────────────────────────────────────────┐
│ GW2 WvW Bingo                            Raum: K7MP2A8X  [Link kopieren] │
├────────────────────────────────────────────────────────────────────┤
│ SPIELERÜBERSICHT                                                 │
│ ● Mira              Karte 7     ███████░░░ 17/25      2 Bingos    │
│ ● Tom               Karte 3     █████░░░░░ 12/25      0 Bingos    │
│ ○ Alex              Karte 1     ███░░░░░░░  8/25      0 Bingos    │
│                                                                    │
│ NEU BEITRETEN                                                     │
│ Dein Name:    [______________________]                             │
│ Bingokarte:  [Karte 1          ▾]   [Karte ansehen]               │
│                       [Bingo starten]                             │
└────────────────────────────────────────────────────────────────────┘
```

Room codes in the example are illustrative, not a live room. Progress indicators are illustrative.

- If the browser has an active session for the room, offer **Zu meiner Bingokarte** rather than a second join form.
- Sort players by first-bingo status, then completed bingo lines, then checked squares, then name (stable tie-breakers). Could alternatively sort by join order if a user requests it; document before changing.
- Display first recorded winner unobtrusively: **Erstes Bingo: Mira**.
- New players should not cause the list to jump abruptly while someone types in the join form.

## Compact local lobby (Step 6.5 UI refinement)

- Use **GW2 Bingo** in the top bar and one small **Lobby** page heading, not an oversized duplicate game title.
- Keep the name field, preset selector and **Bingo starten** visible without needing to scroll on typical desktop sizes.
- **Regeln & Infos** is a click-open dialog for the four game rules, independent use of the same card by multiple players, and local-mode limitations.
- **Karte ansehen** opens the selected preset's 5×5 board on demand in a read-only dialog. Switching selection affects the preview the next time it is opened; the preview should not occupy the lobby by default.
- Modals must work with mouse, keyboard and touch. Escape and **Schließen** both dismiss them, and focus returns to the initiating button. Hover may add decoration but must not be required to discover the rules.
- The local-only lobby must continue to warn briefly about losing progress on refresh. Do not fabricate online players or connection indicators before the backend exists.
- Multiplayer implementation should replace the empty player overview with real room state without making the lobby visually noisy.

## Bingo screen wireframe

```text
┌──────────────────────────────────────────────────────┐
│ GW2 WvW Bingo — Mira · Karte 7       [Vergleich]     │
│ 13/25 Felder   ·   1 Bingo     [Progress ████░░░░]   │
├──────────────────────────────────────────────────────┤
│ [objective] [objective] [objective] [objective] [...] │
│ [objective] [objective] [objective] [objective] [...] │
│ [objective] [objective] [BONUSFELD✓] [objective] ... │
│ [objective] [objective] [objective] [objective] [...] │
│ [objective] [objective] [objective] [objective] [...] │
├──────────────────────────────────────────────────────┤
│ [Verlassen]                            [Verbunden ●] │
└──────────────────────────────────────────────────────┘
```

- Cells show only the German objective text and a visible checkmark when selected.
- Long objectives wrap inside the tile. Layout should give tiles adequate min-height; no silent truncation of rules.
- Checked tiles: contrasting fill plus check icon; optionally show completed line outlines.
- **Bonusfeld** center tile has a distinct visual style, stays checked, has disabled interaction and accessible explanation.
- Highlight all completed lines; if a cell belongs to multiple lines, it remains visually valid.
- On mobile/narrow desktop, 5 columns remain intact. Reduce font carefully; allow page scrolling. Do not replace 5×5 with one-column checklist.

## Compact personal game screen (Step 6.6 UI refinement)

- The common top bar already identifies **GW2 Bingo**. The personal screen must avoid repeating that title as a large hero.
- Put **player name** and current **Karte 1–10** selector first, alongside **Vergleich** and **Zur Lobby**. Below that, keep the `n/25` progress, `n/12` bingo lines, slim progress bar and the clickable 5×5 board. No second card title or instructional box above the grid.
- The **BINGO!** announcement and winning-line highlighting remain. When the player has no bingo, do not reserve a visible empty explanatory panel.
- Selecting a different card during the **local prototype** must display a destructive-action confirmation before resetting marks. Cancel/Escape keeps the old card and progress. Once multiplayer is implemented, the backend and room rules must explicitly decide whether such switching is allowed.
- Local mode must remain truthful about refresh loss, using the compact **Lokal · ungespeichert** status. Removing visual filler must not imply persistence.
- Retain keyboard-accessible card controls, square buttons, visible focus indicators, and clear comparison/exit actions.

## Comparison panel

- Overlay/drawer in the bingo screen, preferably right side on desktop.
- **Spielervergleich** list: name, card number, `n/25`, bingo count, status indicator.
- Selecting an entry shows the other user's whole 5×5 card **read-only**; clicking their squares does nothing.
- Accessible Close button **Schließen**; Esc closes the drawer; focus returns to **Vergleich**.
- Update content from current room snapshot without refreshing the route.

## Shared player overview (Step 6.7 UI refinement)

- Use **one `PlayerList` component** in the lobby and comparison drawer. Each row shows player name, card number, `n/25` completed squares, bingo-line count and compact progress bar.
- The comparison drawer **opens on the summary list**, never on a preselected card. Clicking an entry replaces the list with its **read-only** 5×5 card and a clear **Zur Übersicht** action.
- In the lobby, clicking a real player opens the same card detail in a popup. There are currently no real lobby players, so the lobby remains empty rather than importing comparison examples.
- Keep `PlayerCardDetail` reusable across the two contexts. Names and objective text must be rendered as text. Do not allow editing another player’s marks.
- The comparison examples remain explicitly labeled **Beispiel** and must be replaced by real server-supplied entries during multiplayer implementation.
- Preserve Escape / Schließen behavior, keyboard navigation and focus restoration when closing a dialog or returning to the summary.

## Destructive exit dialogue

**Title:** `Bingokarte verlassen?`

**Message:** `Wenn du das Spiel verlässt, werden deine aktuelle Bingokarte und dein Fortschritt gelöscht. Die anderen Spieler können weiterspielen.`

**Buttons:** `Abbrechen` and `Verlassen und löschen`.

Exit must not be implemented as an implicit browser unload handler or ordinary back button.

## Other UI strings

| Context | German text |
| --- | --- |
| Create room | `Raum erstellen` |
| Invitation | `Einladungslink kopieren` / `Link kopiert` |
| Input | `Dein Name` |
| Card | `Karte auswählen`, `Karte 1` … `Karte 10` |
| Start | `Bingo starten` |
| Completed count | `Felder` |
| Completed lines | `Bingo-Linien` |
| Current state | `Verbunden`, `Verbindung wird hergestellt …`, `Offline` |
| First winner | `Erstes Bingo: {name}` |
| Invalid room | `Raum nicht gefunden` |
| Name conflict | `Dieser Name ist bereits vergeben.` |
| Save error | `Änderung konnte nicht gespeichert werden. Erneut versuchen.` |
| Reconnect | `Verbindung unterbrochen. Erneuter Verbindungsversuch …` |
| Session missing | `Deine Sitzung wurde nicht gefunden. Bitte tritt erneut bei.` |

## Accessibility / interaction

- Use `<button>` for every square, `aria-pressed` for checked state; free cell disabled with clear accessible label.
- Keyboard: Tab to navigate cells, Enter/Space to mark, Escape to close comparison and dialogs.
- Provide visible focus indication and semantic dialog focus trapping.
- Names and objectives are text, not raw HTML.
- Respect `prefers-reduced-motion`; no required audio.
- Keep interactive target sizes sufficiently large for mouse and touch.

## Style decisions deferred

Specific GW2 color palette, fonts, animation effects, and decorative assets. Favor accessible plain CSS over a large design-system dependency.
