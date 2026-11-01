// Run: node --test unit/toolkit-analysis-lk.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTemplateBlueprint, validateBlueprint } from "../src/lib/toolkit/engine.ts";
import { analyseLearning, outcomeVerdict, MODULE_ELEMENTS } from "../src/lib/toolkit/analysis-lk.ts";

const bp = buildTemplateBlueprint({ type: "LEARNING", industry: "Manufacturing", topic: "Root cause analysis" });
const find = (seq, re) => bp.sections.find((s) => s.seq === seq).fields.find((f) => re.test(f.label));
const put = (r, seq, re, value, provenance = "Client-entered") => {
  const f = find(seq, re);
  assert.ok(f, `field missing: ${seq} ${re}`);
  r[f.id] = { fieldId: f.id, value, provenance };
};
const words = (n) => Array.from({ length: n }, (_, i) => "word" + i).join(" ");
const completeModule = (r, n, { actions = 6, extraWords = 0 } = {}) => {
  const v = {
    "Title": `Module ${n} title`, "Learning outcome": "Calculate the scrap rate for a line", "Business need": "Scrap costs margin",
    "Concept explained simply": words(300 + extraWords), "Analogy and technical explanation": words(200 + extraWords), "Named framework and supporting tools": "5 Whys; Pareto",
    "Worked example": "Illustrative: " + words(250 + extraWords), "Guided exercise (with hints)": words(100 + extraWords), "Teach-back prompt": "Explain 5 Whys to a colleague",
    "Knowledge check": "What is a Pareto chart? | Bars sorted by size\nWhen use 5 Whys? | Single event", "Action items": Array.from({ length: actions }, (_, i) => `Action ${i + 1}`).join("\n"),
    "Learner output": "A completed 5 Whys sheet",
  };
  for (const e of MODULE_ELEMENTS) put(r, 8, new RegExp(`^Module ${n} · ${e.replace(/[()]/g, "\\$&")}$`), v[e]);
};
const base = (r = {}) => {
  put(r, 4, /Expected outcomes/, "Calculate the scrap rate\nExplain a 5 Whys chain\nBuild a Pareto chart");
  put(r, 7, /Competency map/, "Root cause analysis | Practitioner | Review of a completed analysis");
  put(r, 11, /Assessment rubric/, "Accuracy | Numbers reconcile to source\nClarity | Another person can follow it\nEvidence | Each cause has data");
  put(r, 12, /Teach-back/, "Each learner explains the method to a colleague for 5 minutes");
  put(r, 13, /Transfer-to-work/, "Run a 5 Whys on one defect | Priya | 2026-12-05\nBuild a Pareto | Arun | 2026-12-12\nAgree a scrap target | MD | 2026-12-19\nTrain a shift | Ravi | 2027-01-09\nReview results | Priya | 2027-01-30");
  put(r, 14, /Facilitator or self-study/, "Run in four 2-hour sessions. Complete when every learner has produced the three outputs.");
  return r;
};
const run = (r) => analyseLearning(bp, r);

test("the Learning blueprint is valid, with five modules of twelve elements", () => {
  assert.deepEqual(validateBlueprint(bp), []);
  const fields = bp.sections.find((s) => s.seq === 8).fields;
  assert.equal(fields.length, 60);
  assert.equal(new Set(fields.map((f) => f.id)).size, 60);
});

test("outcomeVerdict accepts observable verbs and rejects vague ones", () => {
  assert.equal(outcomeVerdict("Calculate the scrap rate").ok, true);
  assert.equal(outcomeVerdict("Learners will be able to explain 5 Whys").ok, true);
  assert.equal(outcomeVerdict("Participants can calculate working capital").ok, true);
  assert.equal(outcomeVerdict("Learners will be able to understand 5 Whys").ok, false);
  assert.equal(outcomeVerdict("Understand root cause analysis").ok, false);
  assert.equal(outcomeVerdict("Be aware of Pareto").ok, false);
  assert.equal(outcomeVerdict("Flibber the widgets").ok, false);
});

test("a complete Learning Kit passes every check, and the report never certifies learning", () => {
  const r = base();
  completeModule(r, 1, { extraWords: 150 });
  const a = run(r);
  assert.equal(a.openChecks, 0, a.checks.filter((c) => !c.met).map((c) => c.id + " " + c.detail).join("; "));
  assert.equal(a.status, "Ready to release");
  assert.equal(a.usedModules, 1);
});

test("an empty kit is Not ready and invents nothing", () => {
  const a = run({});
  assert.equal(a.status, "Not ready");
  assert.equal(a.usedModules, 0);
  assert.equal(a.outcomes.length + a.rubric.length + a.transfer.length + a.knowledgeChecks.length, 0);
});

test("unused modules are ignored, and a half-filled module lists exactly what is missing", () => {
  const r = base();
  put(r, 8, /^Module 2 · Title$/, "Half a module");
  put(r, 8, /^Module 2 · Learning outcome$/, "Explain the idea");
  const a = run(r);
  assert.equal(a.modules[0].used, false);
  assert.equal(a.modules[1].used, true);
  assert.ok(a.modules[1].missing.includes("Teach-back prompt"));
  assert.ok(a.modules[1].missing.includes("Action items"));
  assert.equal(a.modules[1].missing.length, MODULE_ELEMENTS.length - 2);
  assert.equal(a.checks.find((c) => c.id === "L2").met, false);
});

test("action items must be five to seven", () => {
  for (const [n, ok] of [[4, false], [5, true], [7, true], [8, false]]) {
    const r = base();
    completeModule(r, 1, { actions: n });
    assert.equal(run(r).modules[0].actionCountOk, ok, `${n} actions`);
  }
});

test("module word count is measured and reported against the 800-word target", () => {
  const short = base(); completeModule(short, 1);
  const longer = base(); completeModule(longer, 1, { extraWords: 150 });
  const s = run(short).modules[0], l = run(longer).modules[0];
  assert.ok(s.contentWords > 0 && s.contentWords < 1000);
  assert.ok(l.contentWords > s.contentWords);
  assert.equal(l.shortFor800, l.contentWords < 800);
});

test("a knowledge check with no answer guidance is flagged and fails the check", () => {
  const r = base(); completeModule(r, 1);
  put(r, 8, /^Module 1 · Knowledge check$/, "A question with no guidance");
  const a = run(r);
  assert.ok(a.modules[0].flags.includes("A knowledge check has no answer guidance"));
  assert.equal(a.checks.find((c) => c.id === "L4").met, false);
});

test("transfer actions need an owner and a date and must number five to seven", () => {
  const r = base(); completeModule(r, 1);
  put(r, 13, /Transfer-to-work/, "Do a thing | | \nDo another | Priya | next month");
  const a = run(r);
  assert.deepEqual(a.transfer[0].flags, ["No owner", "No date"]);
  assert.deepEqual(a.transfer[1].flags, ["No date"]);
  assert.equal(a.checks.find((c) => c.id === "L7").met, false);
});

test("the rubric needs three criteria that each say what good looks like", () => {
  const r = base(); completeModule(r, 1);
  put(r, 11, /Assessment rubric/, "Accuracy | \nClarity | clear");
  const a = run(r);
  assert.ok(a.rubric[0].flags.includes("No description of what good looks like"));
  assert.equal(a.checks.find((c) => c.id === "L5").met, false);
});

test("vague outcomes block L1, and a worked example must be labelled", () => {
  const r = base(); completeModule(r, 1);
  put(r, 4, /Expected outcomes/, "Understand the method\nExplain the method");
  put(r, 8, /^Module 1 · Worked example$/, "A plant had scrap and fixed it");
  const a = run(r);
  assert.equal(a.checks.find((c) => c.id === "L1").met, false);
  assert.ok(a.modules[0].flags.includes("Worked example not labelled Real or Illustrative"));
});

test("knowledge checks are collected across modules with their module number", () => {
  const r = base(); completeModule(r, 1); completeModule(r, 3);
  const a = run(r);
  assert.deepEqual([...new Set(a.knowledgeChecks.map((k) => k.module))], [1, 3]);
  assert.equal(a.knowledgeChecks.length, 4);
});

test("the module's own text is carried through so the report can print it in full", () => {
  const r = base(); completeModule(r, 1);
  const m = run(r).modules[0];
  assert.match(m.values["Concept explained simply"], /^word0 word1/);
  assert.equal(m.values["Learner output"], "A completed 5 Whys sheet");
  assert.match(m.values["Worked example"], /^Illustrative:/);
});
