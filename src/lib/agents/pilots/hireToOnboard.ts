import type { DeclarativeTool, DeclField, Expr } from '@/lib/strategyModels/declarative';
import { actionPlan, f, num, pick, text } from './kit';

/**
 * Hire-to-Onboard: a checklist that shows whether a new joiner will be ready on day one.
 * Method (a fixed rule, nothing estimated by AI): each of eight steps is Done (2 points), In progress (1), Not started (0) or Not applicable (left out).
 * Readiness = points earned / points possible. Days to joining decides whether the gap is urgent.
 */
const OPTIONS = ['Done', 'In progress', 'Not started', 'Not applicable'];
const STEPS: { key: string; label: string; help: string; example: string }[] = [
  { key: 's_offer', label: 'Offer letter signed and returned', help: 'The signed offer is on file, with the agreed joining date and pay.', example: 'Done' },
  { key: 's_docs', label: 'Joining documents collected', help: 'Identity, address, education and previous-employer papers received, with originals seen where required.', example: 'In progress' },
  { key: 's_check', label: 'Background check started', help: 'Employment and address verification sent to the agency or done in-house.', example: 'In progress' },
  { key: 's_contract', label: 'Employment contract and policies issued', help: 'The contract, code of conduct and key policies sent for reading and signature.', example: 'Done' },
  { key: 's_it', label: 'Laptop, email and system access ready', help: 'Equipment ordered and accounts created, so the person can work from the first hour.', example: 'Not started' },
  { key: 's_desk', label: 'Seat, ID card and building access ready', help: 'A workplace, an ID card and entry access are arranged for the joining day.', example: 'Not started' },
  { key: 's_payroll', label: 'Payroll and statutory forms set up', help: 'Bank details, provident fund and insurance forms captured so the first salary is correct.', example: 'In progress' },
  { key: 's_plan', label: 'First-week plan and buddy assigned', help: 'A named manager and buddy, and a plan for the first five days with the people to meet.', example: 'Not started' },
];
const KEYS = STEPS.map((s) => s.key);
const points = { Done: 2, 'In progress': 1, 'Not started': 0 };
const bands = [{ min: 0, label: 'Not ready for day one' }, { min: 60, label: 'Nearly ready' }, { min: 90, label: 'Ready for day one' }];
const days: Expr = f('days_to_join');

const stepField = (s: (typeof STEPS)[number]): DeclField => pick(s.key, s.label, OPTIONS, s.help, s.example);

export const HIRE_TO_ONBOARD: DeclarativeTool = {
  schema: 1,
  slug: 'hire-to-onboard-agent',
  name: 'Hire-to-Onboard',
  category: 'planning',
  does: 'Tracks the eight steps between an accepted offer and a ready first day, works out how prepared the new joiner\'s onboarding is, and flags when the joining date is too close for what remains.',
  whenToUse: 'Use it for every new hire from the day the offer is accepted, and review it a week before joining so nothing is left for the joiner\'s first morning.',
  whenNotToUse: 'Do not use it to judge the hire or the manager. It tracks preparation only. For senior or regulated roles, add the extra checks your policy needs.',
  next: 'Once ready, hand over the first-week plan to the manager; after the first month, collect feedback from the joiner to improve this checklist.',
  reference: {
    originator: '',
    year: '',
    summary: 'Most onboarding failures are preparation failures: no laptop, no access, a wrong first salary. A short checklist with a clear status per step, reviewed against the joining date, removes most of them.',
    caption: 'Four stages from an accepted offer to a productive first week.',
    howToRead: [
      'Readiness counts Done as full, In progress as half and Not started as nothing; Not applicable steps are left out.',
      'Compare readiness with the days left: a low score with weeks to go is fine, a low score with days to go is urgent.',
      'Anything Not started with fewer than seven days left needs an owner today.',
    ],
  },
  diagram: {
    template: 'steps',
    title: 'From accepted offer to productive first week',
    steps: [
      { name: 'Offer accepted', hint: 'Signed, joining date fixed' },
      { name: 'Paperwork and checks', hint: 'Documents, background, contract' },
      { name: 'Set up to work', hint: 'Equipment, access, payroll' },
      { name: 'Welcome', hint: 'Plan, buddy, first week' },
    ],
    caption: 'Preparation is finished before the joining day, not on it.',
  },
  sections: [
    {
      key: 'joiner', title: 'The new joiner', summary: 'Record the role and how long is left.',
      parts: [
        text('role', 'Role being filled', 'The job title and team, so the right equipment and access are prepared.', 'Accounts Executive, Finance team'),
        text('manager', 'Reporting manager (role)', 'The role of the manager who will receive the joiner. Use a role, not a personal name.', 'Finance Manager'),
        num('days_to_join', 'Days until joining', 'days', 'How many days remain until the joining date. This decides how urgent any gap is.', '12'),
      ],
    },
    { key: 'steps', title: 'Onboarding steps', summary: 'Give each step its current status.', parts: STEPS.map(stepField) },
    actionPlan('open steps'),
  ],
  derived: [
    { key: 'readiness', label: 'Onboarding readiness', help: 'Points earned out of points possible: Done = 2, In progress = 1, Not started = 0. Not applicable steps are left out.', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } },
    { key: 'answered', label: 'Steps with a status', rule: { op: 'answers', fields: KEYS, show: 'progress' } },
    { key: 'urgency', label: 'Time pressure', help: 'Urgent when fewer than seven days remain before joining.', rule: { op: 'when', expr: days, lt: 7, then: 'Urgent: fewer than seven days left', else: 'Enough time if owners are named', tones: { then: 'bad', else: 'good' } } },
  ],
  outputs: [
    { key: 'ready', label: 'Readiness for day one', rule: { op: 'answers', fields: KEYS, show: 'score', points, exclude: ['Not applicable'], bands } },
    { key: 'timing', label: 'Time pressure', rule: { op: 'when', expr: days, lt: 7, then: 'Urgent: fewer than seven days left', else: 'Enough time if owners are named', tones: { then: 'bad', else: 'good' } } },
  ],
  analysisGuide: 'State the readiness percentage and its band, set against the days left to joining. List every step that is Not started first, then those In progress, and give each one an owner by role and a date earlier than the joining date. Give particular attention to equipment, system access and payroll set-up, because these cause the most visible day-one failures and the slowest to fix. If fewer than seven days remain and any of those three is Not started, recommend escalating to the manager today. Confirm that Not applicable steps are genuinely not needed. End with what the joiner will experience in their first week if the plan is followed, and who checks in with them on day one.',
  sample: {
    scenario: 'A finance team is preparing for an Accounts Executive joining in twelve days. The role and details are fictional and for learning only.',
    values: {
      role: 'Accounts Executive, Finance team', manager: 'Finance Manager', days_to_join: '12',
      s_offer: 'Done', s_docs: 'In progress', s_check: 'In progress', s_contract: 'Done', s_it: 'Not started', s_desk: 'Not started', s_payroll: 'In progress', s_plan: 'Not started',
    },
    tables: {
      actions: [
        { action: 'Order the laptop and request email and accounting-system access', owner: 'IT Support Lead', measure: 'Access tested before joining', horizon: '30 days' },
        { action: 'Collect remaining joining documents and bank details', owner: 'HR Executive', measure: 'All documents on file', horizon: '30 days' },
        { action: 'Write the first-week plan and name a buddy', owner: 'Finance Manager', measure: 'Plan shared with the joiner', horizon: '30 days' },
      ],
    },
  },
};
