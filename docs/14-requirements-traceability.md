# 14 — Requirements traceability matrix

This table is the durable cross-check for future implementations and pull-request reviews. **Statuses refer to production code, not documentation**. All implementation statuses are initially *Not implemented*. Do not mark a row verified solely because it is described in a design file.

| ID | User-visible requirement | Primary contract | Planned evidence | Milestone | Status |
| --- | --- | --- | --- | --- | --- |
| R01 | Create/share a lobby URL | [02 flows](02-user-flows.md), [06 API](06-api-realtime.md) | HTTP create/GET room test, two-browser join | M2 | Not implemented |
| R02 | Join midway without resets | [02 flows](02-user-flows.md), [05 data](05-data-model.md) | Three-browser late-join e2e | M3 | Not implemented |
| R03 | Enter unique visible name | [01 product](01-product-spec.md), [08 security](08-security-reliability.md) | Name normalization and duplicate tests | M2 | Not implemented |
| R04 | Pick one of ten predefined cards | [13 catalog](13-card-catalog.md), [`cards.json`](../data/cards.json) | Card-data validation + duplicate-card independent-player test | M1 + M2 | Not implemented |
| R05 | Start a personal board | [02 flows](02-user-flows.md), [03 UI](03-ui-ux.md) | Join/session/navigation e2e | M2 | Not implemented |
| R06 | Middle Bonusfeld always checked | [07 game rules](07-game-rules.md) | Pure unit + API mutation rejection test | M1 + M2 | Not implemented |
| R07 | One-click check/uncheck | [03 UI](03-ui-ux.md), [06 API](06-api-realtime.md) | Click + idempotency + undo tests | M1 + M2 | Not implemented |
| R08 | Live lobby/sidebar progress | [04 architecture](04-architecture.md), [06 API](06-api-realtime.md) | Cross-browser WS fanout test | M3 | Not implemented |
| R09 | All 12 bingo lines | [07 game rules](07-game-rules.md) | 12 line unit tests + first-win integration | M1 + M2 | Not implemented |
| R10 | Inspect others read-only | [03 UI](03-ui-ux.md), [08 security](08-security-reliability.md) | Compare drawer and forbidden edit e2e | M3 | Not implemented |
| R11 | Recover on refresh/reconnect | [05 data](05-data-model.md), [08 security](08-security-reliability.md) | Refresh, DO restart, offline/online tests | M2 + M3 | Not implemented |
| R12 | Confirmed destructive exit | [02 flows](02-user-flows.md), [03 UI](03-ui-ux.md) | Cancel/confirm and remaining-player tests | M2 + M4 | Not implemented |
| R13 | All visible copy in German | [03 UI](03-ui-ux.md) | UI text audit and screenshots | M4 | Not implemented |
| R14 | Desktop/mobile usable and accessible | [03 UI](03-ui-ux.md) | Keyboard/viewport E2E/manual checks | M4 | Not implemented |
| R15 | Free Cloudflare deployment | [10 hosting](10-deployment.md), [ADR 0001](adr/0001-cloudflare-durable-objects.md) | Deployed `workers.dev` smoke test and quota review | M4 | Not implemented |
| R16 | Can only edit one's own card | [06 API](06-api-realtime.md), [08 security](08-security-reliability.md) | Session/cross-user write rejection tests | M2 | Not implemented |

When a milestone is finished, replace *Not implemented* only after real test evidence and update [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md). Record discovered product changes before modifying this table's baseline requirements.
