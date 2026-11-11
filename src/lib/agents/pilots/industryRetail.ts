import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Retail agents. Fixed formulas only; targets are the retailer's own.
 *
 * Store scorecard: sales per sq ft = sales / area; conversion = transactions / visitors x 100; basket = sales / transactions.
 */
const convPct: Expr = { mul: [{ div: [c('txns'), c('visitors')] }, 100] };

export const STORE_SCORECARD = agent({
  slug: 'store-performance-scorecard', name: 'Store Performance Scorecard', category: 'analytical',
  does: 'Compares your stores on sales per square foot, how many visitors buy, and the average bill, so you can see which stores need help and what kind of help.',
  whenToUse: 'Use it monthly across stores, or before a regional review, to separate stores that lack footfall from those that fail to convert it.',
  whenNotToUse: 'Do not use it to compare stores in very different formats without saying so, or to judge a store manager on one month.',
  next: 'Visit the weakest store, agree one fix for conversion or basket size, and rerun next month.',
  summary: 'Sales per square foot shows how hard a store works its space. Conversion and basket size show whether the problem is who walks in or what they buy.',
  caption: 'Four steps from store data to a store action.',
  howToRead: ['Sales per sq ft shows how productive the space is.', 'Conversion is the share of visitors who buy.', 'Basket is the average bill; low basket with good conversion means a selling or range issue.'],
  diagramTitle: 'From store data to a store action', diagramCaption: 'Each ratio points to a different kind of fix.',
  steps: [['List stores', 'Area, sales, visitors'], ['Count bills', 'Transactions'], ['Work out ratios', 'Per sq ft, conversion, basket'], ['Act on the weakest', 'One fix, one owner']],
  sections: [
    sec('scope', 'The period', 'Say which period and format these stores share.', [
      text('period', 'Period', 'The month or week the figures cover. Keep it the same for all stores.', 'October'),
      text('format', 'Store format', 'The format these stores share, so the comparison is fair.', 'Apparel, mall stores'),
      long('notes', 'Anything unusual', 'Note refits, closures, local events or stock-outs that distort a store\'s figures.', 'Store S3 was closed for two days for repainting.'),
    ]),
    sec('stores', 'Stores', 'Enter each store. The table works out the ratios.', [
      tbl('stores', 'Stores', 'Store', 'One row per store. Sales in rupees, area in square feet, visitors from your door counter and transactions from billing.', [
        ct('store', 'Store', 'The store name or code.'),
        cn('area', 'Selling area', 'Selling floor area in square feet.', 'sq ft'),
        cn('sales', 'Sales', 'Net sales for the period, in rupees.', 'rupees'),
        cn('visitors', 'Visitors', 'People who entered, from the door counter.', 'visitors'),
        cn('txns', 'Transactions', 'Number of bills raised.', 'bills'),
        cc('per_sqft', 'Sales per sq ft', 'Worked out: sales divided by selling area.', { op: 'calc', expr: { div: [c('sales'), c('area')] }, format: 'int' }),
        cc('conv', 'Conversion', 'Worked out: transactions divided by visitors.', { op: 'calc', expr: convPct, format: 'pct' }),
        cc('basket', 'Average bill', 'Worked out: sales divided by transactions, in rupees.', { op: 'calc', expr: { div: [c('sales'), c('txns')] }, format: 'int' }),
        cc('conv_gap', 'Conversion gap', 'Worked out: 100 minus conversion, used to find the weakest store.', { op: 'calc', expr: { sub: [100, convPct] }, format: 'pct' }),
      ], 3, 50),
    ]),
  ],
  plan: 'store actions',
  derived: [
    { key: 'sales_total', label: 'Total sales (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'sales' }, format: 'int' } },
    { key: 'area_total', label: 'Total selling area (sq ft)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'area' }, format: 'int' } },
  ],
  outputs: [
    { key: 'best', label: 'Highest sales per sq ft', rule: { op: 'top', table: 'stores', by: 'per_sqft', label: 'store' } },
    { key: 'weakest_conv', label: 'Lowest conversion', rule: { op: 'top', table: 'stores', by: 'conv_gap', label: 'store' } },
  ],
  analysisGuide: 'Name the store with the highest sales per square foot and the one with the lowest conversion, and say whether they differ. Explain what the pattern means: low conversion with good footfall points to selling, stock or staffing; low footfall points to location or marketing. Warn against comparing stores of different formats or ages without saying so, and against drawing firm conclusions from one month. Recommend one fix per weak store, with an owner by role, a measure and a date, and say when the scorecard will be rerun.',
  scenario: 'A retailer compares three mall stores for a month. Figures are fictional and for learning only.',
  values: { period: 'October', format: 'Apparel, mall stores', notes: 'Store S3 was closed for two days for repainting.' },
  tables: { stores: [{ store: 'S1 Phoenix', area: '2000', sales: '1000000', visitors: '8000', txns: '1600' }, { store: 'S2 Orion', area: '1500', sales: '600000', visitors: '5000', txns: '1000' }, { store: 'S3 Palladium', area: '3000', sales: '900000', visitors: '12000', txns: '1200' }] },
  actions: [['Review floor staffing at peak hours in S3', 'Regional Manager', 'Conversion up from 10 percent'], ['Train S2 staff on add-on selling', 'Store Manager', 'Average bill up'], ['Rerun the scorecard next month', 'Retail Analyst', 'Scorecard shared']],
});

/**
 * Stock cover: weeks of cover = stock / weekly sales; excess = stock above target cover, valued at cost.
 */
const excessUnits: Expr = { max: [0, { sub: [c('stock'), { mul: [f('target_weeks'), c('weekly')] }] }] };

export const STOCK_COVER = agent({
  slug: 'stock-cover-markdown-planner', name: 'Stock Cover and Markdown Planner', category: 'planning',
  does: 'Shows how many weeks of sales you hold in each item, what stock is above your target cover and what it cost, and which items to plan a markdown for.',
  whenToUse: 'Use it weekly or fortnightly on active items, and before a season end, to act on slow stock while it still sells at a fair price.',
  whenNotToUse: 'Do not use it for items with no sales history, new launches or highly seasonal items without adjusting the weekly sales you enter.',
  next: 'Decide a markdown or transfer for the highest excess items, then recheck cover after two weeks.',
  summary: 'Slow stock ties up cash and loses value every week. Seeing cover in weeks against your own target turns a vague worry into a short, costed list.',
  caption: 'Four steps from stock counts to a markdown list.',
  howToRead: ['Cover is stock divided by weekly sales: how many weeks it would last.', 'Excess is the stock above your target cover, valued at cost.', 'Items over target are the markdown candidates.'],
  diagramTitle: 'From stock counts to a markdown list', diagramCaption: 'The target cover is yours; the sheet only measures against it.',
  steps: [['List items', 'Stock and weekly sales'], ['Work out cover', 'Weeks of stock'], ['Value the excess', 'Above target, at cost'], ['Plan the action', 'Markdown or transfer']],
  sections: [
    sec('scope', 'The target', 'Set the cover you want to hold.', [
      text('category', 'Category or season', 'The product group or season these items belong to.', 'Winter wear'),
      num('target_weeks', 'Target cover', 'weeks', 'The weeks of sales you are happy to hold, from your own policy and supplier lead time.', '8'),
      long('notes', 'Anything that changes sales', 'Note promotions, weather or supply issues that make recent sales unusual.', 'Warm October reduced jacket sales.'),
    ]),
    sec('items', 'Items', 'Enter stock and average weekly sales for each item.', [
      tbl('items', 'Items', 'Item', 'One row per item or group. Weekly sales is the average units sold per week recently; cost is what one unit cost you.', [
        ct('item', 'Item', 'The item or style name.'),
        cn('stock', 'Stock on hand', 'Units in stores and warehouse.', 'units'),
        cn('weekly', 'Weekly sales', 'Average units sold per week lately.', 'units per week'),
        cn('cost', 'Unit cost', 'What one unit cost you, in rupees.', 'rupees'),
        cc('cover', 'Weeks of cover', 'Worked out: stock divided by weekly sales.', { op: 'calc', expr: { div: [c('stock'), c('weekly')] }, format: 'dp1' }),
        cc('excess_units', 'Excess units', 'Worked out: stock above target cover.', { op: 'calc', expr: excessUnits, format: 'int' }),
        cc('excess_value', 'Excess at cost', 'Worked out: excess units times unit cost, in rupees.', { op: 'calc', expr: { mul: [excessUnits, c('cost')] }, format: 'int' }),
        cc('flag', 'Call', 'Worked out: Over target means plan a markdown or transfer; otherwise Within target.', { op: 'when', expr: { sub: [{ div: [c('stock'), c('weekly')] }, f('target_weeks')] }, gt: 0, then: 'Over target', else: 'Within target', tones: { then: 'warn', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'markdown actions',
  derived: [
    { key: 'excess_total', label: 'Excess stock at cost (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'items', col: 'excess_value' }, format: 'int' } },
    { key: 'item_count', label: 'Number of items', rule: { op: 'calc', expr: { agg: 'count', table: 'items', col: 'item' }, format: 'int' } },
  ],
  outputs: [{ key: 'biggest', label: 'Largest excess at cost', rule: { op: 'top', table: 'items', by: 'excess_value', label: 'item' } }],
  analysisGuide: 'State the total excess at cost and which items hold most of it. Say how many weeks of cover the worst item has against the target. Warn that cover based on a few weeks of unusual sales can mislead, and that markdown depth is a separate decision this sheet does not make. Recommend markdown, transfer to a faster store or hold, per item, with an owner by role, a date and a measure such as cover after two weeks, and say when cover will be rechecked.',
  scenario: 'A retailer reviews three winter items against an eight-week target. Figures are fictional and for learning only.',
  values: { category: 'Winter wear', target_weeks: '8', notes: 'Warm October reduced jacket sales.' },
  tables: { items: [{ item: 'Kurta', stock: '600', weekly: '100', cost: '400' }, { item: 'Padded jacket', stock: '900', weekly: '50', cost: '1000' }, { item: 'Printed tee', stock: '1200', weekly: '100', cost: '200' }] },
  actions: [['Plan a markdown for the padded jacket', 'Merchandise Manager', 'Cover down towards target'], ['Move tee stock to faster stores', 'Supply Planner', 'Stock transferred'], ['Recheck cover after two weeks', 'Retail Analyst', 'Updated cover list']],
});

/**
 * Shrinkage: loss = theft + damage + admin errors; loss percent = loss / sales x 100.
 */
const lossTotal: Expr = { add: [{ add: [c('theft'), c('damage')] }, c('admin')] };

export const SHRINKAGE = agent({
  slug: 'shrinkage-tracker', name: 'Shrinkage Tracker', category: 'prioritisation',
  does: 'Adds up stock loss by cause (theft, damage, admin errors) for each store, shows it as a share of sales, and flags the stores above your tolerance.',
  whenToUse: 'Use it after each stock count to see where stock is leaking and which cause deserves attention first.',
  whenNotToUse: 'Do not use it to accuse staff or customers. It shows where loss is high; finding the reason needs a store review.',
  next: 'Review the highest-loss store and the biggest cause, agree one control, and compare the next count.',
  summary: 'Shrinkage hides in margin. Splitting it by cause and store shows whether to fix security, handling or paperwork.',
  caption: 'Four steps from a stock count to a control.',
  howToRead: ['Loss is theft plus damage plus admin errors, in rupees.', 'Loss percent compares it with the store\'s sales.', 'Stores above your tolerance are flagged.'],
  diagramTitle: 'From a stock count to a control', diagramCaption: 'The cause decides the control.',
  steps: [['Count stock', 'Book against actual'], ['Split by cause', 'Theft, damage, admin'], ['Compare with sales', 'Loss percent'], ['Set a control', 'Owner and date']],
  sections: [
    sec('scope', 'The count', 'Say which period the count covers and your tolerance.', [
      text('period', 'Period', 'The stock count period the losses come from.', 'Q2 stock count'),
      num('tolerance_pct', 'Tolerance', 'percent', 'The loss as a percentage of sales you accept, from your own policy.', '2'),
      long('notes', 'Anything unusual', 'Note refits, transfers or system changes that may explain differences.', 'Store B changed its billing system in August.'),
    ]),
    sec('stores', 'Stores', 'Enter losses by cause for each store.', [
      tbl('stores', 'Stores', 'Store', 'One row per store. Losses are in rupees at cost; sales are net sales for the same period.', [
        ct('store', 'Store', 'The store name or code.'),
        cn('sales', 'Sales', 'Net sales for the period, in rupees.', 'rupees'),
        cn('theft', 'Theft and unknown', 'Loss from theft or unexplained difference, in rupees.', 'rupees'),
        cn('damage', 'Damage and expiry', 'Loss from damaged or expired stock, in rupees.', 'rupees'),
        cn('admin', 'Admin errors', 'Loss from wrong receiving, pricing or billing, in rupees.', 'rupees'),
        cc('loss', 'Total loss', 'Worked out: theft plus damage plus admin errors.', { op: 'calc', expr: lossTotal, format: 'int' }),
        cc('loss_pct', 'Loss of sales', 'Worked out: total loss as a percentage of sales.', { op: 'calc', expr: { mul: [{ div: [lossTotal, c('sales')] }, 100] }, format: 'dp2' }),
        cc('flag', 'Against tolerance', 'Worked out: Above tolerance when loss percent is over your tolerance.', { op: 'when', expr: { sub: [{ mul: [{ div: [lossTotal, c('sales')] }, 100] }, f('tolerance_pct')] }, gt: 0, then: 'Above tolerance', else: 'Within tolerance', tones: { then: 'bad', else: 'good' } }),
      ], 3, 50),
    ]),
  ],
  plan: 'loss controls',
  derived: [
    { key: 'total_loss', label: 'Total loss (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'loss' }, format: 'int' } },
    { key: 'theft_total', label: 'Theft and unknown (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'theft' }, format: 'int' } },
    { key: 'damage_total', label: 'Damage and expiry (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'damage' }, format: 'int' } },
    { key: 'admin_total', label: 'Admin errors (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'stores', col: 'admin' }, format: 'int' } },
  ],
  outputs: [{ key: 'worst', label: 'Store with highest loss of sales', rule: { op: 'top', table: 'stores', by: 'loss_pct', label: 'store' } }],
  analysisGuide: 'State total loss and the highest-loss store as a percentage of sales against the tolerance, then which cause is largest overall. Say plainly that unexplained loss is not proof of theft. Compare stores with care where formats or periods differ. Recommend one control per cause for the worst store, such as receiving checks for admin errors or display changes for damage, with an owner by role, a date and a measure, and say when the next count will be compared.',
  scenario: 'A retailer reviews shrinkage in three stores after a stock count. Figures are fictional and for learning only.',
  values: { period: 'Q2 stock count', tolerance_pct: '2', notes: 'Store B changed its billing system in August.' },
  tables: { stores: [{ store: 'Store A', sales: '2000000', theft: '20000', damage: '10000', admin: '10000' }, { store: 'Store B', sales: '1000000', theft: '30000', damage: '5000', admin: '5000' }, { store: 'Store C', sales: '1500000', theft: '9000', damage: '6000', admin: '0' }] },
  actions: [['Audit receiving and billing at Store B', 'Retail Operations Manager', 'Admin errors identified'], ['Review security tags and cameras at Store B', 'Loss Prevention Lead', 'Control in place'], ['Compare the next count with this one', 'Retail Analyst', 'Trend shared']],
});
