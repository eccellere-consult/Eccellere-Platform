// Run: node --test unit/toolkit-narrative-integration.test.mjs
// Transpiles the real TypeScript into node_modules/.cache (so react resolves); needs no browser, server or database.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const { createElement: h } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const out = path.join(root, "node_modules", ".cache", "toolkit-narrative-test");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "package.json"), '{"type":"module"}');
const FILES = {
  "engine.ts": "src/lib/toolkit/engine.ts", "analysis.ts": "src/lib/toolkit/analysis.ts", "analysis-ps.ts": "src/lib/toolkit/analysis-ps.ts",
  "analysis-pb.ts": "src/lib/toolkit/analysis-pb.ts", "analysis-gd.ts": "src/lib/toolkit/analysis-gd.ts", "analysis-lk.ts": "src/lib/toolkit/analysis-lk.ts",
  "narrative-plan.ts": "src/lib/toolkit/narrative-plan.ts", "narrative.ts": "src/lib/toolkit/narrative.ts", "narrative-digest.ts": "src/lib/toolkit/narrative-digest.ts", "MarkdownLite.tsx": "src/components/toolkit/MarkdownLite.tsx",
};
for (const [name, rel] of Object.entries(FILES)) {
  let js = ts.transpileModule(fs.readFileSync(path.join(root, rel), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  js = js.replace(/from "\.\/(engine|analysis|analysis-ps|analysis-pb|analysis-gd|analysis-lk|narrative-plan|narrative|narrative-digest)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(out, name.replace(/\.tsx?$/, ".mjs")), js);
}
const imp = (n) => import(pathToFileURL(path.join(out, n)).href);
const E = await imp("engine.mjs"), N = await imp("narrative.mjs"), DG = await imp("narrative-digest.mjs"), MD = await imp("MarkdownLite.mjs");

const render = (text) => renderToStaticMarkup(h(MD.MarkdownLite, { text })).replace(/<\/?span>/g, "");

// ── MarkdownLite ─────────────────────────────────────────────────────
test("MarkdownLite renders headings, lists, tables, paragraphs and bold", () => {
  const html = render("### Summary\nStock is **the** main drag.\n\n- one\n- two\n\n1. first\n2. second\n\n| A | B |\n|---|---|\n| 1 | 2 |");
  assert.match(html, /<h3>Summary<\/h3>/);
  assert.match(html, /<p>[\s\S]*<b>the<\/b>[\s\S]*<\/p>/);
  assert.match(html, /<ul><li>[\s\S]*one[\s\S]*<\/li><li>[\s\S]*two/);
  assert.match(html, /<ol><li>[\s\S]*first/);
  assert.match(html, /<table><thead><tr><th>[\s\S]*A[\s\S]*<\/th><th>[\s\S]*B/);
  assert.match(html, /<td>[\s\S]*1[\s\S]*<\/td><td>[\s\S]*2/);
});

test("MarkdownLite can never inject HTML or script: everything is escaped text", () => {
  const html = render("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert(1))\n\n**<b>bold</b>**");
  assert.ok(!/<script|<img|onerror=\w*alert\(1\)>/.test(html.replace(/&lt;[^]*?&gt;/g, "")), html);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<a "));
});

test("MarkdownLite keeps a heading directly followed by text, and merges wrapped paragraph lines", () => {
  const blocks = MD.parseMarkdownLite("## Heading\nBody line one\nbody line two\n\nNext paragraph");
  assert.deepEqual(blocks.map((b) => b.kind), ["h", "p", "p"]);
  assert.equal(blocks[1].text, "Body line one body line two");
});

// ── digest ───────────────────────────────────────────────────────────
const bpOf = (type) => E.buildTemplateBlueprint({ type, industry: "Retail", topic: "Inventory optimisation" });
const row = (bp, seq, re, value, provenance = "Client-entered") => {
  const f = bp.sections.find((s) => s.seq === seq).fields.find((x) => re.test(x.label));
  assert.ok(f, `field ${seq} ${re}`);
  return { fieldId: f.id, value, provenance, confidence: null };
};

test("narratives are excluded from the maps the analyses read, and from the answers text", () => {
  const bp = bpOf("PROBLEM_SOLVING");
  const rows = [row(bp, 6, /Problem statement/, "Scrap rose from 3 to 8 percent on line 2 for a major customer."), { fieldId: "NARR.3", value: { text: "SECRET NARRATIVE" }, provenance: "AI-suggested" }];
  const map = DG.responseMap(rows);
  assert.ok(!("NARR.3" in map));
  assert.ok(!DG.answersText(bp, rows).includes("SECRET NARRATIVE"));
  assert.ok(!DG.analysisDigest(bp, rows).includes("SECRET NARRATIVE"));
  assert.match(DG.answersText(bp, rows), /Problem statement: Scrap rose/);
});

test("answersText labels unconfirmed AI answers and records Not known, but skips Not applicable", () => {
  const bp = bpOf("PROBLEM_SOLVING");
  const rows = [
    row(bp, 6, /Problem statement/, "AI wrote this", "AI-suggested"),
    row(bp, 7, /Baseline/, null, "Not-known"),
    row(bp, 5, /Scope/, null, "Not-applicable"),
  ];
  const t = DG.answersText(bp, rows);
  assert.match(t, /Problem statement \(AI-suggested, unconfirmed\): AI wrote this/);
  assert.match(t, /Baseline and impact: Not known/);
  assert.ok(!/Scope and boundary/.test(t));
});

test("the analysis digest reflects computed facts for every kit type and is never empty", () => {
  for (const type of ["DIAGNOSTIC", "PROBLEM_SOLVING", "PLAYBOOK", "GUIDE", "LEARNING"]) {
    const bp = bpOf(type);
    const d = DG.analysisDigest(bp, []);
    assert.ok(d.length > 40, `${type} digest should not be empty`);
    assert.ok(d.length < 5000, `${type} digest is compact`);
  }
  const bp = bpOf("PROBLEM_SOLVING");
  const d = DG.analysisDigest(bp, [row(bp, 10, /Hypotheses/, "Worn tooling | for | against | test | High")]);
  assert.match(d, /Hypotheses 1: 0 validated, 0 rejected, 0 inconclusive, 1 untested/);
  assert.match(d, /H1 \[Untested\] Worn tooling/);
});

test("the full pipeline: digest + answers feed the prompt, and figures not in the inputs are flagged", async () => {
  const bp = bpOf("PROBLEM_SOLVING");
  const rows = [
    row(bp, 6, /Problem statement/, "Scrap rose from 3 percent to 8 percent on line 2 between March and June, hurting a major customer."),
    row(bp, 10, /Hypotheses/, "Worn tooling | flash after 40000 shots | | compare before and after | High"),
  ];
  const inputs = { blueprint: bp, seq: 3, problemText: "Scrap problem", contextText: "Plastics maker", answers: DG.answersText(bp, rows), analysis: DG.analysisDigest(bp, rows), evidence: [] };
  const text = "Scrap on line 2 rose from 3 percent to 8 percent, and one hypothesis, worn tooling, is still untested. " + "Detail ".repeat(60) + "Peers typically run at 2 percent scrap and could save 45 lakh.";
  let seen;
  const r = await N.draftNarrative({ ...inputs, gen: async (a) => { seen = a; return { text, provider: "anthropic", model: "m" }; } });
  assert.match(seen.user, /Problem statement: Scrap rose/);
  assert.match(seen.user, /H1 \[Untested\] Worn tooling/);
  assert.ok(!r.unsupported.some((u) => /\b3\b|\b8\b/.test(u)), "3 and 8 percent are in the inputs");
  assert.ok(r.unsupported.some((u) => u.includes("2 percent")) && r.unsupported.some((u) => u.includes("45")), JSON.stringify(r.unsupported));
});

test("sanitiseClientNarrative strips tags and links but keeps the client's wording", () => {
  const t = N.sanitiseClientNarrative("Keep this <b>wording</b> and see https://x.example/y for more.");
  assert.equal(t, "Keep this  wording  and see [link removed] for more.".replace(/\s{2,}/g, (m) => m));
  assert.ok(!/<|https?:/.test(t));
  assert.ok(t.includes("Keep this"));
});

test("failure notes are plain language and name the next step", () => {
  assert.match(N.narrativeFailureNote({ available: false }), /not available/);
  assert.match(N.narrativeFailureNote({ available: true, failure: "call", detail: "Groq: HTTP 401" }), /access key/);
  assert.match(N.narrativeFailureNote({ available: true, failure: "call", detail: "Groq: HTTP 429" }), /busy|too large/);
  assert.match(N.narrativeFailureNote({ available: true, failure: "call", detail: "Groq: timed out" }), /too long/);
  assert.match(N.narrativeFailureNote({ available: true, failure: "format" }), /try again/i);
});
