---
name: eccellere-module-standard
description: >
  Apply before building or changing any client-facing tool, form or report on this platform. It fixes the one
  frame every tool opens in (the standard side menu always on the left, the tool on its right, a top-level phase
  guide inside it), the depth a tool must have (three tiers), AI assist kept simple, the kit every tool ships
  (guides, sample, one-click demo, Excel template, upload), the one PDF look (the Eccellere document standard,
  Marketplace reports included) and the registry whose test fails when a live tool breaks the standard. Use it with ui-ux-design-principles.md (how a
  screen should feel) and ai-first-platform-intelligence.md (what AI should do): this one says what a tool must
  contain and how it is laid out, so every tool looks and behaves like part of one product.
---

# Eccellere Module Standard

## Purpose

Tools were built one at a time and drifted: seven different ways to show progress, the same style constants
re-declared in about eight clients, eight separate PDF generators with their own colours, quick tools next to a
57-page kit. This standard is the bar. It comes from the three deepest, most consistent tools (AI Discovery,
Benefits Case Builder, Maturity Models) and from the Eccellere Universal Business Diagnostic and Transformation
Kit (the document standard). It is enforced by code, not by memory: `src/lib/standard/registry.ts` lists every
live tool and `src/__tests__/moduleStandard.test.ts` fails when one breaks it.

Scope: client-facing tools, forms and reports. Admin consoles (Plans, Agent Skills, Cost Master and so on) keep
the admin shell.

## Part 1. The frame and the phase guide (screens)

The owner's instruction (2026-11-02), in their words: every tool, when opened, should look the same, have the
same good level of depth, have AI assist or generation while keeping it simple, come with guides and instructions,
a standard demo and a standard PDF report, including all the reports in the Marketplace. It is **a visual
realignment of all tools first**.

- **One frame, always.** Every tool opens inside the standard app frame: **the standard side menu bar is always on
  the left, and the tool sits on its right**, so getting back is one click. Inside each tool a top-level phase
  guide shows where the person is (a strip of phases, as in AgileFlow, or numbered stages, as in AI Discovery).
  The phase guide is **one look in every tool**: a strip of numbered tabs (a number or a tick on each phase, the
  current one underlined in gold, unnumbered tabs for Home, an AI coach or Settings). Do not give a tool its own
  header, side menu or phase guide.
- **Same formatting on every page.** Spacing, colour and fonts are the same on every page of every tool: one type
  scale (Cormorant Garamond headings, DM Sans text), one spacing rhythm, the Eccellere colours with their roles (gold;
  deep gold for small text and buttons; ink; cream; brick for errors), and the same title block, buttons, cards and
  form fields, all from `src/components/standard` and `tokens.ts`. A page does not choose its own sizes, colours
  or margins.
  *(Status: the frame is built. A tool area gets it with a `layout.tsx` that renders `AppFrameLayout`
  (`src/components/standard/`), and its menu entry is drawn from the entitlement catalogue by `src/lib/standard/frame.ts`,
  so a new tool appears by itself; give it a short name in `SHORT_NAME` if its catalogue name is a sentence. The registry
  part `frame` and its test fail when a live tool area has no frame layout. The formatting standard is defined
  (`tokens.ts` type scale and spacing, `PageHeader`, `ModuleFrame`) and the one gold is applied everywhere. The page
  layout is applied tool by tool: AgileFlow, Risk Management, the Envision and Platform tools (Maturity Models, CEO
  Cockpit, Strategy Hub, Business Context, Diagnostics, AI Discovery, Design Studio, Value Scan) and the Engineer tools
  (Spend Analysis, the Cost Reduction Program, Cost Modelling, the Benefits Case Builder) are on it; the Execute and
  QS 9000 tools follow in the next pull requests. A tool is on it when its key is in `ON_FORMAT`
  in `registry.ts`, and `standardFormat.test.ts` counts, per folder, the page titles and style constants a tool draws for
  itself, so those counts can only go down. A tool with tabs inside a stage (the Maturity model page) draws them with
  `ScreenStrip`, under the phase strip, never as a second strip.)*
- A tool that works in stages uses the shared pieces in `src/components/standard/`: `StageTracker` (the one phase
  guide: numbered tabs directly under the top bar), `StageBanner` (the "Stage 3 of 6" tag, the name, one line of
  purpose) and `StageFooter` (Back, Next, a quiet Download). `ModuleFrame` wraps the tool's page inside the frame:
  tracker, `PageHeader` title block, content (the public site header and footer draw nothing inside the frame, so a
  page never draws its own header). **Never copy a tracker into a client.** The pure rules (done, current, to do, who
  may open what, the phone wording) are `trackerModel` in `src/lib/standard/stages.ts`, with tests.
- **The word is Stage.** "Stage 3 of 6". Not Step, Tab, Part or Phase. (A form may still have its own "steps"
  inside a stage; that is a different thing.)
- 3 to 9 stages. A tool with fewer is a quick check (one screen) and shows no tracker.
- People may jump to any stage; nothing is gated for its own sake. Gates are shown, not enforced: a stage can
  carry a done-of-total count (Six Sigma's navigator is the model).
- Stages that can be worked in any order say so themselves with `done` (AgileFlow: the vision exists, the backlog
  has stories). Stages that cannot be skipped use `furthest` (Benefits Case).
- Things that are not a step in the workflow (Home, an AI coach, Settings) are **places**: they are plain,
  unnumbered tabs at either end of the same strip (`leading` and `after` on `StageTracker`), never a second row.
- A tool with many screens (QS 9000: 24) keeps its numbered stages in the header and lists the screens of the
  current stage in a strip under the banner (arrives with the QS 9000 pull request). No left menu.
- Shared look: import `inp`, `lab`, `card`, `btnGold`, `btnOutline`, `sec` from `components/standard/tokens.ts`.
  Do not re-declare them in a client. Text colours that must be read use `text-eccellere-ink-mid` (not
  `ink-light`) and `text-eccellere-gold-deep` (not the bright gold); the bright gold is 2.9 to 1 on white.
- One gold (step 3a): a button is `bg-eccellere-gold-deep` with white writing (5.8 to 1; `btnPrimary` and `btnSecondary`, with
  `btnGold` and `btnOutline` as their older names); small gold writing, hover colours and focus rings are the deep gold too. The
  bright gold is only for what is seen: the current-tab underline, borders, progress bars and charts (never writing on a light page, even big writing: 2.9 to 1 is under the 3 to 1 big text needs),
  and writing or a button on a dark panel (bright gold fill with `text-eccellere-ink`). A deep-gold class must also be written out
  in `src/app/globals.css`, because a class the build does not generate silently does nothing. `src/__tests__/standardFormat.test.ts`
  fails on white writing on the bright gold and on small bright-gold writing, and counts own page titles and local copies of the
  shared styles per tool area against `standardFormat.baseline.json`: the counts may only go down.
- Accessibility: `aria-current="step"`, a labelled `nav`, a phone progress bar, visible focus, keyboard-operable.

## Part 2. Depth: three tiers

Every tool declares a tier in the registry.

| Tier | What it is | Minimum content | PDF |
|---|---|---|---|
| 1 Quick check | Operations Intake, quick diagnostics, Business Context | 7 to 12 questions, one score, three findings, the next three actions | 2-page Snapshot |
| 2 Studio | AI Discovery, Benefits Case, Design Studio, AgileFlow, Value Scan, Six Sigma, the Cost tools, survey tools | 4 to 9 numbered stages; each stage has a purpose line, inputs pre-filled from Business Context or an uploaded document, AI help the person can edit, a decision or a quantified result, a short quality checklist and an output | 10 to 30 pages |
| 3 Full kit | Universal Business Diagnostic, Maturity Models, QS 9000 | Sections with sub-sections that carry a value impact; 60 or more rated or measured items; a benchmark and KPI table; a maturity ladder; a root-cause view; initiatives (burning platform, value at stake, KPIs, owner, governance, actions); a 30-60-90-180 plan; governance; annexures | 30 to 60 pages |

A quick check stays quick: never turn a 3-minute diagnostic into a long form; offer "Go deeper" into the full kit.
Benchmarks and figures in any content come from Eccellere's own kits with their year and source; **never invent
one**. AI writes the words around a person's scores; it never writes a number, a score or a benchmark, and
AI-drafted text is labelled as such.

**AI on every free-text box.** A box where a person writes words (a problem statement, a benefit, a risk, a note)
gets the one shared control `<AiAssist fieldId="tool.field" value onChange stage />` from `src/components/ai`, placed
right after the box: "Draft with AI" when the box is empty, "Update with AI" when it holds words. It reads the
person's other answers on the same form (the `stage` the page passes) and their Business Context, shows in plain words
what it used, what it assumed and what it still needs, points out any figure the person never gave ("Not in your
material"), and changes nothing until the person clicks "Use this" (or "Replace my text with this" / "Add below mine"
when the box has words); "Undo" takes a used draft back. With too little to go on it asks for what is missing
instead of inventing. To assist a new box, add it to `src/lib/aiAssist/registry.ts`: its label, what it is for, which
other answers it may read (nothing outside that list is sent, and what is sent is masked), its shape and length, and a
written example shown in the sample and demo sessions, which call no AI. The rules are in code (`HARD_RULES` in
`src/lib/aiAssist/prompt.ts`), not in the admin-editable skill "AI field assist", so no edit can remove them: never
write a number, a score, a status or a decision; never invent a date, a cost, a name or a source; say what is
missing. A box that holds a number, a score, a choice or a decision is not assisted, and a tool never gets its own
"improve with AI" button. Without AI the box works as it always did and the control is greyed with a short reason.
`src/__tests__/aiCoverage.test.ts` counts the free-text boxes that still have no assist, per tool area, against
`aiCoverage.baseline.json`: the count can only go down. It counts a box drawn by a shared text-box component
(`TextArea`, `AreaField` and the others listed in `TEXT_BOX_COMPONENTS` in that test) as well as a literal
`<textarea`; a new text-box component is added to that list. If the page keeps part of its form as a list (chips), it
hands the form over as text through `src/lib/aiAssist/stages.ts`. A box of evidence, reasons or a record of what was
decided gets `improveOnly: true` in its registry entry: the button reads "Tidy up with AI", stays off while the box is
empty, and the AI may only tidy what the person wrote, never add a fact, source, reason or decision. A screen that
promises something is never sent to an AI (a private note, supplier names) keeps that promise: leave it out of `uses`.
A stage with several free-text boxes also gets ONE `<FillStage stageId="tool.stage">` at its top ("Fill the empty boxes
with AI"), listed in `STAGE_FILLS` in the registry: it drafts only the empty, non-`improveOnly` boxes in one call, and
the person ticks, edits and puts in the drafts (one combined update to the form, so nothing is lost; Undo puts them back).

## Part 3. The kit (every tool ships all of it)

A fictional **sample** (Anand), a **one-click demo** (`DemoBanner`: it says the data is fictional and offers the way
out), a guided **tour** with instructions (`GuidedTour`; tier 2 and 3), an **Excel template** with a How-to-fill sheet,
and **upload** of a filled template with a preview before anything is written. All of it in the standard Kit panel
(`components/kits/KitPanel`). A tool built from a spec also offers a **blank PDF kit** (print and fill by hand).
Nothing from the sample is saved, sent to AI, or mixed with the person's own data.

## Part 4. The document standard (every PDF)

One engine, `src/lib/standard/pdf` (`createDocument` in `document.ts`, the numbers in `style.ts`, a sample in `sample.ts`
that Admin downloads from Admin Tools › "Report style sample"). Do not write a new PDF generator: draw with the engine's
blocks, and add a block to the engine when a report needs one. The older generators move onto it one by one. The look is
the Eccellere Universal Business Diagnostic and Transformation Kit:

- **Page:** US Letter, margins 0.75 in at the sides and 1 in top and bottom (text width 7 in).
- **Type:** serif bold headings and sans-serif body, as the kit's Cambria and Calibri. Today the fonts built into every PDF
  reader (Times and Helvetica), so no font file can go missing on the server; their open look-alikes Caladea and Carlito
  can replace them in one line (`FONT` in `style.ts`). The rupee sign prints as "Rs." (`docText`), as those fonts lack it.
- **Palette:** navy 1B2A4A, gold C9A84C, blue 2563A8, teal 1A6B72, red B03A2E, green 1D6A3A, cream FDF8EC, pale blue
  EAF0FA, charcoal 2C2C2C; section accents steel 1A5276, orange B45309, crimson 7B1D2E, slate 2D4159, indigo 3B1F6B,
  forest 1A5C3A, bronze 7C4A00.
- **Furniture:** running header "ECCELLERE | title  CONFIDENTIAL" over a gold rule; footer "© year Eccellere Management
  Consulting · Bengaluru · www.eccellere.in  Page X of N".
- **Order:** cover, disclaimer, client-information page, contents with real page numbers, how to use, the sections,
  synthesis and commitments, annexures, back cover.
- **Blocks:** section banner (accent colour per section), sub-section bar with a value-impact tag, callouts (insight,
  why-this-cannot-wait, quick win), navy-header zebra tables, rated rows (1 to 5, the chosen value filled), checklists,
  KPI and benchmark tables with the gap, maturity matrix, root-cause tree, initiative card, scorecard and radar, roadmap.
- **Two modes from one definition:** blank (to fill by hand) and filled (the person's answers and computed scores).

## Part 5. Registry and guard

Every live tool has an entry in `src/lib/standard/registry.ts`: its tier, its stages, its kit, its PDF, and a
**waiver** (with a reason and the pull request that closes it) for anything missing. The test fails if a live tool
is missing, if a gap has no waiver, or if a waiver is kept for something that now exists. To add a tool: add the
catalogue entry (`src/lib/entitlements/catalogue.ts`), the registry entry, and either meet the standard or write the
waivers. A waiver is visible debt, not permission.

## Pre-ship checklist

1. Does it open inside the standard frame (side menu on the left, the tool on its right) and show its phase guide
   (or is it a one-screen quick check)? Is the numbered word "Stage"?
2. Do its spacing, colours, fonts, title block, buttons, cards and fields come from the shared tokens and components
   (no page-specific sizes, colours or margins)?
3. Is its tier declared, and does its content meet the tier?
4. Does it ship the sample, the one-click demo, the tour, the Excel template and the upload, in the Kit panel?
5. Is every PDF made by the document engine, with the standard furniture, in both modes?
6. Is it in the registry, and are the waivers true and dated?
7. Is any figure or benchmark from a named Eccellere source with its year, and is AI-drafted text labelled?
8. Does it pre-fill from Business Context, save without extra clicks, and read on a phone?
9. Does every free-text box have `<AiAssist>` (and its entry in the registry, with a written example), or is it a
   box that holds a number, a score, a choice or a decision? Does the box still work with the AI switched off?

## Files

`src/components/standard/` (tokens, StageTracker, StageBanner, StageFooter, GuidedTour, ModuleFrame) ·
`src/lib/standard/stages.ts` (the tracker model) · `src/lib/standard/registry.ts` (the ledger) ·
`src/components/ai/AiAssist.tsx` and `src/lib/aiAssist/` (the free-text assist: registry, rules, reply checks) ·
`src/__tests__/standardStages.test.ts`, `src/__tests__/moduleStandard.test.ts`, `src/__tests__/aiCoverage.test.ts`.
