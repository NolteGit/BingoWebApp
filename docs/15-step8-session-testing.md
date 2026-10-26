# Step 8 — Player session verification (Windows PowerShell)

**Scope:** Backend-only. The UI still displays example players; it is not yet connected to these APIs.
Run `npm run dev:api` and `npm run dev` in separate VS Code terminals. The examples below use the Vite proxy at `http://localhost:5173`.

## 1. New room and player

```powershell
$base = 'http://localhost:5173'
$room = Invoke-RestMethod -Method Post -Uri "$base/api/rooms"
$code = $room.roomCode
$code

$body = @{ name = 'Alex'; cardId = 7 } | ConvertTo-Json
$joined = Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$code/join" `
  -ContentType 'application/json' -Body $body -SessionVariable bingoSession
$joined
```

Expected: `resumed: false`, `cardId: 7`, `checkedIndices: [12]`, and a new player ID. The session cookie is held only in the `$bingoSession` PowerShell web session.

```powershell
Invoke-RestMethod -Uri "$base/api/rooms/$code" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "$base/api/rooms/$code/me" -WebSession $bingoSession
```

Expected: the room now lists one player, 25 correct canonical card labels and revision 1. `/me` returns your player without rejoining.

## 2. Resume rather than duplicate

```powershell
$again = Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$code/join" `
  -ContentType 'application/json' -Body $body -WebSession $bingoSession
$again
```

Expected: `resumed: true`, the **same playerId and cardId**, and no second player in `GET /api/rooms/$code`. There is no new cookie required.

## 3. Without a cookie, someone else cannot claim the same name

```powershell
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$code/join" `
    -ContentType 'application/json' -Body $body
} catch {
  "Expected conflict: $([int]$_.Exception.Response.StatusCode)"
}
```

Expected: HTTP **409 NAME_TAKEN**. This is not an error in the test run.

## 4. Restart Wrangler, keep Vite and PowerShell running

Stop **only** `npm run dev:api` with Ctrl+C, then restart it. Run:

```powershell
Invoke-RestMethod -Uri "$base/api/rooms/$code/me" -WebSession $bingoSession
Invoke-RestMethod -Uri "$base/api/rooms/$code" | ConvertTo-Json -Depth 8
```

Expected: your original player still exists with the same name, ID, card, and free-center progress. A normal backend restart must never delete a session. **Do not delete `.wrangler/state`.**

## 5. Optional isolation check

```powershell
$other = Invoke-RestMethod -Method Post -Uri "$base/api/rooms"
try {
  Invoke-RestMethod -Uri "$base/api/rooms/$($other.roomCode)/me" -WebSession $bingoSession
} catch {
  "Expected missing session for other room: $([int]$_.Exception.Response.StatusCode)"
}
```

Expected: HTTP **401 SESSION_REQUIRED**. A cookie for one room never authenticates to another.

## Important limitations

- The real browser frontend is **not yet connected** to these endpoints.
- No endpoint exists yet for marking squares, deleting players or leaving a room.
- Without a valid session cookie, a player cannot be recovered automatically just by entering the same name. A recovery-code feature can be added separately later.
- The local server persists to `.wrangler/`; production data will be separate after deployment.
- `GET /api/rooms/:code` is public to anyone possessing the room code, but never exposes session tokens, token hashes, or cookies.
