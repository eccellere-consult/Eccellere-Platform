# Configure-Your-Own Toolkit — Build Plan (v0.1)

Source spec: `Eccellere_Problem_to_Value_Delivery_System_SKILL.md` (v1.0).
Goal: when none of the 50+ marketplace kits fit, a client configures their own: industry + topic/problem + company context + uploads -> a live, staged form following the canonical TOC -> fill (self or AI-assisted) -> edit -> save -> submit -> print report.

## What already exists (reuse, don't rebuild)
| Need | Existing asset |
|---|---|
| Auth, roles, route guard | NextAuth + `middleware.ts` (`/dashboard/*` protected), `rbac.ts` |
| Client area | `/dashboard` (library, orders, assessments - assessments page is mock data) |
| AI | Groq `llama-3.3-70b-versatile`, `GROQ_API_KEY` set; pattern in `lib/wcDiagnostic/analyze.ts` = deterministic scoring + AI narrative + template fallback |
| Uploads + storage | `/api/upload`, `lib/storage.ts` (local/S3), rate limit |
| Text extraction | `officeparser` (docx/pptx/pdf), `mammoth` (docx) |
| Design system | Eccellere tokens, Cambria/Calibri palette in skill matches site |
| Gaps | No PDF lib, no zod, no Excel/OCR parser, no local DB |

## Design decision: one engine, five blueprints
The skill defines 5 deliverable types with different canonical TOCs. Build ONE schema-driven engine; each type is a `KitBlueprint` (TOC sections -> modules -> fields). Adding Guide / Learning Kit later is data, not new code.

```
KitBlueprint { type, toc[ {id, title, stage, fields[] } ] }
Field { id (stable), label, purpose, guidance, type, required, evidenceAllowed, calc? }
Response { kitId, fieldId, value, provenance, confidence, status, version }
```
Provenance labels per skill: Client-entered | AI-suggested | Source-extracted | Calculated | Client-confirmed | Not known | N/A.

## User flow (maps to skill steps 1-10)
1. **Start** `/toolkit/new` - industry (dropdown), topic (dropdown OR free-text "problems to address"), company context (text + uploads: financials, problem report).
2. **Route** - 2 plain-language questions (is the problem clear? is a solution agreed?) -> 2x2 recommendation with reason; client can override.
3. **Marketplace check** - if an approved standard kit covers the topic, suggest it first (honest "coverage" note); else continue to custom.
4. **Generate** - Form Architect builds the blueprint: canonical TOC (fixed) + topic-specific modules/questions (AI-generated, validated, template fallback).
5. **Workspace** `/dashboard/toolkits/[id]` - staged sidebar = TOC; per-field: fill / "AI draft" / edit / mark Not known; autosave; progress; provenance badges.
6. **Evidence** - uploads extracted to text, shown in preview, linked to fields; uploaded text treated as untrusted data (prompt-injection safe).
7. **Review & submit** - completeness/consistency checks, unresolved assumptions listed, designated approver confirms.
8. **Report** `/dashboard/toolkits/[id]/report` - exact canonical TOC, brand styling, print-optimised A4 -> browser "Save as PDF".

## Data model (additive only - see risk below)
`CustomKit` (owner, title, industry, topic, problemText, contextText, route, clarity flags, mode, status, blueprint JSON, version)
`KitResponse` (kit, fieldId, value, provenance, confidence, status, version, timestamps)
`KitEvidence` (kit, file key, name, type, extractedText, status)
`KitSubmission` (kit, snapshot JSON, approvedBy, submittedAt, version)

## API
`POST /api/toolkits` create + generate | `GET/PATCH /api/toolkits/[id]` | `PUT .../responses` autosave | `POST .../evidence` | `POST .../ai` (suggest field/section) | `POST .../submit`

## Phases
- **P1 (MVP):** wizard, route, blueprint (template + AI), workspace, autosave, uploads->text, AI draft per section, submit, printable report. Deliverable types: Diagnostic (+ Problem-Solving, Playbook if approved).
- **P2:** AI analysis (scoring, heatmap, findings w/ confidence), relationship reuse across kits.
- **P3:** Guide + Learning Kit blueprints, paid custom-form quote/entitlement (admin-set price), expert review.

## Risks (call out before building)
1. **Prod DB auto-sync:** every production start runs `prisma db push --accept-data-loss`. New tables are safe; any edit that renames/drops a column would DELETE live data. This feature stays strictly additive, and I will not touch existing models.
2. **No local DB:** persistence, autosave and submit cannot be tested end to end until a test database exists.
3. **AI quality/cost:** AI-generated question sets need schema validation, length caps, rate limits and a template fallback so the feature works if Groq is down.
4. **PDF on shared hosting:** headless-browser PDF (puppeteer) won't run on Hostinger shared; print-CSS + browser PDF needs no server support.
5. **Uploads:** PDF/DOCX/PPTX/CSV only in MVP; Excel and scanned-image OCR deferred (no libs today). Parsers `officeparser`/`pdfjs-dist` carry open advisories - cap file size, run extraction server-side with timeouts.
6. **Claims:** never fabricate benchmarks; "Benchmark not established" where none sourced (skill 6.4).

## Test plan
Unit: blueprint validator, routing logic (all 4 quadrants + overrides), provenance rules. Integration: create -> fill -> save -> resume -> submit against a test DB. E2E (Playwright): full flow with AI mocked + AI-down fallback. Report: TOC order exact per type, print CSS snapshot.
