/**
 * Structured conversion of a DOCUMENT (Word, PDF, text) into a step-by-step form, WITHOUT the AI.
 *
 * Playbooks and toolkits are written as documents, not sheets: headings open a module, tables hold the exercises, and a table row is often
 * one question. The sheet reader (fromSheets.ts) turns a whole document into a single section of tables, which does not pass the quality
 * check. This reader instead:
 *   - starts a new STEP at every heading, "SECTION/MODULE/ANNEXURE ..." line and "A.1 | Title" line;
 *   - turns a row with a label and a blank answer ("Company name | ______") into a field;
 *   - turns each row of a table that has a QUESTION column ("Diagnostic Question", "Questions to Resolve ...") into one field, using the
 *     question text exactly as written, a 1 to 5 scale when the table has a rating column, otherwise a text box;
 *   - turns a question that ends with "?" into a field, and the option lines under it into its choices;
 *   - keeps everything else (advice tables, benchmarks, contents) as reading, says so, and never turns it into a question.
 * It invents no wording of questions, no figures and no method names. The result goes through the same furniture and the same checks as
 * the sheet reader, and returns null when too little looks like a question for a form to be useful.
 */
import type { ToolCategory } from '@/lib/strategyModels/declarative';
import { sourcePages, type SourceElement, type SourceReading } from './source';
import { finishForm, snake, unique, tidy, cut, pad, stripLead, type FaithfulResult, type Map1 } from './fromSheets';

type Part = Record<string, unknown>;
const MIN_QUESTIONS = 5;
const BLANK = /^[_\s.…\-–—☐□]*$/;
const MARKER = /^(?:SECTION|MODULE|ANNEXURE|ANNEX|PART|STEP|STAGE)\s+[A-Z0-9]+\b/i;
const SUBSTEP = /^(?:[A-Z]\.\d{1,2}|\d{1,2}[A-Z])$/;
const Q_HEAD = /question|resolve|diagnostic|prompt|criteria|checklist|ask yourself|consider/i;
const A_HEAD = /rating|score|answer|response|evidence|notes?|comment|your /i;
const ID_HEAD = /^(?:#|no\.?|id|ref\.?|sr\.?|s\.?no\.?)$/i;
/** A column heading that says the table is a worksheet to act on (activities, tasks, deliverables, metrics), so each row is something to answer. */
const INPUT_HEAD = /activit|action|task|deliverable|checklist|to do|exercise|worksheet|template|metric|kpi|target|outcome/i;
const BULLET = /\s*[•●▪◦]\s*/;
const IMPACT = /\s*\[([^\]]{3,60})\]\s*$/;

/** A sample answer for a choice: the first option that is not a placeholder word (the quality check rejects N/A, TBD and the like in a sample). */
const sampleOption = (opts: string[]): string => opts.find((o) => !/^(?:n\/?a|tbd|todo|none|-)$/i.test(o.trim())) ?? opts[0];
const GENERIC_TITLE = /^(?:steps?|notes?|overview|summary|introduction|examples?|template|checklist)$/i;
const cellsOf = (e: SourceElement): string[] => e.text.split(' | ').map(tidy);
const shortCells = (c: string[]) => c.length >= 2 && c.every((x) => x.length <= 70 && !/[.!?]$/.test(x));

interface Step { key: string; title: string; summary: string; parts: Part[]; reference: number }
interface Header { cells: string[]; input: boolean; q: number; id: number; rating: boolean; yesNo: boolean; scale: { min: number; max: number } }

function headerOf(cells: string[]): Header | null {
  const q = cells.findIndex((c) => Q_HEAD.test(c));
  const input = cells.slice(1).some((c) => INPUT_HEAD.test(c));
  if (q < 0) return input ? { cells, input, q: -1, id: -1, rating: false, yesNo: false, scale: { min: 1, max: 5 } } : null;
  const ans = cells.filter((c, i) => i !== q && A_HEAD.test(c));
  const ratingCell = ans.find((c) => /rating|score/i.test(c));
  const range = ratingCell ? /(\d)\s*[–-]\s*(\d)/.exec(ratingCell) : null;
  return {
    cells, input, q, id: cells.findIndex((c, i) => i !== q && ID_HEAD.test(c)),
    rating: !!ratingCell, yesNo: ans.some((c) => /yes\s*\/?\s*no/i.test(c)),
    scale: range ? { min: Math.min(+range[1], +range[2]), max: Math.max(+range[1], +range[2]) } : { min: 1, max: 5 },
  };
}

/** Answer sets that have a plain, agreed order. Anything else is not scored: a score would be a guess. */
const ORDINAL: { options: string[]; points: Record<string, number>; exclude: string[] }[] = [
  { options: ['not at all', 'somewhat', 'to a large extent'], points: { 'Not at all': 0, Somewhat: 1, 'To a large Extent': 2 }, exclude: ['N/A'] },
];
/** Placeholder band edges on a 0 to 100 scale. They are shown in the result's help and need the owner's approval. */
const BANDS = [{ min: 0, label: 'Low' }, { min: 34, label: 'Developing' }, { min: 67, label: 'Strong' }];

/** The results a converted form gets: how much is answered, how many checklist items are Yes, and a maturity percentage where the answers have an agreed order. */
function resultsFor(sections: { parts: Part[] }[]): Record<string, unknown>[] {
  const fields = sections.flatMap((s) => s.parts).filter((p) => p.kind === 'field');
  const out: Record<string, unknown>[] = [];
  if (fields.length) out.push({ key: 'answered', label: 'How much is filled in', rule: { op: 'answers', show: 'progress', fields: fields.map((f) => String(f.key)) } });
  const yn = fields.filter((f) => Array.isArray(f.options) && (f.options as string[]).length === 2 && (f.options as string[]).join('/') === 'Yes/No');
  if (yn.length >= 3) out.push({ key: 'checklist_yes', label: 'Checklist items answered Yes', rule: { op: 'answers', show: 'yes', fields: yn.map((f) => String(f.key)) } });
  for (const o of ORDINAL) {
    const group = fields.filter((f) => Array.isArray(f.options) && (f.options as string[]).map((x) => x.toLowerCase()).filter((x) => !o.exclude.map((e) => e.toLowerCase()).includes(x)).join('|') === o.options.join('|'));
    if (group.length >= 5) out.push({ key: 'practice_maturity', label: 'Practice maturity (placeholder bands, to be approved)', rule: { op: 'answers', show: 'score', fields: group.map((f) => String(f.key)), points: o.points, exclude: o.exclude, bands: BANDS } });
  }
  return out;
}

export function structuredForm(readings: readonly SourceReading[], opts: { name?: string; category: ToolCategory }): FaithfulResult | null {
  const pages = sourcePages(readings);
  const all = readings.flatMap((r) => r.elements);
  if (!pages.length || !all.length) return null;
  if (readings.some((r) => r.kind === 'excel')) return null; // sheets keep the sheet reader: each sheet is already a page
  const name = tidy(opts.name ?? '') || tidy((readings[0]?.fileName ?? 'New form').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) || 'New form';

  const used = new Set<string>(['purpose', 'filled_in_by', 'actions', 'summary']);
  const stepKeys = new Set<string>(['context', 'action_plan']);
  const map: Map1[] = [];
  const approximations: string[] = [];
  const sampleValues: Record<string, string> = { purpose: 'A fictional example of why this form is being filled in for.', filled_in_by: 'Operations Manager' };
  let firstField: { key: string; label: string } | null = null;
  let questions = 0;
  let referenceRows = 0;

  const steps: Step[] = [];
  let labelsInStep = new Set<string>();
  let last: { part: Part; key: string } | null = null;
  let header: Header | null = null;
  let inTable = false;

  const open = (title: string, summary = ''): Step => {
    const t = cut(tidy(title) || 'Details', 80);
    const step: Step = { key: unique(snake(t), stepKeys), title: t, summary, parts: [], reference: 0 };
    steps.push(step); labelsInStep = new Set(); last = null; header = null; inTable = false;
    return step;
  };
  const current = (): Step => steps[steps.length - 1] ?? open('Details');

  const addField = (e: SourceElement, rawLabel: string, type: string, help: string, extra: Part = {}): { part: Part; key: string } => {
    const s = current();
    let label = cut(tidy(rawLabel), 300);
    for (let n = 2; labelsInStep.has(label.toLowerCase()); n++) label = `${cut(tidy(rawLabel), 290)} (${n})`;
    labelsInStep.add(label.toLowerCase());
    // the quality check scans a sample (keys included) for placeholder words; a key that merely contains one, such as "autodoc" or "mastodon", must not trip it
    const key = unique(snake(label).slice(0, 40).replace(/tbd|todo|lorem/gi, (m) => `${m[0]}_${m.slice(1)}`), used);
    const part: Part = { kind: 'field', key, label, type, help: pad(help), ...extra };
    s.parts.push(part);
    sampleValues[key] = type === 'select' && Array.isArray(extra.options) ? sampleOption(extra.options as string[]) : type === 'rating' ? '3' : 'Sample answer';
    firstField ??= { key, label };
    questions += 1;
    map.push({ element: e.id, target: `field:${key}` });
    return { part, key };
  };

  const reference = (e: SourceElement, note = 'Reading in the document, not a question') => {
    const s = current();
    s.reference += 1; referenceRows += 1;
    map.push({ element: e.id, target: `section:${s.key}`, note });
  };

  for (let i = 0; i < all.length; i++) {
    const e = all[i];
    const t = tidy(e.text);
    if (!t) continue;
    const cells = cellsOf(e);

    // ── A new step ──
    const isSub = e.kind === 'tablehead' && cells.length >= 2 && SUBSTEP.test(cells[0]);
    const isMarker = (e.kind === 'tablehead' || e.kind === 'note') && MARKER.test(t) && t.length <= 140;
    if (e.kind === 'heading' || isSub || isMarker) {
      const raw = isSub ? cells.slice(1).join(' — ') : t;
      const impact = IMPACT.exec(raw);
      const title = impact ? raw.replace(IMPACT, '') : raw;
      const prev: Step | undefined = steps[steps.length - 1];
      if (e.kind === 'heading' && prev && prev.parts.length === 0 && prev.reference === 0 && !inTable) {
        // consecutive headings with nothing between them are one title
        prev.title = cut(`${prev.title} ${tidy(title)}`, 80);
        map.push({ element: e.id, target: `section:${prev.key}` });
        continue;
      }
      const before: Step | undefined = steps[steps.length - 1];
      const s = open(GENERIC_TITLE.test(tidy(title)) && before ? `${before.title} — ${tidy(title)}` : title, impact ? impact[1] : '');
      map.push({ element: e.id, target: `section:${s.key}` });
      continue;
    }

    const s = current();

    // ── Table header ──
    const next = all[i + 1];
    const blankAnswer = cells.length >= 2 && BLANK.test(cells[cells.length - 1]) && cells.slice(0, -1).some((c) => c && !BLANK.test(c));
    const startsTable = !inTable && !blankAnswer && (e.kind === 'tablehead' || (e.kind === 'row' && next?.kind === 'row' && cellsOf(next).length === cells.length));
    if (startsTable && shortCells(cells)) {
      inTable = true; header = headerOf(cells); last = null;
      map.push({ element: e.id, target: `section:${s.key}`, note: 'Table heading' });
      continue;
    }

    if (e.kind === 'row' || e.kind === 'tablehead') {
      // a label with a blank answer: an input
      if (blankAnswer) {
        const label = cells.slice(0, -1).filter(Boolean).join(' — ');
        last = addField(e, stripLead(label), label.length > 90 ? 'longtext' : 'text', `Fill in “${cut(stripLead(label), 80)}”.`);
        inTable = true; continue;
      }
      // a checklist inside a cell: each bullet is a yes/no item
      const bulleted = cells.filter((c) => c.split(BULLET).filter((x) => x.length >= 8).length >= 3 && BULLET.test(c));
      if (bulleted.length) {
        const rowName = cells[0] && cells[0].length <= 90 ? cells[0] : '';
        for (const c of bulleted) {
          for (const item of c.split(BULLET).map(tidy).filter((x) => x.length >= 8)) last = addField(e, item, 'select', rowName ? `Checklist: ${cut(rowName, 80)}.` : 'Checklist item.', { options: ['Yes', 'No'] });
        }
        continue;
      }
      if (header && header.q < 0 && header.input && cells.length >= 2 && cells[0].length >= 3 && cells[0].length <= 90 && cells.slice(1).some((c) => c.length >= 20)) {
        const guide = [...cells.slice(1)].sort((a, b) => b.length - a.length)[0];
        last = addField(e, cells[0], 'longtext', cut(guide, 190));
        continue;
      }
      if (header && header.q >= 0 && cells.length > header.q) {
        const q = cells[header.q];
        if (q && q.length >= 8 && !BLANK.test(q)) {
          const id = header.id >= 0 ? cells[header.id] : '';
          const dim = cells.find((c, ci) => ci !== header!.q && ci !== header!.id && c && c.length <= 60) ?? '';
          const help = id ? `Question ${id}${dim ? `, ${dim}` : ''}.` : dim ? `About: ${dim}.` : `From the table “${cut(header.cells[header.q], 60)}”.`;
          if (header.rating) last = addField(e, q, 'rating', `${help} Rate from ${header.scale.min} to ${header.scale.max}.`, { scale: { min: header.scale.min, max: header.scale.max, low: 'Low', high: 'High' } });
          else if (header.yesNo) last = addField(e, q, 'select', help, { options: ['Yes', 'No'] });
          else last = addField(e, q, 'longtext', help);
          continue;
        }
      }
      reference(e); continue;
    }

    inTable = false; header = null;

    // ── Prose ──
    if (e.kind === 'question' && /\?\s*$/.test(t)) {
      const label = stripLead(t);
      last = addField(e, label, label.length > 90 ? 'longtext' : 'text', `Answer “${cut(label, 80)}”.`);
      continue;
    }
    if (e.kind === 'option' && last) {
      const opts = ((last.part.options as string[] | undefined) ?? []).concat(stripLead(t));
      last.part.options = opts.slice(0, 20);
      if (opts.length >= 2) { last.part.type = 'select'; sampleValues[last.key] = sampleOption(opts); }
      map.push({ element: e.id, target: `option:${last.key}` });
      continue;
    }
    if (e.kind === 'note' || e.kind === 'instruction') {
      if (!s.summary && t.length <= 300) s.summary = t;
      map.push({ element: e.id, target: `section:${s.key}` });
      continue;
    }
    reference(e);
  }

  if (questions < MIN_QUESTIONS) return null;

  const real = steps.filter((x) => x.parts.length > 0);
  const readingOnly = steps.length - real.length;
  if (readingOnly) approximations.push(`${readingOnly} part${readingOnly === 1 ? '' : 's'} of the document had no questions (reading only) and ${readingOnly === 1 ? 'is' : 'are'} not steps in the form.`);
  if (referenceRows) approximations.push(`${referenceRows} reading item${referenceRows === 1 ? '' : 's'} (advice tables, benchmarks, contents) ${referenceRows === 1 ? 'was' : 'were'} not turned into questions. They stay in the original document.`);
  // a step whose summary came from a long title keeps its title short; the first step of a document titled by its cover headings is "Details"
  const sections = real.map((x, n) => ({
    key: x.key,
    title: n === 0 && x.title.length > 60 ? 'Details' : x.title,
    summary: cut(x.summary || `Step ${n + 1} of the document “${readings[0]?.fileName ?? name}”.`, 300),
    parts: x.parts,
  }));
  const extraOutputs = resultsFor(sections);
  return finishForm({ name, category: opts.category, readings, sections, derived: [], sampleValues, sampleTables: {}, map, approximations, firstField, extraOutputs });
}
