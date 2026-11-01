// Run: node --test unit/toolkit-report-coverage.test.mjs
//
// Guards against a quiet failure: the report silently dropping text the client typed.
// For every kit type it fills EVERY input field with a unique marker, renders every report
// section with the real section renderers, and fails if any marker is missing from the output.
//
// It transpiles the real TypeScript with the compiler already in the project, into
// node_modules/.cache (so react resolves), and needs no browser, server or database.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const { createElement: h, Fragment } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const out = path.join(root, "node_modules", ".cache", "toolkit-report-test");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "package.json"), '{"type":"module"}');

const FILES = {
  "engine.ts": "src/lib/toolkit/engine.ts", "analysis.ts": "src/lib/toolkit/analysis.ts", "analysis-ps.ts": "src/lib/toolkit/analysis-ps.ts",
  "analysis-pb.ts": "src/lib/toolkit/analysis-pb.ts", "analysis-gd.ts": "src/lib/toolkit/analysis-gd.ts", "analysis-lk.ts": "src/lib/toolkit/analysis-lk.ts",
  "methods.ts": "src/lib/toolkit/methods.ts", "ReportBodies.tsx": "src/components/toolkit/ReportBodies.tsx",
};
for (const [name, rel] of Object.entries(FILES)) {
  let js = ts.transpileModule(fs.readFileSync(path.join(root, rel), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  js = js
    .replace(/from "@\/lib\/toolkit\/([\w-]+)"/g, 'from "./$1.mjs"')
    .replace(/from "\.\/(engine|analysis|analysis-ps|analysis-pb|analysis-gd|analysis-lk|methods)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(out, name.replace(/\.tsx?$/, ".mjs")), js);
}
const imp = (n) => import(pathToFileURL(path.join(out, n)).href);
const E = await imp("engine.mjs"), D = await imp("analysis.mjs"), PS = await imp("analysis-ps.mjs"), PB = await imp("analysis-pb.mjs");
const GD = await imp("analysis-gd.mjs"), LK = await imp("analysis-lk.mjs"), R = await imp("ReportBodies.mjs");

function renderAll(type) {
  const bp = E.buildTemplateBlueprint({ type, industry: "Retail", topic: "Marker topic" });
  const resp = {};
  const markers = [];
  for (const s of bp.sections) for (const f of s.fields) {
    if (f.type === "scale4") { resp[f.id] = { fieldId: f.id, value: 2, provenance: "Client-entered" }; continue; }
    if (f.type === "select") { resp[f.id] = { fieldId: f.id, value: f.options?.[0] ?? "x", provenance: "Client-entered" }; continue; }
    resp[f.id] = { fieldId: f.id, value: `MARK_${f.id}`, provenance: "Client-entered" };
    markers.push({ id: f.id, label: f.label, seq: s.seq });
  }
  const fieldBlocks = (s) => s.fields.length
    ? h(Fragment, null, s.fields.map((f) => h("div", { key: f.id }, h("b", null, f.label), h("span", null, String(resp[f.id]?.value ?? "")))))
    : null;
  let bodyFn;
  if (type === "DIAGNOSTIC") {
    const an = D.analyseDiagnostic(bp, resp, E.scoreDiagnostic(bp, resp));
    // mirrors the page: sections 13-19 show the analysis AND the client's own notes
    bodyFn = (s, extra) => { const dx = R.diagnosticBody(s.seq, an, bp, extra); return dx && s.seq >= 13 && s.seq <= 19 && extra ? h(Fragment, null, dx, extra) : dx; };
  }
  if (type === "PROBLEM_SOLVING") { const an = PS.analyseProblemSolving(bp, resp); bodyFn = (s, extra) => R.problemSolvingBody(s.seq, an, extra, (q, re) => PS.answerFor(bp, resp, q, re)); }
  if (type === "PLAYBOOK") { const an = PB.analysePlaybook(bp, resp); bodyFn = (s, extra) => R.playbookBody(s.seq, an, extra); }
  if (type === "GUIDE") { const an = GD.analyseGuide(bp, resp); bodyFn = (s, extra) => R.guideBody(s.seq, an, extra); }
  if (type === "LEARNING") { const an = LK.analyseLearning(bp, resp); bodyFn = (s, extra) => R.learningBody(s.seq, an, extra); }
  const html = bp.sections.map((s) => {
    const extra = fieldBlocks(s);
    const node = bodyFn(s, extra);
    return renderToStaticMarkup(node ?? (s.fields.length ? extra : h("span")));
  }).join("\n");
  return { markers, html };
}

for (const type of ["DIAGNOSTIC", "PROBLEM_SOLVING", "PLAYBOOK", "GUIDE", "LEARNING"]) {
  test(`${type}: every field the client fills in appears in the report`, () => {
    const { markers, html } = renderAll(type);
    assert.ok(markers.length > 10, "the test must exercise real fields");
    const missing = markers.filter((m) => !html.includes(`MARK_${m.id}`));
    assert.deepEqual(missing.map((m) => `section ${m.seq}: ${m.label}`), [], "client text dropped from the report");
  });
}

test("Problem-Solving shows criteria and score lines it could not read, instead of dropping them", () => {
  const bp = E.buildTemplateBlueprint({ type: "PROBLEM_SOLVING", industry: "Retail", topic: "x" });
  const find = (seq, re) => bp.sections.find((s) => s.seq === seq).fields.find((f) => re.test(f.label));
  const resp = {};
  const put = (seq, re, value) => { const f = find(seq, re); resp[f.id] = { fieldId: f.id, value, provenance: "Client-entered" }; };
  put(13, /Option longlist/, "Retool\nTrain");
  put(14, /criteria and weights/, "Impact | high\nCost | 40");
  put(14, /Option scores/, "Mystery option | 3,3\nRetool | 4");
  const an = PS.analyseProblemSolving(bp, resp);
  assert.deepEqual(an.unread.criteria, ["Impact | high"]);
  assert.deepEqual(an.unread.scores, ["Mystery option | 3,3"]);
  const html = renderToStaticMarkup(R.problemSolvingBody(14, an, null, () => ""));
  assert.ok(html.includes("Impact | high") && html.includes("Mystery option | 3,3"));
});
