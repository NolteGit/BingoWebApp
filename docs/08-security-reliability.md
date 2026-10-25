# 08 — Security, privacy, and reliability

This game is casual and requires no accounts, but basic authorization still matters because anyone with an invitation link can view the lobby.

## Security boundary

- A room link grants **read** access to player names, chosen cards, and their checked squares. Explain this implicitly through link-based joining; do not call the room private to invitees if the link gets shared further.
- Only a valid, room-scoped participant cookie may mutate that participant's state.
- The server derives player ID from authenticated session, **not** an arbitrary client-supplied `playerId`.
- Every write must validate session, room, request shape, and square bounds.
- A visitor cannot cause other users to leave, reset room state, or change cards.
- If a link is guessed/leaked, the MVP offers no moderator/kick mechanism; avoid putting personal data in display names.

## Sessions

1. Generate a cryptographically random bearer token on join (at least 128 bits of unpredictability; prefer 256).
2. Store its cryptographic hash in SQLite, never the raw token.
3. Deliver it in `Set-Cookie` with `HttpOnly; Secure; SameSite=Lax` and a room-specific API path in production.
4. Use a server-side token lookup (hash) for each authenticated HTTP mutation and authenticated WebSocket connection.
5. Revoke on explicit leave; cookie should expire client-side too.
6. Do not put bearer tokens in query parameters, room links, WebSocket message payloads or frontend localStorage.
7. Check `Origin` on mutation requests and WebSocket upgrades; keep frontend/API on the same origin, and do not set permissive CORS headers.

**Development:** localhost HTTP may require appropriately restricted development cookie handling. Do not copy insecure local cookie settings to production.

## Input safety

- Name length 2–24 Unicode code points after trimming and NFC normalization; reject all-whitespace, control characters, excessive payloads. Display as plain text, never unsanitized HTML.
- Validate card IDs as integers 1–10, square positions as integers 0–24, `checked` as a true boolean.
- User-provided room codes must match the fixed allowable alphabet and length; unknown/uninitialized room => 404.
- No arbitrary card text upload during MVP.
- Limit size of JSON bodies and requests per connection/room. Be mindful that public room creation endpoints could be abused on a free quota.
- Avoid logging cookies, tokens, raw authorization headers, or sensitive user agents.

## Realtime failure modes

**WebSocket dropped:** client shows offline/reconnecting, keeps last authoritative state on screen, retries with capped backoff, then GET snapshot/reopens WS.

**Mark request fails:** if optimistic UI was applied, undo/reconcile against server state; do not pretend it was saved. Offer retry or auto retry with idempotent boolean semantics.

**Request reordered:** use explicit `checked: boolean`, sequential requests per square or a mutation sequence. Prevent a delayed older mark from overwriting the user's latest action. Server revisions and post-response reconciliation matter. Define one consistent policy in implementation tests.

**Server hibernates/restarts:** constructor rebuilds from SQLite and WebSocket attachments. Persist all authoritative marks before responding; never rely only on process memory.

**Two tabs, same participant:** changes in one appear in the other; do not create an accidental duplicate participant on refresh. The latest accepted canonical state is the source of truth.

**Two simultaneous winners:** server serializes changes in the room Durable Object. Exactly one first-bingo entry is stored, later bingos still count.

**Leave while offline:** if deletion is not acknowledged, do not claim it completed. Once reconnected, retry the authenticated leave; show honest status.

## Presence policy

Online/offline is informational only, likely based on currently registered WebSockets with a short grace period. Stale/disconnected sockets must not delete marks. Multiple tabs count as one online participant. UI may show temporarily unknown status during reconnect.

## Abuse limits and housekeeping

- Friendly anonymous app, no payments required, but **rate limiting is still necessary** for room creation/join/write APIs if link is shared widely.
- Limit active player count per room in implementation (initial test target 30). Return German, non-crashing feedback if full.
- Consider configurable idle room expiration and housekeeping alarms for eventual storage cleanup, after the basic app works.
- Verify current Cloudflare quotas before deployment; no infinite/realtime polling loops that burn requests.
- Prefer hibernatable WebSockets over frequent HTTP polling.

## Privacy

Only display names and game interaction data are needed. Do not require Discord accounts, GitHub sign-in, emails, passwords, game account names, IP-based identification, or third-party analytics. Cloudflare may process ordinary connection/edge metadata under its platform terms. Don't promise end-to-end secrecy.

## Release checklist

- Verify all edit routes reject absent/invalid session with 401.
- Verify passing another `playerId` cannot change that player's board.
- Verify join name collisions, malformed cards, and invalid square updates return safe 4xx.
- Verify free center cannot be unset via API.
- Verify cookie flags and websocket Origin checks in deployed domain.
- Verify no secret/session ID appears in logs, error responses, room broadcasts or URLs.
- Verify reconnect, fast double-click, two-tab state, and first-winner concurrency.

## Step 8 cookie security

Per-player sessions use 32 random bytes encoded as hex. Only their SHA-256 hashes are stored in SQLite. Room-scoped session cookies are HttpOnly, SameSite=Lax, and Secure for HTTPS requests. Origin checks reject cross-site join attempts from browsers and explicitly allow the local Vite proxy. A valid cookie always resumes its existing player without changing that player’s selected card, and names must be unique per room. No endpoint deletes a player or their progress in this milestone. Future mutation endpoints must authenticate using the same room cookie, enforce Origin, and never accept client-supplied player IDs as authorization.
