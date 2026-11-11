# Eccellere Form Builder: architecture assessment and plan

Source of the requirement: `Eccellere_AI_Form_Builder_Skill.md` (v1.0). This note is the "assess before coding" step that skill asks for.

## 1. The answer

**Do not build a second form engine. The Tools marketplace already is one.** A "tool" is a form stored as data (sections, typed fields, tables, computed columns, rules, diagram, worked example). It is drafted by AI, scored against the Eccellere Standards of Depth and Quality, held for human review, then published to the marketplace. Clients fill it in with autosave, version checks and AI help, in the standard frame.

So the Form Builder is the **admin front door** onto that engine: three ways in (upload, describe, start from a template), a faithful structure reader, a template finder, and a source-coverage check. What it produces is an ordinary marketplace tool, so it publishes beside the frameworks and tools with no extra plumbing.

## 2. What exists and is reused

| Need in the skill | Already in the platform | Reused as is |
|---|---|---|
| Declarative, versioned form definition | `DeclarativeTool` (`strategyModels/declarative.ts`), `WsTool` table | yes |
| Safe rules and calculations (no eval) | rule vocabulary: calc, weighted, top, when, template, quadrant | yes |
| Autosave and concurrency, per person | `WsFillin` with `version` check | yes |
| AI draft with validated JSON | `tools/draft.ts`, `tools/complete.ts`, `tools/repair.ts` | yes (functions reused) |
| Quality bar | `tools/standards.ts` (score out of 100) and the quality gate | yes |
| Human review before clients see it | NEEDS_REVIEW, REVIEWED, PUBLISHED states, review panel | yes |
| AI provider and kill switch | `ai/gateway.ts`, admin AI settings | yes |
| Editable skill files | `tools/skill.ts` + Skill editor | extended with a third file |
| Upload reading | `tools/extract.ts` (plain text only) | extended |

## 3. What is new (this change)

1. **Structure-aware source reader** (`lib/forms/source.ts`). Excel, Word, PDF, PowerPoint, CSV, text and Markdown become a numbered list of source elements (heading, question, option, table header, table row, instruction, formula), each with its location (sheet and cell, paragraph, line). Hidden sheets and rows, formulas, merged cells and Excel drop-down lists are found and flagged. Formulas are read as text and never run.
2. **Template finder** (`lib/forms/templateSearch.ts`). A fast word-match shortlist from the whole catalogue, then the AI picks the best three with a reason. The AI can only choose from the shortlist, so it cannot invent a template. Works without AI (word match only).
3. **Form-builder skill** (`lib/forms/skill.ts`). The standards and references from the specification, in plain text the admin can edit: the six things every form explains, KISS and MECE question rules, field-type mapping, scales, honesty rules, how to treat an uploaded file.
4. **Builder** (`lib/forms/build.ts`). Prompt, upload or template to a draft tool, with a source map from the AI. Nothing is published; the draft goes to NEEDS_REVIEW.
5. **Source coverage** (`lib/forms/reconcile.ts`). Every source element is mapped to a field, a table column or an option, or listed as not covered. The AI may *propose* leaving something out; only a person confirms it. Counts and the not-covered list are saved with the tool.
6. **Admin screen** `/admin/forms` and API `/api/admin/forms/*`.

## 4. Honest limits of this version (decided, not forgotten)

- **Field types follow the existing engine**: short text, long text, choice, 1 to N rating, number, and tables with computed columns. Dates, yes/no, multi-select, ranking, matrix and file attachments are *approximated* (for example yes/no becomes a choice). Every approximation is listed on the review screen. Adding true new field types means changing the engine, the Excel template and the importer together; that is a separate, deliberate step.
- **Screenshots and photos are read by a vision AI** (PNG, JPG, WebP, GIF; 5 MB; Anthropic or OpenAI only, other providers are skipped). The model transcribes the picture to plain lines, which then become numbered source elements like any file, so the coverage check applies. A picture is labelled as AI-read and must be checked against the original. The picture is not stored. HEIC photos and scanned PDFs are not read (save as JPG, or screenshot the page). Click-to-choose, drag-and-drop and Ctrl+V paste are supported on `/admin/forms`.
- **Excel drop-down lists** are read from the file's XML; **macros and formulas are never run**.
- **Conditional logic** (show/hide, branching) is not in the engine today; the builder records such rules from a source as notes for the reviewer rather than pretending they work.
- **The uploaded file is not stored**; the numbered element list with locations is, as evidence.
- Not built here: multi-respondent forms, public distribution, signatures, benchmarking (skill Phase 5).
- **Reference kit read.** `Framework_Workspace_Builder.zip` was supplied after the first build and read (SKILL.md, chapters 08 and 11 in full, the content bar, AI rules and limits). The engine it describes is the one this build extends. Three gaps were closed because of it: a retry that lists the exact quality problems (as its drafting does), a zip-bomb guard on Excel/Word/PowerPoint uploads, and a notice that file text goes to the AI service; plus a source-text hash to warn about building the same form twice.
- **Not done from the kit's gate ladder:** the browser journeys at desktop and phone width with a fake AI server (G5/G6), a Node 22 build, and a pull request. Its "Done" list also asks for case scope, 'Use this' upstream links and the live preview pane in review; those belong to the existing Tools marketplace screens and were not changed.

## 5. Tests and gates

Unit tests with a pretend AI: source reading for Excel (including hidden sheets, formulas, drop-downs), Word, text and CSV; prompt injection inside a file; template finder with and without AI; malformed AI output; coverage counting; AI off. Then typecheck, lint, the full test run and a production build. Browser and real-model checks are listed as not done unless run.

## 6. Classification and depth (third request)

**Three asset types**, one per asset: Survey forms (collect data to analyse and report), Transformation toolkits (diagnose and solve), Daily tools & aids (do a job at the desk). Each also has one or more **areas** (Strategy, People, Process, Technology, Data, Finance, Customer & growth, Risk & governance) and zero or more **sectors** (the four marketplace sectors plus Financial Services, Healthcare & Life Sciences, Energy & Utilities, Technology & Services, Public Sector; none = every sector).

- **Stored in `provenance.classification`**, so no database migration. Trade-off: it cannot be filtered in SQL; the marketplace filters in the browser, which is fine at catalogue size. Move to columns if the catalogue grows into thousands.
- **Rules propose, a person approves.** `lib/tools/taxonomy.ts` scores name, description, section and the shape of the form. A guess with weak evidence is marked "Rules unsure". An optional AI pass (`/api/admin/forms/classify` POST) refines up to 25 unsure ones at a time and saves nothing. Approval is `/admin/forms/classify`; it changes metadata only, never content, status or review.
- **The marketplace** (`/tools`) filters by type, area and sector, using the approved classification or, until approved, the rules' suggestion.
- **Depth standard per type** (`lib/tools/depth.ts`): structural checks (survey: 3+ dimensions, 12+ scored questions, profile questions, scoring, bands, open comment; toolkit: ordered steps, evidence table, ranking, 2+ results, action plan, links; aid: inputs, working, 2+ results, assumptions; all: purpose, guide, worked example, diagram, next step). It measures structure, not truth.
- **Enrich** (`/api/admin/forms/enrich`) turns the gaps into an instruction for the existing "Modify with AI" step, which refuses a worse result and sends the tool back to review. Live tools must be withdrawn first; hand-built Strategy Hub tools are never changed.
- New builds carry a classification (the administrator's choice, else the AI's, else the rules') and list depth gaps as review warnings.

**Not verified:** a real vision call, a real classify/enrich AI call, browser journeys (drag-drop, paste, filters), and the classification of the live catalogue (the rules were tested on examples, not run over the production list).

## 7. Document layout: an online version that reads like the Word file (11 Nov 2026)

Owner's requirement: a toolkit made online must look like its offline document, with clear instructions, tables, tick boxes and selection options.

- **Reading kept in place.** A section may carry `reading` blocks (sub-heading, paragraph, list, reference table). Each sits before a named part, at the end of its step, or as its own panel above or below the step (a part of the document with nothing to fill in). Reading is never an answer and is never saved.
- **Tables stay tables.** A document table with blank columns becomes one table with `grid: true`: a row for each printed row, printed columns shown as text (a computed column with the new `lookup` rule), blank columns as inputs. A table of blank rows stays a table of blank rows under the same headings. On a phone a grid stacks into labelled rows; in print it is a grid.
- **Tick boxes and choices.** `display` on a field: `tick` (one tick box, saved as Yes), `radio` (a choice with every option visible), `multi` (tick all that apply; a text answer, the ticked options joined by "; "). `display` on a select column: `tick` or `radio`. The saved shape and the Excel template are unchanged, so nothing already saved is affected.
- **Maturity models.** A table with three to seven level columns ("Level 1", "Stage 2", or names such as Initial, Developing, Defined, Leading), each cell describing that level for its row, is kept whole: a select column with `display: 'levels'` holds the levels as options and every description. The reader clicks a description to choose that level for the row (again to clear). The `levelavg` rule shows the average level chosen, counting the first level as 1; no bands or labels are added.
- **Nothing added.** A form built from a document (`layout: 'document'`) gets no "About this form" step and no added action plan. Forms built from sheets are unchanged.
- **Word reader.** Heading depth, list items, Word's own tick-box controls, typed tick boxes and round buttons, blank table rows and empty cells are now read. The two highest heading depths open steps; deeper headings are sub-headings.
- **Review.** The review panel lists every document item beside where it is in the form.
- **Print.** Written answers print in full as text; "Print a blank copy" prints the form empty without touching the saved answers.

Limits, decided: a printed column is not in the Excel template (the row names and the fill-in columns are). Cells already filled in inside a fill-in column are left blank and reported. Nested lists are read as one item. Pictures, text boxes and merged-cell layouts in a Word file are not reproduced. PDF sources are still read as lines of text. Show/hide rules and date pickers are still not in the engine.

**Verified:** unit tests; a sample Word file read end to end; the page filled in with Chromium at desktop and phone width and printed to PDF, through a temporary preview page with the save API faked. **Not verified:** a real toolkit file from the marketplace, the real database and login, the real host build, Safari, and an AI "improve" run on a document-layout draft.

## 8. The Word document itself as the page (11 Nov 2026, replaces the reader of section 7 for Word files)

The first real toolkit (Startup Founder Playbook, 51 pages, 76 tables) showed that rebuilding a designed document from its lines fails: advice tables became answer boxes, banners became questions, and the look was lost. So a Word file is now KEPT as a document and drawn as it is.

- **Reader** (`lib/forms/docx.ts`): reads the file's own XML into plain data (`strategyModels/document.ts`): paragraphs and tables in order, with bold, italic, colour, size, heading face, alignment, shading, borders, padding, merged cells, bullets and numbers, and page starts. No markup from the file is stored or inserted; the page builds its own elements, and a stored document is cleaned (known shapes, valid colours, bounded numbers) every time it is loaded.
- **Blanks only** (`lib/forms/docForm.ts`): a place becomes an input only when the document shows it as a blank: a cell or line of underscores; in a table with a heading row, a column whose cells are all empty; a cell printed "1 2 3 4 5" (a rating); a cell holding only a tick box. A heading "RAG" over an empty column gives Red, Amber, Green. Nothing is inferred from wording, so advice is never turned into a question.
- **The form behind it** is unchanged in kind (fields and tables with fixed rows), so autosave, AI help, the Excel template, results and the analysis work as before. Each blank in the document is bound to a field or to one cell of a table; a blank bound to a part that does not exist fails the quality gate.
- **Page** (`app/tools/[slug]/DocumentView.tsx`): the document on a sheet, in the document's own colours and in Calibri and Cambria (with close faces where a computer lacks them). A "Draft this part with AI" button stands above each part of the form.
- **AI** never receives the document; "Modify with AI" and an AI build keep it when every blank still has its part.
- **Fallbacks**: text, PDF, several files at once, and the Form Builder's two-step upload (which sends the item list back from the browser) still use the step-by-step reader of section 7.

Not carried over from a Word file, and reported when present: page headers and footers, pictures, text boxes, footnotes, tables inside table cells (kept as lines of text). A document with nothing to fill in gets one box for the reader's own notes, and the review screen says so.

Colours: the page chrome keeps the Eccellere+ colours; inside the sheet the document's own colours are shown, because they are the document.

**Verified:** unit tests; the Founder Playbook file read end to end (6 cover blanks, 2 rating tables, Annexure B and C; nothing else bound), drawn in Chromium at desktop and phone width through a temporary preview page with the save API faked, and compared by eye with the Word pages. **Not verified:** the real database, login and host build; Safari; print on paper; a real AI call; any other toolkit file.
