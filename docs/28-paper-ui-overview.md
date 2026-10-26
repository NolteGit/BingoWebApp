# Paper-card-inspired interface (Step 18)

The app retains its Vite/Preact implementation, DE/EN translations, server-assigned cards, and persisted multiplayer state. This milestone changes **presentation and navigation only**, not Cloudflare bindings, API routes, or SQLite schema.

## Design direction

- The outer frame remains deep navy, with warm ivory/parchment panels and understated gold outlines.
- Main actions use burgundy. Destructive actions retain their own confirmation dialog; ordinary room navigation never deletes progress.
- The active 5 × 5 grid uses lightly raised ivory squares, forest-green checked squares, and a distinctive warm red free square.
- The lobby has three areas on desktop: join/resume, player overview, and invitation/rules. They stack responsively on smaller screens.
- The in-game **Player overview** opens a centered, read-only popup showing the **same player summary rows as the lobby**. The old opponent-card comparison and floating card preview are intentionally absent.
- The player summary shows player name, online presence, selected preset/random card, checked-square count, and completed bingo lines.

## Artwork integration later

This iteration deliberately **does not include images or external fonts**. Two CSS variables in `src/client/styles.css` are ready for locally hosted assets:

```css
--bingo-background-image: url('/art/background.webp');
--bingo-panel-image: url('/art/parchment-detail.webp');
```

Add optimized and properly licensed assets in `public/art/` before enabling these variables. The header still uses the letter **B** as its temporary emblem; replace the `brand-mark` markup/styling after selecting a suitable graphic. Use relative URLs, keep images decorative for screen readers, and ensure the UI remains readable if the artwork fails to load.

## Verification checklist

1. Test `npm run typecheck`, `npm test`, and `npm run build`.
2. Open a room in DE and EN. Verify the three lobby sections and responsive stacking.
3. Join with two browsers, open **Spielerübersicht** from the bingo board, and verify live values match the lobby.
4. Close the popup using its button and Escape. Check keyboard focus returns to the trigger.
5. Check the 5 × 5 board at 320px, 375px, 430px, and desktop widths. There should be no horizontal board scrolling.
6. Save marks, switch views, reload, and confirm that the original game progress and session are preserved.
7. Verify the room-leave and restart confirmations still delete only the authenticated player's record.

**Scope:** No data migrations, no cloud configuration, no new room cleanup, no task-language changes.
