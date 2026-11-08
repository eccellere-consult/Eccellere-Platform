---
name: eccellere-plus-standard
description: >
  Apply before designing, building, changing or reviewing any page, tool, agent, form or report on eccellere.co.in
  (Eccellere+). The site follows the owner's Eccellere Product Standard and Module Standard from eccellere.in (one frame,
  one look, one depth, AI assist kept simple, guides, a standard demo and sample, one standard PDF report), and differs
  from eccellere.in in one way: Eccellere+ leans more black and gold. Use it first on every new agent, tool, page or report,
  and when asked to "make it consistent", "add a demo", "add a sample", "add a report" or "match the other site".
---

# Eccellere+ (eccellere.co.in) standard

## 1. The owner's instruction (2026-11-08)

> Follow the same standards as eccellere.in on eccellere.co.in: colours, guides, PDF formats, a demo always, AI as
> first assist and so on, with a little more black and gold on eccellere.co.in so that Eccellere+ is visibly different.
> Apply it to the agents we are building too: demo, sample formats, demo examples.

Treat this as a rule. Where the site does not yet meet it, record the gap in section 6 with a date and close it one
reviewable change at a time. Do not build a new page, tool or agent that breaks it.

## 2. Read in this order

1. This file (what is specific to Eccellere+).
2. `product-standard.md` in this folder: the product-neutral standard (frame, phase guide, formatting, depth tiers,
   AI assist, guides and demo kit, the one PDF report, the ledger). It is a verbatim copy of the owner's skill.
3. `module-standard.md` in this folder: the eccellere.in version, with its code names. **Its file paths
   (`src/lib/standard/registry.ts`, `StageTracker`, `KitPanel`, `AiAssist` and so on) belong to eccellere.in and do not
   exist in this repository yet.** Treat them as the target design, not as code you can import. Never claim a shared
   component exists here without opening the file.

If this file and a copy disagree, this file wins for eccellere.co.in; tell the owner about the difference.

## 3. Eccellere+ profile (section 10 of the product standard, filled in)

| | eccellere.co.in (Eccellere+) |
|---|---|
| Menu source | Public: `src/components/layout/Header.tsx`. Signed-in tools: `src/components/standard/ToolFrame.tsx`. Admin: `src/lib/admin/menu.ts` with `AdminFrame.tsx`. |
| Display font / text font | Cormorant Garamond (`--font-display`) / DM Sans (`--font-body`), both set in `src/app/layout.tsx` and `src/app/globals.css` |
| Accent, accent for small text | gold B8913A (`eccellere-gold`), deep gold 7F611A (`gold-deep`) |
| Ink, cream, border | 0E0E0D (`eccellere-ink`), FAF8F4 (`eccellere-cream`), E5E2DB |
| On dark panels | gold-light D4AE6A (`gold-light`) for gold writing, cream for body text |
| Error | brick B3392B |
| Report look | The one standard report engine (section 8 of the product standard): US Letter, Caladea/Carlito, navy/gold palette, standard header and footer. Eccellere+ changes only the words: running header "ECCELLERE+ | title  CONFIDENTIAL", footer "www.eccellere.co.in". **Open decision for the owner: whether Eccellere+ reports get a black-and-gold cover.** Until the owner decides, use the standard cover. |
| Product-specific needs | Aspiring and growing organisations (not only MSMEs); MSME depth lives in the MSME hub and the pricing plans |

Never add a colour that is not in this table. Use the tokens already in `src/app/globals.css`.

## 4. "More black and gold": how Eccellere+ differs from eccellere.in

The structure is identical to eccellere.in; only the weight of colour changes.

- **Dark first for the frame:** the header, hero bands, side menus, tool title bands, the footer and report covers sit on
  ink (0E0E0D). eccellere.in leans cream; Eccellere+ leans ink.
- **Gold as the signature:** thin gold rules, the gold "+" in the wordmark (`ECCELLERĒ+`), numbered Stage markers,
  progress bars, chart accents and the current-tab underline. Bright gold B8913A is for what is seen, never for small
  writing on a light page (2.9 to 1 on white).
- **Reading surfaces stay light:** forms, tables and long text sit on cream or white so they remain easy to read.
  Do not put long text on black.
- **Contrast rules (WCAG AA, 4.5 to 1):** small gold writing on light is deep gold 7F611A; gold writing on dark is
  gold-light D4AE6A or bright gold with ink text; a gold button carries ink text on dark panels and white text only when
  it is deep gold.
- **Same type scale, spacing and components as eccellere.in.** Differentiation is colour weight, not new sizes, new
  fonts or new layouts.
- **Wordmark and copy:** "Eccellere+", never "Eccellere" alone as the product name on this site.

## 5. What every agent and tool on this site ships

Each agent in the Agent Marketplace (`src/lib/agents/`) and each tool it links to must meet this list. It is the
product standard's section 7 (guides and the standard demo kit) applied to agents.

1. **Tier declared** (1 Quick check, 2 Studio, 3 Full kit). The four pilots are Tier 2 Studio.
2. **An agent page** (`/agents/<name>`): what it does, the SIPOC, the input data it needs, how to provide and update
   data, the outputs and their form (results, PDF report, dashboard planned), the method and its limits.
3. **A fictional sample** in the same format on every agent: one sentence scenario, the sample inputs (fields and
   tables), the results computed by the tool's own formulas, and the working figures. Clearly marked
   "Sample, not real". Never saved, never mixed with the person's own data, never sent to AI.
4. **A one-click demo**: the whole agent run on the sample, with a banner that says so and the way out. Works without an
   account and without AI, and writes nothing to the database.
5. **A guided tour**: short numbered steps (each says what to do and links to where), the same component everywhere.
6. **Excel template** (blank and sample, with a how-to-fill sheet) and **upload** of a filled template with a preview
   before anything is written.
7. **A blank report** to print and fill by hand, and the **filled report** (PDF) from the one engine.
8. **AI assist kept simple:** an optional "Improve with AI" on free-text boxes only; always a draft, labelled, editable,
   works with AI off, never writes a number, a score or a benchmark.
9. **Numbers come from code.** A formula is written once, tested against an independently worked answer, and shown in
   "Method and limits". Never invent a benchmark; every figure has a source and a year.
10. **In the ledger** (section 6), with true and dated waivers.

The sample format is fixed so every agent looks alike: a pilot's `sample` block in its definition (scenario, values,
tables) is the single source for the demo, the sample Excel and the sample results. Add or change the sample there and
nowhere else.

## 6. Gap ledger for eccellere.co.in (as of 2026-11-08; verify before relying on it)

Written from reading the repository, not from opening every page in a browser.

| Area | State | Closing change |
|---|---|---|
| Colour and font tokens | Present in `src/app/globals.css` (gold, deep gold, ink, cream, Cormorant, DM Sans) | none |
| Tool frame | `ToolFrame.tsx` and `AdminFrame.tsx` exist | audit every tool area uses them |
| Phase guide ("Stage" strip) | No shared component in this repo | build once, then apply per tool |
| Shared registry and guard test | Does not exist here | add registry and a guard test |
| Tokens file for type scale and spacing | Not found | define once, then migrate pages |
| "More black and gold" pass on public pages | Partly (dark hero bands exist on some pages); not audited | audit and apply page by page |
| Agent pages with SIPOC, inputs, outputs | Built (PR 39) | none |
| Agent sample and demo kit on the agent page | Added in the agents PR that follows this one | in progress |
| Guided tour component | Not found | build once, reuse on agents and tools |
| Excel template, upload, autosave, Print/PDF in the tool workspace | Present in the tool workspace (seen in code; not re-verified in a browser) | verify, then list under the ledger |
| One PDF report engine with the standard furniture | Not verified in this repo | audit the report code, then migrate |
| AI assist control on free-text boxes | Not found as a shared control | build once |

State plainly in every hand-over what was not verified (a real browser, a real phone, the real host build, the real AI).

## 7. Working rules for this repository

- Audit before you build; frame first, then guides, demo and AI assist, then reports, then depth.
- One reviewable change at a time; a tool keeps working until its own change lands.
- Plain language for every label, error and empty state: a busy founder, not an engineer, must understand it.
- Follow the repository's `CLAUDE.md` for the release rules (feature branch, one combined pull request, database
  changes on their own, never push to master).

## 8. Pre-ship checklist

The product standard's section 11, plus:

1. Is the page, tool or agent recognisably Eccellere+ (dark frame, gold signature) and still readable (light reading surface)?
2. Is every small gold text deep gold on light, and every gold on dark gold-light?
3. Does the agent have the sample, one-click demo, tour, Excel template, upload and blank report in the standard order?
4. Is the sample in the tool definition the only source of the demo, the sample Excel and the sample results?
5. Is the wordmark "Eccellere+" and the footer "www.eccellere.co.in" on anything printed or exported?
