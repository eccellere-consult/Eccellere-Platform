# Deployment — Eccellere Platform

Canonical process for deploying `eccellere-consult/Eccellere-Platform` to production at **https://eccellere.co.in**.

> **Production target:** Hostinger shared hosting (CloudLinux + Apache + Phusion Passenger), Node.js 22, MySQL 8, Next.js 15 standalone build.

---

## 1. The deployment model

We use **Hostinger Git auto-deploy** as the only deployment path. Pushing to `master` triggers Hostinger to:

1. Pull the latest commit into `~/domains/eccellere.co.in/public_html/.builds/source/`
2. Run `npm ci && npm run build` (per Hostinger's build config)
3. Copy the standalone build into `~/domains/eccellere.co.in/nodejs/`
4. Touch `~/domains/eccellere.co.in/nodejs/tmp/restart.txt` to restart Passenger

**Do not deploy by SSH+rsync, manual upload, or `git pull` on the server.** Those paths skip the build step and leave the runtime broken.

---

## 2. Standard release flow — **100% via Git, no SSH**

This is the *only* path you should use day-to-day.

```powershell
# 1. From repo root
cd d:\Eccellere\Eccellere AI\eccellere

# 2. Verify clean working tree
git status

# 3. Commit and push
git add .
git commit -m "feat|fix|docs: <short description>"
git push   # auto-deploy starts on the server

# 4. Wait ~3–5 min for the build to complete, then verify
curl.exe -s -o NUL -w "home: %{http_code}`n" https://eccellere.co.in/
curl.exe -s -o NUL -w "marketplace: %{http_code}`n" https://eccellere.co.in/marketplace
```

Expected: `200`, `200`. (`/admin/assets` returns `307` when unauthenticated — that's correct.)

### When to break glass with SSH

SSH is **only** for diagnostics and recovery. Never use it as the primary deploy path.

| Symptom | Action |
|---|---|
| No build started within 5 min of `git push` | hPanel → Git → **Deploy now** button (panel UI, not SSH) |
| Build failed (red badge in panel) | SSH in, read `~/domains/eccellere.co.in/public_html/.builds/logs/<latest>/` to find the cause, fix in code, push again |
| Site returns 500s after a successful build | Check `~/.../nodejs/console.log` for missing-env errors; if `.htaccess` was wiped, follow §5 recovery |
| `.htaccess` lost its `SetEnv` lines | Follow §5 recovery |

> **Don't** use the **Redeploy** button in the Hostinger panel unless a push genuinely failed. The button can re-trigger a build that wipes runtime config (see §6).

---

## 3. Branching strategy (recommended)

Bring back a staging environment so we never debug on production:

| Branch | Deploys to | Purpose |
|---|---|---|
| `staging` | `staging.eccellere.co.in` (separate Hostinger Node.js app) | Pre-prod smoke test |
| `master` | `eccellere.co.in` (live) | Customer-facing |

**Workflow:**

```
feature/<name>  →  merge to staging  →  test on subdomain
                →  merge to master   →  live
```

### One-time staging setup (when ready)

1. In Hostinger: create a second Node.js app on subdomain `staging.eccellere.co.in`.
2. Point its Git integration at branch `staging`.
3. Use a **separate MySQL database** (e.g. `u911413127_eccellere_stg`) so staging tests can't corrupt prod data.
4. Mirror the `SetEnv` block in the staging app's `.htaccess`, but with:
   - `NEXTAUTH_URL=https://staging.eccellere.co.in`
   - `NEXT_PUBLIC_APP_URL=https://staging.eccellere.co.in`
   - Razorpay **test** keys, not live
   - Its own `NEXTAUTH_SECRET`
5. Add a `noindex` robots header on the staging app to keep it out of Google.

---

## 4. Required environment variables

These are read by the running app. **All are required** — missing any one will cause 500s on DB- or auth-backed pages.

| Variable | Example / Notes |
|---|---|
| `DATABASE_URL` | `mysql://u911413127_eccellere:<pwd>@127.0.0.1:3306/u911413127_eccellere` |
| `NEXTAUTH_URL` | `https://eccellere.co.in` |
| `NEXTAUTH_SECRET` | 48-byte base64 random (see §5 for generation) |
| `RAZORPAY_KEY_ID` | `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | live secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` (client-side) |
| `GROQ_API_KEY` | `gsk_…` |
| `STORAGE_PROVIDER` | `local` |
| `NEXT_PUBLIC_APP_URL` | `https://eccellere.co.in` |
| `NODE_ENV` | `production` |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `crm@eccellere.co.in` |
| `SMTP_PASS` | Hostinger mailbox password |
| `EMAIL_FROM` | `crm@eccellere.co.in` |

Canonical template: [.env.production.example](.env.production.example).

### Optional: AI Control Tower (`AIOPS_ENDPOINT`, `AIOPS_KEY`)

These two settings are **optional**. Left empty or missing, the site does nothing extra: no network call, no error, no log line.
When both are set, every AI call the site makes reports technical fields only (provider, model, token counts, time, status, a task code)
to the private Control Tower at `https://aiops.eccellere.co.in`. It never sends prompts, answers, names, e-mails, phone numbers or any cost.
A slow or down Control Tower cannot slow or break the site (2-second limit, fire-and-forget).

| Variable | Value |
|---|---|
| `AIOPS_ENDPOINT` | `https://aiops.eccellere.co.in/api/v1` |
| `AIOPS_KEY` | the key made in the Control Tower under **Configuration → eccellere_co → Make the key** (shown once) |

App code in the Control Tower: `eccellere_co`. Code: `src/lib/aiops/` (client file, hook), wired in `src/lib/ai/gateway.ts` and four direct calls.
**After adding the two settings and redeploying, re-check ALL settings in the list above** (see §5 and §6: a Redeploy has wiped `SetEnv` lines before).

### Where they live on the server

Hostinger stores these as `SetEnv` directives inside:

```
~/domains/eccellere.co.in/public_html/.htaccess
```

The Hostinger panel's **Environment Variables** UI is just a writer for these lines. If the panel shows "Environment Variables: None", the `SetEnv` lines are physically absent from `.htaccess` and the running app has no env at all.

---

## 5. Recovering from an env-var wipe

This happened on 2026-05-04: a panel/redeploy interaction wiped all `SetEnv` lines except SMTP, breaking every page.

### Step 1 — Generate a `NEXTAUTH_SECRET` if needed

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Step 2 — Inject the missing `SetEnv` lines via SSH

```powershell
$lines = @(
'',
'# === Eccellere App Env ===',
'SetEnv DATABASE_URL mysql://u911413127_eccellere:<DB_PWD>@127.0.0.1:3306/u911413127_eccellere',
'SetEnv NEXTAUTH_URL https://eccellere.co.in',
'SetEnv NEXTAUTH_SECRET <SECRET>',
'SetEnv RAZORPAY_KEY_ID <RZP_KEY>',
'SetEnv RAZORPAY_KEY_SECRET <RZP_SECRET>',
'SetEnv NEXT_PUBLIC_RAZORPAY_KEY_ID <RZP_KEY>',
'SetEnv GROQ_API_KEY <GROQ_KEY>',
'SetEnv STORAGE_PROVIDER local',
'SetEnv NEXT_PUBLIC_APP_URL https://eccellere.co.in',
'SetEnv NODE_ENV production',
''
) -join "`n"

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($lines))
$ts  = [int][double]::Parse((Get-Date -UFormat %s))
$cmd = "HT=`$HOME/domains/eccellere.co.in/public_html/.htaccess; cp `$HT `$HT.bak.$ts; echo $b64 | base64 -d >> `$HT; grep -c '^SetEnv' `$HT; touch `$HOME/domains/eccellere.co.in/nodejs/tmp/restart.txt; echo OK"

ssh -p 65002 u911413127@148.135.143.32 $cmd
```

A healthy `.htaccess` should have **18 `SetEnv` lines** (8 Passenger/SMTP defaults + 10 app vars).

### Step 3 — Verify

```powershell
curl.exe -s -o NUL -w "home:%{http_code} mkt:%{http_code}`n" https://eccellere.co.in/
```

---

## 6. Things that have broken us before — don't do these

| Action | Why not |
|---|---|
| Hostinger panel **Redeploy** button | Has wiped `SetEnv` lines from `.htaccess` |
| Hostinger panel **File Backup → Restore** | Backups post-date the wipe; restoring loses recent customer data on DB and may overwrite a good build |
| `git pull` on the server | Skips the build pipeline; runtime keeps the old `.next/` |
| Editing `.htaccess` from the panel without a backup | One mistyped line takes the whole site offline |
| `--force` push to `master` | Auto-deploy may build a half-rewritten tree |

---

## 7. Server quick reference

```bash
# SSH
ssh -p 65002 u911413127@148.135.143.32

# App layout
~/domains/eccellere.co.in/
  ├── public_html/
  │   ├── .htaccess                     # Passenger config + SetEnv lines
  │   └── .builds/
  │       ├── source/                   # current git checkout
  │       ├── last-source/              # previous checkout
  │       ├── config/                   # build hooks (preload-timestamp.js)
  │       └── logs/                     # per-deploy logs
  └── nodejs/                           # the running app
      ├── .next/                        # build output (timestamp = last successful deploy)
      ├── server.js
      ├── node_modules/
      └── tmp/restart.txt               # touch to restart Passenger

# Restart Passenger
touch ~/domains/eccellere.co.in/nodejs/tmp/restart.txt

# Tail app log
tail -f ~/domains/eccellere.co.in/nodejs/console.log

# Inspect env vars currently loaded into the app
grep '^SetEnv' ~/domains/eccellere.co.in/public_html/.htaccess

# Last build log
ls -lt ~/domains/eccellere.co.in/public_html/.builds/logs/ | head -3
```

---

## 8. Post-deploy verification checklist

- [ ] `curl https://eccellere.co.in/` → 200
- [ ] `curl https://eccellere.co.in/marketplace` → 200
- [ ] Open `/admin/assets` in incognito → login required (307), then login → admin grid loads
- [ ] Spot-check the change actually shipped (diff feature visible in browser)
- [ ] `~/domains/eccellere.co.in/nodejs/.next` mtime within last few minutes
- [ ] No new errors in `~/domains/eccellere.co.in/nodejs/console.log`

---

## 9. Secrets hygiene

- **Never** commit `.env.local` or any file containing real keys.
- Local `.env.local` and the on-server `.htaccess` are the two sources of truth — keep them in sync via [.env.production.example](.env.production.example).
- Rotate any secret that appears in chat, screenshots, or logs.
- The SSH password and `SMTP_PASS` should be **distinct** values.
