---
name: eccellere-product-standard
description: >
  Apply before designing, building, changing or reviewing any tool, page, form or report in any of the owner's
  products (eccellere.in, eccellere.co.in, futureskilz.in, EC and any new one). It fixes ONE frame every tool opens
  in (a standard side menu always on the left, the tool on its right, one phase guide inside it), ONE formatting
  standard (the same spacing, colour and fonts on every page), the same good depth, AI assist kept simple, guides and
  instructions, a standard demo kit, and ONE standard PDF report, including every report sold or listed in a
  marketplace. Use it first when asked to "make the tools consistent", "realign", "standardise", "add a tool",
  "add a report or PDF", or "make it look like the others", and on every new tool before writing code.
---

# Product Standard: one frame, one look, one depth, one kit, one report

## 0. The owner's standing instruction

> Every tool, when opened, should look the same, have the same good level of depth, have AI assist or generation
> while keeping it simple (a principle), guides and instructions, a standard demo and a standard PDF report,
> including all the reports in the marketplace. It is a visual realignment of all tools first: a standard side menu
> bar is always there, each tool sits on the right of it (so it is easy to get back), and inside each tool there is
> a top-level phase guide. The formatting of each page should also be consistent: the same spacing, colour and fonts.

Treat that as a rule, not a suggestion. Where a product does not yet meet it, say so in a written, dated list of
gaps (section 9) and close the gaps one reviewable change at a time. Do not build a new tool that breaks it.

## 1. How to work

1. **Read the product's profile (section 10)**: its brand tokens, its menu source, its report look. If there is none,
   write one first (it takes minutes and everything below reads from it).
2. **Audit before you build.** List every tool and screen, and for each: how it is framed (own header? own menu?),
   how it shows progress, its depth tier, whether it has a guide, a sample, a demo, an Excel template, AI assist, a PDF.
   Put the result in the registry (section 9). Do not guess: read the code or open the page.
3. **Order of work (each step its own change, each reviewed by the owner before the next):**
   frame, then the phase guide and the formatting, then guides, demo and AI assist, then the reports, then depth.
   The owner's first priority is the visual realignment of every tool, so the frame comes before anything else.
4. **No big bang.** A tool keeps working exactly as it did until its own change lands. Move tools one area at a time.
5. **Plan first, in plain language,** for anything that touches every tool. Show a picture of the screen (a quick
   mock-up) when the change is visual, and decide with the owner, not for them.
6. **Say what you could not verify** (the real host build, a real phone, the real AI): never claim it.

## 2. The frame (every tool, always)

- **A standard side menu bar is always on the left; the tool opens on its right.** Getting back to the menu or to
  a sibling tool is one click. The tool never opens in a window of its own with its own header, its own menu or no
  menu at all.
- **One menu, one source.** The menu is drawn from a single catalogue of menus, sub-menus and tools (the same one that
  drives the home page and the plans), so a new tool appears in it by itself and a test can fail when one is missing.
  It shows the plan's padlocks and "soon" tags exactly as the home page does, and the open tool's group is
  highlighted and opened to list its sibling tools.
- **A slim top bar** inside the content area, the same height on every page: a breadcrumb that is also the way back
  ("Execute › Transformation Space › AgileFlow Lite", the first parts are links), the plan, the person's name.
- **Phones:** the side menu becomes a drawer behind a menu button; the tool is never hidden by it.
- **Print:** the menu and top bar do not print.
- **Public pages** (marketing, sign-in) keep their own public header; a signed-out visitor on a page that is also
  public keeps it too. The frame is for signed-in work.
- **Accessibility:** a labelled navigation, a skip link, visible focus, Esc closes the drawer, keyboard operable.
- Never copy a header, menu or footer into a tool. If a tool needs something the frame does not give, change the frame.

## 3. The phase guide (one look in every tool)

- A strip directly under the top bar, **the same in every tool**: numbered tabs. Each phase is a tab with a number;
  a finished phase shows a tick instead; the current one is underlined in the product's accent colour. Tabs that are
  not phases (Home, an AI coach, Settings) are plain, unnumbered tabs at the start or end of the same strip.
- Two kinds of tool use the same strip. A tool **worked in order** (a discovery with stages): ticks follow position.
  A tool whose phases can be visited **in any order** (a workspace): a phase is ticked once it has something in it.
  Nothing is gated for its own sake: the person can open any phase (a tool that must not let them skip ahead says so).
- A tool with many screens keeps its few phases in the strip and lists the screens of the current phase in a second,
  smaller strip under it. Never a left menu of its own.
- The word for a numbered phase is **Stage** ("Stage 3 of 6"); it is the same word everywhere.
- **Phones:** the strip becomes "Stage 3 of 6 — Stories" over a thin progress bar with a "Go to" list.
- A one-screen quick check has no phase guide.

## 4. Formatting (the same on every page)

One type scale, one spacing rhythm, one colour palette, one title block, one set of controls, **defined once in a
tokens file** and used everywhere. A page does not choose its own sizes, colours or margins.

- **Fonts:** one display face for headings and one text face for everything else (section 10 names them). Sizes come
  from a short scale (page title, section heading, card heading, body, small, label); no one-off sizes.
- **Spacing:** one page width, one side padding, one top and bottom padding, one gap between sections, one card
  padding, one field and button size. Corners and borders are the same everywhere.
- **Colour:** a small palette with named roles (accent, accent for small text and buttons, ink, cream, border, error,
  success). Text that must be read meets WCAG AA (4.5 to 1): check the accent on white; if it fails, use the deeper
  accent for small text and for buttons that carry white text. Never use a decorative grey for information.
- **Title block:** every page opens the same way: a small kicker, the page title, one sentence of purpose.
- **Controls:** primary and secondary buttons, text fields, selects, cards, tables, status chips, notices, empty
  states and spinners come from shared components, never re-typed per page.
- **Plain language** for labels, errors and empty states: a busy founder, not an engineer, must understand every one.
- **Visualise for decisions:** colour-coded status, ranked bars, progress, grouped layouts wherever someone compares,
  ranks or tracks; not raw tables or bare numbers. A single headline figure stays a plain figure.

## 5. Depth (three tiers; every tool declares one)

| Tier | What it is | Minimum content | Report |
|---|---|---|---|
| 1 Quick check | a short tool (about 3 minutes) | 7 to 12 questions, one score, three findings, the next three actions | 2-page snapshot |
| 2 Studio | a guided workflow | 4 to 9 numbered stages; each with a purpose line, inputs pre-filled from what is already known about the person's business or from an uploaded document, AI help they can edit, a decision or a quantified result, a short quality checklist and an output | 10 to 30 pages |
| 3 Full kit | a diagnostic or programme kit | sections with sub-sections that carry a value impact; 60 or more rated or measured items; a benchmark and KPI table; a maturity ladder; a root-cause view; initiatives (burning platform, value at stake, KPIs, owner, governance, actions); a 30-60-90-180-day plan; governance; annexures | 30 to 60 pages |

A quick check stays quick; offer "Go deeper" into the full kit. **Never invent a benchmark or a figure**: every one
comes from the owner's own material with its source and year. Content is drafted from the owner's kits and reviewed
by the owner before it is published.

## 6. AI assist, kept simple

- Where it genuinely helps, a tool offers AI to **assist** (sharpen, explain, suggest, check) or to **generate a first
  draft** the person can edit. It is always a draft: never saved or acted on without the person's click.
- **Everything works with AI off.** AI is an accelerator, not a dependency; there is a plain fallback.
- **AI writes words and drafts, never numbers, scores or benchmarks.** Calculations are done by code; AI explains them.
- Pre-fill from what the platform already knows (the business profile, earlier reports) so nobody types the same
  thing twice; say where a pre-filled value came from.
- Text drafted by AI is labelled as such, in the screen and in the report.
- Confidential text is masked before it is sent to an AI provider, and the person sees what will be sent.
- Keep it simple: one clear button ("Improve with AI"), a short result, an obvious way to accept or discard it.

## 7. Guides and the standard demo kit (every tool ships all of it)

- **Instructions:** a short guided tour, in the same component everywhere: numbered steps, each saying what to do,
  with a button that takes the person there. Tier 2 and 3 tools always have one.
- **Sample:** a fictional company's data, clearly marked "sample, not real", never saved, never mixed with the
  person's own data, never sent to AI.
- **One-click demo:** the whole tool on the sample in one click, with a banner that says so and the way out.
- **Excel template** with a "How to fill" sheet, built from the same field list the importer reads so they cannot drift,
  and **upload** of a filled template with a preview of what will be added before anything is written.
- **A blank report** (print and fill by hand) for any tool that produces a report.
- All of it in one standard Kit panel, so every tool offers it in the same place and words.

## 8. The standard report (PDF), one look, one engine

Every report, **including every report sold or listed in a marketplace**, comes from one document engine in the look of
the owner's Universal Business Diagnostic and Transformation Kit. Never write a second generator.

- **Page:** US Letter (one constant, change to A4 only if the owner says), margins 0.75 in at the sides, 1 in top and bottom.
- **Type:** Cambria-style bold headings and Calibri-style body. Microsoft's fonts cannot be shipped on a server: embed
  their open, metric-compatible look-alikes **Caladea and Carlito** (SIL Open Font Licence), keeping the font files and
  licences in the repository, and check the rupee sign draws.
- **Palette:** navy 1B2A4A, gold C9A84C, blue 2563A8, teal 1A6B72, red B03A2E, green 1D6A3A, cream FDF8EC, pale blue
  EAF0FA, charcoal 2C2C2C; section accents steel 1A5276, orange B45309, crimson 7B1D2E, slate 2D4159, indigo 3B1F6B,
  forest 1A5C3A, bronze 7C4A00.
- **Furniture:** running header "BRAND | title  CONFIDENTIAL" over a gold rule; footer "(c) year company, city,
  website  Page X of N".
- **Order:** cover, disclaimer, client-information page, contents with real page numbers, how to use, the sections,
  synthesis and commitments, annexures, back cover.
- **Blocks:** section banner (an accent colour per section), sub-section bar with a value-impact tag, callouts (insight,
  why-this-cannot-wait, quick win), navy-header zebra tables, rated rows (1 to 5 with the chosen value filled),
  checklists, KPI and benchmark tables with the gap, maturity matrix, root-cause tree, initiative card
  (burning platform, value at stake, KPIs, owner, governance, actions), scorecard and radar, roadmap.
- **Two modes from one definition:** blank (to fill by hand) and filled (the person's answers and computed scores).
- A tool is best defined as **data** (sections, questions, scale, benchmarks, initiatives) so one definition produces
  the screens, the Excel template, the sample, the tour and both reports, and they cannot drift.
- Test the engine: page count, header and footer text, contents page numbers, fonts embedded, no overflow; and look at
  the pages next to the owner's sample.

## 9. The registry and the guard (how the standard stays true)

- Keep **one ledger** of every live tool: its tier, its phases, whether it is in the frame, its formatting, its kit
  (tour, sample, demo, template, upload), its AI assist and its report. Anything missing carries a **written, dated
  waiver** naming the change that will close it.
- A **test fails** if a live tool is missing from the ledger, if a gap has no waiver, or if a waiver outlives its gap.
  So the list of what is left can only shrink and a new tool cannot arrive without meeting the standard.
- A new tool is added to the catalogue, the ledger and the frame in the same change that creates it.

## 10. Product profile (fill in once per product)

| | eccellere.in (the platform) | eccellere.co.in | futureskilz.in | EC (eccare.in) | new product |
|---|---|---|---|---|---|
| Menu source (the catalogue) | the entitlement catalogue | | | | |
| Display font / text font | Cormorant Garamond / DM Sans | | | | |
| Accent, accent for small text | gold B8913A, deep gold 7F611A | | | | |
| Ink, cream, border | 0E0E0D, FAF8F4, E5E2DB | | | | |
| Error | brick B3392B | | | | |
| Report look | the Universal Diagnostic Kit (section 8) | | | | |
| Product-specific needs | | | | e.g. larger type and touch targets for its users | |

The **structure** (frame, phase guide, formatting discipline, depth, AI assist, guides, demo, report, ledger) is the
same in every product. Only the tokens in this table differ. If a product's users need larger type or touch targets,
change the tokens, not the structure.

## 11. Pre-ship checklist

1. Does the tool open inside the standard frame (side menu left, tool right, top bar and way back)?
2. Does it show the one phase guide (or is it a one-screen quick check)? Is the numbered word "Stage"?
3. Are spacing, colours, fonts, title block, buttons, cards and fields all from the shared tokens and components?
4. Is its tier declared, and does the content meet it? Is every figure from a named source with its year?
5. Is AI assist offered where it helps, editable, labelled, working with AI off, never writing a number?
6. Does it have a guided tour, a sample, a one-click demo, an Excel template, an upload and a blank report?
7. Is every report made by the one engine, blank and filled, with the standard furniture?
8. Is it in the ledger, with true and dated waivers?
9. Does it pre-fill from what is known, save without extra clicks, and read on a phone?
10. Is the accent text and every small label at least 4.5 to 1 on its background?

## 12. Verification

Open every tool in a real browser at desktop, tablet and phone widths with accounts on every plan; check the frame is
present once, the right menu group is highlighted, the way back works, the phase strip is identical across tools, nothing
scrolls sideways, printing hides the frame, and run an accessibility scan (WCAG A and AA) on the frame, the strip and
the shared controls. Open each report and compare it with the sample. Keep the data clean: a demo writes nothing.
State plainly what was not verified (the real host build, a real phone, the real AI).

## 13. Anti-patterns (each one is a finding)

- A tool with its own header, its own side menu, or no menu.
- A second phase-guide look ("this tool uses tabs, that one uses a row of squares").
- A page with its own font sizes, colours, margins or buttons.
- Copying a tracker, a header or style constants into a tool.
- A second PDF generator, or a report that looks different from the standard.
- A demo that writes to the database, or a sample mixed with real data.
- AI that writes a number, a score or a benchmark; AI text that is not labelled; a tool that needs AI to work.
- An invented benchmark or an unsourced figure.
- A gold button with white text where the contrast is under 4.5 to 1.
- A tool that is live but not in the ledger.

## Appendix: the reference implementation on eccellere.in (a Next.js app), as an example only

Other products implement the same ideas with their own stack. On eccellere.in (the platform):

- Shared pieces: `src/components/standard/` (tokens, the phase strip `StageTracker`, `StageBanner`, `StageFooter`,
  `GuidedTour`, `ModuleFrame`, and the app frame with its side menu and top bar), `src/components/kits/` (the Kit
  panel and the demo banner).
- The tracker's rules are pure and tested: `src/lib/standard/stages.ts`. The ledger is `src/lib/standard/registry.ts`
  and its guard test is `src/__tests__/moduleStandard.test.ts`. The menu is drawn from the entitlement catalogue
  `src/lib/entitlements/catalogue.ts`.
- The repository's `CLAUDE.md` carries the standing instruction so every session applies it, and
  `src/skills/eccellere-module-standard.md` is the repository-specific version of this skill.
