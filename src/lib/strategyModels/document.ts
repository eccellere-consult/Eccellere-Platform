/**
 * strategyModels/document.ts — a source document kept AS IT IS, so its online version can be drawn like the original.
 *
 * When a toolkit is a designed Word document (coloured banners, call-out boxes, shaded tables, lists), rebuilding it as a form loses what
 * makes it readable. So the document itself is stored: its paragraphs and tables in order, each with the formatting it had (bold, colour,
 * size, shading, borders, alignment). The page draws these blocks, and only the places a person is meant to write in are "bound" to a
 * part of the form (a field, or one cell of a table), where an input is drawn instead of the blank.
 *
 * This is DATA, never markup: the page builds its own elements from it, so nothing from an uploaded file is ever run or inserted as HTML.
 * Pure types and a cleaner (no database, no React): safe for the browser and the server alike.
 */

/** A stretch of text with one look. `c` is a 6-digit hex colour, `z` a size in points, `f` marks the document's serif (heading) face. */
export interface DocRun { t: string; b?: 1; i?: 1; u?: 1; c?: string; z?: number; f?: 1 }

/** Where a blank in the document is answered: a field of the form, or one cell (row name, column key) of one of its tables. */
export type DocBind =
  | { f: string; kind: 'text' | 'long' | 'tick' }
  | { t: string; r: string; c: string; kind: 'text' | 'long' | 'rating' | 'choice' | 'tick' };

export interface DocPara {
  k: 'p';
  r: DocRun[];
  /** alignment: centre, right, justified */
  a?: 'c' | 'r' | 'j';
  /** a heading and its depth */
  h?: 1 | 2 | 3;
  /** a list item: 1 = bullet, 2 = numbered (`n` is its number); `lv` is its depth */
  li?: 1 | 2;
  n?: number;
  lv?: number;
  /** shading behind the paragraph, and a rule under it (hex colours) */
  sh?: string;
  bb?: string;
  /** space before and after, in pixels */
  sb?: number;
  sa?: number;
  /** left indent, in pixels */
  ind?: number;
  /** the document starts a new page here */
  pb?: 1;
  /** the blank at the end of this line is answered here */
  in?: DocBind;
}

export interface DocCell {
  p: DocPara[];
  /** columns and rows this cell spans */
  s?: number;
  rs?: number;
  /** shading (hex) */
  sh?: string;
  /** vertical alignment: middle or bottom */
  va?: 'm' | 'b';
  /** padding [vertical, horizontal] in pixels, when it is not the usual */
  pd?: [number, number];
  /** borders that differ from the table's: top and left, as "pixels hex" */
  bt?: string;
  bl?: string;
  /** this cell is a blank answered here */
  in?: DocBind;
}

export interface DocTable {
  k: 't';
  /** column widths as percentages */
  w?: number[];
  /** the colour of the cell borders (hex), or none */
  bd?: string;
  rows: { c: DocCell[] }[];
  /** a "Draft with AI" button for this section of the form is shown above this table */
  ai?: string;
}

export type DocBlock = (DocPara & { ai?: string }) | DocTable;

export const DOC_LIMITS = { blocks: 6000, rows: 400, cells: 16, paras: 200, runs: 200, text: 8000, total: 3_000_000 } as const;

const HEX = /^[0-9A-Fa-f]{6}$/;
const KEY = /^[a-z][a-z0-9_]*$/;
const hex = (x: unknown): string | undefined => (typeof x === 'string' && HEX.test(x) ? x.toUpperCase() : undefined);
const num = (x: unknown, min: number, max: number): number | undefined => (typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? Math.round(x * 10) / 10 : undefined);
const edge = (x: unknown): string | undefined => (typeof x === 'string' && /^\d{1,2} [0-9A-Fa-f]{6}$/.test(x) ? x.toUpperCase() : undefined);
const put = <T extends object>(o: T, k: string, v: unknown): void => { if (v !== undefined) (o as Record<string, unknown>)[k] = v; };

function cleanBind(x: unknown): DocBind | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  if (typeof o.f === 'string' && KEY.test(o.f)) return { f: o.f, kind: o.kind === 'long' ? 'long' : o.kind === 'tick' ? 'tick' : 'text' };
  if (typeof o.t === 'string' && KEY.test(o.t) && typeof o.c === 'string' && KEY.test(o.c) && typeof o.r === 'string' && o.r.trim()) {
    const kind = (['text', 'long', 'rating', 'choice', 'tick'] as const).find((k) => k === o.kind) ?? 'text';
    return { t: o.t, r: o.r.slice(0, 400), c: o.c, kind };
  }
  return undefined;
}

function cleanPara(x: unknown, budget: { left: number }): DocPara | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const runs: DocRun[] = [];
  for (const r of (Array.isArray(o.r) ? o.r : []).slice(0, DOC_LIMITS.runs)) {
    if (!r || typeof r !== 'object' || typeof (r as DocRun).t !== 'string') continue;
    const q = r as Record<string, unknown>;
    const t = (q.t as string).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, DOC_LIMITS.text);
    if (!t) continue;
    budget.left -= t.length;
    if (budget.left < 0) break;
    const run: DocRun = { t };
    if (q.b === 1) run.b = 1;
    if (q.i === 1) run.i = 1;
    if (q.u === 1) run.u = 1;
    if (q.f === 1) run.f = 1;
    put(run, 'c', hex(q.c));
    put(run, 'z', num(q.z, 5, 60));
    runs.push(run);
  }
  const p: DocPara = { k: 'p', r: runs };
  if (o.a === 'c' || o.a === 'r' || o.a === 'j') p.a = o.a;
  if (o.h === 1 || o.h === 2 || o.h === 3) p.h = o.h;
  if (o.li === 1 || o.li === 2) p.li = o.li;
  put(p, 'n', num(o.n, 1, 999));
  put(p, 'lv', num(o.lv, 0, 8));
  put(p, 'sh', hex(o.sh));
  put(p, 'bb', hex(o.bb));
  put(p, 'sb', num(o.sb, 0, 80));
  put(p, 'sa', num(o.sa, 0, 80));
  put(p, 'ind', num(o.ind, 0, 200));
  if (o.pb === 1) p.pb = 1;
  put(p, 'in', cleanBind(o.in));
  return p;
}

/** A stored document as the page may draw it: only the known shapes, plain strings, valid colours and numbers, cut to the limits. */
export function cleanDocument(raw: unknown): DocBlock[] {
  if (!Array.isArray(raw)) return [];
  const budget = { left: DOC_LIMITS.total };
  const out: DocBlock[] = [];
  for (const b of raw.slice(0, DOC_LIMITS.blocks)) {
    if (!b || typeof b !== 'object' || budget.left < 0) continue;
    const o = b as Record<string, unknown>;
    const ai = typeof o.ai === 'string' && KEY.test(o.ai) ? o.ai : undefined;
    if (o.k === 'p') { const p = cleanPara(o, budget); if (p) out.push(ai ? { ...p, ai } : p); continue; }
    if (o.k !== 't' || !Array.isArray(o.rows)) continue;
    const t: DocTable = { k: 't', rows: [] };
    if (Array.isArray(o.w) && o.w.length <= DOC_LIMITS.cells && o.w.every((x) => typeof x === 'number' && x > 0 && x <= 100)) t.w = (o.w as number[]).map((x) => Math.round(x * 10) / 10);
    put(t, 'bd', hex(o.bd));
    if (ai) t.ai = ai;
    for (const row of o.rows.slice(0, DOC_LIMITS.rows)) {
      const cells = (row && typeof row === 'object' && Array.isArray((row as { c?: unknown }).c) ? (row as { c: unknown[] }).c : []).slice(0, DOC_LIMITS.cells);
      const c: DocCell[] = [];
      for (const cell of cells) {
        if (!cell || typeof cell !== 'object') continue;
        const q = cell as Record<string, unknown>;
        const d: DocCell = { p: (Array.isArray(q.p) ? q.p : []).slice(0, DOC_LIMITS.paras).map((x) => cleanPara(x, budget)).filter((x): x is DocPara => !!x) };
        put(d, 's', num(q.s, 2, DOC_LIMITS.cells));
        put(d, 'rs', num(q.rs, 2, DOC_LIMITS.rows));
        put(d, 'sh', hex(q.sh));
        if (q.va === 'm' || q.va === 'b') d.va = q.va;
        if (Array.isArray(q.pd) && q.pd.length === 2 && q.pd.every((x) => typeof x === 'number' && x >= 0 && x <= 60)) d.pd = [Math.round(q.pd[0] as number), Math.round(q.pd[1] as number)];
        put(d, 'bt', edge(q.bt));
        put(d, 'bl', edge(q.bl));
        put(d, 'in', cleanBind(q.in));
        c.push(d);
      }
      if (c.length) t.rows.push({ c });
    }
    if (t.rows.length) out.push(t);
  }
  return out;
}

export const paraText = (p: DocPara): string => p.r.map((r) => r.t).join('');
export const cellText = (c: DocCell): string => c.p.map(paraText).join('\n').trim();

/** Every place in the document that is bound to the form, in order. */
export function documentBinds(doc: readonly DocBlock[]): DocBind[] {
  const out: DocBind[] = [];
  for (const b of doc) {
    if (b.k === 'p') { if (b.in) out.push(b.in); continue; }
    for (const row of b.rows) for (const c of row.c) { if (c.in) out.push(c.in); for (const p of c.p) if (p.in) out.push(p.in); }
  }
  return out;
}
