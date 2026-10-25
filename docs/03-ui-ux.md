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

## Comparison panel

- Overlay/drawer in the bingo screen, preferably right side on desktop.
- **Spielervergleich** list: name, card number, `n/25`, bingo count, status indicator.
- Selecting an entry shows the other user's whole 5×5 card **read-only**; clicking their squares does nothing.
- Accessible Close button **Schließen**; Esc closes the drawer; focus returns to **Vergleich**.
- Update content from current room snapshot without refreshing the route.

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
