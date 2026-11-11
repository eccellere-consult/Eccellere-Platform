// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { structuredForm } from '@/lib/forms/structured';
import { coverageErrors, reconcile } from '@/lib/forms/reconcile';
import { makeFormBuilder } from '@/lib/forms/build';
import { interpret, normaliseDeclarative, qualityGate } from '@/lib/strategyModels/declarative';
import type { ModelValues } from '@/lib/strategyModels/types';
import { readSource, type ElementKind, type SourceElement, type SourceReading } from '@/lib/forms/source';
import { assess } from '@/lib/tools/standards';
import type { DeclField, DeclTable, DeclarativeTool } from '@/lib/strategyModels/declarative';
import { GENERIC_HELP } from '@/app/tools/[slug]/Workspace';
import { docxOf, SAMPLE_TOOLKIT } from './helpers/sampleDocx';

/** A small Word-like document: cover details, a module with a question table, a worksheet table, a checklist, repeated generic headings. */
function doc(rows: [ElementKind, string][]): SourceReading {
  const elements: SourceElement[] = rows.map(([kind, text], i) => ({ id: `E${i + 1}`, file: 'kit.docx', kind, text, where: `Paragraph ${i + 1}` }));
  return { fileName: 'kit.docx', kind: 'word', elements, warnings: [], truncated: false };
}
const DOC = doc([
  ['heading', 'ACME'], ['heading', 'FOUNDER KIT'],
  ['row', 'Founder Name | ______________'], ['row', 'Company Name | ______________'], ['row', 'Date | ______________'],
  ['heading', 'TABLE OF CONTENTS'], ['tablehead', 'Section | Title'], ['row', 'A | Team'], ['row', 'B | Money'],
  ['tablehead', 'SECTION A MODULE A — TEAM'],
  ['note', 'Check how aligned the founders are.'],
  ['tablehead', 'A.1 | Co-Founder Alignment [VALUE IMPACT: CRITICAL]'],
  ['tablehead', '# | Diagnostic Question | Rating (1–5) | Evidence / Notes'],
  ['row', 'A1.1 | Have all co-founders signed a Founders Agreement covering equity and vesting? | | '],
  ['row', 'A1.2 | Is there a four year vesting schedule with a one year cliff for everyone? | | '],
  ['row', 'A1.3 | Do the founders share one definition of success and a plan for exit? | | '],
  ['heading', 'Steps'],
  ['tablehead', 'Activity Area | Key Activities | Tools'],
  ['row', 'COMPETITOR MAPPING | Map every direct and indirect competitor and what problem each solves | Sheets'],
  ['row', 'DIFFERENTIATION | Define how you are meaningfully different from all alternatives | Deck'],
  ['row', 'SETUP | • Set up company email and chat tools • Register the trademark for the brand • Open a business bank account | Tools'],
  ['heading', 'Advice'],
  ['tablehead', 'Source | Core Insight | Application'],
  ['row', 'Y Combinator | Make something people want and talk to users | Daily'],
  ['row', 'Sequoia | Build on an insight that is non obvious to most | Weekly'],
]);

describe('structured document conversion', () => {
  const r = structuredForm([DOC], { name: 'Founder Kit', category: 'strategy' as never })!;
  const { tool } = normaliseDeclarative(r.form);
  const parts = tool!.sections.flatMap((s) => s.parts.map((p) => ({ section: s.title, ...p })));
  const reading = tool!.sections.flatMap((s) => s.reading ?? []);

  it('makes steps from headings and "A.1 | Title" lines, in document order, and adds none of its own', () => {
    const titles = tool!.sections.map((s) => s.title);
    expect(titles.some((t) => /Co-Founder Alignment/.test(t))).toBe(true);
    expect(titles).not.toContain('About this form');
    expect(titles).not.toContain('Action plan');
    expect(tool!.layout).toBe('document');
  });
  it('turns "label | blank" rows into fields with the wording unchanged', () => {
    const labels = parts.map((p) => p.label);
    expect(labels).toContain('Founder Name');
    expect(labels).toContain('Company Name');
  });
  it('keeps a question table as ONE table: a row for each question as written, a 1 to 5 rating and a notes box', () => {
    const t = parts.find((p) => p.kind === 'table' && p.fixedRows?.some((n) => n.includes('Have all co-founders signed'))) as DeclTable;
    expect(t).toBeDefined();
    expect(t.grid).toBe(true);
    expect(t.fixedRows).toHaveLength(3);
    expect(t.fixedRows![0]).toBe('A1.1 Have all co-founders signed a Founders Agreement covering equity and vesting?');
    expect(t.columns.map((c) => c.type)).toEqual(['text', 'rating', 'longtext']);
    expect(t.columns[1].header).toBe('Rating (1–5)');
    expect(t.columns[1].scale).toMatchObject({ min: 1, max: 5 });
  });
  it('keeps a worksheet table as a table: printed columns stay printed, and a notes column is added and reported', () => {
    const t = parts.find((p) => p.kind === 'table' && p.fixedRows?.includes('COMPETITOR MAPPING')) as DeclTable;
    expect(t.fixedRows).toEqual(['COMPETITOR MAPPING', 'DIFFERENTIATION', 'SETUP']);
    const printed = t.columns.find((c) => c.header === 'Key Activities')!;
    expect(printed.type).toBe('computed');
    expect(printed.rule).toMatchObject({ op: 'lookup' });
    expect(t.columns[t.columns.length - 1]).toMatchObject({ header: 'Your notes', type: 'longtext' });
    expect(r.approximations.join(' ')).toMatch(/“Your notes” column was added/);
    // the printed words are shown for their own row, and nothing is typed into them
    const cell = interpret(tool!).sections.flatMap((s) => s.parts).find((p) => p.key === t.key) as { columns: { key: string; compute?: (row: Record<string, string>, v: ModelValues) => string }[] };
    const col = cell.columns.find((c) => c.key === printed.key)!;
    expect(col.compute!({ [t.columns[0].key]: 'DIFFERENTIATION' }, { fields: {}, tables: {} })).toBe('Define how you are meaningfully different from all alternatives');
  });
  it('keeps advice and contents tables as reading, shown in place and never as questions', () => {
    const labels = parts.map((p) => p.label);
    expect(labels).not.toContain('Y Combinator');
    const tables = reading.filter((b) => b.kind === 'table') as { head: string[]; rows: string[][] }[];
    expect(tables.some((t) => t.head.join('|') === 'Source|Core Insight|Application' && t.rows.some((row) => row[0] === 'Sequoia'))).toBe(true);
    expect(tables.some((t) => t.head.join('|') === 'Section|Title')).toBe(true);
    expect(reading.some((b) => b.kind === 'text' && b.text === 'Check how aligned the founders are.')).toBe(true);
  });
  it('accounts for every source item: each is a step, a field, a table or reading that exists in the form', () => {
    const maps = (r.form as { sourceMap?: { element: string; target: string }[] }).sourceMap ?? [];
    expect(new Set(maps.map((m) => m.element)).size).toBe(DOC.elements.length);
    expect(maps.some((m) => /^(section|reading):/.test(m.target) && !tool!.sections.some((s) => m.target === `section:${s.key}` || m.target === `reading:${s.key}`))).toBe(false);
    expect(maps.some((m) => m.target === 'left-out:reading')).toBe(false);
  });
  it('leaves no source item open, so the draft can be marked reviewed', () => {
    const cov = reconcile(DOC.elements, r.form as never, tool!);
    expect(coverageErrors(cov)).toBeNull();
    expect(cov.counts.notCovered).toBe(0);
  });
  it('passes the quality check and clears the standards floor without the added steps', () => {
    expect(qualityGate(tool).ok).toBe(true);
    const q = assess(tool!);
    expect(q.errors).toEqual([]);
    expect(q.standards!.score).toBeGreaterThanOrEqual(60);
  });
  it('gives back null for a document with almost nothing to fill in, and leaves sheets to the sheet reader', () => {
    expect(structuredForm([doc([['heading', 'Intro'], ['note', 'Only reading here.'], ['row', 'Name | ____']])], { category: 'strategy' as never })).toBeNull();
    expect(structuredForm([{ ...DOC, kind: 'excel' }], { category: 'strategy' as never })).toBeNull();
  });
});

describe('a real Word file, read end to end', () => {
  const made = (async () => {
    const reading = await readSource('Supplier Review Toolkit.docx', await docxOf(SAMPLE_TOOLKIT));
    const built = structuredForm([reading], { name: 'Supplier Review Toolkit', category: 'strategy' as never })!;
    const { tool } = normaliseDeclarative(built.form);
    return { reading, built, tool: tool! };
  })();
  const partsOf = (t: DeclarativeTool) => t.sections.flatMap((s) => s.parts);

  it('reads heading depth, list items, tick boxes (typed and Word controls), round buttons and blank table rows', async () => {
    const { reading } = await made;
    const el = (text: string) => reading.elements.find((e) => e.text.includes(text))!;
    expect(el('Part 1: Supplier details').level).toBe(2);
    expect(el('How to use this toolkit')).toMatchObject({ kind: 'heading', level: 7 });
    expect(el('Rate honestly').list).toBe(true);
    expect(el('Contract is signed and filed')).toMatchObject({ kind: 'option', mark: 'box' });
    expect(el('Strategic partner')).toMatchObject({ kind: 'option', mark: 'circle' });
    expect(reading.elements.filter((e) => /^Table 4, row/.test(e.where))).toHaveLength(5);
  });
  it('keeps the steps of the document, in order, with nothing added', async () => {
    const { tool } = await made;
    expect(tool.sections.map((s) => s.title)).toEqual(['Part 1: Supplier details', 'Part 2: Performance assessment', 'Part 3: Readiness checklist', 'Part 4: Action plan']);
  });
  it('shows the introduction before the first step and the appendix after the last, as reading', async () => {
    const { tool } = await made;
    const above = (tool.sections[0].reading ?? []).filter((b) => b.place === 'above');
    expect(above[0]).toMatchObject({ kind: 'heading', text: 'Supplier Review Toolkit' });
    expect(above.some((b) => b.kind === 'list' && b.items.length === 2)).toBe(true);
    expect(above.some((b) => b.kind === 'table' && b.head.join('|') === 'Rating|Meaning' && b.rows.length === 3)).toBe(true);
    const below = (tool.sections[3].reading ?? []).filter((b) => b.place === 'below');
    expect(below[0]).toMatchObject({ kind: 'heading', text: 'Appendix: Benchmarks' });
    expect(below.some((b) => b.kind === 'text' && /Typical ranges/.test(b.text))).toBe(true);
    expect(below.some((b) => b.kind === 'table' && b.rows.some((row) => row[1] === 'Under 2 percent'))).toBe(true);
  });
  it('puts each instruction just before the part it introduces', async () => {
    const { tool } = await made;
    const s2 = tool.sections[1];
    expect(s2.reading).toContainEqual({ kind: 'text', text: 'Rate each question from 1 to 5 and note your evidence.', before: s2.parts[0].key });
  });
  it('makes labelled blanks into fields, in a table cell or on a line', async () => {
    const { tool } = await made;
    expect(tool.sections[0].parts.map((p) => p.label)).toEqual(['Supplier name', 'Category', 'Reviewed by', 'Review date']);
  });
  it('makes round-button options one choice and "tick all that apply" several', async () => {
    const { tool } = await made;
    const one = partsOf(tool).find((p) => p.label === 'How would you describe the relationship overall?') as DeclField;
    expect(one).toMatchObject({ type: 'select', display: 'radio', options: ['Transactional', 'Cooperative', 'Strategic partner'] });
    const many = partsOf(tool).find((p) => p.label.startsWith('Which risks apply')) as DeclField;
    expect(many).toMatchObject({ type: 'text', display: 'multi', options: ['Single source', 'Financial weakness', 'Long lead time', 'Quality drift'] });
  });
  it('makes a checklist of tick boxes, and counts the ticks', async () => {
    const { tool } = await made;
    const ticks = tool.sections[2].parts as DeclField[];
    expect(ticks.map((t) => t.label)).toEqual(['Contract is signed and filed', 'Service levels are agreed in writing', 'Escalation contacts are named']);
    expect(ticks.every((t) => t.type === 'select' && t.display === 'tick')).toBe(true);
    const out = interpret(tool).outputs!.find((o) => o.key === 'boxes_ticked')!;
    expect(out.compute({ fields: { [ticks[0].key]: 'Yes', [ticks[2].key]: 'Yes' }, tables: {} })).toBe('2 of 3 ticked (67%)');
  });
  it('keeps a table of blank rows as a table to fill in, with the same headings, row count and tick column', async () => {
    const { tool } = await made;
    const t = tool.sections[3].parts[0] as DeclTable;
    expect(t.columns.map((c) => c.header)).toEqual(['Action', 'Owner', 'Due date', 'Done']);
    expect(t).toMatchObject({ grid: true, minRows: 4 });
    expect(t.fixedRows).toBeUndefined();
    expect(t.columns[3]).toMatchObject({ type: 'select', display: 'tick' });
  });
  it('averages a rating column from what is entered, and nothing else', async () => {
    const { tool } = await made;
    const t = tool.sections[1].parts[0] as DeclTable;
    expect(t.label).toBe('Delivery and quality');
    const avg = interpret(tool).derived!.find((d) => d.key.startsWith('avg_'))!;
    const rows = [{ [t.columns[0].key]: t.fixedRows![0], [t.columns[1].key]: '4' }, { [t.columns[0].key]: t.fixedRows![1], [t.columns[1].key]: '3' }];
    // (4 + 3) / 2 = 3.5; the third row is blank and is not counted
    expect(avg.compute({ fields: {}, tables: { [t.key]: rows } })).toBe('3.5');
    expect(avg.compute({ fields: {}, tables: {} })).toBeNull();
  });
  it('is ready for review: no errors, every source item accounted for, and its help lines are the quiet generic ones', async () => {
    const { reading, built, tool } = await made;
    expect(assess(tool).errors).toEqual([]);
    const cov = reconcile(reading.elements, built.form as never, tool);
    expect(coverageErrors(cov)).toBeNull();
    expect(cov.counts.closedPct).toBe(100);
    for (const p of partsOf(tool)) expect(p.help).toMatch(GENERIC_HELP);
  });
});

describe('table shapes', () => {
  const build = (rows: [ElementKind, string][]) => normaliseDeclarative(structuredForm([doc(rows)], { name: 'Shapes', category: 'strategy' as never })!.form).tool!;
  const filler: [ElementKind, string][] = [['row', 'Name | ____'], ['row', 'City | ____'], ['row', 'Role | ____'], ['row', 'Date | ____'], ['row', 'Team | ____']];

  it('reads Yes / No and tick columns from their headings, and choices printed in the cells', () => {
    const t = build([['heading', 'Checks'], ...filler,
      ['tablehead', 'Control | In place (Yes / No) | Done | Level'],
      ['row', 'Access is reviewed each quarter | | ☐ | ☐ Low ☐ Medium ☐ High'],
      ['row', 'Backups are tested each month | | ☐ | ☐ Low ☐ Medium ☐ High'],
    ]).sections[0].parts.find((p) => p.kind === 'table') as DeclTable;
    expect(t.fixedRows).toEqual(['Access is reviewed each quarter', 'Backups are tested each month']);
    expect(t.columns[1]).toMatchObject({ type: 'select', options: ['Yes', 'No'], display: 'radio' });
    expect(t.columns[2]).toMatchObject({ type: 'select', options: ['Yes', 'No'], display: 'tick' });
    expect(t.columns[3]).toMatchObject({ type: 'select', options: ['Low', 'Medium', 'High'], display: 'radio' });
  });
  it('shows example rows above a fill-in table and starts the table blank', () => {
    const tool = build([['heading', 'Risks'], ...filler,
      ['tablehead', 'Risk | Likelihood | Impact'], ['row', 'Key supplier fails | High | High'], ['row', '| |'], ['row', '| |'], ['row', '| |'], ['row', '| |'],
    ]);
    const t = tool.sections[0].parts.find((p) => p.kind === 'table') as DeclTable;
    expect(t.fixedRows).toBeUndefined();
    expect(t.minRows).toBe(4);
    expect(tool.sections[0].reading).toContainEqual({ kind: 'table', head: ['Risk', 'Likelihood', 'Impact'], rows: [['Key supplier fails', 'High', 'High']], before: t.key });
  });
  it('makes several tick boxes in one cell into tick boxes under the row name', () => {
    const tool = build([['heading', 'Setup'], ...filler,
      ['tablehead', 'Area | Items'], ['row', 'Workspace | ☐ Set up company email ☐ Register the trademark ☐ Open a bank account'],
    ]);
    const ticks = tool.sections[0].parts.filter((p) => p.kind === 'field' && p.display === 'tick');
    expect(ticks.map((t) => t.label)).toEqual(['Set up company email', 'Register the trademark', 'Open a bank account']);
    expect(tool.sections[0].reading!.some((b) => b.kind === 'heading' && b.text === 'Workspace')).toBe(true);
  });
  it('keeps two rows that read the same as two rows', () => {
    const t = build([['heading', 'Repeat'], ...filler, ['tablehead', 'Item | Notes'], ['row', 'Review | '], ['row', 'Review | ']]).sections[0].parts.find((p) => p.kind === 'table') as DeclTable;
    expect(t.fixedRows).toEqual(['Review', 'Review (2)']);
  });
});

describe('sample safety', () => {
  it('a question that merely contains a placeholder word (such as "autodoc") does not fail the sample check', () => {
    const d = doc([
      ['heading', 'Setup'], ['row', 'Autodocumentation todo list | ______'], ['row', 'Mastodon tbd page | ______'], ['row', 'Name | ______'], ['row', 'City | ______'], ['row', 'Role | ______'], ['row', 'Date | ______'],
    ]);
    const { tool } = normaliseDeclarative(structuredForm([d], { name: 'Safe kit', category: 'strategy' as never })!.form);
    expect(qualityGate(tool).ok).toBe(true);
  });
});

describe('the Form Builder with no AI', () => {
  it('builds a reviewable draft from a document without calling the AI at all', async () => {
    const generate = vi.fn(async () => null);
    const build = makeFormBuilder({ generate, explainDown: () => 'down', slugTaken: async () => false });
    const out = await build({ request: 'Make it', name: 'Founder Kit', category: 'Strategy' as never, practice: 'Strategy' as never, readings: [DOC], noAi: true });
    expect(generate).not.toHaveBeenCalled();
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') {
      expect(out.tool.status === 'DRAFT' || out.tool.status === 'NEEDS_REVIEW').toBe(true);
      const def = out.tool.definition as { layout?: string; sections: { parts: unknown[]; reading?: unknown[] }[] };
      expect(def.sections.flatMap((s) => s.parts).length).toBeGreaterThanOrEqual(5);
      // the reading and the document layout survive the builder's clean-up of the definition
      expect(def.layout).toBe('document');
      expect(def.sections.flatMap((s) => s.reading ?? []).length).toBeGreaterThan(3);
    }
  });
});

describe('results worked out from the answers', () => {
  const rows: [ElementKind, string][] = [['heading', 'Practices']];
  ['Do you use total quality management?', 'Do you use statistical process control?', 'Do you trace every batch?', 'Do you run source inspections?', 'Do you measure the cost of quality?'].forEach((q) => {
    rows.push(['question', q], ['option', 'Not at all'], ['option', 'Somewhat'], ['option', 'To a large Extent'], ['option', 'N/A']);
  });
  const built = structuredForm([doc(rows)], { name: 'Practice check', category: 'strategy' as never })!;
  const { tool } = normaliseDeclarative(built.form);
  const def = interpret(tool!);
  const keys = tool!.sections.flatMap((x) => x.parts).filter((p) => p.kind === 'field' && (p as { options?: string[] }).options?.includes('Somewhat')).map((p) => p.key);
  const out = (key: string, fields: Record<string, string>) => def.outputs!.find((o) => o.key === key)!.compute({ fields, tables: {} } as ModelValues);

  it('passes the quality check with its results', () => { expect(qualityGate(tool).ok).toBe(true); expect(keys).toHaveLength(5); });
  it('counts how much is answered', () => {
    expect(out('answered', { [keys[0]]: 'Somewhat', [keys[1]]: 'Not at all' })).toMatch(/^2 of \d+ answered \(\d+%\)$/);
  });
  it('turns the agreed order into a percentage and a band, ignoring N/A and unanswered', () => {
    // 2 + 0 + 1 over 3 scored answers with a best of 2 each = 3/6 = 50%
    expect(out('practice_maturity', { [keys[0]]: 'To a large Extent', [keys[1]]: 'Not at all', [keys[2]]: 'Somewhat', [keys[3]]: 'N/A' })).toBe('50% from 3 scored answers (Developing)');
    expect(out('practice_maturity', { [keys[0]]: 'To a large Extent', [keys[1]]: 'To a large Extent' })).toBe('100% from 2 scored answers (Strong)');
    expect(out('practice_maturity', { [keys[0]]: 'N/A' })).toBeNull();
  });
  it('counts Yes answers on Yes / No questions', () => {
    const qs: [ElementKind, string][] = [['heading', 'Checklist'], ['row', 'Name | ____'], ['row', 'City | ____'], ['row', 'Role | ____']];
    ['Is the contract signed?', 'Are service levels agreed?', 'Is there an exit plan?'].forEach((q) => qs.push(['question', q], ['option', 'Yes'], ['option', 'No']));
    const t = normaliseDeclarative(structuredForm([doc(qs)], { name: 'Check list', category: 'strategy' as never })!.form).tool!;
    const y = t.sections.flatMap((x) => x.parts).filter((p) => (p as { options?: string[] }).options?.join('/') === 'Yes/No');
    expect(y).toHaveLength(3);
    expect(y.every((p) => (p as DeclField).display === 'radio')).toBe(true);
    const res = interpret(t).outputs!.find((o) => o.key === 'checklist_yes')!.compute({ fields: { [y[0].key]: 'Yes', [y[1].key]: 'Yes', [y[2].key]: 'No' }, tables: {} } as ModelValues);
    expect(res).toBe('2 of 3 answered Yes (67%)');
  });
});

describe('forms from sheets pass the quality check', () => {
  it('numbers repeated labels in one step and keeps a long title within the name and address limits', async () => {
    const { finishForm } = await import('@/lib/forms/fromSheets');
    const table = (key: string) => ({ kind: 'table', key, label: 'Summary table', help: 'Fill in the rows of the summary table.', rowLabel: 'Row', minRows: 1, columns: [{ key: 'item', header: 'Item', help: 'What the row is about.', type: 'text' }, { key: 'note', header: 'Note', help: 'A short note on the item.', type: 'text' }] });
    const field = (key: string, label: string) => ({ kind: 'field', key, label, type: 'text', help: `Fill in “${label}”.`, example: 'Example answer' });
    const longTitle = 'The Complete Operations Excellence Diagnostic and Improvement Toolkit for Growing Manufacturing Businesses in India and Abroad';
    const r = finishForm({
      name: longTitle, category: 'strategy' as never, readings: [{ fileName: 'kit.xlsx', kind: 'excel', elements: [], warnings: [], truncated: false }] as never,
      sections: [{ key: 'one', title: 'Summary', summary: 'The summary.', parts: [field('a', 'Company'), field('b', 'Sector'), table('t1'), table('t2')] }],
      derived: [], sampleValues: { a: 'Sample answer', b: 'Sample answer' }, sampleTables: { t1: [{ item: 'One', note: 'Two' }], t2: [{ item: 'One', note: 'Two' }] },
      map: [], approximations: [], firstField: { key: 'a', label: 'Company' },
    });
    const { tool } = normaliseDeclarative(r.form);
    expect(tool).toBeTruthy();
    const labels = tool!.sections[1].parts.map((p) => p.label);
    expect(labels).toContain('Summary table');
    expect(labels).toContain('Summary table (2)');
    expect((r.form.name as string).length).toBeLessThanOrEqual(80);
    expect((r.form.slug as string).length).toBeLessThanOrEqual(60);
    expect(qualityGate(tool).ok).toBe(true);
  });
});
