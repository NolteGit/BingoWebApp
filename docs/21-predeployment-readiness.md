# 21 — Pre-deployment hardening and release checklist

**Scope:** Step 13. This is the last pre-deployment patch. It does **not** publish the app or introduce player deletion, administrator access, account registration, cross-device recovery, or backups.

## New protections

- Cloudflare Workers rate-limit bindings protect the two **anonymous resource-creation** endpoints: `POST /api/rooms` (8 requests per minute per IP) and new `POST /api/rooms/:code/join` sessions (30 requests per minute per IP). Existing valid join cookies can resume without consuming a join slot.
- Exceeded limits return `429`, a German error, and `Retry-After: 60`. This is an **approximate, per-location** Cloudflare limit rather than a strict global quota. Friends on the same shared IP may encounter it if rapidly testing joins.
- Browser mutations reject cross-site `Origin` and `Sec-Fetch-Site: cross-site`. CLI requests without those headers continue to work for the test scripts.
- JSON API responses include `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.
- Original room-scoped HttpOnly cookie authentication, revision-checked writes, SQL persistence, and WebSocket read-only protocol are unchanged.

**Configuration:** `wrangler.jsonc` defines `ROOM_CREATE_LIMITER` (namespace `1001`) and `ROOM_JOIN_LIMITER` (namespace `1002`). The binding requires Wrangler **4.36+**. Namespace IDs should be unique across rate-limit namespaces in the same Cloudflare account. Edit them if already used by another Worker in your account. Keep SQLite's existing `v1` migration intact.

The public room snapshot exposes names and completed squares to anyone with the room code by design. Treat invitation links as shareable, not secret personal information.

## Before deployment (Windows PowerShell)

1. Commit or back up your repository. **Do not delete `.wrangler/state`** if you want your local test rooms. Local rooms are separate from production rooms.
2. Update installed dependencies and check Wrangler is current:

   ```powershell
   npm install
   npx wrangler --version
   npm run typecheck
   npm test
   npm run build
   ```

3. Start `npm run dev:api` and `npm run dev` in two terminals. Repeat the manual outage/recovery tests in `docs/20-step12-reliability-testing.md`.
4. Run a two-player test including new room, joining, shared card selection, marking a square, 5-in-a-row, refresh, backend restart, and read-only comparison.
5. Test throttling carefully using a throwaway test room. Do not spam a real session. The rate-limit binding's local behavior may differ from Cloudflare's global edge behavior.
6. Confirm that session-cookie loss (private mode ended, browser storage cleared, another device) **still has no self-service recovery**. Warn friends to keep their browser profile/session during a game.
7. Check the current Cloudflare Free plan quotas and confirm your account remains on the intended plan.

## Manual first deployment (not part of this patch)

```powershell
npx wrangler login
npm run deploy
```

Wrangler will prompt to configure a `workers.dev` hostname where needed. Note the published HTTPS URL and test it in separate browser profiles. Never send the local `http://localhost:5173` address as an invitation to friends.

After deployment, re-run the same multi-browser checks against the **published HTTPS URL**, including secure cookies and a real WebSocket connection. Verify persisted marks survive a new deployment. Monitor worker errors and quota usage in Cloudflare's dashboard.

## Explicit limitations and follow-up

- No room deletion, player deletion, reset or administrative recovery is available. **Do not add those in an emergency deployment hotfix.** Design and test their authorization and confirmation separately.
- SQLite-backed Durable Objects persist ordinary game state but are **not a replacement for independent backups**. Point-in-time recovery is an administrative capability, not an in-app button.
- Rate limiting mitigates accidental/low-volume spam, not determined distributed abuse; room creation remains anonymous.
- The deployment milestone is complete **only after** actual live browser tests. Do not mark it complete because local typecheck/build tests pass.

## Official references

- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/platform/limits/
