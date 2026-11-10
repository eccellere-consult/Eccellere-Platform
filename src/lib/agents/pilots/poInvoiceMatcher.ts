import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, num, sec, tbl, text } from './kit';

/**
 * PO-Invoice Matcher: three-way style check of invoice lines against purchase order lines (and received quantity).
 * Method (fixed formula): PO value = PO quantity x PO price. Invoice value = invoiced quantity x invoice price.
 *   variance = invoice value - PO value (positive means you are being charged more).
 * A line is Within tolerance when the size of the variance is no more than the tolerance (a percentage of PO value).
 */
const poValue: Expr = { mul: [c('po_qty'), c('po_price')] };
const invValue: Expr = { mul: [c('inv_qty'), c('inv_price')] };
const variance: Expr = { sub: [invValue, poValue] };

export const PO_INVOICE_MATCHER = agent({
  slug: 'po-invoice-matcher', name: 'PO-Invoice Matcher', category: 'analytical',
  does: 'Compares each invoice line with its purchase order line, shows the quantity, price and value differences, and flags the lines outside your tolerance before you pay.',
  whenToUse: 'Use it before approving a supplier invoice for payment, especially for large invoices or suppliers with a history of price or quantity disputes.',
  whenNotToUse: 'Do not use it to check tax, freight or goods quality. It compares quantities and prices on lines you enter; it does not read documents.',
  next: 'Hold payment on flagged lines, send the supplier a short query with the figures, and approve the rest.',
  summary: 'Most overpayments come from small price or quantity differences nobody checks. A line-by-line match with a clear tolerance finds them before money leaves.',
  caption: 'Four steps from a supplier invoice to a safe payment.',
  howToRead: ['Variance is invoice value minus PO value: positive means you are being charged more.', 'Quantity and price variances show why the value differs.', 'Lines outside tolerance should not be paid until the supplier explains.'],
  diagramTitle: 'From a supplier invoice to a safe payment', diagramCaption: 'Each line is matched to the order it came from, and only the differences need a human.',
  steps: [['Enter the PO lines', 'Quantity and price'], ['Enter the invoice lines', 'Quantity and price'], ['Match', 'Value difference per line'], ['Resolve', 'Query, hold or pay']],
  sections: [
    sec('header', 'Invoice details', 'Record the supplier, invoice and your tolerance.', [
      text('supplier', 'Supplier', 'The supplier who sent the invoice, as in your vendor records.', 'Shree Packaging Works'),
      text('invoice_no', 'Invoice number', 'The supplier\'s invoice number, so the query can quote it.', 'SPW-8841'),
      num('tolerance_pct', 'Tolerance', 'percent', 'The difference, as a percentage of PO value, that you accept without a query. Many firms use 1 to 2 percent.', '2'),
    ]),
    sec('lines', 'Line match', 'Enter each line from the purchase order and the invoice.', [
      tbl('lines', 'Lines', 'Line', 'One row per item. Enter the PO quantity and price, and the invoice quantity and price, in rupees.', [
        ct('item', 'Item', 'What was ordered.'),
        cn('po_qty', 'PO quantity', 'Units on the purchase order.', 'units'),
        cn('po_price', 'PO price', 'Unit price on the purchase order, in rupees.', 'rupees'),
        cn('inv_qty', 'Invoice quantity', 'Units on the invoice.', 'units'),
        cn('inv_price', 'Invoice price', 'Unit price on the invoice, in rupees.', 'rupees'),
        cc('po_value', 'PO value', 'Worked out: PO quantity times PO price.', { op: 'calc', expr: poValue, format: 'int' }),
        cc('inv_value', 'Invoice value', 'Worked out: invoice quantity times invoice price.', { op: 'calc', expr: invValue, format: 'int' }),
        cc('variance', 'Variance', 'Worked out: invoice value minus PO value. Positive means overcharged.', { op: 'calc', expr: variance, format: 'int' }),
        cc('status', 'Match', 'Worked out: Within tolerance, or Query when the variance is larger than your tolerance in either direction.', { op: 'when', expr: { sub: [{ abs: variance }, { mul: [poValue, { div: [f('tolerance_pct'), 100] }] }] }, gt: 0, then: 'Query', else: 'Within tolerance', tones: { then: 'bad', else: 'good' } }),
      ], 3, 100),
    ]),
  ],
  plan: 'invoice queries',
  derived: [
    { key: 'po_total', label: 'PO total (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'lines', col: 'po_value' }, format: 'int' } },
    { key: 'inv_total', label: 'Invoice total (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'lines', col: 'inv_value' }, format: 'int' } },
    { key: 'net_variance', label: 'Net variance (rupees)', rule: { op: 'calc', expr: { agg: 'sum', table: 'lines', col: 'variance' }, format: 'int' } },
  ],
  outputs: [{ key: 'largest', label: 'Largest overcharge', rule: { op: 'top', table: 'lines', by: 'variance', label: 'item' } }],
  analysisGuide: 'State the invoice total against the PO total and the net variance, then list every line outside tolerance with its quantity and price difference, so the supplier query is specific. Say whether a difference is a price change, a quantity change or both, and whether it goes for or against you. Do not recommend paying a flagged line until the supplier explains or issues a credit note. Where the invoice is lower than the PO, check that the goods were received in full. End with who contacts the supplier, the amount to hold, and the date by which the query must be answered.',
  scenario: 'An invoice from a packaging supplier is matched against its order. Items and prices are fictional and for learning only.',
  values: { supplier: 'Shree Packaging Works', invoice_no: 'SPW-8841', tolerance_pct: '2' },
  tables: { lines: [{ item: 'Printed carton, medium', po_qty: '1000', po_price: '40', inv_qty: '1000', inv_price: '40' }, { item: 'Carton divider set', po_qty: '500', po_price: '20', inv_qty: '500', inv_price: '23' }, { item: 'Packing tape', po_qty: '200', po_price: '15', inv_qty: '210', inv_price: '15' }] },
  actions: [['Query the divider price with the supplier', 'Accounts Payable Lead', 'Credit note or explanation received'], ['Check receipt of the extra tape', 'Stores Manager', 'Goods receipt confirmed'], ['Pay the lines that match', 'Accounts Payable Executive', 'Payment released on matched lines']],
});
