# Task library and randomly generated cards

The game uses one central German task library and keeps the ten original 5×5 presets.
The task library is **code/configuration data**, not an in-browser editor. Changes require a code commit and deployment.

## Add or edit an objective

Open [`data/tasks.json`](../data/tasks.json). Every task has **one line** and a permanent ID:

```json
"t001": "Jemand lacht im Discord",
"t062": "Neues WvW-Ereignis beobachtet"
```

To add a task, append a new ID not used before (e.g. `t062`, then `t063`). Keep JSON commas valid. To update wording, edit only the text, **not the ID**. Editing that text updates the ten preset card definitions that reference the ID and changes the source for future random cards. It does not modify any card already assigned to a player.

Do not enter `Bonusfeld` in the task library: the center free space is inserted automatically.
Task IDs must look like `t001` or `t062` and labels must be nonempty and unique (case-insensitively). At least 24 distinct tasks must exist for random cards.

## Maintain the ten fixed cards

[`data/cards.json`](../data/cards.json) contains the ten preset layouts using task IDs:

```json
["t001", "t002", "t003", "t004", "t005"]
```

Each preset has five rows of five values. Position 12 (row 3, column 3) is always the literal `Bonusfeld`. All other positions must reference IDs defined in `data/tasks.json`; a preset may use a task only once. The ten original presets retain their original order and layouts.

## Zufallskarte

The eleventh selection is **Zufallskarte**. Selecting it and clicking **Bingo starten** creates a new, independent card for that player:

- The server samples **24 different objectives** from the task library using a Fisher–Yates shuffle.
- Square 12 remains the free `Bonusfeld`.
- All other squares are randomized and a task cannot repeat within one card.
- The **picker preview is illustrative only**; the actual random board is generated when the player joins.
- The server stores all 25 strings alongside the player in the room's SQLite Durable Object.
- Refreshing, reconnecting, and viewing someone else's board use that exact stored snapshot; nothing is reshuffled.
- Multiple players can select random cards and receive independent mixtures.

This is intentionally a **simple uniform task pool**, with no difficulty weighting or category restrictions. Future versions can add categories or balancing without changing the saved-board rule.

## Versioning and storage

New assignments use `cardVersion: wvw-v2`. The random choice uses numeric `cardId: 11`. The Durable Object migrates its older 1–10 ID check to 1–11 transactionally, keeping current player rows. No new Cloudflare Durable Object namespace or Wrangler migration tag is required.

**Do not** delete the `.wrangler/` directory while testing if you need local rooms. In production, deploy using the existing Worker and Durable Object binding. To avoid affecting friends mid-session, verify the patch locally in a fresh room first.

## Testing

```powershell
npm run typecheck
npm test
npm run build
```

Manually create a fresh room, select **Zufallskarte**, compare the board to the lobby preview, mark squares, refresh, and verify the assigned card and progress stay identical. Join as a second random player and verify their card can be inspected from the comparison view.
