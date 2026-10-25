# 12 — Context handoff for future AI coding prompts

Use this file when starting a new ChatGPT/Copilot/Cursor session. It is designed to prevent the app's rules from drifting during incremental coding.

## Minimal project summary

> This GitHub repository implements a German-language, browser-based GW2 WvW 5×5 multiplayer bingo game. There are 10 fixed cards from a user-supplied PDF (canonical file `data/cards.json`). Players share a room link, enter name and select card, then mark events one click at a time. A center free square is always checked. Lobby and comparison sidebar show live independent progress; late joins do not interfere. Only an explicitly confirmed **Verlassen** action deletes personal progress. Proposed stack is Preact + TypeScript/Vite and Cloudflare Worker + SQLite-backed Durable Object with hibernatable WebSockets. The docs are the specification. **Inspect actual code and `PROJECT_STATUS.md`; don't assume milestones are finished.**

## Recommended reusable prompt

```text
You are implementing the GW2 WvW Bingo repository.

Before changes, inspect:
- AGENTS.md
- PROJECT_STATUS.md
- docs/01-product-spec.md
- docs/07-game-rules.md
- docs/04-architecture.md
- docs/06-api-realtime.md
- docs/08-security-reliability.md
- docs/09-testing.md
- data/cards.json

Task: [ONE narrowly scoped milestone or feature].

Please:
1. Inspect actual existing files before proposing modifications.
2. Explain the smallest coherent plan and any discrepancy from the documented spec.
3. Implement only this scope, preserving German user-facing strings.
4. Add/update relevant tests and run the available checks.
5. Update PROJECT_STATUS.md and docs if behavior/contracts change.
6. Report exact files changed, commands/tests run, unresolved issues, and next milestone.

Never invent results, claim tests ran when they did not, or silently redesign the architecture.
```

## Good first implementation prompt

```text
Implement roadmap M1 only: bootstrap a Preact + TypeScript + Vite app, load
canonical data/cards.json, render the ten preset cards in a German 5x5
single-player demo, and add pure unit-tested bingo detection with a locked
free center. Keep changes compatible with later Cloudflare Worker integration.
Do not implement multiplayer or claim it works until M2/M3.
```

## Follow-up comparison checklist

Ask the implementation to give a requirements matrix mapping each changed behavior back to the relevant R01–R16 identifier. Specifically verify these recurring sources of mistakes:

- Does anyone's progress reset when another player joins? Must **not**.
- Can two users choose the same card but mark independently? **Yes**.
- Does refresh disconnect count as leaving? **No**.
- Can anyone inspect others' cards? **Yes, read-only**.
- Is the free center automatically checked and immutable? **Yes**.
- Are all twelve bingo patterns tested? **Yes**.
- Are names, dialogs, errors and buttons German? **Yes**.
- Is a completed bingo recorded server-side? **Yes**.
- Can users edit cards through arbitrary IDs in API calls? **No**.
- Are current code/deployment/test claims verified rather than inferred? **Must be**.

## Change-control discipline

Use `docs/adr/` for changes such as swapping Cloudflare for Firebase, changing session authentication, or altering room lifecycle. Update user-facing docs for gameplay changes. Keep technical docs in English and interface text in German. If a decision is uncertain, label it **Open** in the relevant doc rather than inventing a hidden requirement.
