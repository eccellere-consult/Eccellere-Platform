import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { PRICING_OPTIMIZER } from '@/lib/agents/pilots/pricingOptimizer';

const def = interpret(PRICING_OPTIMIZER);
const sample = sampleOf(PRICING_OPTIMIZER)!;
const v = { fields: sample.values, tables: sample.tables } as never;
type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
const table = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === 'candidates') as unknown as { columns: Col[] };
const rows = (sample.tables.candidates ?? []) as Record<string, string>[];
const text = (row: number, key: string, values: never = v) => table.columns.find((c) => c.key === key)!.compute!(rows[row], values);
const cell = (row: number, key: string, values: never = v) => Number(text(row, key, values));
const der = (key: string, values: never = v) => def.derived!.find((d) => d.key === key)!.compute(values);
const out = (key: string, values: never = v) => def.outputs!.find((o) => o.key === key)!.compute(values);

// Independent hand calculation (textbook formulas), not the engine's expression tree.
const p1 = 100, q1 = 5000, p2 = 110, q2 = 4400, cost = 60, fixed = 200000;
const E = ((q2 - q1) / ((q1 + q2) / 2)) / ((p2 - p1) / ((p1 + p2) / 2));
const b = (q1 - q2) / (p2 - p1), a = q1 + b * p1;
const pLin = (a + b * cost) / (2 * b);
const pCe = (cost * E) / (1 + E);

describe('Pricing Optimizer: passes the platform checks', () => {
  it('has no quality-gate blockers', () => { expect(qualityGate(PRICING_OPTIMIZER).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(PRICING_OPTIMIZER).score).toBeGreaterThanOrEqual(90); });
});

describe('Pricing Optimizer: matches the hand-worked answers', () => {
  it('arc elasticity is about -1.34', () => {
    expect(E).toBeCloseTo(-1.3404, 3);
    expect(Number(der('elasticity'))).toBeCloseTo(E, 2);
    expect(String(der('reading'))).toMatch(/^Elastic/);
  });
  it('demand curve Q = 11000 - 60P and its optimum price 121.7', () => {
    expect(a).toBe(11000);
    expect(b).toBe(60);
    expect(Number(der('slope'))).toBeCloseTo(60, 1);
    expect(pLin).toBeCloseTo(121.667, 2);
    expect(Number(out('p_linear'))).toBeCloseTo(121.7, 1);
  });
  it('constant-elasticity markup price c E / (1 + E)', () => {
    expect(Number(out('p_markup_value'))).toBeCloseTo(pCe, 0);
    expect(pCe).toBeCloseTo(236.25, 1);
  });
  it('contribution, break-even and margin of safety at 110', () => {
    expect(Number(der('cm_unit'))).toBeCloseTo(50, 2);
    expect(String(der('cm_pct'))).toBe('45.5%');
    expect(Number(der('break_even'))).toBe(4000);
    expect(String(der('safety'))).toBe('9.1%');
  });
  it('candidate volumes and profits on the linear curve', () => {
    const vols = [5000, 4400, 3800, 3200, 2600];
    const profits = [0, 20000, 28000, 24000, 8000];
    for (let i = 0; i < 5; i++) { expect(cell(i, 'vol_lin')).toBe(vols[i]); expect(cell(i, 'profit_lin')).toBe(profits[i]); }
  });
  it('candidate profit on the constant-elasticity curve matches the formula', () => {
    for (let i = 0; i < 5; i++) {
      const P = Number(rows[i].price);
      const vol = q2 * Math.pow(P / p2, E);
      expect(cell(i, 'vol_ce')).toBe(Math.round(vol));
      expect(cell(i, 'profit_ce')).toBe(Math.round((P - cost) * vol - fixed));
    }
  });
  it('picks 120 as the best candidate on the linear curve and labels what is extrapolated', () => {
    expect(out('best_linear')).toBe('120');
    expect(text(0, 'range')).toBe('Within tested range');
    expect(text(2, 'range')).toBe('Outside tested range');
  });
  it('gives no markup price when demand is not elastic', () => {
    const flat = { fields: { ...sample.values, q2: '4900' }, tables: sample.tables } as never;
    expect(String(out('p_markup', flat))).toMatch(/^Not defined/);
    expect(out('p_markup_value', flat)).toBeNull();
  });
  it('stays blank until both price tests are entered', () => {
    const empty = { fields: {}, tables: sample.tables } as never;
    expect(der('elasticity', empty)).toBeNull();
    expect(out('p_linear', empty)).toBeNull();
  });
});
