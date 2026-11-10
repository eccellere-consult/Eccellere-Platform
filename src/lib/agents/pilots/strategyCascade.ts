import type { DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';
import { actionPlan, c, long, num, text } from './kit';

/**
 * Strategy Cascade: from a strategy to objectives to measurable key results, with progress tracked against targets.
 * Method (a fixed formula, nothing estimated by AI):
 *   progress of a key result = (current - baseline) / (target - baseline) x 100
 *   overall progress = weighted average of key-result progress, using the weights entered.
 * Limit: the tool cannot tell whether an objective has been left without a key result; read the table for that.
 */
const progress: Expr = { mul: [{ div: [{ sub: [c('current'), c('baseline')] }, { sub: [c('target'), c('baseline')] }] }, 100] };
const weightTotal: Expr = { agg: 'sum', table: 'krs', col: 'weight' };

export const STRATEGY_CASCADE: DeclarativeTool = {
  schema: 1,
  slug: 'strategy-plan-cascade',
  name: 'Strategy Cascade',
  category: 'planning',
  does: 'Breaks a strategy into objectives and measurable key results with a baseline, target and current value, and works out progress on each result and overall, using the weights you set.',
  whenToUse: 'Use it when a leadership team has agreed a strategy for the year and needs it turned into a short list of measurable results that teams can own and review each month or quarter.',
  whenNotToUse: 'Do not use it to write the strategy itself, or to track activities that have no number. It does not judge whether the targets are the right ones, only how far you have moved towards them.',
  next: 'Review progress at each monthly meeting; where a key result is far behind, build an action plan, and refresh the weights when the strategy changes.',
  reference: {
    originator: '',
    year: '',
    summary: 'A strategy becomes real when each objective is tied to a few results that can be measured, each with a starting point, a target and an owner. Progress is then a simple calculation instead of an opinion.',
    caption: 'Four levels from strategy to the measure a team reviews each month.',
    howToRead: [
      'Progress is the share of the distance from baseline to target already covered, so 50 means halfway.',
      'Overall progress weights each key result by the importance you gave it.',
      'The weights should add up to 100; the check beside them tells you if they do not.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From strategy to a measure the team reviews',
    steps: [
      { name: 'Strategy', hint: 'Where we are going and why' },
      { name: 'Objectives', hint: 'Three to five outcomes' },
      { name: 'Key results', hint: 'Baseline, target, weight' },
      { name: 'Owners', hint: 'One accountable role each' },
      { name: 'Review', hint: 'Progress each month' },
    ],
    caption: 'Each objective is judged by numbers, so the review is about facts.',
  },
  sections: [
    {
      key: 'strategy', title: 'The strategy', summary: 'State the strategy and the period it covers.',
      parts: [
        long('strategy', 'The strategy in a few sentences', 'Say where the business is heading and how it will win, in words the whole team can repeat.', 'Grow repeat business from existing customers while keeping delivery on time.'),
        text('period', 'Period covered', 'The start and end of the period the results are judged over.', 'April to March, financial year'),
        num('objective_count', 'Number of objectives', 'objectives', 'How many objectives the strategy has. Three to five is easiest to run.', '3'),
      ],
    },
    {
      key: 'objectives', title: 'Objectives', summary: 'List the objectives that deliver the strategy.',
      parts: [{
        kind: 'table', key: 'objectives', label: 'Objectives', rowLabel: 'Objective', minRows: 3, maxRows: 6,
        help: 'One row per objective, written as an outcome you can recognise when it is achieved, with the role accountable for it.',
        columns: [
          { key: 'objective', header: 'Objective', help: 'The outcome in one sentence, for example Customers reorder more often.', type: 'text' },
          { key: 'owner', header: 'Owner (role)', help: 'The role accountable for this objective, for example Sales Head.', type: 'text' },
        ],
      }],
    },
    {
      key: 'krs', title: 'Key results', summary: 'Give each objective measurable results. The table works out progress.',
      parts: [{
        kind: 'table', key: 'krs', label: 'Key results', rowLabel: 'Key result', minRows: 2, maxRows: 15,
        help: 'One row per measurable result. Name the objective it serves, give the starting value, the target and the latest value, and a weight for how much it matters. Weights should add up to 100.',
        columns: [
          { key: 'objective', header: 'Objective it serves', help: 'The objective this result belongs to, copied from the list above.', type: 'text' },
          { key: 'kr', header: 'Key result', help: 'What is measured, with its unit, for example Repeat orders per month.', type: 'text' },
          { key: 'baseline', header: 'Baseline', help: 'The value when the period began.', type: 'number' },
          { key: 'target', header: 'Target', help: 'The value you want by the end of the period.', type: 'number' },
          { key: 'current', header: 'Current', help: 'The latest measured value.', type: 'number' },
          { key: 'weight', header: 'Weight', help: 'How much this result matters, out of 100 across all results.', type: 'number', unit: 'weight' },
          { key: 'progress', header: 'Progress', type: 'computed', help: 'Worked out: share of the distance from baseline to target already covered.', rule: { op: 'calc', expr: progress, format: 'pct' } },
        ],
      }],
    },
    actionPlan('results behind target'),
  ],
  derived: [
    { key: 'weight_total', label: 'Total of the weights', help: 'Should be 100.', rule: { op: 'calc', expr: weightTotal, format: 'int' } },
    { key: 'weight_check', label: 'Weights check', rule: { op: 'when', expr: { abs: { sub: [weightTotal, 100] } }, gt: 0.5, then: 'Weights do not add up to 100', else: 'Weights add up to 100', tones: { then: 'warn', else: 'good' } } },
    { key: 'kr_count', label: 'Key results', rule: { op: 'calc', expr: { agg: 'count', table: 'krs', col: 'kr' }, format: 'int' } },
  ],
  outputs: [
    { key: 'overall', label: 'Overall progress (weighted)', rule: { op: 'weighted', table: 'krs', value: 'progress', weight: 'weight', format: 'dp1' } },
    { key: 'furthest_along', label: 'Key result furthest along', rule: { op: 'top', table: 'krs', by: 'progress', label: 'kr' } },
  ],
  analysisGuide: 'State the overall weighted progress and compare it with how much of the period has passed: progress below the time elapsed means the plan is behind. Name the key results furthest behind and the objectives they serve, and say whether the cause is the target, the effort or a change in conditions. Check that the weights add up to 100 and that every objective has at least one key result, since the tool cannot check that for you. Be honest where a result has no baseline or a target that was never realistic. For each key result that is behind, propose one action with an owner by role, a measure and a date, and say when the plan will next be reviewed.',
  sample: {
    scenario: 'A distribution company reviews progress half-way through the year. Targets and values are fictional and for learning only.',
    values: {
      strategy: 'Grow repeat business from existing customers while keeping delivery on time.',
      period: 'April to March, financial year',
      objective_count: '3',
    },
    tables: {
      objectives: [
        { objective: 'Customers reorder more often', owner: 'Sales Head' },
        { objective: 'Orders are delivered on time', owner: 'Operations Head' },
        { objective: 'Reports reach managers faster', owner: 'Finance Manager' },
      ],
      krs: [
        { objective: 'Customers reorder more often', kr: 'Repeat orders per month', baseline: '0', target: '100', current: '30', weight: '60' },
        { objective: 'Orders are delivered on time', kr: 'On-time delivery rate (percent)', baseline: '10', target: '50', current: '32', weight: '40' },
      ],
      actions: [
        { action: 'Call the fifty most active customers about their next order', owner: 'Sales Head', measure: 'Repeat orders per month', horizon: '30 days' },
        { action: 'Review the three slowest delivery routes', owner: 'Operations Head', measure: 'On-time delivery rate', horizon: '30 days' },
        { action: 'Agree a monthly review date with all owners', owner: 'Chief Executive', measure: 'Review held each month', horizon: '30 days' },
      ],
    },
  },
};
