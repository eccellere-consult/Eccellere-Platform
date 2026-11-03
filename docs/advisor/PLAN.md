# Eccellere Advisor: plan and status

Source files: `skills/eccellere_agent_skill_lite.md` (building now) and `skills/eccellere_agent_skill_enterprise.md` (parked, see section 4).

## 1. Answer first

The Advisor in the client dashboard (`/dashboard/advisor`) is now a real AI advisor built to the **Lite** skill. It replaces the canned replies and the hard-coded "Rahul". It answers from Eccellere's own published content, never names a company or a person, and says so when it has no evidence. The Google Drive library and vector search are the next Lite step; the **Enterprise** specification is parked on the roadmap below.

## 2. Built now (Lite release 1)

| Lite skill section | What is in place |
|---|---|
| 2 Principles | One system prompt carries them: grounded answers with `[S1]` citations, fact / general knowledge / assumption / recommendation kept apart, no invented sources or numbers, no private reasoning, no claim of completed actions |
| 4 Knowledge sources | Published tools, services and marketplace resources (no authors, no client names). Searched by keyword, titles weighted |
| 6 Retrieval | Keyword retrieval, top 5, duplicates impossible by id; passages cut to 700 characters; nothing matched means the Advisor says so |
| 7 Bounded tools | No free tool loop yet; one retrieval and one model call per question; per-mode token and time limits |
| 8-9 Advisory workflow | Three modes chosen automatically (quick, standard, deep) and on request ("in depth"). Deep answers follow: problem and outcome, issue tree / 5 Whys, evidence, options compared, recommendation, assumptions and data needed, next 30 days |
| 10 Identity protection | Direct "who is the client" questions refused before any model call; every answer scanned before it is returned (e-mails, phone numbers, outside links, company names with legal suffixes, plus an administrator's protected-name list); nothing is streamed; no author or client names enter the model |
| 11 Client context | Business type is read on the server and sent; the company name is not. The last 8 turns of the chat are sent for continuity; nothing is stored on the server yet |
| 13 Injection defence | Sources and chat are labelled untrusted data; instruction-like lines are stripped from sources |
| 14 Admin controls | Kill switch and protected-name list at `/api/admin/advisor` (and `ADVISOR_DISABLED=1` in the environment). Audit record without the names. No admin screen yet |
| 15 Cost control | Per-user rate limit (20 questions per 5 minutes), token and time limit per mode, 2,000-character questions |
| 16 Tests | `src/__tests__/advisor.test.ts`: identity refusal, redaction, citations, injection, kill switch, no-AI fallback, modes |

## 3. Next Lite steps (needs your input)

1. **Google Drive library.** Needs a Google service account (or OAuth) and the folders you approve. Then: ingestion with identity anonymisation, a quarantine list for uncertain files, incremental sync, revocation. Without credentials this cannot be built or tested.
2. **Vector search and reranking** (the hybrid retrieval of Lite section 6). Needs a place to store embeddings (a new table or a vector service) and an embeddings provider.
3. **Admin screen** for the kill switch, protected names, retrieval gaps and cost.
4. **Saved conversations** with review and delete by the client.
5. **Tool use:** spreadsheet analysis, calculation, assessment recommendation, launching a platform tool.
6. **Release tests 8, 11, 12, 13** from the skill that need Drive and multiple tenants.

## 4. Parked: Enterprise roadmap (`skills/eccellere_agent_skill_enterprise.md`)

Not started. Revisit after the Lite steps above are live and measured.

| Release | Scope |
|---|---|
| 1 Secure enterprise RAG foundation | Shared multi-site service, Drive connectors, hybrid retrieval and reranking, structured extraction, provenance and safe citations, identity protection pipeline, tenant and document permissions, observability |
| 2 ReAct advisory core | Query planning, typed tool registry, bounded ReAct loop, spreadsheet and document analysis, structured diagnosis, action plans, model and cost routing |
| 3 Specialists and advanced reasoning | Versioned specialist modules (strategy, finance, operations, quality, supply chain, sales, HR, digital, risk, MSME), alternative exploration, knowledge graph, contradiction handling, evaluation harness |
| 4 Platform execution | Assessments, maturity models, FMEA and quality workflows, trackers, learning recommendations, service escalation, confirmed side effects |
| 5 Continuous intelligence | Knowledge-gap analytics, freshness scoring, feedback loops, client progress context, proactive recommendations, capacity and cost optimisation |

Targets in the Enterprise skill (99.9% availability, p95 first token under 3 seconds, zero identity or tenant leakage) are proposals to be measured, not claims.

## 5. Honest limits today

- **The identity guard is pattern-based**, not a trained name-recognition model. It reliably removes e-mails, phone numbers, outside links, companies written with a legal suffix, and every name on the protected list. It cannot recognise an arbitrary person's name it has not been told about. The Advisor is therefore fed only Eccellere's own content (no client or author names), and the protected list should be filled before Drive content is connected.
- **Not tested with a live AI** or on the live site yet. The unit tests use a stand-in for the model.
- **Quality of retrieval is basic** (keywords). Questions that use different words from the content may find nothing, and the Advisor will then say so.
- **No conversation is stored** on the server; closing the page ends it.
