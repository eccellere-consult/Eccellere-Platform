/**
 * Builds the two compact inputs the narrative needs from a kit's stored answers:
 *  - answersText: the client's own answers, "Label: value", one per line
 *  - analysisDigest: the computed results (scores, findings, gates, checks) as short bullet lines
 * Server and client safe: pure functions over the blueprint and stored rows.
 */
import { scoreDiagnostic, type Blueprint, type StoredResponse } from "./engine";
import { analyseDiagnostic } from "./analysis";
import { analyseProblemSolving } from "./analysis-ps";
import { analysePlaybook } from "./analysis-pb";
import { analyseGuide } from "./analysis-gd";
import { analyseLearning } from "./analysis-lk";
import { isNarrativeField } from "./narrative";

export interface StoredRow {
  fieldId: string;
  value: unknown;
  provenance: string;
  confidence?: string | null;
}

const show = (v: unknown) => (v === null || v === undefined ? "" : String(v)).replace(/\s+/g, " ").trim();

/** Rows without the narratives themselves, as a map. */
export function responseMap(rows: StoredRow[]): Record<string, StoredResponse & { confidence?: string | null }> {
  const m: Record<string, StoredResponse & { confidence?: string | null }> = {};
  for (const r of rows) if (!isNarrativeField(r.fieldId)) m[r.fieldId] = { fieldId: r.fieldId, value: r.value, provenance: r.provenance, confidence: r.confidence };
  return m;
}

export function answersText(bp: Blueprint, rows: StoredRow[]): string {
  const map = responseMap(rows);
  const lines: string[] = [];
  for (const s of bp.sections) {
    for (const f of s.fields) {
      if (f.module && bp.type === "DIAGNOSTIC") continue; // scored questions are summarised by the analysis
      const r = map[f.id];
      if (!r) continue;
      if (r.provenance === "Not-known") { lines.push(`${s.seq}. ${f.label}: Not known`); continue; }
      if (r.provenance === "Not-applicable") continue;
      const v = show(r.value);
      if (v) lines.push(`${s.seq}. ${f.label}${r.provenance === "AI-suggested" ? " (AI-suggested, unconfirmed)" : ""}: ${v.slice(0, 1500)}`);
    }
  }
  return lines.join("\n");
}

export function analysisDigest(bp: Blueprint, rows: StoredRow[]): string {
  const map = responseMap(rows);
  const L: string[] = [];
  if (bp.type === "DIAGNOSTIC") {
    const a = analyseDiagnostic(bp, map, scoreDiagnostic(bp, map));
    L.push(`Overall maturity ${a.overall ?? "not scored"} (${a.overallRag}). Dimensions Red ${a.counts.red}, Amber ${a.counts.amber}, Green ${a.counts.green}. Evidence coverage ${a.evidenceCoverage}%. Target level ${a.target} is a default assumption; no external benchmark is provided.`);
    for (const g of a.gaps) L.push(`Dimension ${g.name}: score ${g.score ?? "n/a"}, gap ${g.gap ?? "n/a"}, rank ${g.rank ?? "-"}`);
    L.push(`Findings (hypotheses, unvalidated): ${a.findings.length}. Evidence gaps: ${a.evidenceGaps.length}.`);
    for (const f of a.findings.slice(0, 6)) L.push(`${f.id} ${f.moduleName}: ${f.question} (score ${f.score})`);
    for (const i of a.initiatives) L.push(`${i.id} ${i.title}, ${i.horizon}, priority ${i.priorityIndex}`);
    for (const d of a.decisions) L.push(`Decision required: ${d}`);
  } else if (bp.type === "PROBLEM_SOLVING") {
    const a = analyseProblemSolving(bp, map);
    L.push(`Hypotheses ${a.counts.total}: ${a.counts.validated} validated, ${a.counts.rejected} rejected, ${a.counts.inconclusive} inconclusive, ${a.counts.untested} untested.`);
    for (const h of a.hypotheses) L.push(`${h.id} [${h.status}] ${h.statement}`);
    L.push(`Options listed ${a.options.rows.length}.`);
    for (const o of a.options.rows.filter((r) => r.weighted !== null)) L.push(`${o.id} ${o.name}: weighted ${o.weighted} (rank ${o.rank})`);
    if (a.topOption) L.push(`Top option ${a.topOption.name}; stable under equal weights: ${a.topStable}; close call: ${a.closeCall}.`);
    L.push(`Decision recorded: ${a.decision.decision || "not yet"}${a.decision.owner ? " by " + a.decision.owner : ""}. Gate status: ${a.readiness}, ${a.openGates} open.`);
    for (const g of a.gates) L.push(`${g.id} ${g.label}: ${g.met === null ? "not yet" : g.met ? "met" : "open"} (${g.detail})`);
  } else if (bp.type === "PLAYBOOK") {
    const a = analysePlaybook(bp, map);
    L.push(`Mobilisation: ${a.mobilisation}, ${a.openChecks} of ${a.checks.length} checks open.`);
    for (const c of a.checks) L.push(`${c.id} ${c.label}: ${c.met ? "met" : "open"} (${c.detail})`);
    for (const w of a.workstreams) L.push(`${w.id} ${w.name}, owner ${w.owner || "none named"}, ${w.stepCount} steps`);
    L.push(`KPIs ${a.kpis.length}; benefit status counts ${JSON.stringify(a.benefitCounts)}. Roadmap items ${a.roadmap.length}. Completion gates met ${a.gatesMetPct ?? "n/a"}%.`);
  } else if (bp.type === "GUIDE") {
    const a = analyseGuide(bp, map);
    L.push(`Reference status ${a.status}, ${a.openChecks} of ${a.checks.length} checks open. Concepts ${a.concepts.length} (${a.conceptCompletePct ?? "n/a"}% complete). Frameworks ${a.frameworks.length}, steps ${a.steps.length}, examples ${a.examples.length}, references ${a.references.length}.`);
    for (const c of a.concepts) L.push(`Concept ${c.term}`);
    for (const f of a.frameworks) L.push(`Framework ${f.name}`);
  } else if (bp.type === "LEARNING") {
    const a = analyseLearning(bp, map);
    L.push(`Release status ${a.status}, ${a.openChecks} of ${a.checks.length} checks open. Modules used ${a.usedModules}. Knowledge checks ${a.knowledgeChecks.length}. Rubric criteria ${a.rubric.length}. Transfer actions ${a.transfer.length}.`);
    for (const m of a.modules.filter((x) => x.used)) L.push(`Module ${m.n}: ${m.title} | outcome: ${m.outcome} | output: ${m.learnerOutput}`);
    for (const o of a.outcomes) L.push(`Expected outcome: ${o.text}`);
  }
  return L.join("\n");
}
