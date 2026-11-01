/**
 * Playbook analysis layer (skill s9).
 * Pure functions with no runtime imports. Turns the client's structured lines
 * ("a | b | c") into the registers an implementation Playbook must contain, and
 * checks them for the gaps that make implementations fail.
 *
 * Honesty rules:
 *  - Nothing is invented: no owners, dates, budgets, baselines or targets.
 *  - A missing piece is shown as missing, never filled with a default.
 *  - Benefit status (forecast, approved, validated, realised, sustained) is kept as the
 *    client stated it and counted separately; it is never upgraded.
 *  - The report never approves a mobilisation. It reports which checks are met.
 */
import type { Blueprint } from "./engine";
import type { PSAnswer } from "./analysis-ps";

export type { PSAnswer as PBAnswer };

// Two small helpers are repeated here (not imported) so this file has no runtime imports and can be
// unit-tested as plain TypeScript. They behave exactly as the versions in analysis-ps.ts.
const text = (v: unknown): string => (v === null || v === undefined ? "" : String(v)).trim();
function parseLines(v: unknown): string[] {
  return text(v)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}
function answerFor(bp: Blueprint, responses: Record<string, PSAnswer>, seq: number, label: RegExp): string {
  const f = bp.sections.find((x) => x.seq === seq)?.fields.find((x) => label.test(x.label));
  if (!f) return "";
  const r = responses[f.id];
  if (!r || r.provenance === "Not-known" || r.provenance === "Not-applicable") return "";
  return text(r.value);
}

const cells = (l: string) => l.split("|").map((c) => c.trim());
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const nk = (s: string) => /^(not known|unknown|tbc|tbd|\?|n\/a|-)?$/i.test(s.trim());
const roles = (s: string) => (s ?? "").split(/,|;|\/|\band\b/i).map((r) => r.trim()).filter(Boolean);

export interface Workstream {
  id: string; name: string; scope: string; owner: string; dependsOn: string[]; gate: string;
  stepCount: number; flags: string[];
}
export interface Step {
  id: string; action: string; method: string; output: string; validation: string; owner: string;
  workstream: string; flags: string[];
}
export interface RaciRow { activity: string; R: string[]; A: string[]; C: string[]; I: string[]; flags: string[] }
export interface Kpi {
  name: string; baseline: string; target: string; formula: string; owner: string; cadence: string;
  status: "forecast" | "approved" | "validated" | "realised" | "sustained" | "Not stated"; flags: string[];
}
export interface RoadItem {
  id: string; phase: string; activity: string; owner: string; start: string; end: string;
  startDay: number | null; endDay: number | null; kind: "relative" | "date" | "none"; horizon: string; milestone: string; dependsOn: string; gate: string; flags: string[];
}
export interface PBRisk { text: string; likelihood: string; impact: string; counter: string; owner: string; rating: "High" | "Medium" | "Low" | "Not rated" }
export interface Forum { forum: string; cadence: string; attendees: string; purpose: string; kind: "Weekly" | "Monthly" | "Quarterly" | "Other" }
export interface CompletionGate { gate: string; evidence: string; owner: string; status: "Met" | "Open" | "Not stated"; flags: string[] }
export interface ReadinessItem { item: string; status: "Ready" | "Not ready" | "Not stated"; owner: string }
export interface Check { id: string; label: string; met: boolean; detail: string }

export interface PBAnalysis {
  premise: Array<{ label: string; ok: boolean; note: string }>;
  readiness: { items: ReadinessItem[]; readyPct: number | null };
  workstreams: Workstream[];
  steps: Step[];
  raci: { rows: RaciRow[]; roles: string[]; uncovered: string[] };
  kpis: Kpi[];
  benefitCounts: Record<string, number>;
  roadmap: RoadItem[];
  roadmapNotes: string[];
  risks: PBRisk[];
  forums: Forum[];
  governanceCovers: { weekly: boolean; monthly: boolean; quarterly: boolean };
  gates: CompletionGate[];
  gatesMetPct: number | null;
  budget: { stated: boolean; note: string };
  checks: Check[];
  openChecks: number;
  mobilisation: "Ready to mobilise" | "Not ready";
}

// ── dates: ISO / dd-mm-yyyy / "Day 30" / "Week 6" / "Month 2" ────────────────
export function parseWhen(raw: string): { day: number | null; kind: "relative" | "date" | "none" } {
  const s = raw.trim();
  if (!s || nk(s)) return { day: null, kind: "none" };
  const rel = s.match(/^(day|week|month)s?\s*(\d+)$/i);
  if (rel) {
    const n = parseInt(rel[2], 10);
    return { day: /^d/i.test(rel[1]) ? n : /^w/i.test(rel[1]) ? n * 7 : n * 30, kind: "relative" };
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const t = iso ? Date.UTC(+iso[1], +iso[2] - 1, +iso[3]) : dmy ? Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]) : NaN;
  return Number.isFinite(t) ? { day: Math.floor(t / 86400000), kind: "date" } : { day: null, kind: "none" };
}

export const bucketFor = (day: number | null): string =>
  day === null ? "Not dated" : day <= 30 ? "Days 0-30" : day <= 60 ? "Days 31-60" : day <= 90 ? "Days 61-90" : day <= 180 ? "Days 91-180" : "Beyond day 180";

const statusOf = (s: string): Kpi["status"] => {
  const t = s.toLowerCase();
  return /sustain/.test(t) ? "sustained" : /realis|realiz/.test(t) ? "realised" : /validat/.test(t) ? "validated" : /approv/.test(t) ? "approved" : /forecast|expect|plan/.test(t) ? "forecast" : "Not stated";
};

export function analysePlaybook(bp: Blueprint, responses: Record<string, PSAnswer>): PBAnalysis {
  const A = (seq: number, re: RegExp) => answerFor(bp, responses, seq, re);

  // Premise (skill: do not re-open the diagnostic unless the premise is invalidated)
  const problem = A(5, /Approved problem/i), solution = A(5, /Approved solution/i), sponsor = A(5, /Sponsor/i);
  const outcomes = A(6, /Outcomes/i), scope = A(6, /Scope and exclusions/i);
  const premise = [
    { label: "Approved problem or opportunity is recorded", ok: problem.length > 0, note: problem ? "Recorded." : "Not recorded." },
    { label: "Approved solution is recorded", ok: solution.length > 0, note: solution ? "Recorded." : "Not recorded." },
    { label: "A sponsor with decision authority is named", ok: sponsor.length > 0, note: sponsor || "Not named." },
    { label: "Measurable outcomes are stated (contain a number)", ok: /\d/.test(outcomes), note: outcomes ? (/\d/.test(outcomes) ? "A figure is present." : "No figure found.") : "Not recorded." },
    { label: "Scope and exclusions are stated", ok: scope.length > 0, note: scope ? "Recorded." : "Not recorded." },
  ];

  // Readiness
  const readinessItems: ReadinessItem[] = parseLines(A(8, /Readiness and prerequisites/i)).map((l) => {
    const c = cells(l);
    const st = (c[1] ?? "").toLowerCase();
    return { item: c[0], status: /not\s*ready|no\b|open|missing/.test(st) ? "Not ready" : /ready|yes|done|met|in place/.test(st) ? "Ready" : "Not stated", owner: c[2] ?? "" };
  });
  const stated = readinessItems.filter((r) => r.status !== "Not stated");
  const readyPct = stated.length ? Math.round((stated.filter((r) => r.status === "Ready").length / stated.length) * 100) : null;

  // Workstreams
  const workstreams: Workstream[] = parseLines(A(9, /Workstreams and phases/i)).map((l, i) => {
    const c = cells(l);
    const w: Workstream = {
      id: `W${i + 1}`, name: c[0], scope: c[1] ?? "", owner: nk(c[2] ?? "") ? "" : c[2], dependsOn: (c[3] ?? "").match(/W\d+/gi)?.map((x) => x.toUpperCase()) ?? [],
      gate: c[4] ?? "", stepCount: 0, flags: [],
    };
    if (!w.owner) w.flags.push("No owner");
    if (!w.gate) w.flags.push("No stage gate");
    return w;
  });
  const wsIds = new Set(workstreams.map((w) => w.id));
  for (const w of workstreams) for (const d of w.dependsOn) if (!wsIds.has(d)) w.flags.push(`Depends on unknown ${d}`);

  // Steps
  const steps: Step[] = parseLines(A(10, /Implementation steps/i)).map((l, i) => {
    const c = cells(l);
    const st: Step = { id: `S${i + 1}`, action: c[0], method: c[1] ?? "", output: c[2] ?? "", validation: c[3] ?? "", owner: nk(c[4] ?? "") ? "" : c[4], workstream: (c[5] ?? "").match(/W\d+/i)?.[0].toUpperCase() ?? "", flags: [] };
    if (!st.method) st.flags.push("No method");
    if (!st.output) st.flags.push("No output");
    if (!st.validation) st.flags.push("No validation");
    if (!st.owner) st.flags.push("No owner");
    if (st.workstream && !wsIds.has(st.workstream)) st.flags.push(`Unknown workstream ${st.workstream}`);
    return st;
  });
  for (const w of workstreams) w.stepCount = steps.filter((s) => s.workstream === w.id).length;

  // RACI
  const raciRows: RaciRow[] = parseLines(A(11, /RACI/i)).map((l) => {
    const c = cells(l);
    const r: RaciRow = { activity: c[0], R: roles(c[1] ?? ""), A: roles(c[2] ?? ""), C: roles(c[3] ?? ""), I: roles(c[4] ?? ""), flags: [] };
    if (r.A.length === 0) r.flags.push("No Accountable");
    if (r.A.length > 1) r.flags.push("More than one Accountable");
    if (r.R.length === 0) r.flags.push("No Responsible");
    return r;
  });
  const allRoles = [...new Set(raciRows.flatMap((r) => [...r.R, ...r.A, ...r.C, ...r.I]))].sort();
  const raciText = norm(raciRows.map((r) => r.activity).join(" "));
  const uncovered = workstreams.filter((w) => !raciText.includes(norm(w.name).split(" ")[0] ?? "~")).map((w) => w.name);

  // KPIs
  const kpis: Kpi[] = parseLines(A(15, /KPIs/i)).map((l) => {
    const c = cells(l);
    const k: Kpi = { name: c[0], baseline: c[1] ?? "", target: c[2] ?? "", formula: c[3] ?? "", owner: nk(c[4] ?? "") ? "" : c[4], cadence: c[5] ?? "", status: statusOf(c[6] ?? ""), flags: [] };
    if (!k.baseline) k.flags.push("No baseline");
    else if (/not known/i.test(k.baseline)) k.flags.push("Baseline not known");
    if (!k.target) k.flags.push("No target");
    if (!k.formula) k.flags.push("No formula");
    if (!k.owner) k.flags.push("No owner");
    if (!k.cadence) k.flags.push("No cadence");
    if (k.status === "Not stated") k.flags.push("Benefit status not stated");
    return k;
  });
  const benefitCounts: Record<string, number> = { forecast: 0, approved: 0, validated: 0, realised: 0, sustained: 0, "Not stated": 0 };
  for (const k of kpis) benefitCounts[k.status]++;

  // Roadmap
  const roadmapNotes: string[] = [];
  const roadmap: RoadItem[] = parseLines(A(16, /Roadmap and milestones/i)).map((l, i) => {
    const c = cells(l);
    const s = parseWhen(c[3] ?? ""), e = parseWhen(c[4] ?? "");
    const it: RoadItem = {
      id: `R${i + 1}`, phase: c[0], activity: c[1] ?? "", owner: nk(c[2] ?? "") ? "" : c[2], start: c[3] ?? "", end: c[4] ?? "",
      startDay: s.day, endDay: e.day, kind: s.kind, horizon: "", milestone: c[5] ?? "", dependsOn: c[6] ?? "", gate: c[7] ?? "", flags: [],
    };
    it.horizon = it.startDay !== null && s.kind === "relative" ? bucketFor(it.startDay) : it.startDay !== null ? "Dated" : "Not dated";
    if (!it.owner) it.flags.push("No owner");
    if (!it.milestone) it.flags.push("No milestone");
    if (s.day === null || e.day === null) it.flags.push("Dates missing or not understood");
    else if (e.day < s.day) it.flags.push("Ends before it starts");
    if (s.kind !== e.kind && s.kind !== "none" && e.kind !== "none") it.flags.push("Mixes dates and relative days");
    return it;
  });
  const idxs = new Set(roadmap.map((r) => r.id));
  for (const r of roadmap) {
    const refs = r.dependsOn.match(/R\d+/gi) ?? [];
    for (const ref of refs) if (!idxs.has(ref.toUpperCase())) r.flags.push(`Depends on unknown ${ref.toUpperCase()}`);
  }
  const kinds = new Set(roadmap.filter((r) => r.kind !== "none").map((r) => r.kind));
  if (kinds.size > 1) roadmapNotes.push("The roadmap mixes calendar dates and relative days (Day, Week, Month), so it cannot be sorted into one timeline. Items are shown in the order entered. Use one style throughout.");
  if (roadmap.length && roadmap.every((r) => r.startDay === null)) roadmapNotes.push("No roadmap item has a usable start date, so no timeline can be drawn.");
  if (roadmap.length === 0) roadmapNotes.push("No roadmap was provided.");

  // Risks
  const lv = (s: string) => (/^h/i.test(s) ? 3 : /^m/i.test(s) ? 2 : /^l/i.test(s) ? 1 : 0);
  const risks: PBRisk[] = parseLines(A(14, /Risks, dependencies, controls/i)).map((l) => {
    const c = cells(l);
    const p = lv(c[1] ?? "") * lv(c[2] ?? "");
    return { text: c[0], likelihood: c[1] ?? "", impact: c[2] ?? "", counter: c[3] ?? "", owner: c[4] ?? "", rating: p >= 6 ? "High" : p >= 3 ? "Medium" : p >= 1 ? "Low" : "Not rated" };
  });

  // Governance
  const forums: Forum[] = parseLines(A(17, /Governance calendar/i)).map((l) => {
    const c = cells(l);
    const cad = (c[1] ?? "").toLowerCase();
    return { forum: c[0], cadence: c[1] ?? "", attendees: c[2] ?? "", purpose: c[3] ?? "", kind: /week/.test(cad) ? "Weekly" : /month/.test(cad) ? "Monthly" : /quarter/.test(cad) ? "Quarterly" : "Other" };
  });
  const governanceCovers = { weekly: forums.some((f) => f.kind === "Weekly"), monthly: forums.some((f) => f.kind === "Monthly"), quarterly: forums.some((f) => f.kind === "Quarterly") };

  // Completion gates
  const gates: CompletionGate[] = parseLines(A(18, /Completion gates/i)).map((l) => {
    const c = cells(l);
    const st = (c[3] ?? "").toLowerCase();
    const g: CompletionGate = { gate: c[0], evidence: c[1] ?? "", owner: c[2] ?? "", status: /^met|yes|done|pass/.test(st) ? "Met" : /open|no\b|not met|pending/.test(st) ? "Open" : "Not stated", flags: [] };
    if (!g.evidence) g.flags.push("No evidence defined");
    if (g.status === "Not stated") g.flags.push("Status not stated");
    return g;
  });
  const gStated = gates.filter((g) => g.status !== "Not stated");
  const gatesMetPct = gStated.length ? Math.round((gStated.filter((g) => g.status === "Met").length / gStated.length) * 100) : null;

  // Budget
  const resources = A(12, /Resources, technology/i);
  const budget = { stated: /approved|not known|\d/i.test(resources), note: resources ? (/approved|not known|\d/i.test(resources) ? "Budget is stated as approved, a figure or Not known." : "Budget status is not stated. Write it as approved or Not known; never assume.") : "Not recorded." };

  // Mobilisation checks (reports, never approves)
  const dupA = raciRows.filter((r) => r.flags.some((f) => /Accountable|Responsible/.test(f)));
  const incompleteSteps = steps.filter((s) => s.flags.some((f) => /^No (method|output|validation)/.test(f)));
  const kpiGaps = kpis.filter((k) => k.flags.some((f) => /^No (baseline|target|formula|owner|cadence)/.test(f)));
  const roadOwnerless = roadmap.filter((r) => r.flags.some((f) => /No owner|No milestone|Ends before/.test(f)));
  const checks: Check[] = [
    { id: "M1", label: "Approved problem, solution and sponsor are recorded", met: premise.slice(0, 3).every((p) => p.ok), detail: "Section 5." },
    { id: "M2", label: "Readiness items are listed and none is Not ready", met: readinessItems.length > 0 && !readinessItems.some((r) => r.status === "Not ready"), detail: readinessItems.length ? `${readyPct ?? 0}% of stated items Ready.` : "No readiness items." },
    { id: "M3", label: "Every workstream has an owner and a stage gate", met: workstreams.length > 0 && workstreams.every((w) => w.owner && w.gate), detail: `${workstreams.filter((w) => !w.owner || !w.gate).length} of ${workstreams.length} incomplete.` },
    { id: "M4", label: "Every step has a method, an output and a validation", met: steps.length > 0 && incompleteSteps.length === 0, detail: steps.length ? `${incompleteSteps.length} of ${steps.length} incomplete.` : "No steps." },
    { id: "M5", label: "Every RACI row has one Accountable and at least one Responsible", met: raciRows.length > 0 && dupA.length === 0, detail: raciRows.length ? `${dupA.length} of ${raciRows.length} rows need fixing.` : "No RACI rows." },
    { id: "M6", label: "Every KPI has a baseline, target, formula, owner and cadence", met: kpis.length > 0 && kpiGaps.length === 0, detail: kpis.length ? `${kpiGaps.length} of ${kpis.length} incomplete.` : "No KPIs." },
    { id: "M7", label: "The roadmap has owners, milestones and consistent dates", met: roadmap.length > 0 && roadOwnerless.length === 0, detail: roadmap.length ? `${roadOwnerless.length} of ${roadmap.length} items need fixing.` : "No roadmap." },
    { id: "M8", label: "Governance covers weekly, monthly and quarterly forums", met: governanceCovers.weekly && governanceCovers.monthly && governanceCovers.quarterly, detail: `Weekly ${governanceCovers.weekly ? "yes" : "no"}, monthly ${governanceCovers.monthly ? "yes" : "no"}, quarterly ${governanceCovers.quarterly ? "yes" : "no"}.` },
    { id: "M9", label: "At least five risks have counter-actions", met: risks.filter((r) => r.counter).length >= 5, detail: `${risks.filter((r) => r.counter).length} risks with a counter-action.` },
    { id: "M10", label: "Completion gates are defined with evidence", met: gates.length >= 3 && gates.every((g) => g.evidence), detail: `${gates.length} gates defined.` },
  ];
  const openChecks = checks.filter((c) => !c.met).length;

  return {
    premise, readiness: { items: readinessItems, readyPct }, workstreams, steps, raci: { rows: raciRows, roles: allRoles, uncovered },
    kpis, benefitCounts, roadmap, roadmapNotes, risks, forums, governanceCovers, gates, gatesMetPct, budget,
    checks, openChecks, mobilisation: openChecks === 0 ? "Ready to mobilise" : "Not ready",
  };
}
