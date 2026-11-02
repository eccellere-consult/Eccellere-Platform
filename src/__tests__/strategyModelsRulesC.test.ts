import { describe, expect, it } from 'vitest';
import { getModelDefinition, getModelSample } from '../lib/strategyModels/registry';
import { computeDerived, computeOutputs, evalColumn, tablePartsOf, valuesFromFields } from '../lib/strategyModels/values';
import { busiest, gapToTarget, isMeasurable, kpiChange, ladder, movement, nameList, perspectiveStatus, raciCheck, strategyStatus, unsupportedGoals } from '../lib/strategyModels/defs/operating';
import type { ModelValues, Row } from '../lib/strategyModels/types';

/** The rules the operating models apply to the client's answers — checked directly, so a rule cannot drift from the model it implements. */
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

const STAGES = ['Prompt marketplace', 'Prompt workflows', 'skill.md', 'Event and schedule connections', 'Flow orchestration', 'Autonomous operation', 'Coded agents'];
const ladderOf = (...statuses: string[]): ModelValues => values({}, { stages: STAGES.map((stage, i) => ({ stage, status: statuses[i] ?? 'Not started' })) });

describe('7-Stage Agentic AI Maturity Model', () => {
  it('is the highest rung with every rung up to it in regular use', () => {
    expect(ladder(ladderOf('In regular use', 'Embedded in the process', 'In regular use'))!.current).toBe(3);
    expect(ladder(ladderOf('In regular use'))!.current).toBe(1);
    expect(ladder(ladderOf('Trying it'))!.current).toBe(0);               // a trial is not a rung reached
    expect(derived('agenticai', ladderOf('Trying it'), 'current')).toBe('Not yet at Stage 1');
    expect(derived('agenticai', ladderOf('In regular use', 'Trying it'), 'next')).toBe('Stage 2 — Prompt workflows');
  });

  it('says nothing until a status has been given', () => {
    expect(ladder(values())).toBeNull();
    expect(derived('agenticai', values(), 'current')).toBeNull();
  });

  it('flags a rung in use above a gap, and names the gap', () => {
    const v = ladderOf('In regular use', 'In regular use', 'Not started', 'Not started', 'Not started', 'In regular use');
    expect(ladder(v)!.current).toBe(2);
    expect(ladder(v)!.above).toEqual([6]);
    expect(derived('agenticai', v, 'skipped')).toBe('Autonomous operation in use without skill.md');
    expect(tone('agenticai', v, 'skipped')).toBe('warn');
    expect(derived('agenticai', ladderOf('In regular use', 'In regular use'), 'skipped')).toMatch(/^None/);
  });

  it('measures the distance to the target, and knows when it has been reached', () => {
    const at = (current: string[], target: string) => ({ ...ladderOf(...current), fields: { target_stage: target } });
    expect(gapToTarget(at(['In regular use'], 'Event and schedule connections'))).toEqual({ text: '3 stages to go, from Stage 1 to Stage 4', tone: 'warn' });
    expect(gapToTarget(at(['In regular use'], 'Prompt workflows'))).toEqual({ text: '1 stage to go, from Stage 1 to Stage 2', tone: 'neutral' });
    expect(gapToTarget(at(['Trying it'], 'Prompt workflows'))!.text).toBe('2 stages to go, from the start to Stage 2');
    expect(gapToTarget(at(['In regular use', 'In regular use'], 'Prompt workflows'))!.tone).toBe('good');
    expect(gapToTarget(ladderOf('In regular use'))).toBeNull();           // no target chosen
  });

  it('shows on each row whether the rung has been reached', () => {
    expect(column('agenticai', 'stages', 'reached', { stage: 'skill.md', status: 'Embedded in the process' })).toBe('Reached');
    expect(column('agenticai', 'stages', 'reached', { stage: 'skill.md', status: 'Trying it' })).toBe('In trial');
    expect(column('agenticai', 'stages', 'reached', { stage: 'skill.md', status: 'Not started' })).toBe('');
  });

  it('carries the Value Scan answer into the usage field, and keeps the target-stage answer only if it is a stage', () => {
    const r = valuesFromFields(def('agenticai'), [old('Current AI usage (Value Scan)', 'Ad-hoc ChatGPT use, no workflows'), old('Target stage', 'Stage 4')]);
    expect(r.values.fields.current_usage).toBe('Ad-hoc ChatGPT use, no workflows');
    expect(r.values.fields.target_stage).toBeUndefined();
    expect(r.unmatched.map((f) => f.label)).toEqual(['Target stage']);   // "Stage 4" is not one of the seven names: kept visible
    expect(valuesFromFields(def('agenticai'), [old('Target stage', 'flow orchestration')]).values.fields.target_stage).toBe('Flow orchestration');
  });
});

describe('McKinsey 7S', () => {
  const rated = (...a: string[]): ModelValues => values({}, { elements: ['Strategy', 'Structure', 'Systems', 'Shared values', 'Skills', 'Style', 'Staff'].map((element, i) => ({ element, alignment: a[i] ?? '' })) });

  it('counts the alignment, and splits it into hard and soft', () => {
    const v = rated('Aligned', 'Misaligned', 'Partially aligned', 'Partially aligned', 'Aligned', 'Misaligned', 'Aligned');
    expect(derived('sevens', v, 'counts')).toBe('Aligned 3 · Partly 2 · Misaligned 2');
    expect(derived('sevens', v, 'hard_soft')).toBe('Hard S’s 1 of 3 aligned · Soft S’s 2 of 4 aligned');
    expect(derived('sevens', v, 'misaligned')).toBe('Structure, Style');
    expect(derived('sevens', rated('Aligned', 'Aligned'), 'misaligned')).toBe('None misaligned');
    expect(derived('sevens', values(), 'counts')).toBeNull();
  });

  it('reads the centre — shared values — on its own', () => {
    expect(derived('sevens', rated('', '', '', 'Misaligned'), 'centre')).toBe('Misaligned');
    expect(tone('sevens', rated('', '', '', 'Misaligned'), 'centre')).toBe('bad');
    expect(tone('sevens', rated('', '', '', 'Aligned'), 'centre')).toBe('good');
    expect(derived('sevens', rated('Aligned'), 'centre')).toBeNull();
  });

  it('tells hard elements from soft ones in the table', () => {
    expect(column('sevens', 'elements', 'kind', { element: 'Systems' })).toBe('Hard');
    expect(column('sevens', 'elements', 'kind', { element: 'Style' })).toBe('Soft');
    expect(column('sevens', 'elements', 'kind', { element: 'Shared values' })).toBe('Soft');
  });

  it('lists what is out of line, with what would change, for the RACI chart to build on', () => {
    const v = values({}, { elements: [
      { element: 'Structure', alignment: 'Misaligned', change: 'Add plant managers', today: 'Flat' },
      { element: 'Skills', alignment: 'Partially aligned' },
      { element: 'Strategy', alignment: 'Aligned' },
    ] });
    expect(output('sevens', v, 'misfits')).toBe('Structure (misaligned): Add plant managers; Skills (partly aligned)');
    expect(output('sevens', v, 'ownership_issues')).toBe('Structure: Flat — change: Add plant managers');
    expect(output('sevens', rated('Aligned', 'Aligned'), 'misfits')).toBeUndefined();
  });

  it('carries the seven answers saved by the earlier version into the table’s “today” column', () => {
    const r = valuesFromFields(def('sevens'), [old('Structure', 'Flat org'), old('Shared values', 'Quality first'), old('Employee count band', '51–100'), old('Staff', 'Thin bench')]);
    expect(r.values.tables.elements).toEqual([
      { element: 'Structure', today: 'Flat org' },
      { element: 'Shared values', today: 'Quality first' },
      { element: 'Staff', today: 'Thin bench' },
    ]);
    expect(r.values.fields.size_band).toBe('51–100');
    expect(r.unmatched).toEqual([]);
  });
});

describe('RACI matrix', () => {
  it('counts the names in a cell: commas, slashes, “and” and ampersands separate people', () => {
    expect(nameList('Sales Head, MD')).toEqual(['Sales Head', 'MD']);
    expect(nameList('Sales Head and Quality Head')).toEqual(['Sales Head', 'Quality Head']);
    expect(nameList('Ops / Finance & HR; Plant')).toEqual(['Ops', 'Finance', 'HR', 'Plant']);
    expect(nameList('  ')).toEqual([]);
    expect(nameList(undefined)).toEqual([]);
    expect(nameList('Brand Manager')).toEqual(['Brand Manager']);          // “and” inside a word is not a separator
  });

  it('applies the one rule: exactly one accountable, and somebody who does the work', () => {
    const r = (accountable: string, responsible = 'Sales Head') => raciCheck({ decision: 'Approve a price change', responsible, accountable });
    expect(r('Managing Director')).toBe('One owner');
    expect(r('')).toBe('No one accountable');
    expect(r('MD, Finance Head')).toBe('More than one accountable');
    expect(r('Managing Director', '')).toBe('Nobody does the work');
    expect(r('Finance Head', 'Finance Head')).toBe('One owner');            // the accountable person may also do the work
    expect(raciCheck({ responsible: 'Sales', accountable: 'MD' })).toBe(''); // no decision named: nothing to check
  });

  it('shows the check in the table and counts the decisions with one clear owner', () => {
    const v = values({}, { decisions: [
      { decision: 'A', responsible: 'x', accountable: 'MD' },
      { decision: 'B', responsible: 'x', accountable: '' },
      { decision: 'C', responsible: 'x', accountable: 'MD, Finance' },
      { decision: '', responsible: 'x', accountable: '' },
    ] });
    expect(column('raci', 'decisions', 'check', v.tables.decisions[1])).toBe('No one accountable');
    expect(derived('raci', v, 'clear')).toBe('1 of 3');
    expect(derived('raci', v, 'problems')).toBe('B (no one accountable); C (more than one accountable)');
    expect(tone('raci', v, 'clear')).toBe('warn');
    expect(derived('raci', values(), 'clear')).toBeNull();
  });

  it('finds the person accountable for most decisions — a bottleneck at half or more of four or more', () => {
    const rows = (...owners: string[]): ModelValues => values({}, { decisions: owners.map((accountable, i) => ({ decision: `D${i}`, responsible: 'x', accountable })) });
    expect(busiest(rows('MD', 'MD', 'Finance', 'Ops'))).toEqual({ name: 'MD', count: 2, total: 4 });
    expect(tone('raci', rows('MD', 'MD', 'Finance', 'Ops'), 'load')).toBe('warn');
    expect(tone('raci', rows('MD', 'Finance', 'Ops', 'HR'), 'load')).toBe('good');
    expect(tone('raci', rows('MD', 'MD'), 'load')).toBe('good');             // too few decisions to call it a bottleneck
    expect(busiest(rows('md', 'MD', 'Ops'))!.count).toBe(2);                  // names are matched without regard to case
    expect(busiest(rows('MD, Finance', ''))).toBeNull();                      // only a single clear owner counts
  });

  it('carries the five answers saved by the earlier version into the first decision row', () => {
    const r = valuesFromFields(def('raci'), [
      old('Decision in question', 'Approve a discount'), old('Responsible (does the work)', 'Sales Head'),
      old('Accountable (owns the outcome — exactly one name)', 'MD'), old('Consulted (input sought before deciding)', 'Finance'), old('Informed (told after the decision)', 'Plant'),
    ]);
    expect(r.values.tables.decisions).toEqual([{ decision: 'Approve a discount', responsible: 'Sales Head', accountable: 'MD', consulted: 'Finance', informed: 'Plant' }]);
    expect(r.unmatched).toEqual([]);
  });
});

describe('Balanced Scorecard', () => {
  it('needs an objective, a measure and a target for a perspective to be complete — and says what is missing first', () => {
    expect(perspectiveStatus({ objectives: 'Grow', measures: 'Revenue', targets: '₹100 lakh' })).toBe('Complete');
    expect(perspectiveStatus({ objectives: 'Grow', measures: 'Revenue' })).toBe('Add a target');
    expect(perspectiveStatus({ objectives: 'Grow' })).toBe('Add a measure');
    expect(perspectiveStatus({ measures: 'Revenue' })).toBe('Add an objective');
    expect(perspectiveStatus({})).toBe('');
  });

  it('counts the perspectives complete, names those still to do, and the objectives in all', () => {
    const v = values({}, { perspectives: [
      { perspective: 'Financial', objectives: 'Grow\nCollect', measures: 'Revenue\nDebtor days', targets: '100\n60' },
      { perspective: 'Customer', objectives: 'Delight', measures: 'OTIF' },
    ] });
    expect(derived('bsc', v, 'complete')).toBe('1 of 4');
    expect(derived('bsc', v, 'needs')).toBe('Customer, Internal process, Learning and growth');
    expect(derived('bsc', v, 'objective_count')).toBe('3 objectives');
    expect(derived('bsc', values(), 'complete')).toBeNull();
  });

  it('pairs each measure with its target, line by line, for the next tool', () => {
    const v = values({}, { perspectives: [{ perspective: 'Financial', objectives: 'Grow', measures: 'Revenue\nDebtor days', targets: '₹100 lakh' }] });
    expect(output('bsc', v, 'measures_targets')).toBe('Financial: Revenue → ₹100 lakh; Debtor days');
    expect(output('bsc', v, 'objectives')).toBe('Financial: Grow');
  });

  it('carries the two objectives saved by the earlier version into their perspectives', () => {
    const r = valuesFromFields(def('bsc'), [old('Customer objective', 'Win OEMs'), old('Financial objective', 'Grow')]);
    expect(r.values.tables.perspectives).toEqual([{ perspective: 'Financial', objectives: 'Grow' }, { perspective: 'Customer', objectives: 'Win OEMs' }]);
  });
});

describe('OGSM', () => {
  it('calls a goal measurable only when it carries a number', () => {
    expect(isMeasurable({ goal: 'Revenue', target: '₹14,385 lakh' })).toBe(true);
    expect(isMeasurable({ goal: 'Be the best', target: 'Market leader' })).toBe(false);
    expect(isMeasurable({ goal: 'Reach 92% OTIF', target: '' })).toBe(true);
    expect(column('ogsm', 'goals', 'measurable', { goal: 'Be the best', target: 'Leader' })).toBe('Add a number');
    expect(column('ogsm', 'goals', 'measurable', { goal: '' })).toBe('');
  });

  it('numbers a goal by its place in the table, so “Goal 2” is always the second row — even with a blank row before it', () => {
    const v = values({}, {
      goals: [{ goal: 'Revenue', target: '100' }, { goal: '' }, { goal: 'Margin', target: '16%' }],
      strategies: [{ strategy: 'Grow brackets', supports: 'Goal 1', measure: 'm', target: 't', owner: 'o' }],
    });
    expect(unsupportedGoals(v)).toEqual(['Goal 3']);
    expect(output('ogsm', v, 'goals')).toBe('Goal 1: Revenue — 100\nGoal 3: Margin — 16%');
    expect(derived('ogsm', v, 'unsupported')).toBe('Goal 3');
  });

  it('wants a measure, a target and an owner for every strategy', () => {
    expect(strategyStatus({ strategy: 'x', measure: 'm', target: 't', owner: 'o' })).toBe('Complete');
    expect(strategyStatus({ strategy: 'x', target: 't', owner: 'o' })).toBe('Add a measure');
    expect(strategyStatus({ strategy: 'x', measure: 'm', owner: 'o' })).toBe('Add a target');
    expect(strategyStatus({ strategy: 'x', measure: 'm', target: 't' })).toBe('Add an owner');
    expect(strategyStatus({ measure: 'm' })).toBe('');
    expect(derived('ogsm', values({}, { strategies: [{ strategy: 'x' }, { strategy: 'y', measure: 'm', target: 't', owner: 'o' }] }), 'unmeasured')).toBe('1 strategy without a measure, target or owner');
  });

  it('keeps it to one page: two to six goals and two to eight strategies', () => {
    const goals = (n: number) => Array.from({ length: n }, (_, i) => ({ goal: `G${i}`, target: '1' }));
    const strategies = (n: number) => Array.from({ length: n }, (_, i) => ({ strategy: `S${i}` }));
    expect(tone('ogsm', values({}, { goals: goals(4), strategies: strategies(5) }), 'counts')).toBe('good');
    expect(tone('ogsm', values({}, { goals: goals(1), strategies: strategies(5) }), 'counts')).toBe('warn');
    expect(derived('ogsm', values({}, { goals: goals(1), strategies: strategies(1) }), 'counts')).toBe('1 goal · 1 strategy');
  });

  it('carries the old “Top objective” into the objective', () => {
    expect(valuesFromFields(def('ogsm'), [old('Top objective', 'Lead the market')]).values.fields.objective).toBe('Lead the market');
  });
});

describe('Startup KPI Tracker', () => {
  it('reads the movement against last week, and whether it is the right way', () => {
    expect(movement({ this_week: '8', last_week: '6', good: 'Up is good' })).toEqual({ pct: expect.closeTo(33.33, 1), better: true });
    expect(movement({ this_week: '5.4', last_week: '5.1', good: 'Down is good' })!.better).toBe(false);
    expect(movement({ this_week: '71', last_week: '72', good: 'Down is good' })!.better).toBe(true);
    expect(movement({ this_week: '8', last_week: '6' })!.better).toBe(true);                // no direction given: up is taken as good
    expect(movement({ this_week: '8' })).toBeNull();
    expect(movement({ this_week: '5', last_week: '0', good: 'Up is good' })).toEqual({ pct: 100, better: true });
    expect(movement({ this_week: '0', last_week: '0' })).toEqual({ pct: 0, better: true });
  });

  it('describes the movement in words', () => {
    expect(kpiChange({ this_week: '8', last_week: '6', good: 'Up is good' })).toBe('Up 33% — better');
    expect(kpiChange({ this_week: '5.4', last_week: '5.1', good: 'Down is good' })).toBe('Up 6% — worse');
    expect(kpiChange({ this_week: '71', last_week: '71.1', good: 'Down is good' })).toBe('Flat');
    expect(kpiChange({ this_week: '3' })).toBe('');
    expect(column('startupkpis', 'kpis', 'change', { metric: 'RFQs', this_week: '8', last_week: '6', good: 'Up is good' })).toBe('Up 33% — better');
  });

  it('counts how many metrics are moving the right way, and names the ones going wrong', () => {
    const v = values({}, { kpis: [
      { metric: 'RFQs', this_week: '8', last_week: '6', good: 'Up is good' },
      { metric: 'Rework', this_week: '5.4', last_week: '5.1', good: 'Down is good' },
      { metric: 'Debtor days', this_week: '71', last_week: '72', good: 'Down is good' },
      { metric: 'Unfinished', this_week: '4' },
    ] });
    expect(derived('startupkpis', v, 'moving')).toBe('2 of 3');
    expect(derived('startupkpis', v, 'worst')).toBe('Rework (up 6%)');
    expect(tone('startupkpis', v, 'moving')).toBe('good');                                  // two of three is 60% or more
    const half = (a: string, b: string) => values({}, { kpis: [{ metric: 'A', this_week: '8', last_week: '6', good: 'Up is good' }, { metric: 'B', this_week: a, last_week: b, good: 'Up is good' }] });
    expect(tone('startupkpis', half('4', '6'), 'moving')).toBe('warn');                      // one of two
    expect(tone('startupkpis', values({}, { kpis: [{ metric: 'A', this_week: '4', last_week: '6', good: 'Up is good' }] }), 'moving')).toBe('bad');
    expect(derived('startupkpis', values({}, { kpis: [{ metric: 'RFQs', this_week: '8', last_week: '6', good: 'Up is good' }] }), 'worst')).toBe('None — nothing moved the wrong way');
    expect(derived('startupkpis', values(), 'moving')).toBeNull();
  });

  it('carries the three metrics saved by the earlier version into the first three rows, and keeps the cadence', () => {
    const r = valuesFromFields(def('startupkpis'), [old('Metric 2', 'Orders'), old('Metric 1', 'Leads'), old('Metric 3', 'Cash'), old('Review cadence', 'Weekly')]);
    expect(r.values.tables.kpis).toEqual([{ metric: 'Leads' }, { metric: 'Orders' }, { metric: 'Cash' }]);
    expect(r.values.fields.cadence).toBe('Weekly');
    expect(r.unmatched).toEqual([]);
  });
});

describe('the operating worked examples', () => {
  it('place Anand on the ladder where the analysis says', () => {
    const v = sample('agenticai');
    expect(derived('agenticai', v, 'current')).toBe('Stage 1 — Prompt marketplace');
    expect(derived('agenticai', v, 'gap')).toBe('3 stages to go, from Stage 1 to Stage 4');
    expect(derived('agenticai', v, 'in_use')).toBe('1 of 7');
    expect(output('agenticai', v, 'ai_summary')).toBe(sample('sevens').fields.ai_position);       // what the next tools are shown is what the 7S sample quotes
    expect(output('agenticai', v, 'ai_summary')).toBe(sample('bsc').fields.ai_readiness);
    expect(9800 / 365).toBeCloseTo(26.85, 1);                                                      // “each day of debtor days is about ₹27 lakh”
  });

  it('give the 7S counts the analysis quotes', () => {
    const v = sample('sevens');
    expect(derived('sevens', v, 'counts')).toBe('Aligned 1 · Partly 4 · Misaligned 2');
    expect(derived('sevens', v, 'hard_soft')).toBe('Hard S’s 1 of 3 aligned · Soft S’s 0 of 4 aligned');
    expect(derived('sevens', v, 'misaligned')).toBe('Structure, Style');
    expect(derived('sevens', v, 'centre')).toBe('Partially aligned');
  });

  it('give the RACI figures the analysis quotes', () => {
    const v = sample('raci');
    expect(derived('raci', v, 'clear')).toBe('7 of 9');
    expect(derived('raci', v, 'load')).toBe('Managing Director: 3 of 7 decisions');
    expect(derived('raci', v, 'problems')).toBe('Accept a customer return or debit note (more than one accountable); Hire or replace a supervisor (no one accountable)');
    const consultedFinance = v.tables.decisions.filter((r) => nameList(r.consulted).includes('Finance Head')).length;
    expect(consultedFinance).toBe(4);                                                              // “consulted on four of the nine decisions”
    const accountableFinance = v.tables.decisions.filter((r) => nameList(r.accountable).length === 1 && nameList(r.accountable)[0] === 'Finance Head').length;
    expect(accountableFinance).toBe(2);
  });

  it('give the scorecard, plan and weekly numbers the figures the analyses quote', () => {
    const b = sample('bsc');
    expect(derived('bsc', b, 'complete')).toBe('4 of 4');
    expect(derived('bsc', b, 'objective_count')).toBe('8 objectives');
    expect(output('bsc', b, 'scorecard_status')).toBe('4 of 4 perspectives complete');
    const o = sample('ogsm');
    expect(derived('ogsm', o, 'counts')).toBe('4 goals · 5 strategies');
    expect(derived('ogsm', o, 'unsupported')).toMatch(/^None/);
    expect(derived('ogsm', o, 'unmeasured')).toMatch(/^None/);
    const k = sample('startupkpis');
    expect(derived('startupkpis', k, 'moving')).toBe('4 of 5');
    expect(derived('startupkpis', k, 'worst')).toBe('Line 2 rework (%) (up 6%)');
    expect(derived('startupkpis', k, 'path')).toBe('Acquisition · Activation · Retention · Cash or operations · Revenue');
  });

  it('use the same numbers as the financial model they build on', () => {
    const goals = sample('ogsm').tables.goals.map((g) => `${g.goal}: ${g.target}`);
    expect(goals).toContain('Revenue: ₹14,385 lakh');                                              // the Year 3 revenue of the three-statement model
    expect(goals).toContain('EBITDA margin: 16.5%');
    expect(goals).toContain('Debtor days: 60 days');
    const financial = computeOutputs(def('financial'), sample('financial')).find((x) => x.key === 'summary')!.value;
    expect(financial).toBe(sample('bsc').fields.financial_plan);                                   // the scorecard quotes the model's own summary
  });
});
