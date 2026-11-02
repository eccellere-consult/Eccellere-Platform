# Tools marketplace: plan and status

**Started:** 2 November 2026 · **Branch:** `feat/tools-marketplace` · **Blueprint:** `D:\Cowork\Output\Framework_Workspace_Builder`
(read `SKILL.md` and `references/01 to 11` there; this plan does not repeat them, it applies them to this platform).

## 1. What we are building

A new **Tools** section beside the marketplace's kits: strategy tools, problem-solving tools and more. Each tool has
its **real model drawn**, **when to use it and when not to**, an **actual workspace** (a guided form that autosaves),
**AI help** that drafts only what the person has not answered, and an **analysis with actions**. Tools are created at
the **admin end** from a **list of tool names**: AI drafts each one, a person reviews it, then it is published.

Governing idea (blueprint rule 1): **one definition per tool** drives the form, the diagram, the template, the AI prompts
and the results, so they cannot drift apart. Tools written as data are the same definition format, so a long list is
possible without writing code per tool.

## 2. Decisions taken (2 Nov 2026)

| Decision | Choice | Consequence |
|---|---|---|
| Where it lives | **In this platform** (eccellere.co.in), not the Strategy Hub app | The engine is ported here; database layer rewritten on Prisma; login by NextAuth; AI through the existing AI settings |
| Access | **Free for signed-in users** | No purchase flow in v1. Pricing can be added later without rebuilding |
| First batch | **The owner's own list of tool names** | The admin "add from a list" flow is the heart of v1. The list is still to be provided |

## 3. What the feasibility spike proved (commit `61beee2`)

- The engine and its 36 Strategy Hub framework definitions **type-check cleanly in this app** (strict mode, 0 errors).
- **984 engine tests pass** in 15 files (`npm run test:engine`), covering the content-quality bar for every definition,
  the form, template and AI-prompt builders, boards, tools-as-data, diagram templates and deck import.
- Lint: 0 errors. All 54 + 11 copied files are **byte-identical** to the blueprint's manifests.
- Nothing is wired into a page, a route or the database. No production behaviour changed.

**Not yet proven:** the engine with real data in a browser here; the AI drafting quality with a live key; the
database layer (Prisma); the full production build with these files (GitHub's build check is the proof).

## 4. Architecture for this platform

| Blueprint part | In this platform |
|---|---|
| `strategyModels/*`, `templateKit/*`, diagrams, prompt builders | **Copied unchanged** (done) |
| `strategyFrameworks.ts`, `strategyFillins.ts`, `strategyHubConnections.ts`, `seedStrategyFrameworks.ts` (raw SQL) | **Rewrite on Prisma**, same function names, ids as strings (User ids are strings here; the blueprint uses numbers) |
| Session (`lib/auth`) | NextAuth `getServerSession`; admin by the existing role permissions |
| AI client (`llmClient`) | Adapter over the existing AI settings and fallback order. **Needs a JSON mode and a finish-reason signal** added to the shared AI layer, without changing existing features |
| Business context, value scan | Not used in v1 (the blueprint says the prompt then says "use realistic assumptions") |
| Page chrome | This site's header, footer, fonts and brand tokens |
| Excel kit (blank template, sample workbook, upload) | Ported as is; `xlsx-js-style` writes; reading uploads must use a safe reader (blueprint note 13) |

**New tables (additive only, Prisma):** `WsTool` (catalogue and tool-as-data definition, status, provenance, quality-gate result),
`WsFillin` (one row per user, tool and case, with `version`), `WsCase` (later), `WsImportJob` and `WsImportItem` (batch drafting).
No existing table changes. Needs the same manual SQL step as the toolkit until the start-up sync is fixed.

## 5. The admin flow for a list of names

```
 paste names (one per line, optional "| category")  ->  estimate  ->  Draft with AI  ->  review  ->  publish
        admin only                                      calls, time      page drives     3 panes     quality gate must pass
                                                                         the loop (3 at         AND a person marked it reviewed
                                                                         a time, resumable)
 item:  queued -> drafting -> draft | needs_review | failed -> reviewed -> published
```

- **One item per name.** The AI gets the name, the category and the rules, and returns one JSON tool: sections, parts, tables, rules,
  one diagram template, `does`, `when to use`, `when not to use`, the next tools. It never invents an originator or year; a blank is shown as "Originator not stated".
- **Quality gate** blocks publishing on any error (weak help text, missing output, placeholder text, a diagram without a title, and so on).
- **A tool the AI drafted never reaches a client until a person ticks "Looks right".** The page shows "Drafted with AI · reviewed <date>".
- **Resumable, atomic:** a claimed item cannot be drafted twice; a dead request unlocks after 3 minutes; the AI being down pauses the job with a plain reason.
- **Cost shown first:** "N tools: about N to 2N AI calls". Text sent to the AI provider is stated on the screen.

## 6. Phases and acceptance

| Phase | Delivers | Acceptance (all automated where possible) |
|---|---|---|
| **0 Spike** (done) | Engine ported; tests green | `tsc` clean; `npm run test:engine` 984 pass; manifests identical |
| **1a Foundation** | Prisma models + SQL; AI JSON mode; Prisma store behind the engine's function names; admin login gate | Unit tests on the store (fake DB); a fake-AI contract test; build green |
| **1b Admin** | `/admin/tools`: add from a list, estimate, draft loop, review screen (form + preview), quality gate, publish | The blueprint's browser journey (doc 11 section 10) with a fake AI: 12 slides/names, one bad, one failing, resume mid-run, bulk publish |
| **1c Public** | `/tools` searchable grid; `/tools/[slug]` workspace (diagram, when to use, guided form, autosave, AI draft, analysis, print) | Signed-out visitor sees the page and a worked example; a signed-in user saves and finds it tomorrow; no console errors at desktop and phone width |
| **1d Marketplace link** | "Tools" entry beside kits in the marketplace and home; category filters | Links live; the 61 kits, orders and payments untouched (read-only guarantee) |
| **2 Depth** | Boards (fishbone, 2x2, affinity), cases ("My problems") and the golden thread, Excel templates, deck import | Blueprint gates G1 to G7 |
| **3 Polish** | Search, analytics, empty states, accessibility pass, QA scoring of each tool against the Standards of Depth and Quality | Each published tool scored out of 100 |

**Order of work for the first working slice:** 1a, then 1b with the fake AI, then 1c. A real-key trial comes after 1b so we judge actual draft quality.

## 7. Honest limits

- **A name alone is a thin brief.** AI drafts from a name plus its own knowledge, so a draft can be generic or subtly wrong. The review step is not optional, and the
  quality gate checks structure, not truth. Published tools should show provenance.
- **"Visual models" for tools written as data use six diagram templates** (2x2, 3x3, steps, cycle, canvas grid, scale). A tool that needs its own figure
  (a Porter five-forces drawing, for example) is hand-authored or uses the board kind. The 36 Strategy Hub tools already have hand-drawn diagrams.
- **Real frameworks only:** names, elements and order must be canonical. Originators and years come only from a source opened during the build.
- **Cost and time:** a reasoning model takes 15 to 60 seconds a call; at three at once, 150 tools take about 25 minutes. Plan the first run as a supervised session.
- **The 36 Strategy Hub tools came with the engine.** Whether they appear in this Tools section (as a ready "Strategy" category) or stay only on the Strategy Hub is a pending decision.

## 8. Open questions for the owner

1. **The list of tool names**, with a category for each if known (strategy, problem solving, root cause, decision, creative, planning, other).
2. Should the **36 Strategy Hub tools** be included in this section at launch?
3. **Who reviews** AI drafts before publishing (a role, so it can be recorded on each tool)?
4. Should a **signed-out visitor** see a worked example (the blueprint's demo mode), with saving only after sign-in?
5. **Pushing branches:** the permission system blocked the first push of this branch (a large block of copied code). It needs your explicit go-ahead.

## 9. Constraints that apply (from the blueprint and this repo)

Never push to `master`; branch, pull request, merge by the owner. Plain-words errors, never a stack trace. No `eval` or `new Function` in stored tools.
Labels are the saved ids: never rename a part label in a live tool without adding the old one to `legacyLabels`. Every figure is computed in code.
Fictional sample data is labelled and never saved. This platform's own rules: additive database changes only, `Asset`/`Order`/payment tables and routes untouched,
type-check, lint and the unit and engine tests green before any PR.
