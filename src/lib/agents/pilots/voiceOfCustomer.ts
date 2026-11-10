import type { DeclarativeTool, Expr } from '@/lib/strategyModels/declarative';
import { actionPlan, c, f, long, num, text } from './kit';

/**
 * Voice of Customer: turns a pile of feedback into ranked themes.
 * Method (a fixed formula, nothing estimated by AI): the team groups feedback into themes and counts mentions and rates severity 1 to 5.
 *   priority = mentions x severity;  share of feedback = mentions / total mentions x 100.
 */
const priority: Expr = { mul: [c('mentions'), c('severity')] };
const total: Expr = { agg: 'sum', table: 'themes', col: 'mentions' };

export const VOICE_OF_CUSTOMER: DeclarativeTool = {
  schema: 1,
  slug: 'voice-of-customer-synthesizer',
  name: 'Voice of Customer',
  category: 'prioritisation',
  does: 'Groups customer feedback into themes, ranks them by how often they are raised and how much they hurt, and shows each theme\'s share of all feedback with a supporting quote.',
  whenToUse: 'Use it after a batch of reviews, survey comments, complaints or sales-call notes, when you need to decide which customer problems to fix first.',
  whenNotToUse: 'Do not use it to measure satisfaction or to forecast churn; it ranks what people said, not how many customers feel it. Do not use it with fewer than about twenty pieces of feedback.',
  next: 'Take the top themes into the Concept Screener if they suggest new offers, or into your action plan if they are fixes to existing service.',
  reference: {
    originator: '',
    year: '',
    summary: 'Customers rarely rank their own problems. Counting how often a theme is raised and rating how serious it is gives a transparent priority that a team can challenge, which beats picking whichever complaint was heard last or loudest.',
    caption: 'Five steps from raw comments to a ranked list of customer problems.',
    howToRead: [
      'Priority is mentions times severity, so a frequent minor issue can rank below a rarer serious one.',
      'Share shows how much of all feedback each theme represents.',
      'Check the quote: if it does not feel like the theme, the theme is wrongly drawn.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From raw comments to ranked customer problems',
    steps: [
      { name: 'Gather feedback', hint: 'Reviews, surveys, calls' },
      { name: 'Group into themes', hint: 'One problem per theme' },
      { name: 'Count and rate', hint: 'Mentions and severity' },
      { name: 'Rank', hint: 'Priority and share' },
      { name: 'Act', hint: 'Owner, measure, date' },
    ],
    caption: 'The themes are drawn by people who read the comments; the tool only counts and ranks them.',
  },
  sections: [
    {
      key: 'source', title: 'The feedback', summary: 'Say where the feedback came from and how much there is.',
      parts: [
        long('sources', 'Where did the feedback come from?', 'List the channels and the period, so a reader knows how far the findings can be trusted.', 'Online reviews and support emails from the last quarter.'),
        num('pieces', 'Pieces of feedback read', 'comments', 'The total number of separate comments you read, including those that fit no theme.', '60'),
        text('customers', 'Which customers do these represent?', 'Describe who gave the feedback, for example segment or region, so you do not generalise beyond it.', 'Mostly small business customers in the west region'),
      ],
    },
    {
      key: 'themes', title: 'Themes', summary: 'List each theme with how often it came up and how serious it is.',
      parts: [{
        kind: 'table', key: 'themes', label: 'Themes from the feedback', rowLabel: 'Theme', minRows: 3, maxRows: 15,
        help: 'One row per theme. Count only comments clearly about that theme and rate its severity from the customer\'s point of view: 5 means they stop buying or are badly hurt.',
        columns: [
          { key: 'theme', header: 'Theme', help: 'A short name for the problem, such as Late delivery.', type: 'text' },
          { key: 'mentions', header: 'Mentions', help: 'How many comments raised this theme.', type: 'number', unit: 'comments' },
          { key: 'severity', header: 'Severity', help: 'How much it hurts the customer: 1 is a nuisance, 5 is serious.', type: 'rating', scale: { min: 1, max: 5, low: 'Nuisance', high: 'Serious' } },
          { key: 'quote', header: 'A typical quote', help: 'One real sentence from a customer that captures the theme.', type: 'longtext' },
          { key: 'priority', header: 'Priority', type: 'computed', help: 'Worked out: mentions times severity. Higher is more urgent.', rule: { op: 'calc', expr: priority, format: 'int' } },
          { key: 'share', header: 'Share of feedback', type: 'computed', help: 'Worked out: mentions as a percentage of all mentions in the table.', rule: { op: 'calc', expr: { mul: [{ div: [c('mentions'), total] }, 100] }, format: 'pct' } },
        ],
      }],
    },
    actionPlan('top themes'),
  ],
  derived: [
    { key: 'total_mentions', label: 'Mentions in themes', rule: { op: 'calc', expr: total, format: 'int' } },
    { key: 'unthemed', label: 'Pieces of feedback not in any theme', help: 'Pieces read minus mentions in themes. A large number means the themes miss much of the feedback. Comments can fit more than one theme, so a negative number means overlap.', rule: { op: 'calc', expr: { sub: [f('pieces'), total] }, format: 'int' } },
    { key: 'theme_count', label: 'Themes found', rule: { op: 'calc', expr: { agg: 'count', table: 'themes', col: 'theme' }, format: 'int' } },
  ],
  outputs: [
    { key: 'top_theme', label: 'Highest priority theme', rule: { op: 'top', table: 'themes', by: 'priority', label: 'theme' } },
    { key: 'most_raised', label: 'Most raised theme', rule: { op: 'top', table: 'themes', by: 'mentions', label: 'theme' } },
  ],
  analysisGuide: 'Lead with the highest-priority theme and its share of the feedback, and say whether it is also the most-raised theme. If they differ, explain that one is frequent and the other severe, and recommend which to tackle first and why. Read the quote for each top theme and check it matches. Look at the unthemed count: if many comments sit outside the themes, say what they appear to be about. State who the feedback represents and who it leaves out, so the findings are not stretched. For each of the top three themes, propose one fix with an owner by role, a measure that will show it worked and a date, and say how you will hear from customers again to check.',
  sample: {
    scenario: 'A small software-services company reads sixty customer comments from one quarter. Themes and counts are fictional and for learning only.',
    values: {
      sources: 'Online reviews and support emails from the last quarter.',
      pieces: '60',
      customers: 'Mostly small business customers in the west region',
    },
    tables: {
      themes: [
        { theme: 'Slow support replies', mentions: '18', severity: '4', quote: 'I waited three days for an answer about my invoice.' },
        { theme: 'Confusing pricing', mentions: '7', severity: '2', quote: 'I could not tell which plan included reports.' },
        { theme: 'Missing integrations', mentions: '12', severity: '3', quote: 'We had to re-enter orders because it does not connect to our accounts software.' },
      ],
      actions: [
        { action: 'Set a one-working-day first-reply target for support emails', owner: 'Support Lead', measure: 'Share of emails answered within one day', horizon: '30 days' },
        { action: 'Scope the accounts-software connection with five customers', owner: 'Product Manager', measure: 'Scope agreed with customers', horizon: '60 days' },
        { action: 'Rewrite the pricing page with a plan comparison table', owner: 'Marketing Manager', measure: 'Fewer pricing questions to support', horizon: '60 days' },
      ],
    },
  },
};
