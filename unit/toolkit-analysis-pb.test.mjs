// Run: node --test unit/toolkit-analysis-pb.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTemplateBlueprint, validateBlueprint } from "../src/lib/toolkit/engine.ts";
import { analysePlaybook, parseWhen, bucketFor } from "../src/lib/toolkit/analysis-pb.ts";
import { PLAYBOOK_TEMPLATES } from "../src/lib/toolkit/methods.ts";

const bp = buildTemplateBlueprint({ type: "PLAYBOOK", industry: "Retail", topic: "Replenishment redesign" });
const field = (seq, re) => bp.sections.find((s) => s.seq === seq).fields.find((f) => re.test(f.label));
const fill = (spec) => {
  const r = {};
  for (const [seq, re, value, provenance = "Client-entered"] of spec) {
    const f = field(seq, re);
    assert.ok(f, `field missing: ${seq} ${re}`);
    r[f.id] = { fieldId: f.id, value, provenance };
  }
  return r;
};
const run = (r) => analysePlaybook(bp, r);

const FULL = [
  [5, /Approved problem/, "Stock-outs and aged stock"], [5, /Approved solution/, "Central replenishment planning"], [5, /Sponsor/, "Managing Director"],
  [6, /Outcomes/, "Stock-outs down 30 percent by December"], [6, /Scope and exclusions/, "All stores; excludes e-commerce"],
  [8, /Readiness/, "Item master cleaned | Ready | Data lead\nPlanning tool licence | Ready | IT head"],
  [9, /Workstreams/, "Planning rules | set reorder rules | Supply head | none | rules signed off\nSystem set-up | configure tool | IT head | W1 | UAT passed"],
  [10, /Implementation steps/, "Agree reorder rules | workshop | rules document | sign-off by MD | Supply head | W1\nConfigure the tool | vendor build | live config | UAT passed | IT head | W2"],
  [11, /RACI/, "Agree reorder rules | Supply head | Managing Director | Finance | Stores\nConfigure the tool | IT head | IT head | Supply head | Stores"],
  [12, /Resources/, "Budget approved at 15 lakh"],
  [14, /Risks, dependencies/, "Vendor delay | Medium | High | agree penalty clause | IT head\nData errors | High | Medium | weekly data audit | Data lead\nStore pushback | Medium | Medium | store champions | Ops head\nStaff turnover | Low | Medium | cross-train | HR head\nBudget overrun | Low | High | monthly review | Finance"],
  [15, /KPIs/, "Stock-out rate | 12 percent | 8 percent | stock-out days / selling days | Supply head | weekly | forecast\nAged stock share | 38 percent | 20 percent | stock over 180 days / total | Finance | monthly | approved"],
  [16, /Roadmap and milestones/, "Phase 1 | Agree rules | Supply head | Day 1 | Day 30 | Rules signed | none | Gate 1\nPhase 2 | Configure tool | IT head | Day 31 | Day 75 | UAT passed | R1 | Gate 2"],
  [17, /Governance calendar/, "Stand-up | weekly | owners | progress\nSteering | monthly | sponsor, owners | decisions\nReview | quarterly | board | benefits"],
  [18, /Completion gates/, "Rules live in all stores | rules report | Supply head | Open\nStock-out target met | KPI report | Finance | Open\nHandover to operations | sign-off | Ops head | Open"],
];

test("the Playbook blueprint with the new roadmap field is valid", () => {
  assert.deepEqual(validateBlueprint(bp), []);
  assert.ok(field(16, /Roadmap and milestones/));
});

test("parseWhen understands ISO dates, dd-mm-yyyy, and relative days/weeks/months", () => {
  assert.equal(parseWhen("Day 30").day, 30);
  assert.equal(parseWhen("Week 6").day, 42);
  assert.equal(parseWhen("Month 2").day, 60);
  assert.equal(parseWhen("2026-02-15").kind, "date");
  assert.equal(parseWhen("15/02/2026").day, parseWhen("2026-02-15").day);
  assert.equal(parseWhen("soon").day, null);
  assert.equal(parseWhen("Not known").day, null);
});

test("horizon buckets follow 30 / 60 / 90 / 180 days", () => {
  assert.deepEqual([0, 30, 31, 60, 90, 91, 180, 181, null].map(bucketFor),
    ["Days 0-30", "Days 0-30", "Days 31-60", "Days 31-60", "Days 61-90", "Days 91-180", "Days 91-180", "Beyond day 180", "Not dated"]);
});

test("a complete Playbook passes every mobilisation check, but the report never approves anything", () => {
  const a = run(fill(FULL));
  assert.equal(a.openChecks, 0, a.checks.filter((c) => !c.met).map((c) => c.id + " " + c.detail).join("; "));
  assert.equal(a.mobilisation, "Ready to mobilise");
  assert.equal(a.workstreams.length, 2);
  assert.equal(a.workstreams[1].dependsOn[0], "W1");
  assert.equal(a.workstreams[0].stepCount, 1);
});

test("an empty Playbook is Not ready and invents nothing", () => {
  const a = run({});
  assert.equal(a.mobilisation, "Not ready");
  assert.equal(a.openChecks, a.checks.length);
  assert.equal(a.workstreams.length + a.steps.length + a.kpis.length + a.roadmap.length, 0);
  assert.equal(a.gatesMetPct, null);
  assert.equal(a.readiness.readyPct, null);
});

test("RACI flags no Accountable, several Accountable, and no Responsible", () => {
  const a = run(fill([[11, /RACI/, "A | Ops | | | \nB | Ops | MD, CFO | |\nC | | MD | |\nD | Ops | MD | |"]]));
  const f = Object.fromEntries(a.raci.rows.map((r) => [r.activity, r.flags]));
  assert.ok(f.A.includes("No Accountable"));
  assert.ok(f.B.includes("More than one Accountable"));
  assert.ok(f.C.includes("No Responsible"));
  assert.deepEqual(f.D, []);
  assert.equal(a.checks.find((c) => c.id === "M5").met, false);
});

test("steps missing method, output, validation or owner are flagged; unknown workstreams are caught", () => {
  const a = run(fill([[9, /Workstreams/, "Alpha | s | owner | none | g"], [10, /Implementation steps/, "Do X | | | | | W1\nDo Y | m | o | v | Priya | W9"]]));
  assert.deepEqual(a.steps[0].flags.sort(), ["No method", "No output", "No owner", "No validation"].sort());
  assert.ok(a.steps[1].flags.includes("Unknown workstream W9"));
  assert.equal(a.checks.find((c) => c.id === "M4").met, false);
});

test("KPIs: missing pieces flagged, Not known baseline flagged, benefit status counted separately and never upgraded", () => {
  const a = run(fill([[15, /KPIs/, "A | Not known | 5 | f | me | weekly | forecast\nB | 10 | | f | me | weekly | realised\nC | 1 | 2 | f | me | monthly"]]));
  assert.ok(a.kpis[0].flags.includes("Baseline not known"));
  assert.ok(a.kpis[1].flags.includes("No target"));
  assert.ok(a.kpis[2].flags.includes("Benefit status not stated"));
  assert.equal(a.benefitCounts.forecast, 1);
  assert.equal(a.benefitCounts.realised, 1);
  assert.equal(a.benefitCounts["Not stated"], 1);
});

test("roadmap: ends-before-starts, missing owner/milestone, undated items and bad dependencies are flagged", () => {
  const a = run(fill([[16, /Roadmap and milestones/, "P1 | A | | Day 50 | Day 10 | | none | \nP2 | B | Priya | soon | later | Done | R9 | "]]));
  assert.ok(a.roadmap[0].flags.includes("Ends before it starts"));
  assert.ok(a.roadmap[0].flags.includes("No owner"));
  assert.ok(a.roadmap[0].flags.includes("No milestone"));
  assert.ok(a.roadmap[1].flags.includes("Dates missing or not understood"));
  assert.ok(a.roadmap[1].flags.includes("Depends on unknown R9"));
  assert.equal(a.roadmap[0].horizon, "Days 31-60");
});

test("governance must cover weekly, monthly and quarterly", () => {
  const a = run(fill([[17, /Governance calendar/, "Stand-up | every week | owners | progress\nBoard | quarterly | board | benefits"]]));
  assert.deepEqual(a.governanceCovers, { weekly: true, monthly: false, quarterly: true });
  assert.equal(a.checks.find((c) => c.id === "M8").met, false);
});

test("completion gates: percent met uses only stated statuses; a gate with no evidence is flagged", () => {
  const a = run(fill([[18, /Completion gates/, "G1 | evidence | me | Met\nG2 | | me | Open\nG3 | e | me |"]]));
  assert.equal(a.gatesMetPct, 50);
  assert.ok(a.gates[1].flags.includes("No evidence defined"));
  assert.ok(a.gates[2].flags.includes("Status not stated"));
});

test("readiness percentage ignores items with no stated status and any Not ready blocks mobilisation", () => {
  const a = run(fill(FULL.concat([[8, /Readiness/, "A | Ready | x\nB | Not ready | y\nC | | z"]])));
  assert.equal(a.readiness.readyPct, 50);
  assert.equal(a.checks.find((c) => c.id === "M2").met, false);
});

test("budget must be stated as approved, a figure or Not known; never assumed", () => {
  assert.equal(run(fill([[12, /Resources/, "Some tools and people"]])).budget.stated, false);
  assert.equal(run(fill([[12, /Resources/, "Budget: Not known"]])).budget.stated, true);
});

test("premise checks need a sponsor and measurable outcomes", () => {
  const a = run(fill([[5, /Approved problem/, "p"], [5, /Approved solution/, "s"], [6, /Outcomes/, "Improve things"]]));
  assert.equal(a.premise.find((p) => /sponsor/i.test(p.label)).ok, false);
  assert.equal(a.premise.find((p) => /Measurable/.test(p.label)).ok, false);
});

test("templates are complete blank worksheets", () => {
  assert.ok(PLAYBOOK_TEMPLATES.length >= 8);
  for (const t of PLAYBOOK_TEMPLATES) {
    assert.ok(t.headers.length >= 2 && t.rows.length >= 2, t.name);
    assert.ok(t.rows.every((r) => r.length === t.headers.length), t.name + " row widths");
  }
});

test("a roadmap that mixes dates and relative days is flagged and not silently sorted", () => {
  const a = run(fill([[16, /Roadmap and milestones/, "P1 | A | me | 2026-11-16 | 2026-12-11 | m | none | g\nP2 | B | me | Month 5 | Month 6 | m | R1 | g"]]));
  assert.ok(a.roadmapNotes.some((n) => /mixes calendar dates/.test(n)));
  assert.equal(a.roadmap[0].kind, "date");
  assert.equal(a.roadmap[1].kind, "relative");
});
