# Deploy BingoWebApp on Cloudflare (beginner guide)

**Audience:** The original maintainer or a friend who wants to host an **independent copy** of this game on their own Cloudflare account. These instructions assume Windows / VS Code / PowerShell, but the npm and Wrangler commands also work on macOS and Linux terminals.

**What you get:** One public HTTPS `workers.dev` address serving the web UI, HTTP API, WebSocket multiplayer, and persistent SQLite-backed Durable Objects. **You do not need** a dedicated server, a domain name, Google Sheets, GitHub Pages, or a separate database account.

> **Important:** A friend's Cloudflare deployment is a separate installation. Rooms, player sessions, and progress **do not** synchronize between different deployments. Players who want to play together must use a room link from the **same deployed website**.

## 1. Prerequisites (one-time)

1. Create a **free Cloudflare account**: <https://dash.cloudflare.com/sign-up>. Choose the Workers Free plan. Do not upgrade to Workers Paid just for this project.
2. Install **Node.js LTS** (Node.js 24 recommended): <https://nodejs.org/>. This includes npm.
3. Install **Git**: <https://git-scm.com/downloads> and optionally **VS Code**: <https://code.visualstudio.com/>.
4. Have access to this repository: <https://github.com/NolteGit/BingoWebApp>. A public repo can be cloned directly. You do not need to connect GitHub to Cloudflare for the **manual deployment** described below.

Open a PowerShell terminal and check:

```powershell
node --version
git --version
npm --version
```

For safe repository/ZIP sharing and Git author identity considerations, see [sharing & privacy](25-sharing-and-privacy.md).

## 2. Download the source code

If you have **not** downloaded the repository:

```powershell
git clone https://github.com/NolteGit/BingoWebApp.git
cd BingoWebApp
```

If you already cloned it, open the existing repository folder in VS Code; do not clone inside it again. To fetch new commits before a future deployment, see **Updating the app** below.

Install reproducible dependencies from the committed lockfile:

```powershell
npm ci
```

Use `npm install` when intentionally updating dependencies or the lockfile. If npm reports a dependency conflict, fix compatible package versions rather than using `--force` or `--legacy-peer-deps`.

## 3. Optional: choose your own Worker name *before the first deployment*

Open **`wrangler.jsonc`**. The default setting is:

```json
"name": "gw2-wvw-bingo"
```

You can keep it if it is available in your **own Cloudflare account**. Or choose something unique within your account, for example:

```json
"name": "my-gw2-bingo"
```

Only change the `name` value. **Do not rename** the Durable Object class `BingoRoom`, binding `BINGO_ROOMS`, or the SQLite migration (`tag: "v1"`, `new_sqlite_classes: ["BingoRoom"]`). Those are required for the persistent backend.

The `ROOM_CREATE_LIMITER` and `ROOM_JOIN_LIMITER` bindings use different rate-limit namespace IDs (`1001` and `1002`). These are local to a Cloudflare account. If another Worker in *your account* already uses those IDs for a different limiter, choose two other distinct namespace IDs here. Friends on separate Cloudflare accounts may use the same defaults.

**After production deployment, keep the Worker name stable.** Changing it later can create a separate Worker and separate Durable Object namespace, making your old games inaccessible through the new deployment.

## 4. Check that the app works before publishing

From the repository root:

```powershell
npm run typecheck
npm test
npm run build
```

All commands should finish successfully. `npm run build` generates the `dist/` folder containing the frontend files. You do not need to upload `dist/` manually.

For local multiplayer development (optional), run `npm run dev:api` and `npm run dev` in **two separate terminals**, then visit <http://localhost:5173/>.

## 5. Log in to Cloudflare with Wrangler

```powershell
npx wrangler login
```

Wrangler opens your browser. Log in to your Cloudflare account and approve the requested authorization. Return to the terminal once it reports success.

Optional check:

```powershell
npx wrangler whoami
```

If you have access to more than one Cloudflare account, choose the correct account when prompted. Never commit access tokens, `.env` files, or `.dev.vars` to Git.

## 6. Deploy to the internet

```powershell
npm run deploy
```

This project's script runs the frontend build and `wrangler deploy`. It deploys the **frontend, HTTP API, and Durable Object together** using `wrangler.jsonc`.

On the first deployment, Cloudflare might ask you to configure/enable your account's `workers.dev` subdomain or select an account. Follow those prompts. **Do not create a Cloudflare Pages project, D1 database, KV namespace, or a separate Worker manually.**

When deployment succeeds, Wrangler displays a public URL similar to:

```text
https://my-gw2-bingo.<your-workers-subdomain>.workers.dev
```

Copy the **actual URL returned by Wrangler**; the one above is only an example. You can also find your Worker in the Cloudflare dashboard under **Workers & Pages**.

## 7. First public test (important)

1. Open your new **HTTPS** URL in a normal browser. The lobby should load.
2. Open `<your public URL>/api/health`. It should return JSON with `"status":"ok"`.
3. Create a room. Its invitation link should use **your public HTTPS domain**, not `localhost`.
4. Join as Player A, choose a card, and check a few squares.
5. Open the same room link in another browser/profile (or a separate private session) and join as Player B.
6. Check that both players see each other in lobby/Vergleich and can open each other's **read-only** cards.
7. Mark/unmark squares. Verify that updates reach the other player and that a completed line counts as Bingo.
8. Refresh Player A's page. The same name, card, and checked squares must return.
9. Run **`npm run deploy` again** without changing room data. The same published room and progress should remain available afterward. A repeat deployment must not wipe production storage.

If anything fails, **do not mark the release complete**. See troubleshooting below and `docs/20-step12-reliability-testing.md`.

## 8. Updating the app later

If you maintain your own clone and have no uncommitted edits:

```powershell
git pull
npm ci
npm run typecheck
npm test
npm run deploy
```

If you forked the project, obtain upstream updates in your fork before running these commands. If you modified `wrangler.jsonc`, check that a pull will **not overwrite your chosen Worker name** or rate-limit settings.

**Important for saved games:** Redeploy to the **same Cloudflare account and Worker name**, keeping the Durable Object binding and existing migration intact. `npm run deploy` is a code deployment; it should not delete the SQLite room records. Your local `.wrangler/` data is entirely separate from production.

For the initial setup, **manual CLI deployment is recommended**. After it works, you can optionally enable automatic deployment from GitHub: Cloudflare dashboard → Workers & Pages → select this Worker → Settings → Builds → Connect repository. Set build command `npm run build` and deploy command `npx wrangler deploy`, and make sure the dashboard Worker name matches `wrangler.jsonc`. Otherwise, keep manual deployment; it is simpler for occasional game nights.

## 9. Troubleshooting

| Problem | What to check |
| --- | --- |
| `npm install` fails due to dependency versions | Use the supported Wrangler/Workers types versions in `package.json`; don't use `--force`. |
| `npx wrangler login` fails | Check browser authorization, login account, corporate VPN, or run `npx wrangler whoami`. |
| Cloudflare deploy complains about SQLite/`BingoRoom` | Keep `new_sqlite_classes: ["BingoRoom"]`, the `BINGO_ROOMS` binding, and the `v1` migration in `wrangler.jsonc`. |
| Rate-limit binding error | Use a current Wrangler version and two distinct namespace IDs in this Cloudflare account. |
| Website loads but room creation returns 500 | Check the Worker logs in Cloudflare Workers & Pages; confirm Durable Object and rate-limit bindings were deployed. |
| Shared URL returns a different/empty room | Make sure both players use the **same** public deployment URL and room code. |
| Session not restored | Use the same browser profile, keep cookies enabled, and don't end the private browsing session. |
| Realtime updates delayed | WebSockets may be unavailable; HTTP fallback polling should continue to work. Inspect browser network console and Worker logs. |
| `workers.dev` URL not active | Confirm your account has a `workers.dev` subdomain and that the Worker is enabled for it in Cloudflare. |
| Existing games seem missing after renaming Worker | Switch back to the original Worker name/account. Don't delete or recreate Durable Object namespaces. |

Useful maintenance commands:

```powershell
npx wrangler whoami
npx wrangler tail
npx wrangler --version
```

`wrangler tail` streams live Worker logs. Stop it with `Ctrl+C` after debugging.

## 10. Free-plan and privacy notes

- The design is intended for Cloudflare **Workers Free**: SQLite Durable Objects are supported on the free plan. Workers and Durable Objects have separate daily/usage limits; exceeding a free limit may make operations unavailable until it resets. Check the current limits in the dashboard and Cloudflare's pricing docs.
- There is **no cross-device recovery code** yet. If a player clears cookies, changes browser profile/device, or closes their private session, they might lose access to their existing player. Saved records are not automatically deleted, but the browser cannot prove ownership without the session cookie.
- Rooms and player names/progress are readable to anyone who has the room URL. Do not use real names or private information in player names.
- Avoid deleting the Worker, changing the Durable Object class/migration, or experimenting with production data during a game. SQLite persistence is not a complete independent backup system.
- One friend hosting their own copy creates a **new, separate game service**. Hosting the same code does not connect their rooms to yours.

## Official references

- [Cloudflare: deploy Workers with Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/workers/)
- [Cloudflare: static assets with Workers](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare: Durable Objects pricing and free tier](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Cloudflare: rate-limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Cloudflare: Git integration (optional)](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)
