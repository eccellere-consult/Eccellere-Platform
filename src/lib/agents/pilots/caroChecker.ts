import { agent, long, pick, sec, text } from './kit';

/**
 * CARO Compliance Checker: a readiness checklist for the evidence an auditor asks for under the Companies (Auditor's Report) Order, 2020.
 * IMPORTANT: this is an evidence-readiness tracker only. It does not decide whether a clause applies, whether the company complies, or
 * what the auditor will report; the list of topics below is a working summary and must be confirmed with the company's auditor.
 * Method (fixed rule): Ready (2 points), Partly ready (1), Not started (0), Not applicable (left out). Readiness = points / possible.
 */
const OPTS = ['Ready', 'Partly ready', 'Not started', 'Not applicable'];
const TOPICS: [string, string, string, string][] = [
  ['c_assets', 'Fixed assets: records, physical verification and title deeds', 'Asset register is complete with locations, verification is done at reasonable intervals, and title documents for property are on file.', 'Partly ready'],
  ['c_stock', 'Inventory: physical verification and discrepancies', 'Stock was verified by management at reasonable intervals and differences were recorded in the books.', 'Ready'],
  ['c_loans_given', 'Loans, investments and guarantees given', 'A list of loans, investments, guarantees and security given, with terms and repayment status, is ready.', 'Not applicable'],
  ['c_deposits', 'Deposits accepted from the public', 'Any deposits or amounts treated as deposits are listed with the compliance evidence for each.', 'Not applicable'],
  ['c_dues', 'Statutory dues: deposit and disputes', 'GST, TDS, provident fund, ESI and income tax payments are reconciled, and any dues in dispute are listed with their forum.', 'Partly ready'],
  ['c_borrow', 'Borrowings: repayment defaults and use of funds', 'Lender-wise statements show no default, or defaults are listed; use of short and long term funds is documented.', 'Ready'],
  ['c_related', 'Related party transactions', 'All related party transactions are listed with approvals and disclosure in the accounts.', 'Not started'],
  ['c_fraud', 'Fraud and whistle-blower matters', 'Any fraud noticed or reported during the year, and any whistle-blower complaints, are recorded with action taken.', 'Not started'],
  ['c_internal', 'Internal audit system', 'The internal audit arrangements and reports for the year are available to the auditor.', 'Partly ready'],
  ['c_csr', 'Corporate social responsibility spending', 'Where CSR applies, the required amount, amount spent and any unspent account are documented.', 'Not applicable'],
];
const KEYS = TOPICS.map((t) => t[0]);
const points = { Ready: 2, 'Partly ready': 1, 'Not started': 0 };
const bands = [{ min: 0, label: 'Evidence not ready' }, { min: 60, label: 'Mostly ready' }, { min: 90, label: 'Ready for the auditor' }];

export const CARO_CHECKER = agent({
  slug: 'caro-compliance-checker', name: 'CARO Compliance Checker', category: 'planning',
  does: 'Tracks how ready your evidence is for the main topics an auditor covers under the Companies (Auditor\'s Report) Order, 2020, and lists what is still missing before the audit.',
  whenToUse: 'Use it a month or two before the year-end audit, so the documents the auditor will ask for are collected early instead of in the final week.',
  whenNotToUse: 'Do not use it to decide whether the Order applies to your company, or whether you comply. Only your auditor can confirm both; this sheet tracks your preparation.',
  next: 'Share the sheet with your auditor, ask them to confirm the list of topics for your company, and fill the gaps in order of the audit calendar.',
  summary: 'Most year-end delays come from evidence that was never gathered. A checklist by topic, with a status for each, turns a long auditor request into a short list of owned tasks.',
  caption: 'Four steps from the auditor\'s request list to evidence in hand.',
  howToRead: ['Readiness counts Ready as full, Partly ready as half and Not started as nothing; Not applicable topics are left out.', 'Topics marked Not applicable should be agreed with your auditor.', 'This is preparation progress, not an opinion on compliance.'],
  diagramTitle: 'From the auditor\'s request list to evidence in hand', diagramCaption: 'The auditor decides what applies; you make sure the evidence is ready.',
  steps: [['Confirm the topics', 'With your auditor'], ['Assign owners', 'One role per topic'], ['Collect evidence', 'Documents and lists'], ['Review with the auditor', 'Before year end']],
  sections: [
    sec('company', 'The audit', 'Record the year and who your auditor is.', [
      text('year', 'Financial year', 'The year under audit, so the evidence is filed against the right period.', '2025-26'),
      text('auditor', 'Auditor (firm or role)', 'The audit firm or the role that coordinates with the auditor. Do not enter personal details.', 'Statutory auditor, via the Finance Manager'),
      long('scope_note', 'What your auditor has told you applies', 'Write down which topics the auditor has confirmed apply to your company, so the sheet reflects their advice and not a guess.', 'Auditor confirmed fixed assets, inventory and statutory dues apply; loans given do not.'),
    ]),
    sec('topics', 'Evidence readiness', 'Give each topic its current status.', TOPICS.map(([key, label, help, ex]) => pick(key, label, OPTS, help, ex))),
  ],
  plan: 'evidence gaps',
  derived: [
    { key: 'readiness', label: 'Evidence readiness', help: 'Points earned out of points possible: Ready = 2, Partly ready = 1, Not started = 0. Not applicable topics are left out.', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } },
    { key: 'answered', label: 'Topics with a status', rule: { op: 'answers', fields: KEYS, show: 'progress' } },
  ],
  outputs: [{ key: 'ready', label: 'Readiness for the auditor', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } }],
  analysisGuide: 'State the readiness percentage and band, then list the topics that are Not started or Partly ready and the evidence each still needs. Say clearly that this is preparation progress and not a statement of compliance, and that the applicable topics must be confirmed with the auditor. Highlight topics where a gap could delay the audit most, such as statutory dues reconciliations and related party lists. Check that every Not applicable topic has the auditor\'s agreement. Propose owners by role and dates ahead of the audit calendar, and end with a date to review progress with the auditor.',
  scenario: 'A finance team prepares for its year-end audit. Statuses are fictional and for learning only; the topic list is a working summary to be confirmed by the auditor.',
  values: { year: '2025-26', auditor: 'Statutory auditor, via the Finance Manager', scope_note: 'Auditor confirmed fixed assets, inventory and statutory dues apply; loans given do not.', ...Object.fromEntries(TOPICS.map((t) => [t[0], t[3]])) },
  tables: {},
  actions: [['Compile the related party list with approvals', 'Finance Manager', 'List shared with the auditor'], ['Reconcile statutory dues and list disputes', 'Senior Accountant', 'Reconciliation signed'], ['Confirm the topic list with the auditor', 'Finance Manager', 'Written confirmation received']],
});
