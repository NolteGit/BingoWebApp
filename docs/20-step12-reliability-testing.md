# Step 12 — Save reliability and reconnect testing

This checklist tests the browser against the real local Cloudflare Durable Object. It distinguishes **confirmed** from **uncertain** writes; a green unit test alone does not establish production durability.

## Setup

Run `npm run dev:api` and `npm run dev` in separate terminals. Join a new room in one normal browser and one private window. Keep the private window open during recovery tests so its session cookie survives. Record the room URL and current checked-square count. Do not delete `.wrangler/state` between restarts.

Before the manual tests, run `npm run typecheck`, `npm test`, and `npm run build`.

## Tests

1. **Normal confirmation.** Check one square. The progress increases by one and the UI returns to **Live · gespeichert**, or **Verbunden · gespeichert (Abfrage)** if WebSocket is unavailable. The second player sees the updated progress.
2. **Refresh.** Refresh the active player several times and return to the lobby and back. The same name, card, and marks remain. Merely navigating must not call any delete endpoint.
3. **Backend outage during play.** Stop `npm run dev:api`. Try marking a square in the browser (while the OS remains online). It must not appear as successfully saved. The UI must report an unverified save and disable further square clicks, or show a disconnected state. Restart Wrangler. The browser must recover automatically within roughly five seconds of a successful request; it must show the server-confirmed marks, not invent missing checkmarks. `Erneut prüfen` should also work.
4. **Browser offline.** In DevTools Network, choose Offline. New clicks should be disabled while offline. Return to Online. Existing confirmed progress must still be present, and any prior unresolved write must be verified.
5. **Two tabs sharing one session.** In two *normal* tabs using the same room/session, check a square in one. Then attempt to change another square from a stale state in the second (temporarily disable live updates if necessary). A `409` should reload server truth rather than overwriting the first tab's progress.
6. **Backend restart with both browsers open.** Restart Wrangler. WebSockets may disconnect, but should reconnect without making a new player or clearing marks. HTTP polling is the fallback.
7. **No unexpected deletion.** Click `Zur Lobby`, reopen the card, open and close comparison, then refresh. The player and checked fields must still be present. The system intentionally has no delete/reset API in Step 12.
8. **Server unavailable on initial room load.** With an existing room URL, stop Wrangler and refresh. The app should show a recoverable loading error rather than falsely displaying an empty new game. Restart Wrangler and click `Erneut laden`; the saved session should return.

## Important interpretation

- A browser cannot know whether a lost HTTP response represents a committed write. The app therefore reads the authoritative state before accepting more clicks. **It never blindly replays an uncertain click.**
- A successful local SQLite restart test protects against ordinary restarts, not deletion of `.wrangler/state`, session-cookie loss, device changes, operator mistakes, or an actual cloud outage. Room backup/restore and recovery codes need a separate explicit design.
- The connection indicator is a useful UX signal, not an independently guaranteed end-to-end service-level monitor. Polling is still used if WebSockets fail.

Report each failure with the exact browser action, status text, and Wrangler terminal output. Keep the patch uncommitted until all automatic checks and the important disconnect/recovery flows pass.
