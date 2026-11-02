/**
 * samples/execution.ts — the worked examples for STP, the 9-box talent grid, OKRs down to individual KRAs and the First 90
 * Days plan, told about the fictional Anand Auto Components (Pune). They tie to the other demos: the welded-bracket segment
 * the portfolio tools favoured, Line 2 rework and the second welding line, the EV tooling studio from the Lean Canvas and the
 * minimum viable financial model, and the people the 7S review and the RACI chart worried about. All names are fictional.
 */
import type { ModelSample } from '../types';

export const EXECUTION_SAMPLES: Record<string, ModelSample> = {
  stp: {
    scenario: 'Anand Auto Components (Pune) — choosing the segment to build the second welding line for, and the position to claim in it.',
    values: {
      customer_type: 'B2B',
      segmentation_basis: 'By who buys and how: established OEMs against EV start-ups; by programme type — high-volume machined parts against low-volume welded and engineered ones; and by what decides the choice of supplier (price and PPM, design help and speed, or capacity).',
      target: 'Established OEMs — welded and engineered brackets',
      target_why: 'It scores highest (20 of 25): the market is growing about 12% a year, Anand already supplies two of the OEMs and has the engineering team, and the second welding line is being built for it. EV start-ups come second and are reached through the tooling-studio pilots.',
      not_targeting: 'Tier-1 overflow and aftermarket work: both would pull capacity from the bracket line for lower prices. High-volume machined parts for established OEMs are served and defended, not grown.',
      decision_owner: 'Sales Head, signed off by the Managing Director',
      target_customers: 'OEM programme and sourcing managers in two-wheeler and commercial-vehicle chassis',
      need: 'need welded brackets that pass approval first time, and a supplier who helps design them for manufacture',
      category: 'an IATF 16949 chassis-bracket specialist',
      benefit: 'cuts approval time and rework by designing and welding to the OEM’s own standard',
      alternative: 'general fabricators and large Tier-1 suppliers',
      reason_to_believe: 'we have the engineering team, the certified plant and a second welding line built for brackets',
      chosen_position: 'The bracket partner that gets it right first time',
      notes: '',
    },
    tables: {
      segments: [
        { segment: 'Established OEMs — high-volume machined parts', needs: 'Price, PPM, on-time delivery and the IATF certificate; they already have approved suppliers.', size: '5', growth: '2', reach: '5', fit: '4', room: '2' },
        { segment: 'Established OEMs — welded and engineered brackets', needs: 'Weld integrity, design-for-manufacture help and quick approval; they want fewer suppliers who can do the whole part.', size: '4', growth: '4', reach: '4', fit: '5', room: '3' },
        { segment: 'EV start-ups — prototype tooling and first production', needs: 'Speed in weeks, one supplier from prototype to production, and flexibility on small runs.', size: '2', growth: '5', reach: '3', fit: '4', room: '5' },
        { segment: 'Tier-1 suppliers — overflow and job work', needs: 'Capacity at short notice at a low price, with consistent quality.', size: '3', growth: '2', reach: '4', fit: '3', room: '2' },
        { segment: 'Aftermarket and agricultural equipment', needs: 'Low cost and small batches; little interest in certification.', size: '2', growth: '3', reach: '2', fit: '2', room: '3' },
      ],
    },
    why: {
      segments: 'Each segment is a group of buyers who want different things, scored on the five tests; the scores are discussed, not averaged.',
      target: 'The target follows the scores, and says why the runner-up is reached a different way.',
      reason_to_believe: 'The proof names things that can be checked: the team, the certificate and the line.',
    },
    analysis: {
      summary: 'Anand has divided the market into five segments of buyers who want different things and scored each out of 25. The welded-and-engineered-bracket segment for established OEMs comes first with 20, ahead of EV start-ups (19) and the high-volume machined segment (18), and the chosen target follows the scores. The positioning statement is specific — one benefit, a named alternative and proof — but its central promise, brackets that pass approval first time, is not yet true: Line 2 welding rework is 5.4%, so the position should not be claimed until the rework fix has landed.',
      verdict: {
        label: 'The right target — but do not claim “first time” until Line 2 earns it',
        rationale: 'The target follows the top score (20 of 25), but the position’s proof depends on a rework rate that is still above the 2% the plan aims for.',
      },
      findings: [
        { title: 'The target follows the scores', detail: 'Welded and engineered brackets score 20 of 25: size 4, growth 4, reach 4, fit 5, room 3. It is the strongest segment on fit and the second welding line is already planned for it.' },
        { title: 'EV start-ups are a close second', detail: 'At 19 the EV segment scores highest on growth and room (5 each), but only 2 on size; reaching it through the tooling-studio pilots is a sensible way to test it without committing capacity.' },
        { title: 'The segmentation is by buyers, not products', detail: 'The five segments differ in who buys and what decides the choice, not in what Anand makes, which is what makes the scores meaningful.' },
        { title: 'The proof is not yet true', detail: 'The position promises parts that pass approval first time, but Line 2 rework is 5.4% and the weld defect review is only starting; an OEM auditor would find the gap.' },
      ],
      watchouts: [
        'The ratings are the sales team’s own; none has been checked with a customer, and “room” in particular is a guess about rivals.',
        'High-volume machined parts score 18 and still earn most of the profit; “serve and defend” needs a named owner or it will be neglected.',
        'The decision owner is one person, but the RACI chart has not yet given the Sales Head accountability for the target.',
      ],
    },
    recommendations: [
      'Choose the bracket segment as the target, and hold the “right first time” claim back until Line 2 rework is under 3% for a full quarter.',
      'Test the ratings with three OEM buyers before the positioning is used in proposals, starting with “reach” and “room”.',
      'Use the tooling-studio pilots as the way into the EV segment, and score the segment again after the three pilots.',
      'Give the high-volume machined segment a named owner and a short defend plan, so the core business is served and not forgotten.',
    ],
    actionables: [
      { action: 'Check the ratings for the bracket and EV segments with three OEM sourcing managers', owner: 'Sales Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Hold the “right first time” claim until Line 2 rework has been under 3% for a quarter', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Name an owner and a defend plan for the high-volume machined segment', owner: 'Operations Head', timeframe: 'Within 60 days', priority: 'Medium' },
      { action: 'Re-score the EV segment after the three tooling pilots', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  ninebox: {
    scenario: 'Anand Auto Components (Pune) — the half-yearly talent review of the supervisors and engineers the growth plan leans on.',
    values: {
      cohort: 'Supervisors, engineers and sales engineers — eight people, half-yearly review',
      evidence: 'Performance: the last two quarters against the key results and scorecard measures each person owns. Potential: judged by the head and one peer on how fast the person learns, how well they work across lines, and their appetite for a bigger role — each against a written description.',
      calibration: 'The four heads and the HR Lead compared the ratings in one meeting in March; nobody’s ratings were left to their own manager alone.',
      critical_roles: 'The Line 2 supervisor and the Quality Head’s deputy have no ready successor; Meena Joshi and Rohit Kulkarni are the first candidates for them. The Line 1 supervisor role is covered.',
      notes: '',
    },
    tables: {
      people: [
        { person: 'Meena Joshi', role: 'Quality engineer', performance: 'High', potential: 'High', retention_risk: 'Moderate', action: 'Lead the Line 2 process-control training; stretch assignment as deputy to the Quality Head.' },
        { person: 'Rohit Kulkarni', role: 'Line 2 supervisor', performance: 'Moderate', potential: 'High', retention_risk: 'Low', action: 'Welding process certification; own the Line 2 rework key result.' },
        { person: 'Sneha Patil', role: 'Sales engineer', performance: 'High', potential: 'Moderate', retention_risk: 'High', action: 'Retention conversation this month; a defined programme-lead role on the bracket contracts.' },
        { person: 'Imran Shaikh', role: 'Training coordinator', performance: 'Moderate', potential: 'Moderate', retention_risk: 'Low', action: 'Run the supervisor training programme; develop in project management.' },
        { person: 'Vikram Desai', role: 'Line 1 supervisor', performance: 'High', potential: 'Low', retention_risk: 'Low', action: 'Keep as the Line 1 anchor and a mentor to the other supervisors; recognise publicly.' },
        { person: 'Anita Rao', role: 'Tool-room designer', performance: 'Low', potential: 'High', retention_risk: 'Moderate', action: 'A candid conversation to find out what is holding performance back; a project with clearer goals.' },
        { person: 'Suresh Pawar', role: 'Line 2 shift supervisor', performance: 'Low', potential: 'Low', retention_risk: 'Low', action: 'A 90-day improvement plan with a review date.' },
        { person: 'Deepak More', role: 'Purchase executive', performance: 'Moderate', potential: 'Low', retention_risk: 'Low', action: 'Maintain; cross-train on the supplier scorecards.' },
      ],
    },
    why: {
      evidence: 'Both scales rest on written evidence, so a rating can be challenged and a person is not simply placed by impression.',
      calibration: 'Ratings were compared across the heads in one meeting, which removes most of the leniency and favouritism of single-manager ratings.',
      people: 'Each person has an action, because a box without an action is only a label.',
    },
    analysis: {
      summary: 'Of the eight people reviewed, three are in the top boxes — a Star, a Growth employee and a High performer — three are solid in the middle, and two need attention: one Enigma (high potential, low performance) and one Underperformer. The most urgent finding sits in the top boxes, not the bottom: the High performer, a sales engineer who is closing the bracket quotes, has a high risk of leaving, and the two roles with no ready successor depend on the Star and the Growth employee staying and growing.',
      verdict: {
        label: 'A usable bench — but one high performer at risk and two roles with no successor',
        rationale: 'Three of eight are in the top boxes and calibrated, but the retention risk is concentrated in the top boxes and two critical roles are uncovered.',
      },
      findings: [
        { title: 'The top boxes carry the plan', detail: 'The Star (Meena Joshi) and the Growth employee (Rohit Kulkarni) are the first candidates for the two uncovered roles, and both own key results this quarter.' },
        { title: 'The retention risk is in the top boxes', detail: 'Sneha Patil, rated a High performer, is closing the two bracket quotes and has a high risk of leaving; losing Sneha mid-quarter would put the programme key result at risk.' },
        { title: 'The Enigma needs a conversation', detail: 'Anita Rao is rated high potential but low performance; the cause — goals, fit or something else — should be found out before any development action is chosen.' },
        { title: 'The ratings were calibrated', detail: 'The four heads and HR compared the ratings together, which removes most of the leniency and favouritism that single-manager ratings carry.' },
      ],
      watchouts: [
        'Eight people is a small group: the grid shows relative positions, and one rating change moves a person across a box.',
        'Potential is a judgement about the future and the easiest rating to bias; it should be re-checked against what the person actually does in a bigger role.',
        'A person’s box should never be shared with them as a label; it guides decisions about development and succession only.',
      ],
    },
    recommendations: [
      'Hold a retention conversation with Sneha Patil this month: a defined programme-lead role on the bracket contracts, a development plan and a pay review.',
      'Name Meena Joshi and Rohit Kulkarni as the successors for the two uncovered roles and give each a stretch assignment in this quarter’s key results.',
      'Have a candid conversation with Anita Rao to find out why someone rated high potential is performing below expectations, before choosing an action.',
      'Put Suresh Pawar on a 90-day improvement plan with a clear review date, and decide at the end of it whether the role is the right one.',
    ],
    actionables: [
      { action: 'Hold a retention conversation with Sneha Patil and agree a programme-lead role on the bracket contracts', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Name successors for the Line 2 supervisor and the Quality Head’s deputy and give each a stretch assignment', owner: 'Operations Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Meet Anita Rao to understand what is holding performance back', owner: 'Engineering Head', timeframe: 'Within 30 days', priority: 'Medium' },
      { action: 'Agree a 90-day improvement plan for Suresh Pawar with a review date', owner: 'HR Lead', timeframe: 'Within 30 days', priority: 'Medium' },
    ],
  },

  okrs: {
    scenario: 'Anand Auto Components (Pune) — this quarter’s objective: prove Line 2 so the second welding line can be approved.',
    values: {
      parent_objective: 'Internal process: cut rework on Line 2 so that the second welding line can be approved against a proven process.',
      yearly_goals: 'Goal 2: EBITDA margin — 16.5% (FY 2027-28)\nGoal 3: On-time-in-full delivery to the anchor OEMs — 92% (Within 12 months)',
      people_context: 'Meena Joshi (Quality engineer), Rohit Kulkarni (Line 2 supervisor)',
      near_term_plan: 'The EV tooling pilots (the 90-day plan) use tool-room hours: the first pilots are signed in days 31–60, so the Line 2 fixture work is scheduled around them.',
      objective: 'Prove Line 2 so the second welding line can be approved',
      review_rhythm: 'A 20-minute weekly check-in on the four key results with the Operations Head; confidence updated every Friday; a full review at the end of the quarter.',
      notes: '',
    },
    tables: {
      krs: [
        { kr: 'Line 2 rework rate (%)', start: '5.4', target: '3', current: '4.6', confidence: '3', owner: 'Quality Head' },
        { kr: 'First-pass yield on Line 2 welds (%)', start: '91', target: '96', current: '93', confidence: '3', owner: 'Operations Head' },
        { kr: 'Bracket contracts signed with OEMs', start: '0', target: '2', current: '1', confidence: '2', owner: 'Sales Head' },
        { kr: 'Supervisors trained in welding process control (of 6)', start: '0', target: '6', current: '2', confidence: '4', owner: 'HR Lead' },
      ],
      kras: [
        { person: 'Meena Joshi (Quality engineer)', supports: 'KR 1', kra: 'Run the daily weld-defect review and log the cause of every reject.', measure: 'Rejects logged with a cause', kra_target: '100%' },
        { person: 'Rohit Kulkarni (Line 2 supervisor)', supports: 'KR 2', kra: 'Make sure every shift uses the new fixture and checks the first part.', measure: 'Shifts using the new fixture', kra_target: 'All 3 shifts' },
        { person: 'Vikram Desai (Line 1 supervisor)', supports: 'KR 2', kra: 'Share the Line 1 first-part check with Line 2 and coach its supervisors.', measure: 'Coaching sessions held', kra_target: '4' },
        { person: 'Sneha Patil (Sales engineer)', supports: 'KR 3', kra: 'Close the two bid-stage bracket quotes.', measure: 'Contracts signed', kra_target: '2' },
        { person: 'Imran Shaikh (Training coordinator)', supports: 'KR 4', kra: 'Run the welding process course for the six supervisors.', measure: 'Supervisors trained', kra_target: '6' },
      ],
    },
    why: {
      objective: 'It says what to prove, without a number, and it is the condition the portfolio plan set for releasing the second welding line.',
      krs: 'Each key result is an outcome with a start and a target; the confidence of 3 on the rework result says it is a real stretch.',
      kras: 'Every key result has a named person owning a slice, and the owners are mostly the high-potential people from the 9-box review.',
    },
    analysis: {
      summary: 'The quarter has one clear objective — prove Line 2 so the second welding line can be approved — and four key results that are outcomes with a start and a target: rework from 5.4% to 3%, first-pass yield from 91% to 96%, two bracket contracts signed and six supervisors trained. Average progress is 39%. Every key result has a person owning a slice, and the owners include the two high-potential people from the talent review. The key result most at risk is the bracket contracts, where confidence is only 2 of 5 and a single person, who also has a high risk of leaving, owns the whole slice.',
      verdict: {
        label: 'A clear quarter — protect the bracket-contract key result',
        rationale: 'The objective and key results are outcomes with numbers and owners, but KR 3 has the lowest confidence and rests on one person who is a retention risk.',
      },
      findings: [
        { title: 'The key results are outcomes', detail: 'Each has a start, a target and a current value, not a task: rework 5.4% to 3%, yield 91% to 96%, two contracts, six supervisors trained — and average progress is 39%.' },
        { title: 'KR 3 is the one at risk', detail: 'Bracket contracts signed has confidence 2 of 5, one contract so far, and a single owner of the slice who the talent review rated a high retention risk.' },
        { title: 'The stretch is owned by the right people', detail: 'Meena Joshi and Rohit Kulkarni, the Star and the Growth employee, own the rework and yield slices, which develops the successors the review said are missing.' },
        { title: 'Two key results move together', detail: 'Rework and first-pass yield measure the same weld quality from two sides; if one improves and the other does not, the measurement, not the welding, is wrong.' },
      ],
      watchouts: [
        'The EV tooling pilots use tool-room hours in the same weeks as the Line 2 fixture work; the near-term plan and these key results compete for the same people.',
        'A key result everyone is confident of is not a stretch; none has confidence of 5, which is right, but KR 4 at 4 may be too easy.',
        'Individual KRAs for the supervisors are measured by behaviours (shifts using the fixture), which can be gamed; the weekly rework figure is the real check.',
      ],
    },
    recommendations: [
      'Add a second owner or a backup to the bracket-contract key result this week, and act on the retention conversation recommended by the talent review.',
      'Schedule the Line 2 fixture work around the EV pilot weeks in writing, so the tool room is not double-booked.',
      'Check rework and first-pass yield against each other every Friday; if they diverge, audit how rejects are counted before changing anything on the line.',
      'Review confidence every Friday and ask for help on any key result that drops to 2, instead of waiting for the end of the quarter.',
    ],
    actionables: [
      { action: 'Name a backup for the bracket-contract slice and agree with Sneha Patil what would make them stay on it', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Schedule the Line 2 fixture work around the EV pilot weeks and agree it with the Engineering Head', owner: 'Operations Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Compare the weekly rework and first-pass yield figures every Friday', owner: 'Quality Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Raise KR 4 to include a test of the trained supervisors on the line, not only attendance', owner: 'HR Lead', timeframe: 'Within 45 days', priority: 'Low' },
    ],
  },

  first90: {
    scenario: 'Anand Auto Components (Pune) — the first 90 days of the EV tooling studio, after the Lean Canvas and the first financial model.',
    values: {
      direction: 'Test the EV tooling studio idea with three paid pilot programmes for start-ups, to find out whether they will pay for three-week tooling and then give Anand the production order.',
      risk: 'That start-ups will not pay a premium for speed — the one assumption that decides whether the idea is worth building.',
      success: 'Three paid pilots delivered in about three weeks each, at least two start-ups saying in writing that they would place production orders, and the financial model updated with the real price, cost and payment terms.',
      notes: '',
    },
    tables: {
      plan: [
        { block: 'Days 1–30', outcome: 'The pilot offer is written and priced at ₹1.5 lakh a job, and ten start-ups from two incubators have been interviewed about it.', actions: 'Write the offer: scope, three-week promise, fixed price and bridge-to-production terms\nBook interviews with ten start-ups through two incubators\nReserve tool-room hours for the pilots', owner: 'Engineering Head', status: 'On track' },
        { block: 'Days 31–60', outcome: 'Two pilots are signed, paid for (half in advance) and in production.', actions: 'Sign two pilot programmes with half the fee in advance\nRun the first fixture sets through the fixture-library process\nTrack lead time against the three-week promise', owner: 'Sales Head', status: 'Not started' },
        { block: 'Days 61–90', outcome: 'Three pilots are delivered, and each start-up has said in writing whether it would place a production order.', actions: 'Deliver the third pilot and close out the first two\nAsk each start-up for a written production-order intent\nUpdate the financial model with the real price, cost and payment terms', owner: 'Strategy Lead', status: 'Not started' },
      ],
    },
    why: {
      risk: 'It names the one assumption that decides the idea, so every block can be tested against it.',
      plan: 'Each block has one outcome that can be marked done or not done, three actions and one owner; none is a list of activities.',
      success: 'Success is stated as evidence — pilots delivered and written intent to buy — not as effort.',
    },
    analysis: {
      summary: 'The plan attacks the one risk that decides the idea — whether start-ups will pay for speed — in three sequenced blocks: set up and interview in the first 30 days, sign and run two paid pilots in days 31 to 60, and deliver three pilots and get written production-order intent by day 90. Each block has a single outcome that is done or not done, three actions and an owner, and half the fee is taken in advance, which is also what the cash model said the studio needs. It is small enough for a team that is also running a plant.',
      verdict: {
        label: 'A real test of the riskiest assumption — protect the tool-room hours',
        rationale: 'Each block has a done-or-not-done outcome, three actions and an owner, and day 90 answers the risk; the main threat is the tool room being double-booked.',
      },
      findings: [
        { title: 'Every block can be marked done', detail: 'The outcomes are “offer written and ten interviews held”, “two pilots signed, paid and in production” and “three pilots delivered with written intent”: each is either true or not on its date.' },
        { title: 'The plan attacks the risk directly', detail: 'The willingness to pay is tested in block one (interviews at a stated price), block two (money in advance) and block three (written intent to buy), so the risk shrinks every month.' },
        { title: 'The cash terms are built in', detail: 'Taking half the fee in advance is the payment term the financial model showed removes the funding gap, so the plan tests and de-risks the money at the same time.' },
        { title: 'Owners are different people', detail: 'The Engineering Head, the Sales Head and the Strategy Lead each own one block, so the plan does not depend on one person for all 90 days.' },
      ],
      watchouts: [
        'The pilots and the Line 2 fixture work use the same tool-room hours; if the plant slips, the pilots would be the first to be cut.',
        'Interviews with ten start-ups will tell what people say, not what they will pay: the paid pilots in block two are the real test.',
        'Three pilots is a small sample; two written intents to buy is a signal, not a proof, and the plan should say what it will do if only one converts.',
      ],
    },
    recommendations: [
      'Reserve the tool-room hours for the pilots in writing now, and agree with the Operations Head which Line 2 work moves if the two collide.',
      'Decide in advance what happens at day 90: two or three written intents to buy graduates the studio to quarterly OKRs; one or none means stop or change the offer.',
      'Treat the interviews as price tests: ask each start-up what they would pay for three weeks, not whether they like the idea.',
      'Put the actual price, cost and payment terms from the pilots into the minimum viable financial model at day 90 and re-run it.',
    ],
    actionables: [
      { action: 'Reserve the tool-room hours for the three pilots and agree the rule if they collide with Line 2 work', owner: 'Operations Head', timeframe: 'Within 14 days', priority: 'High' },
      { action: 'Write the pilot offer with the ₹1.5 lakh job price and the half-in-advance term', owner: 'Engineering Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Book interviews with ten start-ups through two incubators and record what each would pay', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'Medium' },
      { action: 'Agree the day-90 decision rule: what result graduates the studio and what stops it', owner: 'Managing Director', timeframe: 'Within 30 days', priority: 'Medium' },
    ],
  },
};
