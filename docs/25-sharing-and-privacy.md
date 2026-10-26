# Sharing BingoWebApp safely

This checklist is for sharing the GitHub repository or a downloadable source archive with friends who want to deploy an independent Cloudflare instance.

## Preferred: share the GitHub repository

Send your friends the public repository URL and [self-hosting guide](22-self-host-cloudflare.md). A normal `git clone` downloads **tracked project files and Git history**, not your local ignored `.wrangler/` database or `node_modules/` folder.

**Before making a repository public**, check the public repo's files **and commit history**. A later commit removing private information does **not** erase earlier commits that contained it. This cleanup does not rewrite Git history. Check `git log --format="%an <%ae>"` for author email addresses and choose a GitHub no-reply email for future commits if desired.

A public GitHub URL also reveals the account name that owns the repository. Changing the Cloudflare `workers.dev` subdomain does not hide GitHub usernames or Git commit metadata.

## Alternative: make a clean ZIP of the current source

From the root of a committed, clean local repository, use:

```powershell
git archive --format=zip --output=..\BingoWebApp-source.zip HEAD
```

That exports tracked project files **without** `.git/`, `node_modules/`, `.wrangler/`, local cookies/databases, or other ignored files. If you have uncommitted source changes, commit them first or review the archive carefully; `git archive HEAD` uses only the last commit.

Never send your entire VS Code project folder as a ZIP without filtering out private development state.

## What a friend should change

- Choose their **own Cloudflare account**. Their rooms and databases are independent of yours.
- Change the `name` field in `wrangler.jsonc` only **before** their initial deployment, if they want a different Worker name.
- Choose an anonymous `workers.dev` account subdomain if desired; the public URL may expose that subdomain.
- Keep the Durable Object class `BingoRoom` and `v1` SQLite migration unchanged, especially after deployment.
- Read [the deployment guide](22-self-host-cloudflare.md) before running `npm run deploy`.

## Player privacy

Anyone holding a room invitation link can view that room's display names, selected cards, and progress. Players should use nicknames. Room sessions use HttpOnly cookies; a lost cookie cannot currently be recovered on another device. A confirmed **Neues Bingo starten** or **Raum verlassen** deletes only that player's stored entry.

There is **no automatic 24-hour cleanup yet**. Old rooms remain stored. Do not promise automatic deletion, account-based recovery, or independent backups.

## Licensing

This repository currently has **no explicit LICENSE file**. GitHub visibility alone does not grant broad rights to modify and redistribute the code. If distributing it as a reusable open-source project is intended, the owner should deliberately choose and add a license (for example MIT) after reviewing its terms.
