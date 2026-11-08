import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { DEMAND_FORECASTER } from '@/lib/agents/pilots/demandForecaster';

const def = interpret(DEMAND_FORECASTER);
const sample = sampleOf(DEMAND_FORECASTER)!;
const v = { fields: sample.values, tables: sample.tables } as never;
type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
const table = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === 'history') as unknown as { columns: Col[] };
const rows = (sample.tables.history ?? []) as Record<string, string>[];
const cell = (row: number, key: string) => Number(table.columns.find((c) => c.key === key)!.compute!(rows[row], v));
const der = (key: string, values: never = v) => def.derived!.find((d) => d.key === key)!.compute(values);
const out = (key: string, values: never = v) => def.outputs!.find((o) => o.key === key)!.compute(values);

// Independent least-squares by deviations from the mean (a different route from the engine's sums).
const t = rows.map((r) => Number(r.period)), d = rows.map((r) => Number(r.demand));
const n = t.length, tb = t.reduce((a, b) => a + b, 0) / n, db = d.reduce((a, b) => a + b, 0) / n;
const b = t.reduce((a, x, i) => a + (x - tb) * (d[i] - db), 0) / t.reduce((a, x) => a + (x - tb) ** 2, 0);
const a = db - b * tb;
const sseRef = d.reduce((acc, y, i) => acc + (y - (a + b * t[i])) ** 2, 0);
const s = Math.sqrt(sseRef / (n - 2));
const sstRef = d.reduce((acc, y) => acc + (y - db) ** 2, 0);
const fc = a + b * (8 + 1);
// z(0.95) = 1.644853627
const z = 1.644853627;
const ss = z * s * Math.sqrt(2);
const holdH = 0.2 * 200;
const eoqRef = Math.sqrt((2 * 1500 * 500) / holdH);

describe('Demand Forecaster: passes the platform checks', () => {
  it('has no quality-gate blockers', () => { expect(qualityGate(DEMAND_FORECASTER).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(DEMAND_FORECASTER).score).toBeGreaterThanOrEqual(90); });
});

describe('Demand Forecaster: matches the hand-worked answers', () => {
  it('trend slope and intercept', () => {
    expect(Number(der('trend'))).toBeCloseTo(b, 2);
    expect(Number(der('base'))).toBeCloseTo(a, 1);
    expect(b).toBeGreaterThan(7);
  });
  it('trend line and gap per row', () => {
    expect(cell(0, 'fitted')).toBeCloseTo(a + b * 1, 1);
    expect(cell(7, 'gap')).toBeCloseTo(151 - (a + b * 8), 1);
  });
  it('standard error and R-squared', () => {
    expect(Number(der('se'))).toBeCloseTo(s, 1);
    expect(Number(der('r2'))).toBeCloseTo(1 - sseRef / sstRef, 2);
    expect(String(der('fit_reading'))).toMatch(/explains most/);
  });
  it('forecast for the next period', () => { expect(Number(out('forecast'))).toBe(Math.round(fc)); });
  it('safety stock, reorder point and economic order quantity', () => {
    expect(Number(der('z'))).toBeCloseTo(z, 2);
    expect(Number(out('safety_stock'))).toBe(Math.round(ss));
    expect(Number(out('reorder_point'))).toBe(Math.round(fc * 2 + ss));
    expect(Number(out('eoq'))).toBe(Math.round(eoqRef));
    expect(eoqRef).toBeCloseTo(193.65, 1);
  });
  it('annual order count and cost at the economic quantity', () => {
    expect(Number(der('orders_year'))).toBeCloseTo(1500 / eoqRef, 1);
    expect(Number(der('cycle_cost'))).toBe(Math.round(Math.sqrt(2 * 1500 * 500 * holdH)));
  });
  it('flags a weak fit on noisy history', () => {
    const noisy = { fields: sample.values, tables: { ...sample.tables, history: [100, 160, 90, 170, 80, 150].map((x, i) => ({ period: String(i + 1), demand: String(x) })) } } as never;
    expect(String(der('fit_reading', noisy))).toMatch(/^Weak fit/);
  });
  it('stays blank without a history', () => {
    const empty = { fields: sample.values, tables: { history: [] } } as never;
    expect(out('forecast', empty)).toBeNull();
  });
});
