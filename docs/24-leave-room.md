# Raum verlassen — Step 14.1

The optional **Raum verlassen** action appears in the personal game header and the returning-player lobby. It is separate from **Zur Lobby** and **Neuen Raum** (both non-destructive), and from **Neues Bingo starten** (which deletes the player's record but keeps the user inside the same room to join again).

After explicit confirmation, the app calls the existing cookie-authenticated `DELETE /api/rooms/:code/me` endpoint. The backend removes only the player matching that session in a SQLite transaction, expires that player's cookie, and broadcasts the updated player list. The app returns to `/` **only after a verified successful delete response**. Other players and the room are preserved. If the response is uncertain, the UI retains the last known player state and reports that removal could not be confirmed.

## Manual checks

1. Join a new room as Player A. Mark two squares. Join as Player B in a separate private window.
2. Click **Raum verlassen** as Player A, then **Abbrechen**. Player A and their marks must remain.
3. Click **Raum verlassen** again and confirm. Player A returns to the start screen. Player B remains with the same marks and their own card.
4. Player B's lobby/comparison list must no longer show Player A. Player A's old `/r/CODE` link should open the join form rather than restoring the deleted player.
5. Rejoin that room as Player A with the previous name. They receive a fresh card (only the free square checked).
6. In another test, disconnect the backend before confirming **Raum verlassen**. The app must not navigate away or claim the record was deleted without confirmation.
7. Confirm **Neues Bingo starten** still deletes only the current player and keeps the join form in the same room. **Zur Lobby** must still preserve progress.

Test on both desktop and mobile. Run `npm run typecheck`, `npm test`, and `npm run build` before deployment. Use a test room, not an active game.
