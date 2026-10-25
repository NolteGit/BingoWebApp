# Project status

Last documentation review: **2026-10-25**.

## Actual implementation status

| Capability | Status | Evidence |
| --- | --- | --- |
| Documentation baseline | Complete | README, documentation files, ADR |
| Ten source cards transcribed | Complete (data/documentation) | `data/cards.json`, `docs/13-card-catalog.md` |
| Frontend scaffold | Local development page shown running on Windows; typecheck/test/build not yet confirmed | `package.json`, `vite.config.ts`, `src/client/` and `index.html`; run `npm install`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev` |
| Ten-card validation and read-only preview | Code added; local tests pending | `src/shared/cards.ts`, `src/shared/cards.test.ts`, preview in `src/client/App.tsx` |
| 5×5 playable card | Browser verified by user: mark/unmark, progress and BINGO display | `src/client/PlayableBoard.tsx`, `App.tsx`, and UI tests; marked states in browser memory only |
| Pure bingo detection | Rules module + test cases added; project-wide Vitest verification pending | `src/shared/bingo.ts`, `src/shared/bingo.test.ts`; standalone TypeScript compile and runtime smoke tests passed |
| Lobby / join flow | Local-only lobby, card picker, name form and preview navigation added; browser verification pending | `src/client/App.tsx`, `src/client/lobby.ts`, local tests. No room API or multiplayer yet |
| Comparison & leave dialogs | Code added; local verification pending | `ComparisonDrawer.tsx`, `ReadOnlyBoard.tsx`, `ExitDialog.tsx`, demo data and SSR/unit tests; no live comparison yet |
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

## Local gameplay milestone handoff (2026-10-25)

- Added `PlayableBoard.tsx` as a controlled 25-button board, separate from the lobby's read-only `CardPreview`. Regular squares can be toggled; the center Bonusfeld remains checked and is disabled. Keyboard navigation works via native buttons.
- The player screen shows checked squares (including the free center), total completed bingo lines, an accessible progress bar, and a live BINGO notice. Squares belonging to a completed line receive a distinct highlight. The display derives exclusively from the existing shared bingo rules.
- **Zur Lobby** now asks for confirmation before deleting local progress. Starting another local game resets the board. Refresh/close still loses progress because this milestone deliberately has no persistence.
- Added SSR markup tests for checked/free squares, winning-line highlighting, and loss of the BINGO notice after undo. Existing shared-rule tests cover the actual mask mutation, all 12 lines and center invariants.
- **Verified in patch environment:** source/patch structure and the original shared bingo rules. **Not verified here:** full Vitest, Vite build, or interactive browser actions due to unavailable project npm dependencies. Run `npm run typecheck`, `npm test`, `npm run build`, then test actual clicks and exit cancellation locally.
- No real players, comparisons, server sessions, or synchronized progress yet. Next task: comparison drawer and polished exit dialog using explicitly local demo state.

## Local comparison and exit milestone handoff (2026-10-25)

- Step 6 adds the **Spielervergleich** modal side drawer. It includes the actual current browser player's checked mask plus two immutable, **clearly marked sample players** (`Mira`, `Tom`) for layout/testing only. Sample data does not appear in the real lobby or claim online presence.
- Selecting another entry shows the exact original 5×5 card with that entry's marks and completed-line borders in a **non-interactive** display. No other player's squares can be modified from this UI.
- Replaced native `window.confirm` with an explicit **Bingokarte verlassen?** confirmation dialog. Cancelling leaves local state untouched; **Verlassen und löschen** resets only the current local game. Both dialogs use native `<dialog>` and implement Escape dismissal and focus restoration after closing.
- Added demo-data unit tests and render-level tests for read-only squares and the two dialogs.
- **Verified here:** patch structure, canonical card data, comparison mask calculations, and static validation. **Still requires user verification:** complete `npm run typecheck`, `npm test`, `npm run build`, and keyboard/browser behavior including focus restoration and confirming exit. No multiplayer, persistence, or backend has been built.
- **Next:** Cloudflare Worker + SQLite Durable Object local backend, then sessions and realtime updates.


## Compact lobby UX refinement handoff (2026-10-25)

- Step 6.5 reduces the lobby to a single compact GW2 Bingo header, a short Lobby heading, join form, and a real-but-empty player overview. The large hero, always-visible 5×5 card preview, repeated explanatory notes and redundant lobby footer are removed.
- **Regeln & Infos** opens a native modal with the source game rules and the explanation that multiple people can independently pick the same card. **Karte ansehen** opens a separate native modal showing the currently selected 5×5 card. Both can be closed via Escape or Schließen and return focus to the trigger. No hover-only interaction is required.
- A short visible notice continues to warn that local progress is lost on refresh. The existing clickable game board, comparison drawer, and exit confirmation remain unchanged. There is no added storage or multiplayer backend.
- Added SSR tests for the compact lobby, hidden-until-open preview content, German rules, and the selected-card grid. **Pending Windows verification:** `npm run typecheck`, `npm test`, `npm run build`, and manual dialog/keyboard/browser checks.
- Next: review any additional UI/UX refinements, then implement persistent multiplayer.


## Compact game UI refinement handoff (2026-10-25)

- Step 6.6 replaces the repeated game heading with the player name and a visible card selector. **Vergleich** and **Zur Lobby** stay accessible alongside it; progress counters/bar sit directly above the bingo tiles.
- The static non-BINGO message, duplicate card label, always-visible instruction, verbose local-mode info panel, and extra footer were removed. Accessible instructions remain in screen-reader-only text. The top status pill continues to warn **Lokal · ungespeichert**.
- A card-switch dialog requires explicit confirmation before changing the card and resetting marks. Cancel/Escape preserves the existing card and checked progress. After confirmation, only the newly selected preset and free center remain, by design. The existing confirmed exit dialog is unaffected.
- Added SSR tests for compact board markup and the new confirmation dialog. **Not yet browser verified:** actual card-selector selection/reversion on cancellation, focus recovery, typecheck, Vitest suite, and Vite build. These need Windows verification before checking off the task.
- **Still not persistent:** reload or browser closure loses local progress. Card switching may be restricted differently once a multiplayer room session is implemented.

## Shared player overview UX handoff (Step 6.7, 2026-10-25)

- The lobby and the game comparison use the same `PlayerList` summary: name, card, marked fields, bingo count and progress bar. The lobby shows a truthful empty state until the backend supplies actual participants; example players appear **only in comparison** and are labeled as such.
- Selecting a player in the comparison drawer opens their read-only board, with **Zur Übersicht** to return to the compact list. The panel opens on the list each time.
- The lobby supports opening a player card in a separate read-only dialog using the same `PlayerCardDetail` component, ready for real multiplayer entries later.
- Added SSR tests for list/empty state, summary counts, comparison detail, and non-interactive card previews. The patch and source files were checked locally; complete npm checks and browser interaction require verification on Windows.
- No durable sessions, real lobby participants, realtime communication or persistence were added.

## Verified facts

- `data/cards.json` defines 10 cards, each 5×5, with the center position set to `Bonusfeld`.
- Content follows the ten pages of the user-provided PDF; a few obvious typos were normalized and are documented in the catalog.
- Cloudflare Workers + SQLite-backed Durable Objects and WebSocket Hibernation are documented supported capabilities; **no deployed service has yet been tested**.

## How to maintain this file

For each implementation milestone, record the date, what works, the command/tests used to verify it, deployment URL if actually deployed, known issues, and next action. Distinguish **planned** from **implemented**. Never claim a browser import, deployment, or concurrency scenario is verified solely because source code exists.

## Immediate next action

Run typecheck, tests and build on Windows; verify the compact game screen, confirmation/cancelled card changes, comparison and exit flows, then gather any remaining UI refinements before Cloudflare work.

## Inline player preview refinement (Step 6.8, 2026-10-25)

- The **same `PlayerOverview` component** is shared by the lobby and Vergleich. Selecting a player expands a read-only 5×5 card **beside the list on wider comparison windows**, or **beneath it on narrower windows and in the lobby**. The compact list never disappears.
- Clicking the selected player again collapses the card; selecting a different player swaps the displayed card. The selected row announces its state with `aria-expanded` and links to the detail region.
- Removed the separate lobby player-preview modal and the comparison back-navigation screen. The demo players remain comparison-only; the real lobby remains empty pending backend data.
- Automated render tests updated for the collapsed/expanded layouts and shared detail component. Patch application can be verified here; full TypeScript/Vitest/Vite and browser click tests must run locally on Windows.
- No persistence, backend, or live room functionality added.

## Floating player-preview UX (Step 6.9, 2026-10-25)

- **UI-only example lobby:** The lobby shows the two existing labeled example profiles, rather than an empty placeholder, to test its player list. No one is actually online, and there is still no backend.
- Shared `PlayerList` uses one compact row per person (name, card, checked-square count, bingo count) in one line.
- Opening a player card no longer changes the list/drawer dimensions. The read-only preview floats **beside** the list whenever there is room, or overlays below it on narrow screens. Clicking the same row again closes it; clicking another row switches content without moving rows.
- Comparison and lobby use the same component. Added pure responsive positioning tests and revised render tests. Verify full Vitest/TypeScript/Vite and browser behavior locally before checking off.
- **Future backend requirement:** Replace example lobby players with actual server entries; all demo data is explicitly labeled and must not be transmitted as live room state.


## Cloudflare room foundation (Step 7, 2026-10-25)

- Added a Worker with SQLite-backed `BingoRoom` Durable Objects; creates durable room metadata through `POST /api/rooms` and reads it through `GET /api/rooms/:code`. Rooms start with revision 0 and zero players. Unknown codes are not initialized as real rooms on read.
- Added Wrangler config, Vite `/api` local proxy, Cloudflare TypeScript checking, and API tests using an in-memory test double.
- `npm run dev:api` starts local Worker storage; frontend stays a separate Vite dev server. `.wrangler/` is local and separate from production.
- **Not yet connected:** frontend room URLs (`/r/:code`), player join/session cookies, persistence of checked fields, realtime updates, rate limiting, and production deployment. The examples in lobby/comparison remain demo state.
- **Verification needed on Windows:** `npm install`, `npm run typecheck`, `npm test`, `npm run build`, run `npm run dev:api` and `npm run dev`, create/read a room, restart Wrangler and verify the room still exists.
- No external deployment should be done before API creation rate limiting and player authorization are planned.

## Step 7 local verification (reported by developer, 2026-10-25)

- On Windows, TypeScript and production Vite build succeeded after fixing the `BingoRoom` environment type. All 68 tests passed before Step 8.
- Corrected `wrangler.jsonc` to declare `BingoRoom` under `migrations` with `new_sqlite_classes`. Local Worker `POST /api/rooms` returned 201. Room `9NC3L2P8` was successfully read with identical `createdAt` and revision after stopping and restarting Wrangler; a second room was created too.
- Local Wrangler 4.35.0 still reports an old compatibility runtime warning. It is not a confirmed blocker to the room API.

## Step 8 player sessions (2026-10-25, patch prepared)

- New backend-only `POST /api/rooms/:code/join` and `GET /api/rooms/:code/me`. A player is saved with name, immutable chosen card, center-only initial mask, card snapshot, and a 32-byte random session credential (hashed in SQLite). Each join advances the room revision.
- Room-scoped HttpOnly SameSite=Lax cookie resumes an existing player and prevents duplicate player creation or card changes. Invalid/missing cookies cannot read `/me`. Public snapshots list player progress but never expose tokens or hashes.
- Added tests for joining, resuming, room isolation, duplicate names, invalid input, origin protection, and token/cookie helpers. **Not yet verified on Windows**: full npm scripts, real Wrangler SQLite behavior, cookie persistence after backend restart, and frontend integration (not in scope).
- Demo players remain in UI. No real frontend room entry, square persistence, WebSockets, player deletion, or leave endpoint exists yet.
- Next: run `docs/15-step8-session-testing.md` then commit; after that implement server-authorized checked-square persistence separately.


## Step 8 verification reported by developer (2026-10-25)

- The same room-scoped cookie successfully recovered player `Henrik`, Karte 7, identical player ID and checked free center after restarting Wrangler. Step 8 was committed/pushed before the Step 9 request.

## Step 9 — Server-persisted bingo progress (2026-10-25, patch prepared)

- Adds an authorized `PUT /api/rooms/:code/me/squares/:index`, requiring `checked: boolean` and `expectedPlayerRevision`. The server explicitly **sets** the value, never toggles it, and persists mask changes in SQLite.
- An additive migration introduces `players.player_revision DEFAULT 0` without erasing existing Step 8 masks or session hashes. A stale write returns `409` with current saved progress, and an already-satisfied retry returns `200 unchanged` with no revision increment.
- Changes update player and room revisions in one SQLite transaction and derive completed fields, lines and first Bingo winner on the server. The first winner remains recorded after later unchecks.
- **Verified here:** source parsing and a real SQLite round-trip harness covering mark/undo, idempotent retry, revision conflicts, first winner, database close/reopen and recovery. **Needs developer Windows verification:** `npm run typecheck`, `npm test`, `npm run build`, actual Wrangler API and restart tests in `docs/17-step9-progress-testing.md`.
- **Not yet implemented:** frontend room/session wiring, persistence UI feedback, WebSocket broadcast, confirmed leave/reset. Demo players remain in the lobby and comparison for interface testing.

## Step 10 — Browser / persistent room integration (2026-10-25, patch prepared)

- The client now creates room URLs (`/r/CODE`), joins via Step 8 sessions, recovers `/me` on reload, renders real lobby/comparison entries from public room snapshots, and saves mark/unmark actions via Step 9's revision-checked API.
- Each write is serialized and the UI displays server-confirmed square state. On a stale write it reloads the canonical player state. On an unresolved save it locks further edits until refresh instead of showing an unverified checkmark.
- **Zur Lobby** is safe navigation that preserves the server record. A returning player can **Bingo fortsetzen**. Changing a card after joining and destructive leave are intentionally unavailable; see `docs/19-navigation-and-safety.md`.
- Added TypeScript HTTP client, room/player mapping, tests for URL parsing, saved-mask reconstruction, same-origin cookie requests and conflicts. Replaced the old local-only App smoke test.
- Lobby and Vergleich no longer display synthetic Mira/Tom. Other player's progress is fetched every five seconds, **not** WebSocket push. Presence, public deployment and cross-device recovery remain deferred.
- **Verified in patch environment:** clean Git patch reconstruction through Step 9, TypeScript source parsing and pure data checks. **Not yet verified:** full npm typecheck/tests/build or actual local browsers (npm registry unavailable). The developer must run the checks in `docs/18-step10-browser-testing.md` before marking complete.
