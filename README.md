# GW2 WvW Bingo

A small German-first, bilingual (DE/EN), browser-based **multiplayer 5×5 bingo game** for Guild Wars 2 World vs. World. One player creates a room and shares the link. Everyone picks one of ten fixed bingo cards or a new random card, marks events with a click, and compares progress live.

**Status:** Deployed on Cloudflare Workers and used successfully in browser testing. Automated tests and typecheck/build were reported passing before the latest UI patches. **Re-run all checks after any update.** See [project status](PROJECT_STATUS.md) for verified details and remaining limitations.

## Play

The interface starts in **German** on every page load. Use the small **DE / EN** switch in the header to change the interface to English. Bingo objectives (including the center Bonusfeld) stay in German in either mode. Language is a local, temporary UI setting and never changes shared cards or stored progress.

1. Open the deployed site and create a room.
2. Copy the invitation link and share it with friends.
3. Each person enters a display name, selects one of ten presets or **Zufallskarte / Random card**, and starts.
4. Click a square to mark/unmark it. The **Bonusfeld** in the middle is always checked. A completed row, column, or diagonal counts as a bingo.
5. **Zur Lobby** is safe navigation: your saved marks remain. **Bingo fortsetzen** resumes them. **Neues Bingo starten** and **Raum verlassen** require confirmation and delete only your own entry and progress.
6. On the active bingo card, select **Karte drucken / Print card** to print an unmarked sheet or save it as a PDF using the browser's print dialog. The saved card layout (including random cards) and player name are printed without the online checks.

Multiple players may select the same preset; their marks are independent. The player list and read-only card comparisons update via WebSockets, with HTTP polling as fallback.

## Install and self-host

**New to Cloudflare?** Follow **[the step-by-step self-hosting guide](docs/22-self-host-cloudflare.md)**. It covers Windows/PowerShell, choosing an anonymous Worker/subdomain name, free-tier setup, deployment, and a two-player smoke test. A friend hosting their own copy uses **separate rooms and storage**.

Requirements: Node.js 24 LTS (or a compatible Node release), npm, and a free Cloudflare account.

```powershell
# Clone the repository, then run these in its root directory:
npm ci
npm run typecheck
npm test
npm run build
npx wrangler login
npm run deploy
```

**Do not rename** an already deployed Worker, its `BingoRoom` Durable Object class, or the `v1` migration merely to change its public URL: this can detach access to existing saved rooms. Set the Worker name before the **first** deployment. For more details, see the hosting guide.

## Develop locally

```powershell
npm ci
npm run dev:api   # Terminal 1, API + local Durable Objects
npm run dev       # Terminal 2, browser UI
```

Open <http://localhost:5173>. Use a second browser profile or private window to test another player. Local SQLite state is stored under ignored `.wrangler/` and is separate from production.

## Technology

- **Frontend:** Preact, TypeScript, Vite, plain CSS.
- **Backend:** Cloudflare Worker with one SQLite-backed Durable Object per room.
- **Realtime:** WebSockets with reconnect and polling fallback.
- **Persistence:** Server-confirmed square updates and room-scoped HttpOnly session cookies.
- **Cards:** [`data/tasks.json`](data/tasks.json) is the single-line-per-task library; [`data/cards.json`](data/cards.json) references task IDs for the ten original presets. The eleventh option generates a unique card on join. See [task editing and random cards](docs/26-task-library-and-random-cards.md).

## Data and privacy

No player accounts or emails are required. **Anyone with a room link can see player display names and checked squares.** Use nicknames rather than sensitive personal details. If you clear your browser cookies or switch devices, the existing player may be inaccessible because cross-device recovery codes are not implemented.

Closing a tab does **not** delete progress. A confirmed personal restart or leave does. **Automatic 24-hour room expiration is not implemented**, and this application does not yet provide independent backups. Preserve production Worker identity and storage when updating the application.

To share a source ZIP, **exclude** `.git/`, `.wrangler/`, `node_modules/`, `dist/`, `.env*`, and `.dev.vars*`. Normal Git clones already exclude ignored local files. See [sharing and privacy checklist](docs/25-sharing-and-privacy.md).

## Documentation

| Start here | Purpose |
| --- | --- |
| [Self-hosting guide](docs/22-self-host-cloudflare.md) | First Cloudflare deployment and later updates |
| [Sharing & privacy](docs/25-sharing-and-privacy.md) | Safe ZIP/repository sharing and Git metadata |
| [Project status](PROJECT_STATUS.md) | Current features, verification, known limitations |
| [Remaining tasks](TASKS.md) | Short maintenance checklist |
| [AGENTS.md](AGENTS.md) | Context and safety rules for coding assistants |
| [Architecture](docs/04-architecture.md) | System components and data flow |
| [API contract](docs/06-api-realtime.md) | HTTP/WebSocket API |
| [Game rules](docs/07-game-rules.md) | Free field and bingo detection |
| [Task library and random cards](docs/26-task-library-and-random-cards.md) | Add/edit objectives and random cards |
| [Interface translations](docs/27-interface-language.md) | Manage German/English UI wording |
| [Card catalog](docs/13-card-catalog.md) | Human-readable original presets |
| [Requirements matrix](docs/14-requirements-traceability.md) | Feature-to-test mapping |

Other numbered documents record the original specification, implementation history, and detailed manual test recipes. Where an older planning note conflicts with current code, use **the implementation, tests, and this status file** as the source of truth.

**Language:** The interface supports DE/EN. Bingo objectives remain German. Translations are maintained in [`src/client/i18n.tsx`](src/client/i18n.tsx); see [language toggle guide](docs/27-interface-language.md).
