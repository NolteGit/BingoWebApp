# 01 — Product specification

**Status:** MVP contract / accepted scope baseline (2026-10-25).

## Purpose

Create a small, free-to-host browser game for friends playing *Guild Wars 2 World vs. World*. Users should be able to watch for funny or common WvW moments, check off objectives on their chosen bingo card, and casually compare live progress with their friends. Primary usage is a desktop browser beside GW2, either via Alt-Tab or a second monitor.

## User types

- **Participant:** anyone with the room link. Chooses a name/card; can modify only their own marks; can view others' progress.
- **Visitor:** someone with the room link who has not joined. Sees lobby/players and can join later. MVP viewing does not require login.
- **Room creator:** creates and shares a room, but has **no special moderator/admin powers in MVP**. Host-only controls are deferred.

## MVP functional requirements

| ID | Requirement | Acceptance statement |
| --- | --- | --- |
| R01 | Create a lobby | A user creates a room and receives a shareable, hard-to-guess room URL. |
| R02 | Join anytime | A newcomer can see the current lobby and join after other people have started. Existing state does not change. |
| R03 | Name | Each participant chooses a visible name, unique (case-insensitive) among active players in that room. |
| R04 | Card presets | Choose one of 10 fixed WvW cards in their original arrangement. Duplicate selections across players are allowed. |
| R05 | Start | Press **Bingo starten** to create an independent player session and enter the bingo screen. |
| R06 | Free center | Center square starts checked and cannot be unchecked. |
| R07 | Click-to-check | Single click/tap marks or unmarks one of the other 24 objectives. Immediate feedback. |
| R08 | Live progress | The lobby and comparison panel reflect authoritative updates from the backend. |
| R09 | Bingo detection | Detect all five rows, five columns, and two diagonals. Completed lines count independently. |
| R10 | Comparison | A player can inspect another player's full card read-only without losing own screen state. |
| R11 | Resume | Refresh, reload, or temporary disconnection reopens the same player and same saved marks. |
| R12 | Explicit exit | **Verlassen** displays a destructive confirmation; on confirmation, own participation/progress is removed, and browser returns to lobby. |
| R13 | German UI | All button labels, errors, help and game objective text displayed to players are in German. |
| R14 | Responsive | Usable on modern desktop browsers and on narrower screens. No mobile app installation. |
| R15 | Free deployment | Serve frontend/API from Cloudflare Workers Free using SQLite-backed Durable Objects within published quotas. |
| R16 | Validation | No user can mark another player’s card by altering request IDs, session details, or parameters. |

## Rules of play

- Every card has 25 positions; the middle is the free `Bonusfeld`.
- Tick a square when its event actually occurs. **Do not deliberately cause events just to complete objectives.**
- A bingo is any row, column or diagonal of five checked positions.
- All participants may continue playing even after the first bingo. The app displays the first recorded bingo winner but **does not lock/end the room**.
- A player may join after someone else already achieved bingo.
- The user can undo a mistaken check except on the middle square.
- Card selection is fixed once the participant starts. To switch cards, they must explicitly leave (losing their prior progress) and join again.

## Derived progress indicators

- `completed`: number of checked positions, **including** the free center. Starts at 1/25.
- `completedLines`: number of completed bingo lines, 0–12.
- `percent`: round(`completed / 25 * 100`), display as integer percent.
- `hasBingo`: `completedLines >= 1`.
- `online`: informational connection status; **not** a criterion for counting progress.
- `firstBingo`: awarded atomically to the first completed line recorded by the server in the room. Network ordering, not subjective gameplay time, resolves a near-simultaneous finish.

## Non-functional targets

- Small client bundle; one origin; no ad tracking or third-party script requirement.
- A square click feels immediate. Backend confirmation corrects any failed/invalid optimistic mark.
- WebSocket reconnect with exponential backoff and a fresh server snapshot after connection.
- Stable under a small private lobby (initial design/test target **up to 30 concurrent participants**; capacity is a design target, not a verified hard limit).
- Data writes survive Worker restarts and Durable Object hibernation.
- Keyboard focus, semantic controls, contrast, and readable German text on 5×5 cells.

## Explicitly out of scope for MVP

Accounts/passwords, public room discovery, voice/chat, achievements beyond bingo, host/admin actions, card editing on the website, custom user-generated cards, ranking across games, statistics history, spectator moderation, user avatars, matchmaking, paid features, and end-of-game locking.

## Open decisions / flexibility

- Exact visual theme and color palette are not fixed; optimize clarity in a GW2-adjacent style.
- Whether to show a short celebratory animation/sound on bingo is optional, off by default if it would interrupt gameplay.
- Room idle expiry policy is not core gameplay; agree and document retention before public rollout.

## Definition of MVP done

All R01–R16 pass the tests in [09 — Testing](09-testing.md), including testing with at least two independent browsers and one late join. Deployed Cloudflare URLs and actual free plan behavior must be tested before labeling hosting complete.
