# 09 — Test strategy and acceptance checklist

## Test layers

**Unit:** pure 5×5 bingo calculations, card-file validation, input parsing, DTO derivation. Should run without Cloudflare runtime.

**Integration:** Durable Object operations against local Workers environment, SQLite persistence, session authorization, HTTP routes, websocket snapshot publication and reconnect. Do not fake the database behavior in all tests.

**End-to-end:** two or more real browser contexts hitting a local or preview deployment. Play with independent identities/cookies.

Recommended tooling: Vitest for pure functions, a Cloudflare-compatible test environment for Durable Objects, and Playwright for browser flows. Exact package integrations must be confirmed when the project is scaffolded.

## Canonical unit-test checklist

- [ ] `cards.json` contains 10 distinct IDs, 5 rows × 5 columns each, 25 nonempty German labels.
- [ ] Center square (index 12) says `Bonusfeld` on all ten cards.
- [ ] Card 1 first square is `Jemand lacht im Discord`; Card 10 last square is `Alle im Discord lachen`.
- [ ] Init marks only center: 1/25, 0 lines.
- [ ] Complete each of 5 row patterns correctly.
- [ ] Complete each of 5 column patterns correctly (including center column).
- [ ] Complete both diagonals correctly (with free center).
- [ ] All 25 checked => 12 lines.
- [ ] Undo a square removes only the affected completed lines.
- [ ] Free center cannot be unchecked.
- [ ] Setting the same square to true twice remains true (idempotent).
- [ ] Invalid indexes (-1, 25, decimals, NaN) and invalid `checked` values are rejected.

## Multi-user scenarios

- [ ] User A creates room, B enters by URL, both see the same lobby.
- [ ] A selects Karte 7, B selects Karte 7; boards have same labels but independent marks.
- [ ] C joins later; A and B retain their checked state, bingo count and card ID.
- [ ] A marks tile 0, A and B's lobby/compare views update live; B's own tile 0 remains independent.
- [ ] A completes a row and triggers bingo; correct first-winner state appears to all.
- [ ] B later gets bingo; B's count updates without overriding the room's first winner.
- [ ] A opens comparison and inspects B's board; no ability to edit B's marks.
- [ ] Refresh A's page; same name, selected card and checks survive.
- [ ] Disconnect A's network, reconnect; same session restored, no duplicate A.
- [ ] Open A's session in two tabs; marks sync and presence behaves sensibly.
- [ ] A clicks Verlassen > Abbrechen; progress remains.
- [ ] A clicks Verlassen > Verlassen und löschen; A is removed, B/C remain unchanged.
- [ ] A rejoins with a new card and starts at only center checked.
- [ ] A malformed cookie cannot mutate any card.
- [ ] A malicious player cannot pass B's ID and edit B's board.
- [ ] Simultaneous bingo completions yield exactly one first-bingo winner.

## User experience

- [ ] Visible board remains 5×5 and click targets practical at 1280px and narrower laptop layouts.
- [ ] Long German objective strings wrap without hiding meaning.
- [ ] Mobile-sized viewport can scroll; controls are usable by touch.
- [ ] Keyboard-only navigation marks squares and controls modals.
- [ ] Drawer closes with Esc and returns focus.
- [ ] All user-facing strings and errors are German.
- [ ] No unexpectedly destructive effect on browser refresh/back/close.
- [ ] Reconnect and failed-save notifications are clear and truthful.

## Build and release gates

Once scripts exist, require at minimum `npm run typecheck`, `npm test` and `npm run build` to succeed (adapt names to actual `package.json`). Run Playwright e2e for features it covers. Explicitly record what was tested locally and what was verified in deployed Cloudflare environment.

## Manual smoke-test script

1. Open lobby in normal browser A. Create room; copy link.
2. Open private/incognito browser B via same link.
3. A = `Mira`, card 7; B = `Tom`, card 3.
4. A checks tiles 0,1,2,3,4 (plus center). A sees bingo; B sees A's new bingo and still has own unchanged board.
5. Refresh A; confirm 6 checked and bingo preserved.
6. Open C late, choose card 7, confirm 1/25 and A/B unchanged.
7. B views A's checked squares via Vergleich; attempt to click A's card must do nothing.
8. A clicks Verlassen, cancels, sees same board. Repeat and confirm, returns to lobby; B/C unaffected.
9. Test network offline/online with DevTools; inspect reconnect UI and actual persisted state.

Record screenshots/observations in issue or PR when implemented. Do not mark e2e done based on a mocked UI.

## Step 8: manual session/restart verification

Follow [`docs/15-step8-session-testing.md`](15-step8-session-testing.md) for PowerShell commands. Verify that a new player is saved in SQLite, a cookie restores that player after restarting `wrangler dev`, a second request without a cookie cannot claim the same player name, and a cookie from another room cannot retrieve the first player. No deletion or square updates are yet implemented.
