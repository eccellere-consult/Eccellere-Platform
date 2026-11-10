import type { DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';
import { actionPlan, c, long, pick, text } from './kit';

/**
 * Product Spec Generator: a structured one-page product specification with requirements ranked by value for effort.
 * Method (a fixed formula, nothing estimated by AI): value per day = importance (1 to 5) / effort in days.
 * The tool also counts how many of six spec-quality questions are answered Yes.
 */
const valuePerDay: Expr = { div: [c('importance'), c('effort')] };
const YES = ['Yes', 'No'];
const CHECKS = ['q_user', 'q_problem', 'q_success', 'q_scope', 'q_owner', 'q_risk'];

export const PRODUCT_SPEC: DeclarativeTool = {
  schema: 1,
  slug: 'product-spec-generator',
  name: 'Product Spec Generator',
  category: 'planning',
  does: 'Captures a product idea as a one-page specification: who it is for, the problem, the requirements ranked by importance for effort, and a six-question check that the spec is complete.',
  whenToUse: 'Use it when a concept has cleared screening and a team needs a clear, shared description of what to build first, before design or development begins.',
  whenNotToUse: 'Do not use it as a substitute for talking to customers, or to estimate cost and price. The effort numbers here are your team\'s own estimates and are only as good as they are.',
  next: 'Share the spec with the builders, agree the first release on the highest value-per-day items, and test the result with real customers.',
  reference: {
    originator: '',
    year: '',
    summary: 'A good specification states the user, the problem and what success looks like before listing features. Ranking requirements by importance for effort keeps the first release small and useful.',
    caption: 'Five steps from a concept to a first release everyone agrees on.',
    howToRead: [
      'Value per day is importance divided by effort in days: higher means more benefit for each day of work.',
      'Build the highest value-per-day items first, unless one is a must-have for launch.',
      'Read the completeness count: each No is a gap that will cause questions later.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From a concept to an agreed first release',
    steps: [
      { name: 'Define the problem', hint: 'For whom, and why it matters' },
      { name: 'List requirements', hint: 'What it must do' },
      { name: 'Rate and estimate', hint: 'Importance and days' },
      { name: 'Rank', hint: 'Value per day of effort' },
      { name: 'Agree release 1', hint: 'Owner and date' },
    ],
    caption: 'Effort estimates come from the team that will build it, not from the person who wants it.',
  },
  sections: [
    {
      key: 'concept', title: 'The concept', summary: 'Say what the product is, who it is for and what problem it solves.',
      parts: [
        text('product', 'Product or feature name', 'A short working name that everyone will use in conversations.', 'Customer order tracker'),
        long('user', 'Who is it for?', 'Describe the main user in one or two sentences, including what they do and where they struggle today.', 'Small distributors who currently answer "where is my order" calls all day.'),
        long('problem', 'What problem does it solve?', 'State the problem in the user\'s words, and what it costs them or you today.', 'Customers call to ask about orders; each call takes ten minutes and delays real work.'),
        long('success', 'What does success look like?', 'Say what will be true when it works, with a number if you can, such as fewer calls or faster reorders.', 'Status calls fall by half within three months of launch.'),
      ],
    },
    {
      key: 'requirements', title: 'Requirements', summary: 'List what it must do. The table ranks them by value for effort.',
      parts: [{
        kind: 'table', key: 'requirements', label: 'Requirements', rowLabel: 'Requirement', minRows: 3, maxRows: 20,
        help: 'One row per thing the product must do. Rate how important it is to the user, and give the builders\' estimate of effort in working days.',
        columns: [
          { key: 'requirement', header: 'Requirement', help: 'What the product must do, written as the user would say it.', type: 'text' },
          { key: 'importance', header: 'Importance', help: 'How much the user needs it: 1 is nice to have, 5 is essential.', type: 'rating', scale: { min: 1, max: 5, low: 'Nice to have', high: 'Essential' } },
          { key: 'effort', header: 'Effort (days)', help: 'Working days the builders estimate it will take.', type: 'number', unit: 'days' },
          { key: 'value', header: 'Value per day', type: 'computed', help: 'Worked out: importance divided by effort in days. Higher means more benefit per day of work.', rule: { op: 'calc', expr: valuePerDay, format: 'dp2' } },
        ],
      }],
    },
    {
      key: 'checks', title: 'Is the spec complete?', summary: 'Answer six Yes or No questions about the spec.',
      parts: [
        pick('q_user', 'Is the main user named and described?', YES, 'Yes only when a reader could say who the product is for without asking you.', 'Yes'),
        pick('q_problem', 'Is the problem stated in the user\'s words?', YES, 'Yes only when the problem is a real complaint or need, not a feature wish.', 'Yes'),
        pick('q_success', 'Is there a measurable definition of success?', YES, 'Yes only when success has a number and a date.', 'Yes'),
        pick('q_scope', 'Is it clear what is NOT in the first release?', YES, 'Yes only when the out-of-scope items are written down.', 'No'),
        pick('q_owner', 'Is there one named owner for the spec (a role)?', YES, 'Yes only when one role is accountable for decisions about it.', 'Yes'),
        pick('q_risk', 'Are the biggest risks and unknowns listed?', YES, 'Yes only when the main assumptions that could be wrong are written down.', 'No'),
      ],
    },
    actionPlan('first release'),
  ],
  derived: [
    { key: 'effort_total', label: 'Total effort', help: 'The sum of all estimated days.', rule: { op: 'calc', expr: { agg: 'sum', table: 'requirements', col: 'effort' }, format: 'int' } },
    { key: 'req_count', label: 'Requirements listed', rule: { op: 'calc', expr: { agg: 'count', table: 'requirements', col: 'requirement' }, format: 'int' } },
    { key: 'complete', label: 'Spec questions answered Yes', rule: { op: 'answers', fields: CHECKS, show: 'yes' } },
  ],
  outputs: [
    { key: 'build_first', label: 'Build first (best value per day)', rule: { op: 'top', table: 'requirements', by: 'value', label: 'requirement' } },
    { key: 'importance_first', label: 'Most important requirement', rule: { op: 'top', table: 'requirements', by: 'importance', label: 'requirement' } },
  ],
  analysisGuide: 'Start with the problem and the user, then name the requirement with the best value per day and the one the user needs most, and say whether they are the same. Propose a first release that fits a stated time limit, taking requirements in order of value per day but including any that are essential for launch. Flag requirements with no effort estimate and any that rest on an unverified assumption. Read the completeness questions: for every No, say who closes the gap and when. Be clear that effort is the team\'s own estimate. End with how the first release will be tested with real users and what result would change the plan.',
  sample: {
    scenario: 'A small software company specifies an order-tracking feature for distributors. The product and figures are fictional and for learning only.',
    values: {
      product: 'Customer order tracker',
      user: 'Small distributors who currently answer "where is my order" calls all day.',
      problem: 'Customers call to ask about orders; each call takes ten minutes and delays real work.',
      success: 'Status calls fall by half within three months of launch.',
      q_user: 'Yes', q_problem: 'Yes', q_success: 'Yes', q_scope: 'No', q_owner: 'Yes', q_risk: 'No',
    },
    tables: {
      requirements: [
        { requirement: 'Customer sees order status on a web page', importance: '5', effort: '8' },
        { requirement: 'Message sent when an order is dispatched', importance: '4', effort: '3' },
        { requirement: 'Delivery map with live position', importance: '3', effort: '15' },
      ],
      actions: [
        { action: 'Write the out-of-scope list and the top risks', owner: 'Product Manager', measure: 'Both lists reviewed by the team', horizon: '30 days' },
        { action: 'Build the dispatch message and status page', owner: 'Engineering Lead', measure: 'Working version tested with five customers', horizon: '60 days' },
        { action: 'Measure status calls before and after launch', owner: 'Customer Support Lead', measure: 'Weekly count of status calls', horizon: '90 days' },
      ],
    },
  },
};
