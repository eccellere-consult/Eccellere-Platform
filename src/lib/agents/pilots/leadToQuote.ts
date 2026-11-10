import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, long, num, sec, tbl, text } from './kit';

/**
 * Lead-to-Quote: prices a quotation from the price book and checks the margin before it is sent.
 * Method (fixed formula): line total = quantity x unit price; line cost = quantity x unit cost; margin after discount =
 *   (revenue after discount - cost) / revenue after discount, where the discount is a percentage taken off the sum of line totals.
 */
const lineTotal: Expr = { mul: [c('qty'), c('price')] };
const lineCost: Expr = { mul: [c('qty'), c('cost')] };
const revenue: Expr = { agg: 'sum', table: 'lines', col: 'line_total' };
const cost: Expr = { agg: 'sum', table: 'lines', col: 'line_cost' };
const net: Expr = { mul: [revenue, { sub: [1, { div: [f('discount_pct'), 100] }] }] };
const margin: Expr = { mul: [{ div: [{ sub: [net, cost] }, net] }, 100] };

export const LEAD_TO_QUOTE = agent({
  slug: 'lead-to-quote-assistant', name: 'Lead-to-Quote Assistant', category: 'planning',
  does: 'Prices a customer quotation line by line from your price list, applies the discount you offer, and shows the margin you would earn so a quote is never sent below your floor.',
  whenToUse: 'Use it each time an enquiry needs a written quotation, before the quote is sent, so the discount and margin are checked in one place.',
  whenNotToUse: 'Do not use it to set list prices or to price a custom project with uncertain costs. It checks arithmetic and margin; it does not decide whether to bid.',
  next: 'Send the quote, record the outcome, and review wins and losses monthly to adjust your price list and discount limits.',
  summary: 'A quote is a margin decision as much as a price. Seeing revenue, cost and margin after discount together stops quiet erosion of profit one friendly discount at a time.',
  caption: 'Four steps from an enquiry to a quote that is safe to send.',
  howToRead: ['Line total is quantity times unit price; cost uses your unit cost.', 'Margin is measured after the discount, on what the customer actually pays.', 'The floor check turns red below your minimum margin, so ask for approval before sending.'],
  diagramTitle: 'From enquiry to a safe quote', diagramCaption: 'The margin is checked before the quote leaves, not after the order is lost or won.',
  steps: [['Capture the lead', 'Who, what, by when'], ['List the lines', 'Quantity, price, cost'], ['Set the discount', 'Within your limit'], ['Check the margin', 'Against the floor'], ['Send and follow up', 'Owner and date']],
  sections: [
    sec('lead', 'The enquiry', 'Record who asked and what they need.', [
      text('customer', 'Customer name', 'The company or person the quote is for, as it should appear on the document.', 'Sunrise Packaging Pvt Ltd'),
      long('need', 'What do they need?', 'Summarise the requirement in a sentence or two, including quantities and the date they need it by.', 'Cartons for a new product launch, first delivery in four weeks.'),
      text('valid', 'Quote valid until', 'The date after which the prices are no longer held, so the customer knows when to decide.', '30 November'),
    ]),
    sec('pricing', 'Discount and floor', 'Set the discount you are offering and the lowest margin you accept.', [
      num('discount_pct', 'Discount offered', 'percent', 'The percentage taken off the total of all lines. Use 0 for no discount.', '5'),
      num('floor_pct', 'Lowest margin you accept', 'percent', 'The margin below which a quote needs approval before it is sent. Set it from your costs and targets.', '25'),
    ]),
    sec('lines', 'Quote lines', 'List each item with quantity, price and cost. The table works out the rest.', [
      tbl('lines', 'Quote lines', 'Line', 'One row per item. Take the unit price from your price list and the unit cost from your costing, both in rupees.', [
        ct('item', 'Item', 'What is being sold, in the customer\'s words.'),
        cn('qty', 'Quantity', 'How many units the customer wants.', 'units'),
        cn('price', 'Unit price', 'The price per unit from your price list, in rupees.', 'rupees'),
        cn('cost', 'Unit cost', 'What one unit costs you to make or buy, in rupees.', 'rupees'),
        cc('line_total', 'Line total', 'Worked out: quantity times unit price, before discount.', { op: 'calc', expr: lineTotal, format: 'int' }),
        cc('line_cost', 'Line cost', 'Worked out: quantity times unit cost.', { op: 'calc', expr: lineCost, format: 'int' }),
      ]),
    ]),
  ],
  plan: 'quote',
  derived: [
    { key: 'subtotal', label: 'Total before discount (rupees)', rule: { op: 'calc', expr: revenue, format: 'int' } },
    { key: 'net_total', label: 'Total after discount (rupees)', rule: { op: 'calc', expr: net, format: 'int' } },
    { key: 'total_cost', label: 'Total cost (rupees)', rule: { op: 'calc', expr: cost, format: 'int' } },
  ],
  outputs: [
    { key: 'margin', label: 'Margin after discount', rule: { op: 'calc', expr: margin, format: 'pct' } },
    { key: 'floor_check', label: 'Against your floor', rule: { op: 'when', expr: { sub: [margin, f('floor_pct')] }, lt: 0, then: 'Below floor: get approval', else: 'At or above floor', tones: { then: 'bad', else: 'good' } } },
  ],
  analysisGuide: 'State the total after discount and the margin it earns, and say plainly whether it clears the floor. If it is below the floor, show how much discount could be given and still meet it, and recommend asking for approval or removing the lowest-margin lines. Name the line that contributes most to margin and the one that contributes least. Flag any line where the cost is missing or looks out of date, because a wrong cost makes the margin meaningless. Note the validity date and how long the prices are held. End with a follow-up date and an owner, and what you will do if the customer asks for a deeper discount.',
  scenario: 'A packaging supplier quotes two items. Names and prices are fictional and for learning only.',
  values: { customer: 'Sunrise Packaging Pvt Ltd', need: 'Cartons for a new product launch, first delivery in four weeks.', valid: '30 November', discount_pct: '5', floor_pct: '25' },
  tables: { lines: [{ item: 'Printed carton, medium', qty: '1000', price: '40', cost: '28' }, { item: 'Carton divider set', qty: '500', price: '20', cost: '12' }] },
  actions: [['Get sign-off on the quote from the sales head', 'Sales Manager', 'Quote approved before sending'], ['Send the quote and book a follow-up call', 'Sales Executive', 'Follow-up call held'], ['Record the outcome and reason', 'Sales Manager', 'Outcome logged']],
});
