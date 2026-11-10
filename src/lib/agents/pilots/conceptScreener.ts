import type { DeclarativeTool, DeclColumn, DeclField, Expr } from '@/lib/strategyModels/declarative';
import { actionPlan, c, f, long, num, text } from './kit';

/**
 * Concept Screener: choosing which new product or service ideas deserve more work.
 * Method (a fixed formula, nothing estimated by AI): weighted scoring. Each concept is scored 1 to 5 on five criteria the team names and weights 1 to 10.
 *   weighted score = sum(weight x score) / sum(weights), a number from 1 to 5.
 * A second, equal-weights score is shown beside it. If the two disagree about the winner, the ranking depends on the weights and the team should argue about the weights, not the maths.
 */
const N = [1, 2, 3, 4, 5];
const weighted: Expr = { div: [{ add: N.map((i) => ({ mul: [f(`w${i}`), c(`s${i}`)] })) }, { add: N.map((i) => f(`w${i}`)) }] };
const equal: Expr = { div: [{ add: N.map((i) => c(`s${i}`)) }, 5] };

const criterionFields = (): DeclField[] => N.flatMap((i): DeclField[] => [
  text(`crit${i}`, `Criterion ${i}`, `Name criterion ${i} in a few words, something you can score a concept on, such as fit with strategy or ease of launch.`, ['Fit with strategy', 'Size of the market', 'Margin potential', 'Ease of building', 'Speed to launch'][i - 1]),
  num(`w${i}`, `Weight of criterion ${i}`, 'weight 1 to 10', `How much criterion ${i} matters compared with the others: 10 is vital, 1 is minor. Decide the weights before scoring any concept.`, String([5, 4, 3, 2, 1][i - 1])),
]);

const scoreColumns = (): DeclColumn[] => N.map((i): DeclColumn => ({
  key: `s${i}`, header: `Score: criterion ${i}`, type: 'rating', scale: { min: 1, max: 5, low: 'Weak', high: 'Strong' },
  help: `How strong this concept is on criterion ${i} as you named it above: 1 is weak, 5 is strong. Score from evidence, not hope.`,
}));

export const CONCEPT_SCREENER: DeclarativeTool = {
  schema: 1,
  slug: 'concept-screener',
  name: 'Concept Screener',
  category: 'prioritisation',
  does: 'Scores and ranks new product and service ideas against criteria you choose and weight, shows the result with your weights and with equal weights, and tells you which concepts clear your cut-off.',
  whenToUse: 'Use it when you have three or more ideas competing for the same limited time and money, and you need a fair, explainable way to decide which ones get a proper business case.',
  whenNotToUse: 'Do not use it to approve an investment on its own: a good score only earns a concept a closer look. Do not use it for one idea, or when a legal or safety need decides the matter.',
  next: 'Take the concepts that clear the cut-off into the Product Spec Generator, and test the winner against other uses of the same money in the Capital Allocation Advisor.',
  reference: {
    originator: '',
    year: '',
    summary: 'Weighted scoring turns a vague debate about ideas into a table: the same criteria for every concept, weights agreed up front, and a score anyone can recompute. It ranks ideas; it does not replace judgement about them.',
    caption: 'Five steps from a list of ideas to a short list that has earned a business case.',
    howToRead: [
      'Read the weighted score first: it uses your own weights, so it reflects what matters to you.',
      'Compare it with the equal-weights score: if the winner changes, the weights are doing the work and deserve a second look.',
      'A concept above the cut-off is worth a closer look, not an approval.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From a list of ideas to a short list',
    steps: [
      { name: 'Define the decision', hint: 'What is being chosen, by when' },
      { name: 'Set the criteria', hint: 'Five, named and weighted' },
      { name: 'Score each concept', hint: '1 to 5 on every criterion' },
      { name: 'Read both scores', hint: 'Your weights and equal weights' },
      { name: 'Act on the short list', hint: 'Owners, measures, dates' },
    ],
    caption: 'Weights are agreed before any concept is scored, so the scores cannot be bent to fit a favourite.',
  },
  sections: [
    {
      key: 'decision', title: 'The decision', summary: 'Say what is being chosen and what limits it.',
      parts: [
        long('purpose', 'What are you choosing between?', 'Describe in a sentence or two what these concepts are for and what a good choice achieves for the business.', 'Which of three new product ideas to take to a business case this quarter.'),
        text('horizon', 'By when must you decide?', 'Give the date by which the short list is needed, so the screening does not drift beyond the time it is worth.', 'Short list by 31 March'),
        text('constraint', 'What limits the choice?', 'Name the budget, team time or rules that mean only a few concepts can go forward, so the cut-off below is realistic.', 'Only one concept can be built this year'),
      ],
    },
    {
      key: 'criteria', title: 'Criteria and weights', summary: 'Name five criteria, weight them, and set the cut-off.',
      parts: [
        ...criterionFields(),
        num('advance_at', 'Cut-off score to advance', 'score 1 to 5', 'A concept advances when its weighted score is above this number. Set it before scoring, from how many concepts you can afford to pursue.', '3.45'),
      ],
    },
    {
      key: 'concepts', title: 'Concepts and scores', summary: 'List each concept and score it on every criterion. The table works out the rest.',
      parts: [{
        kind: 'table', key: 'concepts', label: 'Concepts', rowLabel: 'Concept', minRows: 3, maxRows: 12,
        help: 'One row per concept. Score all five criteria from 1 to 5; a concept with a blank score is not ranked until it is complete.',
        columns: [
          { key: 'concept', header: 'Concept', help: 'A short name everyone recognises.', type: 'text' },
          ...scoreColumns(),
          { key: 'score', header: 'Weighted score', type: 'computed', help: 'Worked out: each score times its weight, added up and divided by the total weight.', rule: { op: 'calc', expr: weighted, format: 'dp2' } },
          { key: 'equal', header: 'Equal-weights score', type: 'computed', help: 'Worked out: the plain average of the five scores, to test how much the weights matter.', rule: { op: 'calc', expr: equal, format: 'dp2' } },
          { key: 'verdict', header: 'Against cut-off', type: 'computed', help: 'Worked out: Advance when the weighted score is above your cut-off, otherwise Hold or drop.', rule: { op: 'when', expr: { sub: [weighted, f('advance_at')] }, gt: 0, then: 'Advance', else: 'Hold or drop', tones: { then: 'good', else: 'warn' } } },
        ],
      }],
    },
    actionPlan('short list'),
  ],
  derived: [
    { key: 'weight_total', label: 'Total of the weights', help: 'The weights are relative, so the total is shown only to help you check them.', rule: { op: 'calc', expr: { add: N.map((i) => f(`w${i}`)) }, format: 'int' } },
    { key: 'concept_count', label: 'Concepts screened', rule: { op: 'calc', expr: { agg: 'count', table: 'concepts', col: 'concept' }, format: 'int' } },
  ],
  outputs: [
    { key: 'top_weighted', label: 'Highest on your weights', rule: { op: 'top', table: 'concepts', by: 'score', label: 'concept' } },
    { key: 'top_equal', label: 'Highest on equal weights', rule: { op: 'top', table: 'concepts', by: 'equal', label: 'concept' } },
  ],
  analysisGuide: 'Compare the concept that is highest on your weights with the one highest on equal weights. If they are the same, the ranking is robust: say so and move that concept forward. If they differ, the choice depends on the weights, so show the team both and ask which weights they truly believe in before deciding. Treat every score as an opinion with a source: ask what evidence sits behind a 5, and flag any concept whose strong scores rest on assumptions. A concept above the cut-off has earned a business case, not an approval. Recommend the next step for each concept that clears the cut-off, and name the evidence still missing for the closest ones below it.',
  sample: {
    scenario: 'A household-products company screens three ideas for next year. Weights and scores are fictional and for learning only.',
    values: {
      purpose: 'Which of three new product ideas to take to a business case this quarter.',
      horizon: 'Short list by 31 March',
      constraint: 'Only one concept can be built this year',
      crit1: 'Fit with strategy', w1: '5', crit2: 'Size of the market', w2: '4', crit3: 'Margin potential', w3: '3', crit4: 'Ease of building', w4: '2', crit5: 'Speed to launch', w5: '1',
      advance_at: '3.45',
    },
    tables: {
      concepts: [
        { concept: 'Subscription refill service', s1: '4', s2: '3', s3: '5', s4: '2', s5: '1' },
        { concept: 'Pocket-size starter kit', s1: '3', s2: '4', s3: '2', s4: '5', s5: '4' },
        { concept: 'Corporate gifting pack', s1: '5', s2: '2', s3: '3', s4: '3', s5: '2' },
      ],
      actions: [
        { action: 'Build a one-page business case for the refill service', owner: 'Product Manager', measure: 'Case reviewed by the leadership team', horizon: '30 days' },
        { action: 'Test demand for the starter kit with ten existing customers', owner: 'Sales Head', measure: 'Number of customers who would buy', horizon: '60 days' },
        { action: 'Revisit the weights with the leadership team', owner: 'Chief Executive', measure: 'Weights agreed and recorded', horizon: '30 days' },
      ],
    },
  },
};
