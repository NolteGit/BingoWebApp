# 11 — Original roadmap and milestone acceptance

> **Historical plan:** This checklist dates from the initial design. M1–M4 have been implemented and a Cloudflare deployment has been demonstrated. The unchecked boxes below are not current work items. Use [`../TASKS.md`](../TASKS.md) and [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) for current status and verification.

The goals below document the original acceptance intent and are preserved for reference.

## M0 — Documentation baseline (this package)

- [x] Product goals, German UI behavior, user flows, contracts, security considerations, tests and hosting direction documented.
- [x] Ten card presets transcribed from source PDF into `data/cards.json` and human-readable card catalog.
- [x] Future-prompt instructions included.
- [ ] Docs added/pushed to the GitHub repository (**user-side action**).

## M1 — Frontend scaffold + offline single-player demo

- [ ] Bootstrap Preact + Vite + TypeScript, basic styles and routes.
- [ ] Render the 10 presets correctly, 5×5, German labels, fixed center.
- [ ] Mark/unmark with one click; local progress and all 12 bingo lines work.
- [ ] Pure rule/card-validation unit tests pass.
- [ ] No fake claim of live multiplayer yet.

**Exit condition:** a local, refreshable build displays each correct card and unit-tested bingo logic. Can run a demo without backend, but clearly label local-only state.

## M2 — Room backend + persistence

- [ ] Add Cloudflare Worker + SQLite-backed Room Durable Object.
- [ ] Create room, read room, join, `GET /me`, mark, and confirmed leave endpoints.
- [ ] Use room-scoped private cookie, authoritative player state and card snapshots.
- [ ] Persist checked marks and first winner across DO restart.
- [ ] Integration tests reject unauthorized edits and preserve independent marks.

**Exit condition:** at least two clients use same room state via HTTP even before websocket integration.

## M3 — Real-time multiplayer

- [ ] Hibernatable WebSocket room subscriptions and snapshot events.
- [ ] Lobby scoreboard, comparison drawer, and independent boards.
- [ ] Reconnection, offline UI and resync after disconnect.
- [ ] Late join never touches existing player state.
- [ ] Multi-browser and fast-toggle tests pass.

**Exit condition:** two browsers see updates live; a third can join midway.

## M4 — Polish + production deployment

- [ ] Confirm German copy and accessible squares/dialogs.
- [ ] Error states, quota protection and safe cookie/origin behavior.
- [ ] Confirmed leave fully removes personal progress but not room state.
- [ ] Deploy to Cloudflare workers.dev, smoke test in production with independent sessions.
- [ ] Update README with actual live URL, setup scripts and verified status.

**Exit condition:** R01–R16 in the product specification pass in actual deployed environment.

## Deferred ideas / explicitly not MVP

- Host powers (kick, reset, end game); card editor and card sets; public rooms; history and statistics; sounds, badge effects; cross-device recovery codes; spectator categories; analytics.

## Issues and scope changes

New requirements should be recorded as issues or appended to a decision log. Changes affecting API/state must update the docs and tests in the same PR. Use an ADR for any major infrastructure reversal.
