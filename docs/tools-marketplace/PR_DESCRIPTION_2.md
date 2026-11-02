# Tools marketplace, part 2: consulting library, skill files, required diagram and worked example

## What this adds
- **Consulting library** at `/consulting/library` (Eccellere team logins only: Admin, Super Admin, Content Admin). Every reviewed tool is there, by consulting practice or by framework layer, with a "My game plan" page that gathers the 30/60/90 actions from every tool a consultant has analysed.
- **Clients** see a tool at `/tools` only after an admin presses "Expose to clients"; "Withdraw" returns it to the library; "Archive" hides it. `/marketplace` gets a link band to `/tools`. Kits, orders and payments are untouched.
- **36 Strategy Hub tools** can be added to the library with one admin button (hand-built diagrams, worked examples and calculations kept).
- **Every drafted page must have a diagram and a worked example** (one focused follow-up AI call fills a gap; still missing = an error). The AI **suggests** the originator; it appears on the page only after a reviewer confirms.
- **Editable skill files** (drafting, assist) in the admin, with reset and .md download. Format contract, quality gate and review-before-client stay in code.
- **Upload PDF, Word, PowerPoint, Excel or text** as the tool list or as source content for the AI (text is read, not stored).
- **AI help in the worksheet:** suggests questions for the person's situation, drafts empty parts, writes the analysis using that context, shows a fictional worked example on request.
- Fix: production build no longer type-checks test files (they need dev packages the host does not install).

## Before it works (after merge and redeploy)
Run **`tools_tables_update_1.sql`** in phpMyAdmin (adds `practice` and `brief` columns; safe to run twice). Then in Admin > Tools marketplace: add the Strategy Hub tools, paste the list from `docs/tools-marketplace/TOOL_LIST_v2_consulting.md`, review, expose what clients should see.

## Tested
tsc, test-file tsc, eslint clean; 1,116 engine/screen tests; 153 platform tests.

## Not verified
Not run in a real browser, against the live database, or with a live AI key. PDF reading is not verified on Windows (same reader as the kit evidence upload on the server). Full `next build` relies on CI.

## Not in this PR
AI-generated pictures, a chart of the person's own numbers, deck-to-many-tools import, per-field Not-known toggle, syncing actions into the Game Plan app.

## Also in this PR: clean-up and "with AI" at every stage
- **Fix with AI** (per tool, on a selection, or all tools with problems) and **Modify with AI** (by instruction). A correction that would make a page worse is refused and explained; name, section, originator and review state are never taken from the AI.
- **Suggest tools with AI** at the add stage; a one-click **Load the proposed consulting list** (231 tools, plain `Name | Group` text in `TOOL_LIST_v2_consulting.txt`).
- **Delete** tools (not while live, not once anyone has saved work: archive instead), names inside a run, or a whole run; **bulk** mark reviewed, expose, withdraw, archive, delete.
- Tests: 1,138 screen/engine tests, 153 platform tests; tsc and eslint clean.
