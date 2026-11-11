/**
 * The online version of a Word document that LOOKS LIKE the document: the document itself is kept (see strategyModels/document.ts) and
 * only the places meant to be written in become part of the form. No AI, and nothing is guessed from the wording of the text.
 *
 * A place is a blank only when the document shows it as one:
 *   - a cell or line of underscores ("Founder name | ________") becomes a field named by the label beside it;
 *   - in a table with a heading row, a column whose cells are all empty is a column to fill in, one row for each printed row;
 *   - a cell printed "1  2  3  4  5" is a rating to choose; a cell holding only a tick box is a tick box.
 * And a toolkit is there to be worked through, so what it ASKS can be answered where it asks it:
 *   - a table whose heading row has a question column ("Diagnostic Question", "Questions to Resolve") gets a box under each row for the answer;
 *   - a worksheet table (a column of activities, actions, tasks, KPIs, targets or outcomes) gets a box under each row for the reader's notes;
 *   - a list of three or more bullets inside a table cell is a checklist: each bullet can be ticked.
 * These are decided by the table's own headings, never by the wording of a sentence, and each added box is drawn as a row of its own so
 * the printed table is left as it was. Everything else stays reading, exactly as printed.
 */
import type { ToolCategory } from '@/lib/strategyModels/declarative';
import { cellText, paraText, type DocBind, type DocBlock, type DocCell, type DocPara, type DocTable } from '@/lib/strategyModels/document';
import type { SourceReading } from './source';
import { finishForm, snake, unique, tidy, cut, type FaithfulResult, type Map1 } from './fromSheets';

type Part = Record<string, unknown>;
const UNDERSCORES = /^[_\s]*_{3,}[_\s]*$/;
const SCALE = /^(\d)(?:\s+\d){2,9}$/;
const TICK = /^(?:[☐□◻]|\[\s?\])$/;
const MODULE = /^(?:SECTION|MODULE|ANNEXURE|ANNEX|APPENDIX|PART|STEP|STAGE|CHAPTER)\b/i;
const ID_HEAD = /^(?:#|no\.?|id|ref\.?|sr\.?|s\.?\s?no\.?)$/i;
const Q_HEAD = /question|resolve|diagnostic|prompt|criteria|checklist|ask yourself|consider/i;
/** A column heading that says the table is a worksheet to act on (activities, tasks, deliverables, metrics), so each row is something to answer. */
const WORK_HEAD = /activit|action|task|deliverable|checklist|to do|exercise|worksheet|template|metric|kpi|target|outcome/i;
const BULLET = /^\s*[•●▪◦]\s*/;
const LONG_HEAD = /answer|note|evidence|comment|detail|describe|explain|observation|action|plan|finding|response|remark|status|your /i;
const RAG_HEAD = /^rag(?:\s+status)?$/i;
const YESNO_HEAD = /\byes\s*\/\s*no\b|\by\s*\/\s*n\b/i;
const PLACEHOLDER = /tbd|todo|lorem|n\/a/i;
const safeKey = (s: string) => snake(s).slice(0, 40).replace(/tbd|todo|lorem/gi, (m) => `${m[0]}_${m.slice(1)}`).replace(/_+$/g, '') || 'item';
const flat = (c: DocCell) => tidy(cellText(c));
const isEmpty = (c: DocCell) => flat(c) === '';

/** The run of consecutive whole numbers a cell prints as a scale ("1 2 3 4 5"), or null. */
function scaleOf(text: string): { min: number; max: number } | null {
  if (!SCALE.test(text)) return null;
  const ns = text.split(/\s+/).map(Number);
  return ns.every((n, i) => i === 0 || n === ns[i - 1] + 1) ? { min: ns[0], max: ns[ns.length - 1] } : null;
}

export function documentForm(readings: readonly SourceReading[], opts: { name?: string; category: ToolCategory }): FaithfulResult | null {
  const reading = readings.length === 1 ? readings[0] : null;
  if (!reading?.doc?.length) return null;
  // the stored document is changed below (blanks are bound to the form), so work on a copy
  const doc: DocBlock[] = JSON.parse(JSON.stringify(reading.doc));
  const name = tidy(opts.name ?? '') || tidy(reading.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) || 'New form';

  const used = new Set<string>(['summary']);
  const sectionKeys = new Set<string>();
  const labels = new Set<string>();
  const sampleValues: Record<string, string> = {};
  const sampleTables: Record<string, Record<string, string>[]> = {};
  const derived: Record<string, unknown>[] = [];
  const approximations: string[] = [];
  let firstField: { key: string; label: string } | null = null;

  interface Sec { key: string; title: string; parts: Part[] }
  const sections: Sec[] = [];
  let title = 'Details';
  let current: Sec | null = null;
  /** the section the parts found under the present heading belong to; it is made when its first blank is found */
  const section = (block: { ai?: string }): Sec => {
    if (!current) {
      current = { key: unique(safeKey(title), sectionKeys), title: cut(title, 80), parts: [] };
      sections.push(current);
    }
    if (!current.parts.length) block.ai = current.key;
    return current;
  };
  /** A label no other part has: answers are matched by label, so two parts must never share one. */
  const label = (raw: string, max = 300): string => {
    const base = cut(tidy(raw) || 'Answer', max);
    let l = base;
    for (let n = 2; labels.has(l.toLowerCase()); n++) l = `${cut(base, max - 6)} (${n})`;
    labels.add(l.toLowerCase());
    return l;
  };
  const field = (block: { ai?: string }, raw: string, long: boolean): DocBind => {
    const s = section(block);
    const l = label(raw.replace(/[:：]\s*$/, ''));
    const key = unique(safeKey(l), used);
    s.parts.push({ kind: 'field', key, label: l, type: long ? 'longtext' : 'text', help: `Fill in “${cut(l, 80)}” as it is asked in the document.` });
    sampleValues[key] = 'Sample answer';
    firstField ??= { key, label: l };
    return { f: key, kind: long ? 'long' : 'text' };
  };

  const heading = (text: string) => { title = text; current = null; };

  const table = (t: DocTable) => {
    const cols = Math.max(...t.rows.map((r) => r.c.reduce((n, c) => n + (c.s ?? 1), 0)));
    const full = (r: { c: DocCell[] }) => r.c.length === cols && r.c.every((c) => !c.s);

    // ── a banner: one cell across the table that names a part of the document ──
    if (cols === 1 || t.rows.every((r) => r.c.length === 1)) {
      const lines = t.rows.flatMap((r) => r.c[0].p.map(paraText).map(tidy).filter(Boolean));
      if (lines.length && lines.length <= 3 && MODULE.test(lines[0]) && lines.join(' ').length <= 200) heading(lines[lines.length - 1]);
      return;
    }
    // a title row merged across the table ("A.2 | The Paul Graham Hierarchy…") names what follows
    let own = '';
    for (const r of t.rows) if (!full(r) && r.c.length <= 2) { const text = tidy(r.c.map(flat).join(' ')); if (text && text.length <= 160) own = text.replace(/\s*\[[^\]]{3,60}\]\s*$/, '').replace(/\s*\|\s*/g, ' '); }
    // a table with no title of its own belongs to the heading it stands under
    const about = own || title;

    const rows = t.rows.filter(full);
    if (!rows.length) return;

    // ── a checklist inside a cell: three or more bullets, each of which can be ticked ──
    for (const r of rows) for (const c of r.c) {
      const items = c.p.filter((p) => (p.li === 1 || BULLET.test(paraText(p))) && tidy(paraText(p).replace(BULLET, '')).length >= 4);
      if (items.length < 3) continue;
      const s = section(t);
      for (const p of items) {
        const l = label(paraText(p).replace(BULLET, ''));
        const key = unique(safeKey(l), used);
        s.parts.push({ kind: 'field', key, label: l, type: 'select', options: ['Yes', 'No'], display: 'tick', help: 'Tick the box when this item is done or applies to you.' });
        sampleValues[key] = 'Yes';
        p.in = { f: key, kind: 'tick' };
      }
    }

    // ── labelled blanks: "Founder name | ________" ──
    let blanks = 0;
    for (const r of rows) {
      for (let j = 0; j + 1 < r.c.length; j++) {
        const lab = flat(r.c[j]);
        if (lab && !UNDERSCORES.test(lab) && UNDERSCORES.test(flat(r.c[j + 1]))) { r.c[j + 1].in = field(t, lab, false); blanks += 1; j += 1; }
      }
    }
    if (blanks) return;

    // ── a table with a heading row and columns left empty to fill in ──
    const head = rows[0];
    const body = rows.slice(1);
    if (body.length < 1 || head.c.some(isEmpty)) return;
    const heads = head.c.map(flat);
    type Kind = { kind: 'rating'; min: number; max: number } | { kind: 'tick' } | { kind: 'blank' } | null;
    const kinds: Kind[] = heads.map((_, j) => {
      const cells = body.map((r) => flat(r.c[j]));
      if (cells.every((c) => c === '')) return { kind: 'blank' };
      const scales = cells.map(scaleOf);
      if (scales.every((s) => s && s.min === scales[0]!.min && s.max === scales[0]!.max)) return { kind: 'rating', ...scales[0]! };
      if (cells.every((c) => TICK.test(c))) return { kind: 'tick' };
      return null;
    });
    if (kinds.every(Boolean)) return;
    // nothing left blank: is it a table of questions to answer, or a worksheet to act on? Then each row gets a box of its own.
    let added: string | null = null;
    if (!kinds.some(Boolean)) {
      if (heads.some((h) => Q_HEAD.test(h))) added = 'Your answer';
      else if (heads.slice(1).some((h) => WORK_HEAD.test(h))) added = 'Your notes';
      else return;
    }

    const idCol = heads.findIndex((h, j) => !kinds[j] && (ID_HEAD.test(h) || (j === 0 && body.every((r) => /^[#A-Za-z]{0,3}\d[\w.\-]{0,8}$/.test(flat(r.c[j]))))) && heads.some((_, k) => k !== j && !kinds[k]));
    const qCol = heads.findIndex((h, j) => !kinds[j] && j !== idCol && Q_HEAD.test(h));
    const firstText = heads.findIndex((_, j) => !kinds[j] && j !== idCol);
    const nameCol = qCol >= 0 ? qCol : firstText >= 0 ? firstText : idCol;
    const s = section(t);
    const colKeys = new Set<string>();
    const nameKey = unique(safeKey(heads[nameCol] || 'item'), colKeys);
    const seen = new Set<string>();
    const names = body.map((r, i) => {
      const id = idCol >= 0 && idCol !== nameCol ? flat(r.c[idCol]) : '';
      const base = cut(tidy(`${id} ${flat(r.c[nameCol])}`) || `Row ${i + 1}`, 300);
      let n = base;
      for (let k = 2; seen.has(n.toLowerCase()); k++) n = `${cut(base, 290)} (${k})`;
      seen.add(n.toLowerCase());
      return n;
    });
    const inputs = heads.map((h, j) => ({ h, j, k: kinds[j] })).filter((x) => x.k);
    const tLabel = label(`${about}: ${added ?? inputs.map((x) => x.h).join(', ')}`, 110);
    const tKey = unique(safeKey(tLabel), used);
    const columns: Part[] = [{ key: nameKey, header: cut(heads[nameCol] || 'Item', 60), help: 'The row as printed in the document.', type: 'text' }];
    for (const { h, j, k } of inputs) {
      const key = unique(safeKey(h || 'answer'), colKeys);
      const header = cut(h || 'Answer', 60);
      let bind: DocBind['kind'];
      if (k!.kind === 'rating') { columns.push({ key, header, help: `Rate this row from ${k!.min} to ${k!.max}.`, type: 'rating', scale: { min: k!.min, max: k!.max, low: 'Low', high: 'High' } }); bind = 'rating'; }
      else if (k!.kind === 'tick') { columns.push({ key, header, help: 'Tick when this row is done or applies.', type: 'select', options: ['Yes', 'No'], display: 'tick' }); bind = 'tick'; }
      else if (RAG_HEAD.test(h)) { columns.push({ key, header, help: 'Choose Red, Amber or Green for this row.', type: 'select', options: ['Red', 'Amber', 'Green'], display: 'radio' }); bind = 'choice'; }
      else if (YESNO_HEAD.test(h)) { columns.push({ key, header, help: 'Answer Yes or No for this row.', type: 'select', options: ['Yes', 'No'], display: 'radio' }); bind = 'choice'; }
      else { const long = LONG_HEAD.test(h); columns.push({ key, header, help: `Write your entry under “${cut(header, 40)}”.`, type: long ? 'longtext' : 'text' }); bind = long ? 'long' : 'text'; }
      body.forEach((r, i) => { r.c[j].in = { t: tKey, r: names[i], c: key, kind: bind }; });
    }
    if (added) {
      const key = unique(safeKey(added), colKeys);
      columns.push({ key, header: added, help: added === 'Your answer' ? 'Write your answer to the question in this row.' : 'Write what you will do, or what you have found, for this row.', type: 'longtext' });
      // the box is a row of its own under the printed row, across the whole table, so the printed cells are untouched
      body.forEach((r, i) => { t.rows.splice(t.rows.indexOf(r) + 1, 0, { c: [{ p: [], s: cols, in: { t: tKey, r: names[i], c: key, kind: 'long' } }] }); });
    }
    s.parts.push({ kind: 'table', key: tKey, label: tLabel, help: 'Fill in the blank columns for each row. The other columns are as printed in the document.', rowLabel: 'Row', fixedRows: names, grid: true, columns });
    const rated = columns.find((c) => c.type === 'rating');
    if (rated && derived.length < 12) derived.push({ key: unique(`avg_${tKey}`.slice(0, 40), used), label: cut(`Average ${String(rated.header).toLowerCase()}: ${about}`, 90), help: 'The average of the ratings entered in this table. Rows left blank are not counted.', rule: { op: 'calc', expr: { agg: 'avg', table: tKey, col: rated.key }, format: 'dp1' } });
    const sampleOf = (c: Part) => (c.type === 'rating' ? '3' : c.type === 'select' ? String((c.options as string[])[0]) : 'Sample entry');
    const ok = names.filter((n) => !PLACEHOLDER.test(n)).slice(0, 2);
    if (ok.length) sampleTables[tKey] = ok.map((n) => ({ [nameKey]: n, ...Object.fromEntries(columns.slice(1).map((c) => [String(c.key), sampleOf(c)])) }));
  };

  for (const b of doc) {
    if (b.k === 't') { table(b); continue; }
    const text = tidy(paraText(b));
    if (!text) continue;
    if (b.h === 1 || (b.h === 2 && !sections.length && title === 'Details')) { heading(text); continue; }
    if (b.h) continue;
    // "Name: ________" on a line of its own
    const m = /^(.{2,120}?)[:：]?\s*_{3,}\s*$/.exec(text);
    if (m && !UNDERSCORES.test(text)) (b as DocPara).in = field(b, m[1], false);
  }

  // A document with nothing to write in still needs one place for the reader's own notes, so the page can save, draft and analyse.
  if (!sections.length) {
    const key = 'your_notes';
    used.add(key);
    const l = label('Your notes and actions from this document');
    doc.push({ k: 'p', r: [{ t: l, b: 1 }], sb: 24, sa: 6, ai: 'your_notes_section', in: { f: key, kind: 'long' } });
    sections.push({ key: 'your_notes_section', title: 'Your notes', parts: [{ kind: 'field', key, label: l, type: 'longtext', help: 'Write what you take from this document and what you will do next.' }] });
    sampleValues[key] = 'Sample answer';
    firstField = { key, label: l };
    approximations.push('The document has no blanks to fill in, so one box for your own notes was added at the end.');
  }

  // Results worked out from the answers: counting and averaging only.
  const fields = sections.flatMap((s) => s.parts).filter((p) => p.kind === 'field');
  const extraOutputs: Record<string, unknown>[] = [];
  if (fields.length) extraOutputs.push({ key: 'answered', label: 'How much is filled in', rule: { op: 'answers', show: 'progress', fields: fields.map((f) => String(f.key)) } });
  const ticks = fields.filter((f) => f.display === 'tick');
  if (ticks.length >= 3) extraOutputs.push({ key: 'boxes_ticked', label: 'Checklist items ticked', rule: { op: 'answers', show: 'ticked', fields: ticks.map((f) => String(f.key)) } });
  for (const s of sections) for (const p of s.parts) {
    if (p.kind !== 'table' || extraOutputs.length >= 12) continue;
    const first = (p.columns as Part[])[1];
    extraOutputs.push({ key: unique(`rows_${String(p.key)}`.slice(0, 40), used), label: cut(`Rows filled in: ${String(p.label)}`, 90), rule: { op: 'calc', expr: { agg: 'count', table: p.key, col: first.key }, format: 'int' } });
  }

  // The whole document is shown, so every item read from it is in the form.
  const map: Map1[] = reading.elements.map((e) => ({ element: e.id, target: 'document' }));
  const out = finishForm({
    name, category: opts.category, readings, sections: sections.map((s) => ({ key: s.key, title: s.title, summary: '', parts: s.parts })),
    derived, sampleValues, sampleTables, map, approximations, firstField, extraOutputs, faithful: true,
  });
  out.form.document = doc;
  (out.form.assumptions as string[]).push('The page shows the Word document itself. Only its blanks, rating scales and tick boxes are inputs; nothing else was changed.');
  return out;
}
