# 10 — Local development, Cloudflare hosting and cost constraints

> **For actual first-time installation and deployment**, use the current [self-hosting guide](22-self-host-cloudflare.md). This older document explains the project’s original hosting design and historical scaffolding plan.

**Checked against provider docs: 2026-10-25.** These steps describe the planned setup **after** code/configuration has been scaffolded. There is no deployable app in the documentation-first commit.

## Hosting choice

Use **one Cloudflare Workers project** for frontend static assets and the API, plus **one SQLite-backed Durable Object namespace** for room state. GitHub hosts the source repository, not the live real-time server.

GitHub Pages **alone** cannot handle shared, authoritative, persistent multiplayer state or WebSockets. It would require an additional backend. The single Cloudflare deployment minimizes moving parts.

## Verified platform capabilities

- Workers can deploy static files and Worker API logic together; the official Cloudflare Vite plugin handles asset setup.
- Cloudflare Durable Objects are available on the Workers Free plan **with SQLite-backed storage**.
- Durable Object Hibernation WebSockets let inactive connections remain open without continuous active compute duration.
- Published Workers Free limit is 100,000 requests/day (other limits apply).
- Published free SQLite Durable Object storage limit is 5 GB total (separate row/read/write/duration quotas apply).

**Important:** This is a free-tier design target, **not a guarantee** that arbitrarily large usage remains free. Free-tier quotas and product policies change. Check them at deployment time.

## Official docs

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/vite-plugin/
- https://developers.cloudflare.com/workers/vite-plugin/tutorial/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/get-started/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

## Initial setup plan (once implementation starts)

1. Install a supported Node.js version and npm; check tool versions instead of pinning unverified future versions in docs.
2. Scaffold a Vite + Preact TypeScript app **in the existing GitHub working tree** (avoid creating a nested repository).
3. Add Cloudflare integration (`@cloudflare/vite-plugin`, Wrangler) following the current Workers/Vite documentation.
4. Configure a Worker entry and a Durable Object binding with an explicit SQLite migration entry, e.g. `new_sqlite_classes: ["BingoRoom"]`.
5. Add shared bingo calculator and card validation using `data/cards.json`.
6. Add SQLite room persistence and local simulation via Cloudflare-compatible dev runtime.
7. Add frontend routes, REST API, and websocket events.
8. Run typecheck/build/unit/integration/e2e tests.
9. Log in to Cloudflare (`wrangler login` if using Wrangler), configure Worker name and `workers.dev` address, then deploy from the local repository.
10. Test deployed app in two distinct browser sessions, verify persistence and real WebSocket fanout.
11. Optionally connect GitHub to Cloudflare CI once manual deploy works reliably.

Commands after scaffolding will usually be similar to:

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run deploy
```

**These are proposed scripts**; don't attempt them before `package.json` contains implementations. Prefer official current Cloudflare CLI/Vite commands when creating the project. The Cloudflare toolchain also documents `cf` CLI alternatives; choose and document one reproducible workflow rather than mixing them.

## Durable Object configuration rule

New DO namespaces use SQLite `new_sqlite_classes`, not old key-value `new_classes`. The config must declare an explicit binding/class and migration. Verify the **exact** filename (`wrangler.jsonc` or other supported config), compatibility date and Vite plugin syntax with installed tooling.

## Free-tier protection

- Avoid 1-second interval HTTP polling; use hibernatable WebSockets.
- Keep messages compact; only broadcast when state actually changes.
- Reject oversized/malformed bodies and rate-limit room creation.
- Establish practical per-room player caps and test normal usage.
- Check Cloudflare dashboard consumption after a real group session.
- Keep paid add-ons and paid-only KV namespaces out of MVP.

## Security before making public

- Validate `Origin` on mutating endpoints and WebSocket upgrades.
- Use secure, HttpOnly, room-scoped cookies; don't leak tokens to the client UI.
- Check that anonymous room read is intentional.
- Restrict writes by session and test other-player tampering.
- Make errors safe and logs free of tokens.

## Troubleshooting targets

| Symptom | First check |
| --- | --- |
| SPA route `/r/:code/play` 404 | Static asset SPA fallback/routing config |
| Lobby loads but no updates | WebSocket endpoint, upgrade proxy to room Durable Object |
| Refresh loses progress | Cookie path/flags, SQLite writes, `/me` session lookup |
| Deployment fails for DO | Migration tag + `new_sqlite_classes` config |
| Unexpected quota usage | Excessive polling, repeated broadcasts, no hibernation |
| Works locally but fails on deployment | Environment bindings, HTTPS cookie flags, origin validation |

## GitHub first commit

For this **documentation-only** deliverable, after copying files into the cloned repository:

```bash
git status
git add README.md AGENTS.md PROJECT_STATUS.md docs data/cards.json
git commit -m "docs: define GW2 WvW multiplayer bingo specification"
git push
```

If your repo already contains some of these files, review the diff before overwriting. No remote push or deployment is performed by these documentation files themselves.
