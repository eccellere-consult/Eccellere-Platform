import { describe, expect, it } from 'vitest';
import { getModelDefinition, getModelSample } from '../lib/strategyModels/registry';
import { computeDerived, computeOutputs, evalColumn, tablePartsOf, valuesFromFields } from '../lib/strategyModels/values';
import { BOXES, blockCheck, boxOf, positioningStatement, progressOf, segmentRank, segmentScore, uncovered } from '../lib/strategyModels/defs/execution';
import type { ModelValues, Row } from '../lib/strategyModels/types';

/** The rules the execution models (STP, 9-box, OKRs, First 90 Days) apply to the client's answers — checked directly. */
const def = (id: string) => getModelDefinition(id)!;
const values = (fields: Record<string, string> = {}, tables: Record<string, Row[]> = {}): ModelValues => ({ fields, tables });
const derived = (id: string, v: ModelValues, key: string): string | null => computeDerived(def(id), v).find((d) => d.key === key)!.value;
const tone = (id: string, v: ModelValues, key: string): string | undefined => computeDerived(def(id), v).find((d) => d.key === key)!.tone;
const output = (id: string, v: ModelValues, key: string): string | undefined => computeOutputs(def(id), v).find((o) => o.key === key)?.value;
const column = (id: string, table: string, key: string, row: Row, v: ModelValues = values()): string => {
  const t = tablePartsOf(def(id)).find((x) => x.key === table)!;
  return evalColumn(t.columns.find((c) => c.key === key)!, row, v);
};
const sample = (id: string): ModelValues => { const s = getModelSample(id)!; return { fields: { ...s.values }, tables: { ...s.tables } }; };
const old = (label: string, value: string) => ({ label, value, source: 'Manual' });

describe('STP', () => {
  const seg = (name: string, ...r: string[]): Row => ({ segment: name, size: r[0], growth: r[1], reach: r[2], fit: r[3], room: r[4] });

  it('scores a segment out of 25 only once all five tests are rated', () => {
    expect(segmentScore(seg('A', '4', '4', '4', '5', '3'))).toBe(20);
    expect(segmentScore(seg('A', '4', '4', '4', '5', ''))).toBeNull();
    expect(column('stp', 'segments', 'score', seg('A', '1', '1', '1', '1', '1'))).toBe('5');
    expect(column('stp', 'segments', 'score', seg('A', '1', '1'))).toBe('');
  });

  it('ranks the segments by score, and lets equal scores share a rank', () => {
    const v = values({}, { segments: [seg('A', '5', '5', '5', '5', '5'), seg('B', '4', '4', '4', '4', '4'), seg('C', '4', '4', '4', '4', '4'), seg('D', '1', '1'), seg('', '5', '5', '5', '5', '5')] });
    expect(segmentRank(v.tables.segments[0], v)).toBe('1');
    expect(segmentRank(v.tables.segments[1], v)).toBe('2');
    expect(segmentRank(v.tables.segments[2], v)).toBe('2');        // tied with B
    expect(segmentRank(v.tables.segments[3], v)).toBe('');         // not fully scored
    expect(segmentRank(v.tables.segments[4], v)).toBe('');         // no name: not a segment
    expect(derived('stp', v, 'top')).toBe('A (25 of 25)');
  });

  it('checks that the target follows the scores', () => {
    const base = { segments: [seg('Established OEMs — brackets', '4', '4', '4', '5', '3'), seg('EV start-ups', '2', '5', '3', '4', '5')] };
    expect(derived('stp', values({ target: 'Established OEMs — brackets' }, base), 'target_check')).toBe('The target is the top-scoring segment');
    expect(derived('stp', values({ target: 'established oems' }, base), 'target_check')).toMatch(/top-scoring/);          // matched without regard to case or completeness
    expect(derived('stp', values({ target: 'EV start-ups' }, base), 'target_check')).toBe('The target is not the top-scoring segment — Established OEMs — brackets is');
    expect(tone('stp', values({ target: 'EV start-ups' }, base), 'target_check')).toBe('warn');
    expect(derived('stp', values({}, base), 'target_check')).toBeNull();
  });

  it('puts the positioning statement together from its parts, once four are given', () => {
    const parts = { target_customers: 'OEM sourcing managers', need: 'need brackets that pass first time', category: 'a bracket specialist', benefit: 'cuts rework', alternative: 'general fabricators', reason_to_believe: 'we have the line' };
    expect(positioningStatement(values(parts))).toBe('For OEM sourcing managers who need brackets that pass first time, we are a bracket specialist that cuts rework. Unlike general fabricators, we have the line.');
    expect(positioningStatement(values({ target_customers: 'OEM sourcing managers', need: 'need x', category: 'a y' }))).toBeNull();
    expect(positioningStatement(values({ target_customers: 'A', need: 'b', category: 'c', benefit: 'd' }))).toBe('For A who b, we are c that d. Unlike …, ….');
  });

  it('keeps the old customer type only if it is one of the four, and the old chosen position as typed', () => {
    const r = valuesFromFields(def('stp'), [old('Customer type', 'B2B'), old('Chosen position', 'The bracket partner')]);
    expect(r.values.fields).toEqual({ customer_type: 'B2B', chosen_position: 'The bracket partner' });
    expect(valuesFromFields(def('stp'), [old('Customer type', 'Businesses and consumers')]).unmatched).toHaveLength(1);
  });
});

describe('9-box talent grid', () => {
  it('names all nine boxes from performance and potential', () => {
    const name = (performance: string, potential: string) => boxOf({ performance, potential });
    expect(name('High', 'High')).toBe('Star');
    expect(name('Moderate', 'High')).toBe('Growth employee');
    expect(name('Low', 'High')).toBe('Enigma');
    expect(name('High', 'Moderate')).toBe('High performer');
    expect(name('Moderate', 'Moderate')).toBe('Core player');
    expect(name('Low', 'Moderate')).toBe('Dilemma');
    expect(name('High', 'Low')).toBe('Trusted professional');
    expect(name('Moderate', 'Low')).toBe('Effective');
    expect(name('Low', 'Low')).toBe('Underperformer');
    expect(new Set(Object.values(BOXES).flatMap((r) => Object.values(r))).size).toBe(9);
    expect(name('High', '')).toBe('');
  });

  it('shows the box in the table, counts the grid, and flags top-box people who may leave', () => {
    const v = values({}, { people: [
      { person: 'A', role: 'Engineer', performance: 'High', potential: 'High', retention_risk: 'Low' },
      { person: 'B', performance: 'High', potential: 'Moderate', retention_risk: 'High' },
      { person: 'C', performance: 'Low', potential: 'Low', retention_risk: 'High' },
      { person: 'D', performance: 'Moderate', potential: 'Moderate' },
      { person: 'E', performance: 'Low' },
    ] });
    expect(column('ninebox', 'people', 'box', v.tables.people[0])).toBe('Star');
    expect(derived('ninebox', v, 'distribution')).toBe('Top boxes 2 · Middle 1 · Needs attention 1');   // E is not placed: only one scale given
    expect(derived('ninebox', v, 'stars')).toBe('A');
    expect(derived('ninebox', v, 'at_risk')).toBe('B (High performer)');                               // C is at risk too, but is not in a top box
    expect(tone('ninebox', v, 'at_risk')).toBe('warn');
    expect(output('ninebox', v, 'succession_risks')).toBe('B');
    expect(output('ninebox', v, 'high_potentials')).toBe('A (Engineer)');
    expect(derived('ninebox', values(), 'distribution')).toBeNull();
  });

  it('says there is no succession risk when no top-box person is likely to leave', () => {
    const v = values({}, { people: [{ person: 'A', performance: 'High', potential: 'High', retention_risk: 'Low' }] });
    expect(derived('ninebox', v, 'at_risk')).toBe('None');
    expect(output('ninebox', v, 'succession_risks')).toBeUndefined();
  });
});

describe('OKRs', () => {
  it('works out progress from the start to the target, whichever way the target lies', () => {
    expect(progressOf({ start: '0', target: '10', current: '4' })).toBe(40);
    expect(progressOf({ start: '5.4', target: '3', current: '4.2' })).toBeCloseTo(50, 6);        // a target lower than the start
    expect(progressOf({ start: '0', target: '10', current: '15' })).toBe(100);                      // held at 100
    expect(progressOf({ start: '5', target: '10', current: '3' })).toBe(0);                         // gone backwards: held at 0
    expect(progressOf({ start: '5', target: '5', current: '5' })).toBe(100);
    expect(progressOf({ start: '5', target: '10' })).toBeNull();
    expect(column('okrs', 'krs', 'progress', { kr: 'x', start: '0', target: '8', current: '2' })).toBe('25%');
  });

  it('numbers a key result by its place in the table, and finds the ones with nobody owning a slice', () => {
    const v = values({}, {
      krs: [{ kr: 'Rework', start: '1', target: '2', current: '1.5', confidence: '3' }, { kr: '' }, { kr: 'Contracts', start: '0', target: '2', current: '1', confidence: '2' }],
      kras: [{ person: 'Meena', supports: 'KR 1', kra: 'Daily review' }],
    });
    expect(uncovered(v)).toEqual(['KR 3']);
    expect(derived('okrs', v, 'coverage')).toBe('KR 3 has no individual KRA');
    expect(derived('okrs', v, 'at_risk')).toBe('KR 3: Contracts');
    expect(derived('okrs', v, 'kr_count')).toBe('2 key results');
    expect(tone('okrs', v, 'kr_count')).toBe('warn');                                                   // three to five is the rule
    expect(derived('okrs', v, 'progress')).toBe('50%');
    expect(output('okrs', v, 'key_results')).toBe('KR 1: Rework — 50%\nKR 3: Contracts — 50%');
  });

  it('is quiet about confidence until it is given, and calls three to five key results right', () => {
    const krs = (n: number) => Array.from({ length: n }, (_, i) => ({ kr: `K${i}`, start: '0', target: '1', current: '1' }));
    expect(derived('okrs', values({}, { krs: krs(3) }), 'at_risk')).toBeNull();
    expect(tone('okrs', values({}, { krs: krs(4) }), 'kr_count')).toBe('good');
    expect(tone('okrs', values({}, { krs: krs(6) }), 'kr_count')).toBe('warn');
  });

  it('carries the three answers saved by the earlier version into the first key result and the parent objective', () => {
    const r = valuesFromFields(def('okrs'), [old('Parent objective', 'Grow profitably'), old('Key result', 'Rework under 3%'), old('Owner', 'Quality Head')]);
    expect(r.values.fields.parent_objective).toBe('Grow profitably');
    expect(r.values.tables.krs).toEqual([{ kr: 'Rework under 3%', owner: 'Quality Head' }]);
  });
});

describe('First 90 Days plan', () => {
  it('is ready when a block has one outcome, two or three actions and an owner — and says what is missing first', () => {
    const block = (extra: Row): Row => ({ block: 'Days 1–30', ...extra });
    expect(blockCheck(block({ outcome: 'Offer written', actions: 'a\nb\nc', owner: 'Engineering Head' }))).toBe('Ready');
    expect(blockCheck(block({ actions: 'a', owner: 'x' }))).toBe('Add the outcome');
    expect(blockCheck(block({ outcome: 'o', owner: 'x' }))).toBe('Add the actions');
    expect(blockCheck(block({ outcome: 'o', actions: 'a\nb\nc\nd', owner: 'x' }))).toBe('Too many actions — keep to 2 or 3');
    expect(blockCheck(block({ outcome: 'o', actions: 'a', owner: '' }))).toBe('Add an owner');
    expect(blockCheck(block({}))).toBe('');
  });

  it('counts the blocks ready and says what the others lack', () => {
    const v = values({}, { plan: [
      { block: 'Days 1–30', outcome: 'o', actions: 'a', owner: 'x', status: 'Done' },
      { block: 'Days 31–60', outcome: 'o', actions: 'a', status: 'On track' },
      { block: 'Days 61–90' },
    ] });
    expect(derived('first90', v, 'ready')).toBe('1 of 3');
    expect(derived('first90', v, 'to_fix')).toBe('Days 31–60: add an owner; Days 61–90: empty');
    expect(derived('first90', v, 'progress')).toBe('On track 1 · Done 1');
    expect(derived('first90', values(), 'ready')).toBeNull();
  });

  it('carries the three outcomes saved by the earlier version into their blocks — the old names use a hyphen, the model an en dash', () => {
    const r = valuesFromFields(def('first90'), [old('Days 61-90 outcome', 'Prove it'), old('Days 1-30 outcome', 'Set up'), old('Biggest risk this plan addresses', 'No demand')]);
    expect(r.values.tables.plan).toEqual([{ block: 'Days 1–30', outcome: 'Set up' }, { block: 'Days 61–90', outcome: 'Prove it' }]);
    expect(r.values.fields.risk).toBe('No demand');
    expect(r.unmatched).toEqual([]);
  });
});

describe('the execution worked examples', () => {
  it('give the STP scores and ranks the analysis quotes', () => {
    const v = sample('stp');
    expect(derived('stp', v, 'top')).toBe('Established OEMs — welded and engineered brackets (20 of 25)');
    expect(derived('stp', v, 'target_check')).toBe('The target is the top-scoring segment');
    expect(output('stp', v, 'segments_ranked')).toBe([
      '1. Established OEMs — welded and engineered brackets (20 of 25)',
      '2. EV start-ups — prototype tooling and first production (19 of 25)',
      '3. Established OEMs — high-volume machined parts (18 of 25)',
      '4. Tier-1 suppliers — overflow and job work (14 of 25)',
      '5. Aftermarket and agricultural equipment (12 of 25)',
    ].join('\n'));
    expect(derived('stp', v, 'statement')).toMatch(/^For OEM programme and sourcing managers .* who need welded brackets that pass approval first time/);
    expect(derived('stp', v, 'statement')).toMatch(/Unlike general fabricators and large Tier-1 suppliers, we have the engineering team/);
  });

  it('give the talent-review figures the analysis quotes', () => {
    const v = sample('ninebox');
    expect(derived('ninebox', v, 'distribution')).toBe('Top boxes 3 · Middle 3 · Needs attention 2');
    expect(derived('ninebox', v, 'stars')).toBe('Meena Joshi');
    expect(derived('ninebox', v, 'at_risk')).toBe('Sneha Patil (High performer)');
    expect(derived('ninebox', v, 'attention')).toBe('Anita Rao (Enigma), Suresh Pawar (Underperformer)');
    expect(output('ninebox', v, 'high_potentials')).toBe('Meena Joshi (Quality engineer), Rohit Kulkarni (Line 2 supervisor)');
    expect(output('ninebox', v, 'high_potentials')).toBe(sample('okrs').fields.people_context);       // what the OKRs tool is offered is what its sample quotes
  });

  it('give the OKR figures the analysis quotes', () => {
    const v = sample('okrs');
    expect(derived('okrs', v, 'kr_count')).toBe('4 key results');
    expect(derived('okrs', v, 'progress')).toBe('39%');
    expect(derived('okrs', v, 'at_risk')).toBe('KR 3: Bracket contracts signed with OEMs');
    expect(derived('okrs', v, 'coverage')).toBe('Every key result has someone owning a slice');
    expect(v.tables.krs.map((r) => Math.round(progressOf(r)!))).toEqual([33, 40, 50, 33]);
  });

  it('give the 90-day plan the results the analysis quotes, and use the same price as the financial model', () => {
    const v = sample('first90');
    expect(derived('first90', v, 'ready')).toBe('3 of 3');
    expect(derived('first90', v, 'progress')).toBe('Not started 2 · On track 1');
    expect(output('first90', v, 'outcomes')).toContain('priced at ₹1.5 lakh a job');
    expect(Number(sample('mvfm').fields.unit_price) / 100000).toBe(1.5);
  });
});
