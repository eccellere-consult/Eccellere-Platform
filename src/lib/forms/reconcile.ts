/**
 * Source coverage: after the AI turns an uploaded document into a form, check that EVERY source element is accounted for.
 *
 * Each element ends up in exactly one state:
 *   mapped              the AI's source map points at a field, column, option, section or figure that exists in the form
 *   auto                the AI did not map it, but the same words are in the form (a deterministic text match)
 *   proposed-exclusion  the AI says leave it out; a PERSON must confirm, so it still counts as open
 *   excluded            a person confirmed leaving it out, with a reason
 *   not-covered         nothing in the form carries it
 *   not-sent            it did not fit in the request to the AI, so nothing was done with it
 *   structure           a heading or note: shown for completeness, not required
 *
 * Nothing is dropped silently, and the AI cannot close an item by itself.
 */
import type { DeclarativeTool } from '@/lib/strategyModels/declarative';
import { SUBSTANTIVE, type SourceElement } from './source';

export type CoverageStatus = 'mapped' | 'auto' | 'proposed-exclusion' | 'excluded' | 'not-covered' | 'not-sent' | 'structure';

export interface ItemCoverage { id: string; file: string; kind: SourceElement['kind']; text: string; where: string; status: CoverageStatus; target?: string; note?: string }
export interface Counts { total: number; required: number; mapped: number; auto: number; excluded: number; proposed: number; notCovered: number; notSent: number; closedPct: number }
export interface Coverage { items: ItemCoverage[]; assumptions: string[]; approximations: string[]; counts: Counts }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Every key, label, header and option in the form, to check the AI's targets and to match text the AI forgot to map. */
function inventory(tool: DeclarativeTool) {
  const keys = new Set<string>();
  const texts = new Set<string>();
  const optionSets: Set<string>[] = [];
  const addText = (s?: string) => { const n = norm(s ?? ''); if (n.length >= 4) texts.add(n); };
  for (const s of tool.sections) {
    keys.add(`section:${s.key}`);
    addText(s.title);
    // reading kept from the document and shown in place counts as carried into the form
    if (s.reading?.length) {
      keys.add(`reading:${s.key}`);
      for (const b of s.reading) {
        if (b.kind === 'heading' || b.kind === 'text') addText(b.text);
        else if (b.kind === 'list') b.items.forEach((i) => addText(i));
        else { b.head.forEach((c) => addText(c)); b.rows.forEach((r) => r.forEach((c) => addText(c))); }
      }
    }
    for (const p of s.parts) {
      if (p.kind === 'field') {
        keys.add(`field:${p.key}`); keys.add(`option:${p.key}`);
        addText(p.label);
        if (p.options?.length) { optionSets.push(new Set(p.options.map(norm))); p.options.forEach((o) => addText(o)); }
      } else {
        keys.add(`table:${p.key}`);
        addText(p.label);
        for (const r of p.fixedRows ?? []) addText(r);
        for (const c of p.columns) {
          keys.add(`column:${p.key}.${c.key}`);
          addText(c.header);
          if (c.options?.length) { optionSets.push(new Set(c.options.map(norm))); c.options.forEach((o) => addText(o)); }
        }
      }
    }
  }
  // a form that shows the source document itself carries every item of it
  if (tool.document?.length) keys.add('document');
  for (const d of tool.derived ?? []) { keys.add(`derived:${d.key}`); addText(d.label); }
  for (const o of tool.outputs ?? []) { keys.add(`derived:${o.key}`); addText(o.label); }
  return { keys, texts, optionSets };
}

function matchesForm(el: SourceElement, inv: ReturnType<typeof inventory>): boolean {
  let t = norm(el.text);
  // "Allowed values for B2: Yes, No" is matched on its values, not on the sentence around them.
  const av = /^allowed values for [^:]+:(.*)$/.exec(el.text.toLowerCase());
  if (av) {
    const vals = av[1].split(',').map(norm).filter(Boolean);
    return vals.length > 0 && inv.optionSets.some((set) => vals.every((v) => set.has(v)));
  }
  if (el.kind === 'tablehead' || el.kind === 'row') {
    const cells = el.text.split('|').map(norm).filter((c) => c.length >= 2);
    return cells.length > 0 && cells.every((c) => [...inv.texts].some((x) => x === c || x.includes(c) || (c.length >= 6 && c.includes(x))));
  }
  t = t.replace(/^(q|question) ?\d+ /, '').trim();
  if (t.length < 6) return false;
  for (const x of inv.texts) {
    if (x === t) return true;
    if (x.length >= 8 && t.length >= 8 && (x.includes(t) || t.includes(x))) return true;
  }
  const tw = new Set(t.split(' ').filter((w) => w.length > 2));
  if (tw.size < 3) return false;
  for (const x of inv.texts) {
    const xw = new Set(x.split(' ').filter((w) => w.length > 2));
    let hit = 0;
    for (const w of tw) if (xw.has(w)) hit += 1;
    if (hit / Math.max(tw.size, xw.size) >= 0.7) return true;
  }
  return false;
}

export function countsOf(items: readonly ItemCoverage[]): Counts {
  const c = { total: items.length, required: 0, mapped: 0, auto: 0, excluded: 0, proposed: 0, notCovered: 0, notSent: 0, closedPct: 100 };
  for (const i of items) {
    if (i.status === 'structure') continue;
    c.required += 1;
    if (i.status === 'mapped') c.mapped += 1;
    else if (i.status === 'auto') c.auto += 1;
    else if (i.status === 'excluded') c.excluded += 1;
    else if (i.status === 'proposed-exclusion') c.proposed += 1;
    else if (i.status === 'not-sent') c.notSent += 1;
    else c.notCovered += 1;
  }
  c.closedPct = c.required ? Math.round(((c.mapped + c.auto + c.excluded) / c.required) * 100) : 100;
  return c;
}

const asList = (v: unknown, max = 40): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim().slice(0, 300)).slice(0, max) : []);

export function reconcile(
  elements: readonly SourceElement[],
  raw: { sourceMap?: unknown; assumptions?: unknown; approximations?: unknown },
  tool: DeclarativeTool,
  notSent: readonly string[] = [],
): Coverage {
  const inv = inventory(tool);
  const byId = new Map<string, { target: string; note?: string }>();
  if (Array.isArray(raw.sourceMap)) {
    for (const m of raw.sourceMap) {
      const o = m as { element?: unknown; target?: unknown; note?: unknown };
      if (typeof o?.element !== 'string' || typeof o.target !== 'string') continue;
      if (!byId.has(o.element)) byId.set(o.element, { target: o.target.trim(), note: typeof o.note === 'string' ? o.note.trim().slice(0, 300) : undefined });
    }
  }
  const unsent = new Set(notSent);
  const items: ItemCoverage[] = elements.map((e) => {
    const base = { id: e.id, file: e.file, kind: e.kind, text: e.text, where: e.where };
    const m = byId.get(e.id);
    if (unsent.has(e.id)) return { ...base, status: SUBSTANTIVE.includes(e.kind) ? 'not-sent' : 'structure', note: 'Too long to send to the AI in one go.' };
    if (!SUBSTANTIVE.includes(e.kind)) return { ...base, status: 'structure', target: m?.target };
    // Reading the document reader recognised as not a question (advice, benchmarks, contents): listed as left out, with the reason, never silent.
    if (m && /^left-out:reading\b/.test(m.target)) return { ...base, status: 'excluded', target: m.target, note: m.note || 'Reading in the document, not a question; left out by the document reader.' };
    if (m && /^excluded\b/i.test(m.target)) return { ...base, status: 'proposed-exclusion', note: m.note || 'The AI left this out without a reason.' };
    if (m && inv.keys.has(m.target)) return { ...base, status: 'mapped', target: m.target };
    if (matchesForm(e, inv)) return { ...base, status: 'auto', note: m ? 'The AI pointed to something not in the form; the same words were found in it.' : undefined };
    return { ...base, status: 'not-covered', note: m ? `The AI mapped this to “${m.target.slice(0, 60)}”, which is not in the form.` : 'The AI did not map this.' };
  });
  return { items, assumptions: asList(raw.assumptions), approximations: asList(raw.approximations), counts: countsOf(items) };
}

/** A person confirms leaving items out on purpose. Only items that are open (not covered, proposed or not sent) can be excluded. */
export function confirmExclusions(cov: Coverage, ids: readonly string[], reason: string): Coverage {
  const why = reason.trim().slice(0, 300) || 'Left out on purpose by the reviewer.';
  const pick = new Set(ids);
  const items = cov.items.map((i) => (pick.has(i.id) && (i.status === 'not-covered' || i.status === 'proposed-exclusion' || i.status === 'not-sent') ? { ...i, status: 'excluded' as const, note: why } : i));
  return { ...cov, items, counts: countsOf(items) };
}

/** Warnings for the quality list: open items stay visible until a person has dealt with them. */
export function coverageWarnings(cov: Coverage): string[] {
  const c = cov.counts;
  const out: string[] = [];
  if (c.notCovered) out.push(`Source coverage: ${c.notCovered} item${c.notCovered === 1 ? '' : 's'} from the uploaded document ${c.notCovered === 1 ? 'is' : 'are'} not in the form. Add them, or confirm leaving them out.`);
  if (c.proposed) out.push(`Source coverage: the AI proposes leaving out ${c.proposed} item${c.proposed === 1 ? '' : 's'}. A person must confirm each one.`);
  if (c.notSent) out.push(`Source coverage: ${c.notSent} item${c.notSent === 1 ? ' was' : 's were'} too long to send to the AI and ${c.notSent === 1 ? 'was' : 'were'} not built. Split the file and build the rest.`);
  if (cov.approximations.length) out.push(`Approximated: ${cov.approximations.length} source field${cov.approximations.length === 1 ? ' was' : 's were'} shown with a different type. See the list on the review screen.`);
  return out;
}

/** Open items block "Looks right": a person must add them to the form or confirm leaving them out. Null when nothing is open. */
export function coverageErrors(cov: Coverage): string | null {
  const open = cov.counts.notCovered + cov.counts.proposed + cov.counts.notSent;
  return open ? `Source coverage: ${open} item${open === 1 ? '' : 's'} from the uploaded document ${open === 1 ? 'is' : 'are'} neither in the form nor confirmed as left out. Open the Form builder to resolve ${open === 1 ? 'it' : 'them'}.` : null;
}

/**
 * Re-check coverage against the form as it is now (after someone edited it). The AI's earlier mapping is kept where its target still
 * exists, confirmed exclusions stay confirmed, and anything else is matched by its words again.
 */
export function recheck(cov: Coverage, tool: DeclarativeTool): Coverage {
  const elements = cov.items.map(({ id, file, kind, text, where }) => ({ id, file, kind, text, where }));
  const sourceMap = cov.items.filter((i) => i.target).map((i) => ({ element: i.id, target: i.target as string }));
  const fresh = reconcile(elements, { sourceMap, assumptions: cov.assumptions, approximations: cov.approximations }, tool, cov.items.filter((i) => i.status === 'not-sent').map((i) => i.id));
  const old = new Map(cov.items.map((i) => [i.id, i]));
  const items = fresh.items.map((i) => {
    const was = old.get(i.id)!;
    if (was.status === 'excluded') return was;
    if (was.status === 'proposed-exclusion' && i.status === 'not-covered') return was;
    return i;
  });
  return { ...fresh, items, counts: countsOf(items) };
}
