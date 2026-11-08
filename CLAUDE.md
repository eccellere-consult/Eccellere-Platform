# Eccellere+ (eccellere.co.in): instructions for Claude Code

This repository is the Eccellere+ platform (Next.js 15, React 19, Prisma on MariaDB), deployed on Hostinger.
Hostinger **auto-deploys every merge to `master`** with no staging, so a merge is a production deploy.
The owner is a non-technical founder: plain language, click-by-click steps, no jargon without explanation.
The owner's global rules in `~/.claude/CLAUDE.md` and the parent project `CLAUDE.md` also apply; this file adds to them and may be stricter, never looser.

## Product standard (mandatory)

**Before designing, building, changing or reviewing any page, tool, agent, form or report, read
`.claude/skills/eccellere-plus-standard/SKILL.md`.** It points to the owner's two standards
(`product-standard.md` and `module-standard.md` in the same folder).

Standing rule (owner, 2026-11-08): eccellere.co.in follows the same standards as eccellere.in for colours, guides, PDF
formats, a demo always, AI as a simple first assist, one frame, one depth and one report, with **a little more black and
gold** so Eccellere+ is visibly different. The same applies to every agent in the Agent Marketplace: a standard sample,
a one-click demo, a guided tour, Excel template and upload, a blank and a filled PDF report.

In short:
- **Name:** "Eccellere+" (wordmark `ECCELLERĒ+` with a gold plus). Never "Eccellere" alone as this product.
- **Colour:** ink 0E0E0D, gold B8913A, deep gold 7F611A for small text on light, gold-light D4AE6A on dark, cream FAF8F4,
  border E5E2DB, error B3392B. Dark frame, gold signature, light reading surfaces. Add no new colours.
- **Fonts:** Cormorant Garamond (display), DM Sans (text). One type scale, one spacing rhythm.
- **AI:** assists and drafts only; always labelled and editable; works with AI off; never writes a number, a score or a benchmark.
- **Numbers:** computed by tested code; never invent a benchmark or a figure.
- **Report:** one PDF engine, US Letter, standard header and footer (ECCELLERE+ and www.eccellere.co.in).
- **Honesty:** say what was not verified (a real browser, a phone, the real host build, the real AI).

## Delivery: every change is a READY-TO-MERGE pull request

1. **Never push to `master`.** Work on a feature branch (`git rev-parse --abbrev-ref HEAD` before every push). One purpose per PR; batch related work into ONE combined PR with one description.
2. **Up to date, no conflicts:** `git fetch`, then `git merge-tree --write-tree origin/master HEAD` must be clean.
3. **Checks green:** `npx tsc --noEmit`, `npm run typecheck:tests`, `npx eslint` on touched files, `npx vitest run`. Do not run a local production build on the owner's laptop; CI does it. Read `gh pr checks` for the real result.
4. **Create the real PR with `gh pr create`.** Hand-over order: PR URL; status; what the owner will see; what needs their eye; what happens on merge plus the one check afterwards; how to undo (the PR page's **Revert** button).
5. **Database changes ship alone, with the SQL step at the top** (a `.sql` file the owner runs in phpMyAdmin BEFORE merging). Prefer additive changes (new table, new nullable column). Call out anything destructive for explicit approval.
6. **Merge sequencing:** tell the owner to wait for the previous deploy to finish before merging the next PR when overlapping could create a risk (database change, dependent PRs, login, payments, shared layout).
7. **Do not merge for the owner and never enable auto-merge** unless asked. After they merge, verify with git (`git fetch; git log origin/master`) before saying "live".
8. Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; PR bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
9. Never `git add -A` here: the repo root holds untracked owner files. Add files by name.

## Working notes

- Engine for fixed-formula tools: `src/lib/strategyModels/declarative.ts` (a tool is data: sections, fields, tables, computed columns, derived values, outputs, sample). Agents live in `src/lib/agents/` (catalogue, pilots, SIPOC, Agent Control edits).
- A pilot's `sample` block is the single source of its demo, sample Excel and sample results.
- Tests are vitest; server tests start with `// @vitest-environment node`. Test every formula against an independently worked answer.
- Use the Write tool for TypeScript files; shell heredocs break on quotes.
- Treat the owner's laptop as fragile: one heavy job at a time.
