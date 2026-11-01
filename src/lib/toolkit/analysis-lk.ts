/**
 * Learning Kit analysis layer (skill s11).
 * Pure functions, no runtime imports. A Learning Kit must make the learner perform, explain and
 * demonstrate a skill, so the checks test for observable outcomes, practice, teach-back,
 * assessment and a verifiable transfer-to-work plan.
 *
 * Honesty rules:
 *  - Nothing is invented. Missing module elements are shown as missing.
 *  - Word counts are measured, not estimated, and compared with the skill's 800-1,200 word target
 *    for an applied chapter; a short module is reported as short.
 *  - The report never certifies that anyone has learned anything.
 */
import type { Blueprint } from "./engine";
import type { PSAnswer } from "./analysis-ps";

const text = (v: unknown): string => (v === null || v === undefined ? "" : String(v)).trim();
function parseLines(v: unknown): string[] {
  return text(v).split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim()).filter(Boolean);
}
function answerFor(bp: Blueprint, responses: Record<string, PSAnswer>, seq: number, label: RegExp): string {
  const f = bp.sections.find((x) => x.seq === seq)?.fields.find((x) => label.test(x.label));
  if (!f) return "";
  const r = responses[f.id];
  if (!r || r.provenance === "Not-known" || r.provenance === "Not-applicable") return "";
  return text(r.value);
}
const cells = (l: string) => l.split("|").map((c) => c.trim());
const wc = (s: string) => (s.match(/[A-Za-z0-9₹%]+/g) ?? []).length;
const blank = (s: string | undefined) => !s || /^(not known|not provided|n\/a|-|tbc|tbd)$/i.test(s.trim());

/** Verbs a learner can be observed doing. Vague verbs are flagged instead. */
export const OBSERVABLE_VERBS = [
  "apply", "analyse", "analyze", "assess", "build", "calculate", "classify", "compare", "complete", "construct", "create", "decide",
  "define", "demonstrate", "design", "diagnose", "draft", "estimate", "evaluate", "explain", "identify", "interpret", "justify",
  "list", "map", "measure", "plan", "prepare", "prioritise", "prioritize", "produce", "present", "run", "select", "set", "solve",
  "summarise", "summarize", "test", "use", "write",
];
export const VAGUE_VERBS = ["understand", "know", "learn", "appreciate", "be aware", "become familiar", "grasp", "realise", "realize", "gain insight", "enjoy"];

export function outcomeVerdict(line: string): { ok: boolean; verb: string; note: string } {
  const t = line
    .trim()
    .toLowerCase()
    .replace(/^(learners?|participants?|students?)\s+/, "")
    .replace(/^(will|can|should|must)\s+/, "")
    .replace(/^be able to\s+/, "")
    .replace(/^to\s+/, "");
  const first = t.split(/\s+/)[0] ?? "";
  const vague = VAGUE_VERBS.find((v) => t.startsWith(v));
  if (vague) return { ok: false, verb: vague, note: `"${vague}" cannot be observed. Say what the learner will do, for example calculate, explain or build.` };
  if (OBSERVABLE_VERBS.includes(first)) return { ok: true, verb: first, note: "Observable." };
  return { ok: false, verb: first, note: `"${first}" is not a recognised observable verb. Check that you could watch the learner do it.` };
}

export const MODULE_ELEMENTS = [
  "Title", "Learning outcome", "Business need", "Concept explained simply", "Analogy and technical explanation", "Named framework and supporting tools",
  "Worked example", "Guided exercise (with hints)", "Teach-back prompt", "Knowledge check", "Action items", "Learner output",
] as const;

export interface LKModule {
  n: number; title: string; outcome: string; outcomeOk: boolean; used: boolean;
  elements: Array<{ name: string; present: boolean }>; missing: string[];
  contentWords: number; shortFor800: boolean;
  checks: Array<{ question: string; guidance: string }>; actions: string[]; actionCountOk: boolean;
  learnerOutput: string; teachBack: string; framework: string; flags: string[];
  /** the module's own text, element by element, so the report can print it in full */
  values: Record<string, string>;
}
export interface LKCheck { id: string; label: string; met: boolean; detail: string }

export interface LearningAnalysis {
  outcomes: Array<{ text: string; ok: boolean; verb: string; note: string }>;
  competencies: Array<{ competency: string; level: string; evidence: string; flags: string[] }>;
  modules: LKModule[];
  usedModules: number;
  rubric: Array<{ criterion: string; good: string; flags: string[] }>;
  transfer: Array<{ action: string; owner: string; date: string; verifiable: boolean; flags: string[] }>;
  glossary: Array<{ term: string; definition: string }>;
  references: Array<{ source: string; citation: string; supports: string }>;
  hasTeachBack: boolean; completionCriteria: boolean;
  knowledgeChecks: Array<{ module: number; question: string; guidance: string }>;
  checks: LKCheck[]; openChecks: number;
  status: "Ready to release" | "Not ready";
}

export function analyseLearning(bp: Blueprint, responses: Record<string, PSAnswer>, moduleCount = 5): LearningAnalysis {
  const A = (seq: number, re: RegExp) => answerFor(bp, responses, seq, re);

  const outcomes = parseLines(A(4, /Expected outcomes/i)).map((l) => ({ text: l, ...outcomeVerdict(l) }));

  const competencies = parseLines(A(7, /Competency map/i)).map((l) => {
    const c = cells(l);
    const k = { competency: c[0], level: c[1] ?? "", evidence: c[2] ?? "", flags: [] as string[] };
    if (blank(k.level)) k.flags.push("No level");
    if (blank(k.evidence)) k.flags.push("No evidence method");
    return k;
  });

  const modules: LKModule[] = [];
  for (let n = 1; n <= moduleCount; n++) {
    const get = (name: string) => A(8, new RegExp(`^Module ${n} · ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
    const vals = Object.fromEntries(MODULE_ELEMENTS.map((e) => [e, get(e)]));
    const used = Object.values(vals).some((v) => v.length > 0);
    const present = MODULE_ELEMENTS.map((e) => ({ name: e as string, present: vals[e].length > 0 }));
    const checks = parseLines(vals["Knowledge check"]).map((l) => { const c = cells(l); return { question: c[0], guidance: c[1] ?? "" }; });
    const actions = parseLines(vals["Action items"]);
    const contentWords = wc(vals["Concept explained simply"]) + wc(vals["Analogy and technical explanation"]) + wc(vals["Worked example"]) + wc(vals["Guided exercise (with hints)"]) + wc(vals["Business need"]);
    const verdict = vals["Learning outcome"] ? outcomeVerdict(vals["Learning outcome"]) : { ok: false, verb: "", note: "" };
    const flags: string[] = [];
    if (used) {
      if (checks.some((c) => blank(c.guidance))) flags.push("A knowledge check has no answer guidance");
      if (actions.length && (actions.length < 5 || actions.length > 7)) flags.push(`${actions.length} action items (the skill asks for 5 to 7)`);
      if (vals["Worked example"] && !/\b(real|illustrative)\b/i.test(vals["Worked example"])) flags.push("Worked example not labelled Real or Illustrative");
    }
    modules.push({
      n, title: vals["Title"], outcome: vals["Learning outcome"], outcomeOk: used ? verdict.ok : true, used, elements: present,
      missing: used ? present.filter((p) => !p.present).map((p) => p.name) : [], contentWords, shortFor800: used && contentWords < 800,
      checks, actions, actionCountOk: actions.length >= 5 && actions.length <= 7, learnerOutput: vals["Learner output"], teachBack: vals["Teach-back prompt"],
      framework: vals["Named framework and supporting tools"], flags, values: { ...vals },
    });
  }
  const used = modules.filter((m) => m.used);

  const rubric = parseLines(A(11, /Assessment rubric/i)).map((l) => {
    const c = cells(l);
    const r = { criterion: c[0], good: c.slice(1).join(" | "), flags: [] as string[] };
    if (blank(r.good)) r.flags.push("No description of what good looks like");
    return r;
  });

  const transfer = parseLines(A(13, /Transfer-to-work/i)).map((l) => {
    const c = cells(l);
    const t = { action: c[0], owner: c[1] ?? "", date: c[2] ?? "", verifiable: false, flags: [] as string[] };
    if (blank(t.owner)) t.flags.push("No owner");
    if (!/\d/.test(t.date)) t.flags.push("No date");
    t.verifiable = t.flags.length === 0;
    return t;
  });

  const glossary = parseLines(A(15, /^Glossary$/i)).map((l) => { const c = cells(l); return { term: c[0], definition: c[1] ?? "" }; }).sort((a, b) => a.term.localeCompare(b.term));
  const references = parseLines(A(15, /References and sources/i)).map((l) => { const c = cells(l); return { source: c[0], citation: c[1] ?? "", supports: c[2] ?? "" }; });
  const teachBackText = A(12, /Teach-back/i);
  const completion = A(14, /Facilitator or self-study/i);
  const knowledgeChecks = used.flatMap((m) => m.checks.map((c) => ({ module: m.n, ...c })));

  const checks: LKCheck[] = [
    { id: "L1", label: "Every expected outcome is observable", met: outcomes.length > 0 && outcomes.every((o) => o.ok), detail: `${outcomes.filter((o) => !o.ok).length} of ${outcomes.length} need rewording.` },
    { id: "L2", label: "At least one module is used and every used module has all twelve elements", met: used.length >= 1 && used.every((m) => m.missing.length === 0), detail: `${used.length} module(s) used, ${used.filter((m) => m.missing.length).length} incomplete.` },
    { id: "L3", label: "Every used module has five to seven action items", met: used.length >= 1 && used.every((m) => m.actionCountOk), detail: used.map((m) => `M${m.n}: ${m.actions.length}`).join(", ") || "No modules." },
    { id: "L4", label: "Every used module has knowledge checks with answer guidance", met: used.length >= 1 && used.every((m) => m.checks.length > 0 && !m.checks.some((c) => blank(c.guidance))), detail: `${knowledgeChecks.length} knowledge checks.` },
    { id: "L5", label: "The assessment rubric has at least three criteria with a description of good", met: rubric.length >= 3 && rubric.every((r) => !r.flags.length), detail: `${rubric.length} criteria.` },
    { id: "L6", label: "A teach-back task is recorded", met: teachBackText.length > 0 || used.some((m) => m.teachBack), detail: teachBackText ? "Section 12." : used.some((m) => m.teachBack) ? "Module prompts only." : "None recorded." },
    { id: "L7", label: "Five to seven transfer-to-work actions, each with an owner and a date", met: transfer.length >= 5 && transfer.length <= 7 && transfer.every((t) => t.verifiable), detail: `${transfer.length} actions, ${transfer.filter((t) => !t.verifiable).length} not verifiable.` },
    { id: "L8", label: "Completion criteria are stated", met: completion.length > 0, detail: completion ? "Section 14." : "Not recorded." },
    { id: "L9", label: "A competency map links outcomes to an evidence method", met: competencies.length >= 1 && competencies.every((c) => !c.flags.length), detail: `${competencies.length} competencies.` },
  ];
  const openChecks = checks.filter((c) => !c.met).length;

  return {
    outcomes, competencies, modules, usedModules: used.length, rubric, transfer, glossary, references,
    hasTeachBack: Boolean(teachBackText), completionCriteria: completion.length > 0, knowledgeChecks,
    checks, openChecks, status: openChecks === 0 ? "Ready to release" : "Not ready",
  };
}
