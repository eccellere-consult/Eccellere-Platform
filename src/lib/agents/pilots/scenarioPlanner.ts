import type { DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';

/**
 * Scenario Planner: choosing between options when the future is uncertain.
 *
 * Methods (all fixed formulas, nothing estimated by AI):
 *  - Expected monetary value (EMV) = sum of probability x payoff, probabilities rescaled to total 1.
 *  - Standard deviation of the payoff = sqrt(sum of probability x (payoff - EMV)^2): the spread of outcomes, i.e. the risk.
 *  - Mean-standard-deviation score = EMV - k x SD, with k the decision maker's risk weight (0 = risk neutral).
 *  - Wald's maximin (best worst case), maximax (best best case) and Hurwicz's optimism-weighted blend, for when probabilities are not trusted.
 *  - Savage's minimax regret: pick the option whose largest "I should have chosen another" loss is smallest.
 *  - Expected value of perfect information (EVPI) = sum of probability x best payoff per scenario - best EMV: the most worth paying for certainty.
 */

const f = (field: string): Expr => ({ field });
const c = (cell: string): Expr => ({ cell });
const P = [f('p_best'), f('p_base'), f('p_worst')] as const;
const X = [c('best'), c('base'), c('worst')] as const;
const total: Expr = { add: [...P] };
/** probability-weighted average of three payoffs (probabilities rescaled to total 1) */
const weighted = (xs: readonly Expr[]): Expr => ({ div: [{ add: xs.map((x, i) => ({ mul: [P[i], x] })) }, total] });
const emv: Expr = weighted(X);
const sq = (e: Expr): Expr => ({ pow: [e, 2] });
const variance: Expr = weighted(X.map((x) => sq({ sub: [x, emv] })));
const sd: Expr = { sqrt: variance };
const maxOf: Expr = { max: [...X] };
const minOf: Expr = { min: [...X] };
const colMax = (col: string): Expr => ({ agg: 'max', table: 'options', col });
const regrets: Expr[] = [{ sub: [colMax('best'), c('best')] }, { sub: [colMax('base'), c('base')] }, { sub: [colMax('worst'), c('worst')] }];
const evPerfect: Expr = weighted([colMax('best'), colMax('base'), colMax('worst')]);

export const SCENARIO_PLANNER: DeclarativeTool = {
  schema: 1,
  slug: 'scenario-planner',
  name: 'Scenario Planner',
  category: 'planning',
  does: 'Compares options across a best, base and worst case: it works out the expected value and the risk of each option, then ranks them by six recognised decision rules so you can see where the rules agree and where they disagree.',
  whenToUse: 'Use it when you must commit capital, capacity or effort before the future is known, and you have two or more options and a view of how likely each scenario is.',
  whenNotToUse: 'Do not use it when only one option exists, when the outcomes cannot be put in the same unit, or when a legal or safety duty decides the matter whatever the payoff.',
  next: 'Take the preferred option into the Capital Allocation Advisor to test it against other uses of the same money, and set the signposts as monthly review items.',
  reference: {
    originator: 'Abraham Wald (maximin), Leonard J. Savage (minimax regret), Leonid Hurwicz (optimism index), Howard Raiffa and Robert Schlaifer (expected value of perfect information); scenario thinking after Peter Schwartz, The Art of the Long View',
    year: '1950 to 1991',
    summary: 'A payoff table sets each option against each possible future. Expected value averages the payoffs by likelihood, the spread measures risk, and four rules for deciding without trusting the probabilities act as stress tests.',
    caption: 'Five steps from the decision to the signposts that tell you which future is arriving.',
    howToRead: [
      'Start with expected value and the risk-adjusted score: they use your probabilities.',
      'Then read maximin, maximax and regret: they ignore your probabilities and show how the choice behaves if you are wrong.',
      'The value of perfect information caps what any forecast, study or pilot is worth paying for.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From uncertainty to a defensible choice',
    steps: [
      { name: 'Frame the decision', hint: 'What, by when, measured how' },
      { name: 'Set the scenarios', hint: 'Best, base, worst and their likelihood' },
      { name: 'Fill the payoffs', hint: 'One number per option and scenario' },
      { name: 'Apply the rules', hint: 'Expected value, risk, regret' },
      { name: 'Set signposts', hint: 'Early signs of which future is coming' },
    ],
    caption: 'The same payoff table is read through several rules; agreement between them is the strongest evidence for a choice.',
  },
  sections: [
    {
      key: 'decision',
      title: 'The decision',
      summary: 'Say what is being decided, how it is measured and what limits the choice.',
      parts: [
        { kind: 'field', key: 'decision', label: 'What are you deciding?', type: 'longtext', help: 'Describe the choice in one or two sentences, including the date by which it must be made and who makes it.', example: 'Whether to expand the Pune plant, outsource overflow volume, or hold capacity for the next 3 years; board decision in March.' },
        { kind: 'field', key: 'metric', label: 'What is the payoff measured in?', type: 'text', help: 'Name the single measure every payoff uses, with its unit and period, so that all options are compared like with like.', example: 'Cumulative operating profit uplift over 3 years, in ₹ lakh' },
        { kind: 'field', key: 'constraint', label: 'What limits the choice?', type: 'text', help: 'Name the budget, capacity, regulation or time limits that make some options impossible, so the options below are all feasible.', example: 'Capital limit of ₹600 lakh; no new debt above 2x EBITDA' },
      ],
    },
    {
      key: 'view',
      title: 'Your view of the future',
      summary: 'Set how likely each scenario is and how you want risk treated.',
      parts: [
        { kind: 'field', key: 'p_best', label: 'Likelihood of the best case', type: 'number', unit: '%', help: 'Your honest probability that the favourable scenario happens. The three likelihoods should total 100; if they do not, the maths rescales them and a warning shows.', example: '25' },
        { kind: 'field', key: 'p_base', label: 'Likelihood of the base case', type: 'number', unit: '%', help: 'The probability of the most likely, middle scenario. Use the same evidence for all three likelihoods, such as order book, market data and expert views.', example: '50' },
        { kind: 'field', key: 'p_worst', label: 'Likelihood of the worst case', type: 'number', unit: '%', help: 'The probability of the unfavourable scenario. Do not set this to zero: if it cannot happen, it is not the worst case you should plan for.', example: '25' },
        { kind: 'field', key: 'risk_weight', label: 'How much to penalise risk', type: 'number', unit: 'x spread', help: 'Each option is scored as expected value minus this number times its spread. Use 0 if the organisation can absorb a bad outcome, 0.5 for a balanced view, 1 or more if a bad outcome would be severe.', example: '0.5' },
        { kind: 'field', key: 'optimism', label: 'Optimism index for the blended rule', type: 'number', unit: 'index 0 to 1', help: 'Used only by the Hurwicz rule: 0 trusts only the worst case, 1 trusts only the best case, 0.5 weights them equally. Choose before you see the results, so the answer cannot steer the choice.', example: '0.4' },
      ],
    },
    {
      key: 'payoffs',
      title: 'Options and payoffs',
      summary: 'List each option and its payoff in each scenario. The table works out the rest.',
      parts: [
        {
          kind: 'table', key: 'options', label: 'Options', rowLabel: 'Option', minRows: 2, maxRows: 8,
          help: 'One row per option, including the option of doing nothing. Use the same unit for every payoff and include all costs, so a loss is a negative number.',
          columns: [
            { key: 'option', header: 'Option', help: 'A short name everyone recognises.', type: 'text' },
            { key: 'best', header: 'Payoff if best case', help: 'Value of this option if the favourable scenario occurs.', type: 'number', unit: 'in your unit' },
            { key: 'base', header: 'Payoff if base case', help: 'Value of this option if the middle scenario occurs.', type: 'number', unit: 'in your unit' },
            { key: 'worst', header: 'Payoff if worst case', help: 'Value of this option if the unfavourable scenario occurs; negative for a loss.', type: 'number', unit: 'in your unit' },
            { key: 'emv', header: 'Expected value', help: 'Worked out: each payoff times its likelihood, added up.', type: 'computed', rule: { op: 'calc', expr: emv, format: 'dp1' } },
            { key: 'spread', header: 'Spread (risk)', help: 'Worked out: the standard deviation of the payoffs around the expected value. Bigger means riskier.', type: 'computed', rule: { op: 'calc', expr: sd, format: 'dp1' } },
            { key: 'risk_adj', header: 'Risk-adjusted score', help: 'Worked out: expected value minus your risk weight times the spread.', type: 'computed', rule: { op: 'calc', expr: { sub: [emv, { mul: [f('risk_weight'), sd] }] }, format: 'dp1' } },
            { key: 'maximin', header: 'Worst case (maximin)', help: 'Worked out: the lowest payoff across the scenarios. The option with the highest value here is the safest.', type: 'computed', rule: { op: 'calc', expr: minOf, format: 'dp1' } },
            { key: 'maximax', header: 'Best case (maximax)', help: 'Worked out: the highest payoff across the scenarios. The option with the highest value here is the boldest.', type: 'computed', rule: { op: 'calc', expr: maxOf, format: 'dp1' } },
            { key: 'hurwicz', header: 'Blended (Hurwicz)', help: 'Worked out: your optimism index times the best case plus the rest times the worst case.', type: 'computed', rule: { op: 'calc', expr: { add: [{ mul: [f('optimism'), maxOf] }, { mul: [{ sub: [1, f('optimism')] }, minOf] }] }, format: 'dp1' } },
            { key: 'regret_score', header: 'Regret score', help: 'Worked out: minus the largest gap between this option and the best option in any scenario. Always zero or below; closer to zero means less to regret.', type: 'computed', rule: { op: 'calc', expr: { sub: [0, { max: regrets }] }, format: 'dp1' } },
          ],
        },
      ],
    },
    {
      key: 'signposts',
      title: 'Signposts',
      summary: 'Name the early signs that tell you which scenario is arriving.',
      parts: [
        {
          kind: 'table', key: 'signposts', label: 'Early-warning indicators', rowLabel: 'Signpost', minRows: 3, maxRows: 10,
          help: 'One row per indicator you can observe before the outcome is known. A good signpost has a number and a threshold, not an opinion.',
          columns: [
            { key: 'indicator', header: 'Indicator', help: 'What you will watch, for example order book cover in months.', type: 'text' },
            { key: 'threshold', header: 'Threshold', help: 'The level at which you act, for example below 2 months.', type: 'text' },
            { key: 'signals', header: 'Signals which case', help: 'Which scenario this threshold points to.', type: 'select', options: ['Best case', 'Base case', 'Worst case'] },
            { key: 'response', header: 'Response if it trips', help: 'The decision you will take, so the response is agreed before the pressure arrives.', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'plan',
      title: 'Action plan',
      summary: 'Turn the choice into dated actions with an owner and a measure.',
      parts: [
        { kind: 'field', key: 'decision_made', label: 'What did you decide, and why?', type: 'longtext', help: 'Write the decision with the main reason and which rules supported it, so a person who was not in the room can follow it later.' },
        {
          kind: 'table', key: 'actions', label: 'Actions for the next 90 days', rowLabel: 'Action', minRows: 3, maxRows: 12,
          help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.',
          columns: [
            { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
            { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Finance Director, not a named person.', type: 'text' },
            { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
            { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
          ],
        },
      ],
    },
  ],
  derived: [
    { key: 'prob_total', label: 'Likelihoods add up to', help: 'The three likelihoods should total 100.', rule: { op: 'calc', expr: total, format: 'dp1', suffix: '%' } },
    { key: 'prob_check', label: 'Likelihood check', rule: { op: 'when', expr: { abs: { sub: [total, 100] } }, gt: 0.5, then: 'Likelihoods do not total 100%: results are rescaled, please correct them', else: 'Likelihoods total 100%', tones: { then: 'bad', else: 'good' } } },
    { key: 'ev_perfect', label: 'Expected value with perfect information', help: 'What you would expect if you always knew the scenario in advance and picked the best option each time.', rule: { op: 'calc', expr: evPerfect, format: 'dp1' } },
    { key: 'evpi', label: 'Value of perfect information', help: 'Expected value with perfect information minus the best expected value today. The most any forecast, study or pilot could be worth.', rule: { op: 'calc', expr: { sub: [evPerfect, { agg: 'max', table: 'options', col: 'emv' }] }, format: 'dp1' } },
  ],
  outputs: [
    { key: 'best_emv', label: 'Highest expected value', rule: { op: 'top', table: 'options', by: 'emv', label: 'option' } },
    { key: 'best_risk_adj', label: 'Best after allowing for risk', rule: { op: 'top', table: 'options', by: 'risk_adj', label: 'option' } },
    { key: 'best_maximin', label: 'Safest (best worst case)', rule: { op: 'top', table: 'options', by: 'maximin', label: 'option' } },
    { key: 'best_maximax', label: 'Boldest (best best case)', rule: { op: 'top', table: 'options', by: 'maximax', label: 'option' } },
    { key: 'best_hurwicz', label: 'Best on your optimism blend', rule: { op: 'top', table: 'options', by: 'hurwicz', label: 'option' } },
    { key: 'best_regret', label: 'Least regret', rule: { op: 'top', table: 'options', by: 'regret_score', label: 'option' } },
  ],
  analysisGuide: 'Read the six "best option" results together. If most of them name the same option, the choice is robust: say so and proceed. If the expected-value choice differs from the safest or the least-regret choice, the decision depends on how much risk the organisation can bear: state that trade-off plainly, using the spread and the worst-case payoff. Compare the value of perfect information with the cost of any further study: if the study costs more, decide now. Warn when one scenario carries most of the expected value, when the likelihoods do not total 100, when the worst case is much worse than the organisation could absorb, or when two options differ by less than the spread (they are effectively tied). Recommend the option, the signposts that would change the decision, and the first dated actions.',
  sample: {
    scenario: 'A packaging manufacturer must decide on capacity for the next three years: expand its own plant, outsource overflow, or hold. Payoffs are cumulative operating profit uplift over 3 years in ₹ lakh. This is a fictional example for learning.',
    values: {
      decision: 'Whether to expand the plant, outsource overflow volume, or hold capacity for 3 years; board decision in March.',
      metric: 'Cumulative operating profit uplift over 3 years, in ₹ lakh',
      constraint: 'Capital limit of ₹600 lakh; no new debt above 2x EBITDA',
      p_best: '25', p_base: '50', p_worst: '25', risk_weight: '0.5', optimism: '0.4',
      decision_made: 'Expand the plant: highest expected value and the least regret. The downside is larger than the other options, so release capital in two stages and trip a review if order cover falls below 2 months.',
    },
    tables: {
      options: [
        { option: 'Expand own plant', best: '900', base: '400', worst: '-300' },
        { option: 'Outsource overflow', best: '500', base: '300', worst: '50' },
        { option: 'Hold capacity', best: '150', base: '100', worst: '60' },
      ],
      signposts: [
        { indicator: 'Order book cover (months)', threshold: 'Below 2 months', signals: 'Worst case', response: 'Pause the second capital stage' },
        { indicator: 'Largest customer volume commitment', threshold: 'Signed above 40% of new capacity', signals: 'Best case', response: 'Release the second capital stage' },
        { indicator: 'Resin price index', threshold: 'Up more than 15% in a quarter', signals: 'Worst case', response: 'Renegotiate pricing clauses before expanding further' },
      ],
      actions: [
        { action: 'Approve stage one of the expansion (50% of capital)', owner: 'Board', measure: 'Resolution recorded', horizon: '30 days' },
        { action: 'Agree outsourcing back-up terms for peak weeks', owner: 'Operations Head', measure: 'Signed framework agreement', horizon: '60 days' },
        { action: 'Start the monthly signpost review', owner: 'Finance Director', measure: 'Review held every month', horizon: '30 days' },
      ],
    },
  },
};
