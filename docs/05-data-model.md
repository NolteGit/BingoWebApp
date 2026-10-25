# 05 — Data model and persistence

## Design principles

- **One room = one SQLite-backed Durable Object.** Its database is logically isolated from all other rooms.
- Store only enough data for anonymous game sessions. No account/password or email required.
- Each active participant owns a single immutable chosen card and an independent 25-bit check state.
- Client-visible fields are derived from authoritative persisted data; do not accept client-supplied progress counts.
- Keep card content stable during a running session by storing a 25-label **snapshot at join time**.

## Core entities

### Room

| Field | Type | Meaning |
| --- | --- | --- |
| `roomCode` | 8-char uppercase URL-safe string | Public shareable room locator, generated securely. |
| `createdAt` | ISO timestamp | Creation time. |
| `revision` | nonnegative integer | Monotonic room state revision. |
| `firstBingoPlayerId` | string/null | First bingo recorded by the server; remains even if that player later exits unless product requirement changes. |
| `firstBingoAt` | ISO/null | Award time at server. |
| `lastActivityAt` | ISO timestamp | For possible room-expiration/cleanup policy. |

`firstBingoPlayerId` may refer to a player who has left. To display a historical first winner name after exit, store an immutable `firstBingoName` snapshot in room metadata. This avoids broken UI without retaining the player's entire deleted board.

### Player

| Field | Type | Meaning |
| --- | --- | --- |
| `playerId` | random opaque ID/UUID | Stable within the room. |
| `name` | 2–24 Unicode code points | Trimmed, NFC-normalized display name. Unique case-insensitively among active players in room. |
| `cardId` | integer 1–10 | One predefined preset. |
| `cardVersion` | string | E.g. `wvw-v1` matching `data/cards.json`. |
| `cardSnapshot` | JSON array of 25 German strings | Immutable labels used in that session. |
| `checkedMask` | 25-bit unsigned integer | One bit for each index 0–24; center bit 12 always set. |
| `joinedAt` | ISO timestamp | Active join time. |
| `lastModifiedAt` | ISO timestamp | Last change time. |
| `tokenHash` | cryptographic hash | Server-side proof for player's private cookie; never broadcast. |

**Bits:** `1 << index`, `index = row * 5 + col`, rows and columns are zero-based. 25 bits fit safely in JavaScript bitwise integer operations. Valid mask: 0..33,554,431. Index 12 must always be 1. Do not use the mask as an independently editable UI field.

**Example:** `checkedMask = 4097` means positions 0 and 12 checked. Completed count = 2/25, no complete line.

### Presence (ephemeral)

Online/offline is **derived from active WebSocket connections** and recent connection state, not the player's durable progress. Multiple browser tabs belonging to one session may exist. After disconnect/reconnect, presence eventually converges. Exact grace period is implementation-specific; it must not alter checked squares.

## Suggested SQLite schema (illustrative, implementation should version migrations)

```sql
CREATE TABLE IF NOT EXISTS room_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  room_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  first_bingo_player_id TEXT,
  first_bingo_name TEXT,
  first_bingo_at TEXT
);

CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  card_id INTEGER NOT NULL CHECK (card_id BETWEEN 1 AND 10),
  card_version TEXT NOT NULL,
  card_snapshot_json TEXT NOT NULL,
  checked_mask INTEGER NOT NULL,
  joined_at TEXT NOT NULL,
  last_modified_at TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE
);
```

When implementing, ensure the schema conforms to the actual SQLite APIs available in Durable Objects. Keep migrations explicit rather than silently modifying tables on each deploy.

## Server-computed public player DTO

```json
{
  "playerId": "p_83f2",
  "name": "Mira",
  "cardId": 7,
  "cardVersion": "wvw-v1",
  "card": ["Zerg folgt Dolyak statt Commander", "... 24 more labels ..."],
  "checkedIndices": [0, 12],
  "completed": 2,
  "completedLines": 0,
  "hasBingo": false,
  "online": true
}
```

`card` is a 25-item flat array in row-major order. Example labels are illustrative only; the full card must come from the canonical data file. No player response may include `tokenHash` or raw session tokens.

## Identity and persistence

- On join, server generates a securely random token and stores only its cryptographic hash.
- Cookie is room-scoped via an HTTP `Path` matching that room's API prefix, with `HttpOnly; Secure; SameSite=Lax` in production.
- On requests and WebSocket upgrades, server authenticates via that cookie.
- Session survives tab close/reload so long as cookie still exists and player has not explicitly left.
- On confirmed leave, delete the `players` row and invalidate/expire the cookie. Other players' state remains untouched.
- If player has already left, requests must fail with `SESSION_NOT_FOUND` rather than recreating the player.

## Atomicity / revision

A successful mark that changes state updates the player's mask and the room revision in one serialized operation. First-bingo award is decided in the same authoritative operation. An idempotent request that repeats the current state returns success without an extra revision or broadcast. The client treats revisions as ordering hints and replaces stale data with fresh snapshots.

## Retention policy

The MVP does not require historical analytics. An idle-room retention policy (proposed: expire after 30 days without activity) must be agreed before rollout; deletion/alarms should not be added without tests. Do not confuse `Verlassen` with room deletion.

## Step 8 implementation notes (2026-10-25)

The SQLite `players` table is now created by `BingoRoom` and populated on `POST /api/rooms/:code/join`. The database stores only the SHA-256 hash of the 32-byte random session token, not the token itself. `name_key` is NFC/trim/space-normalized and lowercase to reject duplicate active names in the same room. The player card snapshot is taken from the canonical ten-card catalog at join time. The free center is initially checked.

`GET /api/rooms/:code/me` performs hash lookup from an HttpOnly room-scoped cookie. Only the matching player can resume. Neither tokens nor hashes are returned in public snapshots. Each new join increments the room revision. **Square mutations, player leave, and presence are still future tasks.**


## Step 9 persisted square mutations

- Existing Step 8 `players` rows gain the SQLite column `player_revision INTEGER NOT NULL DEFAULT 0` using a non-destructive `ALTER TABLE` on Durable Object initialization. New rows start at zero. Existing `checked_mask` and credentials remain unchanged.
- Authenticated PUT requests modify the 25-bit `checked_mask` and increment `player_revision` and room `revision` atomically in `ctx.storage.transactionSync`. No mutation can uncheck index 12.
- A repeated write for an already-matching square is a no-op and keeps revisions unchanged. A different write carrying a stale player revision returns a conflict and does not modify storage.
- `room_meta`'s existing `first_bingo_player_id`, `first_bingo_name` and `first_bingo_at` columns now record the first server-recognized Bingo transition once, and are included in public snapshots as `firstBingo`.
- `online` remains `false` until presence via WebSockets exists. The browser still uses local state until frontend room integration.
