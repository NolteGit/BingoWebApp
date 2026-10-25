# Project status

Last documentation review: **2026-10-25**.

## Actual implementation status

| Capability | Status | Evidence |
| --- | --- | --- |
| Documentation baseline | Complete | README, documentation files, ADR |
| Ten source cards transcribed | Complete (data/documentation) | `data/cards.json`, `docs/13-card-catalog.md` |
| Frontend scaffold | Local development page shown running on Windows; typecheck/test/build not yet confirmed | `package.json`, `vite.config.ts`, `src/client/` and `index.html`; run `npm install`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev` |
| Ten-card validation and read-only preview | Code added; local tests pending | `src/shared/cards.ts`, `src/shared/cards.test.ts`, preview in `src/client/App.tsx` |
| 5×5 playable card | Not started | Read-only preview only; marking not implemented |
| Pure bingo detection | Not started | — |
| Lobby / join flow | Not started | — |
| Backend Durable Object | Not started | — |
| Persistence and sessions | Not started | — |
| Realtime connections | Not started | — |
| Automated tests | UI smoke test and card validation tests added; not yet executed for this patch | `src/client/App.test.tsx`, `src/shared/cards.test.ts` |
| Cloudflare deployment | Not started | — |

## Scaffold handoff (2026-10-25)

- Added Vite + Preact + TypeScript, plain CSS and a clearly marked **local-only** German starter screen.
- Added typecheck/build/test scripts and a small UI render smoke test.
- **Environment limitation:** package installation, TypeScript compilation, browser rendering and Vitest execution could not be performed in the patch-authoring environment (npm registry access unavailable). Do **not** mark the first checkbox in `TASKS.md` done until the commands below pass on Windows.
- On Windows: `npm install`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run dev`. Commit the resulting `package-lock.json`.
- No Cloudflare backend, Worker configuration, card loader or bingo game logic has been implemented.

## Card data milestone handoff (2026-10-25)

- Imported `data/cards.json` from shared TypeScript code. The parsed catalog is validated, deeply frozen, and exposed via lookup/flatten helpers. No data was regenerated or shuffled.
- Added a German, read-only 5×5 preview with a card selector for all ten presets. The center is visually identified as the permanent free square.
- Added tests for real card contents/positions, strict 5×5 layout, 10 IDs, nonempty text, and immutable center. Existing UI smoke test was updated for the preview.
- **User evidence for previous scaffold:** screenshot shows the app running via `npm run dev` on Windows. Typecheck, Vitest and build have not been reported.
- **Patch environment limitation:** `npm install` failed because registry.npmjs.org could not be resolved (`EAI_AGAIN`). The new tests and TypeScript/build commands remain unverified until run locally on Windows.
- Next: run `npm run typecheck`, `npm test`, and `npm run build`, then update checkboxes in `TASKS.md`. Implement bingo calculation in the next task.

## Verified facts

- `data/cards.json` defines 10 cards, each 5×5, with the center position set to `Bonusfeld`.
- Content follows the ten pages of the user-provided PDF; a few obvious typos were normalized and are documented in the catalog.
- Cloudflare Workers + SQLite-backed Durable Objects and WebSocket Hibernation are documented supported capabilities; **no deployed service has yet been tested**.

## How to maintain this file

For each implementation milestone, record the date, what works, the command/tests used to verify it, deployment URL if actually deployed, known issues, and next action. Distinguish **planned** from **implemented**. Never claim a browser import, deployment, or concurrency scenario is verified solely because source code exists.

## Immediate next action

Run the local typecheck, tests and build on Windows, and mark the first two foundation checklist items complete if successful. Next: pure bingo logic and unit tests (third foundation item).
