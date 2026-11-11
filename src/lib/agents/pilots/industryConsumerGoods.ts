import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Trade promotion ROI (fixed formula):
 *   incremental margin = promo units x (margin per unit - discount per unit) - baseline units x margin per unit
 *   profit = incremental margin - fixed spend; investment = promo units x discount per unit + fixed spend; ROI = profit / investment.
 */
const incMargin: Expr = { sub: [{ mul: [c('promo'), { sub: [c('margin'), c('discount')] }] }, { mul: [c('baseline'), c('margin')] }] };
const profit: Expr = { sub: [incMargin, c('fixed')] };
const invest: Expr = { add: [{ mul: [c('promo'), c('discount')] }, c('fixed')] };

export const TRADE_PROMO_ROI = agent({
  slug: 'trade-promotion-roi', name: 'Trade Promotion ROI', category: 'analytical',
  does: 'Measures whether each trade promotion earned or lost money, by comparing the extra margin it created with the discount and fixed spend it cost.',
  whenToUse: 'Use it after each promotion ends, using sales you would have made anyway as the baseline, to decide which promotions to repeat, change or stop.',
  whenNotToUse: 'Do not use it when the baseline is a guess you cannot defend, or to judge brand-building effects that do not show in sales during the promotion.',
  next: 'Repeat the promotions that earned, redesign those that lost, and record the baseline method so results stay comparable.',
  summary: 'A promotion that lifts volume can still lose money, because the discount applies to every unit including those that would have sold anyway.',
  caption: 'Four steps from a promotion to a repeat-or-stop call.',
  howToRead: ['Incremental margin is margin on promo units after discount, less margin you would have made anyway.', 'Profit also subtracts fixed spend such as display fees.', 'ROI is profit divided by what you invested.'],
  diagramTitle: 'From a promotion to a repeat-or-stop call', diagramCaption: 'The baseline matters most, so say how you set it.',
  steps: [['Set the baseline', 'Units without the promotion'], ['Enter promo results', 'Units, discount, spend'], ['Work out profit', 'Incremental margin less spend'], ['Decide', 'Repeat, change or stop']],
  sections: [
    sec('scope', 'The basis', 'Say how the baseline was set.', [
      text('brand', 'Brand or category', 'The brand or category these promotions belong to.', 'Biscuits, family packs'),
      long('baseline_basis', 'How the baseline was set', 'Explain how you estimated sales without the promotion, such as the average of the four weeks before. Others must be able to repeat it.', 'Average weekly units of the four weeks before the promotion.'),
      text('owner', 'Owner (role)', 'The role who decides whether to repeat promotions.', 'Trade Marketing Manager'),
    ]),
    sec('promos', 'Promotions', 'Enter each promotion. The table works out incremental margin and ROI.', [
      tbl('promos', 'Promotions', 'Promotion', 'One row per promotion over the same length of time. Margin and discount are per unit, in rupees.', [
        ct('promo_name', 'Promotion', 'A short name for the promotion.'),
        cn('baseline', 'Baseline units', 'Units you would have sold without the promotion.', 'units'),
        cn('promo', 'Promo units', 'Units actually sold during the promotion.', 'units'),
        cn('margin', 'Margin per unit', 'Margin per unit before any promotion discount, in rupees.', 'rupees'),
        cn('discount', 'Discount per unit', 'The promotion discount per unit, in rupees.', 'rupees'),
        cn('fixed', 'Fixed spend', 'Display fees, schemes or other costs not tied to units, in rupees.', 'rupees'),
        cc('inc_margin', 'Incremental margin', 'Worked out: margin on promo units after discount, less baseline margin.', { op: 'calc', expr: incMargin, format: 'int' }),
        cc('profit', 'Profit after spend', 'Worked out: incremental margin less fixed spend.', { op: 'calc', expr: profit, format: 'int' }),
        cc('roi', 'ROI', 'Worked out: profit divided by (discount cost plus fixed spend).', { op: 'calc', expr: { mul: [{ div: [profit, invest] }, 100] }, format: 'pct' }),
        cc('call', 'Call', 'Worked out: Earned or Lost money, by the sign of profit.', { op: 'when', expr: profit, lt: 0, then: 'Lost money', else: 'Earned', tones: { then: 'bad', else: 'good' } }),
      ], 3, 40),
    ]),
  ],
  plan: 'promotion decisions',
  derived: [
    { key: 'profit_total', label: 'Total profit after spend (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'promos', col: 'profit' }, format: 'int' } },
    { key: 'promo_count', label: 'Promotions reviewed', rule: { op: 'calc', expr: { agg: 'count', table: 'promos', col: 'promo_name' }, format: 'int' } },
  ],
  outputs: [{ key: 'best', label: 'Most profitable promotion', rule: { op: 'top', table: 'promos', by: 'profit', label: 'promo_name' } }],
  analysisGuide: 'State total profit after spend and which promotions earned or lost money, with ROI. Explain that a loss often comes from discounting units that would have sold anyway, so a deep discount with a small lift rarely pays. Say how the baseline was set and how much the result depends on it; a different baseline can change the call. Do not claim long-term brand effects from this sheet. Recommend repeat, redesign or stop per promotion, with an owner by role, a measure and a date, and say when results will be compared.',
  scenario: 'A food company reviews three promotions. Units and rupee figures are fictional and for learning only.',
  values: { brand: 'Biscuits, family packs', baseline_basis: 'Average weekly units of the four weeks before the promotion.', owner: 'Trade Marketing Manager' },
  tables: { promos: [{ promo_name: 'Buy more, save 5', baseline: '1000', promo: '2000', margin: '20', discount: '5', fixed: '5000' }, { promo_name: 'Shelf banner, 6 off', baseline: '1000', promo: '1300', margin: '20', discount: '6', fixed: '4000' }, { promo_name: 'Festival pack', baseline: '500', promo: '1200', margin: '30', discount: '8', fixed: '10000' }] },
  actions: [['Repeat the 5-off scheme in two more regions', 'Trade Marketing Manager', 'Profit positive again'], ['Redesign or drop the banner scheme', 'Brand Manager', 'Replacement scheme agreed'], ['Record the baseline method for all schemes', 'Sales Analyst', 'Method documented']],
});

/**
 * SKU rationalisation: contribution share = SKU margin / total margin x 100; margin percent = margin / revenue.
 */
const share: Expr = { mul: [{ div: [c('margin'), { agg: 'sum', table: 'skus', col: 'margin' }] }, 100] };

export const SKU_RATIONALISATION = agent({
  slug: 'sku-rationalisation', name: 'SKU Rationalisation', category: 'prioritisation',
  does: 'Ranks products by their share of total margin and their own margin percent, and flags those below your contribution cut-off as candidates for review or delisting.',
  whenToUse: 'Use it yearly, or when range complexity, stock and supplier cost are rising faster than sales.',
  whenNotToUse: 'Do not delist on this sheet alone. A low seller can protect a customer relationship, complete a range or be a new launch.',
  next: 'Review each flagged item with sales and supply, decide delist, fix or keep with a reason, and rerun after the change.',
  summary: 'A long tail of small products adds cost and complexity for little margin. Showing each product\'s contribution makes the review fact-based.',
  caption: 'Four steps from a product list to a range decision.',
  howToRead: ['Contribution share is the product\'s margin over total margin.', 'Margin percent shows how profitable each rupee of sales is.', 'Flagged items are for review, not automatic removal.'],
  diagramTitle: 'From a product list to a range decision', diagramCaption: 'The cut-off is yours; the sheet applies it consistently.',
  steps: [['List products', 'Revenue and margin'], ['Work out contribution', 'Share of margin'], ['Apply the cut-off', 'Flag the tail'], ['Review each', 'Delist, fix or keep']],
  sections: [
    sec('scope', 'The review', 'Set the cut-off and context.', [
      text('range', 'Range or category', 'The range this review covers.', 'Snacks, all pack sizes'),
      num('cutoff_pct', 'Contribution cut-off', 'percent', 'Products with a smaller share of total margin than this are flagged for review. Set it from your own range goals.', '10'),
      long('notes', 'Strategic reasons to keep a product', 'List products you must keep for reasons the numbers do not show, such as a key customer or a new launch.', 'Chilli bites launched in September; too early to judge.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Category Manager'),
    ]),
    sec('skus', 'Products', 'Enter revenue and margin for each product.', [
      tbl('skus', 'Products', 'Product', 'One row per product over the same period. Revenue and margin are in rupees.', [
        ct('sku', 'Product', 'The product or SKU name.'),
        cn('revenue', 'Revenue', 'Net revenue in the period, in rupees.', 'rupees'),
        cn('margin', 'Margin', 'Gross margin in the period, in rupees.', 'rupees'),
        cc('margin_pct', 'Margin percent', 'Worked out: margin divided by revenue.', { op: 'calc', expr: { mul: [{ div: [c('margin'), c('revenue')] }, 100] }, format: 'pct' }),
        cc('share', 'Share of total margin', 'Worked out: this product\'s margin as a percentage of all margin.', { op: 'calc', expr: share, format: 'pct' }),
        cc('tail', 'Tail score', 'Worked out: 100 minus share, used to find the smallest contributor.', { op: 'calc', expr: { sub: [100, share] }, format: 'pct' }),
        cc('call', 'Call', 'Worked out: Review when the share is under your cut-off, otherwise Keep.', { op: 'when', expr: { sub: [share, f('cutoff_pct')] }, lt: 0, then: 'Review', else: 'Keep', tones: { then: 'warn', else: 'good' } }),
      ], 3, 200),
    ]),
  ],
  plan: 'range decisions',
  derived: [
    { key: 'rev_total', label: 'Total revenue (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'skus', col: 'revenue' }, format: 'int' } },
    { key: 'margin_total', label: 'Total margin (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'skus', col: 'margin' }, format: 'int' } },
  ],
  outputs: [
    { key: 'star', label: 'Largest margin contributor', rule: { op: 'top', table: 'skus', by: 'margin', label: 'sku' } },
    { key: 'tail', label: 'Smallest contributor', rule: { op: 'top', table: 'skus', by: 'tail', label: 'sku' } },
  ],
  analysisGuide: 'State total margin, the largest contributor and the smallest, and list the products below the cut-off. Say that a flagged product may deserve a fix (price, pack, distribution) rather than removal. Mention strategic reasons from the notes, and warn about launches too new to judge. Do not claim cost savings from delisting without the supply cost data. Recommend delist, fix or keep for each flagged product, with an owner by role, a date and a measure, and say when the range will be reviewed again.',
  scenario: 'A snacks company reviews four products. Figures are fictional and for learning only.',
  values: { range: 'Snacks, all pack sizes', cutoff_pct: '10', notes: 'Chilli bites launched in September; too early to judge.' },
  tables: { skus: [{ sku: 'Classic salted 50g', revenue: '200000', margin: '40000' }, { sku: 'Masala 50g', revenue: '150000', margin: '30000' }, { sku: 'Family pack 200g', revenue: '100000', margin: '25000' }, { sku: 'Chilli bites 30g', revenue: '50000', margin: '5000' }] },
  actions: [['Review the chilli bites with sales and supply', 'Category Manager', 'Delist, fix or keep decided'], ['Check if a price change could lift the lowest margin', 'Pricing Analyst', 'Price option assessed'], ['Rerun the review next year', 'Category Analyst', 'Updated ranking']],
});

/**
 * Distributor health: fill rate = supplied / ordered; receivable days = receivable / monthly sales x 30; growth = (sales - previous) / previous.
 */
const days: Expr = { mul: [{ div: [c('receivable'), c('sales')] }, 30] };

export const DISTRIBUTOR_HEALTH = agent({
  slug: 'distributor-health-check', name: 'Distributor Health Check', category: 'analytical',
  does: 'Scores each distributor on how fully you supply them, how long they take to pay and whether their sales are growing, and flags those with credit risk.',
  whenToUse: 'Use it monthly or quarterly across your distributors, and before renewing terms or raising credit limits.',
  whenNotToUse: 'Do not use it to terminate a distributor or change credit without a conversation and the full account history.',
  next: 'Talk to flagged distributors, agree a payment plan or a supply fix, and recheck next month.',
  summary: 'A distributor can grow fast and still be a risk if receivables stretch, or look quiet because you supply them short. Three measures together tell the story.',
  caption: 'Four steps from distributor data to account actions.',
  howToRead: ['Fill rate is value supplied over value ordered; low means you are letting them down.', 'Receivable days shows how many days of sales are unpaid.', 'Growth compares this period\'s sales with the last.'],
  diagramTitle: 'From distributor data to account actions', diagramCaption: 'Supply, credit and growth are read together.',
  steps: [['List distributors', 'Orders, supply, dues'], ['Work out three measures', 'Fill, days, growth'], ['Apply your limit', 'Credit days'], ['Act on the account', 'Owner and date']],
  sections: [
    sec('scope', 'The review', 'Set your credit limit and the period.', [
      text('period', 'Period', 'The month the sales and orders cover.', 'October'),
      num('limit_days', 'Credit limit', 'days', 'The receivable days you accept, from your own credit terms.', '45'),
      long('notes', 'Anything unusual', 'Note disputes, festival buying or supply problems that affect the figures.', 'D2 had a dispute over damaged goods in September.'),
      text('owner', 'Owner (role)', 'The role responsible for acting on this review.', 'Regional Sales Manager'),
    ]),
    sec('distributors', 'Distributors', 'Enter each distributor\'s figures.', [
      tbl('distributors', 'Distributors', 'Distributor', 'One row per distributor, in rupees. Receivable is the total unpaid at month end.', [
        ct('name', 'Distributor', 'The distributor name.'),
        cn('ordered', 'Ordered', 'Value they ordered in the month, in rupees.', 'rupees'),
        cn('supplied', 'Supplied', 'Value you actually supplied, in rupees.', 'rupees'),
        cn('receivable', 'Receivable', 'Amount they owe you at month end, in rupees.', 'rupees'),
        cn('sales', 'Sales this month', 'Value sold to them this month, in rupees.', 'rupees'),
        cn('prev', 'Sales last month', 'Value sold to them last month, in rupees.', 'rupees'),
        cc('fill', 'Fill rate', 'Worked out: supplied divided by ordered.', { op: 'calc', expr: { mul: [{ div: [c('supplied'), c('ordered')] }, 100] }, format: 'pct' }),
        cc('days', 'Receivable days', 'Worked out: receivable divided by monthly sales, times 30.', { op: 'calc', expr: days, format: 'dp1' }),
        cc('growth', 'Growth', 'Worked out: sales this month against last month.', { op: 'calc', expr: { mul: [{ div: [{ sub: [c('sales'), c('prev')] }, c('prev')] }, 100] }, format: 'pct' }),
        cc('call', 'Credit call', 'Worked out: Credit risk when receivable days are over your limit.', { op: 'when', expr: { sub: [days, f('limit_days')] }, gt: 0, then: 'Credit risk', else: 'Within limit', tones: { then: 'bad', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'account actions',
  derived: [
    { key: 'recv_total', label: 'Total receivable (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'distributors', col: 'receivable' }, format: 'int' } },
    { key: 'count', label: 'Distributors reviewed', rule: { op: 'calc', expr: { agg: 'count', table: 'distributors', col: 'name' }, format: 'int' } },
  ],
  outputs: [{ key: 'slowest', label: 'Slowest payer (most receivable days)', rule: { op: 'top', table: 'distributors', by: 'days', label: 'name' } }],
  analysisGuide: 'State total receivable and name the slowest payer with their days against the limit. Read fill rate and growth alongside: a low fill rate can explain weak sales and slow payment, and growth with stretching credit is a risk. Warn that one month is a snapshot and disputes can distort days. Recommend a conversation and a specific action per flagged distributor, such as a payment plan or a supply fix, with an owner by role, a date and a measure, and say when the check will be rerun.',
  scenario: 'A consumer goods company reviews three distributors. Figures are fictional and for learning only.',
  values: { period: 'October', limit_days: '45', notes: 'D2 had a dispute over damaged goods in September.' },
  tables: { distributors: [{ name: 'D1 Sharma Distributors', ordered: '1000000', supplied: '950000', receivable: '600000', sales: '900000', prev: '800000' }, { name: 'D2 Gupta Agencies', ordered: '800000', supplied: '640000', receivable: '1200000', sales: '700000', prev: '750000' }, { name: 'D3 Nair Traders', ordered: '500000', supplied: '500000', receivable: '250000', sales: '450000', prev: '400000' }] },
  actions: [['Agree a payment plan with D2', 'Regional Sales Manager', 'Receivable days under the limit'], ['Fix supply shortfalls to D2', 'Supply Planner', 'Fill rate improved'], ['Recheck all distributors next month', 'Sales Analyst', 'Updated health list']],
});
