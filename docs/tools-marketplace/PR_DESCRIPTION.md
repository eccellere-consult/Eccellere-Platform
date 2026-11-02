# Tools marketplace: strategy and problem-solving tools

## What this adds
A new **Tools** section beside the kits. An admin adds tools by name (one at a time, a pasted list, or an uploaded file), the AI drafts each to the Eccellere Standards of Depth and Quality, the owner reviews and publishes it into one of seven sections. Signed-in users get a guided worksheet that autosaves, calculates, offers AI drafting and analysis, and ends in a 30/60/90 action plan.

- **Admin:** `/admin/tools` (add, estimate, draft 3 at a time, review with standards score, edit wording, redraft, "Looks right", publish / take down).
- **Public:** `/tools` (grid by section, search), `/tools/[slug]` (reference page; worksheet needs sign-in), "Tools" in the main menu.
- **Sections:** Problem solving, Business analysis, Strategy, Project Management, Change Management, Decision Models, Others.
- **Engine:** the Framework Workspace engine is ported into `src/lib/strategyModels` and `src/lib/templateKit`. One deliberate fix: rules `top`, `weighted`, `agg` now read computed columns (they never did, so "best option by score" stayed blank).

## Safety
- **Additive database only:** four new tables (`WsTool`, `WsFillin`, `WsImportJob`, `WsImportItem`). Nothing existing is altered. `Asset`, `Order`, payments, kits and the 61 published kits are untouched.
- **Nothing reaches clients unreviewed:** a draft is hidden until a person marks it reviewed and the quality gate has no errors; editing a reviewed tool sends it back to review.
- AI never states an originator or year; it is blank until a person records a source.
- Admin routes need `admin:content:write` / `read`; user routes need sign-in and only serve published tools; AI help is rate-limited (40/hour/user).
- Small unrelated fix: AI provider error detail text no longer strips the letter "s".
- Login can return to a tool page (`?next=/tools/<slug>`, only `/tools` paths allowed).

## Before the Tools section can be used (after merge and redeploy)
1. Run `tools_tables.sql` in phpMyAdmin (SQL tab). Safe to run twice.
2. Log in as admin, open **Tools Marketplace**, add the first 15 to 20 tools, review, publish.
Until then `/tools` shows "The first tools are being prepared" and `/admin/tools` explains the tables are missing.

## Tested
- `tsc` clean, `eslint` clean.
- `npm run test:engine`: 1,071 tests (engine content rules, list parsing, drafting rules, review, standards, AI helpers with a pretend AI, workspace and grid screens in jsdom).
- `npm run test:unit`: 153 tests (includes new AI JSON-mode and finish-reason tests).

## Not verified
- Not run in a real browser, against the live database, or with a live AI key. Real draft quality is unknown until the first batch is reviewed.
- Full `next build`: relies on CI.

## Not in this PR
Boards (fishbone, affinity), cases / "My problems", Excel templates, deck import, per-field Not-known toggle, sitemap entries.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
