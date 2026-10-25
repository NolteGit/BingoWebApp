# GW2 WvW Bingo

A lightweight, browser-based **multiplayer 5×5 bingo game** for *Guild Wars 2 World vs. World (WvW)*. Friends join the same room, select one of ten predefined German bingo cards, tick off events while playing, and see each other's progress live. The interface is designed for Alt-Tab and second-monitor use.

> **Project status (2026-10-25):** Multiplayer backend and local SQLite persistence, player sessions, saved bingo progress, real room UI, and WebSocket updates are implemented and locally exercised. Step 12 adds recovery safeguards and requires the Windows outage tests in `docs/20-step12-reliability-testing.md`. Public deployment is not yet complete. See `PROJECT_STATUS.md` for verification details.

## Run locally

From the repository root, with Node.js 24 and npm installed:

```powershell
npm install
npm run dev
```

To test full multiplayer, run `npm run dev:api` in a second terminal, then create a room at `http://localhost:5173/`. Share its `/r/CODE` link and join from a separate browser/private window. The Worker stores local rooms under `.wrangler/`. Never delete that directory if you need to retain your local games. Data in local Wrangler is independent of production storage.

Check the project with:

```powershell
npm run typecheck
npm test
npm run build
```

The browser uses room-specific HttpOnly session cookies. Actual checkmarks are written to SQLite and confirmed by the server. The Step 12 patch displays connection/save status and automatically attempts to recover uncertain saves without blindly repeating a write. See [Step 12 manual test guide](docs/20-step12-reliability-testing.md).

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
limits would invite abuse. Authorized progress updates, persistence of player progress, and the
working `/r/:code` frontend route are future tasks. The API-generated `roomUrl` is
therefore a reserved path, not a usable invite screen yet. See
[the API spec](docs/06-api-realtime.md).

## Backend Step 8: private player sessions (local)

In addition to creating and reading rooms, the Worker now supports `POST /api/rooms/:code/join` and `GET /api/rooms/:code/me`. New joins store a player and selected card in SQLite and issue a room-scoped HttpOnly cookie. Existing valid cookies resume a player instead of creating a duplicate. The frontend is not yet wired to these endpoints; the sample player entries remain demo UI. For the full Windows persistence/restart checks, see [Step 8 session testing](docs/15-step8-session-testing.md).


### Step 9 backend progress API

The backend now supports authenticated square writes with `PUT /api/rooms/:code/me/squares/:index`, body `{ "checked": true, "expectedPlayerRevision": 0 }`. The response contains the saved canonical state, a per-player revision, the room revision and first-winner metadata. Stale writes return `409` instead of silently overwriting a newer change; safe retries return `unchanged`. See [Step 9 test guide](docs/17-step9-progress-testing.md). **The browser UI is still local/demo-only** until room integration is implemented.

## Step 10 — Browser joins a real saved room (local)

The root page `/` creates a room. The generated `/r/CODE` link opens a shared lobby. Players enter a name, select one of the ten original cards, and receive a room-scoped HttpOnly session cookie. The playable board now uses the server's saved marks and revision-aware square updates; lobby and Vergleich show **real room players**, not Mira/Tom examples. When the same browser refreshes, `/me` recovers its existing player and marks. **Zur Lobby is safe navigation** and offers **Bingo fortsetzen**; no player deletion or card-reset endpoint is present.

During this milestone other player snapshots refresh on a **5-second poll**, not WebSockets. No online/offline presence is claimed. Square writes show confirmed server state and lock edits if the saved state cannot be recovered. Do not clear `.wrangler/state` when testing persistence. Public deployment is still deferred pending rate limiting and security checks.

Start Wrangler (`npm run dev:api`) and Vite (`npm run dev`) in two terminals. Follow the [two-browser test guide](docs/18-step10-browser-testing.md), including refresh, restart, navigation, and conflict scenarios. See [safe navigation decision](docs/19-navigation-and-safety.md).

## Step 11 — Real-time room updates (local test pending)

With `npm run dev:api` and `npm run dev` running, authenticated participants connect to `/api/rooms/:code/events` using Cloudflare Durable Object WebSockets. Room snapshots appear immediately in lobby/Vergleich, including best-effort presence. The backend continues to persist all marks in SQLite via authenticated HTTP PUT. If the socket disconnects, the browser reconnects and uses five-second HTTP polling as fallback. No room/player data is deleted on disconnect.

Follow [Step 11 test guide](docs/19-step11-realtime-testing.md) in two separate browser sessions before committing this milestone. WebSocket/live behavior has not yet been manually verified in Windows browsers.
