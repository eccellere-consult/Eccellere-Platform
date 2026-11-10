import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, f, num, sec, tbl, text, long } from './kit';

/**
 * Collections Follow-up: ranks overdue invoices so the first calls go where the money and the delay are largest.
 * Method (fixed formula): priority = amount overdue x days overdue (rupee-days). Share = invoice amount / total overdue.
 * Step: Reminder when days overdue is at or below the escalation point, otherwise Escalate.
 */
const priority: Expr = { mul: [c('amount'), c('days')] };
const total: Expr = { agg: 'sum', table: 'invoices', col: 'amount' };

export const COLLECTIONS = agent({
  slug: 'collections-follow-up-agent', name: 'Collections Follow-up', category: 'prioritisation',
  does: 'Ranks overdue invoices by amount and days late, shows each one\'s share of what is owed, and tells you whether it needs a reminder or an escalation.',
  whenToUse: 'Use it weekly on your list of unpaid invoices, so the limited time of your collections team goes to the debts that matter most.',
  whenNotToUse: 'Do not use it to decide credit limits or to write off debt. It ranks follow-up effort; it does not judge whether a customer can pay.',
  next: 'Work the list from the top, record each promise to pay with a date, and rerun the sheet next week with updated days overdue.',
  summary: 'Overdue money is a queue. Ranking by amount times days late puts the largest, oldest debts first, which is where a call or a visit does the most good.',
  caption: 'Four steps from a list of unpaid invoices to a call list in order.',
  howToRead: ['Priority multiplies the amount by the days overdue, so a large old debt ranks first.', 'Share shows how much of all overdue money one invoice is.', 'Escalate means the invoice is past your escalation point and needs a senior contact.'],
  diagramTitle: 'From unpaid invoices to a call list', diagramCaption: 'The same rule is applied to every customer, so follow-up is fair and explainable.',
  steps: [['List overdue invoices', 'Customer, amount, days'], ['Rank by priority', 'Amount x days late'], ['Choose the step', 'Reminder or escalate'], ['Record promises', 'Date and owner']],
  sections: [
    sec('rules', 'Your follow-up rule', 'Say when a reminder becomes an escalation.', [
      num('escalate_after', 'Escalate after', 'days overdue', 'Invoices more than this many days overdue move from a reminder to an escalation to a senior contact.', '30'),
      text('owner_role', 'Who follows up (role)', 'The role that makes the calls, so the list has an owner.', 'Accounts Receivable Executive'),
      long('terms', 'Your standard payment terms', 'Write your usual terms in a sentence, so reminders quote the same terms every time.', 'Payment within 30 days of invoice date.'),
    ]),
    sec('invoices', 'Overdue invoices', 'List each unpaid invoice. The table ranks them.', [
      tbl('invoices', 'Overdue invoices', 'Invoice', 'One row per unpaid invoice that is past its due date. Use the amount still unpaid in rupees and the days since the due date.', [
        ct('customer', 'Customer', 'The customer who owes the money.'),
        ct('invoice_no', 'Invoice number', 'The invoice reference, so the customer can find it.'),
        cn('amount', 'Amount overdue', 'The unpaid amount in rupees.', 'rupees'),
        cn('days', 'Days overdue', 'Days since the due date.', 'days'),
        cc('priority', 'Priority', 'Worked out: amount times days overdue. Higher means call sooner.', { op: 'calc', expr: priority, format: 'int' }),
        cc('share', 'Share of overdue', 'Worked out: this invoice as a percentage of all overdue money.', { op: 'calc', expr: { mul: [{ div: [c('amount'), total] }, 100] }, format: 'pct' }),
        cc('step', 'Next step', 'Worked out: Reminder, or Escalate once days overdue passes your escalation point.', { op: 'when', expr: { sub: [c('days'), f('escalate_after')] }, gt: 0, then: 'Escalate', else: 'Reminder', tones: { then: 'bad', else: 'warn' } }),
      ], 3, 40),
    ]),
  ],
  plan: 'overdue invoices',
  derived: [
    { key: 'total_overdue', label: 'Total overdue (rupees)', rule: { op: 'calc', expr: total, format: 'int' } },
    { key: 'count', label: 'Overdue invoices', rule: { op: 'calc', expr: { agg: 'count', table: 'invoices', col: 'customer' }, format: 'int' } },
    { key: 'oldest', label: 'Longest overdue (days)', rule: { op: 'calc', expr: { agg: 'max', table: 'invoices', col: 'days' }, format: 'int' } },
  ],
  outputs: [{ key: 'call_first', label: 'Call first', rule: { op: 'top', table: 'invoices', by: 'priority', label: 'customer' } }],
  analysisGuide: 'State the total overdue, how many invoices it is spread over, and the customer to call first and why. Say how concentrated the debt is: if one customer is a large share, a personal call from a senior person is worth more than reminders. Separate the invoices that need a reminder from those that need escalation, and suggest the tone for each. Note any customer who appears more than once, because that signals a pattern rather than a single late payment. For each of the top three, propose one action with an owner by role and a date, ask for a firm promise-to-pay date, and say when you will check it.',
  scenario: 'A distributor reviews four overdue invoices. Customers and amounts are fictional and for learning only.',
  values: { escalate_after: '30', owner_role: 'Accounts Receivable Executive', terms: 'Payment within 30 days of invoice date.' },
  tables: { invoices: [{ customer: 'Mehta Traders', invoice_no: 'INV-1042', amount: '120000', days: '45' }, { customer: 'Rao Stores', invoice_no: 'INV-1051', amount: '40000', days: '10' }, { customer: 'Kapoor & Sons', invoice_no: 'INV-1038', amount: '60000', days: '70' }] },
  actions: [['Call Kapoor & Sons and agree a payment date', 'Accounts Receivable Executive', 'Promise-to-pay date recorded'], ['Escalate Mehta Traders to the sales head', 'Finance Manager', 'Senior call held'], ['Send a reminder to Rao Stores', 'Accounts Receivable Executive', 'Reminder sent']],
});
