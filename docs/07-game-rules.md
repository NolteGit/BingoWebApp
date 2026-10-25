# 07 — Bingo rules and progress calculations

## Source rules

The provided *GW2 WvW Bingo.pdf* repeats these four rules on every card:

1. The middle square is a free square (`Bonusfeld`).
2. A square can be checked after its event happens.
3. Do not deliberately force events to complete the board; the goal is fun, not frustration.
4. The first player to complete a horizontal, vertical or diagonal line calls “Bingo!”.

The application additionally records the **first bingo observed by the server** for a consistent shared winner display. The room does not auto-end, so late joins are still possible.

## Preset integrity

- Exactly 10 cards, each exactly 5 rows × 5 columns.
- IDs `1` to `10`, version `wvw-v1`.
- Index 12 = `Bonusfeld` on every card.
- Card selection is by ID; identical objective text may appear on multiple cards and is not an identity key.
- Cards are loaded from [`../data/cards.json`](../data/cards.json). Every player gets their card's **own copy of check state**, never a shared state by card ID.

## Indexing

Squares are row-major, zero-indexed:

```text
  0   1   2   3   4
  5   6   7   8   9
 10  11  12  13  14
 15  16  17  18  19
 20  21  22  23  24
```

All 12 winning lines:

```ts
const LINES = [
  [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14],
  [15,16,17,18,19], [20,21,22,23,24],
  [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22],
  [3,8,13,18,23], [4,9,14,19,24],
  [0,6,12,18,24], [4,8,12,16,20],
] as const;
```

The lines above are **sample logic specification**, not a required filename/API. Export a single canonical constant in implemented code to prevent divergent frontend/backend rules.

## Computation (server is authoritative)

```ts
function isChecked(mask: number, index: number): boolean {
  return (mask & (1 << index)) !== 0;
}

function completedLines(mask: number): number {
  return LINES.filter(line => line.every(index => isChecked(mask, index))).length;
}

function completedSquares(mask: number): number {
  return Array.from({ length: 25 }, (_, index) => index)
    .filter(index => isChecked(mask, index)).length;
}
```

- At initialization: `checkedMask = (1 << 12)`.
- Valid ordinary square update: `checkedMask = checked ? (mask | (1 << index)) : (mask & ~(1 << index))`.
- For `index === 12`, reject uncheck, and always force center bit set.
- `completedSquares` starts at **1** (not 0), and reaches 25 only if all other 24 squares are checked.
- `completedLines` starts at 0 and may reach 12.
- Completed horizontal and diagonal lines overlap legitimately. Count all of them.

## First winner

When a player's `completedLines` changes from `0` to `>=1`, atomically assign room `firstBingo` if it is still unset. This is a **server order** result: it may not match the exact millisecond that events happened in GW2, and that's acceptable for a casual bingo app. Subsequent bingos remain visible and don't close the lobby.

**Leaving after first win:** keep the winner's name/time snapshot on room metadata, but remove the departed player's active board/marks on confirmed exit. Display their historical win name without creating a phantom active player.

## Edge-case tests

1. Fresh board: center checked, 1/25, 0 lines.
2. Check positions `[0,1,2,3,4]`: first row bingo.
3. Check positions `[2,7,17,22]` plus free center: middle column bingo.
4. Check positions `[0,6,18,24]` plus center: diagonal bingo.
5. Check positions `[4,8,16,20]` plus center: anti-diagonal bingo.
6. Check all 25 positions: 12 completed lines.
7. Uncheck one needed square: affected lines disappear (except immutable center).
8. Replay `checked:true` twice: one checked state, not a flip.
9. Two players using card 7: one player's marks do not change the other's marks.
10. Exit confirmed: only that player's active marks disappear.

## Cards/catalog

Human-readable 10-card tables: [13 — Full card catalog](13-card-catalog.md). Machine-readable source: [`data/cards.json`](../data/cards.json). Do not regenerate/re-shuffle the presets per player; positions are fixed by the supplied PDF.

## Implemented shared rules module (foundation step 3)

The pure calculations now live in [`../src/shared/bingo.ts`](../src/shared/bingo.ts) and are tested in [`../src/shared/bingo.test.ts`](../src/shared/bingo.test.ts).

- `BINGO_LINES` is the frozen canonical order of all 12 winning lines.
- `createInitialCheckedMask()` returns `1 << 12`, with the center checked.
- `setSquareChecked(mask, index, checked)` is **idempotent** and rejects attempts to uncheck the free center or write malformed data.
- `getBingoProgress(mask)` derives completed square count, checked indices, completed line count, completed line indices and whether the player has a bingo.
- `isFirstBingoTransition(previousMask, nextMask)` detects a **single player's** transition from zero completed lines to one or more. It does **not** award the room's first winner. That must happen atomically in a later server milestone.

This code is shared game logic, not yet connected to the read-only preview UI or a networked server.
