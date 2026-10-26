# Remaining work and release checklist

The initial frontend, persistence, multiplayer, WebSocket, UX and Cloudflare deployment milestones are implemented. This is a **current maintenance checklist**, not the old step-by-step build log. Detailed historical plans remain in [docs/11-roadmap.md](docs/11-roadmap.md).

## Before sharing or redeploying

- [ ] Verify player-row hover previews in the lobby and in-game overview: correct saved random card, live marks, positioning at viewport edges, mouse/keyboard/touch dismissal.

- [ ] Verify printed A4 sheets in Firefox/Chromium (one page, background graphics, long objectives, random cards, no name or saved marks). See `docs/30-printable-paper-sheet.md`.
- [ ] Check the DE/EN toggle on desktop and mobile: German on reload, English labels/errors, unchanged German tasks and saved progress.
- [ ] Verify the new shared task library and random card choice in a fresh two-player room (including refresh and read-only comparison).
- [ ] Verify existing SQLite player records survive the schema adjustment before deploying to an active room.

- [ ] Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build` on the latest commit.
- [ ] Test new-room creation, second-player join, progress sync, refresh, and return-to-lobby on the actual deployment.
- [ ] Test personal **Neues Bingo starten** / **Raum verlassen** confirmations with two players, ensuring other progress is preserved.
- [ ] Test 320–390px phone-width gameplay and card previews without horizontal scrolling.
- [ ] Review Cloudflare free-tier usage, current security settings and Worker name before publishing updates.
- [ ] Check Git author identity and excluded files before sharing the repository or exporting source ZIP.

## Optional later work

- [ ] Decide whether to implement **24-hour room expiration** using Durable Object alarms. **Not implemented now.**
- [ ] Consider a player recovery code if friends need to switch devices or clear cookies.
- [ ] Consider room exports/backups if saved bingo history becomes important.
- [ ] Review an open-source license if others should be able to redistribute and modify the project independently.

**Invariant:** A page refresh, tab close, disconnect, lobby navigation, or redeployment must never intentionally delete saved player progress. Only an explicitly confirmed personal leave/restart should remove that player's record.
