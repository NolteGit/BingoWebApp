# ADR 0001 — Cloudflare Workers and Durable Objects for multiplayer state

- **Status:** Accepted as implementation target, not yet deployed.
- **Date:** 2026-10-25
- **Decision drivers:** free hosting, low maintenance, small private rooms, late joining, persistent player progress, realtime comparison, GitHub source repo.

## Context

A static site can draw a bingo board but cannot alone synchronize independent player state across browsers. Google Sheets worked as an editable shared artifact but has unnecessary UI friction and import quirks for this game. The desired product should open from a simple link, with no external account required for participants.

## Decision

Use one Cloudflare Workers deployment with a Preact/TypeScript frontend and a Worker HTTP API, routing each room to its own **SQLite-backed Durable Object**. Use hibernatable WebSockets to push room snapshots. Persist authoritative marks and private sessions in the DO's SQLite storage.

## Why

- One provider for static files, API, realtime and storage.
- Durable Objects provide serialized per-room operations, simplifying first-winner selection and concurrent updates.
- SQLite-backed DOs work on Workers Free (at the date checked).
- Hibernatable WebSockets are a documented cost-conscious realtime option.
- No separately managed server/DB cluster and no participant login.

## Alternatives considered

| Alternative | Assessment |
| --- | --- |
| GitHub Pages only | Rejected: static hosting cannot provide shared persistent multiplayer backend. |
| GitHub Pages + Firebase | Feasible, but introduces a second service and different permission/rules model. |
| GitHub Pages + Supabase | Feasible, but adds a second platform and free-tier project lifecycle considerations. |
| P2P/WebRTC only | Adds signaling/host-availability complexity and weak persistence when all peers leave. |
| Ordinary Cloudflare Worker plus KV | Lacks the same room-local transactional authority/realtime event model; not the preferred fit. |

## Consequences

- Backend is coupled to Cloudflare DO runtime. Pure bingo logic and DTO validation should remain portable.
- Requires correct WebSocket hibernation handling, production tests, and safe cookie-based authorization.
- Cloudflare free quotas and pricing remain external constraints and must be rechecked before production launch.
- Room access is link-based and read-visible to people holding the link; no user accounts are planned.

## Revisit if

Free limits change materially, provider tooling blocks reliable developer workflow, the app needs cross-room analytics/complex administration, or user explicitly requests another hosting stack. Record replacement architecture in a new ADR rather than overwriting this rationale.

## Provider documentation reviewed

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/durable-objects/get-started/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
