# 14 — Requirements traceability matrix

This table connects original requirements to tests and current implementation. **Implemented** means corresponding code exists, not that every manual failure scenario has been exhaustively verified. For actual release readiness, also consult [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

| ID | User-visible requirement | Primary contract | Planned evidence | Milestone | Status |
| --- | --- | --- | --- | --- | --- |
| R01 | Create/share a lobby URL | [02 flows](02-user-flows.md), [06 API](06-api-realtime.md) | HTTP create/GET room test, two-browser join | M2 | Implemented |
| R02 | Join midway without resets | [02 flows](02-user-flows.md), [05 data](05-data-model.md) | Three-browser late-join e2e | M3 | Implemented |
| R03 | Enter unique visible name | [01 product](01-product-spec.md), [08 security](08-security-reliability.md) | Name normalization and duplicate tests | M2 | Implemented |
| R04 | Pick one of ten predefined cards | [13 catalog](13-card-catalog.md), [`cards.json`](../data/cards.json) | Card-data validation + duplicate-card independent-player test | M1 + M2 | Implemented |
| R05 | Start a personal board | [02 flows](02-user-flows.md), [03 UI](03-ui-ux.md) | Join/session/navigation e2e | M2 | Implemented |
| R06 | Middle Bonusfeld always checked | [07 game rules](07-game-rules.md) | Pure unit + API mutation rejection test | M1 + M2 | Implemented |
| R07 | One-click check/uncheck | [03 UI](03-ui-ux.md), [06 API](06-api-realtime.md) | Click + idempotency + undo tests | M1 + M2 | Implemented |
| R08 | Live lobby/sidebar progress | [04 architecture](04-architecture.md), [06 API](06-api-realtime.md) | Cross-browser WS fanout test | M3 | Implemented |
| R09 | All 12 bingo lines | [07 game rules](07-game-rules.md) | 12 line unit tests + first-win integration | M1 + M2 | Implemented |
| R10 | Inspect others read-only | [03 UI](03-ui-ux.md), [08 security](08-security-reliability.md) | Compare drawer and forbidden edit e2e | M3 | Implemented |
| R11 | Recover on refresh/reconnect | [05 data](05-data-model.md), [08 security](08-security-reliability.md) | Refresh, DO restart, offline/online tests | M2 + M3 | Implemented; outage tests pending |
| R12 | Confirmed destructive exit | [02 flows](02-user-flows.md), [03 UI](03-ui-ux.md) | Cancel/confirm and remaining-player tests | M2 + M4 | Implemented |
| R13 | All visible copy in German | [03 UI](03-ui-ux.md) | UI text audit and screenshots | M4 | Implemented |
| R14 | Desktop/mobile usable and accessible | [03 UI](03-ui-ux.md) | Keyboard/viewport E2E/manual checks | M4 | Implemented; mobile manual review pending |
| R15 | Free Cloudflare deployment | [10 hosting](10-deployment.md), [ADR 0001](adr/0001-cloudflare-durable-objects.md) | Deployed `workers.dev` smoke test and quota review | M4 | Deployed; smoke tests advisable |
| R16 | Can only edit one's own card | [06 API](06-api-realtime.md), [08 security](08-security-reliability.md) | Session/cross-user write rejection tests | M2 | Implemented |

When adding or changing features, update tests and [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) with actual verification evidence. Do not infer full security or reliability coverage merely from implemented code.
