# Interface polish (Step 19)

A presentation-only follow-up to the paper-card layout. Room APIs, SQLite storage, random cards, DE/EN wording, and the shared player overview are unchanged.

## Design decisions

- The header uses a small CSS-styled **2** monogram as a game reference. This is intentionally not an official game logo.
- The lobby uses a faint decorative image at `public/art/gw2-logo-reference.jpg`, based on the image supplied for the design discussion. Its opacity and blending keep the text readable. The image is hidden on smaller screens. No artwork is fetched at runtime from third-party sites.
- The background remains the existing navy gradient. The optional background-image CSS variable from Step 18 is still available for an independently chosen asset.
- Core actions use burgundy, the in-game player overview uses muted gold, navigation uses ivory, and destructive operations keep their distinct warning color and confirmation.
- Buttons share height, spacing, focus indication, hover and pressed feedback. Tiny inline SVG icons are decorative, and **text remains in the DE/EN translation layer**.
- The card grid, saved checks, and player overview contents are unchanged. A small diamond by the lobby heading and the warm free-square finish echo the printed reference card.

## Replacing or removing the logo

The image is a third-party game mark, **not an original or open-license asset**. Confirm that its use is permitted before distributing the image in a public source repository or remove/replace it. To remove it, delete the `.lobby--compact::before` block from `src/client/styles.css` and remove `public/art/gw2-logo-reference.jpg`. The application works without it. To add a later chosen background, see `docs/28-paper-ui-overview.md`.

## Checks before deploying

Run `npm run typecheck`, `npm test`, and `npm run build`. In a browser, verify the start page, room lobby, card picker and bingo board at desktop width and at 320–430px. Try all three in-game actions, open and close Spielerübersicht, switch to English, and verify keyboard Tab/Enter/Escape navigation. The two confirmation actions should still delete only the current player after explicit approval.

## Player-row live preview extension (2026-10-26)

The shared `PlayerList` now uses a focusable row button. Hovering or focusing a row opens a compact read-only 5×5 card preview outside the scrollable list. A click/tap pins the preview until it is closed or focus/click moves elsewhere. The preview reuses `ReadOnlyBoard`, and the `ComparisonEntry.card` snapshot ensures random-card layouts never regenerate. Its marks follow the same live room snapshot that updates the leaderboard. No API or persistence changes are needed.
