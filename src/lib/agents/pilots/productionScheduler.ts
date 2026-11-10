import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, num, sec, tbl, text } from './kit';

/**
 * Production Scheduler: checks whether the jobs on the floor fit the capacity before their due dates.
 * Method (fixed formula): capacity available by a job's due date = capacity per day x days until due.
 *   load = hours the job needs / capacity available by its due date (a job on its own).
 *   total days needed = total hours of all jobs / capacity per day.
 * A simple, honest check: it does not sequence jobs or model machines, it shows which jobs are tightest.
 */
const capacity: Expr = { mul: [f('capacity_per_day'), c('due_days')] };
const load: Expr = { div: [c('hours'), capacity] };
const totalHours: Expr = { agg: 'sum', table: 'jobs', col: 'hours' };

export const PRODUCTION_SCHEDULER = agent({
  slug: 'production-scheduler', name: 'Production Scheduler', category: 'planning',
  does: 'Compares the hours each job needs with the capacity available before its due date, shows which jobs are tightest, and works out how many working days the whole list needs.',
  whenToUse: 'Use it at the start of each week, or when a rush order arrives, to see whether the promised dates are realistic before committing.',
  whenNotToUse: 'Do not use it to sequence machines, model changeovers or plan materials. It checks capacity against dates; it is not a full scheduling system.',
  next: 'Re-promise dates for jobs that cannot be met, add overtime or a shift where it is cheaper than a late penalty, and rerun after each change.',
  summary: 'Late jobs are usually a capacity problem seen too late. Dividing the hours a job needs by the capacity before its due date shows the tight jobs while there is still time to act.',
  caption: 'Four steps from a job list to dates you can promise.',
  howToRead: ['Load above 100% on its own means the job cannot be done by its date even if it had the whole floor.', 'Total days needed compares all jobs together with your daily capacity.', 'The tightest job is the first to re-plan.'],
  diagramTitle: 'From a job list to dates you can promise', diagramCaption: 'Each job is checked on its own, then all jobs together against the same capacity.',
  steps: [['Set daily capacity', 'Productive hours a day'], ['List the jobs', 'Hours and due days'], ['Check each job', 'Load against its date'], ['Check the total', 'Days needed in all'], ['Re-plan', 'Dates, overtime, priorities']],
  sections: [
    sec('capacity', 'Capacity', 'Say how many productive hours you have each day.', [
      num('capacity_per_day', 'Productive hours per day', 'hours', 'The hours of real work the floor can deliver in a day, after breaks and typical downtime. Be realistic, not the shift length.', '16'),
      text('planner', 'Who owns the plan (role)', 'The role that owns this plan and confirms dates with customers, so changes have one accountable person.', 'Planning Manager'),
      text('period', 'Planning week', 'Name the week or period this plan covers, so it is not mixed up with the next one.', 'Week of 10 November'),
    ]),
    sec('jobs', 'Jobs', 'List each job with the hours it needs and the days until it is due.', [
      tbl('jobs', 'Jobs on the floor', 'Job', 'One row per job. Use total machine or labour hours the job needs, and the working days left until its promised date.', [
        ct('job', 'Job', 'A short name or order number.'),
        cn('hours', 'Hours needed', 'Total productive hours the job still needs.', 'hours'),
        cn('due_days', 'Days until due', 'Working days left before the promised date.', 'days'),
        cc('available', 'Capacity by due date', 'Worked out: productive hours per day times days until due.', { op: 'calc', expr: capacity, format: 'int' }),
        cc('load', 'Load', 'Worked out: hours needed divided by capacity by the due date, as a percentage. Above 100% cannot be met alone.', { op: 'calc', expr: { mul: [load, 100] }, format: 'pct' }),
        cc('verdict', 'Can it be met?', 'Worked out: Yes while load is at or below 100%.', { op: 'when', expr: { sub: [load, 1] }, gt: 0, then: 'No: re-plan', else: 'Yes', tones: { then: 'bad', else: 'good' } }),
      ], 3, 30),
    ]),
  ],
  plan: 'tight jobs',
  derived: [
    { key: 'total_hours', label: 'Total hours of work', rule: { op: 'calc', expr: totalHours, format: 'int' } },
    { key: 'days_needed', label: 'Working days needed for all jobs', rule: { op: 'calc', expr: { div: [totalHours, f('capacity_per_day')] }, format: 'dp1' } },
    { key: 'job_count', label: 'Jobs listed', rule: { op: 'calc', expr: { agg: 'count', table: 'jobs', col: 'job' }, format: 'int' } },
  ],
  outputs: [{ key: 'tightest', label: 'Tightest job', rule: { op: 'top', table: 'jobs', by: 'load', label: 'job' } }],
  analysisGuide: 'Name the tightest job and its load, and say how many jobs cannot be met even alone. Then compare total days needed with the longest due date: if all jobs need more days than the latest date allows, some dates must move whatever the order. Recommend which jobs to re-promise first, which could take overtime or an extra shift, and what the cost of each option is against a late penalty. Note that this check ignores sequence, changeovers and breakdowns, so leave a margin. Close with the dates to confirm with customers, an owner by role, and when the plan will be rerun.',
  scenario: 'A small factory checks three jobs against 16 productive hours a day. Jobs and hours are fictional and for learning only.',
  values: { capacity_per_day: '16', planner: 'Planning Manager', period: 'Week of 10 November' },
  tables: { jobs: [{ job: 'Order 2101: gear housings', hours: '40', due_days: '3' }, { job: 'Order 2102: brackets', hours: '24', due_days: '1' }, { job: 'Order 2103: shafts', hours: '30', due_days: '5' }] },
  actions: [['Re-promise Order 2101 or add a shift', 'Production Manager', 'New date agreed with customer'], ['Confirm the brackets start today', 'Shift Supervisor', 'Job started on time'], ['Rerun this check after changes', 'Planning Executive', 'Updated plan shared']],
});
