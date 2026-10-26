# Project status

**Documentation updated: 2026-10-26 (print and player-hover release checks).** This file summarizes the current project. Historic step-by-step handoffs remain in numbered `docs/` test and design files.

## Current implementation

| Feature | State | Evidence / comments |
| --- | --- | --- |
| DE/EN interface toggle, German by default | Implemented | `src/client/i18n.tsx`; tasks remain German, switching never changes stored data |
| Ten fixed cards, task library, and random choice | Implemented | `data/tasks.json`, `data/cards.json`; verify random join and stored snapshot locally |
| Personal gameplay and bingo detection | Implemented | Click/uncheck, 12 lines, server calculations |
| Rooms and shareable invitations | Implemented | Real room creation and links, deployed UI demonstrated |
| Joining and duplicate-name handling | Implemented | Backend rejects duplicate normalized names within one room |
| Saved progress and resume | Implemented | SQLite and room-scoped session cookie; browser/restart tests performed |
| Shared lobby and card comparison | Implemented | Both views share the read-only player list and live hover/focus/tap preview; no extra API calls. |
| Live updates and presence | Implemented | WebSocket channel with polling fallback; online state best-effort |
| Save recovery and conflict handling | Implemented | Server-confirmed writes, revision checks, uncertainty recovery |
| Personal restart and room leave | Implemented | Explicit confirmation; deletes own record, not the room |
| Cloudflare production hosting | Deployed | Public UI/gameplay confirmed via user screenshots |
| Mobile 5×5 board layout | Implemented | Responsive CSS; retest on actual narrow mobile devices |
| Printable A4 paper-reference sheet | Implemented | Print-only ribbon, 5×5 grid and anonymous rules footer. One-page A4 layout check completed; actual Firefox/Chromium print dialog still merits inspection (`docs/30-printable-paper-sheet.md`). |
| Automatic room expiry | **Not implemented** | Previously discussed 24-hour expiry is a future option |
| Independent backups / cross-device recovery | **Not implemented** | Do not describe the service as recoverable after lost cookies or deleted storage |

## Verification

- **Local Windows results reported on 2026-10-26:** both TypeScript configurations passed and Vite completed the production build. The shared Vitest run had **128/129 passing**, with one incorrect preview-position expectation; the correction was supplied afterwards. A subsequent green run has not yet been shown.
- **Print layout:** the sample preset and longest-description stress case rendered to one A4 page in the layout renderer. The browser's own print preview still needs final visual inspection.
- **Browser/live room:** production screenshots and user feedback demonstrate the UI. Recheck the hover in both the lobby and in-game dialog with two real players after any final cleanup, including mobile/touch behavior.
- **This final cleanup patch:** small code, test and documentation maintenance. Run the local checks again after applying it before deployment.

Before sharing a new release:

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

Test a fresh room with two browsers, a marked square, refreshing, leaving/rejoining, and a second deployment without losing saved data. Use the [self-hosting guide](docs/22-self-host-cloudflare.md) and [testing checklist](docs/21-predeployment-readiness.md).

## Known considerations

- A room URL grants read access to display names and all publicly visible checked squares. Never use private names or secrets as player names.
- Offline players and their progress remain in the room until they choose an explicit confirmed leave/restart. Room creation alone does not remove old rooms.
- A browser cookie is required to resume the same player. There is no recovery code after losing that cookie.
- Worker rename, Durable Object namespace changes, and production data deletion can make existing games inaccessible.
- A downloaded project ZIP containing `.git/` or `.wrangler/` is **not** safe to distribute as source. Use a clean Git clone or the source export instructions in `docs/25-sharing-and-privacy.md`.
- Documentation containing old milestones is historical context; refer to the current tests and code for behavior.

## Recent interface additions

The shared task library in `data/tasks.json` provides stable task IDs. Ten presets retain their defined layouts, and card ID 11 creates a stored random card per joining player (`docs/26-task-library-and-random-cards.md`). The interface starts in German, allows DE/EN switching, and keeps objective wording German (`docs/27-interface-language.md`).

The lobby and in-game overview both use `PlayerList` for room progress. Hover, keyboard focus or tap can reveal a read-only 5×5 snapshot, including saved random-card objectives, checked squares and completed Bingo lines. The preview follows existing room updates without additional API requests. See `docs/29-visual-polish.md`.
