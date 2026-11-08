import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { CAPITAL_ALLOCATION } from '@/lib/agents/pilots/capitalAllocation';

const def = interpret(CAPITAL_ALLOCATION);
const sample = sampleOf(CAPITAL_ALLOCATION)!;
const v = { fields: sample.values, tables: sample.tables } as never;
type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
const table = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === 'projects') as unknown as { columns: Col[] };
const rows = (sample.tables.projects ?? []) as Record<string, string>[];
const text = (row: number, key: string) => table.columns.find((c) => c.key === key)!.compute!(rows[row], v);
const cell = (row: number, key: string) => Number(text(row, key).replace('%', ''));
const out = (key: string, values: never = v) => def.outputs!.find((o) => o.key === key)!.compute(values);
const der = (key: string) => def.derived!.find((d) => d.key === key)!.compute(v);

// Independent references.
const cfs = rows.map((r) => [1, 2, 3, 4, 5].map((t) => Number(r[`cf${t}`])));
const inv = rows.map((r) => Number(r.invest));
const npvAt = (i: number, rate: number) => cfs[i].reduce((a, x, k) => a + x / Math.pow(1 + rate, k + 1), 0) - inv[i];
const irrRef = (i: number) => { let lo = -0.9, hi = 5; for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (npvAt(i, mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
const npv = inv.map((_, i) => npvAt(i, 0.12));
const mirrRef = (i: number) => Math.pow(cfs[i].reduce((a, x, k) => a + x * Math.pow(1.1, 4 - k), 0) / inv[i], 0.2) - 1;
const paybackRef = (i: number) => { let cum = -inv[i]; for (let k = 0; k < 5; k++) { if (cum + cfs[i][k] >= 0) return k + -cum / cfs[i][k]; cum += cfs[i][k]; } return null; };

// Exhaustive search for the best affordable set, to compare with the tool's heuristic.
const bestSet = () => {
  let best = { v: 0, mask: 0 };
  for (let m = 0; m < 1 << rows.length; m++) {
    let cost = 0, val = 0;
    rows.forEach((_, i) => { if (m & (1 << i)) { cost += inv[i]; val += npv[i]; } });
    if (cost <= 350 && val > best.v) best = { v: val, mask: m };
  }
  return best;
};

describe('Capital Allocation Advisor: passes the platform checks', () => {
  it('has no quality-gate blockers', () => { expect(qualityGate(CAPITAL_ALLOCATION).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(CAPITAL_ALLOCATION).score).toBeGreaterThanOrEqual(90); });
});

describe('Capital Allocation Advisor: matches the hand-worked answers', () => {
  it('NPV of every project at 12 percent', () => {
    for (let i = 0; i < rows.length; i++) expect(cell(i, 'npv')).toBeCloseTo(npv[i], 1);
    expect(npv[0]).toBeCloseTo(52.3, 1); // 70 x 3.6048 - 200
  });
  it('profitability index = 1 + NPV / outlay', () => {
    for (let i = 0; i < rows.length; i++) expect(cell(i, 'pi')).toBeCloseTo(1 + npv[i] / inv[i], 2);
  });
  it('IRR matches a bisection search', () => {
    for (let i = 0; i < rows.length; i++) expect(cell(i, 'irr')).toBeCloseTo(irrRef(i) * 100, 1);
  });
  it('MIRR matches the reinvestment formula', () => {
    for (let i = 0; i < rows.length; i++) expect(cell(i, 'mirr')).toBeCloseTo(mirrRef(i) * 100, 1);
  });
  it('payback with in-year interpolation', () => {
    expect(cell(0, 'payback')).toBeCloseTo(paybackRef(0)!, 1); // 200 / 70 = 2.857
    expect(paybackRef(0)).toBeCloseTo(2.857, 2);
    for (let i = 0; i < rows.length; i++) { const ref = paybackRef(i); if (ref !== null) expect(cell(i, 'payback')).toBeCloseTo(ref, 1); }
  });
  it('verdict follows the sign of NPV', () => {
    for (let i = 0; i < rows.length; i++) expect(text(i, 'verdict')).toBe(npv[i] > 0 ? 'Creates value' : 'Below hurdle');
  });
  it('funded set is affordable, positive and equals the best possible set for this example', () => {
    const names = String(out('funded')).split(', ');
    const cost = names.reduce((a, nm) => a + inv[rows.findIndex((r) => r.name === nm)], 0);
    expect(cost).toBeLessThanOrEqual(350);
    expect(Number(out('funded_cost'))).toBeCloseTo(cost, 1);
    const best = bestSet();
    const value = names.reduce((a, nm) => a + npv[rows.findIndex((r) => r.name === nm)], 0);
    expect(Number(out('funded_value'))).toBeCloseTo(value, 0);
    expect(value).toBeCloseTo(best.v, 1);
  });
  it('names the largest NPV and best profitability index', () => {
    expect(out('best_npv')).toBe(rows[npv.indexOf(Math.max(...npv))].name);
    const pis = npv.map((x, i) => 1 + x / inv[i]);
    expect(out('best_pi')).toBe(rows[pis.indexOf(Math.max(...pis))].name);
  });
  it('says rationing applies when asks exceed the budget', () => {
    expect(Number(der('asked'))).toBe(750);
    expect(Number(der('gap'))).toBe(400);
    expect(String(der('rationing'))).toMatch(/^Yes/);
  });
  it('funds nothing when no project has a positive NPV', () => {
    const bad = { fields: { ...sample.values, hurdle: '60' }, tables: sample.tables } as never;
    expect(out('funded', bad)).toBe('None fits the budget with a positive value');
  });
});
