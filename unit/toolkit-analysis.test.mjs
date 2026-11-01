// Run: node --test unit/toolkit-analysis.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTemplateBlueprint, scoreDiagnostic } from "../src/lib/toolkit/engine.ts";
import { analyseDiagnostic, TARGET_LEVEL, GOVERNANCE_CALENDAR } from "../src/lib/toolkit/analysis.ts";

const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Manufacturing", topic: "Working capital" });
const qs = bp.sections.flatMap((s) => s.fields).filter((f) => f.module);
const byModule = (m) => qs.filter((q) => q.module === m.id);
const run = (r) => analyseDiagnostic(bp, r, scoreDiagnostic(bp, r));
const answer = (map, q, value, provenance = "Client-entered") => { map[q.id] = { fieldId: q.id, value, provenance }; };

function scenario() {
  const r = {};
  const [m1, m2, m3] = bp.modules;
  byModule(m1).forEach((q) => answer(r, q, 1));      // weak
  byModule(m2).forEach((q) => answer(r, q, 2));      // developing
  byModule(m3).forEach((q) => answer(r, q, 4));      // strong
  return { r, m1, m2, m3 };
}

test("gaps are ranked by weight x gap and strong dimensions are not in the plan", () => {
  const { r, m1, m3 } = scenario();
  const a = run(r);
  const g1 = a.gaps.find((g) => g.moduleId === m1.id);
  assert.equal(g1.gap, TARGET_LEVEL - 1);
  assert.equal(g1.rank, 1);
  assert.equal(a.gaps.find((g) => g.moduleId === m3.id).rank, null);
  assert.ok(!a.initiatives.some((i) => i.moduleId === m3.id));
});

test("findings come only from weak answers and are never confirmed causes", () => {
  const { r, m1, m2 } = scenario();
  const a = run(r);
  assert.equal(a.findings.length, byModule(m1).length + byModule(m2).length);
  assert.ok(a.findings.every((f) => f.score <= 2 && f.status === "Unvalidated hypothesis"));
  assert.ok(a.findings.every((f) => f.confidence !== "High"), "confidence is never High automatically");
  assert.equal(a.findings[0].score, 1, "most severe first");
  assert.ok(a.findings.every((f) => /^F\d{2,}$/.test(f.id)));
});

test("Not known is an evidence gap, never a zero score", () => {
  const { r, m1 } = scenario();
  const q = byModule(m1)[0];
  r[q.id] = { fieldId: q.id, value: null, provenance: "Not-known" };
  const a = run(r);
  assert.ok(a.evidenceGaps.some((g) => g.questionId === q.id && g.reason === "Not known"));
  assert.ok(!a.findings.some((f) => f.questionId === q.id));
  const row = a.gaps.find((g) => g.moduleId === m1.id);
  assert.equal(row.score, 1, "score is the average of answered questions only");
});

test("unanswered questions are reported as gaps and lower evidence coverage", () => {
  const { r } = scenario();
  const full = run(r);
  const partial = run({ ...r, [qs[0].id]: undefined });
  assert.ok(partial.evidenceCoverage < full.evidenceCoverage || partial.evidenceGaps.length > full.evidenceGaps.length);
});

test("initiatives are waved by priority, link to findings, and assume no owner or money", () => {
  const { r, m1 } = scenario();
  const a = run(r);
  const first = a.initiatives[0];
  assert.equal(first.moduleId, m1.id);
  assert.equal(first.wave, 1);
  assert.equal(first.horizon, "Days 0-30");
  assert.ok(first.findingIds.length > 0 && first.steps.length >= 5);
  const text = JSON.stringify(a.initiatives);
  assert.ok(!/(?:₹|Rs\.?|INR|\$)\s?\d/.test(text), "no invented money values");
  assert.ok(!/owner:\s*[A-Z][a-z]+ [A-Z]/.test(text), "no invented named owners");
});

test("decisions ask for owners, validation and gap closure; AI drafts are flagged", () => {
  const { r } = scenario();
  const q = qs[0];
  r[q.id] = { fieldId: q.id, value: 2, provenance: "AI-suggested" };
  const a = run(r);
  const joined = a.decisions.join(" | ");
  assert.match(joined, /accountable owner/);
  assert.match(joined, /validation|tested/i);
  assert.equal(a.aiUnconfirmed, 1);
  assert.match(joined, /AI-suggested/);
});

test("issue tree lists only Red/Amber dimensions with hypothesis leaves", () => {
  const { r, m1, m2, m3 } = scenario();
  const a = run(r);
  const ids = a.tree.map((t) => t.moduleId);
  assert.ok(ids.includes(m1.id) && ids.includes(m2.id) && !ids.includes(m3.id));
  assert.ok(a.tree[0].causes.length > 0);
});

test("an empty form does not crash and produces no findings or initiatives", () => {
  const a = run({});
  assert.equal(a.findings.length, 0);
  assert.equal(a.initiatives.length, 0);
  assert.equal(a.overall, null);
  assert.ok(a.evidenceGaps.length > 0);
});

test("governance calendar has weekly, monthly and quarterly rhythms", () => {
  assert.deepEqual(GOVERNANCE_CALENDAR.map((g) => g.cadence), ["Weekly", "Monthly", "Quarterly"]);
});
