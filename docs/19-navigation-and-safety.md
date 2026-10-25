# Decision: Safe navigation for an active player

## Context

The local prototype used **Zur Lobby** as a destructive exit action, because it held only ephemeral progress. With persisted player sessions, this would expose participants to unnecessary data loss.

## Step 10 decision

- **Zur Lobby** is non-destructive navigation. It does not call any deletion endpoint. Lobby offers **Bingo fortsetzen** when a valid player session exists.
- A refresh or same-browser reopen loads the session from the room-scoped HttpOnly cookie; it never creates a new player if that session remains valid.
- A card is chosen at join time and then displayed read-only in the player header. Changing presets requires a future explicit backend action and protective confirmation; it cannot be safely implemented solely in browser state.
- A missing/invalid session, a lost response or a stale update must never silently reset a saved board. Writes are serialized, confirmed by the Worker, and locked when recovery is uncertain.
- A future **Spiel verlassen und löschen** operation may be introduced only with an authenticated API, an explicit confirmation, and recovery/undo policy. No delete or room-reset API exists in Step 10.

## Implications

`docs/01-product-spec.md` and older UX handoff sections describe the intended eventual destructive exit. This document clarifies the current milestone. Existing `ExitDialog` and `CardChangeDialog` modules are historical local-prototype components, not mounted in the server-backed app. Do not wire them to state-only deletion.
