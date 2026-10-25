# 06 — HTTP and realtime contract (proposed v1)

**Status: partially implemented in Step 7, local verification pending.** `POST /api/rooms` and `GET /api/rooms/:code` are coded for SQLite-backed Durable Objects. All join, session, marks, WebSocket routes and frontend room routing below remain specifications, not working features. Creation returns a future `/r/:code` link that is not yet wired into the frontend.

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
| `GET` | `/api/cards` | None | Return predefined card metadata and optional preview (could be static). |
| `POST` | `/api/rooms/:code/join` | None | Join with name and card; issues session cookie. |
| `GET` | `/api/rooms/:code/me` | Session cookie | Identify own active player and fetch full room state. |
| `PUT` | `/api/rooms/:code/me/squares/:index` | Session cookie | Set desired boolean checked state. |
| `POST` | `/api/rooms/:code/me/leave` | Session cookie | Delete own active player and revoke session. |
| `GET` (upgrade) | `/api/rooms/:code/events` | Room link (cookie optional) | Hibernatable room WebSocket. |

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
{"playerId":"p_83f2","roomCode":"K7MP2A8X","revision":7}
```

`opaque-token` is server-generated, never displayed in client JavaScript, and never included in a room link. The cookie example illustrates the design; exact naming may change if documented consistently.

### Check square

```http
PUT /api/rooms/K7MP2A8X/me/squares/8
Content-Type: application/json
```

```json
{"checked":true}
```

```json
{
  "revision": 8,
  "playerId": "p_83f2",
  "checkedIndices": [8,12],
  "completed": 2,
  "completedLines": 0,
  "hasBingo": false
}
```

- `index` must be 0–24; 12 cannot be set to `false`.
- Repeating the same `checked:true` is idempotent.
- If the player clicks very quickly, the client must serialize requests for that square or send a `clientMutationId` and reconcile against the latest server state. **Never rely on transport delivery order for toggle semantics.**

### Room snapshot response

```json
{
  "type": "room.snapshot",
  "roomCode": "K7MP2A8X",
  "revision": 8,
  "firstBingo": null,
  "players": [
    {
      "playerId": "p_83f2",
      "name": "Mira",
      "cardId": 7,
      "cardVersion": "wvw-v1",
      "card": ["... exactly 25 canonical labels ..."],
      "checkedIndices": [8, 12],
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

Suggested codes: `INVALID_ROOM_CODE`, `ROOM_NOT_FOUND`, `INVALID_NAME`, `NAME_TAKEN`, `INVALID_CARD`, `SESSION_REQUIRED`, `SESSION_NOT_FOUND`, `INVALID_SQUARE`, `FREE_SQUARE_LOCKED`, `RATE_LIMITED`, `INTERNAL_ERROR`. Never expose a session token or stack trace.

## WebSocket protocol

Client connects to `wss://<same-host>/api/rooms/:code/events` (using the room-scoped cookie automatically where applicable). Server checks the request Origin. Spectators can subscribe without an edit session.

**On connect:** send one full `room.snapshot` so a viewer becomes current immediately. **On each state-changing mutation:** broadcast new canonical snapshot to all connected room subscribers. Include `revision` in every message. No client messages are required for writing marks in v1.

Possible server messages:

```json
{"type":"room.snapshot","revision":8,"roomCode":"K7MP2A8X","players":["..."],"firstBingo":null}
```

```json
{"type":"room.error","code":"ROOM_NOT_FOUND","message":"Raum nicht gefunden."}
```

**Client reconnect:** use capped exponential backoff with jitter, then load a fresh snapshot. Do not apply a snapshot with a lower revision than current. Multiple tabs may share one participant identity, and all must stay in sync.

**Presence:** `online` is derived from current sockets or a short disconnect grace period. A dropped connection never deletes game state. If one player has multiple tabs, online stays true as long as any valid socket is attached.

## WebSocket Hibernation-specific guidance

Use `ctx.acceptWebSocket(server)` and persist minimal per-connection metadata through `serializeAttachment`/`deserializeAttachment`. Never depend on ordinary in-memory maps surviving hibernation. Store durable data in SQLite. See [Cloudflare WebSockets guide](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

## Contract versioning

Treat changes to route names, boolean semantics, room snapshot shape, or error codes as contract changes. Update this document, test fixtures and frontend/backend together. Card text changes should advance `cardVersion` and preserve existing player snapshots.
