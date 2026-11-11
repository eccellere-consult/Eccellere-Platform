import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, cr, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Manufacturing agents. Every number comes from a fixed formula; the figures are the plant's own.
 *
 * OEE: availability = (planned - downtime) / planned; performance = ideal cycle time x units made / (planned - downtime);
 *   quality = good units / units made; OEE = availability x performance x quality.
 */
const run: Expr = { sub: [c('planned'), c('downtime')] };
const availability: Expr = { div: [run, c('planned')] };
const performance: Expr = { div: [{ mul: [c('ideal'), c('made')] }, run] };
const quality: Expr = { div: [c('good'), c('made')] };
const oee: Expr = { mul: [availability, performance, quality] };

export const OEE_CALCULATOR = agent({
  slug: 'oee-calculator', name: 'OEE Calculator', category: 'analytical',
  does: 'Works out overall equipment effectiveness for each line from planned time, downtime, speed and good output, and shows which of the three losses (stoppages, slow running, defects) is the biggest.',
  whenToUse: 'Use it each shift, week or month on the lines you want to improve, to see where productive time is really lost before choosing what to fix.',
  whenNotToUse: 'Do not use it to compare plants that count planned time differently, or to judge operators. OEE is only as honest as the time and counts you enter.',
  next: 'Take the biggest loss on the weakest line into a root cause review, and use the Maintenance Priority Ranker if stoppages are the cause.',
  summary: 'OEE multiplies three honest questions: was the machine running, was it running at its ideal speed, and was what it made good. The weakest of the three shows where to look first.',
  caption: 'Four steps from a line\'s shift data to its biggest loss.',
  howToRead: ['Availability is the share of planned time the line was actually running.', 'Performance compares real output with the output at ideal speed while running.', 'Quality is good units over all units made. OEE is the three multiplied.'],
  diagramTitle: 'From shift data to the biggest loss', diagramCaption: 'Each loss is measured on its own, so the fix goes to the right place.',
  steps: [['Record the shift', 'Planned time, downtime'], ['Count the output', 'Made and good units'], ['Work out three ratios', 'Availability, speed, quality'], ['Find the biggest loss', 'Then act on it']],
  sections: [
    sec('scope', 'The period', 'Say which plant, period and target this covers.', [
      text('plant', 'Plant or area', 'The plant, line group or area these lines belong to, so results are filed with the right owner.', 'Pune plant, assembly area'),
      text('period', 'Period', 'The shift, day, week or month the figures cover. Keep it the same for every line.', 'Day shift, 12 November'),
      num('target_oee', 'Your OEE target', 'percent', 'The OEE you aim for on these lines, from your own goal. The sheet does not assume a standard figure.', '75'),
      long('notes', 'Anything unusual in the period', 'Note breakdowns, trials or material problems that distort the figures, so nobody blames the wrong line.', 'Line A lost 40 minutes to a die change that was not planned.'),
    ]),
    sec('lines', 'Lines', 'Enter each line\'s times and counts. The table works out the rest.', [
      tbl('lines', 'Lines', 'Line', 'One row per line. Use minutes for time, the ideal cycle time in minutes per unit, and whole units for output.', [
        ct('line', 'Line', 'The name or number of the line or machine.'),
        cn('planned', 'Planned time', 'Minutes the line was planned to run.', 'minutes'),
        cn('downtime', 'Downtime', 'Minutes lost to stoppages, changeovers and breakdowns within the planned time.', 'minutes'),
        cn('ideal', 'Ideal cycle time', 'Minutes the line should take per unit at its best proven speed.', 'min per unit'),
        cn('made', 'Units made', 'All units produced, good and bad.', 'units'),
        cn('good', 'Good units', 'Units that passed first time without rework.', 'units'),
        cc('avail', 'Availability', 'Worked out: running time divided by planned time.', { op: 'calc', expr: { mul: [availability, 100] }, format: 'pct' }),
        cc('perf', 'Performance', 'Worked out: ideal time for the units made, divided by running time.', { op: 'calc', expr: { mul: [performance, 100] }, format: 'pct' }),
        cc('qual', 'Quality', 'Worked out: good units divided by units made.', { op: 'calc', expr: { mul: [quality, 100] }, format: 'pct' }),
        cc('oee', 'OEE', 'Worked out: availability times performance times quality.', { op: 'calc', expr: { mul: [oee, 100] }, format: 'pct' }),
        cc('loss', 'OEE lost', 'Worked out: 100 minus OEE, used to rank the weakest line.', { op: 'calc', expr: { sub: [100, { mul: [oee, 100] }] }, format: 'pct' }),
        cc('vs_target', 'Against target', 'Worked out: Meets target when OEE is at or above your target, otherwise Below target.', { op: 'when', expr: { sub: [{ mul: [oee, 100] }, f('target_oee')] }, lt: 0, then: 'Below target', else: 'Meets target', tones: { then: 'bad', else: 'good' } }),
      ], 2, 30),
    ]),
  ],
  plan: 'biggest losses',
  derived: [{ key: 'line_count', label: 'Lines measured', rule: { op: 'calc', expr: { agg: 'count', table: 'lines', col: 'line' }, format: 'int' } }],
  outputs: [{ key: 'weakest', label: 'Weakest line (most OEE lost)', rule: { op: 'top', table: 'lines', by: 'loss', label: 'line' } }],
  analysisGuide: 'Name the weakest line and its OEE against the target, then say which of availability, performance and quality is lowest for it, because that points to the type of fix: stoppages, slow running or defects. Do not compare lines that make different products without saying so. Warn that a performance figure above 100 percent usually means the ideal cycle time is set too slow. Recommend one improvement per weak line with an owner by role, a measure and a date, and say when OEE will be measured again to prove the change worked.',
  scenario: 'A plant measures two lines on one shift. Times and counts are fictional and for learning only.',
  values: { plant: 'Pune plant, assembly area', period: 'Day shift, 12 November', target_oee: '75', notes: 'Line A lost 40 minutes to a die change that was not planned.' },
  tables: { lines: [{ line: 'Line A', planned: '480', downtime: '60', ideal: '0.5', made: '700', good: '665' }, { line: 'Line B', planned: '480', downtime: '30', ideal: '0.4', made: '1000', good: '980' }] },
  actions: [['Run a changeover time study on Line A', 'Production Engineer', 'Changeover minutes reduced'], ['Check why Line A runs slower than its ideal speed', 'Line Supervisor', 'Cause recorded and agreed'], ['Re-measure OEE next week', 'Plant Manager', 'OEE report shared']],
});

/**
 * Scrap and Yield: cost of scrap by cause, and first-pass yield.
 * Scrap cost = units scrapped x cost per unit; share = a cause's cost / total scrap cost; first-pass yield = good first time / units started.
 */
export const SCRAP_YIELD = agent({
  slug: 'scrap-yield-analyzer', name: 'Scrap and Yield Analyzer', category: 'prioritisation',
  does: 'Ranks the causes of scrap by what they cost, shows each cause\'s share of the total, and works out first-pass yield so improvement starts with the biggest rupee loss.',
  whenToUse: 'Use it monthly, or after a quality complaint, on the causes your inspectors record, to pick the few that deserve a root cause study.',
  whenNotToUse: 'Do not use it to find the root cause itself, or to judge a supplier. It ranks recorded causes; proving the cause needs an investigation.',
  next: 'Take the top cause to a root cause analysis and set a scrap target, then rerun after the fix.',
  summary: 'Scrap causes are rarely equal. Ranking them by rupees, not by count, sends engineering effort to the few causes that pay back most.',
  caption: 'Four steps from a scrap log to a priority cause.',
  howToRead: ['Cost is units scrapped times cost per unit, so a rare but expensive cause can outrank a common cheap one.', 'Share shows how much of all scrap cost a cause explains.', 'First-pass yield is the share of units that were good the first time.'],
  diagramTitle: 'From a scrap log to a priority cause', diagramCaption: 'Cost, not count, decides the order.',
  steps: [['Log scrap by cause', 'Units and unit cost'], ['Price each cause', 'Units x cost'], ['Rank by cost', 'Share of the total'], ['Study the top cause', 'Owner and date']],
  sections: [
    sec('scope', 'The period', 'Say what was made and how much was good first time.', [
      text('product', 'Product or line', 'The product or line the scrap log covers, so causes are not mixed across different processes.', 'Housing 4410, machining line'),
      text('period', 'Period', 'The month or batch the log covers.', 'October'),
      num('started', 'Units started', 'units', 'All units that entered the process in the period, including those later scrapped or reworked.', '10000'),
      num('good_first', 'Good first time', 'units', 'Units that passed inspection the first time with no rework. First-pass yield is worked out from this.', '9200'),
    ]),
    sec('causes', 'Scrap causes', 'List each cause with units scrapped and cost per unit.', [
      tbl('causes', 'Causes of scrap', 'Cause', 'One row per cause recorded by inspection. Enter the units scrapped and what one scrapped unit cost you in rupees.', [
        ct('cause', 'Cause', 'A short label for the cause, for example Material defect.'),
        cn('units', 'Units scrapped', 'How many units were scrapped for this cause.', 'units'),
        cn('unit_cost', 'Cost per unit', 'What one scrapped unit cost you, in rupees, including material and work done.', 'rupees'),
        cc('cost', 'Scrap cost', 'Worked out: units scrapped times cost per unit.', { op: 'calc', expr: { mul: [c('units'), c('unit_cost')] }, format: 'int' }),
        cc('share', 'Share of scrap cost', 'Worked out: this cause\'s cost as a percentage of all scrap cost.', { op: 'calc', expr: { mul: [{ div: [{ mul: [c('units'), c('unit_cost')] }, { agg: 'sum', table: 'causes', col: 'cost' }] }, 100] }, format: 'pct' }),
      ], 3, 20),
    ]),
  ],
  plan: 'scrap causes',
  derived: [
    { key: 'fpy', label: 'First-pass yield', help: 'Good first time divided by units started.', rule: { op: 'calc', expr: { mul: [{ div: [f('good_first'), f('started')] }, 100] }, format: 'pct' } },
    { key: 'scrap_cost', label: 'Total scrap cost (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'causes', col: 'cost' }, format: 'int' } },
    { key: 'scrap_units', label: 'Units scrapped', rule: { op: 'calc', expr: { agg: 'sum', table: 'causes', col: 'units' }, format: 'int' } },
  ],
  outputs: [{ key: 'top_cause', label: 'Costliest cause of scrap', rule: { op: 'top', table: 'causes', by: 'cost', label: 'cause' } }],
  analysisGuide: 'State first-pass yield and the total scrap cost, then the costliest cause and its share. Note whether the costliest cause is also the most frequent; if not, say that cost and count point to different fixes. Remember that first-pass yield includes reworked units, so scrapped units alone do not explain the gap. Warn against closing a cause just because it is small this month. Recommend a root cause study for the top one or two causes, an owner by role, a scrap-cost target and a date, and say when the log will be re-ranked.',
  scenario: 'A machining line reviews a month of scrap. Causes and costs are fictional and for learning only.',
  values: { product: 'Housing 4410, machining line', period: 'October', started: '10000', good_first: '9200' },
  tables: { causes: [{ cause: 'Material defect', units: '300', unit_cost: '150' }, { cause: 'Setup error', units: '200', unit_cost: '100' }, { cause: 'Handling damage', units: '200', unit_cost: '75' }] },
  actions: [['Review the material defect with the supplier', 'Quality Manager', 'Supplier corrective action received'], ['Add a first-piece check after setup', 'Production Supervisor', 'Setup errors reduced'], ['Rerun this ranking next month', 'Quality Engineer', 'Scrap cost trend reported']],
});

/**
 * Maintenance Priority: criticality x failure likelihood (each 1 to 5), alongside the cost of one failure.
 * Priority score = criticality x likelihood (1 to 25). Cost of one failure = downtime cost per hour x hours to repair.
 */
export const MAINTENANCE_PRIORITY = agent({
  slug: 'maintenance-priority-ranker', name: 'Maintenance Priority Ranker', category: 'prioritisation',
  does: 'Ranks equipment for maintenance attention by how critical it is and how likely it is to fail, and shows what one failure would cost, so limited maintenance time goes where it protects most.',
  whenToUse: 'Use it when planning the maintenance schedule or budget, or after a breakdown, to decide which equipment gets preventive work first.',
  whenNotToUse: 'Do not use it to predict an exact failure date or to replace condition monitoring. It ranks equipment using your own ratings.',
  next: 'Schedule preventive work for the top-ranked equipment, and revisit the ratings after each breakdown.',
  summary: 'Maintenance time is short. Crossing how much a machine matters with how likely it is to fail puts preventive work where a failure would hurt most.',
  caption: 'Four steps from an equipment list to a maintenance order.',
  howToRead: ['Priority score is criticality times likelihood, from 1 to 25.', 'Cost of one failure shows the size of the loss, not its likelihood.', 'A high score with a low failure cost still needs a plan, but a cheaper one.'],
  diagramTitle: 'From an equipment list to a maintenance order', diagramCaption: 'Ratings are judgements with reasons; the sheet shows how they combine.',
  steps: [['List equipment', 'What matters to output'], ['Rate criticality', '1 low to 5 high'], ['Rate likelihood', 'From failure history'], ['Rank and plan', 'Score and failure cost']],
  sections: [
    sec('scope', 'The review', 'Say which plant and what evidence the ratings rest on.', [
      text('plant', 'Plant or area', 'The plant or area this review covers.', 'Pune plant, press shop'),
      text('basis', 'Evidence for the ratings', 'Say what you used to rate likelihood, such as breakdown history or condition checks, so another person could rate the same way.', 'Last 12 months of breakdown records'),
      text('owner', 'Owner of the plan (role)', 'The role responsible for acting on this ranking.', 'Maintenance Manager'),
      long('notes', 'Anything unusual', 'Note shutdowns, recent repairs or part shortages that change how likely a failure is.', 'Press 1 had a new hydraulic pump in March.'),
    ]),
    sec('equipment', 'Equipment', 'Rate each item. The table works out the priority and failure cost.', [
      tbl('equipment', 'Equipment', 'Equipment', 'One row per machine. Rate criticality and failure likelihood from 1 to 5, and give the downtime cost per hour and the hours a repair usually takes.', [
        ct('name', 'Equipment', 'The machine or asset name or tag.'),
        cr('crit', 'Criticality', 'How badly output stops if it fails: 1 is a minor delay, 5 is a full stop.', 'Minor', 'Full stop'),
        cr('like', 'Likelihood of failure', 'How likely it is to fail soon, from its history: 1 is very unlikely, 5 is very likely.', 'Unlikely', 'Likely'),
        cn('cost_hr', 'Downtime cost per hour', 'What one hour of stoppage costs you, in rupees.', 'rupees'),
        cn('repair_hrs', 'Hours to repair', 'Typical hours to get it running again after a failure.', 'hours'),
        cc('score', 'Priority score', 'Worked out: criticality times likelihood, from 1 to 25.', { op: 'calc', expr: { mul: [c('crit'), c('like')] }, format: 'int' }),
        cc('fail_cost', 'Cost of one failure', 'Worked out: downtime cost per hour times hours to repair, in rupees.', { op: 'calc', expr: { mul: [c('cost_hr'), c('repair_hrs')] }, format: 'int' }),
      ], 3, 40),
    ]),
  ],
  plan: 'maintenance jobs',
  derived: [{ key: 'count', label: 'Equipment rated', rule: { op: 'calc', expr: { agg: 'count', table: 'equipment', col: 'name' }, format: 'int' } }],
  outputs: [
    { key: 'top_priority', label: 'Highest priority', rule: { op: 'top', table: 'equipment', by: 'score', label: 'name' } },
    { key: 'costliest', label: 'Costliest single failure', rule: { op: 'top', table: 'equipment', by: 'fail_cost', label: 'name' } },
  ],
  analysisGuide: 'Name the highest-priority equipment and the one whose single failure costs most, and say whether they are the same. If they differ, explain that one is likelier to fail and the other would hurt more when it does. For the top items propose a specific preventive action, such as an inspection routine, a spare part or a condition check. Remind the reader that likelihood ratings come from history and should be updated after every breakdown. Give each action an owner by role, a date, and a measure such as breakdown hours, and say when the ranking will be rerun.',
  scenario: 'A press shop ranks three machines. Ratings and costs are fictional and for learning only.',
  values: { plant: 'Pune plant, press shop', basis: 'Last 12 months of breakdown records', owner: 'Maintenance Manager', notes: 'Press 1 had a new hydraulic pump in March.' },
  tables: { equipment: [{ name: 'Press 1', crit: '5', like: '4', cost_hr: '8000', repair_hrs: '6' }, { name: 'Conveyor 3', crit: '3', like: '3', cost_hr: '2000', repair_hrs: '3' }, { name: 'Air compressor', crit: '4', like: '4', cost_hr: '5000', repair_hrs: '4' }] },
  actions: [['Start a weekly lubrication and inspection routine for Press 1', 'Maintenance Manager', 'No unplanned stops from lubrication faults'], ['Hold a spare for the compressor valve', 'Stores Manager', 'Spare in stock'], ['Re-rate all equipment after the next breakdown', 'Maintenance Planner', 'Ratings updated']],
});
