import { describe, expect, it } from 'vitest';
import { demoOf, tourSteps } from '@/lib/agents/demo';
import { PILOTS } from '@/lib/agents/pilots';

describe('the standard demo for every pilot', () => {
  it('has one fixed format: scenario, inputs, results and working', () => {
    for (const p of PILOTS) {
      const d = demoOf(p.tool)!;
      expect(d.scenario.length).toBeGreaterThan(30);
      expect(d.fields.length).toBeGreaterThan(2);
      expect(d.tables.length).toBeGreaterThan(0);
      expect(d.results.length).toBeGreaterThan(0);
      expect(d.working.length).toBeGreaterThan(0);
    }
  });
  it('shows computed columns as worked out values, not blanks', () => {
    const d = demoOf(PILOTS.find((p) => p.agent === 'capital-allocation-advisor')!.tool)!;
    const t = d.tables.find((x) => x.title === 'Project list')!;
    const npv = t.columns.findIndex((c) => c.header === 'NPV');
    expect(t.columns[npv].computed).toBe(true);
    expect(Number(t.rows[0][npv])).toBeCloseTo(52.3, 1);
  });
  it('gives the same answers as the tool: Pricing Optimizer sample', () => {
    const d = demoOf(PILOTS.find((p) => p.agent === 'pricing-optimizer')!.tool)!;
    expect(Number(d.results.find((r) => r.label.startsWith('Profit-maximising price (linear'))!.value)).toBeCloseTo(121.7, 1);
  });
  it('shows only results that have a value (no empty or "null" rows)', () => {
    for (const p of PILOTS) { const d = demoOf(p.tool)!; for (const r of [...d.results, ...d.working]) { expect(r.value).not.toBe(''); expect(r.value).not.toBe('null'); } }
  });
  it('has the same five tour steps for every agent, each pointing to a section on the page', () => {
    for (const live of [true, false]) {
      const s = tourSteps(live);
      expect(s).toHaveLength(5);
      for (const x of s) expect(x.href).toMatch(/^#[a-z-]+$/);
    }
  });
});
