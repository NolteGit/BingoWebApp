# Project status

Last documentation review: **2026-10-25**.

## Actual implementation status

| Capability | Status | Evidence |
| --- | --- | --- |
| Documentation baseline | Complete | README, documentation files, ADR |
| Ten source cards transcribed | Complete (data/documentation) | `data/cards.json`, `docs/13-card-catalog.md` |
| Frontend scaffold | Code added; awaiting Windows verification | `package.json`, `vite.config.ts`, `src/client/` and `index.html`; run `npm install`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev` |
| 5×5 playable card | Not started | — |
| Pure bingo detection | Not started | — |
| Lobby / join flow | Not started | — |
| Backend Durable Object | Not started | — |
| Persistence and sessions | Not started | — |
| Realtime connections | Not started | — |
| Automated tests | One smoke test added; not yet executed | `src/client/App.test.tsx` (Preact server rendering) |
| Cloudflare deployment | Not started | — |

## Scaffold handoff (2026-10-25)

- Added Vite + Preact + TypeScript, plain CSS and a clearly marked **local-only** German starter screen.
- Added typecheck/build/test scripts and a small UI render smoke test.
- **Environment limitation:** package installation, TypeScript compilation, browser rendering and Vitest execution could not be performed in the patch-authoring environment (npm registry access unavailable). Do **not** mark the first checkbox in `TASKS.md` done until the commands below pass on Windows.
- On Windows: `npm install`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run dev`. Commit the resulting `package-lock.json`.
- No Cloudflare backend, Worker configuration, card loader or bingo game logic has been implemented.

## Verified facts

- `data/cards.json` defines 10 cards, each 5×5, with the center position set to `Bonusfeld`.
- Content follows the ten pages of the user-provided PDF; a few obvious typos were normalized and are documented in the catalog.
- Cloudflare Workers + SQLite-backed Durable Objects and WebSocket Hibernation are documented supported capabilities; **no deployed service has yet been tested**.

## How to maintain this file

For each implementation milestone, record the date, what works, the command/tests used to verify it, deployment URL if actually deployed, known issues, and next action. Distinguish **planned** from **implemented**. Never claim a browser import, deployment, or concurrency scenario is verified solely because source code exists.

## Immediate next action

Verify the frontend scaffold locally on Windows, then check off the first item in `TASKS.md`. Next, load and validate `data/cards.json` without duplicating card content.
