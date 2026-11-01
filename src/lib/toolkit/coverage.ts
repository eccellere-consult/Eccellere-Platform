/**
 * Coverage check (skill s4 step 3 and s5.4): before offering a custom draft, show
 * published marketplace kits that may already cover the topic. Pure scoring, no I/O.
 */
export interface CatalogueItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  serviceDomain: string;
  targetSectors: unknown;
  tags: unknown;
  price: number;
  memberPrice: number | null;
}

export interface CoverageMatch {
  slug: string;
  title: string;
  category: string;
  price: number;
  memberPrice: number | null;
  score: number;
  /** words that matched, shown to the client so the suggestion is explainable */
  matched: string[];
}

const STOP = new Set([
  "the", "and", "for", "with", "our", "your", "that", "this", "from", "are", "was", "were", "have", "has", "not",
  "but", "can", "will", "how", "what", "why", "into", "about", "need", "needs", "want", "wants", "kit", "toolkit",
  "guide", "playbook", "diagnostic", "problem", "solving", "learning", "framework", "template", "india", "indian",
  "business", "company", "improve", "improvement", "management", "strategy",
]);

export function tokens(text: string): string[] {
  const out = (text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => !STOP.has(w));
  return [...new Set(out)];
}

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

export function scoreCatalogue(query: string, items: CatalogueItem[], limit = 3): CoverageMatch[] {
  const q = tokens(query);
  if (!q.length) return [];
  const scored: CoverageMatch[] = [];
  for (const it of items) {
    const title = new Set(tokens(it.title));
    const tagText = new Set(tokens([...asStrings(it.tags), it.serviceDomain, ...asStrings(it.targetSectors)].join(" ")));
    const body = new Set(tokens(`${it.description} ${it.category}`));
    let score = 0;
    const matched: string[] = [];
    for (const w of q) {
      let hit = 0;
      if (title.has(w)) hit = 3;
      else if (tagText.has(w)) hit = 2;
      else if (body.has(w)) hit = 1;
      if (hit) { score += hit; matched.push(w); }
    }
    // require at least two distinct matched words, or a title hit, to avoid noise
    const titleHit = q.some((w) => title.has(w));
    if (score >= 3 && (matched.length >= 2 || titleHit)) {
      scored.push({ slug: it.slug, title: it.title, category: it.category, price: it.price, memberPrice: it.memberPrice, score, matched });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
