import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { INDUSTRIES } from '@/lib/agents/catalogue';
import { pilotByAgent } from '@/lib/agents/pilots';
import { OEE_CALCULATOR, SCRAP_YIELD, MAINTENANCE_PRIORITY } from '@/lib/agents/pilots/industryManufacturing';
import { STORE_SCORECARD, STOCK_COVER, SHRINKAGE } from '@/lib/agents/pilots/industryRetail';
import { TRADE_PROMO_ROI, SKU_RATIONALISATION, DISTRIBUTOR_HEALTH } from '@/lib/agents/pilots/industryConsumerGoods';
import { LANE_PROFITABILITY, FLEET_UTILISATION, WAREHOUSE_PRODUCTIVITY } from '@/lib/agents/pilots/industryLogistics';
import { UTILISATION_BENCH, PROJECT_MARGIN, SLA_BREACH } from '@/lib/agents/pilots/industryTechServices';

type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
function harness(tool: DeclarativeTool, override: Record<string, string> = {}) {
  const def = interpret(tool);
  const sample = sampleOf(tool)!;
  const v = { fields: { ...sample.values, ...override }, tables: sample.tables } as never;
  const cell = (tableKey: string, row: number, key: string): string => {
    const t = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === tableKey) as unknown as { columns: Col[] };
    return t.columns.find((c) => c.key === key)!.compute!((sample.tables[tableKey] as Record<string, string>[])[row], v);
  };
  const out = (key: string) => String(def.outputs!.find((o) => o.key === key)!.compute(v));
  const der = (key: string) => String(def.derived!.find((d) => d.key === key)!.compute(v));
  return { cell, out, der };
}
const num = (s: string) => Number(s.replace(/[^0-9.\-]/g, ''));
const near = (s: string, x: number, tol = 0.06) => expect(Math.abs(num(s) - x)).toBeLessThanOrEqual(tol);

const ALL: [string, DeclarativeTool][] = [
  ['OEE', OEE_CALCULATOR], ['Scrap and Yield', SCRAP_YIELD], ['Maintenance Priority', MAINTENANCE_PRIORITY],
  ['Store Scorecard', STORE_SCORECARD], ['Stock Cover', STOCK_COVER], ['Shrinkage', SHRINKAGE],
  ['Trade Promotion ROI', TRADE_PROMO_ROI], ['SKU Rationalisation', SKU_RATIONALISATION], ['Distributor Health', DISTRIBUTOR_HEALTH],
  ['Lane Profitability', LANE_PROFITABILITY], ['Fleet Utilisation', FLEET_UTILISATION], ['Warehouse Productivity', WAREHOUSE_PRODUCTIVITY],
  ['Utilisation Bench', UTILISATION_BENCH], ['Project Margin', PROJECT_MARGIN], ['SLA Breach', SLA_BREACH],
];

describe.each(ALL)('%s: passes the platform checks', (_n, tool) => {
  it('has no quality-gate blockers', () => { expect(qualityGate(tool).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(tool).score).toBeGreaterThanOrEqual(90); });
  it('ends with the standard action plan', () => { expect(tool.sections.at(-1)!.key).toBe('plan'); });
});

describe('industry catalogue', () => {
  it('has five industries with three agents each, all with a working tool', () => {
    expect(INDUSTRIES.map((a) => a.name)).toEqual(['Manufacturing', 'Retail', 'Consumer Goods', 'Logistics', 'Technology Services']);
    for (const a of INDUSTRIES) {
      expect(a.agents).toHaveLength(3);
      for (const g of a.agents) { expect(g.status).toBe('pilot'); expect(pilotByAgent(g.slug)).toBeTruthy(); }
    }
  });
  it('slugs and names are unique', () => {
    const all = INDUSTRIES.flatMap((a) => a.agents);
    expect(new Set(all.map((a) => a.slug)).size).toBe(15);
    expect(new Set(all.map((a) => a.name)).size).toBe(15);
  });
});

describe('Manufacturing: hand-worked', () => {
  it('OEE: Line A 87.5 x 83.3 x 95 = 69.3 percent; Line B 81.7 percent', () => {
    const h = harness(OEE_CALCULATOR);
    near(h.cell('lines', 0, 'avail'), 87.5); near(h.cell('lines', 0, 'perf'), 83.3); near(h.cell('lines', 0, 'qual'), 95);
    near(h.cell('lines', 0, 'oee'), 69.3); near(h.cell('lines', 1, 'oee'), 81.7);
    expect(h.cell('lines', 0, 'vs_target')).toBe('Below target');
    expect(h.cell('lines', 1, 'vs_target')).toBe('Meets target');
    expect(h.out('weakest')).toContain('Line A');
  });
  it('Scrap: costs 45,000 / 20,000 / 15,000; first-pass yield 92 percent', () => {
    const h = harness(SCRAP_YIELD);
    expect(num(h.cell('causes', 0, 'cost'))).toBe(45000);
    near(h.cell('causes', 0, 'share'), 56.25, 0.3);
    expect(num(h.der('scrap_cost'))).toBe(80000);
    expect(num(h.der('scrap_units'))).toBe(700);
    near(h.der('fpy'), 92);
    expect(h.out('top_cause')).toContain('Material');
  });
  it('Maintenance: scores 20 / 9 / 16; failure cost 48,000', () => {
    const h = harness(MAINTENANCE_PRIORITY);
    expect([0, 1, 2].map((i) => num(h.cell('equipment', i, 'score')))).toEqual([20, 9, 16]);
    expect(num(h.cell('equipment', 0, 'fail_cost'))).toBe(48000);
    expect(h.out('top_priority')).toContain('Press 1');
  });
});

describe('Retail: hand-worked', () => {
  it('Store scorecard: 500 / 400 / 300 per sq ft; conversion 20 / 20 / 10; basket 625', () => {
    const h = harness(STORE_SCORECARD);
    expect([0, 1, 2].map((i) => num(h.cell('stores', i, 'per_sqft')))).toEqual([500, 400, 300]);
    near(h.cell('stores', 2, 'conv'), 10); near(h.cell('stores', 0, 'conv'), 20);
    expect(num(h.cell('stores', 0, 'basket'))).toBe(625);
    expect(h.out('best')).toContain('S1'); expect(h.out('weakest_conv')).toContain('S3');
    expect(num(h.der('sales_total'))).toBe(2500000);
  });
  it('Stock cover: 6 / 18 / 12 weeks; excess at cost 500,000 and 80,000', () => {
    const h = harness(STOCK_COVER);
    expect([0, 1, 2].map((i) => num(h.cell('items', i, 'cover')))).toEqual([6, 18, 12]);
    expect([0, 1, 2].map((i) => num(h.cell('items', i, 'excess_value')))).toEqual([0, 500000, 80000]);
    expect(h.cell('items', 0, 'flag')).toBe('Within target'); expect(h.cell('items', 1, 'flag')).toBe('Over target');
    expect(num(h.der('excess_total'))).toBe(580000);
    expect(h.out('biggest')).toContain('jacket');
  });
  it('Shrinkage: loss 40,000 / 40,000 / 15,000 = 2 / 4 / 1 percent of sales', () => {
    const h = harness(SHRINKAGE);
    expect([0, 1, 2].map((i) => num(h.cell('stores', i, 'loss')))).toEqual([40000, 40000, 15000]);
    near(h.cell('stores', 1, 'loss_pct'), 4); near(h.cell('stores', 2, 'loss_pct'), 1);
    expect(h.cell('stores', 0, 'flag')).toBe('Within tolerance'); expect(h.cell('stores', 1, 'flag')).toBe('Above tolerance');
    expect(num(h.der('total_loss'))).toBe(95000); expect(num(h.der('theft_total'))).toBe(59000);
    expect(h.out('worst')).toContain('Store B');
  });
});

describe('Consumer Goods: hand-worked', () => {
  it('Trade promotion: profit 5,000 / -5,800 / 1,400; ROI 33.3 percent for the first', () => {
    const h = harness(TRADE_PROMO_ROI);
    expect(num(h.cell('promos', 0, 'inc_margin'))).toBe(10000);
    expect([0, 1, 2].map((i) => num(h.cell('promos', i, 'profit')))).toEqual([5000, -5800, 1400]);
    near(h.cell('promos', 0, 'roi'), 33.3);
    expect(h.cell('promos', 1, 'call')).toBe('Lost money'); expect(h.cell('promos', 0, 'call')).toBe('Earned');
    expect(num(h.der('profit_total'))).toBe(600);
    expect(h.out('best')).toContain('Buy more');
  });
  it('SKU: shares 40 / 30 / 25 / 5 percent; only the last is reviewed', () => {
    const h = harness(SKU_RATIONALISATION);
    expect([0, 1, 2, 3].map((i) => num(h.cell('skus', i, 'share')))).toEqual([40, 30, 25, 5]);
    expect([0, 1, 2, 3].map((i) => h.cell('skus', i, 'call'))).toEqual(['Keep', 'Keep', 'Keep', 'Review']);
    near(h.cell('skus', 3, 'margin_pct'), 10);
    expect(h.out('star')).toContain('Classic'); expect(h.out('tail')).toContain('Chilli');
    expect(num(h.der('margin_total'))).toBe(100000);
  });
  it('Distributor: fill 95 / 80 / 100; days 20 / 51.4 / 16.7; D2 is the credit risk', () => {
    const h = harness(DISTRIBUTOR_HEALTH);
    near(h.cell('distributors', 1, 'fill'), 80);
    near(h.cell('distributors', 0, 'days'), 20); near(h.cell('distributors', 1, 'days'), 51.4); near(h.cell('distributors', 2, 'days'), 16.7);
    near(h.cell('distributors', 1, 'growth'), -6.7, 0.1);
    expect([0, 1, 2].map((i) => h.cell('distributors', i, 'call'))).toEqual(['Within limit', 'Credit risk', 'Within limit']);
    expect(num(h.der('recv_total'))).toBe(2050000);
    expect(h.out('slowest')).toContain('D2');
  });
});

describe('Logistics: hand-worked', () => {
  it('Lane: margin 200,000 / 30,000 / 180,000; 25 / 4 / 30 percent', () => {
    const h = harness(LANE_PROFITABILITY);
    expect([0, 1, 2].map((i) => num(h.cell('lanes', i, 'margin')))).toEqual([200000, 30000, 180000]);
    near(h.cell('lanes', 1, 'margin_pct'), 4);
    expect(h.cell('lanes', 1, 'call')).toBe('Below minimum'); expect(h.cell('lanes', 0, 'call')).toBe('Meets minimum');
    expect(num(h.der('margin_total'))).toBe(410000);
    expect(h.out('best')).toContain('Mumbai'); expect(h.out('weakest')).toContain('Delhi');
  });
  it('Fleet: utilisation 86.7 / 60 / 80; load 80 / 50 / 75; cost per km 15 / 20 / 13', () => {
    const h = harness(FLEET_UTILISATION);
    near(h.cell('vehicles', 0, 'util'), 86.7); near(h.cell('vehicles', 1, 'util'), 60);
    near(h.cell('vehicles', 1, 'load_factor'), 50);
    near(h.cell('vehicles', 0, 'cost_km'), 15); near(h.cell('vehicles', 1, 'cost_km'), 20); near(h.cell('vehicles', 2, 'cost_km'), 13);
    expect([0, 1, 2].map((i) => h.cell('vehicles', i, 'call'))).toEqual(['Meets target', 'Below target', 'Meets target']);
    expect(num(h.der('cost_total'))).toBe(194400); expect(num(h.der('km_total'))).toBe(12700);
    expect(h.out('least_used')).toContain('1002'); expect(h.out('costliest')).toContain('1002');
  });
  it('Warehouse: 60 / 40 / 80 picks an hour; accuracy 99 / 97 / 99; Zone B is slowest', () => {
    const h = harness(WAREHOUSE_PRODUCTIVITY);
    expect([0, 1, 2].map((i) => num(h.cell('zones', i, 'rate')))).toEqual([60, 40, 80]);
    near(h.cell('zones', 1, 'accuracy'), 97);
    expect([0, 1, 2].map((i) => h.cell('zones', i, 'call'))).toEqual(['Meets target', 'Below target', 'Meets target']);
    expect(num(h.der('picks_total'))).toBe(10200); expect(num(h.der('hours_total'))).toBe(185);
    expect(h.out('slowest')).toContain('Zone B');
  });
});

describe('Technology Services: hand-worked', () => {
  it('Utilisation: 85 / 60 / 90 percent; idle cost 14,400 / 32,000 / 11,200', () => {
    const h = harness(UTILISATION_BENCH);
    expect([0, 1, 2].map((i) => num(h.cell('teams', i, 'util')))).toEqual([85, 60, 90]);
    expect([0, 1, 2].map((i) => num(h.cell('teams', i, 'idle_cost')))).toEqual([14400, 32000, 11200]);
    expect(num(h.der('idle_total'))).toBe(104); expect(num(h.der('idle_cost_total'))).toBe(57600);
    expect(h.cell('teams', 1, 'call')).toBe('Below target');
    expect(h.out('costliest')).toContain('Team B');
  });
  it('Project margin: estimate 660,000 / 750,000; ERP integration forecast margin 6.25 percent and overrun 190,000', () => {
    const h = harness(PROJECT_MARGIN);
    expect(num(h.cell('projects', 0, 'eac'))).toBe(660000);
    expect(num(h.cell('projects', 1, 'eac'))).toBe(750000);
    expect(num(h.cell('projects', 0, 'margin'))).toBe(340000);
    near(h.cell('projects', 1, 'margin_pct'), 6.25, 0.1);
    expect(num(h.cell('projects', 1, 'overrun'))).toBe(190000);
    expect(h.cell('projects', 1, 'call')).toBe('Below minimum'); expect(h.cell('projects', 0, 'call')).toBe('Meets minimum');
    expect(h.out('worst')).toContain('ERP');
  });
  it('SLA: breach rate 3 / 8 / 1 percent; penalty 60,000 / 160,000 / 18,000', () => {
    const h = harness(SLA_BREACH);
    expect([0, 1, 2].map((i) => num(h.cell('clients', i, 'penalty')))).toEqual([60000, 160000, 18000]);
    near(h.cell('clients', 1, 'rate'), 8);
    expect([0, 1, 2].map((i) => h.cell('clients', i, 'call'))).toEqual(['Within allowed', 'Above allowed', 'Within allowed']);
    expect(num(h.der('breach_total'))).toBe(38); expect(num(h.der('penalty_total'))).toBe(238000);
    expect(h.out('costliest')).toContain('Client B');
  });
});
