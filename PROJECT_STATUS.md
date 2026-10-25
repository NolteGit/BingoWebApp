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
| Pure bingo detection | Rules module + test cases added; project-wide Vitest verification pending | `src/shared/bingo.ts`, `src/shared/bingo.test.ts`; standalone TypeScript compile and runtime smoke tests passed |
| Lobby / join flow | Local-only lobby, card picker, name form and preview navigation added; browser verification pending | `src/client/App.tsx`, `src/client/lobby.ts`, local tests. No room API or multiplayer yet |
| Backend Durable Object | Not started | — |
| Persistence and sessions | Not started | — |
| Realtime connections | Not started | — |
| Automated tests | Lobby SSR and input validation, card validation and bingo-rule Vitest tests added; full suite still requires local verification | `src/client/App.test.tsx`, `src/shared/cards.test.ts`, `src/shared/bingo.test.ts` |
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

## Bingo logic milestone handoff (2026-10-25)

- Added `src/shared/bingo.ts`: one canonical immutable list of 12 winning lines, 25-bit checked-square state, immutable checked center, pure mark/unmark operation, completed-square totals, completed-line indexes, and player-level first-bingo transition helper.
- Added `src/shared/bingo.test.ts`: checks all 12 possible lines, center-column and diagonal behavior, overlapping lines, 25 checked squares, undo/idempotency, invalid masks and indexes, non-boolean inputs, and independent check state for two players using the same preset.
- **Verified in patch-authoring environment:** compiled `bingo.ts` and its `cards.ts` dependency using standalone `tsc` (ES2022, CommonJS, strict). Executed a Node assertion script covering all twelve patterns, all-squares, overlaps, undo, immutable center, and invalid indexes. These checks passed.
- **Not verified here:** complete project TypeScript check, Vitest execution, and Vite build, because npm packages are not installed in this environment. Execute `npm run typecheck`, `npm test`, `npm run build` on Windows before checking off the third foundation task.
- The card preview is **intentionally unchanged/read-only**. No client game state, lobby, player sessions, or backend has been implemented.
- Next: verify local commands and implement the German lobby/selection UI with local-only state.

## Local lobby milestone handoff (2026-10-25)

- Added a German lobby containing a name field (maximum 24 characters), selection of ten predefined cards, card preview, and an empty-state player overview. The player overview clearly explains that no other players can connect yet.
- **Bingo starten** opens a personal, read-only preview displaying the player's chosen name and card. **Zur Lobby** returns without pretending to save or delete progress. Both views are explicitly labeled as local-only.
- Added pure form validation tests and updated the SSR UI smoke test. No extra frontend packages were introduced.
- **Verified in patch environment:** all new TS/TSX files parsed without syntax errors. `lobby.ts` and the card-loader dependency compiled under strict TypeScript settings, and standalone Node assertions passed for name normalization, valid card selection, and invalid input.
- **Not verified here:** full `npm run typecheck`, `npm test`, `npm run build`, or interactive browser behavior (npm registry unavailable). Run those on Windows and test submitting a name, changing cards, opening the preview, and returning to the lobby.
- No database, sessions, real player list, clickable marks, persistence, or live synchronization. Next milestone: make the player screen clickable with progress/bingo counters.

## Verified facts

- `data/cards.json` defines 10 cards, each 5×5, with the center position set to `Bonusfeld`.
- Content follows the ten pages of the user-provided PDF; a few obvious typos were normalized and are documented in the catalog.
- Cloudflare Workers + SQLite-backed Durable Objects and WebSocket Hibernation are documented supported capabilities; **no deployed service has yet been tested**.

## How to maintain this file

For each implementation milestone, record the date, what works, the command/tests used to verify it, deployment URL if actually deployed, known issues, and next action. Distinguish **planned** from **implemented**. Never claim a browser import, deployment, or concurrency scenario is verified solely because source code exists.

## Immediate next action

Run the local typecheck, tests and build on Windows, verify the local lobby form and navigation, and check off verified tasks. Next: implement the clickable bingo board and local progress.
