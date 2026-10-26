# 06 — HTTP and realtime API (current)

**Status (2026-10-26): Implemented HTTP and WebSocket routes are described below. Older examples are retained for integration tests; code in `src/server/api.ts` is authoritative.**

## General conventions

- Base: `/api`, all HTTPS and same-origin with frontend.
- JSON request/response, UTF-8. Use `Content-Type: application/json` for requests with bodies.
- Public, unguessable room-code URL grants read access; a session cookie grants the right to update **only own** board.
- HTTP mutation responses return authoritative canonical state. WebSockets are for live room state distribution, not a separate write authority.
- Every room snapshot includes an increasing integer `revision`.
- On application boot or reconnection, fetch a fresh HTTP snapshot; don't assume missed WebSocket events were buffered.
- Limit inputs; reject unknown indexes/cards. Avoid unbounded string/object payloads.

## HTTP endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/rooms` | None | Create and initialize room; return code and link. |
| `GET` | `/api/rooms/:code` | Room link | Get public room snapshot/metadata. |
| — | `/api/cards` | — | **Not implemented.** Card presets are bundled in `data/cards.json`. |
| `POST` | `/api/rooms/:code/join` | None or existing cookie | Join with name and card, or resume; issues session cookie for new players. |
| `GET` | `/api/rooms/:code/me` | Session cookie | Identify own persistent player; includes own card ID and checked indices. |
| `PUT` | `/api/rooms/:code/me/squares/:index` | Session cookie | Set desired boolean checked state. |
| `DELETE` | `/api/rooms/:code/me` | Session cookie | Confirmed personal restart/leave: delete own player and revoke session; room stays. |
| `GET` (upgrade) | `/api/rooms/:code/events` | Valid room-scoped session cookie | Hibernatable, read-only room WebSocket. |

### Create response

```http
POST /api/rooms
201 Created
```

```json
{"roomCode":"K7MP2A8X","roomUrl":"/r/K7MP2A8X"}
```

### Join request / success

```json
{"name":"Mira","cardId":7}
```

```http
201 Created
Set-Cookie: bingo_session_K7MP2A8X=<opaque-token>; Path=/api/rooms/K7MP2A8X; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

```json
{"roomCode":"K7MP2A8X","player":{"playerId":"uuid","name":"Mira","cardId":7,"cardVersion":"wvw-v1","checkedIndices":[12],"joinedAt":"..."},"revision":7,"resumed":false}
```

A repeat `POST /join` with a valid cookie returns `200` with `resumed:true`, retaining the original player and card instead of creating a new one. A duplicate name without that cookie returns `409 NAME_TAKEN`. `GET /api/rooms/:code/me` returns the same player object (without `resumed`) if the browser sends the room-scoped session cookie, or `401 SESSION_REQUIRED` if no valid session exists. **The cookie is HttpOnly, SameSite=Lax, scoped to `/api/rooms/:code` and Secure on HTTPS deployments.** During local HTTP development it omits Secure so the testing client can send it.

`opaque-token` is server-generated, never displayed in client JavaScript, and never included in a room link. The cookie example illustrates the design; exact naming may change if documented consistently.

### Persistent square update (Step 9)

```http
PUT /api/rooms/K7MP2A8X/me/squares/8
Content-Type: application/json
Cookie: bingo_session_K7MP2A8X=<private HttpOnly cookie>
```

```json
{"checked":true,"expectedPlayerRevision":0}
```

The response is the **authoritative persisted** state, not a frontend guess:

```json
{
  "playerId":"uuid", "checkedIndices":[8,12], "completed":2,
  "completedLines":0,"hasBingo":false,"playerRevision":1,
  "revision":8,"firstBingo":null,"status":"updated"
}
```

- An HTTP retry requesting the **already-current** value returns `200 status:"unchanged"`, without increasing either revision, even if the supplied expected revision is older. Safe after a lost response.
- A real change with a stale `expectedPlayerRevision` is rejected with `409 STALE_PLAYER_REVISION`, plus `current` containing the current authoritative player state and its revisions. Fetch/reconcile before retrying, **do not auto-issue an outdated inverse command**.
- Every effective change increments the player and room revisions once; changing a different player's fields does not invalidate this player's expected revision.
- `checked` must be an actual boolean, `expectedPlayerRevision` a nonnegative safe integer, `index` a canonical decimal in 0–24. The center (12) cannot be unchecked. All writes require the correct room-scoped session cookie and allowed Origin.
- `GET /api/rooms/:code/me` now returns `player.playerRevision`. Public player snapshots also include `playerRevision`. Existing rooms are migrated additively without clearing any masks.
- The first transition to one or more completed lines is stored in SQLite as `firstBingo:{playerId,name,at}`. It is retained if the winner later unchecks a field. Other players' completed lines still count.
- **Current frontend:** queues server-confirmed writes, shows save/connection state and reconciles uncertain results before allowing another click.

### Room snapshot response

```json
{
  "type": "room.snapshot",
  "roomCode": "K7MP2A8X",
  "revision": 8,
  "firstBingo": null,
  "players": [
    {
      "playerId": "uuid",
      "name": "Mira",
      "cardId": 7,
      "cardVersion": "wvw-v1",
      "card": ["... exactly 25 canonical labels ..."],
      "checkedIndices": [8, 12],
      "playerRevision": 1,
      "completed": 2,
      "completedLines": 0,
      "hasBingo": false,
      "online": true
    }
  ]
}
```

The `card` example is abbreviated for readability only. Actual responses must provide exactly 25 labels and use the snapshot chosen at join.

### Error envelope

Use appropriate 400/401/404/409/429/500 HTTP status with stable machine code:

```json
{"error":{"code":"NAME_TAKEN","message":"Dieser Name ist bereits vergeben."}}
```

Suggested codes: `INVALID_ROOM_CODE`, `ROOM_NOT_FOUND`, `INVALID_NAME`, `NAME_TAKEN`, `INVALID_CARD`, `SESSION_REQUIRED`, `SESSION_NOT_FOUND`, `INVALID_SQUARE`, `INVALID_SQUARE_UPDATE`, `STALE_PLAYER_REVISION`, `FREE_SQUARE_LOCKED`, `RATE_LIMITED`, `INTERNAL_ERROR`. Never expose a session token or stack trace.

## WebSocket protocol

Client connects to `wss://<same-host>/api/rooms/:code/events` (using the room-scoped cookie automatically where applicable). Server checks the request Origin. This implementation requires a valid room player session; unauthenticated spectators continue to use public HTTP snapshots. No session token is sent in the URL.

**On connect:** send one full `room.snapshot` so an authenticated player becomes current immediately. **On each state-changing mutation:** broadcast new canonical snapshot to all connected room subscribers. Include `revision` in every message. No client messages are required for writing marks in v1.

Possible server messages:

```json
{"type":"room.snapshot","revision":8,"roomCode":"K7MP2A8X","players":["..."],"firstBingo":null}
```

```json
{"type":"room.error","code":"ROOM_NOT_FOUND","message":"Raum nicht gefunden."}
```

**Client reconnect:** use capped exponential backoff with jitter; the server sends a full snapshot on each successful connection and HTTP polling remains as fallback. Do not apply a snapshot with a lower revision than current. Multiple tabs may share one participant identity, and all must stay in sync.

**Presence:** `online` is derived from current sockets or a short disconnect grace period. A dropped connection never deletes game state. If one player has multiple tabs, online stays true as long as any valid socket is attached.

## WebSocket Hibernation-specific guidance

Use `ctx.acceptWebSocket(server)` and persist minimal per-connection metadata through `serializeAttachment`/`deserializeAttachment`. Never depend on ordinary in-memory maps surviving hibernation. Store durable data in SQLite. See [Cloudflare WebSockets guide](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

## Contract versioning

Treat changes to route names, boolean semantics, room snapshot shape, or error codes as contract changes. Update this document, test fixtures and frontend/backend together. Card text changes should advance `cardVersion` and preserve existing player snapshots.
