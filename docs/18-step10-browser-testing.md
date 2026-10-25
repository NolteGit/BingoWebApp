# Step 10 — Browser/room integration verification

This milestone connects the existing UI to the Step 7–9 APIs. **It is not WebSocket realtime yet**: public player snapshots are polled every 5 seconds. Private square writes are individually confirmed and stored by the Worker. Do not deploy this publicly until room-creation rate limiting and other release controls are addressed.

## Local setup (Windows PowerShell)

Run `npm run typecheck`, `npm test`, `npm run build`. Use separate terminal tabs for:

```powershell
npm run dev:api
```

```powershell
npm run dev
```

Open `http://localhost:5173/` in Browser A (regular window). Click **Neuen Raum erstellen**. Use **Link kopieren** and open the URL `/r/CODE` in Browser B (private/incognito, separate cookie jar).

## Acceptance checks

1. **Join A:** Pick name `Henrik` and Karte 7; start. The lobby lists Henrik and the personal board begins with the permanent Bonusfeld only (1/25).
2. **Join B late:** In the private browser, choose name `Mira` and Karte 3. Browser A should show Mira within approximately 5 seconds without resetting Henrik's progress. Selecting Mira previews Karte 3 read-only.
3. **Marking and polling:** In Browser A mark fields 0 and 1. Wait up to 5 seconds in Browser B and inspect Henrik in **Vergleich**. Expect 3/25 and the matching two squares (including the free center). Browser B cannot edit A's card.
4. **Session refresh:** Refresh Browser A. It should resume Henrik/Karte 7 automatically with fields `[0, 1, 12]`. No duplicate Henrik entry should be created.
5. **Navigate safely:** Click **Zur Lobby**, verify the lobby shows Henrik and a **Bingo fortsetzen** button. Use it to resume the same board; the marks must remain unchanged.
6. **Worker restart:** Keep both browsers open, stop and restart only `npm run dev:api`, then refresh Browser A. Verify same player/card/marks after reconnection.
7. **Undo:** Click field 1 again, verify saved count 2/25; refresh to verify it remains unchecked.
8. **Conflict/second tab:** Open the same room URL in another tab of Browser A (same cookie jar). Mark a square in tab 1, then attempt a different square in tab 2 without refreshing. Tab 2 must reload the current saved state on a revision conflict and ask the player to click again. No prior check may silently disappear.
9. **Disconnect:** Stop the Worker, attempt a mark. The app must not pretend the mark was saved. If it cannot recover the authoritative status, the board becomes read-only until refresh. After restarting the Worker and refreshing, persisted marks should be intact.
10. **No destructive navigation:** Neither switching to Lobby, refresh, browser close nor any preview must delete players or marks. Card selection is intentionally locked after joining until a safe server endpoint for card changes exists.

## Key contracts

- `POST /api/rooms` creates a room and returns `roomUrl`.
- `GET /api/rooms/:code` returns public snapshots. No session tokens in snapshots.
- `POST /api/rooms/:code/join` creates or resumes a player via a room-scoped HttpOnly cookie.
- `GET /api/rooms/:code/me` recovers private session progress.
- `PUT /api/rooms/:code/me/squares/:index` sets an explicit checked value with `expectedPlayerRevision`; a stale write returns 409.
- UI renders the server-confirmed square result. It prevents overlapping writes and locks the board if it cannot verify a failed request.

## Deferred

WebSocket push, presence/online indicators, confirmed player deletion, safe card changes, recovery codes, offline queueing, and public deployment are not included. The cookie is browser-local and does not transfer to incognito or other devices. This milestone uses polling, which is not instantaneous multiplayer synchronization.
