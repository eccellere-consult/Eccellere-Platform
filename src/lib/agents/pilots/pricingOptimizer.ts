import type { DeclField, DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';

/**
 * Pricing Optimizer: finding the profit-maximising price from two price tests.
 *
 * Methods (all fixed formulas, nothing estimated by AI):
 *  - Arc (midpoint) price elasticity of demand: E = [(Q2 - Q1) / ((Q1 + Q2)/2)] / [(P2 - P1) / ((P1 + P2)/2)].
 *  - Linear demand through the two tested points: Q = a - bP, with b = (Q1 - Q2)/(P2 - P1) and a = Q1 + b P1.
 *  - Profit-maximising price under linear demand: P* = (a + b c) / (2b), where c is the unit variable cost.
 *  - Profit-maximising price under constant elasticity (the Lerner / inverse-elasticity markup rule): P* = c E / (1 + E), meaningful only when E < -1.
 *  - Contribution margin = P - c; break-even volume = fixed cost / contribution margin; margin of safety = (Q - break-even) / Q.
 *  - Economic value to the customer (EVC) as the price ceiling, unit cost as the floor.
 */

const f = (field: string): Expr => ({ field });
const c = (cell: string): Expr => ({ cell });
const num = (key: string, label: string, unit: string, help: string, example: string): DeclField => ({ kind: 'field', key, label, type: 'number', unit, help, example });

const [P1, Q1, P2, Q2, COST, FIXED] = [f('p1'), f('q1'), f('p2'), f('q2'), f('unit_cost'), f('fixed_cost')];
/** arc elasticity */
const elasticity: Expr = { div: [{ div: [{ sub: [Q2, Q1] }, { div: [{ add: [Q1, Q2] }, 2] }] }, { div: [{ sub: [P2, P1] }, { div: [{ add: [P1, P2] }, 2] }] }] };
/** slope and intercept of the straight-line demand curve through the two tests */
const slope: Expr = { div: [{ sub: [Q1, Q2] }, { sub: [P2, P1] }] };
const intercept: Expr = { add: [Q1, { mul: [slope, P1] }] };
const linearOptimum: Expr = { div: [{ add: [intercept, { mul: [slope, COST] }] }, { mul: [2, slope] }] };
/** sqrt(-1 - E) is a real number only when demand is elastic (E < -1); dividing it by itself gives 1 then, and no answer otherwise, so the price is withheld when the rule does not apply. */
const elasticOnly: Expr = { sqrt: { sub: [-1, elasticity] } };
const markupOptimum: Expr = { mul: [{ div: [{ mul: [COST, elasticity] }, { add: [1, elasticity] }] }, { div: [elasticOnly, elasticOnly] }] };
const price = c('price');
const volLin: Expr = { max: [0, { sub: [intercept, { mul: [slope, price] }] }] };
const volCe: Expr = { mul: [Q2, { pow: [{ div: [price, P2] }, elasticity] }] };
const profit = (vol: Expr): Expr => ({ sub: [{ mul: [{ sub: [price, COST] }, vol] }, FIXED] });
const lo: Expr = { min: [P1, P2] };
const hi: Expr = { max: [P1, P2] };

export const PRICING_OPTIMIZER: DeclarativeTool = {
  schema: 1,
  slug: 'pricing-optimizer',
  name: 'Pricing Optimizer',
  category: 'analytical',
  does: 'Turns two real price tests into the price elasticity of your product, two demand curves and the profit-maximising price under each, with break-even volume and a candidate-price table, so a price change is based on measured response and not on habit.',
  whenToUse: 'Use it when you have sold the same product at two different prices (or can run a short test), you know the unit variable cost and the fixed cost per period, and you must set or revise a list price.',
  whenNotToUse: 'Do not use it for a brand-new product with no sales history, for products whose demand depends on contracts or tenders, or when the two tests differ in season, channel or promotion, because the difference in volume would then not be caused by price.',
  next: 'Run the recommended price as a controlled test for one cycle, record the new volume as a third data point, and rerun the tool with the two most recent tests.',
  reference: {
    originator: 'Price elasticity of demand and the inverse-elasticity markup rule (Abba Lerner, 1934); economic value to the customer after Thomas Nagle and Georg Müller, The Strategy and Tactics of Pricing',
    year: '1934 to 2018',
    summary: 'Demand falls as price rises, and elasticity measures how fast. Two observed points fix a demand curve; the best price is where one extra rupee of price gains as much margin as it loses in volume.',
    caption: 'The best price sits above unit cost by a margin set by elasticity, and below what the customer values.',
    howToRead: [
      'Elasticity below -1 means demand is elastic: a price cut raises revenue; above -1 means a price rise raises revenue.',
      'The linear and constant-elasticity answers bracket the optimum; trust the one closer to your tested prices.',
      'A price outside the tested range is a hypothesis to test in small steps, not a forecast.',
    ],
  },
  diagram: {
    template: 'scale',
    title: 'The pricing corridor',
    levels: [
      { name: 'Unit variable cost', hint: 'Floor: below this each sale loses money' },
      { name: 'Break-even price', hint: 'Covers fixed cost at the expected volume' },
      { name: 'Profit-maximising price', hint: 'Where margin gained equals volume lost' },
      { name: 'Competitor reference', hint: 'What buyers compare you with' },
      { name: 'Economic value to customer', hint: 'Ceiling: what the customer gains' },
    ],
    caption: 'Price between the floor and the ceiling, near the profit-maximising point, and test every move.',
  },
  sections: [
    {
      key: 'product',
      title: 'The product and its economics',
      summary: 'Name the product and enter its unit cost, fixed cost and the price limits set by value and competition.',
      parts: [
        { kind: 'field', key: 'product', label: 'Which product or service is being priced?', type: 'text', help: 'Name one product, pack size and channel. Mixing products in one analysis makes the elasticity meaningless.', example: 'Industrial adhesive, 5 kg pack, direct sales' },
        { kind: 'field', key: 'objective', label: 'What should the price achieve?', type: 'longtext', help: 'State the objective (profit, share, volume for a plant) and any rule such as a floor margin. The calculation maximises profit; use this to judge whether profit is the right goal.' },
        num('unit_cost', 'Variable cost per unit', '₹ per unit', 'Include only costs that rise with each unit sold: materials, direct labour, freight, commission and payment fees. Leave out rent and salaries; they go in fixed cost.', '60'),
        num('fixed_cost', 'Fixed cost for the period', '₹ per period', 'Costs that do not change with volume in the period of the price tests, such as rent, salaried staff and marketing retainers. Use the same period length as the volumes below.', '200000'),
        num('competitor_price', 'Main competitor price (optional)', '₹ per unit', 'The price of the alternative buyers most often compare you with, in the same pack size. Leave blank if there is no direct competitor.', '115'),
        num('customer_value', 'Economic value to the customer (optional)', '₹ per unit', 'What the product is worth to a typical buyer: the price of their next-best alternative plus the value of what you do better, such as lower waste or fewer stoppages. It is the ceiling.', '150'),
      ],
    },
    {
      key: 'tests',
      title: 'What the market has shown',
      summary: 'Enter two real price and volume observations for the same period length.',
      parts: [
        num('p1', 'Price in test 1', '₹ per unit', 'The price charged in the first period or market. Use the net price after discounts, as buyers actually paid.', '100'),
        num('q1', 'Volume sold in test 1', 'units per period', 'Units sold at that price over one period. Check that nothing else changed that period, such as a promotion, a stock-out or a competitor move.', '5000'),
        num('p2', 'Price in test 2 (your latest price)', '₹ per unit', 'The second price, which should be your current price. It must differ from test 1; the bigger the gap the more reliable the elasticity, up to about 15 percent.', '110'),
        num('q2', 'Volume sold in test 2', 'units per period', 'Units sold at the second price over a period of the same length as test 1.', '4400'),
      ],
    },
    {
      key: 'candidates',
      title: 'Candidate prices',
      summary: 'List the prices you are considering. The table works out volume and profit under both demand curves.',
      parts: [
        {
          kind: 'table', key: 'candidates', label: 'Prices to compare', rowLabel: 'Price', minRows: 3, maxRows: 10,
          help: 'One row per price you would consider. Include prices on both sides of the likely best one. Volume and profit are worked out for each.',
          columns: [
            { key: 'price', header: 'Price', help: 'A price per unit to evaluate.', type: 'number', unit: '₹ per unit' },
            { key: 'range', header: 'Evidence', help: 'Worked out: whether this price lies between your two tested prices (evidence) or outside them (extrapolation).', type: 'computed', rule: { op: 'when', expr: { min: [{ sub: [price, lo] }, { sub: [hi, price] }] }, gt: -0.0001, then: 'Within tested range', else: 'Outside tested range', tones: { then: 'good', else: 'warn' } } },
            { key: 'vol_lin', header: 'Volume (linear curve)', help: 'Worked out: units expected on the straight-line demand curve through your two tests.', type: 'computed', rule: { op: 'calc', expr: volLin, format: 'int' } },
            { key: 'profit_lin', header: 'Profit (linear curve)', help: 'Worked out: (price minus variable cost) times volume, minus fixed cost.', type: 'computed', rule: { op: 'calc', expr: profit(volLin), format: 'int' } },
            { key: 'vol_ce', header: 'Volume (constant elasticity)', help: 'Worked out: units expected if each 1 percent price change moves volume by the same percent.', type: 'computed', rule: { op: 'calc', expr: volCe, format: 'int' } },
            { key: 'profit_ce', header: 'Profit (constant elasticity)', help: 'Worked out: (price minus variable cost) times volume, minus fixed cost, on the constant-elasticity curve.', type: 'computed', rule: { op: 'calc', expr: profit(volCe), format: 'int' } },
          ],
        },
      ],
    },
    {
      key: 'plan',
      title: 'Price test and action plan',
      summary: 'Turn the recommendation into a controlled price test with owners and measures.',
      parts: [
        { kind: 'field', key: 'decision_made', label: 'What price did you choose, and why?', type: 'longtext', help: 'Write the chosen price, the model that supported it, and the guardrail that would make you reverse it, so the decision can be reviewed against results later.' },
        {
          kind: 'table', key: 'actions', label: 'Actions for the next 90 days', rowLabel: 'Action', minRows: 3, maxRows: 12,
          help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.',
          columns: [
            { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
            { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Sales Head, not a named person.', type: 'text' },
            { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
            { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
          ],
        },
      ],
    },
  ],
  derived: [
    { key: 'elasticity', label: 'Price elasticity (arc)', help: 'The percent change in volume for a one percent change in price, using midpoints. Below -1 is elastic.', rule: { op: 'calc', expr: elasticity, format: 'dp2' } },
    { key: 'reading', label: 'How demand responds', rule: { op: 'when', expr: elasticity, lt: -1, then: 'Elastic: a price cut raises revenue, a rise lowers it', else: 'Inelastic: a price rise raises revenue and volume falls less', tones: { then: 'warn', else: 'good' } } },
    { key: 'slope', label: 'Volume lost per ₹1 price rise', help: 'The slope b of the straight-line demand curve Q = a - bP.', rule: { op: 'calc', expr: slope, format: 'dp1' } },
    { key: 'cm_unit', label: 'Contribution per unit at your latest price', help: 'Latest price minus variable cost.', rule: { op: 'calc', expr: { sub: [P2, COST] }, format: 'dp2' } },
    { key: 'cm_pct', label: 'Contribution margin at your latest price', rule: { op: 'calc', expr: { mul: [{ div: [{ sub: [P2, COST] }, P2] }, 100] }, format: 'dp1', suffix: '%' } },
    { key: 'break_even', label: 'Break-even volume at your latest price', help: 'Fixed cost divided by contribution per unit: the units needed per period to cover fixed cost.', rule: { op: 'calc', expr: { div: [FIXED, { sub: [P2, COST] }] }, format: 'int' } },
    { key: 'safety', label: 'Margin of safety at your latest price', help: 'How far volume can fall before profit is zero, as a share of current volume.', rule: { op: 'calc', expr: { mul: [{ div: [{ sub: [Q2, { div: [FIXED, { sub: [P2, COST] }] }] }, Q2] }, 100] }, format: 'dp1', suffix: '%' } },
    { key: 'headroom', label: 'Room below the customer-value ceiling', help: 'Economic value to the customer minus the linear-curve optimal price. Negative means the optimum sits above what customers gain.', rule: { op: 'calc', expr: { sub: [f('customer_value'), linearOptimum] }, format: 'dp1' } },
  ],
  outputs: [
    { key: 'p_linear', label: 'Profit-maximising price (linear curve)', rule: { op: 'calc', expr: linearOptimum, format: 'dp1' } },
    { key: 'p_markup', label: 'Profit-maximising price (constant elasticity)', rule: { op: 'when', expr: elasticity, lt: -1, then: 'See the figure below: valid because demand is elastic', else: 'Not defined: demand is not elastic, so the markup rule has no maximum', tones: { then: 'good', else: 'warn' } } },
    { key: 'p_markup_value', label: 'Constant-elasticity price', rule: { op: 'calc', expr: markupOptimum, format: 'dp1' }, conditional: true },
    { key: 'best_linear', label: 'Best candidate (linear curve)', rule: { op: 'top', table: 'candidates', by: 'profit_lin', label: 'price' } },
    { key: 'best_ce', label: 'Best candidate (constant elasticity)', rule: { op: 'top', table: 'candidates', by: 'profit_ce', label: 'price' } },
  ],
  analysisGuide: 'State the elasticity and say whether demand is elastic. Compare the two optimal prices: if they are close, report that range with confidence; if they are far apart or lie outside the two tested prices, say the optimum is a hypothesis and recommend moving in steps of 5 to 10 percent with a review after one cycle. Check the price against the corridor: it must be above unit cost, should clear break-even volume with a healthy margin of safety, and should stay below the customer value ceiling and near the competitor reference. Warn when the two tests differ in more than price, when the price gap is under about 5 percent (elasticity then unreliable), and when volume at the optimum would exceed capacity. Recommend one price, the test design, the stop-loss rule and the owner.',
  sample: {
    scenario: 'A fictional industrial adhesive maker sold 5,000 packs a month at ₹100 and 4,400 packs a month at ₹110, with ₹60 variable cost per pack and ₹2,00,000 fixed cost a month. It wants to know the best price.',
    values: {
      product: 'Industrial adhesive, 5 kg pack, direct sales',
      objective: 'Maximise monthly profit while keeping contribution margin above 40 percent.',
      unit_cost: '60', fixed_cost: '200000', competitor_price: '115', customer_value: '150',
      p1: '100', q1: '5000', p2: '110', q2: '4400',
      decision_made: 'Move from ₹110 to ₹120 for one month in two regions. The linear curve puts the optimum near ₹122, but that is outside the tested range, so we go in a step and review volume before going further.',
    },
    tables: {
      candidates: [{ price: '100' }, { price: '110' }, { price: '120' }, { price: '130' }, { price: '140' }],
      actions: [
        { action: 'Raise the price to ₹120 in two pilot regions', owner: 'Sales Head', measure: 'Volume per region against the ₹110 baseline', horizon: '30 days' },
        { action: 'Agree a stop-loss: revert if volume falls more than 15 percent', owner: 'Finance Director', measure: 'Rule written and approved', horizon: '30 days' },
        { action: 'Rerun the tool with the new data point', owner: 'Pricing Analyst', measure: 'Updated elasticity recorded', horizon: '60 days' },
      ],
    },
  },
};
