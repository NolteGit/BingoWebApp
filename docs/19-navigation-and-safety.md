# Decision: Safe navigation for an active player

## Context

The local prototype used **Zur Lobby** as a destructive exit action, because it held only ephemeral progress. With persisted player sessions, this would expose participants to unnecessary data loss.

## Current behavior

- **Zur Lobby** is non-destructive navigation. It does not call any deletion endpoint. Lobby offers **Bingo fortsetzen** when a valid player session exists.
- A refresh or same-browser reopen loads the session from the room-scoped HttpOnly cookie; it never creates a new player if that session remains valid.
- A card is chosen at join time and then displayed read-only in the player header. Changing presets requires a future explicit backend action and protective confirmation; it cannot be safely implemented solely in browser state.
- A missing/invalid session, a lost response or a stale update must never silently reset a saved board. Writes are serialized, confirmed by the Worker, and locked when recovery is uncertain.
- **Neues Bingo starten** and **Raum verlassen** use the authenticated `DELETE /api/rooms/:code/me` endpoint and an explicit confirmation. They remove only the current player, not the room or another participant.

## Implications

Older UX handoff sections describe historic local-prototype behavior. The current backend only deletes a player through an authenticated, confirmed request. Existing `ExitDialog` and `CardChangeDialog` modules are historical local-prototype components, not mounted in the server-backed app. Do not wire them to state-only deletion.
