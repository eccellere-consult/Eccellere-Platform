import { describe, expect, it } from 'vitest';
import { getModelDefinition, getModelSample } from '../lib/strategyModels/registry';
import { computeDerived, computeOutputs, computeViews, evalColumn, tablePartsOf, valuesFromFields } from '../lib/strategyModels/values';
import { competenceVerdict, correlation, vrioImplication } from '../lib/strategyModels/defs/advantage';
import { cac, ltv, paybackMonths, projectFinancials, projectMonths } from '../lib/strategyModels/defs/finance';
import type { ModelValues, Row } from '../lib/strategyModels/types';

/** The rules the advantage and finance models apply to the client's answers — checked directly, so a rule cannot drift from the model it implements. */
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

describe('Blue Ocean strategy canvas', () => {
  const canvas = (rows: [string, string, string, string][]): ModelValues => values({}, { canvas: rows.map(([factor, you, a, b]) => ({ factor, you, a, b })) });

  it('works out each factor’s industry level and your gap from the two rivals', () => {
    const r = { factor: 'Price', you: '2', a: '4', b: '5' };
    expect(column('blueocean', 'canvas', 'industry', r)).toBe('4.5');
    expect(column('blueocean', 'canvas', 'gap', r)).toBe('−2.5');
    expect(column('blueocean', 'canvas', 'gap', { factor: 'Service', you: '5', a: '3', b: '3' })).toBe('+2');
    expect(column('blueocean', 'canvas', 'gap', { factor: 'Service', you: '5' })).toBe('');
    expect(column('blueocean', 'canvas', 'gap', { factor: 'Brand', you: '3', a: '3', b: '3' })).toBe('0'); // level is a plain 0, not +0
  });

  it('is a red ocean when your curve runs alongside the industry’s', () => {
    const v = canvas([['Price', '2', '2', '2'], ['Speed', '3', '3', '3'], ['Choice', '4', '4', '4'], ['Service', '5', '5', '5']]);
    expect(derived('blueocean', v, 'similarity')).toContain('a red ocean');
    expect(tone('blueocean', v, 'similarity')).toBe('warn');
  });

  it('is a blue-ocean candidate when your curve breaks away from the industry’s', () => {
    const v = canvas([['Price', '1', '5', '5'], ['Speed', '5', '2', '2'], ['Choice', '1', '3', '3'], ['Service', '5', '1', '1']]);
    expect(derived('blueocean', v, 'similarity')).toContain('blue-ocean candidate');
    expect(derived('blueocean', v, 'similarity')).toMatch(/^r = −0\.\d\d /);   // a negative correlation shows a proper minus sign
    expect(tone('blueocean', v, 'similarity')).toBe('good');
  });

  it('needs three scored factors before it says anything, and no spread means no reading', () => {
    expect(derived('blueocean', canvas([['Price', '2', '3', '3'], ['Speed', '3', '4', '4']]), 'similarity')).toBeNull();
    expect(correlation([3, 3, 3], [1, 2, 3])).toBeNull();
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
    expect(correlation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 6);
  });

  it('names the factor with the biggest difference, in either direction', () => {
    const v = canvas([['Price', '3', '3', '3'], ['Speed', '5', '2', '2'], ['Choice', '2', '3', '3']]);
    expect(derived('blueocean', v, 'biggest_gap')).toBe('Speed (+3)');
    expect(derived('blueocean', v, 'above_below')).toBe('Above on 1 · below on 1 · level on 1');
  });
});

describe('ERRC grid', () => {
  it('counts the items in each box — one per line, however the client marks them — and shows the redesign for the next tool', () => {
    const v = values({ eliminate: 'Free samples\nRush orders', reduce: 'Price competition', raise: 'Engineering support', create: '• Three-week tooling; Fixture library' });
    expect(derived('errc', v, 'items')).toBe('Eliminate 2 · Reduce 1 · Raise 1 · Create 2');
    expect(output('errc', v, 'raise_create')).toBe('Engineering support, Three-week tooling, Fixture library');
  });

  it('is value innovation only when cost goes down and value goes up together', () => {
    const both = values({ eliminate: 'Free samples', raise: 'Engineering support' });
    expect(derived('errc', both, 'balance')).toMatch(/^Yes/);
    expect(tone('errc', both, 'balance')).toBe('good');
    expect(derived('errc', values({ raise: 'Engineering support' }), 'balance')).toMatch(/^Nothing eliminated or reduced/);
    expect(derived('errc', values({ eliminate: 'Free samples' }), 'balance')).toMatch(/^Nothing raised or created/);
    expect(tone('errc', values({ eliminate: 'Free samples' }), 'balance')).toBe('warn');
    expect(derived('errc', values(), 'balance')).toBeNull();
  });
});

describe('VRIO', () => {
  const imp = (valuable: string, rare: string, imitate: string, organised: string) => vrioImplication({ valuable, rare, imitate, organised });

  it('follows Barney’s table, stopping at the first “No”', () => {
    expect(imp('No', '', '', '')).toBe('Competitive disadvantage');
    expect(imp('Yes', 'No', '', '')).toBe('Competitive parity');
    expect(imp('Yes', 'Yes', 'No', '')).toBe('Temporary competitive advantage');
    expect(imp('Yes', 'Yes', 'Yes', 'No')).toBe('Unexploited competitive advantage');
    expect(imp('Yes', 'Yes', 'Yes', 'Yes')).toBe('Sustained competitive advantage');
  });

  it('says nothing until the questions that matter have been answered', () => {
    expect(imp('', '', '', '')).toBe('');
    expect(imp('Yes', '', '', '')).toBe('');
    expect(imp('Yes', 'Yes', '', '')).toBe('');
    expect(imp('Yes', 'Yes', 'Yes', '')).toBe('');
  });

  it('shows the implication in the table and lists the sustained advantages for the next tool', () => {
    const v = values({}, { resources: [
      { resource: 'IATF certification', valuable: 'Yes', rare: 'Yes', imitate: 'Yes', organised: 'Yes' },
      { resource: 'Machining capacity', valuable: 'Yes', rare: 'No' },
      { resource: 'Old stock', valuable: 'No' },
    ] });
    expect(column('vrio', 'resources', 'implication', v.tables.resources[0], v)).toBe('Sustained competitive advantage');
    expect(output('vrio', v, 'sustained_advantages')).toContain('IATF certification');
    expect(output('vrio', v, 'sustained_advantages')).not.toContain('Machining capacity');
  });
});

describe('Resource-based view', () => {
  it('rates a resource by how strong it is plus how hard it is to copy', () => {
    const p = (strength: string, hard: string) => column('rbv', 'resources', 'potential', { type: 'Reputation and brand', strength, hard_to_copy: hard });
    expect(p('5', '3')).toBe('Core strength');
    expect(p('4', '4')).toBe('Core strength');
    expect(p('4', '3')).toBe('Useful');
    expect(p('3', '3')).toBe('Useful');
    expect(p('2', '3')).toBe('Ordinary');
    expect(p('5', '')).toBe('');
  });
});

describe('Core competence', () => {
  const verdict = (m: string, b: string, i: string) => competenceVerdict({ markets: m, benefit: b, imitate: i });

  it('passes a capability only when it passes all three tests — its weakest score decides', () => {
    expect(verdict('5', '4', '4')).toBe('Core competence');
    expect(verdict('5', '5', '3')).toBe('Candidate — strengthen the weakest test');
    expect(verdict('5', '5', '2')).toBe('Not a core competence');
    expect(verdict('1', '5', '5')).toBe('Not a core competence');
  });

  it('waits for all three scores', () => {
    expect(verdict('5', '5', '')).toBe('');
  });
});

describe('Lean Canvas', () => {
  it('keeps the answers an earlier version saved under its own labels', () => {
    const r = valuesFromFields(def('leancanvas'), [
      { label: 'Top 1-3 problems', value: '1. Slow tooling', source: 'Manual' },
      { label: 'Proposed solution', value: 'A tooling studio', source: 'Manual' },
      { label: 'Key metrics to watch', value: 'Lead time', source: 'Manual' },
    ]);
    expect(r.values.fields.problem).toBe('1. Slow tooling');
    expect(r.values.fields.solution).toBe('A tooling studio');
    expect(r.values.fields.key_metrics).toBe('Lead time');
    expect(r.unmatched).toHaveLength(0);
  });
});

describe('Three-statement financial model', () => {
  const base = (): ModelValues => values({
    revenue: '1000', cogs_pct: '70', opex_pct: '10', depreciation: '50', interest: '20', tax_rate: '25',
    cash: '100', receivables: '200', inventory: '150', fixed_assets: '500', payables: '100', debt: '250',
    depreciation_rate: '10', interest_rate: '8',
  }, { assumptions: [
    { year: 'Year 1', growth: '10', cogs_pct: '70', opex_pct: '10', receivable_days: '73', inventory_days: '73', payable_days: '48', capex: '100', new_debt: '50', dividend: '20' },
    { year: 'Year 2', growth: '10' },
    { year: 'Year 3', growth: '' },
  ] });

  it('derives equity as the balancing figure in the base year, so the base year balances by construction', () => {
    const p = projectFinancials(base())!;
    expect(p[0].equity).toBe(100 + 200 + 150 + 500 - 100 - 250);
    expect(p[0].check).toBe(0);
  });

  it('projects a year only once its growth is given, and carries every other assumption forward', () => {
    const p = projectFinancials(base())!;
    expect(p).toHaveLength(3); // base year + Year 1 + Year 2 — Year 3 has no growth
    expect(p[1].revenue).toBeCloseTo(1100, 6);
    expect(p[2].revenue).toBeCloseTo(1210, 6);
    // Year 2 left its days and capital spending blank: the days carry forward, the cash items do not
    expect(p[2].receivables).toBeCloseTo((p[2].revenue * 73) / 365, 6);
    expect(Math.abs(p[2].flow!.capex)).toBe(0);
    expect(p[2].flow!.newDebt).toBe(0);
  });

  it('balances in every year — assets equal liabilities and equity — and the cash-flow statement ends in the balance sheet’s cash', () => {
    for (const y of projectFinancials(base())!) expect(Math.abs(y.check)).toBeLessThan(1e-6);
    const p = projectFinancials(base())!;
    expect(p[1].flow!.closing).toBeCloseTo(p[1].cash, 6);
    expect(p[2].flow!.opening).toBeCloseTo(p[1].cash, 6);
  });

  it('works out the year-one statements by hand', () => {
    const y = projectFinancials(base())![1];
    expect(y.revenue).toBeCloseTo(1100, 6);
    expect(y.ebitda).toBeCloseTo(1100 * 0.2, 6);           // 220
    expect(y.depreciation).toBeCloseTo(50, 6);              // 10% of the opening 500
    expect(y.interest).toBeCloseTo(20, 6);                  // 8% of the opening 250
    expect(y.pbt).toBeCloseTo(150, 6);
    expect(y.tax).toBeCloseTo(37.5, 6);
    expect(y.netProfit).toBeCloseTo(112.5, 6);
    expect(y.fixedAssets).toBeCloseTo(550, 6);              // 500 + 100 capex − 50 depreciation
    expect(y.debt).toBeCloseTo(300, 6);
    expect(y.equity).toBeCloseTo(600 + 112.5 - 20, 6);      // opening equity (the balancing figure, 600) + profit − dividends
  });

  it('ties up cash when customers take longer to pay, and releases it when they pay faster', () => {
    const slow = base(); slow.tables.assumptions[0] = { ...slow.tables.assumptions[0], receivable_days: '90' };
    const fast = base(); fast.tables.assumptions[0] = { ...fast.tables.assumptions[0], receivable_days: '60' };
    const cashAt = (v: ModelValues) => projectFinancials(v)![1].cash;
    expect(cashAt(slow)).toBeLessThan(cashAt(base()));
    expect(cashAt(fast)).toBeGreaterThan(cashAt(base()));
    // 17 extra days on ₹1,100 lakh of revenue holds back 17/365 of it
    expect(cashAt(base()) - cashAt(slow)).toBeCloseTo((1100 * 17) / 365, 6);
  });

  it('reports a funding gap when cash goes negative, and says where', () => {
    const v = base(); v.fields.cash = '10'; v.tables.assumptions[0] = { ...v.tables.assumptions[0], capex: '900', new_debt: '0' };
    expect(derived('financial', v, 'funding')).toMatch(/short in Year 1/);
    expect(tone('financial', v, 'funding')).toBe('bad');
    expect(tone('financial', v, 'lowest_cash')).toBe('bad');
  });

  it('warns when cash is positive but thin — under a week of revenue', () => {
    const v = base(); v.tables.assumptions[0] = { ...v.tables.assumptions[0], capex: '210', new_debt: '0' };
    const y = projectFinancials(v)![1];
    expect(y.cash).toBeGreaterThan(0);
    expect(y.cash).toBeLessThan(y.revenue / 52);
    expect(derived('financial', v, 'funding')).toMatch(/^None, but cash is thin/);
    expect(tone('financial', v, 'funding')).toBe('warn');
  });

  it('shows the three statements as tables of worked-out figures, and nothing until the base year is entered', () => {
    expect(computeViews(def('financial'), values())[0].hasFigures).toBe(false);
    const views = computeViews(def('financial'), base());
    expect(views.map((x) => x.key)).toEqual(['income', 'balance', 'cashflow']);
    const balance = views.find((x) => x.key === 'balance')!;
    const check = balance.rows.find((r) => r.name.startsWith('Balance check'))!.cells;
    expect(check).toEqual(['0', '0', '0', '']); // base year, Year 1 and Year 2 balance; Year 3 has no growth yet, so it is blank
    const cashflow = views.find((x) => x.key === 'cashflow')!;
    expect(cashflow.columns).toEqual(['Year 1', 'Year 2', 'Year 3']);
    expect(cashflow.rows.find((r) => r.name === 'Closing cash')!.cells[2]).toBe('');
  });

  it('keeps the old revenue and EBITDA notes visible instead of dropping them', () => {
    const r = valuesFromFields(def('financial'), [
      { label: 'Latest revenue (Value Scan)', value: '9800', source: 'Manual' },
      { label: 'Capex assumption', value: '₹500 lakh a year', source: 'Manual' },
    ]);
    expect(r.values.fields.revenue).toBe('9800');
    expect(r.values.fields.notes).toContain('₹500 lakh a year');
  });
});

describe('Unit economics', () => {
  const ue = (f: Record<string, string>, tables: Record<string, Row[]> = {}) => values(f, tables);

  it('works out LTV as revenue × gross margin ÷ churn, and CAC as spend ÷ customers won', () => {
    const v = ue({ avg_revenue: '120', gross_margin: '20', annual_churn: '10', acquisition_spend: '180', new_customers: '3' });
    expect(ltv(v)).toBeCloseTo(240, 6);
    expect(cac(v)).toBeCloseTo(60, 6);
    expect(derived('unitecon', v, 'ratio')).toBe('4 to 1');
    expect(paybackMonths(v)).toBeCloseTo(30, 6);   // 60 ÷ (24 ÷ 12)
  });

  it('prefers a CAC the client already knows, then the spend, then the channels', () => {
    expect(cac(ue({ cac_known: '50', acquisition_spend: '180', new_customers: '3' }))).toBe(50);
    expect(cac(ue({ acquisition_spend: '180', new_customers: '3' }))).toBe(60);
    expect(cac(ue({}, { channels: [{ channel: 'A', spend: '100', customers: '2' }, { channel: 'B', spend: '50', customers: '1' }] }))).toBeCloseTo(50, 6);
    expect(cac(ue({}))).toBeNull();
  });

  it('rates the ratio (3 or more is healthy) and the payback (12 months or less is healthy)', () => {
    const f = (churn: string, cacKnown: string) => ue({ avg_revenue: '120', gross_margin: '50', annual_churn: churn, cac_known: cacKnown });
    expect(tone('unitecon', f('20', '30'), 'ratio')).toBe('good');   // LTV 300 ÷ 30 = 10
    expect(tone('unitecon', f('20', '150'), 'ratio')).toBe('warn');  // 300 ÷ 150 = 2
    expect(tone('unitecon', f('20', '400'), 'ratio')).toBe('bad');   // 300 ÷ 400 < 1
    expect(tone('unitecon', f('20', '30'), 'payback')).toBe('good'); // 30 ÷ (60 ÷ 12) = 6 months
    expect(tone('unitecon', f('20', '90'), 'payback')).toBe('warn'); // 18 months
    expect(tone('unitecon', f('20', '200'), 'payback')).toBe('bad'); // 40 months
  });

  it('shows the cost per customer for each channel, and handles a channel that won nothing', () => {
    expect(column('unitecon', 'channels', 'cac', { channel: 'Tenders', spend: '45', customers: '1' })).toBe('₹45 lakh');
    expect(column('unitecon', 'channels', 'cac', { channel: 'Referrals', spend: '15', customers: '0' })).toBe('');
  });

  it('cannot divide by zero churn or zero customers', () => {
    expect(ltv(ue({ avg_revenue: '120', gross_margin: '20', annual_churn: '0' }))).toBeNull();
    expect(cac(ue({ acquisition_spend: '100', new_customers: '0' }))).toBeNull();
  });
});

describe('Minimum viable financial model', () => {
  const venture = (extra: Record<string, string> = {}): ModelValues => values({
    unit_price: '2000', unit_cost: '1200', volume_month1: '1000', volume_growth: '0', collection_days: 'Paid on delivery',
    fixed_costs: '4', launch_costs: '0', starting_cash: '10', ...extra,
  });

  it('works out the margin on each unit and the break-even volume', () => {
    expect(derived('mvfm', venture(), 'unit_margin')).toBe('₹800 (40%)');
    expect(derived('mvfm', venture(), 'breakeven_units')).toBe('500 units a month'); // ₹4 lakh ÷ ₹800
  });

  it('does not crash on “Paid on delivery” — the cash arrives in the month of the sale', () => {
    const p = projectMonths(venture())!;
    expect(p).toHaveLength(12);
    expect(p[0].cashIn).toBeCloseTo(p[0].revenue, 6);
    expect(p[0].cash).toBeCloseTo(10 + 20 - 12 - 4, 6); // starting cash + received − variable − fixed
  });

  it('delays the cash by one, two or three months for 30, 60 and 90 days', () => {
    for (const [terms, lag] of [['30 days', 1], ['60 days', 2], ['90 days', 3]] as const) {
      const p = projectMonths(venture({ collection_days: terms }))!;
      for (let m = 0; m < lag; m += 1) expect(p[m].cashIn).toBe(0);
      expect(p[lag].cashIn).toBeCloseTo(p[0].revenue, 6);
    }
  });

  it('charges the launch costs in the first month only', () => {
    const p = projectMonths(venture({ launch_costs: '15' }))!;
    expect(p[0].cashOut).toBeCloseTo(12 + 4 + 15, 6);
    expect(p[1].cashOut).toBeCloseTo(12 + 4, 6);
  });

  it('finds the first profitable month, and says so when there is none within the year', () => {
    expect(derived('mvfm', venture({ volume_month1: '100', volume_growth: '30' }), 'breakeven_month')).toMatch(/^Month \d+$/);
    const never = venture({ volume_month1: '100', volume_growth: '0' });
    expect(derived('mvfm', never, 'breakeven_month')).toBe('Not within 12 months');
    expect(tone('mvfm', never, 'breakeven_month')).toBe('bad');
  });

  it('puts the funding need in the right sign and flags a balance that is still falling at Month 12', () => {
    const short = venture({ volume_month1: '100', volume_growth: '0', starting_cash: '10' });
    expect(derived('mvfm', short, 'lowest_cash')).toMatch(/^−₹[\d.]+ lakh \(Month 12, still falling\)$/);
    expect(derived('mvfm', short, 'funding')).toMatch(/^At least ₹[\d.]+ lakh more than you start with/);
    expect(output('mvfm', short, 'funding_needed')).toMatch(/^At least ₹[\d.]+ lakh more than the starting cash \(still falling in Month 12\)$/);
    expect(derived('mvfm', venture(), 'funding')).toBe('None — the starting cash is enough');
  });

  it('shows a twelve-month table of worked-out figures, with real minus signs', () => {
    const view = computeViews(def('mvfm'), venture({ volume_month1: '100', volume_growth: '0' }))[0];
    expect(view.rows).toHaveLength(12);
    expect(view.rows[0].cells[view.columns.indexOf('Fixed costs')]).toBe('−4');
    expect(view.rows.at(-1)!.cells[view.columns.indexOf('Closing cash')]).toMatch(/^−/);
  });
});

describe('the finance worked examples', () => {
  it('balance in every year, and every figure the analyses quote is what the model works out', () => {
    const v = sample('financial');
    const p = projectFinancials(v)!;
    expect(p).toHaveLength(4);
    for (const y of p) expect(Math.abs(y.check)).toBeLessThan(1e-6);
    const r = (x: number) => Math.round(x);
    expect(r(p[3].revenue)).toBe(14385);
    expect(r(p[1].cash)).toBe(535);
    expect(r(p[2].cash)).toBe(1147);
    expect(r(p[3].cash)).toBe(1607);
    expect(r(p[3].netProfit)).toBe(1263);
    expect(r(p[3].ebitda)).toBe(2374);
    expect([1, 2, 3].map((i) => r(p[i].flow!.operating))).toEqual([1115, 1323, 1580]);
    expect([1, 2, 3].map((i) => r(-p[i].flow!.capex))).toEqual([500, 1130, 700]);
    expect(r(p.slice(1).reduce((a, y) => a + y.depreciation, 0))).toBe(1238);            // "₹1,238 lakh of depreciation"
    expect(derived('financial', v, 'leverage')).toBe('1.1×');
    expect(derived('financial', v, 'interest_cover')).toBe('8.5×');
    expect(derived('financial', v, 'balance_check')).toMatch(/^Yes/);
  });

  it('give the stress results the analysis quotes', () => {
    const run = (change: (rows: Row[]) => Row[]) => { const v = sample('financial'); v.tables.assumptions = change(v.tables.assumptions); return projectFinancials(v)!; };
    const stuck = run((rows) => rows.map((x) => ({ ...x, receivable_days: '71' })));
    expect(Math.round(stuck[3].cash)).toBe(1174);                                  // ₹433 lakh below the plan's 1,607
    const noMargin = run((rows) => rows.map((x) => ({ ...x, cogs_pct: '80', opex_pct: '5.2' })));
    expect(Math.round(noMargin[3].ebitda)).toBe(2129);
    expect(Math.round(noMargin[3].cash)).toBe(1279);                               // ₹328 lakh below the plan
    const noLoan = run((rows) => rows.map((x, i) => (i === 1 ? { ...x, new_debt: '-300' } : x)));
    expect(Math.round(noLoan[2].cash)).toBe(347);
    const noLoanSlow = run((rows) => rows.map((x, i) => ({ ...x, receivable_days: '71', ...(i === 1 ? { new_debt: '-300' } : {}) })));
    expect(Math.round(noLoanSlow[2].cash)).toBe(110);
    const worse = run((rows) => rows.map((x) => ({ ...x, receivable_days: '71', cogs_pct: '80', opex_pct: '5.2' })));
    expect(Math.round(worse[3].cash)).toBe(845);
  });

  it('unit economics: ₹60 lakh to win, ₹240 lakh to earn, 4 to 1 and 30 months', () => {
    const v = sample('unitecon');
    expect(cac(v)).toBe(60);
    expect(ltv(v)).toBeCloseTo(240, 6);
    expect(derived('unitecon', v, 'ratio')).toBe('4 to 1');
    expect(derived('unitecon', v, 'payback')).toBe('30 months');
    // the levers the analysis names: a 25% margin shortens payback to 24 months and lifts the ratio to 5 to 1
    const better = { ...v, fields: { ...v.fields, gross_margin: '25' } };
    expect(paybackMonths(better)).toBeCloseTo(24, 6);
    expect(derived('unitecon', better, 'ratio')).toBe('5 to 1');
  });

  it('minimum viable model: the tooling studio’s numbers, and what changes them', () => {
    const v = sample('mvfm');
    expect(derived('mvfm', v, 'unit_margin')).toBe('₹52,500 (35%)');
    expect(derived('mvfm', v, 'breakeven_units')).toBe('9 units a month');
    expect(derived('mvfm', v, 'breakeven_month')).toBe('Month 7');
    expect(derived('mvfm', v, 'lowest_cash')).toBe('−₹11.6 lakh (Month 9)');
    expect(derived('mvfm', v, 'funding')).toBe('₹11.6 lakh more than you start with');
    const run = (extra: Record<string, string>) => projectMonths({ ...v, fields: { ...v.fields, ...extra } })!;
    const lowest = (p: ReturnType<typeof projectMonths>) => Math.min(...p!.map((m) => m.cash));
    expect(run({}).at(-1)!.cash).toBeCloseTo(-9.0, 1);
    expect(lowest(run({ collection_days: 'Paid on delivery' }))).toBeCloseTo(3.4, 1);
    expect(lowest(run({ collection_days: '90 days' }))).toBeCloseTo(-54.4, 1);
    expect(lowest(run({ unit_price: '135000' }))).toBeCloseTo(-23.6, 1);
    expect(lowest(run({ fixed_costs: '5.5' }))).toBeCloseTo(-21.6, 1);
    expect(lowest(run({ starting_cash: '45' }))).toBeCloseTo(3.4, 1);
    expect(Math.round(run({})[11].units * 10) / 10).toBe(18.6);
  });
});
