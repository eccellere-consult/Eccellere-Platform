import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, f, long, num, pick, sec, text } from './kit';

/**
 * Close-the-Books: a month-end close checklist with a readiness score.
 * Method (fixed rule): each task is Done (2 points), In progress (1), Not started (0) or Not applicable (left out).
 * Readiness = points earned / points possible. Days to the close deadline decides whether the gap is urgent.
 */
const OPTS = ['Done', 'In progress', 'Not started', 'Not applicable'];
const TASKS: [string, string, string, string][] = [
  ['t_sales', 'Sales invoices and credit notes posted', 'All invoices and credit notes dated in the month are in the ledger, with none left in drafts.', 'Done'],
  ['t_purch', 'Purchase invoices and expenses posted', 'All supplier bills and expense claims for the month are entered, including those received late.', 'Done'],
  ['t_bank', 'Bank accounts reconciled', 'Every bank account agrees to its statement, and unmatched items are listed with reasons.', 'In progress'],
  ['t_ar', 'Receivables ledger reviewed', 'Customer balances agree to the control account and old balances have been checked for recovery.', 'In progress'],
  ['t_ap', 'Payables ledger reviewed', 'Supplier balances agree to the control account, and unrecorded liabilities have been searched for.', 'Not started'],
  ['t_stock', 'Stock counted or valued', 'Closing stock is counted or estimated on a stated basis, and slow items are reviewed.', 'Not started'],
  ['t_accr', 'Accruals and prepayments booked', 'Costs incurred but not billed, and amounts paid in advance, are booked for the month.', 'Not started'],
  ['t_depn', 'Depreciation and fixed assets updated', 'Additions and disposals are recorded and depreciation for the month is posted.', 'Done'],
  ['t_tax', 'GST and TDS reconciled', 'Tax accounts agree to returns filed or due, with differences explained.', 'Not started'],
  ['t_review', 'Management review and sign-off', 'The finance head has reviewed the trial balance and unusual movements and signed off the close.', 'Not started'],
];
const KEYS = TASKS.map((t) => t[0]);
const points = { Done: 2, 'In progress': 1, 'Not started': 0 };
const bands = [{ min: 0, label: 'Not ready to close' }, { min: 60, label: 'Nearly ready' }, { min: 90, label: 'Ready to close' }];
const days: Expr = f('days_left');

export const CLOSE_THE_BOOKS = agent({
  slug: 'close-the-books-agent', name: 'Close-the-Books', category: 'planning',
  does: 'Tracks the ten tasks of a month-end close, works out how ready the close is, and flags when too few days remain for what is left to do.',
  whenToUse: 'Use it on the last working day of each month and daily until the books are closed, so nothing is left to the final hour.',
  whenNotToUse: 'Do not use it as an audit or a statement that the accounts are correct. It tracks whether the tasks have been done, not whether they were done right.',
  next: 'Close the open tasks in order of dependency (ledgers before reviews), and after sign-off, note what slowed this close to improve the next one.',
  summary: 'A close runs late because a few tasks quietly wait on each other. A single checklist with a status per task, set against the days left, shows the critical gaps early.',
  caption: 'Four stages from the last day of the month to a signed-off close.',
  howToRead: ['Readiness counts Done as full, In progress as half and Not started as nothing; Not applicable tasks are left out.', 'Compare readiness with the days left to the deadline.', 'Tasks that others depend on, such as bank and ledger reconciliations, should come first.'],
  diagramTitle: 'From month end to a signed-off close', diagramCaption: 'Transactions first, reconciliations next, adjustments after, review last.',
  steps: [['Post transactions', 'Sales, purchases, expenses'], ['Reconcile', 'Bank, ledgers, tax'], ['Adjust', 'Accruals, stock, depreciation'], ['Review and sign off', 'Finance head']],
  sections: [
    sec('close', 'This close', 'Record the month and how many days are left.', [
      text('month', 'Month being closed', 'The month and year of this close, so results are filed correctly.', 'October'),
      num('days_left', 'Working days to the deadline', 'days', 'How many working days remain before the books must be closed. This decides how urgent any gap is.', '3'),
      long('blockers', 'Known blockers', 'Note anything that is holding up the close, such as a missing statement or a system fault.', 'Bank statement for the second account has not arrived.'),
    ]),
    sec('tasks', 'Close tasks', 'Give each task its current status.', TASKS.map(([key, label, help, ex]) => pick(key, label, OPTS, help, ex))),
  ],
  plan: 'open close tasks',
  derived: [
    { key: 'readiness', label: 'Close readiness', help: 'Points earned out of points possible: Done = 2, In progress = 1, Not started = 0. Not applicable tasks are left out.', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } },
    { key: 'answered', label: 'Tasks with a status', rule: { op: 'answers', fields: KEYS, show: 'progress' } },
  ],
  outputs: [
    { key: 'ready', label: 'Readiness to close', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } },
    { key: 'timing', label: 'Time pressure', rule: { op: 'when', expr: days, lt: 3, then: 'Urgent: under three days left', else: 'Enough time if owners are named', tones: { then: 'bad', else: 'good' } } },
  ],
  analysisGuide: 'State the readiness percentage and its band against the days left. List the tasks Not started first, then those In progress, and put them in a sensible order: transaction posting, then bank and ledger reconciliations, then accruals, stock and tax, then review. Give each an owner by role and a date before the deadline. If fewer than three days remain and reconciliations are not done, recommend escalating to the finance head today. Note any task marked Not applicable and confirm the reason. Mention the known blockers and who can clear them, and end with the sign-off date and what will be improved in next month\'s close.',
  scenario: 'A finance team checks its October close with three working days left. Statuses are fictional and for learning only.',
  values: { month: 'October', days_left: '3', blockers: 'Bank statement for the second account has not arrived.', ...Object.fromEntries(TASKS.map((t) => [t[0], t[3]])) },
  tables: {},
  actions: [['Obtain the second bank statement and reconcile', 'Accounts Manager', 'Bank reconciliation signed'], ['Book accruals and finish the payables review', 'Senior Accountant', 'Accruals journal posted'], ['Review the trial balance and sign off', 'Finance Head', 'Close signed off']],
});
