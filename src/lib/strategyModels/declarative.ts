/**
 * strategyModels/declarative.ts — a tool defined as DATA, not code, so an admin or an AI can create one without a deploy.
 *
 * A declarative tool is the JSON-serialisable twin of a ModelDefinition: the same sections, parts, tables and boards, but where a code
 * definition has a function (a computed column, a "result at a glance", an output), a declarative tool has a RULE from a small fixed
 * vocabulary (calc, weighted, top, quadrant, template, when). `interpret` turns the data into an ordinary ModelDefinition, so the form,
 * the Excel template, the importer, the AI prompts, the outputs and the saved answers work exactly as they do for a hand-coded tool.
 *
 * Safety: stored JSON is never executed. A rule is data that `ruleFn` walks; there is no eval and no `new Function`.
 * Honesty: `source.draftedBy` records who wrote it; an AI draft is published only after a person has reviewed it and the quality gate passes.
 */
import { col, long, num, rating, section, select, table, text } from './build';
import { boardTable } from './boards';
import { slug as keySlug } from './structure';
import { fmtNum, norm, toNum } from './values';
import { diagramIssues, type DiagramSpec } from './diagrams/templates';
import type { BoardSpec, ColumnType, Derived, FieldType, ModelDefinition, ModelSample, ModelValues, Output, Part, RatingScale, Reference, Row, Section, Tone } from './types';

export const TOOL_CATEGORIES = ['analytical', 'creative', 'decision-matrix', 'planning', 'root-cause', 'prioritisation', 'strategy', 'other'] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

// ── The rule vocabulary ──────────────────────────────────────────────────────────────────────────────────────────────

/** A number a rule can read: a literal, a single field, a cell of the current row (computed columns only), or an aggregate over a table's column. */
export type Operand = number | { field: string } | { cell: string } | { agg: 'sum' | 'avg' | 'min' | 'max' | 'count'; table: string; col?: string };
export type Expr =
  | Operand
  | { add: Expr[] } | { sub: [Expr, Expr] } | { mul: Expr[] } | { div: [Expr, Expr] }
  // Added for the Agent pilots (decision analysis, pricing, inventory, capital budgeting). All are pure functions; an impossible input
  // (square root of a negative, logarithm of zero, division by zero) gives no answer rather than a wrong one.
  | { pow: [Expr, Expr] } | { sqrt: Expr } | { ln: Expr } | { exp: Expr } | { abs: Expr } | { min: Expr[] } | { max: Expr[] };

export type Rule =
  | { op: 'calc'; expr: Expr; format?: 'int' | 'dp1' | 'dp2' | 'pct'; suffix?: string }
  | { op: 'weighted'; table: string; value: string; weight: string; format?: 'dp1' | 'dp2' }
  | { op: 'top'; table: string; by: string; label: string }
  | { op: 'quadrant'; x: Expr; y: Expr; midX: number; midY: number; names: [string, string, string, string] }
  | { op: 'template'; text: string }
  | { op: 'when'; expr: Expr; gt?: number; lt?: number; then: string; else: string; tones?: { then?: Tone; else?: Tone } }
  /** Internal rate of return of the cash flows in a column (first row = period 0), as a percentage. No answer unless the flows change sign. */
  | { op: 'irr'; table: string; col: string; format?: 'dp1' | 'dp2' }
  /** Years until the running total of a cash-flow column turns positive (first row = period 0), interpolated within the year. */
  | { op: 'payback'; table: string; col: string; never?: string };

// ── The declarative tool ─────────────────────────────────────────────────────────────────────────────────────────────

export interface DeclField { kind: 'field'; key: string; label: string; type: FieldType; help: string; example?: string; options?: string[]; scale?: Partial<RatingScale>; unit?: string }
export interface DeclColumn { key: string; header: string; help: string; type: ColumnType; options?: string[]; scale?: Partial<RatingScale>; unit?: string; half?: boolean; rule?: Rule }
export interface DeclTable {
  kind: 'table'; key: string; label: string; help: string; rowLabel: string; columns: DeclColumn[];
  fixedRows?: string[]; rowHints?: Record<string, string>; minRows?: number; maxRows?: number;
  /** A board: its columns are generated from the spec (the declared columns are ignored). */
  board?: { spec: BoardSpec; regions?: string[]; statuses?: string[]; scale?: Partial<RatingScale> };
}
export type DeclPart = DeclField | DeclTable;
export interface DeclSection { key: string; title: string; summary: string; parts: DeclPart[] }
export interface DeclDerived { key: string; label: string; help?: string; rule: Rule }
export interface DeclOutput { key: string; label: string; rule: Rule; conditional?: boolean }
/** A worked example. It is optional and, when an AI drafted it, labelled as such; `analysis` is optional because an AI-drafted tool has no authored verdict. */
export interface DeclSample { scenario: string; values: Record<string, string>; tables: Record<string, Row[]>; why?: Record<string, string> }
/** Where a tool came from. `reviewedBy`/`reviewedAt` are set when a person publishes it: an AI draft is never published without them. */
export interface DeclSource { deck?: string; slides?: number[]; hash?: string; draftedBy: 'ai' | 'human'; draftedAt?: string; reviewedBy?: string; reviewedAt?: string }

export interface DeclarativeTool {
  schema: 1;
  slug: string;
  name: string;
  category: ToolCategory;
  /** The section's own axis (for example a problem-solving stage), when the section has one. */
  stage?: string;
  does: string;
  whenToUse: string;
  whenNotToUse?: string;
  next?: string;
  reference: Reference;
  diagram?: DiagramSpec;
  sections: DeclSection[];
  derived?: DeclDerived[];
  outputs?: DeclOutput[];
  analysisGuide: string;
  sample?: DeclSample;
  source?: DeclSource;
  links?: { buildsOn: string[]; feeds: string[] };
}

// ── Reading a rule ───────────────────────────────────────────────────────────────────────────────────────────────────

const rowsOf = (v: ModelValues, table: string): Row[] => v.tables[table] ?? [];
const present = (r: Row) => Object.values(r).some((x) => (x ?? '').trim() !== '');

/**
 * Computed columns by table key, then column key. A computed column's value is worked out, never stored in the saved rows, so a rule that
 * reads such a column (a total of it, the top row by it) must work it out again row by row. (Added when the Tools marketplace found that a
 * 'top' output over a computed column never produced a result.)
 */
export type ComputedMap = Record<string, Record<string, Rule>>;

/** The text of a column in a row, working it out when it is a computed column. Computed columns do not nest here (no map is passed down). */
function colText(r: Row, table: string, col: string, v: ModelValues, cm?: ComputedMap): string {
  const rule = cm?.[table]?.[col];
  return rule ? ruleFn(rule)(r, v) ?? '' : r[col] ?? '';
}

function operand(o: Operand, row: Row | undefined, v: ModelValues, cm?: ComputedMap): number | null {
  if (typeof o === 'number') return o;
  if ('field' in o) return toNum(v.fields[o.field]);
  if ('cell' in o) return row ? toNum(row[o.cell]) : null;
  const rows = rowsOf(v, o.table);
  // count: the rows that have anything in them, or (with `col`) the rows where that column is filled in, whether it holds a number or words.
  if (o.agg === 'count') return o.col ? rows.filter((r) => colText(r, o.table, o.col!, v, cm).trim() !== '').length : rows.filter(present).length;
  const ns = o.col ? rows.map((r) => toNum(colText(r, o.table, o.col!, v, cm))).filter((n): n is number => n !== null) : [];
  if (!ns.length) return null;
  return o.agg === 'sum' ? ns.reduce((a, b) => a + b, 0) : o.agg === 'avg' ? ns.reduce((a, b) => a + b, 0) / ns.length : o.agg === 'min' ? Math.min(...ns) : Math.max(...ns);
}

function evalExpr(e: Expr, row: Row | undefined, v: ModelValues, cm?: ComputedMap): number | null {
  if (typeof e === 'number' || 'field' in e || 'cell' in e || 'agg' in e) return operand(e as Operand, row, v, cm);
  const all = (xs: Expr[]) => { const ns = xs.map((x) => evalExpr(x, row, v, cm)); return ns.some((n) => n === null) ? null : (ns as number[]); };
  if ('add' in e) { const ns = all(e.add); return ns ? ns.reduce((a, b) => a + b, 0) : null; }
  if ('mul' in e) { const ns = all(e.mul); return ns ? ns.reduce((a, b) => a * b, 1) : null; }
  if ('sub' in e) { const ns = all(e.sub); return ns ? ns[0] - ns[1] : null; }
  if ('div' in e) { const ns = all(e.div); return ns && ns[1] !== 0 ? ns[0] / ns[1] : null; }
  const fin = (n: number): number | null => (Number.isFinite(n) ? n : null);
  if ('pow' in e) { const ns = all(e.pow); return ns ? fin(Math.pow(ns[0], ns[1])) : null; }
  if ('min' in e) { const ns = all(e.min); return ns && ns.length ? Math.min(...ns) : null; }
  if ('max' in e) { const ns = all(e.max); return ns && ns.length ? Math.max(...ns) : null; }
  const one = (x: Expr) => evalExpr(x, row, v, cm);
  if ('sqrt' in e) { const n = one(e.sqrt); return n === null || n < 0 ? null : Math.sqrt(n); }
  if ('ln' in e) { const n = one(e.ln); return n === null || n <= 0 ? null : Math.log(n); }
  if ('exp' in e) { const n = one(e.exp); return n === null ? null : fin(Math.exp(n)); }
  if ('abs' in e) { const n = one(e.abs); return n === null ? null : Math.abs(n); }
  return null;
}

/** The cash flows of a column, in row order; null if any filled row is not a number or fewer than two rows are filled. */
function flows(v: ModelValues, table: string, col: string, cm?: ComputedMap): number[] | null {
  const raw = rowsOf(v, table).map((r) => colText(r, table, col, v, cm).trim()).filter((t) => t !== '');
  const ns = raw.map((t) => toNum(t));
  return ns.length >= 2 && ns.every((n): n is number => n !== null) ? (ns as number[]) : null;
}

/** IRR by bisection on net present value. Returns a percentage, or null when the flows do not change sign or no rate between -99% and 1000% fits. */
export function irrOf(cf: number[]): number | null {
  if (!(cf.some((x) => x < 0) && cf.some((x) => x > 0))) return null;
  const npv = (r: number) => cf.reduce((s, x, t) => s + x / Math.pow(1 + r, t), 0);
  let lo = -0.99, hi = 10;
  let flo = npv(lo), fhi = npv(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fm = npv(mid);
    if (fm === 0) return mid * 100;
    if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return ((lo + hi) / 2) * 100;
}

/** Payback in years: the point where the running total crosses zero, interpolated within the period; null if it never does. */
export function paybackOf(cf: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cf.length; t++) {
    const prev = cum;
    cum += cf[t];
    if (cum >= 0 && t > 0 && prev < 0) return t - 1 + -prev / cf[t];
    if (cum >= 0 && t === 0 && cf[0] >= 0) return 0;
  }
  return null;
}

const show = (n: number, f: 'int' | 'dp1' | 'dp2' | 'pct' | undefined): string =>
  f === 'int' ? String(Math.round(n)) : f === 'dp2' ? fmtNum(n, 2) : f === 'pct' ? `${fmtNum(n, 1)}%` : fmtNum(n, 1);

/** A rule as a function of the current row (computed columns) and the answers. Null until there is enough input. */
export function ruleFn(rule: Rule, cm?: ComputedMap): (row: Row | undefined, v: ModelValues) => string | null {
  return (row, v) => {
    try {
      switch (rule.op) {
        case 'calc': { const n = evalExpr(rule.expr, row, v, cm); return n === null || !Number.isFinite(n) ? null : `${show(n, rule.format)}${rule.suffix ?? ''}`; }
        case 'weighted': {
          const rs = rowsOf(v, rule.table).map((r) => ({ a: toNum(colText(r, rule.table, rule.value, v, cm)), w: toNum(colText(r, rule.table, rule.weight, v, cm)) })).filter((x): x is { a: number; w: number } => x.a !== null && x.w !== null);
          const w = rs.reduce((s, x) => s + x.w, 0);
          return rs.length && w !== 0 ? show(rs.reduce((s, x) => s + x.a * x.w, 0) / w, rule.format ?? 'dp1') : null;
        }
        case 'top': {
          const rs = rowsOf(v, rule.table).map((r) => ({ n: toNum(colText(r, rule.table, rule.by, v, cm)), l: colText(r, rule.table, rule.label, v, cm).trim() })).filter((x): x is { n: number; l: string } => x.n !== null && x.l !== '');
          return rs.length ? rs.reduce((best, x) => (x.n > best.n ? x : best)).l : null;
        }
        case 'quadrant': {
          const x = evalExpr(rule.x, row, v, cm), y = evalExpr(rule.y, row, v, cm);
          return x === null || y === null ? null : rule.names[(x > rule.midX ? 1 : 0) + (y > rule.midY ? 2 : 0)];
        }
        case 'template': {
          let blank = false;
          const out = rule.text.replace(/\{([a-z0-9_]+)\}/g, (_m, k: string) => { const val = (v.fields[k] ?? '').trim(); if (!val) blank = true; return val; });
          return blank ? null : out;
        }
        case 'irr': { const cf = flows(v, rule.table, rule.col, cm); const r = cf ? irrOf(cf) : null; return r === null ? null : show(r, rule.format ?? 'dp1') + '%'; }
        case 'payback': {
          const cf = flows(v, rule.table, rule.col, cm);
          if (!cf) return null;
          const p = paybackOf(cf);
          return p === null ? (rule.never ?? 'Not within the period') : `${fmtNum(p, 1)} years`;
        }
        case 'when': {
          const n = evalExpr(rule.expr, row, v, cm);
          if (n === null) return null;
          return (rule.gt === undefined || n > rule.gt) && (rule.lt === undefined || n < rule.lt) ? rule.then : rule.else;
        }
      }
    } catch { return null; }
  };
}

const toneFn = (rule: Rule, cm?: ComputedMap): Derived['tone'] =>
  rule.op === 'when' && rule.tones ? (v) => {
    const n = evalExpr(rule.expr, undefined, v, cm);
    if (n === null) return undefined;
    return (rule.gt === undefined || n > rule.gt) && (rule.lt === undefined || n < rule.lt) ? rule.tones?.then : rule.tones?.else;
  } : undefined;

// ── From data to an ordinary ModelDefinition ────────────────────────────────────────────────────────────────────────

function partOf(p: DeclPart, cm?: ComputedMap): Part {
  if (p.kind === 'field') {
    const ex = p.example ?? '';
    switch (p.type) {
      case 'longtext': return long(p.key, p.label, p.help, ex);
      case 'select': return select(p.key, p.label, p.help, p.options ?? [], ex);
      case 'rating': return rating(p.key, p.label, p.help, p.scale ?? {}, ex);
      case 'number': return num(p.key, p.label, p.help, p.unit ?? '', ex);
      default: return text(p.key, p.label, p.help, ex);
    }
  }
  if (p.board) return boardTable(p.key, p.label, p.help, p.board.spec, { regions: p.board.regions, statuses: p.board.statuses, scale: p.board.scale, maxRows: p.maxRows });
  const columns = p.columns.map((c) => {
    switch (c.type) {
      case 'longtext': return col.long(c.key, c.header, c.help, { half: c.half });
      case 'number': return col.num(c.key, c.header, c.help, c.unit ?? '', { half: c.half });
      case 'select': return col.select(c.key, c.header, c.help, c.options ?? []);
      case 'rating': return col.rating(c.key, c.header, c.help, c.scale ?? {});
      case 'computed': { const f = ruleFn(c.rule ?? { op: 'template', text: '' }, cm); return col.computed(c.key, c.header, c.help, (row, v) => f(row, v) ?? ''); }
      default: return col.text(c.key, c.header, c.help, { half: c.half });
    }
  });
  return table(p.key, p.label, p.help, p.rowLabel, columns, { fixed: p.fixedRows, hints: p.rowHints, min: p.minRows, max: p.maxRows });
}

/** The ModelDefinition the engine runs. Everything downstream (form, kit, AI, outputs) treats it like a hand-coded one. */
function computedMapOf(tool: DeclarativeTool): ComputedMap {
  const cm: ComputedMap = {};
  for (const s of tool.sections) for (const p of s.parts) {
    if (p.kind !== 'table' || p.board) continue;
    for (const c of p.columns) if (c.type === 'computed' && c.rule) (cm[p.key] ??= {})[c.key] = c.rule;
  }
  return cm;
}

export function interpret(tool: DeclarativeTool): ModelDefinition {
  const cm = computedMapOf(tool);
  const sections: Section[] = tool.sections.map((s) => section(s.key, s.title, s.summary, ...s.parts.map((p) => partOf(p, cm))));
  const derived: Derived[] = (tool.derived ?? []).map((d) => { const f = ruleFn(d.rule, cm); return { key: d.key, label: d.label, help: d.help, compute: (v) => f(undefined, v), tone: toneFn(d.rule, cm) }; });
  const outputs: Output[] = (tool.outputs ?? []).map((o) => { const f = ruleFn(o.rule, cm); return { key: o.key, label: o.label, compute: (v) => f(undefined, v), conditional: o.conditional }; });
  return { toolId: tool.slug, reference: tool.reference, sections, derived, outputs, analysisGuide: tool.analysisGuide };
}

/** The worked example, if the tool has one. `analysis`, `recommendations` and `actionables` are present only when a person authored them. */
export type DeclaredSample = Omit<ModelSample, 'analysis' | 'recommendations' | 'actionables'> & Partial<Pick<ModelSample, 'analysis' | 'recommendations' | 'actionables'>>;
export const sampleOf = (tool: DeclarativeTool): DeclaredSample | null =>
  tool.sample ? { scenario: tool.sample.scenario, values: tool.sample.values, tables: tool.sample.tables, why: tool.sample.why ?? {} } : null;

// ── The quality gate ────────────────────────────────────────────────────────────────────────────────────────────────

export interface Issue { level: 'error' | 'warn'; path: string; message: string }
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SNAKE = /^[a-z][a-z0-9_]*$/;

/**
 * The checks a declarative tool must pass before it is published (errors block, warnings do not). They mirror what the content tests demand of a
 * hand-coded definition, plus the checks that stored data needs (every rule refers to something that exists).
 */
export function validateDeclarative(raw: unknown): Issue[] {
  const out: Issue[] = [];
  const err = (path: string, message: string) => out.push({ level: 'error', path, message });
  const warn = (path: string, message: string) => out.push({ level: 'warn', path, message });
  const t = raw as Partial<DeclarativeTool> | null;
  if (!t || typeof t !== 'object') { err('', 'Not an object'); return out; }
  if (t.schema !== 1) err('schema', 'schema must be 1');
  if (!t.slug || !KEBAB.test(t.slug) || t.slug.length > 60) err('slug', 'slug must be kebab-case, at most 60 characters');
  if (!t.name || t.name.trim().length < 2 || t.name.length > 80) err('name', 'name must be 2 to 80 characters');
  if (!TOOL_CATEGORIES.includes(t.category as ToolCategory)) err('category', `category must be one of ${TOOL_CATEGORIES.join(', ')}`);
  for (const [k, min] of [['does', 20], ['whenToUse', 15], ['analysisGuide', 40]] as const) if ((t[k] ?? '').trim().length < min) err(k, `${k} needs at least ${min} characters`);
  const ref = t.reference;
  if (!ref) err('reference', 'reference is required');
  else {
    if ((ref.summary ?? '').trim().length < 20) err('reference.summary', 'summary needs at least 20 characters');
    if ((ref.caption ?? '').trim().length < 10) err('reference.caption', 'caption needs at least 10 characters');
    if (!Array.isArray(ref.howToRead) || ref.howToRead.length < 2 || ref.howToRead.length > 4) err('reference.howToRead', 'howToRead needs 2 to 4 lines');
    if (!(ref.originator ?? '').trim()) warn('reference.originator', 'No originator named: leave it blank rather than guess, and say so on the page');
  }
  if (!t.diagram) warn('diagram', 'No diagram: the page shows the reference card only');
  else for (const m of diagramIssues(t.diagram)) err('diagram', m);
  if (!t.sample) warn('sample', 'No worked example');

  const fieldKeys = new Set<string>(), tableCols = new Map<string, Set<string>>(), keys = new Set<string>(), labels = new Set<string>();
  if (!Array.isArray(t.sections) || !t.sections.length) err('sections', 'at least one section is required');
  (t.sections ?? []).forEach((s, si) => {
    const sp = `sections[${si}]`;
    if (!s.title?.trim()) err(`${sp}.title`, 'title is required');
    if (!Array.isArray(s.parts) || !s.parts.length) err(`${sp}.parts`, 'a section needs at least one part');
    (s.parts ?? []).forEach((p, pi) => {
      const pp = `${sp}.parts[${pi}]`;
      if (!p.key || !SNAKE.test(p.key)) err(`${pp}.key`, 'key must be snake_case');
      if (keys.has(p.key)) err(`${pp}.key`, `duplicate key ${p.key}`);
      keys.add(p.key);
      const lab = norm(p.label);
      if (!lab) err(`${pp}.label`, 'label is required'); else if (labels.has(lab)) err(`${pp}.label`, `duplicate label ${p.label}`); else labels.add(lab);
      if ((p.help ?? '').trim().length <= 10) err(`${pp}.help`, 'help needs more than 10 characters');
      if (p.kind === 'field') {
        fieldKeys.add(p.key);
        if (p.type === 'select' && (p.options?.length ?? 0) < 2) err(`${pp}.options`, 'a select needs at least 2 options');
        if (p.type === 'rating' && p.scale && p.scale.min !== undefined && p.scale.max !== undefined && p.scale.max <= p.scale.min) err(`${pp}.scale`, 'scale max must exceed min');
        if (p.type === 'number' && !p.unit) err(`${pp}.unit`, 'a number needs a unit');
        if (!(p.example ?? '').trim() && p.type !== 'longtext') warn(`${pp}.example`, 'no example');
      } else if (p.kind === 'table') {
        const ck = new Set<string>();
        tableCols.set(p.key, ck);
        if (p.board) {
          const b = p.board.spec;
          const names = [b.noteColumn, b.regionColumn, b.statusColumn, b.xColumn, b.yColumn].filter(Boolean) as string[];
          names.forEach((n) => ck.add(n));
          if (b.layout === 'regions' && !b.regionColumn) err(`${pp}.board.regionColumn`, 'a regions board needs regionColumn');
          if (b.layout === 'regions' && !b.freeRegions && (p.board.regions?.length ?? 0) < 2) err(`${pp}.board.regions`, 'a fixed-regions board needs at least 2 regions');
          if (b.layout === 'grid' && (!b.xColumn || !b.yColumn || !b.axes)) err(`${pp}.board`, 'a grid board needs xColumn, yColumn and axes');
          if (b.layout === 'grid' && b.quadrants && b.quadrants.length !== 4) err(`${pp}.board.quadrants`, 'a grid board names exactly 4 quadrants');
        } else {
          if ((p.columns?.length ?? 0) < 2) err(`${pp}.columns`, 'a table needs at least 2 columns');
          const seen = new Set<string>();
          (p.columns ?? []).forEach((c, ci) => {
            const cp = `${pp}.columns[${ci}]`;
            if (!c.key || !SNAKE.test(c.key)) err(`${cp}.key`, 'column key must be snake_case');
            if (seen.has(c.key)) err(`${cp}.key`, `duplicate column key ${c.key}`);
            seen.add(c.key); ck.add(c.key);
            if ((c.help ?? '').trim().length <= 5) err(`${cp}.help`, 'column help needs more than 5 characters');
            if (c.type === 'select' && (c.options?.length ?? 0) < 2) err(`${cp}.options`, 'a select column needs at least 2 options');
            if (c.type === 'computed' && !c.rule) err(`${cp}.rule`, 'a computed column needs a rule');
          });
          if (p.fixedRows?.length) {
            if (p.columns?.[0]?.type !== 'text') err(`${pp}.columns[0]`, 'the first column of a fixed table must be text (it holds the row name)');
            for (const k of Object.keys(p.rowHints ?? {})) if (!p.fixedRows.includes(k)) err(`${pp}.rowHints`, `hint for unknown row ${k}`);
          }
        }
      } else err(`${pp}.kind`, 'kind must be field or table');
    });
  });

  // every rule must point at something that exists
  const checkExpr = (e: Expr | undefined, path: string, rowCols?: Set<string>): void => {
    if (e === undefined) { err(path, 'missing expression'); return; }
    if (typeof e === 'number') return;
    if ('field' in e) { if (!fieldKeys.has(e.field)) err(path, `unknown field ${e.field}`); return; }
    if ('cell' in e) { if (!rowCols || !rowCols.has(e.cell)) err(path, `unknown column ${e.cell} (a cell can be read only inside a computed column of the same table)`); return; }
    if ('agg' in e) { const cols = tableCols.get(e.table); if (!cols) err(path, `unknown table ${e.table}`); else if (e.col && !cols.has(e.col)) err(path, `unknown column ${e.col} in ${e.table}`); return; }
    const single = 'sqrt' in e ? e.sqrt : 'ln' in e ? e.ln : 'exp' in e ? e.exp : 'abs' in e ? e.abs : undefined;
    if (single !== undefined) { checkExpr(single, path, rowCols); return; }
    const list = 'add' in e ? e.add : 'mul' in e ? e.mul : 'sub' in e ? e.sub : 'div' in e ? e.div : 'pow' in e ? e.pow : 'min' in e ? e.min : 'max' in e ? e.max : null;
    if (!list || !Array.isArray(list)) { err(path, 'unknown expression'); return; }
    if (('sub' in e || 'div' in e || 'pow' in e) && list.length !== 2) err(path, 'this operation takes exactly two values');
    list.forEach((x, i) => checkExpr(x, `${path}[${i}]`, rowCols));
  };
  const checkRule = (r: Rule | undefined, path: string, rowCols?: Set<string>): void => {
    if (!r) { err(path, 'missing rule'); return; }
    switch (r.op) {
      case 'calc': checkExpr(r.expr, `${path}.expr`, rowCols); break;
      case 'quadrant': checkExpr(r.x, `${path}.x`, rowCols); checkExpr(r.y, `${path}.y`, rowCols); if (!Array.isArray(r.names) || r.names.length !== 4) err(`${path}.names`, 'quadrant names must be 4'); break;
      case 'when': checkExpr(r.expr, `${path}.expr`, rowCols); if (r.gt === undefined && r.lt === undefined) err(path, 'when needs gt or lt'); break;
      case 'weighted': case 'top': {
        const cols = tableCols.get(r.table);
        if (!cols) { err(path, `unknown table ${r.table}`); break; }
        const need = r.op === 'weighted' ? [r.value, r.weight] : [r.by, r.label];
        for (const c of need) if (!cols.has(c)) err(path, `unknown column ${c} in ${r.table}`);
        break;
      }
      case 'irr': case 'payback': {
        const cols = tableCols.get(r.table);
        if (!cols) err(path, `unknown table ${r.table}`); else if (!cols.has(r.col)) err(path, `unknown column ${r.col} in ${r.table}`);
        break;
      }
      case 'template': for (const m of r.text.matchAll(/\{([a-z0-9_]+)\}/g)) if (!fieldKeys.has(m[1])) err(path, `unknown field {${m[1]}}`); break;
      default: err(path, 'unknown rule');
    }
  };
  (t.sections ?? []).forEach((s, si) => (s.parts ?? []).forEach((p, pi) => {
    if (p.kind === 'table' && !p.board) (p.columns ?? []).forEach((c, ci) => { if (c.type === 'computed') checkRule(c.rule, `sections[${si}].parts[${pi}].columns[${ci}].rule`, tableCols.get(p.key)); });
  }));
  const dk = new Set<string>();
  (t.derived ?? []).forEach((d, i) => { if (dk.has(d.key)) err(`derived[${i}].key`, `duplicate key ${d.key}`); dk.add(d.key); checkRule(d.rule, `derived[${i}].rule`); });
  const ok = new Set<string>();
  if (!(t.outputs ?? []).length) err('outputs', 'at least one output is required, so a later tool can build on this one');
  (t.outputs ?? []).forEach((o, i) => { if (ok.has(o.key)) err(`outputs[${i}].key`, `duplicate key ${o.key}`); ok.add(o.key); checkRule(o.rule, `outputs[${i}].rule`); });

  if (t.sample) {
    for (const k of Object.keys(t.sample.values ?? {})) if (!fieldKeys.has(k)) err('sample.values', `unknown field ${k}`);
    for (const k of Object.keys(t.sample.tables ?? {})) if (!tableCols.has(k)) err('sample.tables', `unknown table ${k}`);
    if (!/TBD|TODO|lorem|N\/A/i.test(JSON.stringify(t.sample))) { /* fine */ } else err('sample', 'the sample contains a placeholder (TBD, TODO, lorem, N/A)');
  }
  return out;
}

export interface Gate { blockers: string[]; warnings: string[]; ok: boolean }
export function qualityGate(tool: unknown): Gate {
  const issues = validateDeclarative(tool);
  const blockers = issues.filter((i) => i.level === 'error').map((i) => `${i.path}: ${i.message}`);
  return { blockers, warnings: issues.filter((i) => i.level === 'warn').map((i) => `${i.path}: ${i.message}`), ok: blockers.length === 0 };
}

// ── Taking in what an AI wrote ───────────────────────────────────────────────────────────────────────────────────────

const str = (x: unknown): string => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : '');
const strs = (x: unknown): string[] => (Array.isArray(x) ? x.map(str).filter(Boolean) : []);
const snake = (s: string): string => { const k = keySlug(s); return /^[a-z]/.test(k) ? k : `k_${k}`; };
const uniqueKey = (base: string, used: Set<string>): string => { const b = base || 'item'; let k = b, n = 2; while (used.has(k)) k = `${b}_${n++}`; used.add(k); return k; };
const scaleOf = (x: unknown): Partial<RatingScale> | undefined => {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  const s: Partial<RatingScale> = {};
  if (typeof o.min === 'number') s.min = o.min;
  if (typeof o.max === 'number') s.max = o.max;
  if (str(o.low)) s.low = str(o.low);
  if (str(o.high)) s.high = str(o.high);
  return Object.keys(s).length ? s : undefined;
};

/**
 * Turns whatever an AI returned into a DeclarativeTool of the right shape (strings trimmed, keys made snake_case and unique, unknown
 * properties dropped, the category coerced) and reports every problem. It never invents content: a missing originator stays blank.
 */
export function normaliseDeclarative(raw: unknown, ctx: { existingSlugs?: string[] } = {}): { tool: DeclarativeTool | null; issues: Issue[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { tool: null, issues: [{ level: 'error', path: '', message: 'The reply was not a JSON object' }] };
  const o = raw as Record<string, unknown>;
  const used = new Set<string>();
  const parts = (arr: unknown): DeclPart[] => (Array.isArray(arr) ? arr : []).filter((p) => p && typeof p === 'object').map((p) => {
    const q = p as Record<string, unknown>;
    const label = str(q.label) || str(q.key);
    const key = uniqueKey(snake(str(q.key) || label), used);
    if (q.kind === 'table') {
      const cu = new Set<string>();
      const cols = (Array.isArray(q.columns) ? q.columns : []).filter((c) => c && typeof c === 'object').map((c) => {
        const r = c as Record<string, unknown>;
        const header = str(r.header) || str(r.key);
        const d: DeclColumn = { key: uniqueKey(snake(str(r.key) || header), cu), header, help: str(r.help), type: (['text', 'longtext', 'number', 'select', 'rating', 'computed'].includes(str(r.type)) ? str(r.type) : 'text') as ColumnType };
        if (strs(r.options).length) d.options = strs(r.options);
        if (scaleOf(r.scale)) d.scale = scaleOf(r.scale);
        if (str(r.unit)) d.unit = str(r.unit);
        if (r.half === true) d.half = true;
        if (r.rule && typeof r.rule === 'object') d.rule = r.rule as Rule;
        return d;
      });
      const t: DeclTable = { kind: 'table', key, label, help: str(q.help), rowLabel: str(q.rowLabel) || 'Row', columns: cols };
      if (strs(q.fixedRows).length) t.fixedRows = strs(q.fixedRows);
      if (q.rowHints && typeof q.rowHints === 'object') t.rowHints = Object.fromEntries(Object.entries(q.rowHints as Record<string, unknown>).map(([k, v]) => [k, str(v)]));
      if (typeof q.minRows === 'number') t.minRows = q.minRows;
      if (typeof q.maxRows === 'number') t.maxRows = q.maxRows;
      if (q.board && typeof q.board === 'object') t.board = q.board as DeclTable['board'];
      return t;
    }
    const type = (['text', 'longtext', 'select', 'rating', 'number'].includes(str(q.type)) ? str(q.type) : 'text') as FieldType;
    const f: DeclField = { kind: 'field', key, label, type, help: str(q.help) };
    if (str(q.example)) f.example = str(q.example);
    if (strs(q.options).length) f.options = strs(q.options);
    if (scaleOf(q.scale)) f.scale = scaleOf(q.scale);
    if (str(q.unit)) f.unit = str(q.unit);
    return f;
  });
  const sections: DeclSection[] = (Array.isArray(o.sections) ? o.sections : []).filter((s) => s && typeof s === 'object').map((s, i) => {
    const q = s as Record<string, unknown>;
    return { key: str(q.key) || `section_${i + 1}`, title: str(q.title), summary: str(q.summary), parts: parts(q.parts) };
  });
  const r = (o.reference && typeof o.reference === 'object' ? o.reference : {}) as Record<string, unknown>;
  const slug = (str(o.slug) || str(o.name)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const category = (TOOL_CATEGORIES as readonly string[]).includes(str(o.category)) ? (str(o.category) as ToolCategory) : 'other';
  const tool: DeclarativeTool = {
    schema: 1, slug, name: str(o.name), category,
    does: str(o.does), whenToUse: str(o.whenToUse), analysisGuide: str(o.analysisGuide),
    reference: { originator: str(r.originator), year: str(r.year), summary: str(r.summary), caption: str(r.caption), howToRead: strs(r.howToRead) },
    sections,
  };
  if (str(o.stage)) tool.stage = str(o.stage);
  if (str(o.whenNotToUse)) tool.whenNotToUse = str(o.whenNotToUse);
  if (str(o.next)) tool.next = str(o.next);
  if (o.diagram && typeof o.diagram === 'object') tool.diagram = o.diagram as DiagramSpec;
  if (Array.isArray(o.derived)) tool.derived = (o.derived as DeclDerived[]).filter((d) => d && typeof d === 'object').map((d) => ({ key: snake(str(d.key) || str(d.label)), label: str(d.label), help: str(d.help) || undefined, rule: d.rule }));
  if (Array.isArray(o.outputs)) tool.outputs = (o.outputs as DeclOutput[]).filter((d) => d && typeof d === 'object').map((d) => ({ key: snake(str(d.key) || str(d.label)), label: str(d.label), rule: d.rule, conditional: d.conditional === true ? true : undefined }));
  if (o.sample && typeof o.sample === 'object') {
    const s = o.sample as Record<string, unknown>;
    tool.sample = { scenario: str(s.scenario), values: Object.fromEntries(Object.entries((s.values ?? {}) as Record<string, unknown>).map(([k, v]) => [k, str(v)])), tables: (s.tables ?? {}) as Record<string, Row[]>, why: Object.fromEntries(Object.entries((s.why ?? {}) as Record<string, unknown>).map(([k, v]) => [k, str(v)])) };
  }
  const l = (o.links ?? {}) as Record<string, unknown>;
  if (strs(l.buildsOn).length || strs(l.feeds).length) tool.links = { buildsOn: strs(l.buildsOn), feeds: strs(l.feeds) };
  const issues = validateDeclarative(tool);
  if (ctx.existingSlugs?.includes(tool.slug)) issues.push({ level: 'error', path: 'slug', message: `A tool with the slug ${tool.slug} already exists` });
  if (!(o.category && (TOOL_CATEGORIES as readonly string[]).includes(str(o.category)))) issues.push({ level: 'warn', path: 'category', message: 'The category was not one of the known ones and was set to other' });
  return { tool, issues };
}
