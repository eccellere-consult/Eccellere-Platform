import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Exit Interview Analyzer: groups leavers by their main reason and shows what each reason costs.
 * Method (fixed formula): share = leavers for a reason / all leavers x 100; regretted share = regretted leavers / leavers for that reason x 100;
 *   cost of a reason = leavers x replacement cost per leaver; total cost = all leavers x replacement cost per leaver.
 * The reasons are grouped by people who read the interviews; the sheet only counts and prices them.
 */
const total: Expr = { agg: 'sum', table: 'reasons', col: 'leavers' };

export const EXIT_INTERVIEW = agent({
  slug: 'exit-interview-analyzer', name: 'Exit Interview Analyzer', category: 'prioritisation',
  does: 'Groups exit interviews by main reason, shows how many people left for each, how many you wished to keep, and what each reason costs in replacement, so retention effort goes where it saves most.',
  whenToUse: 'Use it each quarter after exit interviews are done, to decide which causes of attrition to tackle first.',
  whenNotToUse: 'Do not use it to identify or judge individual leavers, or to draw conclusions from very few exits. Use reason groups and counts only, never names.',
  next: 'Take the top reason to the leadership team with one proposed fix, and recheck the numbers after two quarters.',
  summary: 'People rarely leave for one reason, but the main reason they give is a good place to start. Counting leavers and pricing replacement turns exit interviews into a case for action.',
  caption: 'Five steps from exit interviews to a retention priority.',
  howToRead: ['Share shows how much of all attrition each reason explains.', 'Regretted share is the portion of those leavers you wished to keep.', 'Cost uses your estimate of what replacing one person costs.'],
  diagramTitle: 'From exit interviews to a retention priority', diagramCaption: 'Reasons are grouped by people; the sheet counts them and prices the loss.',
  steps: [['Collect exit interviews', 'The period\'s leavers'], ['Group by main reason', 'One reason each'], ['Count and price', 'Leavers and cost'], ['Pick the priority', 'Share and regret'], ['Act', 'Owner, measure, date']],
  sections: [
    sec('scope', 'Scope', 'Say which period this covers and what a replacement costs.', [
      text('period', 'Period', 'The quarter or year the exits happened in.', 'July to September'),
      num('replace_cost', 'Replacement cost per leaver', 'rupees', 'Your estimate of what it costs to replace one person: hiring, training and lost output. Use a figure you can defend.', '150000'),
      long('method', 'How reasons were grouped', 'Note how you decided the main reason for each leaver, so another reader would group them the same way.', 'The main reason in the exit interview, agreed by two HR reviewers.'),
    ]),
    sec('reasons', 'Reasons', 'List each reason with how many left and how many you wished to keep.', [
      tbl('reasons', 'Reasons for leaving', 'Reason', 'One row per main reason. Count only leavers whose main reason it was, and how many of them you would have wanted to keep. Never enter names.', [
        ct('reason', 'Main reason', 'A short label for the reason, for example Pay, Manager or Career growth.'),
        cn('leavers', 'Leavers', 'How many people gave this as their main reason.', 'people'),
        cn('regretted', 'Of whom regretted', 'How many of those you wished to keep.', 'people'),
        cc('share', 'Share of exits', 'Worked out: leavers for this reason as a percentage of all leavers.', { op: 'calc', expr: { mul: [{ div: [c('leavers'), total] }, 100] }, format: 'pct' }),
        cc('regret_pct', 'Regretted share', 'Worked out: regretted leavers as a percentage of leavers for this reason.', { op: 'calc', expr: { mul: [{ div: [c('regretted'), c('leavers')] }, 100] }, format: 'pct' }),
        cc('cost', 'Replacement cost', 'Worked out: leavers times replacement cost per leaver, in rupees.', { op: 'calc', expr: { mul: [c('leavers'), f('replace_cost')] }, format: 'int' }),
      ], 3, 15),
    ]),
  ],
  plan: 'top attrition reasons',
  derived: [
    { key: 'total_leavers', label: 'Total leavers', rule: { op: 'calc', expr: total, format: 'int' } },
    { key: 'total_regretted', label: 'Regretted leavers', rule: { op: 'calc', expr: { agg: 'sum', table: 'reasons', col: 'regretted' }, format: 'int' } },
    { key: 'total_cost', label: 'Total replacement cost (rupees)', rule: { op: 'calc', expr: { mul: [total, f('replace_cost')] }, format: 'int' } },
  ],
  outputs: [
    { key: 'top_reason', label: 'Most common reason', rule: { op: 'top', table: 'reasons', by: 'leavers', label: 'reason' } },
    { key: 'top_regret', label: 'Most regretted reason', rule: { op: 'top', table: 'reasons', by: 'regretted', label: 'reason' } },
  ],
  analysisGuide: 'State the total leavers, how many were regretted, and the replacement cost. Name the most common reason and the most regretted reason, and say whether they match. If they differ, explain that one drives volume and the other drives loss of valued people. Warn against drawing firm conclusions from small counts, and against identifying anyone. For the top two reasons, propose one fix each with an owner by role, a measure and a date, and say how you will check in two quarters whether the reason has fallen.',
  scenario: 'A company reviews 25 exits in one quarter. Reasons and counts are fictional and for learning only.',
  values: { period: 'July to September', replace_cost: '150000', method: 'The main reason in the exit interview, agreed by two HR reviewers.' },
  tables: { reasons: [{ reason: 'Career growth', leavers: '10', regretted: '6' }, { reason: 'Pay', leavers: '8', regretted: '2' }, { reason: 'Manager', leavers: '7', regretted: '5' }] },
  actions: [['Design a career path for the two most affected teams', 'HR Head', 'Paths published'], ['Review pay for roles with the most exits', 'Compensation Manager', 'Pay review completed'], ['Run manager feedback for the teams with regretted exits', 'HR Business Partner', 'Feedback completed']],
});
