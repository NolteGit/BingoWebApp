# GW2 WvW Bingo

A lightweight, browser-based **multiplayer 5×5 bingo game** for *Guild Wars 2 World vs. World (WvW)*. Friends join the same room, select one of ten predefined German bingo cards, tick off events while playing, and see each other's progress live. The interface is designed for Alt-Tab and second-monitor use.

> **Project status (2026-10-25): frontend scaffold running locally on Windows, German lobby, clickable local bingo board, and comparison/exit UI added; pure bingo rules implemented.** The unit tests and complete build still need to be verified locally. Multiplayer backend, persistence, API and deployment remain unimplemented. See `PROJECT_STATUS.md` for verification details.

## Run the local frontend

From the repository root, with Node.js 24 and npm installed:

```powershell
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173/`). This is a **local-only playable prototype**, not a multiplayer room. Enter a name, choose one of the ten WvW cards, and select **Bingo starten**. The compact lobby keeps rules in **Regeln & Infos** and shows a selected card only when **Karte ansehen** is clicked. Click squares to check or undo them. **Vergleich** opens a read-only comparison with your *actual local board* and two **clearly marked example players** (not online participants). **Zur Lobby** requests explicit confirmation before clearing the current session. Refreshing still loses local progress. The shared bingo rules live in `src/shared/bingo.ts`.

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

## Local prototype (Steps 5–6)

Run `npm install` (if needed), then `npm run dev` in the repository root. In the lobby, enter a name and pick any of the ten original cards. Click **Bingo starten** to play locally. Click any regular square to check/uncheck it, while the center remains permanently checked. Progress and complete rows/columns/diagonals update instantly. **Zur Lobby** asks before discarding your current marks.

**This remains a single-browser prototype.** Progress is in memory only: refreshing/closing the tab loses it, and no other browser can see the player yet. The comparison drawer is implemented with two sample participants, *not* live users. The room backend, live player list and durable sessions are future tasks. Run `npm run typecheck`, `npm test`, and `npm run build` before committing.

## Source content

The ten cards are transcribed from the user-provided **GW2 WvW Bingo.pdf** (ten pages, one card per page). Their square positions and the free center are preserved. Obvious spelling and quote-style issues are normalized; see [card catalog](docs/13-card-catalog.md) for provenance and change policy. The PDF itself is not bundled in this repository package.

## Next step

**Next milestone:** verify the local comparison drawer and styled exit dialog (including Esc/focus/undo), then implement the Cloudflare Worker and Durable Object backend. See [TASKS.md](TASKS.md) and the [roadmap](docs/11-roadmap.md). Keep `PROJECT_STATUS.md` accurate after each substantive commit.

## Lobby UX refinement (Step 6.5)

The lobby now has a single compact **GW2 Bingo** header, name/card selection, and the future player overview. **Regeln & Infos** and **Karte ansehen** open accessible modal dialogs (Escape or **Schließen** dismisses them). Multiple players may use the same card, as documented in the rules. The card preview does not mount its 5×5 content until requested. The local version still loses marks on page refresh. This UI change does not add persistent sessions or live player counts.

## Compact personal bingo screen (Step 6.6)

The in-game view now shows the player's **name**, a **card selector**, **Vergleich** and **Zur Lobby** above the progress counters and the 5×5 board. The large duplicate title, static explanatory box, always-visible hint, and game footer were removed. The status pill still says **Lokal · ungespeichert** until persistent storage exists. The bingo banner only appears after completing a line.

**Changing the selected card requires confirmation** because it discards all currently checked squares in the local preview; cancelling (including Escape) preserves the current card and progress. Confirming switches the preset and resets the free-center-only state. This is deliberately a local prototype action; multiplayer room rules will determine whether switching cards is allowed after joining.

## Expandable player overview (Step 6.8)

In **Vergleich**, the list always stays visible. Select a player to view their original marked card inline. On a wide screen it appears to the right of the list, otherwise below; select the same player to close it, or another player to switch. The lobby uses this same component once real room participants are available. The original sample players remain limited to comparison, not the lobby. The preview is read-only.

### UI prototype: player list and preview (Step 6.9)

The local lobby deliberately shows **two labeled example players** to test the final lobby leaderboard. Selecting a row opens a read-only bingo card beside the list without shifting the rows. Selecting it again closes the preview. The same shared component is used by Vergleich. These are mock players only; multiplayer and persistence are still to be implemented.


## Step 7 — Cloudflare backend (room metadata only)

The frontend still runs in local-only mode. This step adds a separate Worker API with
SQLite-backed Durable Objects for room creation and public room metadata. No player
joining, progress persistence, or realtime messaging is connected yet.

```powershell
npm install
npm run typecheck
npm test
npm run build
```

Open two VS Code PowerShell terminals in the repository folder:

```powershell
# Terminal 1: start the Worker + durable local SQLite storage on port 8787
npm run dev:api
```

```powershell
# Terminal 2: start Vite UI on port 5173; /api is proxied to port 8787
npm run dev
```

Test the API using a third terminal:

```powershell
$created = Invoke-RestMethod -Method Post -Uri 'http://localhost:5173/api/rooms'
$created
Invoke-RestMethod -Uri ("http://localhost:5173/api/rooms/" + $created.roomCode)
```

Stop and restart the Worker terminal. The second request should still return the same room.
Local Durable Object data lives under `.wrangler/` and is **not** the production database.
Do not delete that directory if you want to retain local test rooms.

**Deployment intentionally deferred:** publicly exposing room creation without rate
limits would invite abuse. Authentication, persistence of player progress, and the
working `/r/:code` frontend route are future tasks. The API-generated `roomUrl` is
therefore a reserved path, not a usable invite screen yet. See
[the API spec](docs/06-api-realtime.md).
