# MVP task checklist

A short, ordered list of implementation steps. Work **top to bottom**, keeping each step small enough to build and test before moving on. For details, see [the full roadmap](docs/11-roadmap.md), [the specification](docs/01-product-spec.md), and [current implementation status](PROJECT_STATUS.md).

## 1. Project foundation
- [ ] Scaffold **Vite + Preact + TypeScript + CSS** with working `dev`, `build`, and `test` commands. *(Dev server confirmed in VS Code screenshot; still verify typecheck/test/build.)*
- [ ] Load and validate the **10 cards** from `data/cards.json` (5×5 layout, immutable free center). *(Loader, preview and tests added; check off once local tests pass.)*
- [ ] Implement and unit-test the **12 bingo lines**, checked-square totals, and first-bingo detection. *(Pure rules and tests added; standalone TypeScript/runtime checks passed; run `npm test` and `npm run typecheck` locally before checking off.)*

## 2. Playable UI (local only)
- [ ] Build the **German lobby UI** with name entry, card selection, and card preview. *(Implemented locally in Step 4, with a read-only player screen; run local checks and verify navigation before checking off.)*
- [ ] Build the **clickable 5×5 bingo page** with checked-state styling, progress, and a return button. *(Step 5 implemented locally; verify browser interaction, `npm test`, typecheck and build before checking off.)*
- [ ] Add the **comparison drawer** and exit confirmation using mock player data. Label the demo as local-only. *(Step 6 implemented: own live local marks + two labeled demo players, read-only preview, native exit dialog. Verify locally before checking off.)*

- [ ] Refine **compact lobby UX**: single header, rules/info dialog and on-demand card preview. *(Step 6.5 code added; verify layout, dialogs, Escape, selected-card preview and tests locally.)*
- [ ] Refine **compact game UX**: player name, card selector, comparison/exit buttons and progress above the 5×5 board. Confirm before discarding progress on card change. *(Step 6.6 patch prepared; browser and full test verification pending.)*

- [ ] Share **one compact player overview** between lobby and comparison, with read-only card previews on demand. *(Step 6.7 added: lobby remains empty until live room players exist; comparison uses clearly labeled example players. Verify locally before checking off.)*

- [ ] Refine shared player overview with an **inline, collapsible read-only card** rather than navigating to a second preview. *(Step 6.8 patch prepared; verify click-toggle, switching players, responsive layout and test suite locally.)*

- [ ] **Step 6.9 – compact player rows + floating side preview.** Preview appears next to the stable player list (no row movement), same row toggles close, another row switches. Lobby temporarily shows clearly labeled demo players for UI testing; remove/replace with real room members when backend is connected. Verify locally.

## 3. Persistent multiplayer backend
- [x] Set up **Cloudflare Worker + SQLite room Durable Object** and room creation/read API. *(Step 7 verified locally: room survives Wrangler restart, see PROJECT_STATUS.md.)*
- [ ] Add **private player sessions**, authorized square updates, confirmed leave, and persisted progress. *(Step 8 coded: SQLite player join, private cookie and session recovery. Local restart verification pending. Square updates/leave intentionally follow later.)*
- [ ] Calculate official totals, bingo lines, and first winner **on the server**.

## 4. Live synchronization
- [ ] Broadcast room snapshots over **WebSockets** to the lobby and comparison drawer.
- [ ] Handle **late joins, reconnects, refreshes, offline status**, and independent players choosing the same card.
- [ ] Test simultaneous actions and make sure one player cannot edit another player's card.

## 5. Release
- [ ] Polish German text, responsive layout, keyboard controls, errors, and destructive-exit warning.
- [ ] Run unit/integration and **two-browser** tests; fix failures.
- [ ] Deploy to **Cloudflare Workers free tier**, smoke-test the public URL, and update README.

---

**Workflow for each task:** implement → test → check off here → update `PROJECT_STATUS.md` with verified results → commit. Do not mark untested features complete. Add new ideas to the detailed roadmap rather than expanding this checklist.

**Suggested next action:** verify Step 8 player join/resume, cross-room isolation and restart persistence using `docs/15-step8-session-testing.md`.
