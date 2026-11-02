import { describe, expect, it } from 'vitest';
import { getModelDefinition } from '../lib/strategyModels/registry';
import { computeDerived, computeOutputs, evalColumn, tablePartsOf, valuesFromFields } from '../lib/strategyModels/values';
import { dpmPolicy, geCell, horizonForYears, parentingZone } from '../lib/strategyModels/defs/portfolio';
import type { ModelValues, Row } from '../lib/strategyModels/types';

/** The rules each model applies to the client's answers — checked directly, so a rule cannot drift from the model it implements. */
const def = (id: string) => getModelDefinition(id)!;
const values = (fields: Record<string, string> = {}, tables: Record<string, Row[]> = {}): ModelValues => ({ fields, tables });
const derived = (id: string, v: ModelValues, key: string): string | null => computeDerived(def(id), v).find((d) => d.key === key)!.value;
const output = (id: string, v: ModelValues, key: string): string | undefined => computeOutputs(def(id), v).find((o) => o.key === key)?.value;
const column = (id: string, table: string, key: string, row: Row, v: ModelValues = values()): string => {
  const t = tablePartsOf(def(id)).find((x) => x.key === table)!;
  return evalColumn(t.columns.find((c) => c.key === key)!, row, v);
};

describe('GE–McKinsey nine-box', () => {
  const zone = (attractiveness: number, strength: number) => geCell({ attractiveness: String(attractiveness), strength: String(strength) })?.zone;

  it('reads 4–5 as high, 3 as middle and 1–2 as low, on both axes', () => {
    expect(zone(5, 5)).toBe('Invest / grow');
    expect(zone(4, 3)).toBe('Invest / grow');
    expect(zone(4, 2)).toBe('Invest selectively');
    expect(zone(3, 5)).toBe('Invest / grow');
    expect(zone(3, 3)).toBe('Invest selectively');
    expect(zone(3, 1)).toBe('Harvest / divest');
    expect(zone(2, 5)).toBe('Invest selectively');
    expect(zone(1, 3)).toBe('Harvest / divest');
    expect(zone(1, 1)).toBe('Harvest / divest');
  });

  it('puts all nine cells in exactly three zones, with the diagonal band selective', () => {
    const cells = [5, 3, 1].flatMap((a) => [5, 3, 1].map((s) => zone(a, s)));
    expect(cells.filter((z) => z === 'Invest / grow')).toHaveLength(3);
    expect(cells.filter((z) => z === 'Invest selectively')).toHaveLength(3);
    expect(cells.filter((z) => z === 'Harvest / divest')).toHaveLength(3);
  });

  it('says nothing until both ratings are given, and works out the revenue in the harvest cells', () => {
    expect(geCell({ attractiveness: '4' })).toBeNull();
    const v = values({}, { units: [
      { unit: 'A', revenue: '600', attractiveness: '1', strength: '1' },
      { unit: 'B', revenue: '400', attractiveness: '5', strength: '5' },
    ] });
    expect(derived('ge9box', v, 'harvest_share')).toBe('60%');
    expect(derived('ge9box', v, 'zones')).toBe('Grow 1 · Selective 0 · Harvest 1');
  });
});

describe('Directional Policy Matrix', () => {
  const policy = (capability: number, prospects: number) => dpmPolicy({ capability: String(capability), prospects: String(prospects) });

  it('names Shell\'s policy for each of the nine cells', () => {
    expect([policy(5, 1), policy(5, 3), policy(5, 5)]).toEqual(['Cash generation', 'Growth', 'Leader']);
    expect([policy(3, 1), policy(3, 3), policy(3, 5)]).toEqual(['Phased withdrawal', 'Custodial', 'Try harder']);
    expect([policy(1, 1), policy(1, 3), policy(1, 5)]).toEqual(['Disinvest', 'Phased withdrawal', 'Double or quit']);
  });

  it('is blank until both ratings are given', () => {
    expect(dpmPolicy({ capability: '5' })).toBe('');
  });
});

describe('Corporate parenting fit', () => {
  const zone = (opportunity: number, fit: number) => parentingZone({ opportunity: String(opportunity), fit: String(fit) });

  it('puts the extremes in the four corners and everything in between at the edge of the heartland', () => {
    expect(zone(5, 5)).toBe('Heartland');
    expect(zone(4, 4)).toBe('Heartland');
    expect(zone(5, 1)).toBe('Value trap');
    expect(zone(1, 5)).toBe('Ballast');
    expect(zone(2, 2)).toBe('Alien territory');
    for (const [o, f] of [[3, 3], [4, 3], [3, 4], [5, 3], [3, 1], [2, 3]]) expect(zone(o, f), `${o},${f}`).toBe('Edge of heartland');
  });
});

describe('Three Horizons', () => {
  it('puts up to two years in Horizon 1, two to five in Horizon 2 and beyond in Horizon 3', () => {
    expect([1, 2].map(horizonForYears)).toEqual(['Horizon 1', 'Horizon 1']);
    expect([2.5, 5].map(horizonForYears)).toEqual(['Horizon 2', 'Horizon 2']);
    expect([5.1, 8].map(horizonForYears)).toEqual(['Horizon 3', 'Horizon 3']);
  });

  it('flags an initiative whose timing belongs to another horizon, and splits the investment', () => {
    const v = values({}, { initiatives: [
      { initiative: 'Core fix', horizon: 'Horizon 1', investment: '100', years: '1' },
      { initiative: 'Far-off bet', horizon: 'Horizon 2', investment: '300', years: '8' },
    ] });
    expect(column('horizons3', 'initiatives', 'timing', v.tables.initiatives[1])).toBe('Timing looks like Horizon 3');
    expect(column('horizons3', 'initiatives', 'timing', v.tables.initiatives[0])).toBe('Fits the horizon');
    expect(derived('horizons3', v, 'misplaced')).toBe('Far-off bet');
    expect(derived('horizons3', v, 'split')).toBe('H1 25% · H2 75% · H3 0%');
  });

  it('warns when everything is in Horizon 1', () => {
    const v = values({}, { initiatives: [{ initiative: 'Core', horizon: 'Horizon 1', investment: '50', years: '1' }] });
    expect(derived('horizons3', v, 'future')).toBe('No — everything is in Horizon 1');
    expect(computeDerived(def('horizons3'), v).find((d) => d.key === 'future')!.tone).toBe('bad');
  });
});

describe('Porter\'s generic strategies', () => {
  it('scores fit with capabilities + fit with the industry + (6 − risk), out of 15', () => {
    expect(column('portergeneric', 'strategies', 'score', { capability: '5', industry: '4', risk: '2' })).toBe('13 / 15');
    expect(column('portergeneric', 'strategies', 'score', { capability: '1', industry: '1', risk: '5' })).toBe('3 / 15');
    expect(column('portergeneric', 'strategies', 'score', { capability: '5', industry: '4' })).toBe('');
  });

  it('compares the chosen strategy with the highest score, and warns about no clear choice', () => {
    const tables = { strategies: [
      { strategy: 'Cost leadership', capability: '2', industry: '2', risk: '4' },
      { strategy: 'Differentiation focus', capability: '5', industry: '4', risk: '2' },
    ] };
    expect(derived('portergeneric', values({ chosen: 'Differentiation focus' }, tables), 'choice_check')).toBe('Differentiation focus matches the highest score');
    expect(derived('portergeneric', values({ chosen: 'Cost leadership' }, tables), 'choice_check')).toContain('differs from the highest score (Differentiation focus)');
    expect(derived('portergeneric', values({ chosen: 'No clear choice yet (stuck in the middle)' }, tables), 'choice_check')).toContain('stuck in the middle');
  });
});

describe('Value chain', () => {
  const reading = (row: Row) => column('valuechain', 'activities', 'reading', row);

  it('marks sources of advantage, costly weak spots and weaknesses', () => {
    expect(reading({ cost_share: '4', edge: 'Ahead of rivals', role: 'Cuts cost' })).toBe('Source of advantage');
    expect(reading({ cost_share: '4', edge: 'Ahead of rivals', role: 'Neither (necessary only)' })).toBe('');
    expect(reading({ cost_share: '30', edge: 'Behind rivals', role: 'Both' })).toBe('Costly and weak — fix first');
    expect(reading({ cost_share: '30', edge: 'On par', role: 'Both' })).toBe('Costly — look for savings');
    expect(reading({ cost_share: '3', edge: 'Behind rivals', role: 'Both' })).toBe('A weakness to fix');
  });

  it('checks the cost shares add up to about 100%', () => {
    const rowsOf = (...shares: string[]) => values({}, { activities: shares.map((cost_share, i) => ({ activity: `A${i}`, cost_share })) });
    expect(derived('valuechain', rowsOf('60', '40'), 'cost_total')).toBe('100%');
    expect(computeDerived(def('valuechain'), rowsOf('60', '40')).find((d) => d.key === 'cost_total')!.tone).toBe('good');
    expect(computeDerived(def('valuechain'), rowsOf('60', '10')).find((d) => d.key === 'cost_total')!.tone).toBe('warn');
  });
});

describe('Scenario planning', () => {
  it('marks as candidate axes only the uncertainties rated 4 or 5 on both impact and uncertainty', () => {
    expect(column('scenario', 'uncertainties', 'candidate', { impact: '5', uncertainty: '4' })).toBe('Candidate axis');
    expect(column('scenario', 'uncertainties', 'candidate', { impact: '5', uncertainty: '3' })).toBe('');
    expect(column('scenario', 'uncertainties', 'candidate', { impact: '3', uncertainty: '5' })).toBe('');
  });
});

describe('Game theory', () => {
  const grid = (...p: [number, number][]): ModelValues => values(
    { option_a: 'Hold', option_b: 'Cut', response_1: 'Hold', response_2: 'Cut' },
    { payoffs: ['Option A → Response 1', 'Option A → Response 2', 'Option B → Response 1', 'Option B → Response 2'].map((outcome, i) => ({ outcome, your_payoff: String(p[i][0]), rival_payoff: String(p[i][1]) })) },
  );

  it('finds the equilibrium of a prisoner\'s dilemma and says both could do better', () => {
    const v = grid([3, 3], [0, 4], [4, 0], [1, 1]);
    expect(derived('gametheory', v, 'equilibrium')).toBe('Cut / Cut');
    expect(derived('gametheory', v, 'dilemma')).toContain('both would earn more at Hold / Hold');
    expect(derived('gametheory', v, 'rival_replies')).toBe('To A: response 2 · To B: response 2');
  });

  it('marks each side\'s best replies in the table', () => {
    const v = grid([3, 3], [0, 4], [4, 0], [1, 1]);
    const rows = v.tables.payoffs;
    expect(rows.map((r) => column('gametheory', 'payoffs', 'rival_best', r, v))).toEqual(['', 'Yes', '', 'Yes']);
    expect(rows.map((r) => column('gametheory', 'payoffs', 'you_best', r, v))).toEqual(['', '', 'Yes', 'Yes']);
  });

  it('reports no stable outcome when the best replies chase each other (matching pennies)', () => {
    expect(derived('gametheory', grid([1, -1], [-1, 1], [-1, 1], [1, -1]), 'equilibrium')).toBe('No stable outcome in pure choices');
  });

  it('finds a game with a good equilibrium and says nobody can do better', () => {
    const v = grid([5, 5], [1, 2], [2, 1], [0, 0]);
    expect(derived('gametheory', v, 'equilibrium')).toBe('Hold / Hold');
    expect(derived('gametheory', v, 'dilemma')).toBe('No — nobody can do better for both');
  });

  it('works out nothing until all four payoffs are in', () => {
    expect(derived('gametheory', values({}, { payoffs: [{ outcome: 'Option A → Response 1', your_payoff: '3', rival_payoff: '3' }] }), 'equilibrium')).toBeNull();
  });
});

describe('Make, buy or ally', () => {
  const indicated = (build: string, borrow: string, buy: string) => derived('makebuyally', values({}, { routes: [
    { route: 'Build (make)', answer: build }, { route: 'Borrow (ally or contract)', answer: borrow }, { route: 'Buy (acquire)', answer: buy },
  ] }), 'indicated');

  it('asks the questions in order: build, then borrow, then buy', () => {
    expect(indicated('Yes', 'Yes', 'Yes')).toBe('Build (make)');
    expect(indicated('No', 'Yes', 'Yes')).toBe('Borrow (ally or contract)');
    expect(indicated('Partly', 'No', 'Yes')).toBe('Buy (acquire)');
  });

  it('combines routes when several only partly hold, and says so when none does', () => {
    expect(indicated('Partly', 'Partly', 'No')).toBe('Combine routes (build + borrow)');
    expect(indicated('No', 'No', 'No')).toBe('No route fits — revisit the need');
    expect(indicated('', '', '')).toBeNull();
  });
});

describe('M&A synergy map', () => {
  const synergies = (...rows: Row[]) => values({ standalone_value: '500', price: '700' }, { synergies: rows });

  it('values risk-adjusted synergies over five years from the year each begins, less the one-off costs', () => {
    // 100 a year at 100% from year 1, discounted at 10%: 100 × (1/1.1 + 1/1.1² + … + 1/1.1⁵) = 379.08
    const v = { ...synergies({ type: 'Cost', value: '100', probability: '100', starts: 'Year 1', one_off: '0' }), fields: { discount_rate: '10', standalone_value: '500', price: '700' } };
    expect(derived('masynergy', v, 'npv')).toBe('₹379 lakh');
    const withCost = { ...v, tables: { synergies: [{ type: 'Cost', value: '100', probability: '100', starts: 'Year 1', one_off: '79' }] } };
    expect(derived('masynergy', withCost, 'npv')).toBe('₹300 lakh');
  });

  it('weights a synergy by its probability, delays it to its first full year, and counts a dis-synergy as a loss', () => {
    const v = { ...synergies({ type: 'Revenue', value: '100', probability: '50', starts: 'Year 3', one_off: '0' }), fields: { discount_rate: '10' } };
    // 50 a year from year 3 to 5
    expect(derived('masynergy', v, 'npv')).toBe(`₹${Math.round(50 * (1 / 1.1 ** 3 + 1 / 1.1 ** 4 + 1 / 1.1 ** 5))} lakh`);
    const loss = { ...synergies({ type: 'Dis-synergy (a cost or loss)', value: '10', probability: '100', starts: 'Year 1', one_off: '0' }), fields: { discount_rate: '10' } };
    expect(derived('masynergy', loss, 'run_rate')).toBe('−₹10 lakh a year');
    expect(column('masynergy', 'synergies', 'risked', { type: 'Dis-synergy (a cost or loss)', value: '10', probability: '100' })).toBe('−₹10 lakh');
  });

  it('uses 12% when no discount rate is given, and compares the premium with the synergies', () => {
    const v = synergies({ type: 'Cost', value: '100', probability: '100', starts: 'Year 1', one_off: '0' });
    expect(derived('masynergy', v, 'npv')).toBe('₹360 lakh');
    expect(derived('masynergy', v, 'premium_check')).toContain('Premium of ₹200 lakh is covered — headroom ₹160 lakh');
    expect(derived('masynergy', { ...v, fields: { standalone_value: '500', price: '1000' } }, 'premium_check')).toContain('₹140 lakh more than the synergies are worth');
    expect(output('masynergy', { ...v, fields: { standalone_value: '500', price: '1000' } }, 'premium_check')).toContain('Not covered');
  });
});

describe('Pivot or persist', () => {
  const answers = (core: number, reinvent: number, stay: number): ModelValues => values({}, { tests: [
    { question: 'Is the core still defensible?', score: String(core) },
    { question: 'Is there a credible reinvention path?', score: String(reinvent) },
    { question: 'Is staying the best use of the capital and team?', score: String(stay) },
  ] });
  const path = (c: number, r: number, s: number) => derived('pivotpersist', answers(c, r, s), 'indicated');

  it('persists when the core is defensible and staying is worth it', () => {
    expect(path(4, 2, 4)).toBe('Persist (defend the core)');
    expect(path(5, 1, 3)).toBe('Persist (defend the core)');
  });

  it('pivots when the core is weak but reinvention is credible', () => {
    expect(path(2, 4, 3)).toBe('Pivot (reinvent)');
    expect(path(3, 5, 4)).toBe('Pivot (reinvent)');
  });

  it('exits when staying is not the best use, or when neither the core nor reinvention holds', () => {
    expect(path(5, 5, 2)).toBe('Exit and redeploy');
    expect(path(2, 2, 4)).toBe('Exit and redeploy');
  });

  it('says the evidence is unclear in the middle, and waits for all three scores', () => {
    expect(path(3, 3, 3)).toBe('Unclear — gather more evidence first');
    expect(derived('pivotpersist', values({}, { tests: [{ question: 'Is the core still defensible?', score: '4' }] }), 'indicated')).toBeNull();
  });

  it('only offers the new direction when pivoting', () => {
    const f = (path: string) => values({ recommended_path: path, h3_direction: 'EV housings', wind_down: 'Sell the line' });
    expect(output('pivotpersist', f('Pivot (reinvent)'), 'h3_direction')).toBe('EV housings');
    expect(output('pivotpersist', f('Persist (defend the core)'), 'h3_direction')).toBeUndefined();
    expect(output('pivotpersist', f('Exit and redeploy'), 'wind_down')).toBe('Sell the line');
  });

  it('works out the revenue trend from the three years', () => {
    const v = values({}, { trend: [
      { year: 'Three years ago', revenue: '100' }, { year: 'Two years ago', revenue: '110' }, { year: 'Last year', revenue: '121' },
    ] });
    expect(derived('pivotpersist', v, 'growth')).toBe('+10% a year');
    expect(column('pivotpersist', 'trend', 'change', v.tables.trend[2], v)).toBe('+10%');
  });

  it('carries the two scores saved by the earlier version into their rows, and the old path if it is valid', () => {
    const r = valuesFromFields(def('pivotpersist'), [
      { label: 'Is the core still defensible? (1-5)', value: '4', source: 'Manual' },
      { label: 'Is there a credible reinvention path? (1-5)', value: 'high', source: 'Manual' },
      { label: 'Recommended path', value: 'Pivot', source: 'Manual' },
    ]);
    expect(r.values.tables.tests).toEqual([{ question: 'Is the core still defensible?', score: '4' }]);
    expect(r.values.fields.recommended_path).toBe('Pivot (reinvent)');
    expect(r.unmatched.map((f) => f.label)).toEqual(['Is there a credible reinvention path? (1-5)']); // not a 1-5 score: kept visible
  });
});
