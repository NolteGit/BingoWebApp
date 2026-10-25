# Step 11 — WebSocket live room testing (local)

**Status:** Implementation prepared. Complete these checks on Windows before committing Step 11.

## Start

Run `npm run typecheck`, `npm test`, `npm run build`. In separate VS Code terminals, start:

```powershell
npm run dev:api
npm run dev
```

`vite.config.ts` must have `ws: true` for `/api`. Open `http://localhost:5173` and create a **new** room. Join as Henrik. Copy the `/r/CODE` link and open it in a **private browsing window**, joining as Mira. Both browsers should remain on the same room.

## Checks

1. **Connected:** In both game screens, open **Vergleich**. Confirm the note says `Live verbunden.` and both participants appear. Browser DevTools → Network → WS should show one connection to `/api/rooms/CODE/events` with status 101. If it does not, record errors from the browser console and Wrangler terminal.
2. **Instant progress:** Check a square in Henrik's browser. Without reloading Mira's window, her lobby/compare should show Henrik's new count and square promptly (normally well before five seconds). Repeat in the opposite direction, including unchecking.
3. **Online state:** Both joined players should show `online` in the player list while connected. Close Mira's tab, then check that she eventually appears offline in Henrik's view. This presence indicator is **best effort**: an abrupt network loss may take longer to detect. Closing a tab must **never delete its player record**.
4. **Reconnect:** Reopen Mira's room link in the same private session (without closing the entire private browser). She should resume the same name, card and marks. Watch the live status return.
5. **Wrangler restart:** Mark an additional square, stop only `npm run dev:api`, and restart it. The UI should show a fallback/disconnected note during interruption. Marks remain visible and are recoverable after reconnect. Check the player's card after refresh as well.
6. **No cross-player writes:** Opening Henrik's preview from Mira must not allow marking it. Only Mira's own board changes from her clicks.
7. **Same user in two tabs:** Open the room in two normal tabs sharing Henrik's cookie. Updates in one should appear in the other. If both click at once, conflict handling must preserve SQLite state rather than silently overwriting progress.
8. **Fallback:** With Wrangler unavailable, the client continues to try reconnecting. Progress cannot be saved until the server returns. Verify the UI blocks unconfirmed writes as before. When backend returns, refresh should recover saved state.
9. **Late join:** Join a third player after play has begun and verify the other players are not reset. The third player starts with only the free center square.

## Protocol and safety

- Browser `GET /api/rooms/:code/events` upgrades to a WebSocket only after same-origin checks and authentication with the room-scoped HttpOnly session cookie. No credentials appear in URL parameters, room snapshots or WebSocket messages.
- A room Durable Object broadcasts full `room.snapshot` objects after player joins, persisted square updates, and socket presence changes. The same public snapshot drives lobby and comparison.
- The browser applies only current or newer room revisions (presence-only snapshots may have equal revisions), reconnects with capped exponential backoff, and polls via HTTP if disconnected. HTTP PUT is **still** the only way to save square changes.
- Presence is derived from connected sockets and is not a substitute for recovery/persistence. Closing an app does not delete a room/player. No destructive leave API is added.
- Local data in `.wrangler/state` is separate from Cloudflare production data. Do not remove it while testing persistence.

## Report results

Include the actual output of `npm run typecheck`, `npm test`, and `npm run build`. Note successful two-browser update, reconnection, backend restart, and status of DevTools WS upgrade. Only then update `TASKS.md` and `PROJECT_STATUS.md` to **verified**.
