import type { DeclField, DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';

/**
 * Demand Forecaster: a trend forecast with its error, and the stock policy that follows from it.
 *
 * Methods (all fixed formulas, nothing estimated by AI):
 *  - Ordinary least-squares linear trend d = a + b t:  b = (n Σtd - Σt Σd) / (n Σt² - (Σt)²),  a = (Σd - b Σt) / n  (Legendre / Gauss).
 *  - Sum of squared errors from the sums:  SSE = Σd² - a Σd - b Σtd;  standard error of the estimate  s = sqrt(SSE / (n - 2));  R² = 1 - SSE / SST,  SST = Σd² - (Σd)²/n.
 *  - Safety stock = z s sqrt(L), z the standard normal quantile of the service level (inverse normal).
 *  - Reorder point = forecast demand per period x lead time + safety stock.
 *  - Economic order quantity (Harris, 1913): EOQ = sqrt(2 D S / H), with H = holding rate x unit cost; annual ordering plus holding cost at EOQ = sqrt(2 D S H).
 * Seasonality is NOT modelled: the tool says so and flags a poor fit.
 */

const f = (field: string): Expr => ({ field });
const num = (key: string, label: string, unit: string, help: string, example: string): DeclField => ({ kind: 'field', key, label, type: 'number', unit, help, example });
const sum = (col: string): Expr => ({ agg: 'sum', table: 'history', col });
const n: Expr = { agg: 'count', table: 'history', col: 'demand' };
const [St, Sd, Std, Stt, Sdd] = [sum('period'), sum('demand'), sum('td'), sum('tt'), sum('dd')];
const slope: Expr = { div: [{ sub: [{ mul: [n, Std] }, { mul: [St, Sd] }] }, { sub: [{ mul: [n, Stt] }, { pow: [St, 2] }] }] };
const intercept: Expr = { div: [{ sub: [Sd, { mul: [slope, St] }] }, n] };
const sse: Expr = { sub: [{ sub: [Sdd, { mul: [intercept, Sd] }] }, { mul: [slope, Std] }] };
const sst: Expr = { sub: [Sdd, { div: [{ pow: [Sd, 2] }, n] }] };
const se: Expr = { sqrt: { div: [sse, { sub: [n, 2] }] } };
const nextT: Expr = { add: [{ agg: 'max', table: 'history', col: 'period' }, f('horizon')] };
const forecast: Expr = { max: [0, { add: [intercept, { mul: [slope, nextT] }] }] };
const z: Expr = { nsinv: { div: [f('service'), 100] } };
const safety: Expr = { mul: [z, se, { sqrt: f('lead')}] };
const holding: Expr = { mul: [{ div: [f('hold_pct'), 100] }, f('unit_cost')] };
const eoq: Expr = { sqrt: { div: [{ mul: [2, f('annual'), f('order_cost')] }, holding] } };

export const DEMAND_FORECASTER: DeclarativeTool = {
  schema: 1,
  slug: 'demand-forecaster',
  name: 'Demand Forecaster',
  category: 'analytical',
  does: 'Fits a straight-line trend through your past demand, forecasts the coming period with a measure of how far off it has been, and turns that into a safety stock, a reorder point and an economic order quantity so inventory is set by arithmetic, not by habit.',
  whenToUse: 'Use it when you have at least six regular periods (weeks or months) of demand for one product, demand moves with a steady trend, and you must decide how much to stock and when to reorder.',
  whenNotToUse: 'Do not use it for a new product with little history, for strongly seasonal products (the straight line ignores the season), or for demand driven by a few large orders; it will understate the swings.',
  next: 'Replace the history with the latest period every cycle, compare last cycle’s forecast with what was sold, and take the reorder point into the purchase plan.',
  reference: {
    originator: 'Least-squares regression (Legendre, 1805; Gauss, 1809); economic order quantity (Ford W. Harris, 1913); safety stock under normal demand (standard inventory theory)',
    year: '1805 to 1913',
    summary: 'A trend line summarises where demand is heading, the scatter around it measures uncertainty, and the stock policy buys protection against that uncertainty at a chosen service level.',
    caption: 'The forecast sets the average need; the scatter and the lead time set the safety buffer; cost sets the order size.',
    howToRead: [
      'R² near 1 means the trend explains the history; below about 0.5 the line is a weak guide and the policy numbers are rough.',
      'The standard error is the typical gap between the line and actual demand, in units per period.',
      'A higher service level needs more safety stock, and the cost rises faster as you approach 100 percent.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From history to a stock policy',
    steps: [
      { name: 'Collect the history', hint: 'Regular periods, one product' },
      { name: 'Fit the trend', hint: 'Least-squares line' },
      { name: 'Measure the error', hint: 'Standard error and R²' },
      { name: 'Set service level', hint: 'Safety stock for the lead time' },
      { name: 'Order smartly', hint: 'Reorder point and EOQ' },
    ],
    caption: 'Every number below the forecast follows from the forecast, its error and the policy you choose.',
  },
  sections: [
    {
      key: 'policy',
      title: 'The product and the stocking policy',
      summary: 'Name the product and enter the costs and service target that drive the stock policy.',
      parts: [
        { kind: 'field', key: 'product', label: 'Which product is being forecast?', type: 'text', help: 'Name one product or product family with similar demand. Mixing items with different patterns spoils the fit.', example: 'Industrial adhesive, 5 kg pack' },
        num('horizon', 'Periods ahead to forecast', 'periods', 'How many periods after the last one in the history you want the forecast for. Use 1 for the next period.', '1'),
        num('lead', 'Supplier lead time', 'periods', 'Time from placing an order to receiving it, in the same period unit as the history. A fraction is allowed.', '2'),
        num('service', 'Service level target', '%', 'The share of replenishment cycles in which you want no stock-out, for example 95. Between 50 and 99.9.', '95'),
        num('annual', 'Annual demand', 'units per year', 'Total units expected in a year, used to size the order. Use your forecast scaled to a year if you have no better number.', '1500'),
        num('order_cost', 'Cost of placing one order', '₹ per order', 'Everything an order costs regardless of size: purchase processing, freight per shipment, inspection.', '500'),
        num('unit_cost', 'Cost of one unit', '₹ per unit', 'What a unit costs you to buy or make, used to value the stock you hold.', '200'),
        num('hold_pct', 'Holding cost rate', '% of unit cost per year', 'Yearly cost of keeping stock as a share of its value: capital cost, storage, insurance and obsolescence. 15 to 30 is common; use your own.', '20'),
      ],
    },
    {
      key: 'data',
      title: 'Demand history',
      summary: 'Enter past demand, one row per period, numbered in order.',
      parts: [
        {
          kind: 'table', key: 'history', label: 'Demand by period', rowLabel: 'Period', minRows: 6, maxRows: 60,
          help: 'One row per period in time order, numbered 1, 2, 3 and so on with no gaps. Use actual units sold or shipped; where a stock-out hid demand, use the demand you could not meet.',
          columns: [
            { key: 'period', header: 'Period number', help: 'The sequence number of the period: 1 for the oldest, then 2, 3 and so on.', type: 'number' },
            { key: 'demand', header: 'Demand', help: 'Units demanded in that period.', type: 'number', unit: 'units' },
            { key: 'td', header: 'Period x demand', help: 'Worked out: period number times demand, used by the trend fit.', type: 'computed', rule: { op: 'calc', expr: { mul: [{ cell: 'period' }, { cell: 'demand' }] } } },
            { key: 'tt', header: 'Period squared', help: 'Worked out: period number squared, used by the trend fit.', type: 'computed', rule: { op: 'calc', expr: { pow: [{ cell: 'period' }, 2] } } },
            { key: 'dd', header: 'Demand squared', help: 'Worked out: demand squared, used to measure the fit.', type: 'computed', rule: { op: 'calc', expr: { pow: [{ cell: 'demand' }, 2] } } },
            { key: 'fitted', header: 'Trend line', help: 'Worked out: where the straight-line trend puts demand in this period.', type: 'computed', rule: { op: 'calc', expr: { add: [intercept, { mul: [slope, { cell: 'period' }] }] }, format: 'dp1' } },
            { key: 'gap', header: 'Actual minus trend', help: 'Worked out: how far actual demand was above (positive) or below (negative) the trend line.', type: 'computed', rule: { op: 'calc', expr: { sub: [{ cell: 'demand' }, { add: [intercept, { mul: [slope, { cell: 'period' }] }] }] }, format: 'dp1' } },
          ],
        },
      ],
    },
    {
      key: 'plan',
      title: 'Decision and action plan',
      summary: 'Record the policy you adopt and the first actions to put it into practice.',
      parts: [
        { kind: 'field', key: 'decision_made', label: 'Which stock policy did you adopt, and why?', type: 'longtext', help: 'Write the reorder point and order quantity chosen, the service level, and what would make you revisit them.' },
        {
          kind: 'table', key: 'actions', label: 'Actions for the next 90 days', rowLabel: 'Action', minRows: 3, maxRows: 12,
          help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.',
          columns: [
            { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
            { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Purchase Manager, not a named person.', type: 'text' },
            { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
            { key: 'horizon_when', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
          ],
        },
      ],
    },
  ],
  derived: [
    { key: 'periods_used', label: 'Periods of history used', rule: { op: 'calc', expr: n, format: 'int' } },
    { key: 'trend', label: 'Trend: change in demand per period', help: 'The slope b of the fitted line, in units per period. Positive means growing demand.', rule: { op: 'calc', expr: slope, format: 'dp2' } },
    { key: 'base', label: 'Trend line value at period 0', help: 'The intercept a of the fitted line.', rule: { op: 'calc', expr: intercept, format: 'dp1' } },
    { key: 'se', label: 'Standard error (typical miss)', help: 'The typical gap between the trend line and actual demand, in units per period.', rule: { op: 'calc', expr: se, format: 'dp1' } },
    { key: 'r2', label: 'R² (how much the trend explains)', help: '1 minus unexplained variation over total variation. 1 is a perfect line, 0 means the line explains nothing.', rule: { op: 'calc', expr: { sub: [1, { div: [sse, sst] }] }, format: 'dp2' } },
    { key: 'fit_reading', label: 'How good is the fit', rule: { op: 'when', expr: { sub: [1, { div: [sse, sst] }] }, gt: 0.5, then: 'The trend explains most of the history', else: 'Weak fit: seasonality or irregular demand is likely, so treat the numbers as rough', tones: { then: 'good', else: 'warn' } } },
    { key: 'z', label: 'Service factor z', help: 'The standard normal value for the chosen service level.', rule: { op: 'calc', expr: z, format: 'dp2' } },
    { key: 'orders_year', label: 'Orders per year at the economic quantity', rule: { op: 'calc', expr: { div: [f('annual'), eoq] }, format: 'dp1' } },
    { key: 'cycle_cost', label: 'Ordering plus holding cost per year at EOQ', help: 'The square root of 2 x annual demand x order cost x holding cost per unit.', rule: { op: 'calc', expr: { sqrt: { mul: [2, f('annual'), f('order_cost'), holding] } }, format: 'int' } },
  ],
  outputs: [
    { key: 'forecast', label: 'Forecast demand (units in the target period)', rule: { op: 'calc', expr: forecast, format: 'int' } },
    { key: 'safety_stock', label: 'Safety stock', rule: { op: 'calc', expr: safety, format: 'int' } },
    { key: 'reorder_point', label: 'Reorder point', rule: { op: 'calc', expr: { add: [{ mul: [forecast, f('lead')] }, safety] }, format: 'int' } },
    { key: 'eoq', label: 'Economic order quantity', rule: { op: 'calc', expr: eoq, format: 'int' } },
  ],
  analysisGuide: 'Report the forecast, the trend direction and the standard error, and state R². If R² is below 0.5, say that seasonality or irregular demand is probably present and the forecast is a rough guide; recommend a seasonal method outside this tool. Explain the reorder point as lead-time demand plus safety stock, and the economic order quantity as the cheapest order size, and compare the order quantity with storage limits and supplier minimums. Warn when the history is shorter than 6 periods, when the forecast is clamped at zero, and when the service level above 99 would make safety stock very large. Recommend one policy, who reviews it, and when the forecast is compared with actual sales.',
  sample: {
    scenario: 'A fictional adhesive distributor sold 100 packs in its first month and 151 in its eighth, with a steady upward drift. It needs a stock policy for packs bought from a supplier with a two-month lead time.',
    values: {
      product: 'Industrial adhesive, 5 kg pack',
      horizon: '1', lead: '2', service: '95', annual: '1500', order_cost: '500', unit_cost: '200', hold_pct: '20',
      decision_made: 'Reorder when stock falls to the computed reorder point, in lots of the economic order quantity, and recalculate every month with the newest period added.',
    },
    tables: {
      history: [
        { period: '1', demand: '100' }, { period: '2', demand: '108' }, { period: '3', demand: '115' }, { period: '4', demand: '123' },
        { period: '5', demand: '128' }, { period: '6', demand: '137' }, { period: '7', demand: '142' }, { period: '8', demand: '151' },
      ],
      actions: [
        { action: 'Set the reorder point and order quantity in the purchase system', owner: 'Purchase Manager', measure: 'Values entered and approved', horizon_when: '30 days' },
        { action: 'Compare the forecast with actual sales each month', owner: 'Demand Planner', measure: 'Forecast error recorded monthly', horizon_when: '60 days' },
        { action: 'Review the service level against stock-outs and holding cost', owner: 'Finance Director', measure: 'Decision recorded', horizon_when: '90 days' },
      ],
    },
  },
};
