/**
 * declarative.test.ts — tools defined as data: the rule vocabulary, the interpreter (data becomes an ordinary ModelDefinition that the whole
 * engine accepts), the quality gate, and the intake of AI output. Two real tools are used: a weighted decision matrix (Pugh-style scoring) and
 * an impact-effort 2x2 with a board.
 */
import { describe, expect, it } from 'vitest';
import { interpret, normaliseDeclarative, qualityGate, ruleFn, sampleOf, validateDeclarative, type DeclarativeTool, type Rule } from '../lib/strategyModels/declarative';
import { strategyKit } from '../lib/strategyModels/kit';
import { cleanTable, computeDerived, computeOutputs, fieldsFromValues, flattenStructure, renderValuesForPrompt, valuesFromFields } from '../lib/strategyModels/values';
import type { ModelValues } from '../lib/strategyModels/types';

const decisionMatrix: DeclarativeTool = {
  schema: 1, slug: 'weighted-decision-matrix', name: 'Weighted decision matrix', category: 'decision-matrix', stage: 'Decide',
  does: 'Scores each option against weighted criteria so the choice can be defended.',
  whenToUse: 'When several options compete and the criteria matter unequally.',
  reference: { originator: '', year: '', summary: 'Rates every option against criteria that carry different weights and adds up a weighted score for each.', caption: 'The best score is a guide to the choice, not the choice itself.', howToRead: ['List the criteria and give each a weight from 1 to 5.', 'Score every option against every criterion, then read the weighted totals.'] },
  diagram: { template: 'steps', title: 'Weighted decision matrix', steps: [{ name: 'List options' }, { name: 'Weight criteria', hint: '1 = minor, 5 = vital' }, { name: 'Score each option' }, { name: 'Read the totals' }] },
  sections: [
    { key: 'criteria', title: 'Criteria and scores', summary: 'What matters, and how each option does.', parts: [
      { kind: 'field', key: 'decision', label: 'Decision to make', type: 'longtext', help: 'The choice in one sentence, with what you are choosing between.', example: 'Which fix to start with' },
      { kind: 'table', key: 'options', label: 'Options and scores', help: 'One row per option: its weight is in the criterion, its score here.', rowLabel: 'Option', columns: [
        { key: 'option', header: 'Option', help: 'The option being scored.', type: 'text' },
        { key: 'weight', header: 'Weight', help: 'How much the criterion matters (1 low, 5 vital).', type: 'rating', scale: { min: 1, max: 5, low: 'minor', high: 'vital' } },
        { key: 'score', header: 'Score', help: 'How well the option does on it (1 poor, 5 excellent).', type: 'rating', scale: { min: 1, max: 5, low: 'poor', high: 'excellent' } },
        { key: 'points', header: 'Points', help: 'Weight times score.', type: 'computed', rule: { op: 'calc', expr: { mul: [{ cell: 'weight' }, { cell: 'score' }] }, format: 'int' } },
      ], minRows: 3, maxRows: 12 },
      { kind: 'field', key: 'choice', label: 'Chosen option', type: 'text', help: 'The option you will pursue, which may differ from the top score.', example: 'Regulator per torch' },
    ] },
  ],
  derived: [
    { key: 'total', label: 'Total points', rule: { op: 'calc', expr: { agg: 'sum', table: 'options', col: 'weight' }, format: 'int', suffix: ' weight in all' } },
    { key: 'best', label: 'Highest-scoring row', rule: { op: 'top', table: 'options', by: 'score', label: 'option' } },
    { key: 'avg', label: 'Average weighted score', rule: { op: 'weighted', table: 'options', value: 'score', weight: 'weight', format: 'dp1' } },
  ],
  outputs: [{ key: 'chosen', label: 'Chosen option', rule: { op: 'template', text: '{choice}' } }],
  analysisGuide: 'The verdict is the recommended option. Compare the choice with the highest score; if they differ, say whether the reasons given justify it.',
  sample: { scenario: 'Choosing the first fix for the weld rework.', values: { decision: 'Which fix to start with', choice: 'Regulator per torch' }, tables: { options: [{ option: 'Regulator per torch', weight: '5', score: '5' }, { option: 'Flow-meter alarm', weight: '3', score: '4' }, { option: 'Robot cell', weight: '2', score: '2' }] } },
  source: { draftedBy: 'human' },
};

const values: ModelValues = { fields: { decision: 'Which fix to start with', choice: 'Regulator per torch' }, tables: { options: [{ option: 'Regulator per torch', weight: '5', score: '5' }, { option: 'Flow-meter alarm', weight: '3', score: '4' }, { option: 'Robot cell', weight: '2', score: '2' }] } };

describe('the rule vocabulary', () => {
  const v: ModelValues = { fields: { a: '4', b: '2', who: 'Asha' }, tables: { t: [{ n: 'x', p: '3', q: '10' }, { n: 'y', p: '9', q: '30' }, { n: '', p: '' }] } };
  const run = (r: Rule, row?: Record<string, string>) => ruleFn(r)(row, v);
  it('calculates with fields, row cells and aggregates, and stays blank until there is enough input', () => {
    expect(run({ op: 'calc', expr: { div: [{ field: 'a' }, { field: 'b' }] }, format: 'dp1' })).toBe('2');
    expect(run({ op: 'calc', expr: { add: [{ field: 'a' }, { cell: 'k' }] }, format: 'int' }, { k: '3' })).toBe('7');
    expect(run({ op: 'calc', expr: { add: [{ field: 'a' }, { cell: 'k' }] } })).toBeNull(); // no row, no cell
    expect(run({ op: 'calc', expr: { div: [{ field: 'a' }, 0] } })).toBeNull(); // never infinity
    expect(run({ op: 'calc', expr: { agg: 'sum', table: 't', col: 'p' }, format: 'pct' })).toBe('12%');
    expect(run({ op: 'calc', expr: { agg: 'count', table: 't' }, format: 'int' })).toBe('2'); // the empty row is not a row
    expect(run({ op: 'calc', expr: { agg: 'count', table: 't', col: 'n' }, format: 'int' })).toBe('2'); // rows where the column is filled in, words included
    expect(run({ op: 'calc', expr: { agg: 'count', table: 't', col: 'q' }, format: 'int' })).toBe('2');
    expect(run({ op: 'calc', expr: { agg: 'avg', table: 'nope', col: 'p' } })).toBeNull();
    expect(run({ op: 'calc', expr: { sub: [{ field: 'a' }, { field: 'b' }] }, suffix: ' pts' })).toBe('2 pts');
  });
  it('weights, finds the top row, names a quadrant, fills a template and chooses between two sentences', () => {
    expect(run({ op: 'weighted', table: 't', value: 'q', weight: 'p', format: 'dp1' })).toBe('25'); // (3*10 + 9*30) / 12
    expect(run({ op: 'top', table: 't', by: 'q', label: 'n' })).toBe('y');
    const q: Rule = { op: 'quadrant', x: { cell: 'e' }, y: { cell: 'i' }, midX: 5, midY: 5, names: ['Fill-in', 'Avoid', 'Quick win', 'Major project'] }; // order: low x low y, high x low y, low x high y, high x high y
    expect(run(q, { e: '2', i: '9' })).toBe('Quick win');
    expect(run(q, { e: '9', i: '2' })).toBe('Avoid');
    expect(run(q, { e: '9', i: '9' })).toBe('Major project');
    expect(run(q, { e: '5', i: '5' })).toBe('Fill-in'); // the middle counts as low
    expect(run({ op: 'template', text: 'Owner {who}, target {a}' })).toBe('Owner Asha, target 4');
    expect(run({ op: 'template', text: 'Owner {missing}' })).toBeNull();
    expect(run({ op: 'when', expr: { field: 'a' }, gt: 3, then: 'High', else: 'Low' })).toBe('High');
    expect(run({ op: 'when', expr: { field: 'b' }, gt: 3, then: 'High', else: 'Low' })).toBe('Low');
  });
});

describe('interpreting a declarative tool', () => {
  const def = interpret(decisionMatrix);
  it('gives the engine an ordinary definition', () => {
    expect(def.toolId).toBe('weighted-decision-matrix');
    expect(def.sections[0].parts.map((p) => p.key)).toEqual(['decision', 'options', 'choice']);
    expect(flattenStructure(def).map((f) => f.label)).toEqual(['Decision to make', 'Options and scores', 'Chosen option']);
  });
  it('computes the columns, the results at a glance and the outputs from rules', () => {
    expect(computeDerived(def, values).map((d) => d.value)).toEqual(['10 weight in all', 'Regulator per torch', '4.1']);
    expect(computeOutputs(def, values)).toEqual([{ key: 'chosen', label: 'Chosen option', value: 'Regulator per torch' }]);
    const points = (def.sections[0].parts[1] as { columns: { key: string; compute?: (r: Record<string, string>, v: ModelValues) => string }[] }).columns.find((c) => c.key === 'points')!;
    expect(points.compute!({ weight: '5', score: '5' }, values)).toBe('25');
    expect(points.compute!({ weight: '5' }, values)).toBe('');
  });
  it('is saved, read back, put through the Excel template and shown to the AI like any definition', () => {
    const saved = fieldsFromValues(def, values);
    expect(valuesFromFields(def, saved).values.tables.options).toEqual(cleanTable(def.sections[0].parts[1] as never, values.tables.options));
    const kit = strategyKit({ toolId: def.toolId, name: 'Weighted decision matrix', structure: def });
    expect(kit.fromContent(kit.toContent(values), []).tables.options).toHaveLength(3);
    const prompt = renderValuesForPrompt(def, values);
    expect(prompt).toContain('| Regulator per torch | 5 | 5 | 25 |');
    expect(prompt).toContain('Highest-scoring row: Regulator per torch');
  });
  it('offers its worked example, if it has one', () => {
    expect(sampleOf(decisionMatrix)?.scenario).toMatch(/weld rework/);
    expect(sampleOf({ ...decisionMatrix, sample: undefined })).toBeNull();
  });
  it('builds a board from its spec, with the columns generated', () => {
    const grid: DeclarativeTool = { ...decisionMatrix, slug: 'impact-effort', name: 'Impact-effort grid', sections: [{ key: 's', title: 'Fixes', summary: 'Place each fix.', parts: [
      { kind: 'table', key: 'fixes', label: 'Fixes', help: 'Place each fix by impact and effort.', rowLabel: 'Fix', columns: [], board: { spec: { layout: 'grid', noteLabel: 'fix', noteColumn: 'fix', xColumn: 'effort', yColumn: 'impact', axes: { x: { label: 'Effort', low: 'easy', high: 'hard' }, y: { label: 'Impact', low: 'small', high: 'large' } }, quadrants: [{ name: 'Quick win', xHigh: false, yHigh: true }, { name: 'Major project', xHigh: true, yHigh: true }, { name: 'Fill-in', xHigh: false, yHigh: false }, { name: 'Avoid', xHigh: true, yHigh: false }], maxNoteChars: 120 }, scale: { min: 1, max: 10 } } },
    ] }], derived: [], outputs: [{ key: 'count', label: 'Number of fixes', rule: { op: 'calc', expr: { agg: 'count', table: 'fixes' }, format: 'int' } }], sample: undefined };
    const d = interpret(grid);
    const t = d.sections[0].parts[0] as { board?: unknown; columns: { key: string }[] };
    expect(t.board).toBeTruthy();
    expect(t.columns.map((c) => c.key)).toEqual(['fix', 'effort', 'impact']);
    expect(qualityGate(grid).ok).toBe(true);
  });
});

describe('the quality gate', () => {
  it('passes a complete tool, with only warnings', () => {
    const g = qualityGate(decisionMatrix);
    expect(g.blockers).toEqual([]);
    expect(g.ok).toBe(true);
    expect(g.warnings.join(' ')).toMatch(/originator/);
  });
  it('blocks what would break a page or hide a wrong answer', () => {
    const bad = JSON.parse(JSON.stringify(decisionMatrix)) as DeclarativeTool;
    bad.slug = 'Weighted Matrix';
    bad.sections[0].parts[0].help = 'short';
    (bad.sections[0].parts[1] as { columns: { rule?: Rule }[] }).columns[3].rule = { op: 'calc', expr: { mul: [{ cell: 'weight' }, { cell: 'nope' }] } };
    bad.derived = [{ key: 'x', label: 'x', rule: { op: 'calc', expr: { agg: 'sum', table: 'ghost', col: 'p' } } }];
    bad.outputs = [];
    bad.diagram = { template: 'steps', title: 't', steps: [{ name: 'only one' }] };
    bad.sample = { scenario: 's', values: { nope: 'x' }, tables: { ghost: [] } };
    const msgs = qualityGate(bad).blockers.join('\n');
    for (const m of [/slug must be kebab-case/, /help needs more than 10/, /unknown column nope/, /unknown table ghost/, /at least one output/, /needs 3 to 8 steps/, /unknown field nope/, /unknown table ghost/]) expect(msgs).toMatch(m);
    expect(qualityGate(bad).ok).toBe(false);
  });
  it('refuses a duplicate key, a fixed table whose first column is not text, and a placeholder in the sample', () => {
    const bad = JSON.parse(JSON.stringify(decisionMatrix)) as DeclarativeTool;
    (bad.sections[0].parts[1] as { key: string; fixedRows?: string[]; columns: { type: string }[] }).key = 'decision';
    (bad.sections[0].parts[1] as { fixedRows?: string[] }).fixedRows = ['A', 'B'];
    (bad.sections[0].parts[1] as { columns: { type: string }[] }).columns[0].type = 'rating';
    bad.sample!.scenario = 'TBD';
    const msgs = validateDeclarative(bad).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/duplicate key decision/);
    expect(msgs).toMatch(/first column of a fixed table must be text/);
    expect(msgs).toMatch(/placeholder/);
  });
});

describe('taking in what an AI wrote', () => {
  it('rejects a reply that is not an object', () => {
    expect(normaliseDeclarative('nope').tool).toBeNull();
    expect(normaliseDeclarative([]).issues[0].message).toMatch(/not a JSON object/);
  });
  it('cleans keys and strings, coerces the category, drops unknown properties and never invents an originator', () => {
    const { tool, issues } = normaliseDeclarative({
      name: '  5 Whys  ', category: 'Analytical thinking', does: 'Asks why five times to reach a cause.', whenToUse: 'When a problem keeps coming back.', analysisGuide: 'The verdict is the root cause, stated as a system gap rather than a person.', evil: '<script>',
      reference: { summary: 'Asks why repeatedly until a root cause that can be fixed is reached.', caption: 'Stop when the answer is a system.', howToRead: ['Ask why.', 'Repeat.'] },
      sections: [{ title: 'The chain', summary: 'Why one to five.', parts: [{ kind: 'field', label: '5 Why answers', type: 'weird', help: 'Each answer in your own words.' }, { kind: 'field', label: '5 Why answers', type: 'text', help: 'A second field with the same label.' }] }],
      outputs: [{ label: 'Root cause', rule: { op: 'template', text: '{k_5_why_answers}' } }],
    });
    expect(tool!.slug).toBe('5-whys');
    expect(tool!.category).toBe('other');
    expect(tool!.reference.originator).toBe('');
    expect((tool as unknown as Record<string, unknown>).evil).toBeUndefined();
    const keys = tool!.sections[0].parts.map((p) => p.key);
    expect(keys).toEqual(['k_5_why_answers', 'k_5_why_answers_2']);
    expect(tool!.sections[0].parts[0]).toMatchObject({ type: 'text' });
    expect(issues.some((i) => i.level === 'warn' && i.path === 'category')).toBe(true);
    expect(issues.some((i) => i.level === 'error' && /duplicate label/.test(i.message))).toBe(true);
  });
  it('flags a slug that is already taken', () => {
    const r = normaliseDeclarative(JSON.parse(JSON.stringify(decisionMatrix)), { existingSlugs: ['weighted-decision-matrix'] });
    expect(r.issues.some((i) => /already exists/.test(i.message))).toBe(true);
  });
  it('round-trips a valid tool without change to its meaning', () => {
    const r = normaliseDeclarative(JSON.parse(JSON.stringify(decisionMatrix)));
    expect(r.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(interpret(r.tool!).sections[0].parts.map((p) => p.key)).toEqual(['decision', 'options', 'choice']);
  });
});
