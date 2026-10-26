# Project status

**Documentation updated: 2026-10-26 (random-card patch).** This file summarizes the current project. Historic step-by-step handoffs remain in numbered `docs/` test and design files.

## Current implementation

| Feature | State | Evidence / comments |
| --- | --- | --- |
| Ten fixed cards, task library, and random choice | Implemented in pending patch | `data/tasks.json`, `data/cards.json`; verify random join and stored snapshot locally |
| Personal gameplay and bingo detection | Implemented | Click/uncheck, 12 lines, server calculations |
| Rooms and shareable invitations | Implemented | Real room creation and links, deployed UI demonstrated |
| Joining and duplicate-name handling | Implemented | Backend rejects duplicate normalized names within one room |
| Saved progress and resume | Implemented | SQLite and room-scoped session cookie; browser/restart tests performed |
| Shared lobby and card comparison | Implemented | Read-only previews; multi-browser screenshots supplied |
| Live updates and presence | Implemented | WebSocket channel with polling fallback; online state best-effort |
| Save recovery and conflict handling | Implemented | Server-confirmed writes, revision checks, uncertainty recovery |
| Personal restart and room leave | Implemented | Explicit confirmation; deletes own record, not the room |
| Cloudflare production hosting | Deployed | Public UI/gameplay confirmed via user screenshots |
| Mobile 5×5 board layout | Implemented | Responsive CSS; retest on actual narrow mobile devices |
| Automatic room expiry | **Not implemented** | Previously discussed 24-hour expiry is a future option |
| Independent backups / cross-device recovery | **Not implemented** | Do not describe the service as recoverable after lost cookies or deleted storage |

## Verification

- **Previously verified locally:** TypeScript check, production build, and **101 automated tests** during the Step 13 deployment preparation stage.
- Later UI, personal-reset, leave-room, and mobile patches were delivered and deployed/visually reviewed, but a *fresh complete test run of this exact repository snapshot* has **not** been supplied in the conversation.
- Production pages, joining, saved progress and comparison have been demonstrated in screenshots. This is not a substitute for exhaustive outage, concurrency or security testing.

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

## New task-library feature pending local verification

The new `data/tasks.json` defines every task in one place. Existing presets refer to stable task IDs. Card ID 11 generates and stores a unique random card per player. TypeScript checks passed in the patch-generation environment; the complete Windows test suite and Wrangler migration test must be run before public deployment. See `docs/26-task-library-and-random-cards.md`.
