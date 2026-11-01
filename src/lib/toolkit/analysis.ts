/**
 * Diagnostic analysis layer (skill s7, s6).
 * Pure functions: turn scored answers into the report's analysis sections.
 *
 * Honesty rules baked in:
 *  - Nothing is invented. No benchmarks, no money values, no named owners.
 *  - Root causes are HYPOTHESES until validated (status "Unvalidated").
 *  - 'Not known' / 'N/A' are evidence gaps, never zero scores.
 *  - Confidence is never "High" automatically: a client statement is a client statement.
 *  - Anything built from a template (not from the client's own words) is labelled as such.
 */
import type { Blueprint, StoredResponse } from "./engine";

/** Shape returned by scoreDiagnostic() in engine.ts (kept structural so this file has no runtime imports). */
export interface DiagnosticScores {
  modules: Array<{ moduleId: string; name: string; weight: number; score: number | null; answered: number; unknown: number; total: number; coverage: number; rag: string }>;
  overall: number | null;
  overallRag: string;
}

export interface AnalysisResponse extends StoredResponse {
  confidence?: string | null;
}

export type Confidence = "High" | "Medium" | "Low";

export interface Finding {
  id: string; // F01...
  moduleId: string;
  moduleName: string;
  questionId: string;
  question: string;
  score: 1 | 2;
  severity: "Critical" | "High";
  evidence: string; // what the client said / source label
  provenance: string;
  confidence: Confidence;
  status: "Unvalidated hypothesis";
  initiativeId: string;
}

export interface EvidenceGap {
  questionId: string;
  question: string;
  moduleName: string;
  reason: "Not known" | "Not answered";
}

export interface GapRow {
  moduleId: string;
  name: string;
  weight: number;
  score: number | null;
  target: number;
  gap: number | null;
  rag: string;
  priorityIndex: number; // weight x gap, higher = more urgent
  rank: number | null;
  coverage: number;
}

export interface Initiative {
  id: string; // I01...
  moduleId: string;
  title: string;
  objective: string;
  priorityIndex: number;
  wave: 1 | 2 | 3 | 4;
  horizon: string;
  findingIds: string[];
  steps: string[];
  kpi: string;
  gate: string;
}

export interface DiagnosticAnalysis {
  target: number;
  overall: number | null;
  overallRag: string;
  counts: { red: number; amber: number; green: number; notScored: number };
  evidenceCoverage: number; // % of questions answered or explicitly Not known / N/A
  aiUnconfirmed: number;
  gaps: GapRow[];
  heat: Array<{ moduleId: string; name: string; cells: Array<{ id: string; level: number | null; kind: "scored" | "unknown" | "blank" }> }>;
  findings: Finding[];
  evidenceGaps: EvidenceGap[];
  tree: Array<{ moduleId: string; name: string; rag: string; causes: Array<{ findingId: string; text: string }> }>;
  initiatives: Initiative[];
  decisions: string[];
  topGaps: GapRow[];
}

export const TARGET_LEVEL = 3; // "Established": a stated default assumption, adjustable by the client

const HORIZON: Record<number, string> = { 1: "Days 0-30", 2: "Days 31-60", 3: "Days 61-90", 4: "Days 91-180" };

const confidenceFor = (provenance: string): Confidence =>
  provenance === "Source-extracted" || provenance === "Consultant-entered" ? "Medium" : "Low";

const trim = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "..." : s);

function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= 4 ? n : null;
}

export function analyseDiagnostic(
  bp: Blueprint,
  responses: Record<string, AnalysisResponse>,
  scores: DiagnosticScores,
): DiagnosticAnalysis {
  const allFields = bp.sections.flatMap((s) => s.fields);
  const qs = allFields.filter((f) => f.module);

  // ── Gap analysis ──────────────────────────────────────────────────────
  const rows: GapRow[] = scores.modules.map((m) => {
    const gap = m.score === null ? null : Math.max(0, Math.round((TARGET_LEVEL - m.score) * 100) / 100);
    return {
      moduleId: m.moduleId, name: m.name, weight: m.weight, score: m.score, target: TARGET_LEVEL, gap, rag: m.rag,
      priorityIndex: gap === null ? 0 : Math.round(m.weight * gap * 100) / 100,
      rank: null, coverage: m.coverage,
    };
  });
  rows
    .filter((r) => r.gap !== null && r.gap > 0)
    .sort((a, b) => b.priorityIndex - a.priorityIndex || (a.score ?? 9) - (b.score ?? 9))
    .forEach((r, i) => { r.rank = i + 1; });
  const ranked = rows.filter((r) => r.rank !== null).sort((a, b) => (a.rank as number) - (b.rank as number));

  // ── Heat grid, evidence gaps ──────────────────────────────────────────
  const heat = bp.modules.map((m) => ({
    moduleId: m.id, name: m.name,
    cells: qs.filter((q) => q.module === m.id).map((q) => {
      const r = responses[q.id];
      if (!r) return { id: q.id, level: null, kind: "blank" as const };
      if (r.provenance === "Not-known" || r.provenance === "Not-applicable") return { id: q.id, level: null, kind: "unknown" as const };
      const n = numeric(r.value);
      return n === null ? { id: q.id, level: null, kind: "blank" as const } : { id: q.id, level: n, kind: "scored" as const };
    }),
  }));
  const modName = new Map(bp.modules.map((m) => [m.id, m.name]));
  const evidenceGaps: EvidenceGap[] = [];
  let covered = 0;
  for (const q of qs) {
    const r = responses[q.id];
    const n = r ? numeric(r.value) : null;
    if (r && (r.provenance === "Not-known")) {
      evidenceGaps.push({ questionId: q.id, question: q.label, moduleName: modName.get(q.module as string) ?? "", reason: "Not known" });
      covered++;
    } else if (r && r.provenance === "Not-applicable") covered++;
    else if (n !== null) covered++;
    else evidenceGaps.push({ questionId: q.id, question: q.label, moduleName: modName.get(q.module as string) ?? "", reason: "Not answered" });
  }

  // ── Initiatives first (findings link to them) ─────────────────────────
  const initiatives: Initiative[] = ranked.map((r, i) => ({
    id: `I${String(i + 1).padStart(2, "0")}`,
    moduleId: r.moduleId,
    title: `Close the gap in ${r.name}`,
    objective: `Move ${r.name} from ${r.score} to the target maturity of ${TARGET_LEVEL} (Established) and re-assess to confirm.`,
    priorityIndex: r.priorityIndex,
    wave: (i < 2 ? 1 : i < 4 ? 2 : i < 6 ? 3 : 4) as 1 | 2 | 3 | 4,
    horizon: "",
    findingIds: [],
    steps: [],
    kpi: `${r.name} maturity score: baseline ${r.score}, target ${TARGET_LEVEL}.0 at the next re-assessment.`,
    gate: "Owner named, baseline confirmed, root causes validated, pilot result reviewed.",
  }));
  initiatives.forEach((it) => { it.horizon = HORIZON[it.wave]; });
  const initByModule = new Map(initiatives.map((i) => [i.moduleId, i]));

  // ── Findings: only weak answers (1-2), as unvalidated hypotheses ──────
  const findings: Finding[] = [];
  for (const m of bp.modules) {
    for (const q of qs.filter((x) => x.module === m.id)) {
      const r = responses[q.id];
      const n = r ? numeric(r.value) : null;
      if (!r || n === null || n > 2 || r.provenance === "Not-known" || r.provenance === "Not-applicable") continue;
      const init = initByModule.get(m.id);
      findings.push({
        id: `F${String(findings.length + 1).padStart(2, "0")}`,
        moduleId: m.id, moduleName: m.name, questionId: q.id, question: q.label,
        score: n as 1 | 2,
        severity: n === 1 ? "Critical" : "High",
        evidence: `Answered "${n === 1 ? "Ad hoc / Aware" : "Developing"}" (${r.provenance.replace("-", " ")})`,
        provenance: r.provenance,
        confidence: confidenceFor(r.provenance),
        status: "Unvalidated hypothesis",
        initiativeId: init?.id ?? "",
      });
    }
  }
  findings.sort((a, b) => a.score - b.score);
  findings.forEach((f, i) => { f.id = `F${String(i + 1).padStart(2, "0")}`; });
  for (const it of initiatives) {
    it.findingIds = findings.filter((f) => f.moduleId === it.moduleId).map((f) => f.id);
    const ref = it.findingIds.length ? it.findingIds.join(", ") : "the weakest answers in this dimension";
    it.steps = [
      `Name an accountable owner for ${rows.find((r) => r.moduleId === it.moduleId)?.name} and confirm the current baseline with evidence.`,
      `Test the causes behind ${ref} with a method that fits (5 Whys, Pareto or process walk-through) using recent data. Mark each cause validated or rejected.`,
      "Design the fix with the process owner; agree scope, constraints and what will not change.",
      "Pilot on one unit, team or product for 2-4 weeks and record the result against the baseline.",
      "Roll out with updated procedures, training and a named reviewer; keep the pilot evidence.",
      "Re-assess this dimension and review the KPI at the monthly steering meeting.",
    ];
  }

  // ── Issue tree (hypotheses only) ──────────────────────────────────────
  const tree = rows
    .filter((r) => r.rag === "Red" || r.rag === "Amber")
    .sort((a, b) => (a.score ?? 9) - (b.score ?? 9))
    .map((r) => ({
      moduleId: r.moduleId, name: r.name, rag: r.rag,
      causes: findings.filter((f) => f.moduleId === r.moduleId).map((f) => ({ findingId: f.id, text: trim(f.question, 160) })),
    }));

  // ── Counts, decisions ─────────────────────────────────────────────────
  const counts = {
    red: rows.filter((r) => r.rag === "Red").length,
    amber: rows.filter((r) => r.rag === "Amber").length,
    green: rows.filter((r) => r.rag === "Green").length,
    notScored: rows.filter((r) => r.rag === "Not scored").length,
  };
  const aiUnconfirmed = Object.values(responses).filter((r) => r && r.provenance === "AI-suggested").length;
  const decisions: string[] = [];
  if (initiatives.length) decisions.push(`Approve the priority order and waves for ${initiatives.length} initiative${initiatives.length > 1 ? "s" : ""} (Section 17), starting with ${initiatives.filter((i) => i.wave === 1).map((i) => i.id).join(" and ")}.`);
  decisions.push("Name an accountable owner for every wave 1 initiative. No owner has been assumed in this report.");
  decisions.push(`Confirm that target maturity ${TARGET_LEVEL} (Established) is the right ambition, or set a different target per dimension.`);
  if (findings.length) decisions.push(`Authorise root-cause validation for ${findings.length} finding${findings.length > 1 ? "s" : ""}. No finding is a confirmed cause until it has been tested.`);
  if (evidenceGaps.length) decisions.push(`Close or accept ${evidenceGaps.length} evidence gap${evidenceGaps.length > 1 ? "s" : ""} (Not known or not answered) before relying on the affected dimensions.`);
  if (aiUnconfirmed) decisions.push(`Confirm or correct ${aiUnconfirmed} AI-suggested answer${aiUnconfirmed > 1 ? "s" : ""} that have not yet been confirmed by the client.`);

  return {
    target: TARGET_LEVEL,
    overall: scores.overall,
    overallRag: scores.overallRag,
    counts,
    evidenceCoverage: qs.length ? Math.round((covered / qs.length) * 100) : 0,
    aiUnconfirmed,
    gaps: rows,
    heat,
    findings,
    evidenceGaps,
    tree,
    initiatives,
    decisions,
    topGaps: ranked.slice(0, 3),
  };
}

/** Standard governance rhythm (skill s7 and s9): a fixed template, not client data. */
export const GOVERNANCE_CALENDAR: Array<{ cadence: string; forum: string; purpose: string }> = [
  { cadence: "Weekly", forum: "Initiative stand-up (owners)", purpose: "Progress against wave 1 steps, blockers, evidence collected." },
  { cadence: "Monthly", forum: "Steering review (sponsor + owners)", purpose: "KPI movement, decisions needed, wave gate approvals." },
  { cadence: "Quarterly", forum: "Diagnostic refresh", purpose: "Re-score the dimensions, update gaps and re-rank the initiatives." },
];
