import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, long, sec, tbl, text } from './kit';

/**
 * MIS Report: budget versus actual for the measures management watches, with variance and a favourable / adverse call.
 * Method (fixed formula): variance = actual - budget; variance % = variance / budget x 100.
 *   Each measure carries a direction: 1 where higher is better (revenue), -1 where lower is better (cost).
 *   impact = variance % x direction; positive impact is favourable. adverse size = -impact.
 */
const varPct: Expr = { mul: [{ div: [{ sub: [c('actual'), c('budget')] }, c('budget')] }, 100] };
const impact: Expr = { mul: [varPct, c('direction')] };

export const MIS_REPORT = agent({
  slug: 'mis-report-generator', name: 'MIS Report Generator', category: 'analytical',
  does: 'Compares actual results with budget for each measure you track, works out variance in rupees and percent, marks it favourable or adverse, and shows the biggest adverse movement first.',
  whenToUse: 'Use it for the monthly management pack, once the books are closed, so every measure is judged by the same rule and the exceptions stand out.',
  whenNotToUse: 'Do not use it to explain why a variance happened or to forecast. It shows how far results are from budget; the reasons need a conversation with the owners.',
  next: 'Ask the owner of each adverse measure for the reason and a recovery action, and carry the answers into the next review.',
  summary: 'A management report works when it shows exceptions, not everything. Judging each measure by variance and direction makes adverse movements stand out regardless of the measure\'s scale.',
  caption: 'Four steps from the closed books to an exceptions-first pack.',
  howToRead: ['Variance percent compares actual with budget on the measure\'s own scale.', 'Direction tells the sheet whether higher is good (1) or lower is good (-1).', 'Adverse items are listed first by size; start your discussion there.'],
  diagramTitle: 'From closed books to an exceptions-first pack', diagramCaption: 'Every measure is judged by the same rule, so the pack is consistent month to month.',
  steps: [['Close the books', 'Final numbers only'], ['Enter budget and actual', 'Per measure'], ['Work out variance', 'Amount and percent'], ['Discuss exceptions', 'Adverse first']],
  sections: [
    sec('period', 'The report', 'Say which period and what basis the figures use.', [
      text('period', 'Period', 'The month or quarter this report covers.', 'October'),
      text('prepared_by', 'Prepared by (role)', 'The role that prepares and signs the report, so questions go to one accountable person.', 'Finance Manager'),
      long('basis', 'Basis of the figures', 'Note whether figures are from closed books, whether they are in rupees or lakhs, and any known one-off items.', 'Rupees in thousands, from closed books; October includes a one-off insurance claim.'),
    ]),
    sec('measures', 'Measures', 'List each measure with its budget, actual and direction.', [
      tbl('measures', 'Measures', 'Measure', 'One row per measure. Use the same unit for budget and actual. Direction is 1 if higher is better (like revenue) and -1 if lower is better (like cost).', [
        ct('measure', 'Measure', 'The name of the measure, for example Revenue or Collection days.'),
        cn('budget', 'Budget', 'The planned figure for the period.', 'units'),
        cn('actual', 'Actual', 'The result for the period, in the same unit.', 'units'),
        cn('direction', 'Direction', 'Enter 1 if a higher result is better, or -1 if a lower result is better.', '1 or -1'),
        cc('variance', 'Variance', 'Worked out: actual minus budget.', { op: 'calc', expr: { sub: [c('actual'), c('budget')] }, format: 'dp1' }),
        cc('var_pct', 'Variance %', 'Worked out: variance as a percentage of budget.', { op: 'calc', expr: varPct, format: 'pct' }),
        cc('call', 'Favourable or adverse', 'Worked out: Favourable when the movement is in the good direction, otherwise Adverse.', { op: 'when', expr: impact, lt: 0, then: 'Adverse', else: 'Favourable', tones: { then: 'bad', else: 'good' } }),
        cc('adverse', 'Adverse size (%)', 'Worked out: how far the measure moved in the bad direction (negative means it moved the good way).', { op: 'calc', expr: { mul: [impact, -1] }, format: 'dp1' }),
      ], 3, 40),
    ]),
  ],
  plan: 'adverse measures',
  derived: [
    { key: 'count', label: 'Measures reported', rule: { op: 'calc', expr: { agg: 'count', table: 'measures', col: 'measure' }, format: 'int' } },
  ],
  outputs: [{ key: 'worst', label: 'Biggest adverse movement', rule: { op: 'top', table: 'measures', by: 'adverse', label: 'measure' } }],
  analysisGuide: 'Lead with the measures that are adverse, biggest first, and give each variance in rupees and percent. Then mention the favourable ones briefly. Do not explain causes you cannot see in the figures; instead list the questions for each owner. Check that direction is set correctly for every measure, because a wrong sign turns a good result into a bad one. Note one-off items from the basis note that distort the picture. Close with a recovery action per adverse measure, an owner by role, a date, and when the next report will show whether it worked.',
  scenario: 'A company reports three measures for October. Figures are fictional and for learning only.',
  values: { period: 'October', prepared_by: 'Finance Manager', basis: 'Rupees in thousands, from closed books; October includes a one-off insurance claim.' },
  tables: { measures: [{ measure: 'Revenue', budget: '1000', actual: '900', direction: '1' }, { measure: 'Operating cost', budget: '600', actual: '630', direction: '-1' }, { measure: 'Collection days', budget: '45', actual: '40', direction: '-1' }] },
  actions: [['Get the reason for the revenue shortfall from the sales head', 'Finance Manager', 'Written explanation received'], ['Review the cost overrun by cost centre', 'Cost Accountant', 'Cost centre review completed'], ['Share the pack with the leadership team', 'Finance Manager', 'Pack issued on time']],
});
