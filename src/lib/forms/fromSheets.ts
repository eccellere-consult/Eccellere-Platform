/**
 * Faithful conversion of an uploaded workbook (or any document) into a form, WITHOUT the AI.
 *
 * Why it exists: an upload must always give a working form in a format similar to the original. The AI is good at improving a form but can
 * fail, time out or write something the engine cannot run. So the form is first built here, deterministically, from the structure that was
 * read: every sheet or file becomes the next section in order, labelled lines become fields, a header row followed by rows becomes a table,
 * a list under a question becomes its choices. The result passes the quality gate on its own. The AI is then asked to IMPROVE this form,
 * and its answer is used only when it is no worse; otherwise this one is kept.
 *
 * It adds only plain, clearly generic furniture the standard requires (a context section, an action plan, a summary result, a diagram and a
 * labelled sample). It invents no figures, benchmarks or method names. Formulas in the source are listed, not rebuilt.
 */
import type { ToolCategory } from '@/lib/strategyModels/declarative';
import { sourcePages, type SourceElement, type SourceReading } from './source';

export interface FaithfulResult {
  /** a raw tool object (the shape the AI is also asked for), with `sourceMap` so coverage works the same way */
  form: Record<string, unknown>;
  approximations: string[];
  assumptions: string[];
}

const snake = (s: string): string => {
  const k = s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40).replace(/_+$/g, '');
  return /^[a-z]/.test(k) ? k : `k_${k || 'item'}`;
};
const unique = (base: string, used: Set<string>): string => {
  let k = base || 'item';
  for (let n = 2; used.has(k); n++) k = `${base}_${n}`.slice(0, 44);
  used.add(k);
  return k;
};
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const stripLead = (s: string) => tidy(s.replace(/^\s*(?:q(?:uestion)?\.?\s*)?\d{1,3}[.):]\s+/i, '').replace(/^\s*(?:[☐☑☒□■○◯●◻]|\[\s?[xX ]?\s?\]|[-–•*·]|[a-hA-H][.)])\s*/, ''));
const isNumber = (s: string) => s.trim() !== '' && !Number.isNaN(Number(s.replace(/[,%₹$\s]/g, '')));
const helpFor = (what: string, where: string) => cut(`Fill in “${what}” as it is asked in ${where}. Use a short, plain answer.`, 200);
const pad = (s: string) => (s.length >= 40 ? s : `${s} Keep it short and specific.`.slice(0, 200));

type Part = Record<string, unknown>;
type Map1 = { element: string; target: string; note?: string };

export function faithfulForm(readings: readonly SourceReading[], opts: { name?: string; category: ToolCategory }): FaithfulResult | null {
  const pages = sourcePages(readings);
  const all = readings.flatMap((r) => r.elements);
  if (!pages.length || !all.length) return null;
  const byId = new Map<string, SourceElement>(all.map((e) => [e.id, e]));
  const name = tidy(opts.name ?? '') || tidy((readings[0]?.fileName ?? 'New form').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) || 'New form';
  const map: Map1[] = [];
  const approximations: string[] = [];
  const used = new Set<string>(['purpose', 'filled_in_by', 'actions', 'summary']);
  const sectionKeys = new Set<string>(['context', 'action_plan']);
  const sections: Record<string, unknown>[] = [];
  const sampleValues: Record<string, string> = { purpose: 'A fictional example of why this form is being filled in.', filled_in_by: 'Operations Manager' };
  const sampleTables: Record<string, Record<string, string>[]> = {};
  const derived: Record<string, unknown>[] = [];
  let firstField: { key: string; label: string } | null = null;

  for (const page of pages) {
    const title = tidy((page.sheet ?? page.file.replace(/\.[^.]+$/, '')).replace(/[_]+/g, ' '));
    const sKey = unique(snake(title), sectionKeys);
    const where = page.sheet ? `the sheet “${page.sheet}”` : `the file “${page.file}”`;
    const parts: Part[] = [];
    const bits: string[] = [];
    let table: { part: Part; key: string; cols: { key: string; header: string }[]; rows: string[][] } | null = null;
    let lastQ: { part: Part; key: string } | null = null;
    let heading = '';
    const flushTable = () => {
      if (!table) return;
      const cols = table.part.columns as Record<string, unknown>[];
      const full = table.rows.filter((r) => r.length === cols.length);
      cols.forEach((c, i) => {
        if (i > 0 && full.length > 0 && full.every((r) => isNumber(r[i]))) {
          c.type = 'number';
          if (derived.length < 3) derived.push({ key: `total_${table!.key}_${c.key}`.slice(0, 44), label: `Total of ${String(c.header)}`, help: `Added up from the “${String(c.header)}” column of the table above.`, rule: { op: 'calc', expr: { agg: 'sum', table: table!.key, col: c.key }, format: 'dp1' } });
        }
      });
      sampleTables[table.key] = [0, 1].map((n) => Object.fromEntries(cols.map((c) => [String(c.key), c.type === 'number' ? String(10 * (n + 1)) : c.type === 'select' ? String((c.options as string[])[0]) : `Sample entry ${n + 1}`])));
      table = null;
    };
    const newTable = (headers: string[], label: string) => {
      flushTable();
      const tKey = unique(snake(label || `${title} table`), used);
      const colUsed = new Set<string>();
      const heads = headers.length >= 2 ? headers : [...headers, 'Notes'];
      const cols = heads.map((h) => ({ key: unique(snake(h), colUsed), header: cut(tidy(h) || 'Column', 60), help: cut(`What to enter under “${tidy(h)}”, as in ${where}.`, 160), type: 'text' }));
      const part: Part = { kind: 'table', key: tKey, label: cut(label || `${title} table`, 80), help: pad(`Add one row for each entry, as in ${where}. Use the same wording each time so rows can be compared.`), rowLabel: 'Row', minRows: 3, columns: cols };
      parts.push(part);
      table = { part, key: tKey, cols, rows: [] };
      return table;
    };

    for (const id of page.ids) {
      const e = byId.get(id);
      if (!e) continue;
      const t = tidy(e.text);
      if (e.kind === 'heading') {
        heading = t; flushTable(); lastQ = null;
        if (bits.length < 2) bits.push(t);
        map.push({ element: e.id, target: `section:${sKey}` });
      } else if (e.kind === 'note' || e.kind === 'instruction') {
        if (e.kind === 'note' && t.length <= 70 && !/[.!]$/.test(t) && !table) {
          // a short label on its own line is an input in the original sheet
          flushTable();
          const key = unique(snake(stripLead(t)), used);
          const part: Part = { kind: 'field', key, label: cut(stripLead(t), 120), type: 'text', help: pad(helpFor(stripLead(t), where)) };
          parts.push(part); lastQ = { part, key }; firstField ??= { key, label: String(part.label) };
          sampleValues[key] = 'Sample answer';
          map.push({ element: e.id, target: `field:${key}` });
        } else {
          if (bits.length < 3) bits.push(t);
          map.push({ element: e.id, target: `section:${sKey}` });
        }
      } else if (e.kind === 'question') {
        flushTable();
        const label = cut(stripLead(t), 160);
        const key = unique(snake(label), used);
        const part: Part = { kind: 'field', key, label, type: label.length > 90 ? 'longtext' : 'text', help: pad(helpFor(label, where)) };
        parts.push(part); lastQ = { part, key }; firstField ??= { key, label };
        sampleValues[key] = 'Sample answer';
        map.push({ element: e.id, target: `field:${key}` });
      } else if (e.kind === 'option') {
        const allowed = /^allowed values for [^:]+:(.*)$/i.exec(t);
        if (allowed) {
          const values = allowed[1].split(',').map(tidy).filter(Boolean);
          if (lastQ && values.length >= 2 && !(lastQ.part.options as string[] | undefined)?.length) {
            lastQ.part.type = 'select'; lastQ.part.options = values.slice(0, 20); sampleValues[lastQ.key] = values[0];
            map.push({ element: e.id, target: `option:${lastQ.key}` });
          } else map.push({ element: e.id, target: `section:${sKey}` });
        } else if (lastQ) {
          const opts = ((lastQ.part.options as string[] | undefined) ?? []).concat(stripLead(t));
          lastQ.part.options = opts; if (opts.length >= 2) { lastQ.part.type = 'select'; sampleValues[lastQ.key] = opts[0]; }
          map.push({ element: e.id, target: `option:${lastQ.key}` });
        } else map.push({ element: e.id, target: `section:${sKey}` });
      } else if (e.kind === 'tablehead') {
        const tb = newTable(t.split(' | '), heading);
        map.push({ element: e.id, target: `table:${tb.key}` });
      } else if (e.kind === 'row') {
        const cells = t.split(' | ');
        const tb = table ?? newTable(cells.map((_, i) => `Column ${i + 1}`), heading);
        tb.rows.push(cells);
        map.push({ element: e.id, target: `table:${tb.key}` });
      } else if (e.kind === 'formula') {
        approximations.push(`Formula not rebuilt (${where}): ${cut(t, 120)}`);
        map.push({ element: e.id, target: table ? `table:${(table as { key: string }).key}` : `section:${sKey}` });
      } else map.push({ element: e.id, target: `section:${sKey}` });
    }
    flushTable();
    if (!parts.length) {
      const key = unique(snake(`${title} notes`), used);
      parts.push({ kind: 'field', key, label: cut(`Notes for ${title}`, 100), type: 'longtext', help: pad(`Write anything that applies to ${where}.`) });
      sampleValues[key] = 'Sample answer';
    }
    sections.push({ key: sKey, title: cut(title, 80), summary: cut(bits.join(' ') || `Taken from ${where} of the uploaded file.`, 300), parts });
  }

  const context = {
    key: 'context', title: 'About this form', summary: 'Say who is filling this in and why. This section was added; it is not in the uploaded file.',
    parts: [
      { kind: 'field', key: 'purpose', label: 'What is this form being filled in for?', type: 'longtext', help: 'Describe the situation or decision this form supports, so anyone reading it later understands why it was completed.', example: 'Annual review of our supplier performance before contracts are renewed.' },
      { kind: 'field', key: 'filled_in_by', label: 'Who is filling it in (role)?', type: 'text', help: 'Name the role, not the person, for example Operations Manager, so the answers can be compared across teams.', example: 'Operations Manager' },
    ],
  };
  const plan = {
    key: 'action_plan', title: 'Action plan', summary: 'Turn what you found into dated actions. This section was added; it is not in the uploaded file.',
    parts: [{
      kind: 'table', key: 'actions', label: 'Actions for the next 90 days', help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.', rowLabel: 'Action', minRows: 3,
      columns: [
        { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
        { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Finance Manager, not a named person.', type: 'text' },
        { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
        { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
      ],
    }],
  };
  sampleTables.actions = [{ action: 'Agree one improvement from this review', owner: 'Operations Manager', measure: 'Improvement agreed in writing', horizon: '30 days' }];
  const allSections = [context, ...sections, plan];
  const labels = allSections.map((s) => String(s.title));
  const stepNames = labels.length > 8 ? [...labels.slice(0, 7), 'Action plan'] : labels;
  const first = firstField ?? { key: 'purpose', label: 'What is this form being filled in for?' };
  const stepList = labels.slice(0, 6).join(', ');

  const form: Record<string, unknown> = {
    schema: 1,
    slug: snake(name).replace(/_/g, '-'),
    name,
    category: opts.category,
    does: cut(`Collects the same information as the uploaded file “${readings[0]?.fileName ?? name}”, in the same order, and ends with an action plan.`, 300),
    whenToUse: 'Use it when you need to gather this information in a consistent way from several people or teams, instead of passing a spreadsheet around.',
    whenNotToUse: 'Do not use it when the questions in the original file have changed; update the form first so answers stay comparable.',
    next: 'Review the answers with the people involved and turn the main findings into the action plan below.',
    reference: {
      originator: '', year: '',
      summary: cut(`This form follows the layout of the uploaded file: ${stepList}${labels.length > 6 ? ' and more' : ''}.`, 400),
      caption: 'The steps of the form, in the order they appear.',
      howToRead: ['Work through the sections from left to right.', 'Totals are worked out for you from the numbers you enter.'],
    },
    diagram: { template: 'steps', title: cut(name, 60), steps: (stepNames.length >= 3 ? stepNames : [...stepNames, 'Decide']).slice(0, 8).map((n) => ({ name: cut(n, 30) })) },
    sections: allSections,
    ...(derived.length ? { derived } : {}),
    outputs: [{ key: 'summary', label: 'Summary of your entry', rule: { op: 'template', text: `${first.label}: {${first.key}}` } }],
    analysisGuide: `Start with the sections in the order shown: ${stepList}. Look first for blanks and for answers that disagree with each other, because they usually point to a misunderstanding of the question rather than a real difference. Where totals are shown, check that they match what you expect from your own records before relying on them. Then pick the two or three findings that matter most for the decision this form supports, and write them as actions in the action plan, each with an owner (a role), a measure of success and a start window. Share the completed form with the people who answered so they can confirm it reads correctly.`,
    sample: { scenario: 'A fictional example, not real data, to show what a completed form can look like.', values: sampleValues, tables: sampleTables },
    sourceMap: map,
    assumptions: ['Built directly from the uploaded file without AI. Wording of help text is generic; use Modify with AI to improve it.', 'A context section and an action plan were added because every Eccellere form has them.'],
    approximations,
    confidence: 'medium',
    concerns: ['Layout and questions follow the file; the help text and any calculations still need a person (or the AI) to improve them.'],
  };
  return { form, approximations, assumptions: form.assumptions as string[] };
}
