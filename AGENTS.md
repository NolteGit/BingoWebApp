# Instructions for future coding assistants

**Read this before proposing or changing code.** This project has a written specification. The repo's current state must be inspected, not assumed.

## Source-of-truth order

1. Current user instructions in the conversation (explicitly agreed changes may supersede docs).
2. `docs/01-product-spec.md` and `docs/07-game-rules.md` for user-visible semantics.
3. `docs/06-api-realtime.md`, `docs/05-data-model.md` and `docs/08-security-reliability.md` for implementation contracts.
4. `data/tasks.json` for task IDs and objective wording, `data/cards.json` for the ten original presets and positions, and `docs/26-task-library-and-random-cards.md` for editing and random-card rules. `docs/13-card-catalog.md` is the original human-readable mirror.
5. `docs/adr/` for technical decisions and their rationale.
6. `PROJECT_STATUS.md` for **verified** implementation status. Verify against code and tests before claiming anything works.

If requirements conflict, call out the conflict instead of silently changing behavior. Propose updates to the relevant doc before or alongside code. Preserve deliberately undecided items until a decision is recorded.

## Invariants — do not regress

- End-user experience **entirely in German**; technical docs/code in English.
- Preserve the ten original 5×5 presets and positions. An eleventh **Zufallskarte** choice generates a new 24-task mixture per joining player. Tasks are centralized by stable ID; never randomize existing players' stored cards.
- Index 12 (row 3, column 3) is an **immutable free square** and starts checked.
- One room has many players. More than one player may select the same card. Each player's marks are independent.
- A late join never resets or alters other players' cards.
- Mark/unmark is one click. The UI displays server-confirmed saved state; uncertain writes must be reconciled rather than assumed successful.
- A refresh, browser disconnect, or return from offline state **does not delete progress**.
- **Zur Lobby** is non-destructive navigation and preserves the player session. **Neues Bingo starten** and **Raum verlassen** must be confirmed and only remove that player's own active participation; see `docs/19-navigation-and-safety.md`.
- Other players' cards may be inspected but never edited.
- Progress is computed server-side from checked squares. Bingo means 5 checked squares in any of 12 lines.
- Keep runtime and hosting workable on free Cloudflare tiers. No accounts, paid databases, or external service dependencies in MVP.

## Verification map

Use `docs/14-requirements-traceability.md` to connect each feature change with specific requirement IDs and test evidence.

## Working agreement

Before coding:
1. Inspect `PROJECT_STATUS.md`, `TASKS.md`, the current source and tests. Historic milestone docs may be stale.
2. Say what files/behaviors will change and identify open decisions.
3. Prefer the smallest coherent, testable increment over speculative features.

After coding:
1. Run applicable lint/typecheck/tests and report real results, including any unrun checks.
2. Update `PROJECT_STATUS.md` from actual evidence.
3. Update docs/contracts/tests if behavior changed. Never silently rewrite task IDs or the ten original preset layouts.
4. Report any deviation from documented requirements or ADRs.

Do not introduce authentication services, an admin dashboard, public chat, scoring modes, matchmaking, player accounts, or a complicated framework without a separately agreed scope change.

**Prompt handoff:** see `docs/12-future-prompts.md` for suggested prompt format.
