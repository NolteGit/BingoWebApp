# Post-deployment usability adjustments — manual test guide

This patch changes only client-side navigation, card selection presentation and font sizing. It does **not** modify Durable Object migrations, SQLite content, public API routes or player sessions.

## Verification commands

```powershell
npm run typecheck
npm test
npm run build
npm run dev
npm run dev:api
```

Run the two development servers in different terminals. Test with an ordinary browser and a private browser window.

## Checks

1. **Safely create another room:** Create Room A and join it. Mark two squares. Select **Zur Lobby**, then **Neuen Raum**. The home screen should appear without creating a room. Create Room B and join it. Open Room A's original URL in the same normal browser; your original card and marks must still be present. No room/player/delete API should be called just to navigate home.
2. **Card picker:** In the join form open **Karte auswählen**. Move the mouse across cards 1–10 without clicking; the 5×5 preview should follow the hovered row without changing the selected card. Click Karte 7 and confirm it is selected. Start bingo and verify Karte 7 is assigned.
3. **Keyboard:** Open the picker with Enter, move through cards with Up/Down, Home/End; preview follows focus. Press Escape to close without changing selection. Reopen and use Enter to select an option. Tab should reach the form normally.
4. **Mobile/narrow viewport:** The card menu should scroll without overflowing the screen and show a readable preview under the choices. Test the close button; touch devices can tap an option to select it.
5. **Bingo text:** On desktop and mobile, text should be slightly larger but all 25 squares must remain separate, with no clipping. Verify cards containing longer objectives, especially cards 3 and 7.
6. **Safety:** Check a square, return to lobby, open the start screen, and navigate back by the saved URL. The checked square must still be persisted. Confirm that old invitations still work for other players.

After verification and commit, redeploy with `npm run deploy`. Do **not** change the Worker name or Durable Object migration for this UI-only change. Existing production rooms should remain intact.

## Neues Bingo starten (bewusstes Löschen)

1. Mit einer gespeicherten Karte in die Lobby zurückkehren.
2. **Neues Bingo starten** klicken und **Abbrechen** wählen: Karte, Name und Fortschritt bleiben unverändert.
3. Nochmals öffnen und **Löschen & neu starten** bestätigen: Nur der eigene Spieler verschwindet aus der Liste.
4. Anschließend mit einem neuen Namen und einer anderen Karte beitreten. Die Karte startet nur mit dem Bonusfeld.
5. Optional mit dem alten Namen erneut beitreten: Der Name ist wieder frei.
6. In einem zweiten Browser prüfen, dass andere Spieler und deren Häkchen erhalten bleiben.
7. Die alte Sitzung darf nach dem Löschen keine Felder mehr verändern oder weitere Raumdaten per WebSocket erhalten.
8. Backend neu starten und prüfen, dass der alte Spieler nicht zurückkehrt.

**Wichtig:** Das ist eine echte Löschung des eigenen Spieler-Datensatzes, nicht bloß ein Ausblenden.
Der Raum und alle anderen Spieler bleiben bestehen. War die entfernte Person als erste Bingo-Gewinnerin
oder erster Bingo-Gewinner gespeichert, wird diese Referenz ebenfalls geleert.
