import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { SCENARIO_PLANNER } from '@/lib/agents/pilots/scenarioPlanner';

const def = interpret(SCENARIO_PLANNER);
const sample = sampleOf(SCENARIO_PLANNER)!;
const v = { fields: sample.values, tables: sample.tables } as never;
type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
const table = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === 'options') as unknown as { columns: Col[] };
const rows = (sample.tables.options ?? []) as Record<string, string>[];
const cell = (row: number, key: string, values: never = v) => Number(table.columns.find((c) => c.key === key)!.compute!(rows[row], values));
const out = (key: string) => def.outputs!.find((o) => o.key === key)!.compute(v);
const der = (key: string, values: never = v) => def.derived!.find((d) => d.key === key)!.compute(values);

describe('Scenario Planner: passes the platform checks', () => {
  it('has no quality-gate blockers', () => { expect(qualityGate(SCENARIO_PLANNER).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(SCENARIO_PLANNER).score).toBeGreaterThanOrEqual(90); });
});

// Hand-worked: probabilities 25/50/25. Expand 900/400/-300, Outsource 500/300/50, Hold 150/100/60.
describe('Scenario Planner: matches the hand-worked answers', () => {
  it('expected values', () => {
    expect(cell(0, 'emv')).toBeCloseTo(350, 1);
    expect(cell(1, 'emv')).toBeCloseTo(287.5, 1);
    expect(cell(2, 'emv')).toBeCloseTo(102.5, 1);
  });
  it('spread for Expand: sqrt(182,500) = 427.2', () => { expect(cell(0, 'spread')).toBeCloseTo(427.2, 1); });
  it('risk-adjusted score: 350 - 0.5 x 427.2 = 136.4', () => { expect(cell(0, 'risk_adj')).toBeCloseTo(136.4, 1); });
  it('maximin, maximax, Hurwicz (0.4 best + 0.6 worst)', () => {
    expect(cell(0, 'maximin')).toBe(-300);
    expect(cell(2, 'maximin')).toBe(60);
    expect(cell(0, 'maximax')).toBe(900);
    expect(cell(0, 'hurwicz')).toBeCloseTo(0.4 * 900 + 0.6 * -300, 1); // 180
    expect(cell(1, 'hurwicz')).toBeCloseTo(0.4 * 500 + 0.6 * 50, 1); // 230
  });
  it('regret score is minus the largest regret: Expand -360, Outsource -400, Hold -750', () => {
    expect(cell(0, 'regret_score')).toBe(-360);
    expect(cell(1, 'regret_score')).toBe(-400);
    expect(cell(2, 'regret_score')).toBe(-750);
  });
  it('value of perfect information: 440 - 350 = 90', () => {
    expect(Number(der('ev_perfect'))).toBeCloseTo(440, 1);
    expect(Number(der('evpi'))).toBeCloseTo(90, 1);
  });
  it('names the right option under each rule', () => {
    expect(out('best_emv')).toBe('Expand own plant');
    expect(out('best_maximin')).toBe('Hold capacity');
    expect(out('best_maximax')).toBe('Expand own plant');
    expect(out('best_hurwicz')).toBe('Outsource overflow');
    expect(out('best_regret')).toBe('Expand own plant');
  });
  it('risk-adjusted choice follows the formula EMV - 0.5 x SD for every option', () => {
    const scores = [0, 1, 2].map((i) => cell(i, 'risk_adj'));
    const best = scores.indexOf(Math.max(...scores));
    expect(out('best_risk_adj')).toBe(rows[best].option);
  });
  it('flags likelihoods that do not total 100, and rescales them', () => {
    expect(String(der('prob_check'))).toMatch(/total 100%/);
    const bad = { fields: { ...sample.values, p_best: '25', p_base: '50', p_worst: '15' }, tables: sample.tables } as never;
    expect(String(der('prob_check', bad))).toMatch(/do not total/);
    expect(cell(0, 'emv', bad)).toBeCloseTo((0.25 * 900 + 0.5 * 400 + 0.15 * -300) / 0.9, 1);
  });
});
