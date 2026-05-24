# WhatsApp Working Capital Diagnostic — Deploy & Test

Interactive WhatsApp utility for MSME owners. Tree-of-Thought design: 5 screening
questions → drill-down only into weak levers → GROQ-narrated report with top 3
actions + metrics to baseline. Hosted inside the existing `eccellere` Next.js app.

## Files added

| File | Purpose |
|---|---|
| `src/lib/wcDiagnostic/questions.ts` | Question bank (screening + per-lever drill-downs) |
| `src/lib/wcDiagnostic/whatsapp.ts`  | Cloud API senders (text / yes-no buttons / 1–5 list / menu) |
| `src/lib/wcDiagnostic/engine.ts`    | Tree-of-Thought state machine, DB-backed sessions |
| `src/lib/wcDiagnostic/analyze.ts`   | Deterministic scoring + GROQ narrative (with template fallback) |
| `src/app/api/whatsapp/wc-webhook/route.ts` | Meta webhook (GET verify + POST messages) |
| `prisma/schema.prisma`              | `WcDiagnosticSession` model appended |

## 1. Environment variables (add to Hostinger `.env`)

```
WA_PHONE_ID=1119694681233626
FB_SYSTEM_USER_TOKEN=<existing token, reuse>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<generate: openssl rand -hex 32>
GROQ_API_KEY=<already present>
```

If `GROQ_API_KEY` is missing, the diagnostic still works — it falls back to a
clean deterministic template report.

## 2. Database migration

The schema has a new model. The safe path on Hostinger (no migration history is
needed for a new isolated table) is `prisma db push`:

```bash
# locally
cd eccellere
npx prisma db push          # syncs WcDiagnosticSession table
npx prisma generate         # already done — regenerates client
```

On Hostinger, after `git pull`:
```bash
cd ~/domains/eccellere.co.in/nodejs
npx prisma db push
npx prisma generate
pm2 restart eccellere   # or whatever process manager is in use
```

## 3. Local test (always do this first)

```bash
cd eccellere
npm run dev               # http://localhost:3000
```

Expose locally via ngrok so Meta can reach the webhook:
```bash
ngrok http 3000
# Copy the https URL, e.g. https://abc123.ngrok-free.app
```

In **Meta Business Manager → WhatsApp → Configuration → Webhooks**:
- **Callback URL**: `https://abc123.ngrok-free.app/api/whatsapp/wc-webhook`
- **Verify Token**: paste the same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Click **Verify and Save** (Meta will call `GET` with `hub.challenge`)
- Subscribe to: `messages`

Then from your phone (+91 86182 19692 — already whitelisted as test recipient),
send "Hi" to **+91 99646 94566**. Expected flow:

1. Bot replies with menu (`Working Capital` / `What is this?` buttons).
2. Tap "Working Capital" → 5 screening questions appear one by one.
3. Any lever rated ≤3 triggers 2 follow-up questions for that lever.
4. After the last answer → "Analysing now…" → full report.

## 4. Deploy to production

```bash
git add eccellere/prisma/schema.prisma \
        eccellere/src/lib/wcDiagnostic \
        eccellere/src/app/api/whatsapp \
        eccellere/.env.production.example \
        eccellere/WC_DIAGNOSTIC_README.md
git commit -m "feat(whatsapp): working capital diagnostic utility"
git push origin master
```

Hostinger auto-deploys. SSH in and run the DB push + restart shown in §2.

Finally, switch the Meta webhook Callback URL from ngrok to:
```
https://eccellere.co.in/api/whatsapp/wc-webhook
```

## 5. Operational notes

- **24-hour session window**: This bot only initiates *after* the user sends the
  first message ("Hi"). All replies happen inside the 24-hr session window — no
  template approval needed.
- **Idempotency**: Duplicate taps on the same question button are ignored.
- **Restart**: User can type "restart" to abandon the current session and start over.
- **Webhook ACK**: We always return 200 immediately and process inbound messages
  asynchronously. Meta retries aggressively on slow ACKs.

## 6. Question content sourcing

All diagnostic content traces back to
`Marketplace documents/Quality checked for submission/Eccellere_Mfg_Working Capital improvement_Kit.docx`,
specifically sections A–H (questions) and Sections I, M (metrics, actions).
Update `questions.ts` / `analyze.ts` action library when the kit is revised.
