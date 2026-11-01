// Run: node --test unit/toolkit-analysis-gd.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildTemplateBlueprint, validateBlueprint } from "../src/lib/toolkit/engine.ts";
import { analyseGuide } from "../src/lib/toolkit/analysis-gd.ts";

const bp = buildTemplateBlueprint({ type: "GUIDE", industry: "Retail", topic: "Working capital" });
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
const run = (r) => analyseGuide(bp, r);

const FULL = [
  [3, /Intended audience/, "Owner-managers with no finance training"], [3, /Purpose and scope/, "Explains working capital; does not assess any company"],
  [7, /Concepts and definitions/, "Working capital | cash tied up in operations | it limits growth | a shop buying stock | ignores seasonality | Investopedia\nDSO | days to collect payment | shows collection speed | 45 days vs 60 | varies by industry | Investopedia\nCash conversion cycle | days from paying suppliers to collecting | combines three levers | DIO + DSO - DPO | needs clean data | Investopedia"],
  [9, /Frameworks, models/, "Cash conversion cycle | how long cash is tied up | when comparing across periods | measure DIO, DSO, DPO | not a profit measure | Investopedia"],
  [10, /Step-by-step application/, "Measure | gather receivables and stock | baseline | using month-end only\nCompare | compare to target | gap | no target set\nAct | pick one lever | action plan | too many levers"],
  [11, /Worked examples/, "A shop | Illustrative | slow collections | chase by ageing | DSO fell | track weekly"],
  [12, /Decision criteria/, "Early-payment discount | invoices are large and buyers pay late | margins are thin | cost of discount"],
  [13, /Common mistakes/, "Ignoring stock | cash is stuck | review stock ageing\nChasing everyone | wasted effort | rank by size\nNo owner | nothing changes | name an owner"],
  [14, /Checklists and quick/, "Monthly:\nReview ageing | first week\nReview stock | first week"],
  [17, /References and source notes/, "Investopedia | https://www.investopedia.com | 2024 | working capital definitions"],
];

test("the Guide blueprint is valid and has the new structured fields", () => {
  assert.deepEqual(validateBlueprint(bp), []);
  assert.ok(field(7, /Concepts and definitions/) && field(9, /Frameworks/) && field(17, /References/));
});

test("a complete Guide passes every check", () => {
  const a = run(fill(FULL));
  assert.equal(a.openChecks, 0, a.checks.filter((c) => !c.met).map((c) => c.id + " " + c.detail).join("; "));
  assert.equal(a.status, "Reference-ready");
  assert.equal(a.conceptCompletePct, 100);
});

test("an empty Guide is Not ready and invents nothing", () => {
  const a = run({});
  assert.equal(a.status, "Not ready");
  assert.equal(a.concepts.length + a.frameworks.length + a.glossary.length + a.references.length, 0);
  assert.equal(a.conceptCompletePct, null);
});

test("a concept lists exactly which parts are missing, including 'Not known'", () => {
  const a = run(fill([[7, /Concepts and definitions/, "Term A | a definition | | an example | Not known | "]]));
  assert.deepEqual(a.concepts[0].missing.sort(), ["limitation", "source", "why it matters"].sort());
  assert.equal(a.conceptCompletePct, 0);
});

test("a cited source that is not in the reference list is flagged and blocks the check", () => {
  const a = run(fill(FULL.concat([[7, /Concepts and definitions/, "Term | def | why | ex | lim | Some Unlisted Journal"]])));
  assert.deepEqual(a.unresolvedSources, ["Some Unlisted Journal"]);
  assert.ok(a.concepts[0].flags.includes("Source not in the reference list"));
  assert.equal(a.checks.find((c) => c.id === "G8").met, false);
});

test("examples must be labelled Real or Illustrative", () => {
  const a = run(fill([[11, /Worked examples/, "Ex 1 | | situation | approach | result | lesson\nEx 2 | Real | s | a | r | l"]]));
  assert.equal(a.examples[0].kind, "Not labelled");
  assert.ok(a.examples[0].flags.includes("Not labelled Real or Illustrative"));
  assert.equal(a.examples[1].kind, "Real");
  assert.equal(a.checks.find((c) => c.id === "G5").met, false);
});

test("decision criteria without a 'do not use when' fail the check", () => {
  const a = run(fill([[12, /Decision criteria/, "Approach A | use when X | | trade-off"]]));
  assert.ok(a.criteria[0].flags.includes("No 'do not use when'"));
  assert.equal(a.checks.find((c) => c.id === "G6").met, false);
});

test("the glossary is built only from concepts and frameworks, sorted, with nothing separate invented", () => {
  const a = run(fill(FULL));
  const terms = a.glossary.map((g) => g.term);
  assert.deepEqual(terms, [...terms].sort((x, y) => x.localeCompare(y)));
  assert.ok(terms.includes("DSO") && terms.includes("Cash conversion cycle"));
  assert.equal(terms.length, a.concepts.length + a.frameworks.length);
});

test("checklists group items under headings that end with a colon", () => {
  const a = run(fill([[14, /Checklists and quick/, "Monthly:\nReview ageing | first week\nWeekly:\nCheck cash | Monday"]]));
  assert.deepEqual(a.checklists.map((c) => c.heading), ["Monthly", "Weekly"]);
  assert.equal(a.checklists[0].items[0].when, "first week");
});

test("references without a citation or date are flagged", () => {
  const a = run(fill([[17, /References and source notes/, "A book | | | supports X"]]));
  assert.deepEqual(a.references[0].flags, ["No citation or URL", "No date"]);
});
