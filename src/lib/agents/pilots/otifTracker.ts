import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, sec, tbl, text, long } from './kit';

/**
 * OTIF Tracker: on-time-in-full delivery performance.
 * Method (fixed rule): an order is in full when delivered quantity is at least the ordered quantity, and on time when it arrived
 * no later than the promised date (days late of 0 or less). It counts as OTIF only when BOTH are true.
 *   OTIF % = OTIF orders / all orders x 100; on-time % and in-full % are worked out the same way.
 * Quantities and days late are whole numbers.
 */
const inFull: Expr = { max: [0, { min: [1, { add: [{ sub: [c('delivered'), c('ordered')] }, 1] }] }] };
const onTime: Expr = { max: [0, { min: [1, { sub: [1, c('days_late')] }] }] };
const count: Expr = { agg: 'count', table: 'orders', col: 'order_no' };

export const OTIF_TRACKER = agent({
  slug: 'otif-tracker', name: 'OTIF Tracker', category: 'analytical',
  does: 'Checks each delivery for on-time and in-full, works out your OTIF, on-time and in-full percentages, and shows which customers or orders failed and why.',
  whenToUse: 'Use it monthly on shipped orders, or after a customer complaint, to see how reliable your delivery really is and where it breaks.',
  whenNotToUse: 'Do not use it to judge a supplier\'s quality, or to forecast future service. It reports what happened on the orders you list.',
  next: 'Fix the most common failure first (late or short), agree a target OTIF with your customers, and track the trend month by month.',
  summary: 'OTIF is a strict measure: an order that is on time but short, or complete but late, counts as a miss. Splitting misses into late and short shows what to fix.',
  caption: 'Four steps from shipped orders to a reliability number.',
  howToRead: ['OTIF counts an order only if it was both complete and on time.', 'Compare on-time and in-full: the lower one is your bigger problem.', 'Orders marked failed are the ones to investigate first.'],
  diagramTitle: 'From shipped orders to a reliability number', diagramCaption: 'Both tests must pass for an order to count, so OTIF is never higher than either part alone.',
  steps: [['List shipped orders', 'Ordered, delivered, days late'], ['Test each order', 'In full and on time'], ['Add up', 'OTIF, on time, in full'], ['Find the cause', 'Late or short?']],
  sections: [
    sec('scope', 'Scope', 'Say which period and customers this covers.', [
      text('period', 'Period covered', 'The month or quarter these orders were due in, so results can be compared over time.', 'October'),
      text('target', 'Your OTIF target', 'The OTIF percentage you promise or aim for, with its source (customer contract or internal goal).', '95% in the customer contract'),
      long('notes', 'Anything that affected deliveries', 'Note strikes, stock-outs, transport failures or one-off events, so a reader does not blame the wrong cause.', 'Two days of road closure near the plant mid-month.'),
    ]),
    sec('orders', 'Orders', 'List each order with what was ordered, delivered and how late it was.', [
      tbl('orders', 'Shipped orders', 'Order', 'One row per order. Days late is 0 if it arrived on or before the promised date, and negative or 0 if early.', [
        ct('order_no', 'Order', 'The order or delivery reference.'),
        ct('customer', 'Customer', 'Who the order was for.'),
        cn('ordered', 'Quantity ordered', 'Units the customer ordered.', 'units'),
        cn('delivered', 'Quantity delivered', 'Units actually delivered.', 'units'),
        cn('days_late', 'Days late', 'Whole days after the promised date; 0 or less if on time.', 'days'),
        cc('in_full', 'In full (1 = yes)', 'Worked out: 1 if delivered is at least ordered, otherwise 0.', { op: 'calc', expr: inFull, format: 'int' }),
        cc('on_time', 'On time (1 = yes)', 'Worked out: 1 if days late is 0 or less, otherwise 0.', { op: 'calc', expr: onTime, format: 'int' }),
        cc('otif', 'OTIF (1 = yes)', 'Worked out: 1 only if the order was both in full and on time.', { op: 'calc', expr: { mul: [inFull, onTime] }, format: 'int' }),
      ], 3, 100),
    ]),
  ],
  plan: 'delivery failures',
  derived: [
    { key: 'orders', label: 'Orders checked', rule: { op: 'calc', expr: count, format: 'int' } },
    { key: 'otif_count', label: 'Orders on time and in full', rule: { op: 'calc', expr: { agg: 'sum', table: 'orders', col: 'otif' }, format: 'int' } },
    { key: 'ontime_pct', label: 'On time (percent)', rule: { op: 'calc', expr: { mul: [{ div: [{ agg: 'sum', table: 'orders', col: 'on_time' }, count] }, 100] }, format: 'pct' } },
    { key: 'infull_pct', label: 'In full (percent)', rule: { op: 'calc', expr: { mul: [{ div: [{ agg: 'sum', table: 'orders', col: 'in_full' }, count] }, 100] }, format: 'pct' } },
  ],
  outputs: [{ key: 'otif_pct', label: 'OTIF (percent)', rule: { op: 'calc', expr: { mul: [{ div: [{ agg: 'sum', table: 'orders', col: 'otif' }, count] }, 100] }, format: 'pct' } }],
  analysisGuide: 'State the OTIF percentage against the target, and say whether on time or in full is the weaker part. List the orders that failed and what each failure was: late, short, or both. Look for a pattern by customer, product or period, and say what cannot be concluded from so few orders. Do not blame carriers or suppliers without evidence; note what the context says. Recommend the single fix that would recover the most missed orders, give it an owner by role and a date, and say how the tracker will be rerun to prove it worked.',
  scenario: 'A distributor checks four October orders. Orders and quantities are fictional and for learning only.',
  values: { period: 'October', target: '95% in the customer contract', notes: 'Two days of road closure near the plant mid-month.' },
  tables: { orders: [{ order_no: 'DO-501', customer: 'Mehta Traders', ordered: '100', delivered: '100', days_late: '0' }, { order_no: 'DO-502', customer: 'Rao Stores', ordered: '50', delivered: '40', days_late: '0' }, { order_no: 'DO-503', customer: 'Kapoor & Sons', ordered: '80', delivered: '80', days_late: '2' }, { order_no: 'DO-504', customer: 'Mehta Traders', ordered: '60', delivered: '60', days_late: '-1' }] },
  actions: [['Review why DO-502 shipped short', 'Warehouse Manager', 'Root cause recorded'], ['Agree a firm cut-off with the transporter', 'Logistics Manager', 'Written cut-off agreed'], ['Rerun OTIF next month', 'Supply Chain Analyst', 'Trend chart updated']],
});
