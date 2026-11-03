/**
 * What the Advisor may draw on today: Eccellere's own published content (tools, services, marketplace resources). No author names, no
 * client names and nothing private is ever included. Retrieval is keyword scoring with a heavier weight on titles; the passages are
 * handed to the model as untrusted data. The approved Google Drive library (anonymised, approved pieces only) is added by the server; vector search is on the roadmap (docs/advisor/PLAN.md).
 */
import { servicesData } from "@/lib/services-data";
import { assets } from "@/lib/marketplace-data";

export type SourceKind = "tool" | "service" | "resource" | "knowledge";
/** `href` is empty for library documents: clients are never given a link to a Drive file. `ref` is a safe position such as "part 3". */
export interface Passage { id: string; kind: SourceKind; title: string; href: string; text: string; ref?: string }

const STOP = new Set("a an and are as at be but by can do does for from how i if in into is it its me my of on or our so than that the their then there these they this to us was we what when where which who why will with would you your should could about over under more most".split(" "));

export const tokens = (s: string): string[] =>
  s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ""));

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

/** Lines that read like instructions to the model are dropped from anything we pass on. */
const INSTRUCTION_LIKE = /\b(ignore (all|any|the|previous|prior)|disregard|system prompt|you are now|act as|reveal|do not tell|override|jailbreak)\b/i;
export const stripInstructions = (s: string): string => s.split(/\n+/).filter((l) => !INSTRUCTION_LIKE.test(l)).join("\n");

export interface ToolLite { slug: string; name: string; category: string; does?: string | null; whenToUse?: string | null }

export interface LibraryChunk { id: string; title: string; seq: number; text: string }

export function buildCorpus(tools: readonly ToolLite[], library: readonly LibraryChunk[] = []): Passage[] {
  const out: Passage[] = [];
  for (const c of library) out.push({ id: `knowledge:${c.id}`, kind: "knowledge", title: c.title, href: "", ref: `part ${c.seq + 1}`, text: c.text });
  for (const t of tools) {
    out.push({ id: `tool:${t.slug}`, kind: "tool", title: t.name, href: `/tools/${t.slug}`, text: [t.category, t.does, t.whenToUse && `Use it when: ${t.whenToUse}`].filter(Boolean).join(". ") });
  }
  for (const s of servicesData) {
    out.push({
      id: `service:${s.slug}`, kind: "service", title: s.name, href: `/services/${s.slug}`,
      text: [s.tagline, s.heroDescription, `Typical problems: ${s.painPoints.map((p) => p.headline).join("; ")}`, `Deliverables: ${s.deliverables.join("; ")}`].join(". "),
    });
  }
  for (const a of assets) {
    out.push({ id: `resource:${a.slug}`, kind: "resource", title: a.title, href: `/marketplace/${a.slug}`, text: [a.category, a.description, a.includes.length ? `Includes: ${a.includes.join("; ")}` : ""].filter(Boolean).join(". ") });
  }
  return out;
}

/** The best passages for a question, most relevant first. Returns nothing when nothing matches: the Advisor then says so. */
export function search(corpus: readonly Passage[], query: string, limit = 5): Passage[] {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const scored = corpus.map((p) => {
    const title = new Set(tokens(p.title));
    const body = tokens(p.text);
    const freq = new Map<string, number>();
    for (const w of body) freq.set(w, (freq.get(w) ?? 0) + 1);
    let score = 0;
    let hit = 0;
    for (const w of q) {
      const f = freq.get(w) ?? 0;
      const inTitle = title.has(w);
      if (f || inTitle) hit++;
      score += (inTitle ? 4 : 0) + Math.min(f, 3);
    }
    return { p, score: score * (0.5 + hit / q.length), hit };
  });
  const seen = new Set<string>();
  return scored
    .filter((s) => s.hit >= Math.min(2, q.length) && s.score > 0)
    .sort((a, b) => b.score - a.score)
    // one piece per document, so every [S#] number names a different source
    .filter((s) => { const k = `${s.p.kind}|${s.p.title}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, limit)
    .map((s) => ({ ...s.p, text: clip(stripInstructions(s.p.text), 700) }));
}
