import type { DeclarativeTool, DeclField } from '@/lib/strategyModels/declarative';
import { actionPlan, long, pick, text } from './kit';

/**
 * Vendor Onboarding: a checklist that decides whether a new supplier is ready to be paid and used.
 * Method (a fixed rule, nothing estimated by AI): each of seven documents is Received and checked (2 points), Received but not checked (1),
 * Requested (0) or Not applicable (left out). Readiness = points earned / points possible. Four risk questions are counted as Yes.
 */
const DOC_OPTIONS = ['Received and checked', 'Received, not checked', 'Requested', 'Not applicable'];
const DOCS: { key: string; label: string; help: string; example: string }[] = [
  { key: 'doc_pan', label: 'PAN card', help: 'The permanent account number document in the vendor\'s name, matched to the name on their invoices.', example: 'Received and checked' },
  { key: 'doc_gst', label: 'GST registration', help: 'The GST certificate, if the vendor is registered. Mark Not applicable only when they are below the registration limit.', example: 'Received and checked' },
  { key: 'doc_bank', label: 'Bank proof', help: 'A cancelled cheque or bank letter showing the account name and number, checked against the name on the vendor record.', example: 'Received and checked' },
  { key: 'doc_msme', label: 'MSME (Udyam) certificate', help: 'Needed to apply the 45-day payment rule for micro and small suppliers. Not applicable if the vendor is not an MSME.', example: 'Not applicable' },
  { key: 'doc_contract', label: 'Signed contract or purchase terms', help: 'The agreed terms, price list and payment days, signed by both sides.', example: 'Received, not checked' },
  { key: 'doc_kyc', label: 'Owner identity and address proof', help: 'Identity and address proof of the proprietor or directors, to confirm the vendor is a real, reachable business.', example: 'Received and checked' },
  { key: 'doc_ref', label: 'Trade references', help: 'Names of two customers who can confirm the vendor delivers, with a note of who was called.', example: 'Requested' },
];
const RISKS: { key: string; label: string; help: string; example: string }[] = [
  { key: 'risk_single', label: 'Is this vendor our only source for what they supply?', help: 'Yes means a failure would stop your work, so you need a back-up plan.', example: 'No' },
  { key: 'risk_advance', label: 'Do they want payment in advance?', help: 'Yes means you carry the risk of non-delivery. Ask for a smaller advance or a bank guarantee.', example: 'No' },
  { key: 'risk_data', label: 'Will they handle our customer data or premises?', help: 'Yes means a confidentiality clause and a security check are needed before they start.', example: 'Yes' },
  { key: 'risk_new', label: 'Is the vendor under two years old or unknown to you?', help: 'Yes means more checking is wise: references, a small first order, and no large advance.', example: 'Yes' },
];

const docField = (d: (typeof DOCS)[number]): DeclField => pick(d.key, d.label, DOC_OPTIONS, d.help, d.example);
const riskField = (r: (typeof RISKS)[number]): DeclField => pick(r.key, r.label, ['Yes', 'No'], r.help, r.example);

export const VENDOR_ONBOARDING: DeclarativeTool = {
  schema: 1,
  slug: 'vendor-onboarding-agent',
  name: 'Vendor Onboarding',
  category: 'analytical',
  does: 'Walks through the documents and risk questions needed before a new supplier is paid, works out how ready the vendor file is, and lists what is still missing.',
  whenToUse: 'Use it each time a new supplier is added, and again when an existing supplier changes bank account or name, so that payments only go to checked vendors.',
  whenNotToUse: 'Do not use it as a substitute for legal due diligence on a large or strategic contract. It checks the file is complete; it does not judge the vendor\'s quality or finances.',
  next: 'Once readiness is high, add the vendor to the payment system, and watch the vendor in the Supplier Risk Monitor if any risk answer is Yes.',
  reference: {
    originator: '',
    year: '',
    summary: 'A vendor file is ready when each required document is both received and checked. Counting checked documents, not just received ones, is what catches fake bank details and duplicate vendors before money moves.',
    caption: 'Four steps from a new supplier to a vendor that is safe to pay.',
    howToRead: [
      'Readiness is points earned out of points possible; Not applicable documents are left out of both.',
      'A document that is received but not checked earns only half the points, because an unchecked document protects nothing.',
      'Read the risk answers separately: a vendor can have a complete file and still be a concentration or data risk.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From a new supplier to a vendor safe to pay',
    steps: [
      { name: 'Record the vendor', hint: 'Name, what they supply' },
      { name: 'Collect documents', hint: 'Seven standard items' },
      { name: 'Check and answer risks', hint: 'Verify, then four questions' },
      { name: 'Close the gaps', hint: 'Owner and date for each' },
    ],
    caption: 'A document counts fully only when someone has checked it against another source.',
  },
  sections: [
    {
      key: 'vendor', title: 'Vendor details', summary: 'Record who the vendor is and what they will supply.',
      parts: [
        text('vendor_name', 'Vendor name', 'The legal name exactly as on their PAN and invoices, so the payment system holds one clean record.', 'Shree Packaging Works'),
        text('supplies', 'What they will supply', 'Describe the goods or services in a few words, so the right level of checking is applied.', 'Corrugated boxes for dispatch'),
        text('expected_value', 'Expected yearly spend', 'Give your best estimate in rupees with a word of context. It guides how much checking is proportionate.', 'About 12 lakh rupees a year'),
        long('notes', 'Anything else worth recording', 'Add context a later reader would need, such as how the vendor was found or who recommended them.', 'Recommended by the plant manager after a trial order.'),
      ],
    },
    {
      key: 'documents', title: 'Documents', summary: 'For each document, say whether it is received and checked.',
      parts: DOCS.map(docField),
    },
    {
      key: 'risks', title: 'Risk questions', summary: 'Answer four Yes or No questions about the relationship.',
      parts: RISKS.map(riskField),
    },
    actionPlan('missing items'),
  ],
  derived: [
    { key: 'readiness', label: 'Vendor file readiness', help: 'Points earned out of points possible: checked = 2, received but not checked = 1, requested = 0. Not applicable items are left out.', rule: { op: 'answers', fields: DOCS.map((d) => d.key), show: 'score', points: { 'Received and checked': 2, 'Received, not checked': 1, Requested: 0 }, exclude: ['Not applicable'], bands: [{ min: 0, label: 'Not ready to pay' }, { min: 60, label: 'Nearly ready' }, { min: 90, label: 'Ready to pay' }] } },
    { key: 'risk_yes', label: 'Risk questions answered Yes', help: 'How many of the four risk questions are Yes.', rule: { op: 'answers', fields: RISKS.map((r) => r.key), show: 'yes' } },
    { key: 'answered', label: 'Documents answered', rule: { op: 'answers', fields: DOCS.map((d) => d.key), show: 'progress' } },
  ],
  outputs: [
    { key: 'ready', label: 'File readiness', rule: { op: 'answers', fields: DOCS.map((d) => d.key), show: 'score', points: { 'Received and checked': 2, 'Received, not checked': 1, Requested: 0 }, exclude: ['Not applicable'], bands: [{ min: 0, label: 'Not ready to pay' }, { min: 60, label: 'Nearly ready' }, { min: 90, label: 'Ready to pay' }] } },
    { key: 'risks', label: 'Risk questions answered Yes', rule: { op: 'answers', fields: RISKS.map((r) => r.key), show: 'yes' } },
  ],
  analysisGuide: 'State the readiness percentage and its band, then list every document that is requested or not yet checked, with the one action that would close it. Do not release payment to a vendor in the Not ready band. Then read the risk answers: each Yes calls for a named protection, such as a back-up supplier for a sole source, a bank guarantee for an advance, a confidentiality clause for data, or a small first order for a new vendor. Note any document marked Not applicable and confirm the reason is sound, because it is the easiest way to skip a check. End with who will verify the bank account independently, by a call to a number you already hold, before the first payment.',
  sample: {
    scenario: 'A packaging supplier is being added by a manufacturing company. The vendor and figures are fictional and for learning only.',
    values: {
      vendor_name: 'Shree Packaging Works', supplies: 'Corrugated boxes for dispatch', expected_value: 'About 12 lakh rupees a year', notes: 'Recommended by the plant manager after a trial order.',
      doc_pan: 'Received and checked', doc_gst: 'Received and checked', doc_bank: 'Received and checked', doc_msme: 'Not applicable', doc_contract: 'Received, not checked', doc_kyc: 'Received and checked', doc_ref: 'Requested',
      risk_single: 'No', risk_advance: 'No', risk_data: 'Yes', risk_new: 'Yes',
    },
    tables: {
      actions: [
        { action: 'Check the signed contract against the agreed price list', owner: 'Procurement Manager', measure: 'Contract marked checked', horizon: '30 days' },
        { action: 'Call two trade references and note the answers', owner: 'Procurement Executive', measure: 'Two references recorded', horizon: '30 days' },
        { action: 'Confirm the bank account by calling a number already held', owner: 'Accounts Payable Lead', measure: 'Bank detail verified before first payment', horizon: '30 days' },
      ],
    },
  },
};
