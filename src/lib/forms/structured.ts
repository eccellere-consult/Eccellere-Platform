/**
 * Faithful conversion of a DOCUMENT (Word, PDF, text) into a step-by-step form, WITHOUT the AI.
 *
 * The aim is an online version that reads like the document it came from: the same steps in the same order, the same instructions in
 * the same places, tables that are still tables, tick boxes that are still tick boxes. So this reader:
 *   - starts a new STEP at the document's main headings, at "SECTION/MODULE/ANNEXURE ..." lines and at "A.1 | Title" lines; deeper
 *     headings stay inside the step as sub-headings;
 *   - keeps every paragraph, list and reference table as READING, shown where it stood (it is never turned into a question);
 *   - keeps a table that has blank columns as ONE table: the printed columns stay as printed text, the blank columns become inputs
 *     (a 1 to 5 scale for a rating column, Yes/No, a tick box, or a box to write in), and blank rows stay rows to fill in;
 *   - turns "Label: ______" and "Label | (blank)" into a field with that label;
 *   - turns a question that ends with "?" into a field, and the options under it into visible choices (round buttons for one answer,
 *     tick boxes for "all that apply"); a tick-box line on its own becomes a tick box.
 * It invents no wording, no figures and no method names, and adds no steps of its own. It returns null when too little of the document
 * is there to fill in, so the caller can fall back to the sheet reader.
 */
import type { ToolCategory } from '@/lib/strategyModels/declarative';
import type { ReadingBlock } from '@/lib/strategyModels/types';
import { sourcePages, type SourceElement, type SourceReading } from './source';
import { finishForm, snake, unique, tidy, cut, pad, stripLead, type FaithfulResult, type Map1 } from './fromSheets';

type Part = Record<string, unknown>;
const MIN_QUESTIONS = 5;
const BLANK = /^[_\s.…\-–—]*$/;
const TICK = /^(?:[☐☑☒□■◻]|\[\s?[xX ]?\s?\])$/;
const BOXES = /[☐☑☒□◻]/g;
const CHOICE_SPLIT = /[☐☑☒□◻○◯]/;
const MARKER = /^(?:SECTION|MODULE|ANNEXURE|ANNEX|PART|STEP|STAGE)\s+[A-Z0-9]+\b/i;
const SUBSTEP = /^(?:[A-Z]\.\d{1,2}|\d{1,2}[A-Z])$/;
const Q_HEAD = /question|resolve|diagnostic|prompt|criteria|checklist|ask yourself|consider/i;
const ID_HEAD = /^(?:#|no\.?|id|ref\.?|sr\.?|s\.?\s?no\.?)$/i;
/** A column heading that says the table is a worksheet to act on (activities, tasks, deliverables, metrics), so each row is something to answer. */
const INPUT_HEAD = /activit|action|task|deliverable|checklist|to do|exercise|worksheet|template|metric|kpi|target|outcome/i;
const RATING_HEAD = /rating|score|\(\s*\d\s*[–-]\s*\d\s*\)/i;
const YESNO_HEAD = /\byes\s*\/\s*no\b|\by\s*\/\s*n\b/i;
const TICK_HEAD = /^(?:done|tick|check(?:ed)?|complete[d]?|✓|✔)\b/i;
const LONG_HEAD = /note|evidence|comment|detail|describe|explain|observation|action|plan|finding|answer|response|remark|why|how/i;
const IMPACT = /\s*\[([^\]]{3,60})\]\s*$/;
const ONE_HINT = /\b(?:tick|select|choose|pick|circle)\s+(?:only\s+)?one\b|\bonly one\b/i;
const ALL_HINT = /all that apply|tick all|select all|choose all|as many as/i;
const GENERIC_TITLE = /^(?:steps?|notes?|overview|summary|introduction|examples?|template|checklist)$/i;
/** A sample answer for a choice: the first option that is not a placeholder word (the quality check rejects N/A, TBD and the like in a sample). */
const PLACEHOLDER = /tbd|todo|lorem|n\/a/i;
const sampleOption = (opts: string[]): string => opts.find((o) => !/^(?:n\/?a|tbd|todo|none|-)$/i.test(o.trim()) && !PLACEHOLDER.test(o)) ?? '';
/** The quality check scans a sample (keys included) for placeholder words; a key that merely contains one, such as "autodoc" or "mastodon", must not trip it. */
const safeKey = (s: string) => snake(s).slice(0, 40).replace(/tbd|todo|lorem/gi, (m) => `${m[0]}_${m.slice(1)}`).replace(/_+$/g, '') || 'item';

/** The cells of a table row. Empty cells are kept, so every row of a table has the same number of cells as it had in the document. */
export const cellsOf = (text: string): string[] => text.split(/\s*\|\s*/).map(tidy);
const isBlank = (c: string) => BLANK.test(c);
const shortCells = (c: string[]) => c.length >= 2 && c.every((x) => x.length > 0 && x.length <= 70 && !/[.!?]$/.test(x) && !isBlank(x) && !TICK.test(x));
/** "☐ Yes ☐ No" in one cell: the options it offers, or null when the cell is not a set of choices. */
function choiceCell(c: string): string[] | null {
  if (!CHOICE_SPLIT.test(c.slice(0, 2))) return null;
  const opts = c.split(CHOICE_SPLIT).map(tidy).filter(Boolean);
  return opts.length >= 2 && opts.every((o) => o.length <= 40) ? opts : null;
}
const TICK_HELP = 'Tick the box when this item is done or applies to you.';
const fillHelp = (label: string) => `Fill in “${cut(label, 80)}” as it is asked in the document.`;
const tableNo = (e: SourceElement): string | null => /^Table (\d+), row/.exec(e.where)?.[1] ?? null;

type Item = { part: Part } | { block: ReadingBlock; id?: string };
interface Step { key: string; title: string; items: Item[]; hasTitle: boolean }

type Block =
  | { t: 'heading'; e: SourceElement; level: number }
  | { t: 'para'; e: SourceElement }
  | { t: 'table'; els: SourceElement[]; rows: string[][] };

/** The document as headings, paragraphs and whole tables, in order. */
function blocksOf(all: readonly SourceElement[]): Block[] {
  const out: Block[] = [];
  let open: { els: SourceElement[]; rows: string[][]; no: string | null } | null = null;
  for (const e of all) {
    if (!tidy(e.text)) continue;
    if (e.kind === 'tablehead' || e.kind === 'row') {
      const no = tableNo(e);
      const same = open && (no !== null ? open.no === no : open.no === null && e.kind === 'row');
      if (!same) { open = { els: [], rows: [], no }; out.push({ t: 'table', els: open.els, rows: open.rows }); }
      open!.els.push(e); open!.rows.push(cellsOf(e.text));
      continue;
    }
    open = null;
    if (e.kind === 'heading') out.push({ t: 'heading', e, level: e.level ?? 1 });
    else out.push({ t: 'para', e });
  }
  for (const b of out) if (b.t === 'table') { const w = Math.max(...b.rows.map((r) => r.length)); b.rows.forEach((r) => { while (r.length < w) r.push(''); }); }
  return out;
}

export function structuredForm(readings: readonly SourceReading[], opts: { name?: string; category: ToolCategory }): FaithfulResult | null {
  const pages = sourcePages(readings);
  const all = readings.flatMap((r) => r.elements);
  if (!pages.length || !all.length) return null;
  if (readings.some((r) => r.kind === 'excel')) return null; // sheets keep the sheet reader: each sheet is already a page
  const name = tidy(opts.name ?? '') || tidy((readings[0]?.fileName ?? 'New form').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) || 'New form';

  const used = new Set<string>(['summary']);
  const stepKeys = new Set<string>();
  const map: Map1[] = [];
  const approximations: string[] = [];
  const note = (s: string) => { if (!approximations.includes(s)) approximations.push(s); };
  const sampleValues: Record<string, string> = {};
  const sampleTables: Record<string, Record<string, string>[]> = {};
  const derived: Record<string, unknown>[] = [];
  let firstField: { key: string; label: string } | null = null;
  let questions = 0;
  let firstInputTable: { key: string; col: string; label: string } | null = null;

  const steps: Step[] = [];
  let labelsInStep = new Set<string>();
  /** the question whose options are still being read */
  let asking: { part: Part; key: string; marks: (string | undefined)[]; hint: string } | null = null;

  const closeQuestion = () => {
    if (!asking) return;
    const { part, key, marks, hint } = asking;
    asking = null;
    const options = (part.options as string[] | undefined) ?? [];
    if (options.length < 2) { delete part.options; return; }
    const yesNo = options.length === 2;
    const multi = ALL_HINT.test(hint) || (!ONE_HINT.test(hint) && !yesNo && marks.length > 0 && marks.every((m) => m === 'box'));
    if (multi) { part.type = 'text'; part.display = 'multi'; part.help = 'Tick every option that applies to your situation.'; }
    else { part.type = 'select'; if (options.length <= 8) part.display = 'radio'; part.help = 'Choose the one option that fits your situation best.'; }
    const sample = sampleOption(options);
    if (sample) sampleValues[key] = sample; else delete sampleValues[key];
  };
  const open = (title: string, hasTitle = true): Step => {
    closeQuestion();
    const t = cut(tidy(title) || 'Details', 80);
    const step: Step = { key: unique(safeKey(t), stepKeys), title: t, items: [], hasTitle };
    steps.push(step); labelsInStep = new Set();
    return step;
  };
  const current = (): Step => steps[steps.length - 1] ?? open('Details', false);
  const read = (block: ReadingBlock, e?: SourceElement) => {
    const s = current();
    s.items.push({ block, id: e?.id });
    if (e) map.push({ element: e.id, target: `reading:${s.key}` });
  };
  const uniqueLabel = (raw: string, max = 300): string => {
    const base = cut(tidy(raw), max);
    let label = base;
    for (let n = 2; labelsInStep.has(label.toLowerCase()); n++) label = `${cut(tidy(raw), max - 10)} (${n})`;
    labelsInStep.add(label.toLowerCase());
    return label;
  };
  const addField = (e: SourceElement, rawLabel: string, type: string, help: string, extra: Part = {}): { part: Part; key: string } => {
    closeQuestion();
    const s = current();
    const label = uniqueLabel(rawLabel);
    const key = unique(safeKey(label), used);
    const part: Part = { kind: 'field', key, label, type, help: pad(help), ...extra };
    s.items.push({ part });
    const sample = extra.display === 'tick' ? 'Yes' : type === 'select' && Array.isArray(extra.options) ? sampleOption(extra.options as string[]) : type === 'rating' ? '3' : 'Sample answer';
    if (sample) sampleValues[key] = sample;
    firstField ??= { key, label };
    questions += 1;
    map.push({ element: e.id, target: `field:${key}` });
    return { part, key };
  };
  /** A short line or sub-heading standing just above a table is the table's own caption: use it as the label and do not show it twice. */
  const captionFor = (): { text: string; item: Item } | null => {
    const s = current();
    const last = s.items[s.items.length - 1];
    if (!last || !('block' in last)) return null;
    const b = last.block;
    const titleLike = b.kind === 'heading' || (b.kind === 'text' && !/[.!?]$/.test(b.text));
    if (titleLike && b.text.length <= 100 && !labelsInStep.has(b.text.toLowerCase())) { s.items.pop(); return { text: b.text, item: last }; }
    return null;
  };

  /** One column of an input table: what kind of answer its heading and its cells ask for. */
  const inputColumn = (header: string, cells: string[], keys: Set<string>): Part => {
    const key = unique(safeKey(header || 'answer'), keys);
    const head = cut(header || 'Answer', 60);
    const filled = cells.filter((c) => !isBlank(c));
    const choices = filled.length ? filled.map(choiceCell) : [];
    const sameChoices = choices.length > 0 && choices.every((c) => c && c.join('|') === choices[0]!.join('|')) ? choices[0]! : null;
    if (filled.length && filled.every((c) => TICK.test(c))) return { key, header: head, help: 'Tick when this row is done or applies.', type: 'select', options: ['Yes', 'No'], display: 'tick' };
    if (sameChoices) return { key, header: head, help: 'Choose one option for this row.', type: 'select', options: sameChoices.slice(0, 20), display: 'radio' };
    if (RATING_HEAD.test(header)) {
      const range = /(\d)\s*[–-]\s*(\d)/.exec(header);
      const scale = range ? { min: Math.min(+range[1], +range[2]), max: Math.max(+range[1], +range[2]) } : { min: 1, max: 5 };
      return { key, header: head, help: `Rate this row from ${scale.min} to ${scale.max}.`, type: 'rating', scale: { ...scale, low: 'Low', high: 'High' } };
    }
    if (YESNO_HEAD.test(header)) return { key, header: head, help: 'Answer Yes or No for this row.', type: 'select', options: ['Yes', 'No'], display: 'radio' };
    if (TICK_HEAD.test(header)) return { key, header: head, help: 'Tick when this row is done or applies.', type: 'select', options: ['Yes', 'No'], display: 'tick' };
    return { key, header: head, help: `Write your entry under “${cut(head, 40)}”.`, type: LONG_HEAD.test(header) ? 'longtext' : 'text' };
  };
  const sampleCell = (c: Part): string => (c.type === 'rating' ? '3' : c.type === 'select' ? sampleOption((c.options as string[]) ?? []) : 'Sample entry');
  const pushTable = (els: SourceElement[], part: Part, rowCount: number) => {
    closeQuestion();
    const s = current();
    s.items.push({ part });
    questions += rowCount;
    for (const e of els) map.push({ element: e.id, target: `table:${String(part.key)}` });
    const cols = part.columns as Part[];
    const firstInput = cols.find((c, i) => c.type !== 'computed' && !(part.fixedRows && i === 0));
    if (firstInput) firstInputTable ??= { key: String(part.key), col: String(firstInput.key), label: String(part.label) };
    const rated = cols.find((c) => c.type === 'rating');
    if (rated && derived.length < 8) derived.push({ key: unique(`avg_${String(part.key)}`.slice(0, 40), used), label: cut(`Average ${String(rated.header).toLowerCase()}: ${String(part.label)}`, 90), help: 'The average of the ratings entered in this table. Rows left blank are not counted.', rule: { op: 'calc', expr: { agg: 'avg', table: part.key, col: rated.key }, format: 'dp1' } });
  };

  /** A whole table from the document: a banner, a set of labelled blanks, a table to fill in, a checklist, or reading. */
  const table = (els: SourceElement[], rows: string[][]) => {
    const width = rows[0].length;
    const joined = (r: string[]) => r.filter(Boolean).join(' | ');
    const blankRow = (r: string[]) => r.every((c) => isBlank(c) || TICK.test(c) || !!choiceCell(c));

    // ── A banner: one line that names a part of the document ──
    if (rows.length === 1 || width === 1) {
      const first = rows[0];
      const text = joined(first);
      if (MARKER.test(text) && text.length <= 140) { const s = open(text); map.push({ element: els[0].id, target: `section:${s.key}` }); rows = rows.slice(1); els = els.slice(1); }
      else if (rows.length === 1 && width >= 2 && SUBSTEP.test(first[0])) {
        const raw = first.slice(1).filter(Boolean).join(' — ');
        const impact = IMPACT.exec(raw);
        const s = open(`${first[0]} ${impact ? raw.replace(IMPACT, '') : raw}`);
        if (impact) s.items.push({ block: { kind: 'text', text: impact[1] } });
        map.push({ element: els[0].id, target: `section:${s.key}` });
        return;
      }
      if (!rows.length) return;
    }

    // ── One column: a boxed note, or a heading with space to write under it ──
    if (width === 1) {
      rows.forEach((r, i) => {
        if (blankRow(r)) { map.push({ element: els[i].id, target: `reading:${current().key}` }); return; }
        if (rows[i + 1] && blankRow(rows[i + 1]) && r[0].length <= 200) addField(els[i], stripLead(r[0].replace(/[:：]\s*$/, '')), 'longtext', 'Write your answer in the space the document leaves for it.');
        else read({ kind: 'text', text: r[0] }, els[i]);
      });
      return;
    }

    const hasHeader = rows.length >= 2 && shortCells(rows[0]);

    // ── Labelled blanks: "Company name | ______" (no column headings) ──
    if (!hasHeader) {
      const loose: string[][] = [];
      const flush = () => { if (loose.length) { read({ kind: 'table', head: [], rows: loose.splice(0) }); } };
      rows.forEach((r, i) => {
        let made = 0;
        for (let j = 0; j + 1 < r.length; j++) {
          if (r[j] && !isBlank(r[j]) && !TICK.test(r[j]) && isBlank(r[j + 1])) {
            const label = stripLead(r[j].replace(/[:：]\s*$/, ''));
            if (!made) flush();
            addField(els[i], label, label.length > 90 ? 'longtext' : 'text', fillHelp(label));
            made += 1; j += 1;
          }
        }
        if (made) return;
        if (r.length >= 2 && TICK.test(r[0]) && r.slice(1).some((c) => c && !isBlank(c))) { flush(); addField(els[i], r.slice(1).filter(Boolean).join(' — '), 'select', TICK_HELP, { options: ['Yes', 'No'], display: 'tick' }); return; }
        if (!blankRow(r)) loose.push(r);
        map.push({ element: els[i].id, target: `reading:${current().key}` });
      });
      flush();
      return;
    }

    const head = rows[0];
    const body = rows.slice(1);
    const bodyEls = els.slice(1);
    const content = body.map((r, i) => ({ r, e: bodyEls[i] })).filter((x) => !blankRow(x.r));
    const blanks = body.length - content.length;
    const colKeys = new Set<string>();

    // Boxes in a cell are CHOICES when every row offers the same ones, or when they are one or two words each ("Low / Medium / High");
    // otherwise they are a CHECKLIST of things to do, each its own tick box.
    const choiceColumn = head.map((_, j) => {
      const sets = content.map((x) => choiceCell(x.r[j])).filter((o): o is string[] => !!o);
      if (!sets.length) return false;
      return (sets.length >= 2 && sets.every((o) => o.join('|') === sets[0].join('|'))) || sets.every((o) => o.every((x) => x.split(' ').length <= 2));
    });

    // ── A checklist inside a cell (several tick boxes in one cell): each box becomes a tick box under its row's name ──
    if (content.some((x) => x.r.some((c, j) => (c.match(BOXES)?.length ?? 0) >= 2 && !choiceColumn[j]))) {
      map.push({ element: els[0].id, target: `reading:${current().key}` });
      for (const { r, e } of content) {
        const nameAt = r.findIndex((c) => c && !isBlank(c) && !(c.match(BOXES)?.length));
        if (nameAt >= 0) read({ kind: 'heading', text: cut(r[nameAt], 200) });
        r.forEach((c, j) => {
          if (j === nameAt || isBlank(c)) return;
          const items = (c.match(BOXES)?.length ?? 0) >= 1 ? c.split(CHOICE_SPLIT).map(tidy).filter((x) => x.length >= 2) : [];
          if (items.length) for (const it of items) addField(e, it, 'select', TICK_HELP, { options: ['Yes', 'No'], display: 'tick' });
          else read({ kind: 'text', text: `${head[j]}: ${c}` });
        });
        if (!map.some((m) => m.element === e.id)) map.push({ element: e.id, target: `reading:${current().key}` });
      }
      note('A table with several tick boxes in one cell is shown as a list of tick boxes under each row’s name.');
      return;
    }

    // which columns are there to be filled in: blank (or only tick boxes or choices) in most of the rows that have anything in them
    // mostly blank rows under a few filled ones: the filled rows are examples and the table is for the reader's own rows
    const examples = blanks > 0 && blanks >= content.length && !content.some((x) => x.r.some((c) => TICK.test(c)));
    const isInput = head.map((_, j) => {
      if (!content.length || examples) return true;
      const cells = content.map((x) => x.r[j]);
      const open = cells.filter((c) => isBlank(c) || TICK.test(c) || !!choiceCell(c)).length;
      return open / cells.length >= 0.6;
    });
    const caption = captionFor();
    const label = uniqueLabel(caption?.text ?? `Table: ${head.join(', ')}`, 80);
    const tKey = unique(safeKey(label), used);

    // ── Nothing printed in the rows (or only examples): a table of blank rows to fill in ──
    if (isInput.every(Boolean)) {
      if (content.length) {
        read({ kind: 'text', text: 'Example from the document:' });
        read({ kind: 'table', head, rows: content.map((x) => x.r) });
        note('Rows already filled in as examples in a table are shown above the table as an example, and the table itself starts blank.');
      }
      const columns = head.map((h, j) => inputColumn(h, body.map((r) => r[j]).filter((c) => TICK.test(c) || !!choiceCell(c)), colKeys));
      const minRows = Math.min(30, Math.max(1, blanks || 3));
      const part: Part = { kind: 'table', key: tKey, label, help: pad('Fill in one row for each entry, under the same headings as the document.'), rowLabel: 'Row', minRows, maxRows: Math.max(12, minRows), grid: true, columns };
      pushTable(els, part, 1);
      const sample = Object.fromEntries(columns.map((c) => [String(c.key), sampleCell(c)]).filter(([, v]) => v));
      if (Object.keys(sample).length) sampleTables[tKey] = [sample];
      return;
    }

    // ── Nothing to fill in: is it a worksheet (questions, activities) or plain reference? ──
    const qCol = head.findIndex((c) => Q_HEAD.test(c));
    let added: Part | null = null;
    if (!isInput.some(Boolean)) {
      if (qCol >= 0) added = { key: 'your_answer', header: 'Your answer', help: 'Write your answer to this row.', type: 'longtext' };
      else if (head.slice(1).some((c) => INPUT_HEAD.test(c))) added = { key: 'your_notes', header: 'Your notes', help: 'Write what you will do or have found for this row.', type: 'longtext' };
      else {
        if (caption) current().items.push(caption.item);
        labelsInStep.delete(label.toLowerCase()); used.delete(tKey);
        read({ kind: 'table', head, rows: content.map((x) => x.r) });
        for (const e of els) map.push({ element: e.id, target: `reading:${current().key}` });
        return;
      }
      note(`The table “${cut(label, 60)}” has no blank column in the document, so a “${String(added.header)}” column was added for the answers.`);
    }

    // ── A table to fill in: the printed columns stay as text, the blank columns become inputs, one row per printed row ──
    const codes = (j: number) => content.every((x) => /^[#A-Za-z]{0,3}\d[\w.\-]{0,8}$/.test(x.r[j]));
    const idCol = head.findIndex((c, j) => !isInput[j] && (ID_HEAD.test(c) || (j === 0 && codes(j))) && head.some((_, k) => k !== j && !isInput[k]));
    const firstText = head.findIndex((_, j) => !isInput[j] && j !== idCol);
    const nameCol = qCol >= 0 && !isInput[qCol] ? qCol : firstText >= 0 ? firstText : idCol;
    const nameKey = unique(safeKey(head[nameCol] || 'item'), colKeys);
    const names: string[] = [];
    const seen = new Set<string>();
    content.forEach(({ r }, i) => {
      const id = idCol >= 0 && idCol !== nameCol ? r[idCol] : '';
      const base = cut(tidy(`${id} ${r[nameCol]}`) || `Row ${i + 1}`, 300);
      let n = base;
      for (let k = 2; seen.has(n.toLowerCase()); k++) n = `${cut(base, 290)} (${k})`;
      seen.add(n.toLowerCase()); names.push(n);
    });
    const columns: Part[] = [{ key: nameKey, header: cut(head[nameCol] || 'Item', 60), help: 'The row as printed in the document.', type: 'text' }];
    head.forEach((h, j) => {
      if (j === nameCol || j === idCol) return;
      const cells = content.map((x) => x.r[j]);
      if (isInput[j]) { columns.push(inputColumn(h, cells, colKeys)); return; }
      if (!cells.some(Boolean)) return;
      const lookup = Object.fromEntries(names.map((n, i) => [n, cells[i]]).filter(([, v]) => v));
      columns.push({ key: unique(safeKey(h || 'info'), colKeys), header: cut(h || 'Details', 60), help: 'Printed in the document for this row; nothing to fill in.', type: 'computed', rule: { op: 'lookup', by: nameKey, map: lookup } });
    });
    if (added) columns.push({ ...added, key: unique(String(added.key), colKeys) });
    if (nameCol !== 0 && !(idCol === 0 && nameCol === 1)) note(`In the table “${cut(label, 60)}” the column “${cut(head[nameCol], 40)}” is shown first, because it names each row.`);
    const lost = content.reduce((n, x) => n + x.r.filter((c, j) => isInput[j] && !isBlank(c) && !TICK.test(c) && !choiceCell(c)).length, 0);
    if (lost) note(`${lost} cell${lost === 1 ? '' : 's'} already filled in inside the fill-in columns of “${cut(label, 60)}” ${lost === 1 ? 'was' : 'were'} left blank in the form.`);
    if (blanks) note(`${blanks} blank row${blanks === 1 ? '' : 's'} at the end of “${cut(label, 60)}” ${blanks === 1 ? 'was' : 'were'} not kept, because its rows are the printed ones.`);
    const part: Part = { kind: 'table', key: tKey, label, help: pad('Fill in the blank columns for each row. The other columns are as printed in the document.'), rowLabel: 'Row', fixedRows: names, grid: true, columns };
    pushTable(els, part, names.length);
    const ok = names.filter((n) => !PLACEHOLDER.test(n)).slice(0, 2);
    const inputs = columns.filter((c, i) => i > 0 && c.type !== 'computed');
    if (ok.length && inputs.every((c) => sampleCell(c))) sampleTables[tKey] = ok.map((n) => ({ [nameKey]: n, ...Object.fromEntries(inputs.map((c) => [String(c.key), sampleCell(c)])) }));
  };

  // The document's two highest heading depths open steps; anything deeper is a sub-heading inside the step.
  const blocks = blocksOf(all);
  const levels = [...new Set(blocks.filter((b): b is Extract<Block, { t: 'heading' }> => b.t === 'heading').map((b) => b.level))].sort((a, b) => a - b);
  const stepLevels = new Set(levels.slice(0, 2));
  let lastWasHeading = false;

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    if (b.t === 'heading') {
      const t = tidy(b.e.text);
      if (!stepLevels.has(b.level)) { closeQuestion(); read({ kind: 'heading', text: t }, b.e); lastWasHeading = false; continue; }
      const prev: Step | undefined = steps[steps.length - 1];
      if (lastWasHeading && prev && prev.items.length === 0) {
        // consecutive headings with nothing between them are one title
        prev.title = cut(`${prev.title} ${t}`, 80);
        map.push({ element: b.e.id, target: `section:${prev.key}` });
        continue;
      }
      const s = open(GENERIC_TITLE.test(t) && prev ? `${prev.title} — ${t}` : t);
      map.push({ element: b.e.id, target: `section:${s.key}` });
      lastWasHeading = true;
      continue;
    }
    lastWasHeading = false;
    if (b.t === 'table') { table(b.els, b.rows); continue; }

    const e = b.e;
    const t = tidy(e.text);
    const nextBlock = blocks[bi + 1];
    const nextMarked = nextBlock?.t === 'para' && nextBlock.e.kind === 'option' && !!nextBlock.e.mark;
    // "Name: ______   Date: ______": one field for each label that has a blank after it
    if (/_{3,}/.test(t)) {
      const labels = t.split(/_{3,}/).map((x) => stripLead(x.replace(/[:：]\s*$/, '').trim()).replace(/[:：]\s*$/, '')).filter(Boolean);
      if (labels.length && labels.every((l) => l.length <= 160)) { for (const l of labels) addField(e, l, 'text', fillHelp(l)); continue; }
    }
    // a line just above a run of tick boxes or round buttons that asks something is the question they belong to
    const asksNow = !e.mark && nextMarked && t.length <= 300 && (/\?/.test(t) || ONE_HINT.test(t) || ALL_HINT.test(t) || e.kind === 'question');
    if (asksNow) {
      const label = stripLead(t);
      const made = addField(e, label, 'text', 'Write your answer to this question in your own words.');
      asking = { ...made, marks: [], hint: t };
      continue;
    }
    if (e.kind === 'option') {
      // under a question whose options carry a tick box or a round button, a line without one is not another option
      if (asking && !e.mark && asking.marks.some(Boolean)) closeQuestion();
      if (asking) {
        const opts = ((asking.part.options as string[] | undefined) ?? []).concat(stripLead(t));
        asking.part.options = opts.slice(0, 20);
        asking.marks.push(e.mark);
        map.push({ element: e.id, target: `option:${asking.key}` });
        continue;
      }
      if (e.mark) { addField(e, stripLead(t), 'select', TICK_HELP, { options: ['Yes', 'No'], display: 'tick' }); continue; }
    }
    if (e.kind === 'question' && /\?\s*$/.test(t)) {
      const label = stripLead(t);
      const made = addField(e, label, label.length > 90 ? 'longtext' : 'text', 'Write your answer to this question in your own words.');
      asking = { ...made, marks: [], hint: t };
      continue;
    }
    if (e.kind === 'instruction' && asking && (ONE_HINT.test(t) || ALL_HINT.test(t))) { asking.hint += ` ${t}`; }
    else closeQuestion();
    // a list item joins the list above it
    const s = current();
    const last = s.items[s.items.length - 1];
    if (e.list && last && 'block' in last && last.block.kind === 'list') { last.block.items.push(t); map.push({ element: e.id, target: `reading:${s.key}` }); continue; }
    read(e.list ? { kind: 'list', items: [t] } : { kind: 'text', text: t }, e);
  }
  closeQuestion();

  if (questions < MIN_QUESTIONS) return null;

  // A part of the document with nothing to fill in is shown as its own panel before the next step (after the last one, at the end).
  const isReal = (x: Step) => x.items.some((i) => 'part' in i);
  const real = steps.filter(isReal);
  const sections: Record<string, unknown>[] = [];
  const moved = new Map<string, string>();
  let carry: ReadingBlock[] = [];
  let lastSection: Record<string, unknown> | null = null;
  const panel = (x: Step, place: 'above' | 'below'): ReadingBlock[] => [
    ...(x.hasTitle ? [{ kind: 'heading' as const, text: x.title, place }] : []),
    ...x.items.map((i) => ({ ...(i as { block: ReadingBlock }).block, place })),
  ];
  for (const x of steps) {
    if (!isReal(x)) {
      if (!x.items.length && !x.hasTitle) continue;
      const host = real[real.indexOf(steps.slice(steps.indexOf(x)).find(isReal) as Step)] ?? real[real.length - 1];
      moved.set(x.key, host.key);
      if (lastSection && host.key === lastSection.key) (lastSection.reading as ReadingBlock[]).push(...panel(x, 'below'));
      else carry.push(...panel(x, 'above'));
      continue;
    }
    const reading: ReadingBlock[] = [...carry];
    carry = [];
    const parts: Part[] = [];
    x.items.forEach((it, i) => {
      if ('part' in it) { parts.push(it.part); return; }
      const next = x.items.slice(i + 1).find((n): n is { part: Part } => 'part' in n);
      reading.push(next ? { ...it.block, before: String(next.part.key) } : it.block);
    });
    lastSection = { key: x.key, title: x.title, summary: '', parts, reading };
    sections.push(lastSection);
  }
  for (const sec of sections) if (!(sec.reading as ReadingBlock[]).length) delete sec.reading;
  for (const m of map) {
    const hit = /^(section|reading):(.+)$/.exec(m.target);
    if (hit && moved.has(hit[2])) m.target = `reading:${moved.get(hit[2])}`;
  }

  // Results worked out from the answers: counting and averaging only, nothing invented.
  const fields = sections.flatMap((s) => s.parts as Part[]).filter((p) => p.kind === 'field');
  const extraOutputs = resultsFor(fields);
  if (!fields.length && firstInputTable) {
    const t = firstInputTable as { key: string; col: string; label: string };
    extraOutputs.push({ key: 'rows_filled', label: cut(`Rows filled in: ${t.label}`, 90), rule: { op: 'calc', expr: { agg: 'count', table: t.key, col: t.col }, format: 'int' } });
  }
  return finishForm({ name, category: opts.category, readings, sections, derived, sampleValues, sampleTables, map, approximations, firstField, extraOutputs, faithful: true });
}

/** Answer sets that have a plain, agreed order. Anything else is not scored: a score would be a guess. */
const ORDINAL: { options: string[]; points: Record<string, number>; exclude: string[] }[] = [
  { options: ['not at all', 'somewhat', 'to a large extent'], points: { 'Not at all': 0, Somewhat: 1, 'To a large Extent': 2 }, exclude: ['N/A'] },
];
/** Band edges on a 0 to 100 scale, approved by the owner on 2026-11-09: Low under 34, Developing 34 to 66, Strong 67 and over. */
const BANDS = [{ min: 0, label: 'Low' }, { min: 34, label: 'Developing' }, { min: 67, label: 'Strong' }];

/** The results a converted form gets: how much is answered, how many boxes are ticked, how many checklist items are Yes, and a maturity percentage where the answers have an agreed order. */
function resultsFor(fields: Part[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const keys = (fs: Part[]) => fs.map((f) => String(f.key));
  if (fields.length) out.push({ key: 'answered', label: 'How much is filled in', rule: { op: 'answers', show: 'progress', fields: keys(fields) } });
  const choices = fields.filter((f) => f.type === 'select' && Array.isArray(f.options));
  const ticks = choices.filter((f) => f.display === 'tick');
  if (ticks.length >= 3) out.push({ key: 'boxes_ticked', label: 'Boxes ticked', rule: { op: 'answers', show: 'ticked', fields: keys(ticks) } });
  const yn = choices.filter((f) => f.display !== 'tick' && (f.options as string[]).join('/') === 'Yes/No');
  if (yn.length >= 3) out.push({ key: 'checklist_yes', label: 'Checklist items answered Yes', rule: { op: 'answers', show: 'yes', fields: keys(yn) } });
  for (const o of ORDINAL) {
    const group = choices.filter((f) => (f.options as string[]).map((x) => x.toLowerCase()).filter((x) => !o.exclude.map((e) => e.toLowerCase()).includes(x)).join('|') === o.options.join('|'));
    if (group.length >= 5) out.push({ key: 'practice_maturity', label: 'Practice maturity', rule: { op: 'answers', show: 'score', fields: keys(group), points: o.points, exclude: o.exclude, bands: BANDS } });
  }
  return out;
}
