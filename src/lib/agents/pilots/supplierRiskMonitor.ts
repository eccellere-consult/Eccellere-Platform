import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, cr, ct, sec, tbl, text, long } from './kit';

/**
 * Supplier Risk Monitor: ranks suppliers by how risky they are and how much you depend on them.
 * Method (fixed formula): risk score = average of four risk ratings (1 low risk to 5 high risk): delivery, quality, financial, dependence.
 *   exposure = risk score x share of spend, where share of spend = supplier spend / total spend x 100.
 * Higher exposure means act sooner. Ratings are your judgement; the sheet only combines them.
 */
const score: Expr = { div: [{ add: [c('r_delivery'), c('r_quality'), c('r_financial'), c('r_dependence')] }, 4] };
const share: Expr = { mul: [{ div: [c('spend'), { agg: 'sum', table: 'suppliers', col: 'spend' }] }, 100] };

export const SUPPLIER_RISK_MONITOR = agent({
  slug: 'supplier-risk-monitor', name: 'Supplier Risk Monitor', category: 'prioritisation',
  does: 'Combines your ratings of each supplier\'s delivery, quality, financial and dependence risk with how much you spend, and ranks the suppliers that most need a back-up plan.',
  whenToUse: 'Use it each quarter on your top suppliers, or after a disruption, to decide where to build a second source, ask for guarantees or visit.',
  whenNotToUse: 'Do not use it as a credit rating or to forecast a supplier\'s failure. The ratings are your own judgement, and the sheet does not check any outside data.',
  next: 'For the top-exposure suppliers, agree a back-up source or a safety stock, and rerun the sheet after each review.',
  summary: 'A risky supplier you barely use is a small problem; a moderately risky supplier that takes a third of your spend is a large one. Multiplying risk by spend share puts both in view.',
  caption: 'Four steps from a supplier list to a short list needing a plan.',
  howToRead: ['Risk score is the plain average of your four ratings; 5 is high risk.', 'Exposure multiplies risk score by the supplier\'s share of spend.', 'Start with the highest exposure, not the highest score alone.'],
  diagramTitle: 'From a supplier list to a short list needing a plan', diagramCaption: 'The ratings are opinions with reasons; the sheet shows how they combine with spend.',
  steps: [['List suppliers', 'Spend in the period'], ['Rate four risks', '1 low to 5 high'], ['Work out exposure', 'Risk x spend share'], ['Plan for the top', 'Back-up, safety stock, visit']],
  sections: [
    sec('scope', 'Scope', 'Say which suppliers and period this covers.', [
      text('period', 'Period', 'The period the spend figures cover, so shares compare like with like.', 'Last 12 months'),
      text('owner_role', 'Who owns this review (role)', 'The role accountable for keeping the ratings up to date and acting on the results.', 'Procurement Manager'),
      long('basis', 'How you rated', 'Note what evidence you used for the ratings, such as delivery records or visits, so another person could rate the same way.', 'Delivery and quality from our own records; financial and dependence from the buyer\'s judgement.'),
    ]),
    sec('suppliers', 'Suppliers', 'List each supplier with spend and four ratings.', [
      tbl('suppliers', 'Suppliers', 'Supplier', 'One row per supplier. Enter the spend in rupees and rate each risk from 1 (low risk) to 5 (high risk).', [
        ct('supplier', 'Supplier', 'The supplier\'s name.'),
        cn('spend', 'Spend', 'What you spent with this supplier in the period, in rupees.', 'rupees'),
        cr('r_delivery', 'Delivery risk', 'How likely late or missed deliveries are: 1 is very reliable, 5 is often late.', 'Reliable', 'Often late'),
        cr('r_quality', 'Quality risk', 'How likely defects or rejections are: 1 is consistently good, 5 is often poor.', 'Consistent', 'Often poor'),
        cr('r_financial', 'Financial risk', 'How likely the supplier is to have money problems: 1 is strong, 5 is weak.', 'Strong', 'Weak'),
        cr('r_dependence', 'Dependence risk', 'How hard it would be to replace them: 1 is easy, 5 is almost impossible.', 'Easy to replace', 'Hard to replace'),
        cc('score', 'Risk score', 'Worked out: the average of the four ratings.', { op: 'calc', expr: score, format: 'dp2' }),
        cc('share', 'Share of spend', 'Worked out: this supplier\'s spend as a percentage of all spend listed.', { op: 'calc', expr: share, format: 'pct' }),
        cc('exposure', 'Exposure', 'Worked out: risk score times share of spend. Higher needs action sooner.', { op: 'calc', expr: { mul: [score, share] }, format: 'dp1' }),
      ], 3, 40),
    ]),
  ],
  plan: 'supplier risks',
  derived: [
    { key: 'total_spend', label: 'Total spend listed (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'suppliers', col: 'spend' }, format: 'int' } },
    { key: 'count', label: 'Suppliers rated', rule: { op: 'calc', expr: { agg: 'count', table: 'suppliers', col: 'supplier' }, format: 'int' } },
  ],
  outputs: [
    { key: 'top_exposure', label: 'Highest exposure', rule: { op: 'top', table: 'suppliers', by: 'exposure', label: 'supplier' } },
    { key: 'top_score', label: 'Highest risk score', rule: { op: 'top', table: 'suppliers', by: 'score', label: 'supplier' } },
  ],
  analysisGuide: 'Name the supplier with the highest exposure and the one with the highest risk score, and say whether they are the same. If they differ, explain that one is the larger business risk and the other the riskier but smaller one. For the top two or three, say which of the four risks drives the score and what would reduce it: a second source for dependence, safety stock for delivery, incoming inspection for quality, or advance limits for financial. Remind the reader that the ratings are judgements and should be checked with evidence. End with owners by role, dates, and when the ratings will be reviewed again.',
  scenario: 'A manufacturer rates three suppliers. Names, spend and ratings are fictional and for learning only.',
  values: { period: 'Last 12 months', owner_role: 'Procurement Manager', basis: 'Delivery and quality from our own records; financial and dependence from the buyer\'s judgement.' },
  tables: { suppliers: [{ supplier: 'Shree Packaging Works', spend: '600000', r_delivery: '2', r_quality: '2', r_financial: '3', r_dependence: '4' }, { supplier: 'Apex Steel Traders', spend: '300000', r_delivery: '4', r_quality: '3', r_financial: '4', r_dependence: '5' }, { supplier: 'City Stationers', spend: '100000', r_delivery: '1', r_quality: '1', r_financial: '1', r_dependence: '1' }] },
  actions: [['Qualify a second steel supplier', 'Procurement Manager', 'Second supplier approved'], ['Hold two weeks of safety stock of steel', 'Stores Manager', 'Safety stock in place'], ['Review all ratings with evidence', 'Procurement Manager', 'Ratings reviewed and signed off']],
});
