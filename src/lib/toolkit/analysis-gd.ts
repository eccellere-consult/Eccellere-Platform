/**
 * Guide analysis layer (skill s10).
 * Pure functions, no runtime imports. A Guide is a dependable reference, so the checks
 * test that every concept and framework is complete, labelled and sourced.
 *
 * Honesty rules:
 *  - Nothing is invented. A part the author could not support stays "Not provided".
 *  - Examples must be labelled Real or Illustrative; an unlabelled example is flagged.
 *  - A cited source that is not in the reference list is flagged.
 *  - A Guide does not assess the reader's company (stated in the report).
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
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const blank = (s: string | undefined) => !s || /^(not known|not provided|n\/a|-|tbc|tbd)$/i.test(s.trim());

export interface Concept { id: string; term: string; definition: string; why: string; example: string; limitation: string; source: string; missing: string[]; flags: string[] }
export interface Framework { id: string; name: string; what: string; when: string; steps: string; limitation: string; source: string; missing: string[]; flags: string[] }
export interface GStep { n: number; title: string; action: string; output: string; commonError: string; flags: string[] }
export interface Example { title: string; kind: "Real" | "Illustrative" | "Not labelled"; situation: string; approach: string; result: string; lesson: string; flags: string[] }
export interface Criterion { choice: string; useWhen: string; notWhen: string; tradeoff: string; flags: string[] }
export interface Mistake { mistake: string; symptom: string; fix: string }
export interface Reference { source: string; citation: string; date: string; supports: string; flags: string[] }
export interface GCheck { id: string; label: string; met: boolean; detail: string }

export interface GuideAnalysis {
  concepts: Concept[];
  frameworks: Framework[];
  steps: GStep[];
  examples: Example[];
  criteria: Criterion[];
  mistakes: Mistake[];
  checklists: Array<{ heading: string; items: Array<{ item: string; when: string }> }>;
  references: Reference[];
  glossary: Array<{ term: string; definition: string; from: "Concept" | "Framework" }>;
  unresolvedSources: string[];
  conceptCompletePct: number | null;
  checks: GCheck[];
  openChecks: number;
  status: "Reference-ready" | "Not ready";
}

export function analyseGuide(bp: Blueprint, responses: Record<string, PSAnswer>): GuideAnalysis {
  const A = (seq: number, re: RegExp) => answerFor(bp, responses, seq, re);

  const concepts: Concept[] = parseLines(A(7, /Concepts and definitions/i)).map((l, i) => {
    const c = cells(l);
    const k: Concept = { id: `C${i + 1}`, term: c[0], definition: c[1] ?? "", why: c[2] ?? "", example: c[3] ?? "", limitation: c[4] ?? "", source: c[5] ?? "", missing: [], flags: [] };
    for (const [key, label] of [["definition", "definition"], ["why", "why it matters"], ["example", "example"], ["limitation", "limitation"], ["source", "source"]] as const) {
      if (blank(k[key])) k.missing.push(label);
    }
    return k;
  });
  const conceptComplete = concepts.filter((c) => c.missing.length === 0).length;

  const frameworks: Framework[] = parseLines(A(9, /Frameworks, models/i)).map((l, i) => {
    const c = cells(l);
    const f: Framework = { id: `F${i + 1}`, name: c[0], what: c[1] ?? "", when: c[2] ?? "", steps: c[3] ?? "", limitation: c[4] ?? "", source: c[5] ?? "", missing: [], flags: [] };
    for (const [key, label] of [["what", "what it is"], ["when", "when to use it"], ["steps", "key steps"], ["limitation", "limitation"], ["source", "source"]] as const) {
      if (blank(f[key])) f.missing.push(label);
    }
    return f;
  });

  const steps: GStep[] = parseLines(A(10, /Step-by-step application/i)).map((l, i) => {
    const c = cells(l);
    const s: GStep = { n: i + 1, title: c[0], action: c[1] ?? "", output: c[2] ?? "", commonError: c[3] ?? "", flags: [] };
    if (blank(s.action)) s.flags.push("No action");
    if (blank(s.output)) s.flags.push("No output");
    return s;
  });

  const examples: Example[] = parseLines(A(11, /Worked examples/i)).map((l) => {
    const c = cells(l);
    const k = /^real/i.test(c[1] ?? "") ? "Real" : /^illustr/i.test(c[1] ?? "") ? "Illustrative" : "Not labelled";
    const e: Example = { title: c[0], kind: k, situation: c[2] ?? "", approach: c[3] ?? "", result: c[4] ?? "", lesson: c[5] ?? "", flags: [] };
    if (k === "Not labelled") e.flags.push("Not labelled Real or Illustrative");
    if (blank(e.result)) e.flags.push("No result stated");
    if (blank(e.lesson)) e.flags.push("No lesson stated");
    return e;
  });

  const criteria: Criterion[] = parseLines(A(12, /Decision criteria/i)).map((l) => {
    const c = cells(l);
    const k: Criterion = { choice: c[0], useWhen: c[1] ?? "", notWhen: c[2] ?? "", tradeoff: c[3] ?? "", flags: [] };
    if (blank(k.notWhen)) k.flags.push("No 'do not use when'");
    return k;
  });

  const mistakes: Mistake[] = parseLines(A(13, /Common mistakes/i)).map((l) => {
    const c = cells(l);
    return { mistake: c[0], symptom: c[1] ?? "", fix: c[2] ?? "" };
  });

  // Checklists: a line ending with ":" starts a new group
  const checklists: GuideAnalysis["checklists"] = [];
  for (const l of parseLines(A(14, /Checklists and quick/i))) {
    if (/:\s*$/.test(l)) { checklists.push({ heading: l.replace(/:\s*$/, ""), items: [] }); continue; }
    if (!checklists.length) checklists.push({ heading: "Checklist", items: [] });
    const c = cells(l);
    checklists[checklists.length - 1].items.push({ item: c[0], when: c[1] ?? "" });
  }

  const references: Reference[] = parseLines(A(17, /References and source notes/i)).map((l) => {
    const c = cells(l);
    const r: Reference = { source: c[0], citation: c[1] ?? "", date: c[2] ?? "", supports: c[3] ?? "", flags: [] };
    if (blank(r.citation)) r.flags.push("No citation or URL");
    if (blank(r.date)) r.flags.push("No date");
    return r;
  });

  // Sources cited in concepts/frameworks must appear in the reference list
  const refNames = references.map((r) => norm(r.source));
  const cited = [...concepts.map((c) => c.source), ...frameworks.map((f) => f.source)].filter((s) => !blank(s));
  const unresolvedSources = [...new Set(cited.filter((s) => !refNames.some((r) => r && (r.includes(norm(s)) || norm(s).includes(r)))))];
  for (const c of concepts) if (!blank(c.source) && unresolvedSources.includes(c.source)) c.flags.push("Source not in the reference list");
  for (const f of frameworks) if (!blank(f.source) && unresolvedSources.includes(f.source)) f.flags.push("Source not in the reference list");

  // Glossary is built from the concepts and frameworks, never separately invented
  const glossary = [
    ...concepts.filter((c) => !blank(c.definition)).map((c) => ({ term: c.term, definition: c.definition, from: "Concept" as const })),
    ...frameworks.filter((f) => !blank(f.what)).map((f) => ({ term: f.name, definition: f.what, from: "Framework" as const })),
  ].sort((a, b) => a.term.localeCompare(b.term));

  const audience = A(3, /Intended audience/i), purpose = A(3, /Purpose and scope/i);
  const checks: GCheck[] = [
    { id: "G1", label: "Audience, purpose and scope are recorded", met: Boolean(audience && purpose), detail: "Section 3." },
    { id: "G2", label: "At least three concepts are defined, each complete", met: concepts.length >= 3 && conceptComplete >= 3, detail: `${conceptComplete} of ${concepts.length} concepts complete.` },
    { id: "G3", label: "At least one framework with when-to-use and a limitation", met: frameworks.some((f) => !blank(f.when) && !blank(f.limitation)), detail: `${frameworks.length} frameworks recorded.` },
    { id: "G4", label: "At least three application steps, each with an action and output", met: steps.length >= 3 && steps.every((s) => !s.flags.length), detail: `${steps.length} steps.` },
    { id: "G5", label: "At least one worked example, every example labelled Real or Illustrative", met: examples.length >= 1 && examples.every((e) => e.kind !== "Not labelled"), detail: `${examples.length} examples, ${examples.filter((e) => e.kind === "Not labelled").length} unlabelled.` },
    { id: "G6", label: "Decision criteria say when NOT to use each approach", met: criteria.length >= 1 && criteria.every((c) => !c.flags.length), detail: `${criteria.length} criteria.` },
    { id: "G7", label: "At least three common mistakes with fixes", met: mistakes.filter((m) => !blank(m.fix)).length >= 3, detail: `${mistakes.filter((m) => !blank(m.fix)).length} mistakes with a fix.` },
    { id: "G8", label: "References are listed and every cited source is in the list", met: references.length >= 1 && unresolvedSources.length === 0, detail: `${references.length} references, ${unresolvedSources.length} cited sources missing from the list.` },
  ];
  const openChecks = checks.filter((c) => !c.met).length;

  return {
    concepts, frameworks, steps, examples, criteria, mistakes, checklists, references, glossary, unresolvedSources,
    conceptCompletePct: concepts.length ? Math.round((conceptComplete / concepts.length) * 100) : null,
    checks, openChecks, status: openChecks === 0 ? "Reference-ready" : "Not ready",
  };
}
