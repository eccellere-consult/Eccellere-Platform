import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Lane profitability: revenue = trips x revenue per trip; cost = trips x cost per trip; margin percent = margin / revenue.
 */
const laneRev: Expr = { mul: [c('trips'), c('rev_trip')] };
const laneCost: Expr = { mul: [c('trips'), c('cost_trip')] };
const laneMargin: Expr = { sub: [laneRev, laneCost] };
const lanePct: Expr = { mul: [{ div: [laneMargin, laneRev] }, 100] };

export const LANE_PROFITABILITY = agent({
  slug: 'lane-profitability', name: 'Lane Profitability', category: 'analytical',
  does: 'Works out revenue, cost and margin for each lane you run, and flags the lanes earning less than your minimum margin so pricing and routing decisions are fact-based.',
  whenToUse: 'Use it monthly or before a rate negotiation, to see which lanes make money and which only look busy.',
  whenNotToUse: 'Do not use it when costs are shared across lanes and you have not allocated them in a way you can defend, or to judge one month of a seasonal lane.',
  next: 'Reprice, reroute or drop the weakest lane, and rerun after the change.',
  summary: 'Busy lanes are not always profitable ones. Margin per lane shows where to hold rates, where to push back and where to stop.',
  caption: 'Four steps from trips to a lane decision.',
  howToRead: ['Revenue and cost are trips times the per-trip figure.', 'Margin percent is margin over revenue.', 'Lanes under your minimum margin are flagged.'],
  diagramTitle: 'From trips to a lane decision', diagramCaption: 'Costs must be allocated the same way for every lane.',
  steps: [['List lanes', 'Trips and per-trip figures'], ['Work out margin', 'Revenue less cost'], ['Apply your minimum', 'Flag weak lanes'], ['Decide', 'Reprice, reroute or drop']],
  sections: [
    sec('scope', 'The basis', 'Set your minimum margin and say how costs were allocated.', [
      text('period', 'Period', 'The month or quarter the figures cover.', 'October'),
      num('min_margin', 'Minimum margin', 'percent', 'The margin below which a lane needs action, from your own targets.', '10'),
      long('cost_basis', 'How costs were allocated', 'Say what is in cost per trip (fuel, driver, tolls, maintenance, overhead) so lanes are comparable.', 'Fuel, driver, tolls and vehicle cost; no head office overhead.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Commercial Manager'),
    ]),
    sec('lanes', 'Lanes', 'Enter each lane. The table works out margin.', [
      tbl('lanes', 'Lanes', 'Lane', 'One row per lane. Revenue and cost per trip are averages in rupees.', [
        ct('lane', 'Lane', 'The origin and destination.'),
        cn('trips', 'Trips', 'Number of trips run in the period.', 'trips'),
        cn('rev_trip', 'Revenue per trip', 'Average revenue per trip, in rupees.', 'rupees'),
        cn('cost_trip', 'Cost per trip', 'Average cost per trip, in rupees.', 'rupees'),
        cc('revenue', 'Revenue', 'Worked out: trips times revenue per trip.', { op: 'calc', expr: laneRev, format: 'int' }),
        cc('cost', 'Cost', 'Worked out: trips times cost per trip.', { op: 'calc', expr: laneCost, format: 'int' }),
        cc('margin', 'Margin', 'Worked out: revenue less cost, in rupees.', { op: 'calc', expr: laneMargin, format: 'int' }),
        cc('margin_pct', 'Margin percent', 'Worked out: margin divided by revenue.', { op: 'calc', expr: lanePct, format: 'pct' }),
        cc('gap', 'Margin shortfall', 'Worked out: 100 minus margin percent, used to find the weakest lane.', { op: 'calc', expr: { sub: [100, lanePct] }, format: 'pct' }),
        cc('call', 'Call', 'Worked out: Below minimum when margin percent is under your minimum.', { op: 'when', expr: { sub: [lanePct, f('min_margin')] }, lt: 0, then: 'Below minimum', else: 'Meets minimum', tones: { then: 'bad', else: 'good' } }),
      ], 3, 50),
    ]),
  ],
  plan: 'lane decisions',
  derived: [
    { key: 'rev_total', label: 'Total revenue (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'lanes', col: 'revenue' }, format: 'int' } },
    { key: 'margin_total', label: 'Total margin (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'lanes', col: 'margin' }, format: 'int' } },
  ],
  outputs: [
    { key: 'best', label: 'Largest margin in rupees', rule: { op: 'top', table: 'lanes', by: 'margin', label: 'lane' } },
    { key: 'weakest', label: 'Lowest margin percent', rule: { op: 'top', table: 'lanes', by: 'gap', label: 'lane' } },
  ],
  analysisGuide: 'State total margin and name the best lane in rupees and the weakest in percent, which may be different lanes. For each lane below the minimum, say what would have to change in rate or cost to reach it, without inventing figures. Warn that allocation of shared cost changes the answer, and that a thin lane may feed a return load. Recommend reprice, reroute or drop, with an owner by role, a date and a measure, and say when the lanes will be reviewed again.',
  scenario: 'A transporter reviews three lanes for a month. Figures are fictional and for learning only.',
  values: { period: 'October', min_margin: '10', cost_basis: 'Fuel, driver, tolls and vehicle cost; no head office overhead.' },
  tables: { lanes: [{ lane: 'Mumbai to Pune', trips: '40', rev_trip: '20000', cost_trip: '15000' }, { lane: 'Delhi to Jaipur', trips: '30', rev_trip: '25000', cost_trip: '24000' }, { lane: 'Chennai to Bangalore', trips: '20', rev_trip: '30000', cost_trip: '21000' }] },
  actions: [['Ask the Delhi to Jaipur customer for a rate review', 'Commercial Manager', 'Margin above minimum'], ['Check fuel and toll cost on the Delhi lane', 'Operations Manager', 'Cost per trip checked'], ['Rerun lane margins next month', 'Logistics Analyst', 'Updated lane list']],
});

/**
 * Fleet utilisation: running share = running days / available days; load factor = average load / capacity; cost per km = cost / km.
 */
const util: Expr = { mul: [{ div: [c('running'), c('available')] }, 100] };

export const FLEET_UTILISATION = agent({
  slug: 'fleet-utilisation', name: 'Fleet Utilisation', category: 'analytical',
  does: 'Shows how many days each vehicle ran, how full it was and what each kilometre cost, so idle or expensive vehicles stand out.',
  whenToUse: 'Use it monthly on your vehicles, or before buying, hiring or reassigning vehicles.',
  whenNotToUse: 'Do not use it to judge drivers, or to compare vehicle types with different roles without saying so.',
  next: 'Reassign or release the lowest-utilised vehicles and look into the highest cost per kilometre.',
  summary: 'A vehicle that is idle or runs half empty costs nearly as much as a full one. Utilisation, load and cost per kilometre show where the waste is.',
  caption: 'Four steps from vehicle logs to a fleet decision.',
  howToRead: ['Utilisation is running days over available days.', 'Load factor is average load over capacity.', 'Cost per kilometre shows which vehicles are expensive to run.'],
  diagramTitle: 'From vehicle logs to a fleet decision', diagramCaption: 'Three ratios say whether to fill, move or retire a vehicle.',
  steps: [['List vehicles', 'Days, load, km, cost'], ['Work out ratios', 'Utilisation, load, cost per km'], ['Apply your target', 'Flag low utilisation'], ['Act', 'Reassign or release']],
  sections: [
    sec('scope', 'The basis', 'Set your target and period.', [
      text('period', 'Period', 'The month the vehicle logs cover.', 'October'),
      num('target_util', 'Utilisation target', 'percent', 'The share of available days you want vehicles running, from your own plan.', '80'),
      long('notes', 'Anything unusual', 'Note breakdowns, accidents or strikes that took vehicles off the road.', 'V2 was in the workshop for four days.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Fleet Manager'),
    ]),
    sec('vehicles', 'Vehicles', 'Enter each vehicle. The table works out the ratios.', [
      tbl('vehicles', 'Vehicles', 'Vehicle', 'One row per vehicle. Cost is total running cost for the period in rupees.', [
        ct('vehicle', 'Vehicle', 'The registration or fleet number.'),
        cn('available', 'Available days', 'Days the vehicle was available to run.', 'days'),
        cn('running', 'Running days', 'Days it actually ran.', 'days'),
        cn('km', 'Kilometres', 'Total kilometres run.', 'km'),
        cn('capacity', 'Capacity', 'Rated load capacity in tonnes.', 'tonnes'),
        cn('load', 'Average load', 'Average load carried per trip in tonnes.', 'tonnes'),
        cn('cost', 'Running cost', 'Fuel, driver, maintenance and tolls for the period, in rupees.', 'rupees'),
        cc('util', 'Utilisation', 'Worked out: running days divided by available days.', { op: 'calc', expr: util, format: 'pct' }),
        cc('load_factor', 'Load factor', 'Worked out: average load divided by capacity.', { op: 'calc', expr: { mul: [{ div: [c('load'), c('capacity')] }, 100] }, format: 'pct' }),
        cc('cost_km', 'Cost per km', 'Worked out: running cost divided by kilometres, in rupees.', { op: 'calc', expr: { div: [c('cost'), c('km')] }, format: 'dp1' }),
        cc('idle', 'Idle share', 'Worked out: 100 minus utilisation, used to find the least used vehicle.', { op: 'calc', expr: { sub: [100, util] }, format: 'pct' }),
        cc('call', 'Call', 'Worked out: Below target when utilisation is under your target.', { op: 'when', expr: { sub: [util, f('target_util')] }, lt: 0, then: 'Below target', else: 'Meets target', tones: { then: 'bad', else: 'good' } }),
      ], 3, 200),
    ]),
  ],
  plan: 'fleet actions',
  derived: [
    { key: 'cost_total', label: 'Total running cost (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'vehicles', col: 'cost' }, format: 'int' } },
    { key: 'km_total', label: 'Total kilometres', rule: { op: 'calc', expr: { agg: 'sum', table: 'vehicles', col: 'km' }, format: 'int' } },
  ],
  outputs: [
    { key: 'least_used', label: 'Least used vehicle', rule: { op: 'top', table: 'vehicles', by: 'idle', label: 'vehicle' } },
    { key: 'costliest', label: 'Highest cost per km', rule: { op: 'top', table: 'vehicles', by: 'cost_km', label: 'vehicle' } },
  ],
  analysisGuide: 'Name the least-used and the costliest vehicle and whether they are the same. Explain the pattern: low days with low load suggests too many vehicles; full load with high cost per kilometre suggests a maintenance or route issue. Warn that breakdowns and one-off events can explain a weak month. Recommend reassign, release or repair per vehicle with an owner by role, a date and a measure such as running days, and say when utilisation will be rechecked.',
  scenario: 'A fleet owner reviews three trucks for a month. Figures are fictional and for learning only.',
  values: { period: 'October', target_util: '80', notes: 'V2 was in the workshop for four days.' },
  tables: { vehicles: [{ vehicle: 'MH12-1001', available: '30', running: '26', km: '5200', capacity: '10', load: '8', cost: '78000' }, { vehicle: 'MH12-1002', available: '30', running: '18', km: '2700', capacity: '10', load: '5', cost: '54000' }, { vehicle: 'MH12-1003', available: '30', running: '24', km: '4800', capacity: '12', load: '9', cost: '62400' }] },
  actions: [['Find loads for MH12-1002 or reassign it', 'Fleet Manager', 'Running days above target'], ['Check why MH12-1002 costs more per km', 'Workshop Supervisor', 'Cause recorded'], ['Recheck utilisation next month', 'Logistics Analyst', 'Updated fleet list']],
});

/**
 * Warehouse productivity: picks per labour hour = picks / hours; accuracy = correct picks / picks.
 */
const perHour: Expr = { div: [c('picks'), c('hours')] };

export const WAREHOUSE_PRODUCTIVITY = agent({
  slug: 'warehouse-productivity', name: 'Warehouse Productivity', category: 'analytical',
  does: 'Compares zones or shifts on picks per labour hour and pick accuracy, and flags those below your target so training, layout or staffing can be fixed.',
  whenToUse: 'Use it weekly or monthly on your pick zones or shifts, or before changing staffing or layout.',
  whenNotToUse: 'Do not use it to rank individuals or to compare zones with very different items without saying so.',
  next: 'Observe the slowest zone, find the cause (layout, system, training), fix one thing, and rerun.',
  summary: 'Speed without accuracy creates returns, and accuracy without speed creates delay. Reading both for each zone shows what to fix.',
  caption: 'Four steps from pick counts to a floor action.',
  howToRead: ['Picks per hour is lines picked over labour hours.', 'Accuracy is correct picks over all picks.', 'Zones under your target are flagged.'],
  diagramTitle: 'From pick counts to a floor action', diagramCaption: 'Speed and accuracy are read together.',
  steps: [['List zones or shifts', 'Picks, hours, errors'], ['Work out rates', 'Per hour, accuracy'], ['Apply your target', 'Flag slow zones'], ['Fix one cause', 'Owner and date']],
  sections: [
    sec('scope', 'The basis', 'Set your target and period.', [
      text('site', 'Warehouse', 'The warehouse or site.', 'Bhiwandi warehouse'),
      num('target_rate', 'Target picks per hour', 'picks per hour', 'The pick rate you aim for, from your own engineered standard or history.', '50'),
      long('notes', 'Anything unusual', 'Note system outages, peak days or new staff that affect the rates.', 'Zone B had three new pickers.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Warehouse Manager'),
    ]),
    sec('zones', 'Zones', 'Enter each zone or shift. The table works out the rates.', [
      tbl('zones', 'Zones', 'Zone', 'One row per zone or shift. Picks are order lines picked; correct picks passed the check.', [
        ct('zone', 'Zone or shift', 'The zone or shift name.'),
        cn('picks', 'Picks', 'Order lines picked.', 'lines'),
        cn('hours', 'Labour hours', 'Hours of picking labour used.', 'hours'),
        cn('correct', 'Correct picks', 'Lines that were right at the check.', 'lines'),
        cc('rate', 'Picks per hour', 'Worked out: picks divided by labour hours.', { op: 'calc', expr: perHour, format: 'dp1' }),
        cc('accuracy', 'Accuracy', 'Worked out: correct picks divided by picks.', { op: 'calc', expr: { mul: [{ div: [c('correct'), c('picks')] }, 100] }, format: 'pct' }),
        cc('slow', 'Hours per 100 picks', 'Worked out: labour hours per 100 picks, used to find the slowest zone.', { op: 'calc', expr: { mul: [{ div: [c('hours'), c('picks')] }, 100] }, format: 'dp2' }),
        cc('call', 'Call', 'Worked out: Below target when picks per hour is under your target.', { op: 'when', expr: { sub: [perHour, f('target_rate')] }, lt: 0, then: 'Below target', else: 'Meets target', tones: { then: 'bad', else: 'good' } }),
      ], 3, 50),
    ]),
  ],
  plan: 'floor actions',
  derived: [
    { key: 'picks_total', label: 'Total picks', rule: { op: 'calc', expr: { agg: 'sum', table: 'zones', col: 'picks' }, format: 'int' } },
    { key: 'hours_total', label: 'Total labour hours', rule: { op: 'calc', expr: { agg: 'sum', table: 'zones', col: 'hours' }, format: 'int' } },
  ],
  outputs: [{ key: 'slowest', label: 'Slowest zone', rule: { op: 'top', table: 'zones', by: 'slow', label: 'zone' } }],
  analysisGuide: 'Name the slowest zone and its pick rate against the target, and give accuracy alongside; a fast zone with low accuracy is not a good result. Say what the context suggests (new staff, layout, system) and warn against ranking individuals from zone figures. Recommend one fix for the slowest zone, with an owner by role, a date and a measure, and say when the rates will be compared again.',
  scenario: 'A warehouse compares three pick zones for a week. Figures are fictional and for learning only.',
  values: { site: 'Bhiwandi warehouse', target_rate: '50', notes: 'Zone B had three new pickers.' },
  tables: { zones: [{ zone: 'Zone A fast movers', picks: '4800', hours: '80', correct: '4752' }, { zone: 'Zone B slow movers', picks: '3000', hours: '75', correct: '2910' }, { zone: 'Zone C bulk', picks: '2400', hours: '30', correct: '2376' }] },
  actions: [['Observe Zone B and note where time is lost', 'Warehouse Manager', 'Causes listed'], ['Retrain new pickers in Zone B', 'Shift Supervisor', 'Pick rate improved'], ['Rerun the comparison next week', 'Logistics Analyst', 'Updated zone list']],
});
