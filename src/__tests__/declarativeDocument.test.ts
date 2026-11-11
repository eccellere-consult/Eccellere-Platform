// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cleanReading, interpret, normaliseDeclarative, qualityGate, ruleFn, validateDeclarative, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { EXAMPLE_TOOL } from '@/lib/tools/draft';
import { keepDocumentLayout } from '@/lib/forms/build';
import { fieldsFromValues, valuesFromFields } from '@/lib/strategyModels/values';
import { buildWorkbook, readWorkbook, workbookBytes } from '@/lib/tools/workbook';
import { landedIn } from '@/app/admin/tools/ReviewPanel';
import type { TablePart } from '@/lib/strategyModels/types';
import { describePart, parseGenerated } from '@/lib/strategyHubAi';

/** A small form in the document layout: reading in place, a tick box, visible choices, tick-all-that-apply and a grid table with a printed column. */
const DOC_TOOL: DeclarativeTool = {
  ...EXAMPLE_TOOL,
  slug: 'supplier-check', name: 'Supplier check', layout: 'document',
  sections: [{
    key: 'checks', title: 'Checks', summary: '',
    reading: [
      { kind: 'heading', text: 'Before you start', place: 'above' },
      { kind: 'text', text: 'Rate each control honestly.', before: 'controls' },
      { kind: 'list', items: ['One', 'Two'] },
      { kind: 'table', head: ['Rating', 'Meaning'], rows: [['1', 'Not in place']] },
    ],
    parts: [
      { kind: 'field', key: 'signed', label: 'Contract is signed', type: 'select', options: ['Yes', 'No'], display: 'tick', help: 'Tick the box when this item is done or applies to you.' },
      { kind: 'field', key: 'relation', label: 'Relationship', type: 'select', options: ['Transactional', 'Cooperative'], display: 'radio', help: 'Choose the one option that fits your situation best.' },
      { kind: 'field', key: 'risks', label: 'Risks that apply', type: 'text', options: ['Single source', 'Long lead time', 'Quality drift'], display: 'multi', help: 'Tick every option that applies to your situation.' },
      {
        kind: 'table', key: 'controls', label: 'Controls', help: 'Fill in the blank columns for each row. The other columns are as printed in the document.', rowLabel: 'Row', grid: true,
        fixedRows: ['Access review', 'Backup test'],
        columns: [
          { key: 'control', header: 'Control', help: 'The row as printed in the document.', type: 'text' },
          { key: 'owner', header: 'Owner', help: 'Printed in the document for this row; nothing to fill in.', type: 'computed', rule: { op: 'lookup', by: 'control', map: { 'Access review': 'IT Manager', 'Backup test': 'Operations Manager' } } },
          { key: 'done', header: 'Done', help: 'Tick when this row is done or applies.', type: 'select', options: ['Yes', 'No'], display: 'tick' },
          { key: 'rating', header: 'Rating', help: 'Rate this row from 1 to 5.', type: 'rating', scale: { min: 1, max: 5, low: 'Low', high: 'High' } },
        ],
      },
    ],
  }],
  derived: [],
  outputs: [
    { key: 'ticked', label: 'Boxes ticked', rule: { op: 'answers', show: 'ticked', fields: ['signed'] } },
    { key: 'avg', label: 'Average rating', rule: { op: 'calc', expr: { agg: 'avg', table: 'controls', col: 'rating' }, format: 'dp1' } },
  ],
  sample: undefined,
};

describe('the document layout in a tool stored as data', () => {
  it('passes the quality gate', () => {
    expect(qualityGate(DOC_TOOL).blockers).toEqual([]);
  });
  it('is kept whole when a stored or AI-written definition is cleaned', () => {
    const { tool } = normaliseDeclarative(JSON.parse(JSON.stringify(DOC_TOOL)));
    expect(tool!.layout).toBe('document');
    expect(tool!.sections[0].reading).toEqual(DOC_TOOL.sections[0].reading);
    const [tick, radio, multi, table] = tool!.sections[0].parts;
    expect(tick).toMatchObject({ display: 'tick' });
    expect(radio).toMatchObject({ display: 'radio' });
    expect(multi).toMatchObject({ type: 'text', display: 'multi', options: ['Single source', 'Long lead time', 'Quality drift'] });
    expect(table).toMatchObject({ grid: true });
    expect((table as { columns: { display?: string }[] }).columns[2].display).toBe('tick');
  });
  it('reaches the form the page draws: displays, the grid flag and the reading', () => {
    const def = interpret(DOC_TOOL);
    const [tick, radio, multi, table] = def.sections[0].parts;
    expect(tick).toMatchObject({ type: 'select', display: 'tick' });
    expect(radio).toMatchObject({ type: 'select', display: 'radio' });
    expect(multi).toMatchObject({ type: 'text', display: 'multi' });
    expect(table).toMatchObject({ grid: true });
    expect(def.sections[0].reading).toHaveLength(4);
    // a tool without any of it is unchanged
    const plain = interpret(EXAMPLE_TOOL);
    expect(plain.sections.every((s) => s.reading === undefined)).toBe(true);
    expect(plain.sections.flatMap((s) => s.parts).every((p) => !('display' in p) && !('grid' in p))).toBe(true);
  });
  it('shows a printed column from the row name, and nothing for a row it does not know', () => {
    const f = ruleFn({ op: 'lookup', by: 'control', map: { 'Access review': 'IT Manager' } });
    expect(f({ control: 'Access review' }, { fields: {}, tables: {} })).toBe('IT Manager');
    expect(f({ control: 'Something else' }, { fields: {}, tables: {} })).toBeNull();
    expect(f({ control: 'constructor' }, { fields: {}, tables: {} })).toBeNull();
    expect(f(undefined, { fields: {}, tables: {} })).toBeNull();
  });
  it('counts ticked boxes out of all the boxes', () => {
    const f = ruleFn({ op: 'answers', show: 'ticked', fields: ['a', 'b', 'c', 'd'] });
    // 1 of 4 = 25%
    expect(f(undefined, { fields: { a: 'Yes', b: '', c: 'No' }, tables: {} })).toBe('1 of 4 ticked (25%)');
    expect(f(undefined, { fields: {}, tables: {} })).toBe('0 of 4 ticked (0%)');
  });
  it('refuses a display on the wrong kind of field, a lookup outside a table, and broken reading', () => {
    const bad = JSON.parse(JSON.stringify(DOC_TOOL)) as DeclarativeTool;
    (bad.sections[0].parts[0] as { type: string }).type = 'text';
    (bad.sections[0].parts[2] as { options?: string[] }).options = ['Only one'];
    bad.sections[0].reading!.push({ kind: 'text', text: 'Orphan', before: 'no_such_part' });
    bad.outputs!.push({ key: 'x', label: 'X', rule: { op: 'lookup', by: 'control', map: {} } });
    const msgs = validateDeclarative(bad).filter((i) => i.level === 'error').map((i) => `${i.path}: ${i.message}`);
    expect(msgs.some((m) => /parts\[0\]\.display: tick can be used only on a select/.test(m))).toBe(true);
    expect(msgs.some((m) => /parts\[2\]\.display: tick-all-that-apply needs a text field with at least 2 options/.test(m))).toBe(true);
    expect(msgs.some((m) => /reading: block 5 sits before an unknown part no_such_part/.test(m))).toBe(true);
    expect(msgs.some((m) => /outputs\[2\]\.rule: unknown column control/.test(m))).toBe(true);
  });
  it('drops anything that is not a known reading block, and cuts over-long text', () => {
    const got = cleanReading([{ kind: 'text', text: 'x'.repeat(9000) }, { kind: 'script', text: 'no' }, { kind: 'list', items: [] }, { kind: 'table', head: [], rows: [] }, 'nope', { kind: 'heading', text: ' Title ', place: 'sideways' }]);
    expect(got).toHaveLength(2);
    expect((got[0] as { text: string }).text).toHaveLength(6000);
    expect(got[1]).toEqual({ kind: 'heading', text: 'Title' });
  });
});

describe('answers in the document layout are saved and read back like any other', () => {
  const def = interpret(DOC_TOOL);
  const values = { fields: { signed: 'Yes', relation: 'Cooperative', risks: 'Single source; Quality drift' }, tables: { controls: [{ control: 'Backup test', done: 'Yes', rating: '4' }] } };

  it('round-trips a tick, a choice, several ticks and a grid row', () => {
    const back = valuesFromFields(def, fieldsFromValues(def, values));
    expect(back.values).toEqual(values);
    expect(back.unmatched).toEqual([]);
  });
  it('goes into the Excel template and comes back, with the printed column left out', () => {
    const wb = buildWorkbook('Supplier check', def, { values: values.fields, tables: values.tables });
    const read = readWorkbook(def, workbookBytes(wb));
    expect(read.values.fields).toEqual(values.fields);
    expect(read.values.tables.controls).toEqual([{ control: 'Backup test', done: 'Yes', rating: '4' }]);
    const table = def.sections[0].parts[3] as TablePart;
    expect(table.columns.find((c) => c.key === 'owner')!.type).toBe('computed');
  });
});

describe('the AI may improve wording without losing the layout', () => {
  it('puts the reading, grid and displays back on parts the AI kept, and leaves changed parts alone', () => {
    const ai = normaliseDeclarative(JSON.parse(JSON.stringify(DOC_TOOL))).tool!;
    delete ai.layout;
    delete ai.sections[0].reading;
    for (const p of ai.sections[0].parts) { if (p.kind === 'field') delete p.display; else { delete p.grid; p.columns.forEach((c) => delete c.display); } }
    // the AI turned the relationship question into free text, and dropped the table the reading sat before
    (ai.sections[0].parts[1] as { type: string; options?: string[] }).type = 'longtext';
    delete (ai.sections[0].parts[1] as { options?: string[] }).options;
    const table = ai.sections[0].parts.pop()!;
    ai.outputs = ai.outputs!.filter((o) => o.key !== 'avg');
    keepDocumentLayout(ai, DOC_TOOL as unknown as Record<string, unknown>);
    expect(ai.layout).toBe('document');
    expect(ai.sections[0].parts[0]).toMatchObject({ display: 'tick' });
    expect((ai.sections[0].parts[1] as { display?: string }).display).toBeUndefined();
    expect(ai.sections[0].parts[2]).toMatchObject({ display: 'multi' });
    expect(ai.sections[0].reading!.find((b) => b.kind === 'text')).toEqual({ kind: 'text', text: 'Rate each control honestly.' });
    expect(qualityGate(ai).blockers).toEqual([]);
    expect(table.key).toBe('controls');
  });
  it('does nothing to a form that was not built in the document layout', () => {
    const t = normaliseDeclarative(JSON.parse(JSON.stringify(EXAMPLE_TOOL))).tool!;
    const before = JSON.stringify(t);
    keepDocumentLayout(t, { ...EXAMPLE_TOOL } as unknown as Record<string, unknown>);
    expect(JSON.stringify(t)).toBe(before);
  });
});

describe('the side-by-side check on the review screen', () => {
  const item = (o: Partial<Parameters<typeof landedIn>[0]>) => ({ id: 'E1', kind: 'row', text: 't', where: 'Table 1, row 2', status: 'mapped', ...o });
  it('says in plain words where each document item is in the form', () => {
    expect(landedIn(item({ target: 'field:signed' }), DOC_TOOL)).toBe('Question: Contract is signed');
    expect(landedIn(item({ target: 'table:controls' }), DOC_TOOL)).toBe('Table: Controls');
    expect(landedIn(item({ target: 'option:relation' }), DOC_TOOL)).toBe('An option of “Relationship”');
    expect(landedIn(item({ target: 'reading:checks' }), DOC_TOOL)).toBe('Reading shown in the step “Checks”');
    expect(landedIn(item({ target: 'section:checks' }), DOC_TOOL)).toBe('Step title: Checks');
  });
  it('flags an item that is not in the form, and gives the reason for one left out', () => {
    expect(landedIn(item({ status: 'not-covered' }), DOC_TOOL)).toBe('Not in the form yet');
    expect(landedIn(item({ status: 'excluded', note: 'Cover page' }), DOC_TOOL)).toBe('Left out on purpose: Cover page');
  });
});

describe('AI help on a form in the document layout', () => {
  const def = interpret(DOC_TOOL);
  const [tick, radio, multi, table] = def.sections[0].parts;
  const labels = def.sections[0].parts.map((p) => p.label);

  it('tells the AI what each new kind of answer accepts', () => {
    expect(describePart(1, tick)).toContain('choose exactly one of: Yes | No');
    expect(describePart(2, radio)).toContain('choose exactly one of: Transactional | Cooperative');
    expect(describePart(3, multi)).toContain('choose every one that applies, joined by "; ", only from: Single source | Long lead time | Quality drift');
    const t = describePart(4, table);
    expect(t).toContain('Exactly one row for each of: "Access review", "Backup test"');
    // the printed column is not something to draft
    expect(t).not.toContain('"owner"');
  });
  it('keeps only answers the form can show: a tick, one option, listed options in the form order, and the table rows', () => {
    const reply = JSON.stringify({
      fields: [
        { label: 'Contract is signed', value: 'yes' },
        { label: 'Relationship', value: 'Friendly' },
        { label: 'Risks that apply', value: 'Quality drift, single source; Currency risk' },
      ],
      tables: [{ label: 'Controls', rows: [{ control: 'Backup test', done: 'Yes', rating: '4', owner: 'Someone' }] }],
    });
    const got = parseGenerated(reply, labels, def);
    expect(got.get('Contract is signed')).toBe('Yes');
    expect(got.has('Relationship')).toBe(false);
    expect(got.get('Risks that apply')).toBe('Single source; Quality drift');
    expect(JSON.parse(got.get('Controls')!)).toEqual([{ control: 'Backup test', done: 'Yes', rating: '4' }]);
  });
});
