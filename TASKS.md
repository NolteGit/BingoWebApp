# MVP task checklist

A short, ordered list of implementation steps. Work **top to bottom**, keeping each step small enough to build and test before moving on. For details, see [the full roadmap](docs/11-roadmap.md), [the specification](docs/01-product-spec.md), and [current implementation status](PROJECT_STATUS.md).

## 1. Project foundation
- [ ] Scaffold **Vite + Preact + TypeScript + CSS** with working `dev`, `build`, and `test` commands. *(Dev server confirmed in VS Code screenshot; still verify typecheck/test/build.)*
- [ ] Load and validate the **10 cards** from `data/cards.json` (5×5 layout, immutable free center). *(Loader, preview and tests added; check off once local tests pass.)*
- [ ] Implement and unit-test the **12 bingo lines**, checked-square totals, and first-bingo detection.

## 2. Playable UI (local only)
- [ ] Build the **German lobby UI** with name entry, card selection, and card preview.
- [ ] Build the **clickable 5×5 bingo page** with checked-state styling, progress, and a return button.
- [ ] Add the **comparison drawer** and exit confirmation using mock player data. Label the demo as local-only.

## 3. Persistent multiplayer backend
- [ ] Set up **Cloudflare Worker + room Durable Object (SQLite)** and room creation/join/read API.
- [ ] Add **private player sessions**, authorized square updates, confirmed leave, and persisted progress.
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

**Suggested next action:** run the local verification commands, check off the first two foundation items if successful, then implement pure bingo logic (third item).
