// Run: node --test unit/toolkit-analysis-ps.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTemplateBlueprint, validateBlueprint } from "../src/lib/toolkit/engine.ts";
import { analyseProblemSolving, parseLines, DEFAULT_CRITERIA } from "../src/lib/toolkit/analysis-ps.ts";
import { METHOD_CARDS } from "../src/lib/toolkit/methods.ts";

const bp = buildTemplateBlueprint({ type: "PROBLEM_SOLVING", industry: "Manufacturing", topic: "Scrap" });
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
const run = (r) => analyseProblemSolving(bp, r);

test("the blueprint with the new structured fields is still valid", () => {
  assert.deepEqual(validateBlueprint(bp), []);
  assert.ok(field(11, /Validation results/));
  assert.ok(field(14, /Option scores/));
  assert.ok(field(16, /^Decision$/));
});

test("parseLines strips bullets and numbering and drops blanks", () => {
  assert.deepEqual(parseLines("1. one\n- two\n\n* three"), ["one", "two", "three"]);
});

test("hypotheses are Untested by default and flag missing counter-evidence and tests", () => {
  const a = run(fill([[10, /Hypotheses/, "Worn tooling | scrap spikes after tool change | | | High\nBad resin lot | batch dates match"]]));
  assert.equal(a.hypotheses.length, 2);
  assert.ok(a.hypotheses.every((h) => h.status === "Untested"));
  assert.equal(a.hypotheses[0].confidence, "High");
  assert.ok(a.hypotheses[0].flags.includes("Counter-evidence not recorded"));
  assert.ok(a.hypotheses[1].flags.includes("No test defined"));
  assert.equal(a.counts.untested, 2);
});

test("validation results update status; 'Validated' without evidence is flagged", () => {
  const a = run(fill([
    [10, /Hypotheses/, "A | for | against | test | Medium\nB | for | against | test | Low\nC | x | y | z | Low"],
    [11, /Validation results/, "H1 | Validated | SPC chart shows shift\nH2 | Rejected | lots were clean\nH3 | Validated"],
  ]));
  assert.deepEqual(a.hypotheses.map((h) => h.status), ["Validated", "Rejected", "Validated"]);
  assert.ok(a.hypotheses[2].flags.some((f) => /no evidence/.test(f)));
  assert.equal(a.counts.validated, 2);
});

test("weighted options appraisal: ranks by weighted score and excludes unknowns instead of using zero", () => {
  const a = run(fill([
    [13, /Option longlist/, "Retool\nChange supplier\nAdd inspection\nTrain operators\nDo nothing"],
    [14, /criteria and weights/, "Impact | 50\nCost | 30\nRisk | 20"],
    [14, /Option scores/, "O1 | 5,2,3\nChange supplier | 3,4,?\nO3 | 4,4,4"],
  ]));
  const r = Object.fromEntries(a.options.rows.map((x) => [x.id, x]));
  assert.equal(r.O1.weighted, 3.7);   // (5*50+2*30+3*20)/100 = 370/100
  assert.equal(r.O3.weighted, 4);
  assert.equal(r.O3.rank, 1);
  assert.equal(r.O2.weighted, 3.38);  // unknown excluded: (3*50+4*30)/80 = 3.375
  assert.equal(r.O2.coverage, 80);
  assert.equal(r.O4.weighted, null);  // never scored: not ranked, not zero
  assert.ok(r.O4.flags.includes("No scores entered"));
  assert.equal(a.topOption.id, "O3");
});

test("criteria weights that do not total 100 are rescaled and flagged", () => {
  const a = run(fill([[13, /Option longlist/, "A\nB"], [14, /criteria and weights/, "X | 30\nY | 30"], [14, /Option scores/, "A | 5,5\nB | 1,1"]]));
  assert.equal(a.criteria[0].weight, 50);
  assert.ok(a.criteriaNotes.some((n) => /not 100/.test(n)));
});

test("with no criteria entered, a proposed default set is used and labelled proposed", () => {
  const a = run(fill([[13, /Option longlist/, "A\nB"]]));
  assert.equal(a.criteria.length, DEFAULT_CRITERIA.length);
  assert.ok(a.criteria.every((c) => c.proposed));
  assert.equal(Math.round(a.criteria.reduce((s, c) => s + c.weight, 0)), 100);
});

test("sensitivity: flags when the top option changes under equal weights, and close calls", () => {
  const a = run(fill([
    [13, /Option longlist/, "A\nB"],
    [14, /criteria and weights/, "Impact | 90\nCost | 10"],
    [14, /Option scores/, "A | 5,1\nB | 3,5"],
  ]));
  assert.equal(a.topOption.name, "A");   // 4.6 vs 3.2 under given weights
  assert.equal(a.topStable, false);       // equal weights: A=3.0, B=4.0
  const b = run(fill([[13, /Option longlist/, "A\nB"], [14, /criteria and weights/, "X | 50\nY | 50"], [14, /Option scores/, "A | 4,4\nB | 4,4"]]));
  assert.equal(b.closeCall, true);
});

test("fewer than five distinct options is flagged", () => {
  const a = run(fill([[13, /Option longlist/, "Retool\nretool\nTrain"]]));
  assert.equal(a.options.distinct, 2);
  assert.ok(a.options.notes.some((n) => /wide longlist/.test(n)));
});

test("the decision gate stays open until every condition is met, and never approves on its own", () => {
  const empty = run({});
  assert.equal(empty.readiness, "Not ready");
  assert.ok(empty.openGates >= 4);

  const full = run(fill([
    [5, /Problem owner/, "Plant head"], [5, /Scope and boundary/, "Line 2 only"],
    [6, /Problem statement/, "Scrap on line 2 rose from 3 percent to 8 percent between March and June, costing margin and delaying customer orders."],
    [6, /Success criteria/, "Scrap at or below 4 percent by 30 September"],
    [7, /Baseline and impact/, "8 percent scrap, Q2"],
    [10, /Hypotheses/, "Worn tooling | f | a | t | High"],
    [11, /Validation results/, "H1 | Validated | tool wear log"],
    [12, /Solution principles/, "Budget cap, no downtime"],
    [13, /Option longlist/, "Retool\nTrain"],
    [14, /Option scores/, "O1 | 4,4,4,4,4,4\nO2 | 2,3,3,3,3,3"],
    [16, /Recommended solution/, "Retool line 2"],
    [16, /^Decision$/, "Approve"], [16, /Decision owner/, "Managing Director"], [16, /Decision rationale/, "Highest weighted score and addresses the validated cause"],
    [18, /Risks, assumptions/, "Supplier delay | Medium | High | order early"],
  ]));
  assert.equal(full.openGates, 0);
  assert.equal(full.readiness, "Ready to hand over to a Playbook");

  // Same record but decision deferred: gate 6 not applicable, and never "Ready"
  const deferred = run({ ...fill([[16, /^Decision$/, "Defer"], [16, /Decision owner/, "MD"]]) });
  assert.equal(deferred.readiness, "Not ready");
});

test("a no-go decision satisfies the recommendation gate without a solution", () => {
  const a = run(fill([[16, /^Decision$/, "No-go (do not proceed)"], [16, /Decision owner/, "MD"]]));
  assert.equal(a.gates.find((g) => g.id === "G4").met, true);
  assert.equal(a.readiness, "Not ready");
});

test("risk register rates by likelihood x impact and leaves unrated rows honest", () => {
  const a = run(fill([[18, /Risks, assumptions/, "Key supplier fails | High | High | second source\nStaff turnover | Low | Low | \nVague worry"]]));
  assert.deepEqual(a.risks.map((r) => r.rating), ["High", "Low", "Not rated"]);
});

test("pilot design checks find scale, duration, success measure and stop rule only when present", () => {
  const none = run(fill([[15, /Pilot design/, "We will try it and see."]]));
  assert.equal(none.pilotChecks.filter((c) => c.found).length, 0);
  const all = run(fill([[15, /Pilot design/, "Run on 2 stores for 6 weeks. Success is stock-outs down 30%. Stop if stock-outs rise two weeks in a row."]]));
  assert.equal(all.pilotChecks.every((c) => c.found), true);
});

test("issue tree keeps depth and flags a thin or overlapping tree", () => {
  const a = run(fill([[8, /Issue tree/, "Price\n  Discounting\nVolume\nVolume"]]));
  assert.equal(a.tree.branches, 3);
  assert.ok(a.tree.notes.some((n) => /appears more than once/.test(n)));
  assert.equal(a.tree.nodes[1].depth, 1);
});

test("method cards are complete: steps, errors, illustration labelled as not client data, blank worksheet", () => {
  assert.ok(METHOD_CARDS.length >= 10);
  for (const m of METHOD_CARDS) {
    assert.ok(m.steps.length >= 4, m.name);
    assert.ok(m.commonErrors.length >= 2, m.name);
    assert.ok(m.worksheet.headers.length >= 2 && m.worksheet.rows.length >= 2, m.name);
    assert.match(m.illustration, /Illustration only/, m.name);
    assert.ok(m.whenToUse && m.whenNotToUse, m.name);
  }
});

test("option scores match by partial name, so 'Change supplier' finds 'Change resin supplier'", () => {
  const a = run(fill([
    [13, /Option longlist/, "Change resin supplier\nRetool"],
    [14, /criteria and weights/, "X | 50\nY | 50"],
    [14, /Option scores/, "Change supplier | 4,4\nRetool | 2,2"],
  ]));
  assert.equal(a.options.rows[0].weighted, 4);
  assert.equal(a.options.rows[1].weighted, 2);
});
