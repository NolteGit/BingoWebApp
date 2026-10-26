# Interface languages (DE/EN)

The player-facing interface offers a compact **DE / EN** toggle in the header. German is selected **on every page load**, intentionally. The choice is held only in Preact state: there is no saved cookie, browser preference detection, account setting, or backend field. Changing the language does not create or leave a room, modify game state, or change the player's card.

## Where translations live

All player-facing interface copy, including button labels, rules, popups, connection indicators, accessibility text, and known server/API errors, lives in [`src/client/i18n.tsx`](../src/client/i18n.tsx). The dictionaries are keyed by neutral IDs under `de` and `en` and checked by TypeScript and `src/client/i18n.test.tsx`. The `useI18n()` hook provides `t(key, params)` and `cardName(id)` in components. New UI features should use these functions rather than embedding German or English UI labels directly in TSX.

The card catalog uses English internal names; the visible labels are computed from IDs (`Karte 1` / `Card 1`, `Zufallskarte` / `Random card`). These IDs and the objective snapshots are language-independent.

## Intentional German-only content

The 61 WvW event texts in [`data/tasks.json`](../data/tasks.json), and the literal center task `Bonusfeld`, remain **German in both modes**. These are bingo objectives, not interface translations. The free-square UI marker (`FREIFELD` / `FREE SPACE`) is translated separately from the center task. The fixed cards in [`data/cards.json`](../data/cards.json) continue to reference task IDs; random cards sample from the same task pool. Do not duplicate or translate the task pool for this feature.

## Error handling

API responses return stable `error.code` values and English fallback messages. The frontend uses the code to display translated explanations in either language. Unknown exceptions show their original message, with a translated generic fallback when no message is available. Network transport errors have stable codes (`NETWORK`, `INVALID_RESPONSE`). Do not branch application logic on localized error wording.

## Smoke test

1. Start the app and confirm **DE** is active.
2. Click **EN** on the start screen, create a room and join. Labels, rules, confirmation dialogs, player list and accessibility text should now be English; bingo objectives should remain German.
3. Choose **Random card**, mark/unmark a square, switch back to **DE**. Verify the board and progress have not changed.
4. Reload. The language returns to **DE**, and the room and player session remain intact.
5. Trigger a duplicate player name with another browser profile and verify the localized error message.
6. Run `npm run typecheck`, `npm test`, and `npm run build` before deployment.
