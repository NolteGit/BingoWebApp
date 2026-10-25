# Project status

Last documentation review: **2026-10-25**.

## Actual implementation status

| Capability | Status | Evidence |
| --- | --- | --- |
| Documentation baseline | Complete | README, documentation files, ADR |
| Ten source cards transcribed | Complete (data/documentation) | `data/cards.json`, `docs/13-card-catalog.md` |
| Frontend scaffold | Not started | No frontend source committed in this documentation package |
| 5×5 playable card | Not started | — |
| Pure bingo detection | Not started | — |
| Lobby / join flow | Not started | — |
| Backend Durable Object | Not started | — |
| Persistence and sessions | Not started | — |
| Realtime connections | Not started | — |
| Automated tests | Not started | — |
| Cloudflare deployment | Not started | — |

## Verified facts

- `data/cards.json` defines 10 cards, each 5×5, with the center position set to `Bonusfeld`.
- Content follows the ten pages of the user-provided PDF; a few obvious typos were normalized and are documented in the catalog.
- Cloudflare Workers + SQLite-backed Durable Objects and WebSocket Hibernation are documented supported capabilities; **no deployed service has yet been tested**.

## How to maintain this file

For each implementation milestone, record the date, what works, the command/tests used to verify it, deployment URL if actually deployed, known issues, and next action. Distinguish **planned** from **implemented**. Never claim a browser import, deployment, or concurrency scenario is verified solely because source code exists.

## Immediate next action

Milestone 1 from `docs/11-roadmap.md`: bootstrap Vite + Preact, Worker binding, card rendering and unit-tested bingo logic.
