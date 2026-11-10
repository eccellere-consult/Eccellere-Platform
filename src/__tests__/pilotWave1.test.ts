import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { CONCEPT_SCREENER } from '@/lib/agents/pilots/conceptScreener';
import { VENDOR_ONBOARDING } from '@/lib/agents/pilots/vendorOnboarding';
import { HIRE_TO_ONBOARD } from '@/lib/agents/pilots/hireToOnboard';
import { PRODUCT_SPEC } from '@/lib/agents/pilots/productSpec';
import { STRATEGY_CASCADE } from '@/lib/agents/pilots/strategyCascade';
import { VOICE_OF_CUSTOMER } from '@/lib/agents/pilots/voiceOfCustomer';

type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
function harness(tool: DeclarativeTool) {
  const def = interpret(tool);
  const sample = sampleOf(tool)!;
  const v = { fields: sample.values, tables: sample.tables } as never;
  const cell = (tableKey: string, row: number, key: string): string => {
    const t = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === tableKey) as unknown as { columns: Col[] };
    return t.columns.find((c) => c.key === key)!.compute!((sample.tables[tableKey] as Record<string, string>[])[row], v);
  };
  const out = (key: string) => String(def.outputs!.find((o) => o.key === key)!.compute(v));
  const der = (key: string) => String(def.derived!.find((d) => d.key === key)!.compute(v));
  return { cell, out, der };
}
const num = (s: string) => Number(s.replace(/[^0-9.\-]/g, ''));

const ALL: [string, DeclarativeTool][] = [
  ['Concept Screener', CONCEPT_SCREENER], ['Vendor Onboarding', VENDOR_ONBOARDING], ['Hire-to-Onboard', HIRE_TO_ONBOARD],
  ['Product Spec Generator', PRODUCT_SPEC], ['Strategy Cascade', STRATEGY_CASCADE], ['Voice of Customer', VOICE_OF_CUSTOMER],
];

describe.each(ALL)('%s: passes the platform checks', (_n, tool) => {
  it('has no quality-gate blockers', () => { expect(qualityGate(tool).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(tool).score).toBeGreaterThanOrEqual(90); });
});

describe('Concept Screener: hand-worked scores', () => {
  const h = harness(CONCEPT_SCREENER);
  it('weighted score = sum(weight x score) / sum(weights)', () => {
    expect(num(h.cell('concepts', 0, 'score'))).toBeCloseTo((5 * 4 + 4 * 3 + 3 * 5 + 2 * 2 + 1 * 1) / 15, 2); // 52/15 = 3.47
    expect(num(h.cell('concepts', 1, 'score'))).toBeCloseTo((5 * 3 + 4 * 4 + 3 * 2 + 2 * 5 + 1 * 4) / 15, 2); // 51/15 = 3.40
  });
  it('equal-weights score is the plain average', () => { expect(num(h.cell('concepts', 0, 'equal'))).toBeCloseTo(3, 2); });
  it('advances only concepts above the cut-off', () => {
    expect(h.cell('concepts', 0, 'verdict')).toBe('Advance');
    expect(h.cell('concepts', 1, 'verdict')).toBe('Hold or drop');
  });
  it('names the top concept', () => { expect(h.out('top_weighted')).toContain('Subscription refill service'); });
});

describe('Vendor Onboarding: hand-worked readiness', () => {
  const h = harness(VENDOR_ONBOARDING);
  it('4 checked + 1 not checked + 1 requested, 1 not applicable = 9 of 12 points', () => {
    expect(h.out('ready')).toContain('75');
  });
  it('counts risk answers of Yes', () => { expect(h.der('risk_yes')).toContain('2 of 4'); });
});

describe('Hire-to-Onboard: hand-worked readiness', () => {
  const h = harness(HIRE_TO_ONBOARD);
  it('2 done + 3 in progress + 3 not started = 7 of 16 points', () => { expect(h.out('ready')).toContain('44'); });
  it('flags time pressure only under seven days', () => {
    expect(h.out('timing')).toContain('Enough time');
    const urgent = { ...HIRE_TO_ONBOARD, sample: { ...HIRE_TO_ONBOARD.sample!, values: { ...HIRE_TO_ONBOARD.sample!.values, days_to_join: '5' } } };
    expect(harness(urgent).out('timing')).toContain('Urgent');
  });
});

describe('Product Spec Generator: hand-worked ranking', () => {
  const h = harness(PRODUCT_SPEC);
  it('value per day = importance / effort', () => {
    expect(num(h.cell('requirements', 0, 'value'))).toBeCloseTo(5 / 8, 1);
    expect(num(h.cell('requirements', 1, 'value'))).toBeCloseTo(4 / 3, 2);
  });
  it('totals effort and picks the best value per day', () => {
    expect(num(h.der('effort_total'))).toBe(26);
    expect(h.out('build_first')).toContain('Message sent when an order is dispatched');
  });
  it('counts spec questions answered Yes', () => { expect(h.der('complete')).toContain('4 of 6'); });
});

describe('Strategy Cascade: hand-worked progress', () => {
  const h = harness(STRATEGY_CASCADE);
  it('progress = (current - baseline) / (target - baseline)', () => {
    expect(num(h.cell('krs', 0, 'progress'))).toBeCloseTo(30, 1);
    expect(num(h.cell('krs', 1, 'progress'))).toBeCloseTo(55, 1);
  });
  it('overall progress is the weighted average: 0.6 x 30 + 0.4 x 55 = 40', () => { expect(num(h.out('overall'))).toBeCloseTo(40, 1); });
  it('checks the weights add up to 100', () => { expect(h.der('weight_check')).toContain('add up to 100'); });
});

describe('Voice of Customer: hand-worked priority', () => {
  const h = harness(VOICE_OF_CUSTOMER);
  it('priority = mentions x severity', () => {
    expect(num(h.cell('themes', 0, 'priority'))).toBe(72);
    expect(num(h.cell('themes', 1, 'priority'))).toBe(14);
    expect(num(h.cell('themes', 2, 'priority'))).toBe(36);
  });
  it('share = mentions / total mentions (37)', () => { expect(num(h.cell('themes', 0, 'share'))).toBeCloseTo(48.6, 1); });
  it('totals mentions, counts unthemed pieces and picks the top theme', () => {
    expect(num(h.der('total_mentions'))).toBe(37);
    expect(num(h.der('unthemed'))).toBe(23);
    expect(h.out('top_theme')).toContain('Slow support replies');
  });
});
