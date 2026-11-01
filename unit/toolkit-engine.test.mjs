// Run: node --test unit/
import test from "node:test";
import assert from "node:assert/strict";
import {
  routeKit, CANONICAL, buildTemplateBlueprint, validateBlueprint,
  overallProgress, sectionProgress, scoreDiagnostic, KIT_LABEL, withDiagnosticModules,
} from "../src/lib/toolkit/engine.ts";

// ── Routing: the four quadrants (skill s2.4 / s19) ─────────────────────────
test("Q1 unclear+unclear -> Diagnostic", () => {
  const r = routeKit({ problemClarity: "unclear", solutionClarity: "unclear" });
  assert.equal(r.type, "DIAGNOSTIC"); assert.equal(r.quadrant, "Q1");
});
test("Q2 unclear+clear -> premise-validation Diagnostic", () => {
  const r = routeKit({ problemClarity: "unclear", solutionClarity: "clear" });
  assert.equal(r.type, "DIAGNOSTIC"); assert.equal(r.quadrant, "Q2");
  assert.match(r.label, /premise validation/);
});
test("Q3 clear+unclear -> Problem-Solving", () => {
  const r = routeKit({ problemClarity: "clear", solutionClarity: "unclear" });
  assert.equal(r.type, "PROBLEM_SOLVING"); assert.equal(r.quadrant, "Q3");
});
test("Q4 clear+clear -> Playbook", () => {
  const r = routeKit({ problemClarity: "clear", solutionClarity: "clear" });
  assert.equal(r.type, "PLAYBOOK"); assert.equal(r.quadrant, "Q4");
});
test("learn/reference intent override the 2x2", () => {
  assert.equal(routeKit({ problemClarity: "clear", solutionClarity: "clear", intent: "learn" }).type, "LEARNING");
  assert.equal(routeKit({ problemClarity: "unclear", solutionClarity: "unclear", intent: "reference" }).type, "GUIDE");
});
test("unsure asks one clarifying question, never guesses", () => {
  const r = routeKit({ problemClarity: "unsure", solutionClarity: "clear" });
  assert.equal(r.type, null); assert.ok(r.clarifyingQuestion);
});
test("growth overlay flags growth path without replacing the route", () => {
  const r = routeKit({ problemClarity: "unclear", solutionClarity: "unclear", growth: true });
  assert.equal(r.type, "DIAGNOSTIC"); assert.equal(r.growthPath, true);
});

// ── Canonical contents: exact counts from the skill ────────────────────────
test("canonical section counts match the skill (20/19/20/18/15)", () => {
  assert.equal(CANONICAL.DIAGNOSTIC.length, 20);
  assert.equal(CANONICAL.PROBLEM_SOLVING.length, 19);
  assert.equal(CANONICAL.PLAYBOOK.length, 20);
  assert.equal(CANONICAL.GUIDE.length, 18);
  assert.equal(CANONICAL.LEARNING.length, 15);
});
test("every type starts with Cover Page; key anchors in exact position", () => {
  for (const t of Object.keys(CANONICAL)) assert.equal(CANONICAL[t][0].title, "Cover Page");
  assert.equal(CANONICAL.DIAGNOSTIC[9].title, "Diagnostic Modules and Assessment Forms");
  assert.equal(CANONICAL.DIAGNOSTIC[18].title, "Executive Recommendations and Decisions Required");
  assert.equal(CANONICAL.PROBLEM_SOLVING[15].title, "Recommended Solution and Decision Record");
  assert.equal(CANONICAL.PLAYBOOK[14].title, "KPI, Benefits Realisation and Performance Management");
});

// ── Blueprint ──────────────────────────────────────────────────────────────
for (const type of Object.keys(KIT_LABEL)) {
  test(`${type}: template blueprint validates, ids stable and unique`, () => {
    const bp = buildTemplateBlueprint({ type, industry: "Manufacturing", topic: "Scrap reduction" });
    assert.deepEqual(validateBlueprint(bp), []);
    const again = buildTemplateBlueprint({ type, industry: "Manufacturing", topic: "Scrap reduction" });
    assert.deepEqual(
      bp.sections.flatMap((s) => s.fields.map((f) => f.id)),
      again.sections.flatMap((s) => s.fields.map((f) => f.id)),
      "ids must be deterministic across builds",
    );
  });
}
test("diagnostic: module weights total 100 and questions carry module ids", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "Inventory accuracy" });
  assert.equal(bp.modules.reduce((a, m) => a + m.weight, 0), 100);
  const qs = bp.sections[9].fields;
  assert.ok(qs.length >= 30);
  assert.ok(qs.every((q) => q.module && q.type === "scale4"));
});
test("validateBlueprint catches tampered TOC and duplicate ids", () => {
  const bp = buildTemplateBlueprint({ type: "PLAYBOOK", industry: "Logistics", topic: "S&OP" });
  bp.sections[3].title = "Renamed";
  assert.ok(validateBlueprint(bp).some((e) => /must be/.test(e)));
  const bp2 = buildTemplateBlueprint({ type: "PLAYBOOK", industry: "Logistics", topic: "S&OP" });
  bp2.sections[4].fields.push({ ...bp2.sections[4].fields[0] });
  assert.ok(validateBlueprint(bp2).some((e) => /Duplicate/.test(e)));
});

// ── Progress + scoring ─────────────────────────────────────────────────────
test("progress counts Not-known as answered, empty string as unanswered", () => {
  const bp = buildTemplateBlueprint({ type: "PLAYBOOK", industry: "Retail", topic: "x" });
  const sec = bp.sections[4];
  const req = sec.fields.filter((f) => f.required);
  const r = {};
  r[req[0].id] = { fieldId: req[0].id, value: "   ", provenance: "Client-entered" };
  assert.equal(sectionProgress(sec, r).requiredAnswered, 0);
  r[req[0].id] = { fieldId: req[0].id, value: null, provenance: "Not-known" };
  assert.equal(sectionProgress(sec, r).requiredAnswered, 1);
});
test("readyToSubmit only when every required field answered", () => {
  const bp = buildTemplateBlueprint({ type: "GUIDE", industry: "Retail", topic: "x" });
  assert.equal(overallProgress(bp, {}).readyToSubmit, false);
  const all = {};
  for (const s of bp.sections) for (const f of s.fields) if (f.required) all[f.id] = { fieldId: f.id, value: "ok", provenance: "Client-entered" };
  assert.equal(overallProgress(bp, all).readyToSubmit, true);
});
test("scoreDiagnostic: Not-known excluded, never treated as zero", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "x" });
  const m1 = bp.sections[9].fields.filter((f) => f.module === "M1");
  const r = {};
  r[m1[0].id] = { fieldId: m1[0].id, value: 4, provenance: "Client-entered" };
  r[m1[1].id] = { fieldId: m1[1].id, value: 2, provenance: "Client-entered" };
  r[m1[2].id] = { fieldId: m1[2].id, value: null, provenance: "Not-known" };
  const s = scoreDiagnostic(bp, r);
  const mod = s.modules.find((m) => m.moduleId === "M1");
  assert.equal(mod.score, 3);          // (4+2)/2, unknown excluded
  assert.equal(mod.unknown, 1);
  assert.equal(mod.rag, "Green");
  assert.equal(s.modules.find((m) => m.moduleId === "M2").score, null); // unscored != 0
  assert.equal(s.overall, 3);
});
test("RAG thresholds", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "x" });
  const q = bp.sections[9].fields.find((f) => f.module === "M2");
  const mk = (v) => scoreDiagnostic(bp, { [q.id]: { fieldId: q.id, value: v, provenance: "Client-entered" } })
    .modules.find((m) => m.moduleId === "M2").rag;
  assert.equal(mk(1), "Red"); assert.equal(mk(2), "Amber"); assert.equal(mk(3), "Green");
});

// ── AI-proposed modules are sanitised and validated ───────────────────────
const goodMods = () => Array.from({ length: 5 }, (_, i) => ({
  name: `Dimension ${i + 1}`, purpose: "p",
  questions: Array.from({ length: 5 }, (_, k) => `How well is aspect ${k + 1} of dimension ${i + 1} managed today?`),
}));
test("withDiagnosticModules applies valid AI modules; weights total 100; TOC intact", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "x" });
  const out = withDiagnosticModules(bp, goodMods());
  assert.ok(out);
  assert.equal(out.modules.length, 5);
  assert.equal(out.modules.reduce((a, m) => a + m.weight, 0), 100);
  assert.deepEqual(validateBlueprint(out), []);
  assert.equal(out.sections.length, 20);
});
test("withDiagnosticModules rejects too few modules, duplicates, thin questions, wrong type", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "x" });
  assert.equal(withDiagnosticModules(bp, goodMods().slice(0, 3)), null);
  const dup = goodMods(); dup[1].name = dup[0].name;
  assert.equal(withDiagnosticModules(bp, dup), null);
  const thin = goodMods().map((m) => ({ ...m, questions: ["short", "tiny"] }));
  assert.equal(withDiagnosticModules(bp, thin), null);
  assert.equal(withDiagnosticModules(bp, "not an array"), null);
  const pb = buildTemplateBlueprint({ type: "PLAYBOOK", industry: "Retail", topic: "x" });
  assert.equal(withDiagnosticModules(pb, goodMods()), null);
});
test("withDiagnosticModules strips markup and control characters", () => {
  const bp = buildTemplateBlueprint({ type: "DIAGNOSTIC", industry: "Retail", topic: "x" });
  const m = goodMods(); m[0].name = "<script>alert(1)</script>Cash"; m[0].questions[0] = "How is <b>cash</b>  forecast each week by the team?";
  const out = withDiagnosticModules(bp, m);
  assert.ok(!/[<>]/.test(out.modules[0].name));
  assert.ok(!/[<> ]/.test(out.sections[9].fields[0].label));
});
