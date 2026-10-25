# GW2 WvW Bingo

A lightweight, browser-based **multiplayer 5×5 bingo game** for *Guild Wars 2 World vs. World (WvW)*. Friends join the same room, select one of ten predefined German bingo cards, tick off events while playing, and see each other's progress live. The interface is designed for Alt-Tab and second-monitor use.

> **Project status (2026-10-25): frontend scaffold running locally on Windows, German lobby and read-only personal card preview added, pure bingo rules implemented.** The unit tests and complete build still need to be verified locally. Interactive marking, multiplayer backend, API and deployment remain unimplemented. See `PROJECT_STATUS.md` for verification details.

## Run the local frontend

From the repository root, with Node.js 24 and npm installed:

```powershell
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173/`). This is a **local-only lobby and read-only personal card preview**, not yet a playable game. Enter a name, select one of the ten WvW cards, and select **Bingo starten** to open your own preview. **Zur Lobby** returns to the lobby. Squares cannot be marked and no game state is saved. The independent bingo rule calculations and test suite already live in `src/shared/bingo.ts` and `src/shared/bingo.test.ts`.

After installation, verify the project with:

```powershell
npm run typecheck
npm test
npm run build
```

`npm install` generates a `package-lock.json`: **commit this lockfile** along with the scaffold for reproducible installs. The Cloudflare Worker, Durable Object and associated configuration are intentionally deferred to the backend milestone.

## Core experience

1. Someone creates a room and shares its link.
2. Every player chooses a display name and one of the ten existing WvW cards (multiple players may choose the same card).
3. A player clicks an objective to check or uncheck it. The middle **Bonusfeld** is always checked.
4. A bingo is any complete horizontal row, vertical column, or diagonal (12 possible lines).
5. The lobby and comparison sidebar show progress for all players in real time. New players may join at any time without resetting anyone else's game.
6. Refreshing or briefly disconnecting preserves progress. **Verlassen** requires confirmation and deletes only that player's current participation/progress.

**End-user UI and game text:** German. **Code and technical documentation:** English.

## Recommended stack (approved design target, not yet implemented)

| Layer | Choice |
| --- | --- |
| Web client | Preact + TypeScript + Vite + plain CSS |
| HTTP API / asset hosting | Cloudflare Workers, same-origin static assets |
| State per lobby | One SQLite-backed Cloudflare Durable Object per room |
| Realtime | Durable Object WebSocket Hibernation API |
| Persistence | SQLite in the room's Durable Object |
| Version control / deployment | GitHub + Cloudflare Workers deployment |
| Cost target | Free tiers, with quotas and no paid dependency |

See the [architecture](docs/04-architecture.md) and [hosting guide](docs/10-deployment.md). Provider pricing is changeable and must be rechecked before deployment.

## Documentation index

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Starting instructions for future coding assistants |
| [01 — Product specification](docs/01-product-spec.md) | Scope, requirements, acceptance criteria |
| [02 — User flows](docs/02-user-flows.md) | Rooms, joining, playing, comparing, leaving |
| [03 — UI/UX](docs/03-ui-ux.md) | German copy, layout, interactions, accessibility |
| [04 — Architecture](docs/04-architecture.md) | Components, responsibility boundaries, event flow |
| [05 — Data model](docs/05-data-model.md) | Room state, SQL storage, player identities |
| [06 — HTTP & realtime contract](docs/06-api-realtime.md) | Routes, payloads, events, errors |
| [07 — Bingo rules](docs/07-game-rules.md) | Checkmarks, free center, 12-line detection |
| [08 — Security & reliability](docs/08-security-reliability.md) | Session recovery, abuse protection, resilience |
| [09 — Testing](docs/09-testing.md) | Automated and multi-browser acceptance tests |
| [10 — Deployment](docs/10-deployment.md) | Development and free Cloudflare hosting |
| [11 — Roadmap](docs/11-roadmap.md) | Implementation order, release milestones |
| [12 — Prompt handoff](docs/12-future-prompts.md) | Repeatable template for subsequent AI prompts |
| [13 — Full card catalog](docs/13-card-catalog.md) | All ten 5×5 layouts for human review |
| [14 — Requirements traceability](docs/14-requirements-traceability.md) | R01–R16 cross-reference and verification status |
| [ADR 0001](docs/adr/0001-cloudflare-durable-objects.md) | Why this hosting/backend was chosen |
| [data/cards.json](data/cards.json) | Machine-readable card content (canonical) |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Tracks what is actually implemented and verified |

## Local prototype (Step 5)

Run `npm install` (if needed), then `npm run dev` in the repository root. In the lobby, enter a name and pick any of the ten original cards. Click **Bingo starten** to play locally. Click any regular square to check/uncheck it, while the center remains permanently checked. Progress and complete rows/columns/diagonals update instantly. **Zur Lobby** asks before discarding your current marks.

**This remains a single-browser prototype.** Progress is in memory only: refreshing/closing the tab loses it, and no other browser can see the player yet. The room backend, live player list, comparison drawer and durable sessions are future tasks. Run `npm run typecheck`, `npm test`, and `npm run build` before committing.

## Source content

The ten cards are transcribed from the user-provided **GW2 WvW Bingo.pdf** (ten pages, one card per page). Their square positions and the free center are preserved. Obvious spelling and quote-style issues are normalized; see [card catalog](docs/13-card-catalog.md) for provenance and change policy. The PDF itself is not bundled in this repository package.

## Next step

**Next milestone:** verify the interactive local 5×5 board (mark/undo, live counters, bingo warning, confirmed return), then add the comparison drawer and a styled exit dialog. See [TASKS.md](TASKS.md) and the [roadmap](docs/11-roadmap.md). Keep `PROJECT_STATUS.md` accurate after each substantive commit.
