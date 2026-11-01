/**
 * Problem-Solving analysis layer (skill s8).
 * Pure functions. No runtime imports, so they run in unit tests as-is.
 *
 * It turns what the client typed (free text with a light "a | b | c" convention)
 * into the registers a Problem-Solving Kit must contain: hypothesis register,
 * validated causes, options appraisal, pilot checks, risks and the decision gate.
 *
 * Honesty rules:
 *  - Nothing is invented. Missing inputs are shown as missing, never filled in.
 *  - A hypothesis is only "Validated" when the client says so; the default is "Untested".
 *  - Unknown option scores ('?') are excluded and flagged, never treated as zero.
 *  - A weighted score informs the decision; it does not make it (skill s8).
 *  - The report never approves a decision. It only reports whether the gate is met.
 */
import type { Blueprint } from "./engine";

export interface PSAnswer {
  fieldId: string;
  value: unknown;
  provenance?: string;
}

export type HypStatus = "Validated" | "Rejected" | "Inconclusive" | "Untested";

export interface Hypothesis {
  id: string; // H1...
  statement: string;
  evidenceFor: string;
  evidenceAgainst: string;
  test: string;
  confidence: "High" | "Medium" | "Low" | "Not stated";
  status: HypStatus;
  validationEvidence: string;
  flags: string[];
}

export interface Criterion {
  name: string;
  weight: number; // normalised to total 100
  proposed: boolean; // true when the default set is used
}

export interface OptionRow {
  id: string; // O1...
  name: string;
  scores: Array<number | null>;
  weighted: number | null; // 1-5
  coverage: number; // % of weight with a known score
  rank: number | null;
  equalWeightRank: number | null;
  flags: string[];
}

export interface Risk {
  text: string;
  likelihood: string;
  impact: string;
  rating: "High" | "Medium" | "Low" | "Not rated";
  counter: string;
}

export interface Gate {
  id: string;
  label: string;
  met: boolean | null; // null = not applicable yet
  detail: string;
}

export interface TreeNode {
  text: string;
  depth: number;
}

export interface PSAnalysis {
  problemChecks: Array<{ label: string; ok: boolean; note: string }>;
  tree: { nodes: TreeNode[]; branches: number; notes: string[] };
  hypotheses: Hypothesis[];
  counts: { total: number; validated: number; rejected: number; inconclusive: number; untested: number; noCounterEvidence: number };
  options: { rows: OptionRow[]; distinct: number; notes: string[] };
  criteria: Criterion[];
  criteriaNotes: string[];
  topOption: OptionRow | null;
  topStable: boolean | null;
  closeCall: boolean;
  pilotChecks: Array<{ label: string; found: boolean }>;
  risks: Risk[];
  decision: { recommended: string; decision: string; owner: string; rationale: string };
  gates: Gate[];
  readiness: "Ready to hand over to a Playbook" | "Not ready";
  openGates: number;
}

// ── parsing helpers ──────────────────────────────────────────────────────
const text = (v: unknown): string => (v === null || v === undefined ? "" : String(v)).trim();

export function parseLines(v: unknown): string[] {
  return text(v)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}
const cells = (l: string) => l.split("|").map((c) => c.trim());
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const words = (s: string) => (s.match(/[A-Za-z0-9₹%]+/g) ?? []).length;

/** Looks a field up by section number and label pattern, so older blueprints without it still work. */
export function answerFor(bp: Blueprint, responses: Record<string, PSAnswer>, seq: number, label: RegExp): string {
  const s = bp.sections.find((x) => x.seq === seq);
  const f = s?.fields.find((x) => label.test(x.label));
  if (!f) return "";
  const r = responses[f.id];
  if (!r || r.provenance === "Not-known" || r.provenance === "Not-applicable") return "";
  return text(r.value);
}
export function wasMarkedNotKnown(bp: Blueprint, responses: Record<string, PSAnswer>, seq: number, label: RegExp): boolean {
  const s = bp.sections.find((x) => x.seq === seq);
  const f = s?.fields.find((x) => label.test(x.label));
  return Boolean(f && responses[f.id]?.provenance === "Not-known");
}

export const DEFAULT_CRITERIA: Array<{ name: string; weight: number }> = [
  { name: "Impact on the problem", weight: 25 },
  { name: "Feasibility", weight: 20 },
  { name: "Cost and investment (5 = lowest)", weight: 15 },
  { name: "Time to value", weight: 15 },
  { name: "Risk and compliance (5 = lowest risk)", weight: 15 },
  { name: "Readiness", weight: 10 },
];

const confidenceOf = (s: string): Hypothesis["confidence"] => {
  const t = s.toLowerCase();
  if (/^h/.test(t)) return "High";
  if (/^m/.test(t)) return "Medium";
  if (/^l/.test(t)) return "Low";
  return "Not stated";
};

// ── main ─────────────────────────────────────────────────────────────────
export function analyseProblemSolving(bp: Blueprint, responses: Record<string, PSAnswer>): PSAnalysis {
  const A = (seq: number, re: RegExp) => answerFor(bp, responses, seq, re);

  // Problem definition checks (heuristic: presence and measurability only)
  const owner = A(5, /Problem owner/i);
  const scope = A(5, /Scope and boundary/i);
  const statement = A(6, /Problem statement/i);
  const success = A(6, /Success criteria/i);
  const baseline = A(7, /Baseline and impact/i);
  const problemChecks = [
    { label: "Problem owner is named", ok: owner.length > 0, note: owner ? owner : "No owner recorded." },
    { label: "Scope and boundary are stated", ok: scope.length > 0, note: scope ? "Recorded." : "Not recorded." },
    { label: "Problem statement is specific (12+ words)", ok: words(statement) >= 12, note: statement ? `${words(statement)} words.` : "Not recorded." },
    { label: "Success criteria are measurable (contain a number)", ok: /\d/.test(success), note: success ? (/\d/.test(success) ? "A figure is present." : "No figure found; add a target and a date.") : "Not recorded." },
    { label: "Baseline is recorded", ok: baseline.length > 0, note: baseline ? (/not known/i.test(baseline) ? "Recorded, with unknowns flagged." : "Recorded.") : "Not recorded." },
  ];

  // Issue tree
  const treeRaw = text(A(8, /Issue tree/i)).split(/\r?\n/).filter((l) => l.trim());
  const nodes: TreeNode[] = treeRaw.map((l) => {
    const lead = (l.match(/^[\s\t]*/)?.[0] ?? "").replace(/\t/g, "  ").length;
    return { text: l.replace(/^[\s\t]*(?:[-*•]|\d+[.)])?\s*/, "").trim(), depth: Math.min(4, Math.floor(lead / 2)) };
  }).filter((n) => n.text);
  const branches = nodes.filter((n) => n.depth === 0).length;
  const treeNotes: string[] = [];
  if (!nodes.length) treeNotes.push("No issue tree was provided.");
  else {
    if (branches < 3) treeNotes.push("Fewer than 3 top-level branches: check the problem has been broken down enough.");
    if (branches > 7) treeNotes.push("More than 7 top-level branches: consider grouping so the tree stays mutually exclusive and easy to test.");
    const seen = new Set<string>();
    for (const n of nodes) { const k = norm(n.text); if (seen.has(k)) treeNotes.push(`"${n.text}" appears more than once: branches must not overlap.`); seen.add(k); }
  }

  // Hypotheses
  const hyps: Hypothesis[] = parseLines(A(10, /Hypotheses/i)).map((line, i) => {
    const c = cells(line);
    const h: Hypothesis = {
      id: `H${i + 1}`, statement: c[0] ?? "", evidenceFor: c[1] ?? "", evidenceAgainst: c[2] ?? "", test: c[3] ?? "",
      confidence: confidenceOf(c[4] ?? ""), status: "Untested", validationEvidence: "", flags: [],
    };
    return h;
  });
  for (const line of parseLines(A(11, /Validation results/i))) {
    const c = cells(line);
    const m = (c[0] ?? "").match(/^H?(\d+)$/i);
    const idx = m ? parseInt(m[1], 10) - 1 : -1;
    const h = hyps[idx];
    if (!h) continue;
    const st = (c[1] ?? "").toLowerCase();
    h.status = /reject|disprov|not\s*valid/.test(st) ? "Rejected" : /valid|confirm|proven/.test(st) ? "Validated" : /inconcl|unclear|partial/.test(st) ? "Inconclusive" : "Untested";
    h.validationEvidence = c.slice(2).join(" | ");
  }
  for (const h of hyps) {
    if (!h.evidenceAgainst) h.flags.push("Counter-evidence not recorded");
    if (!h.test) h.flags.push("No test defined");
    if (h.status === "Validated" && !h.validationEvidence) h.flags.push("Marked validated with no evidence recorded");
  }
  const counts = {
    total: hyps.length,
    validated: hyps.filter((h) => h.status === "Validated").length,
    rejected: hyps.filter((h) => h.status === "Rejected").length,
    inconclusive: hyps.filter((h) => h.status === "Inconclusive").length,
    untested: hyps.filter((h) => h.status === "Untested").length,
    noCounterEvidence: hyps.filter((h) => !h.evidenceAgainst).length,
  };

  // Options and criteria
  const optNames = parseLines(A(13, /Option longlist/i)).map((l) => cells(l)[0].slice(0, 200)).filter(Boolean);
  const distinct = new Set(optNames.map((n) => norm(n))).size;
  const optNotes: string[] = [];
  if (!optNames.length) optNotes.push("No options were listed.");
  else if (distinct < 5) optNotes.push(`Only ${distinct} distinct option${distinct === 1 ? "" : "s"}: the skill asks for a wide longlist (5 or more) before converging.`);

  const critLines = parseLines(A(14, /criteria and weights/i)).map(cells).filter((c) => c[0] && Number.isFinite(parseFloat(c[1] ?? "")));
  const criteriaNotes: string[] = [];
  let rawCrit: Array<{ name: string; weight: number }>;
  let proposed = false;
  if (critLines.length) {
    rawCrit = critLines.map((c) => ({ name: c[0], weight: Math.max(0, parseFloat(c[1])) }));
    const sum = rawCrit.reduce((a, c) => a + c.weight, 0);
    if (Math.abs(sum - 100) > 0.5) criteriaNotes.push(`Weights entered total ${Math.round(sum * 10) / 10}, not 100. They were rescaled to 100 for scoring.`);
  } else {
    rawCrit = DEFAULT_CRITERIA;
    proposed = true;
    criteriaNotes.push("No criteria were entered, so a proposed default set is shown. Weights are proposals: confirm or replace them.");
  }
  const wsum = rawCrit.reduce((a, c) => a + c.weight, 0) || 1;
  const criteria: Criterion[] = rawCrit.map((c) => ({ name: c.name, weight: Math.round((c.weight / wsum) * 1000) / 10, proposed }));

  const scoreLines = parseLines(A(14, /Option scores/i)).map(cells);
  // A score line finds its option by number (O2), by exact name, or by a name whose words all appear in
  // exactly one option ("Change supplier" -> "Change resin supplier"). If a short name could fit several
  // options we do not guess; the option is reported as having no scores.
  const toks = (s: string) => norm(s).split(" ").filter(Boolean);
  const subset = (a: string[], b: string[]) => a.length > 0 && a.every((t) => b.includes(t));
  const looselyMatches = (key: string, opt: string) => {
    const a = toks(key), b = toks(opt);
    return subset(a, b) || subset(b, a);
  };
  const parseScores = (c: string[]) =>
    (c[1] ?? "").split(/[,\s]+/).filter(Boolean).map((t) => (/^\d$/.test(t) && +t >= 1 && +t <= 5 ? +t : NaN));
  const scoresFor = (opt: string, idx: number): number[] | null => {
    for (const c of scoreLines) {
      const key = c[0] ?? "";
      const m = key.match(/^O?(\d+)$/i);
      if (m && parseInt(m[1], 10) - 1 === idx) return parseScores(c);
      if (!m && norm(key) === norm(opt)) return parseScores(c);
    }
    for (const c of scoreLines) {
      const key = c[0] ?? "";
      if (/^O?\d+$/i.test(key) || !looselyMatches(key, opt)) continue;
      const candidates = optNames.filter((o) => looselyMatches(key, o)).length;
      if (candidates === 1) return parseScores(c);
    }
    return null;
  };
  const rows: OptionRow[] = optNames.map((name, i) => {
    const raw = scoresFor(name, i);
    const flags: string[] = [];
    const scores: Array<number | null> = criteria.map((_, k) => {
      const v = raw?.[k];
      return v === undefined || Number.isNaN(v) ? null : v;
    });
    if (!raw) flags.push("No scores entered");
    else {
      if (raw.length !== criteria.length) flags.push(`${raw.length} scores entered for ${criteria.length} criteria`);
      if (raw.some((v) => Number.isNaN(v))) flags.push("Unknown or out-of-range scores were excluded");
    }
    const known = criteria.map((c, k) => (scores[k] === null ? 0 : c.weight));
    const kw = known.reduce((a, b) => a + b, 0);
    const coverage = Math.round(kw);
    const weighted = kw > 0 && coverage >= 50 ? Math.round((criteria.reduce((a, c, k) => a + (scores[k] === null ? 0 : c.weight * (scores[k] as number)), 0) / kw) * 100) / 100 : null;
    if (kw > 0 && coverage < 50) flags.push("Less than half of the weight has a known score");
    return { id: `O${i + 1}`, name, scores, weighted, coverage, rank: null, equalWeightRank: null, flags };
  });
  const ranked = rows.filter((r) => r.weighted !== null).sort((a, b) => (b.weighted as number) - (a.weighted as number));
  ranked.forEach((r, i) => { r.rank = i + 1; });
  const eq = (r: OptionRow) => {
    const ks = r.scores.filter((s): s is number => s !== null);
    return ks.length >= Math.ceil(criteria.length / 2) ? ks.reduce((a, b) => a + b, 0) / ks.length : null;
  };
  rows.filter((r) => eq(r) !== null).sort((a, b) => (eq(b) as number) - (eq(a) as number)).forEach((r, i) => { r.equalWeightRank = i + 1; });
  const top = ranked[0] ?? null;
  const topStable = top ? rows.find((r) => r.equalWeightRank === 1)?.id === top.id : null;
  const closeCall = ranked.length >= 2 ? Math.abs((ranked[0].weighted as number) - (ranked[1].weighted as number)) < 0.25 : false;

  // Pilot checks (keyword heuristic; says so in the report)
  const pilot = A(15, /Pilot design/i).toLowerCase();
  const pilotChecks = [
    { label: "Scale or scope of the pilot", found: /scale|unit|store|plant|team|site|branch|line|customer|region|sample/.test(pilot) },
    { label: "Duration", found: /\bday|week|month|sprint|cycle/.test(pilot) },
    { label: "Success measure", found: /success|target|measure|kpi|%|metric|threshold/.test(pilot) },
    { label: "Stop rule", found: /\bstop|abort|halt|roll ?back|kill|cut-?off|if .{2,60}(then|below|above)/.test(pilot) },
  ];

  // Risks
  const risks: Risk[] = parseLines(A(18, /Risks, assumptions/i)).map((line) => {
    const c = cells(line);
    const lv = (s: string) => (/^h/i.test(s) ? 3 : /^m/i.test(s) ? 2 : /^l/i.test(s) ? 1 : 0);
    const l = lv(c[1] ?? ""), im = lv(c[2] ?? "");
    const p = l && im ? l * im : 0;
    return { text: c[0], likelihood: c[1] ?? "", impact: c[2] ?? "", counter: c.slice(3).join(" | "), rating: p >= 6 ? "High" : p >= 3 ? "Medium" : p >= 1 ? "Low" : "Not rated" };
  });

  // Decision record and gate
  const recommended = A(16, /Recommended solution/i);
  const decision = A(16, /^Decision$/i);
  const dOwner = A(16, /Decision owner/i);
  const rationale = A(16, /Decision rationale/i);
  const constraints = A(12, /Solution principles/i);
  const riskText = A(18, /Risks, assumptions/i);
  const dec = /approve/i.test(decision) ? "Approve" : /reject/i.test(decision) ? "Reject" : /defer/i.test(decision) ? "Defer" : /no-?go/i.test(decision) ? "No-go" : "";
  const scored = rows.filter((r) => r.weighted !== null).length;
  const gates: Gate[] = [
    { id: "G1", label: "Problem statement and baseline are recorded", met: words(statement) >= 12 && baseline.length > 0, detail: "Sections 6 and 7." },
    { id: "G2", label: "Every hypothesis is tested and labelled", met: counts.total > 0 && counts.untested === 0, detail: counts.total ? `${counts.untested} of ${counts.total} still untested.` : "No hypotheses recorded." },
    { id: "G3", label: "At least two options are compared on scored criteria", met: scored >= 2, detail: `${scored} option${scored === 1 ? "" : "s"} scored.` },
    { id: "G4", label: "Preferred solution and rationale, or a no-go, are recorded", met: dec === "No-go" || (recommended.length > 0 && rationale.length > 0), detail: recommended ? (rationale ? "Recorded." : "Rationale missing.") : "No recommended solution recorded." },
    { id: "G5", label: "Decision owner has approved, rejected or deferred", met: Boolean(dec) && dOwner.length > 0, detail: dec ? (dOwner ? `${dec} by ${dOwner}.` : "Decision owner not named.") : "No decision recorded." },
    { id: "G6", label: "Playbook handover brief is sufficiently detailed", met: dec === "Approve" ? Boolean(recommended && success && constraints && riskText) : null, detail: dec === "Approve" ? "Needs the recommendation, success criteria, constraints and risks." : "Applies only once a solution is approved." },
  ];
  const open = gates.filter((g) => g.met === false).length;
  const ready = gates.every((g) => g.met === true) && dec === "Approve";

  return {
    problemChecks,
    tree: { nodes, branches, notes: treeNotes },
    hypotheses: hyps,
    counts,
    options: { rows, distinct, notes: optNotes },
    criteria,
    criteriaNotes,
    topOption: top,
    topStable,
    closeCall,
    pilotChecks,
    risks,
    decision: { recommended, decision: dec, owner: dOwner, rationale },
    gates,
    readiness: ready ? "Ready to hand over to a Playbook" : "Not ready",
    openGates: open,
  };
}
