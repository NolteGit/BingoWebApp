# Printable A4 bingo card (paper-reference polish)

## Purpose and scope

The existing **Karte drucken / Print card** action opens the browser print dialog using `window.print()`. The browser can print on A4 portrait paper or save the output as a PDF. It is not a server-generated PDF, so it adds no runtime packages or Cloudflare usage.

Only the print-only layout, its localized rules heading and bingo-call text, and its tests change. The live lobby, interactive game board, player progress, API, room storage, preset card layouts, and random-card assignment remain unchanged.

## Layout

- A4 portrait, 210 x 297 mm, zero `@page` margins, with printable content and a burgundy frame inset from the edges.
- Warm parchment background, four decorative gold diamonds, burgundy ribbon heading, and the localized card label.
- Fixed 173 x 173 mm grid, 5 x 5, with rounded connected ivory squares and the original objective text.
- Center index 12 remains `Bonusfeld`. A gold motif and the localized free-space hint replace the optional GW2 dragon logo in the reference.
- Bottom dark rules panel uses the four established play rules, localized through `src/client/i18n.tsx`.
- The printable markup contains **no player name, checked-square state, room code, progress, or live controls**.

## Browser checks before release

1. In Firefox and Chromium/Edge open a joined game and choose **Karte drucken**.
2. Select **Save as PDF**, paper **A4**, **portrait**, scale **100%**, and no browser-added headers or footers. Enable **Print backgrounds / Hintergrundgrafiken** when offered for the intended parchment and color design.
3. Inspect a short-text preset (e.g. Card 1), a long-text preset, and an assigned random card. Check one page only, readable German objectives, and unchanged exact square positions.
4. Check EN interface: rules translate, but the 25 German bingo objectives and `Bonusfeld` do not.
5. Check that printed copies do not show player names or their saved marks, even when the interactive board has checked squares.

The appearance of paper margins and background colors can depend on browser printing defaults and physical printer settings. `print-color-adjust: exact` requests the intended colors but cannot override every browser or printer setting.
