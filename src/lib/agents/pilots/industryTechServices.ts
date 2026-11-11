import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Utilisation and bench: utilisation = billable hours / available hours; idle hours = available - billable; idle cost = idle hours x cost per hour.
 */
const utilPct: Expr = { mul: [{ div: [c('billable'), c('available')] }, 100] };
const idleHrs: Expr = { sub: [c('available'), c('billable')] };

export const UTILISATION_BENCH = agent({
  slug: 'utilisation-bench', name: 'Utilisation and Bench Planner', category: 'planning',
  does: 'Works out billable utilisation for each person or team, the hours sitting idle and what they cost, and flags those below your target so staffing can be fixed early.',
  whenToUse: 'Use it weekly or monthly, and before hiring, so bench cost is seen before it grows.',
  whenNotToUse: 'Do not use it to judge individuals without context. Training, leave and pre-sales time are real work that billing does not show.',
  next: 'Match bench people to open demand or training, and delay hiring where bench cost is already high.',
  summary: 'Every idle hour is paid cost with no revenue. Seeing idle hours and their cost by team tells you whether to hire, redeploy or train.',
  caption: 'Four steps from timesheets to a staffing decision.',
  howToRead: ['Utilisation is billable hours over available hours.', 'Idle hours are available hours not billed.', 'Idle cost values those hours at the cost per hour.'],
  diagramTitle: 'From timesheets to a staffing decision', diagramCaption: 'Idle hours are priced so the trade-off is visible.',
  steps: [['Collect timesheets', 'Available and billable hours'], ['Work out utilisation', 'Share billed'], ['Price idle time', 'Hours x cost rate'], ['Redeploy or hire', 'Owner and date']],
  sections: [
    sec('scope', 'The basis', 'Set your target and period.', [
      text('period', 'Period', 'The month the timesheets cover.', 'October'),
      num('target_util', 'Utilisation target', 'percent', 'The billable share you aim for, from your own plan and contracts.', '80'),
      long('notes', 'Anything unusual', 'Note training, leave, pre-sales or internal projects that explain idle time.', 'Team B did a two-week internal training.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Delivery Head'),
    ]),
    sec('teams', 'People or teams', 'Enter hours and cost rate for each.', [
      tbl('teams', 'People or teams', 'Person or team', 'One row per person or team. Hours are for the period; cost per hour is the loaded cost in rupees.', [
        ct('team', 'Person or team', 'The name of the person or team.'),
        cn('available', 'Available hours', 'Hours available to bill after leave and holidays.', 'hours'),
        cn('billable', 'Billable hours', 'Hours billed to clients.', 'hours'),
        cn('cost_hr', 'Cost per hour', 'Loaded cost of one hour, in rupees.', 'rupees'),
        cc('util', 'Utilisation', 'Worked out: billable hours divided by available hours.', { op: 'calc', expr: utilPct, format: 'pct' }),
        cc('idle', 'Idle hours', 'Worked out: available hours less billable hours.', { op: 'calc', expr: idleHrs, format: 'int' }),
        cc('idle_cost', 'Idle cost', 'Worked out: idle hours times cost per hour, in rupees.', { op: 'calc', expr: { mul: [idleHrs, c('cost_hr')] }, format: 'int' }),
        cc('call', 'Call', 'Worked out: Below target when utilisation is under your target.', { op: 'when', expr: { sub: [utilPct, f('target_util')] }, lt: 0, then: 'Below target', else: 'Meets target', tones: { then: 'bad', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'staffing actions',
  derived: [
    { key: 'idle_total', label: 'Idle hours', rule: { op: 'calc', expr: { agg: 'sum', table: 'teams', col: 'idle' }, format: 'int' } },
    { key: 'idle_cost_total', label: 'Idle cost (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'teams', col: 'idle_cost' }, format: 'int' } },
  ],
  outputs: [{ key: 'costliest', label: 'Highest idle cost', rule: { op: 'top', table: 'teams', by: 'idle_cost', label: 'team' } }],
  analysisGuide: 'State total idle hours and idle cost and name the team with the highest idle cost, with its utilisation against the target. Say what the notes explain, such as training or leave, and what remains. Warn that a team above target may be overloaded, and that billing lags work. Recommend redeploy, train or hold hiring per team, with an owner by role, a date and a measure, and say when utilisation will be rechecked.',
  scenario: 'A technology services firm reviews three teams for a month. Figures are fictional and for learning only.',
  values: { period: 'October', target_util: '80', notes: 'Team B did a two-week internal training.' },
  tables: { teams: [{ team: 'Team A, backend', available: '160', billable: '136', cost_hr: '600' }, { team: 'Team B, mobile', available: '160', billable: '96', cost_hr: '500' }, { team: 'Team C, testing', available: '160', billable: '144', cost_hr: '700' }] },
  actions: [['Match Team B to open mobile demand', 'Delivery Head', 'Utilisation above target'], ['Hold hiring until bench is below target', 'Talent Manager', 'Hiring decision recorded'], ['Recheck utilisation next month', 'Resource Planner', 'Updated list']],
});

/**
 * Project margin forecast: estimate at completion = cost to date / percent complete x 100; forecast margin = contract value - estimate.
 */
const eac: Expr = { mul: [{ div: [c('cost_to_date'), c('complete')] }, 100] };
const fMargin: Expr = { sub: [c('value'), eac] };

export const PROJECT_MARGIN = agent({
  slug: 'project-margin-forecast', name: 'Project Margin Forecast', category: 'planning',
  does: 'Projects each project\'s final cost from the cost so far and work done, shows the margin you are heading for against budget, and flags projects below your minimum.',
  whenToUse: 'Use it monthly on running fixed-price projects, early enough to change scope, staffing or price terms.',
  whenNotToUse: 'Do not use it on projects with no clear measure of work done, or in the first days when cost so far says little about the end.',
  next: 'Open a recovery plan for flagged projects: change request, staffing change or scope reset.',
  summary: 'Margin is lost slowly on fixed-price work. Projecting cost from progress shows the final margin while there is still time to act.',
  caption: 'Four steps from progress to a margin warning.',
  howToRead: ['Estimate at completion is cost to date scaled up by work done.', 'Forecast margin is contract value less that estimate.', 'Overrun is the estimate less the budgeted cost.'],
  diagramTitle: 'From progress to a margin warning', diagramCaption: 'The forecast is only as good as the measure of work done.',
  steps: [['Record progress', 'Percent complete'], ['Record cost to date', 'Actual spend'], ['Project the end cost', 'Cost scaled by progress'], ['Act early', 'Change request or recovery']],
  sections: [
    sec('scope', 'The basis', 'Set your minimum margin.', [
      text('period', 'As of', 'The date or month the progress is measured at.', 'End October'),
      num('min_margin', 'Minimum margin', 'percent', 'The forecast margin below which a project needs a recovery plan, from your own targets.', '15'),
      long('progress_basis', 'How progress is measured', 'Say how percent complete is measured, such as milestones or effort, so it can be repeated.', 'Milestone-based, signed off by the project manager.'),
    ]),
    sec('projects', 'Projects', 'Enter each project. The table works out the forecast.', [
      tbl('projects', 'Projects', 'Project', 'One row per fixed-price project. Value and costs in rupees; percent complete from your progress measure.', [
        ct('project', 'Project', 'The project name.'),
        cn('value', 'Contract value', 'The fixed price of the project, in rupees.', 'rupees'),
        cn('budget', 'Budgeted cost', 'The cost you planned for the whole project, in rupees.', 'rupees'),
        cn('complete', 'Work done', 'Percent of the work complete.', 'percent'),
        cn('cost_to_date', 'Cost to date', 'Actual cost spent so far, in rupees.', 'rupees'),
        cc('eac', 'Estimated final cost', 'Worked out: cost to date divided by work done, scaled to 100 percent.', { op: 'calc', expr: eac, format: 'int' }),
        cc('margin', 'Forecast margin', 'Worked out: contract value less estimated final cost, in rupees.', { op: 'calc', expr: fMargin, format: 'int' }),
        cc('margin_pct', 'Forecast margin percent', 'Worked out: forecast margin over contract value.', { op: 'calc', expr: { mul: [{ div: [fMargin, c('value')] }, 100] }, format: 'pct' }),
        cc('overrun', 'Overrun against budget', 'Worked out: estimated final cost less budgeted cost; positive means over.', { op: 'calc', expr: { sub: [eac, c('budget')] }, format: 'int' }),
        cc('call', 'Call', 'Worked out: Below minimum when forecast margin percent is under your minimum.', { op: 'when', expr: { sub: [{ mul: [{ div: [fMargin, c('value')] }, 100] }, f('min_margin')] }, lt: 0, then: 'Below minimum', else: 'Meets minimum', tones: { then: 'bad', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'recovery actions',
  derived: [
    { key: 'margin_total', label: 'Forecast margin, all projects (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'projects', col: 'margin' }, format: 'int' } },
    { key: 'overrun_total', label: 'Net overrun against budget (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'projects', col: 'overrun' }, format: 'int' } },
  ],
  outputs: [{ key: 'worst', label: 'Largest overrun', rule: { op: 'top', table: 'projects', by: 'overrun', label: 'project' } }],
  analysisGuide: 'State total forecast margin and name the project with the largest overrun and its forecast margin against the minimum. Explain that the forecast assumes the cost per unit of work so far continues, which is wrong if early work was cheaper or dearer than the rest. Say how progress was measured and that a weak measure weakens the forecast. Recommend a recovery step per flagged project, such as a change request, a staffing change or a scope reset, with an owner by role, a date and a measure, and say when the forecast will be rerun.',
  scenario: 'A services firm reviews three fixed-price projects. Figures are fictional and for learning only.',
  values: { period: 'End October', min_margin: '15', progress_basis: 'Milestone-based, signed off by the project manager.' },
  tables: { projects: [{ project: 'Retail app build', value: '1000000', budget: '700000', complete: '50', cost_to_date: '330000' }, { project: 'ERP integration', value: '800000', budget: '560000', complete: '40', cost_to_date: '300000' }, { project: 'Data migration', value: '1200000', budget: '900000', complete: '75', cost_to_date: '650000' }] },
  actions: [['Raise a change request for the ERP scope growth', 'Project Manager', 'Change request agreed'], ['Review staffing mix on the ERP project', 'Delivery Head', 'Cost per week reduced'], ['Rerun the forecast next month', 'Project Controller', 'Updated forecast']],
});

/**
 * SLA breach tracker: breach rate = breaches / tickets; penalty = breaches x penalty per breach.
 */
const breachPct: Expr = { mul: [{ div: [c('breaches'), c('tickets')] }, 100] };

export const SLA_BREACH = agent({
  slug: 'sla-breach-tracker', name: 'SLA Breach Tracker', category: 'prioritisation',
  does: 'Counts SLA breaches by client, shows the breach rate and the penalty exposure, and notes the main cause so the fix goes where it costs most.',
  whenToUse: 'Use it monthly on support or managed-service contracts, and before a client review.',
  whenNotToUse: 'Do not use it to dispute a client\'s own SLA calculation. It tracks your recorded tickets and breaches.',
  next: 'Fix the main cause for the client with the highest penalty exposure, then compare next month.',
  summary: 'A breach rate looks small until it is priced. Penalty exposure by client and cause shows where the fix pays back.',
  caption: 'Four steps from tickets to a service fix.',
  howToRead: ['Breach rate is breaches over tickets.', 'Penalty is breaches times the penalty per breach.', 'The cause column says what to fix.'],
  diagramTitle: 'From tickets to a service fix', diagramCaption: 'Penalty exposure, not count, sets the order.',
  steps: [['Collect tickets', 'Tickets and breaches'], ['Price the breaches', 'Penalty per breach'], ['Compare with allowed rate', 'Flag clients'], ['Fix the main cause', 'Owner and date']],
  sections: [
    sec('scope', 'The basis', 'Set the allowed breach rate.', [
      text('period', 'Period', 'The month the tickets cover.', 'October'),
      num('allowed_pct', 'Allowed breach rate', 'percent', 'The breach rate you allow, from the contract or your own goal.', '5'),
      long('notes', 'Anything unusual', 'Note outages, client delays or contract exclusions that affect counting.', 'A client-side outage excluded eight tickets for Client C.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Service Delivery Manager'),
    ]),
    sec('clients', 'Clients', 'Enter tickets, breaches and the main cause for each.', [
      tbl('clients', 'Clients', 'Client', 'One row per client contract. Penalty is the contract penalty per breach in rupees.', [
        ct('client', 'Client', 'The client or contract name.'),
        cn('tickets', 'Tickets', 'Tickets handled in the period.', 'tickets'),
        cn('breaches', 'Breaches', 'Tickets that missed the SLA.', 'tickets'),
        cn('penalty_each', 'Penalty per breach', 'Contract penalty per breach, in rupees.', 'rupees'),
        ct('cause', 'Main cause', 'The main reason for the breaches, in your words.'),
        cc('rate', 'Breach rate', 'Worked out: breaches divided by tickets.', { op: 'calc', expr: breachPct, format: 'pct' }),
        cc('penalty', 'Penalty exposure', 'Worked out: breaches times penalty per breach, in rupees.', { op: 'calc', expr: { mul: [c('breaches'), c('penalty_each')] }, format: 'int' }),
        cc('call', 'Call', 'Worked out: Above allowed when the breach rate is over your allowed rate.', { op: 'when', expr: { sub: [breachPct, f('allowed_pct')] }, gt: 0, then: 'Above allowed', else: 'Within allowed', tones: { then: 'bad', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'service fixes',
  derived: [
    { key: 'breach_total', label: 'Total breaches', rule: { op: 'calc', expr: { agg: 'sum', table: 'clients', col: 'breaches' }, format: 'int' } },
    { key: 'penalty_total', label: 'Total penalty exposure (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'clients', col: 'penalty' }, format: 'int' } },
  ],
  outputs: [{ key: 'costliest', label: 'Highest penalty exposure', rule: { op: 'top', table: 'clients', by: 'penalty', label: 'client' } }],
  analysisGuide: 'State total breaches and penalty exposure and name the client with the highest exposure, with its main cause and its breach rate against the allowed rate. Say whether the cause is a people, process, tooling or client issue, as the context allows. Warn that penalties may be negotiable and that exclusions change the count. Recommend one fix for the top cause, with an owner by role, a date and a measure such as breach rate next month, and say when the tracker will be rerun.',
  scenario: 'A managed-services firm reviews three clients for a month. Figures are fictional and for learning only.',
  values: { period: 'October', allowed_pct: '5', notes: 'A client-side outage excluded eight tickets for Client C.' },
  tables: { clients: [{ client: 'Client A', tickets: '400', breaches: '12', penalty_each: '5000', cause: 'Late vendor response' }, { client: 'Client B', tickets: '250', breaches: '20', penalty_each: '8000', cause: 'Night shift understaffed' }, { client: 'Client C', tickets: '600', breaches: '6', penalty_each: '3000', cause: 'Unclear ticket details' }] },
  actions: [['Add a second engineer to the night shift for Client B', 'Service Delivery Manager', 'Breach rate below allowed'], ['Agree a vendor response time for Client A', 'Vendor Manager', 'Written response time agreed'], ['Rerun the tracker next month', 'Service Analyst', 'Updated tracker']],
});
