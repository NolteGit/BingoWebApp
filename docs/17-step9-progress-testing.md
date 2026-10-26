# Step 9 — Persistent bingo marks (Windows / PowerShell)

Run from the BingoWebApp repository. The frontend still uses local mock players; these commands test **the backend API only**. Do not interpret the browser card as server-saved yet.

## 1. Start and check

In terminal 1: `npm run dev:api`. In terminal 2: `npm run dev`. In a third PowerShell terminal:

```powershell
$base = 'http://localhost:5173'
$room = Invoke-RestMethod -Method Post -Uri "$base/api/rooms"
$code = $room.roomCode
$body = @{ name = 'Alex'; cardId = 7 } | ConvertTo-Json
$joined = Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$code/join" -ContentType 'application/json' -Body $body -SessionVariable bingoSession
$me = Invoke-RestMethod -Uri "$base/api/rooms/$code/me" -WebSession $bingoSession
$me.player | ConvertTo-Json -Depth 5
```

Expected: `playerRevision: 0`, `checkedIndices: [12]`. **Keep this PowerShell terminal open and preserve `$code` and `$bingoSession`.** Do not use `-SessionVariable` again.

## 2. Save square 0 and retry safely

```powershell
$markBody = @{ checked = $true; expectedPlayerRevision = 0 } | ConvertTo-Json
$first = Invoke-RestMethod -Method Put -Uri "$base/api/rooms/$code/me/squares/0" -WebSession $bingoSession -ContentType 'application/json' -Body $markBody
$first | ConvertTo-Json -Depth 5
$retry = Invoke-RestMethod -Method Put -Uri "$base/api/rooms/$code/me/squares/0" -WebSession $bingoSession -ContentType 'application/json' -Body $markBody
$retry | ConvertTo-Json -Depth 5
```

First should say `status: updated`, `playerRevision: 1` and checks `[0,12]`. Retry should say `status: unchanged` and **must not** increase the revision.

## 3. Check conflict protection, then undo

```powershell
$staleBody = @{ checked = $false; expectedPlayerRevision = 0 } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Put -Uri "$base/api/rooms/$code/me/squares/0" -WebSession $bingoSession -ContentType 'application/json' -Body $staleBody
} catch {
  $_.Exception.Response.StatusCode
  $_.ErrorDetails.Message
}
$undoBody = @{ checked = $false; expectedPlayerRevision = 1 } | ConvertTo-Json
$undo = Invoke-RestMethod -Method Put -Uri "$base/api/rooms/$code/me/squares/0" -WebSession $bingoSession -ContentType 'application/json' -Body $undoBody
$undo | ConvertTo-Json -Depth 5
```

The old revision should cause HTTP **409 `STALE_PLAYER_REVISION`** without losing the mark. Undo with the current revision should succeed and restore `[12]`.

## 4. Complete a Bingo row

```powershell
for ($i = 0; $i -lt 5; $i++) {
  $current = Invoke-RestMethod -Uri "$base/api/rooms/$code/me" -WebSession $bingoSession
  $body = @{ checked = $true; expectedPlayerRevision = $current.player.playerRevision } | ConvertTo-Json
  $result = Invoke-RestMethod -Method Put -Uri "$base/api/rooms/$code/me/squares/$i" -WebSession $bingoSession -ContentType 'application/json' -Body $body
}
$result | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "$base/api/rooms/$code" | ConvertTo-Json -Depth 6
```

Expect `completedLines >= 1`, `hasBingo: true`, and `firstBingo.name: Alex` in both the PUT result and the public room snapshot. The Bonusfeld (index 12) must remain checked.

## 5. Restart and recover

Stop **only** `npm run dev:api` with Ctrl+C, restart it. Leave the Vite frontend running and retain the third terminal session cookie.

```powershell
$meAfterRestart = Invoke-RestMethod -Uri "$base/api/rooms/$code/me" -WebSession $bingoSession
$meAfterRestart.player | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "$base/api/rooms/$code" | ConvertTo-Json -Depth 6
```

Check the same player ID, checked indices and `playerRevision`, and the same `firstBingo` as before restarting. **Do not create a new room or rejoin.**

## Expected errors

- Missing cookie: `401 SESSION_REQUIRED`.
- Bad square index: `400 INVALID_SQUARE`.
- Setting index 12 to false: `400 FREE_SQUARE_LOCKED`.
- Bad boolean/missing expected revision: `400 INVALID_SQUARE_UPDATE`.
- Stale revision with a different desired value: `409 STALE_PLAYER_REVISION`, with `current` saved state.

No delete/reset/leave endpoint is introduced in Step 9. `.wrangler/state` is local persistence; deleting it destroys local test rooms.
