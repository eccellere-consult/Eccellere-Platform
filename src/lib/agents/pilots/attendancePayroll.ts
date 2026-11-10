import type { Expr } from '@/lib/strategyModels/declarative';
import { agent, c, cc, cn, ct, num, sec, tbl, text, long } from './kit';

/**
 * Attendance-Payroll Reconciler: compares the days an employee was present or on approved leave with the days paid in payroll.
 * Method (fixed formula): days that should be paid = days present + approved paid leave days.
 *   difference = days paid in payroll - days that should be paid (positive = paid for more days than recorded).
 * Employees are identified by code, never by name.
 */
const expected: Expr = { add: [c('present'), c('leave')] };
const diff: Expr = { sub: [c('paid'), expected] };

export const ATTENDANCE_PAYROLL = agent({
  slug: 'attendance-payroll-reconciler', name: 'Attendance-Payroll Reconciler', category: 'analytical',
  does: 'Compares each employee\'s recorded attendance and approved leave with the days paid in payroll, and lists the employees whose pay does not match before salaries are released.',
  whenToUse: 'Use it every month after attendance is locked and before payroll is approved, so overpayments and underpayments are fixed before money moves.',
  whenNotToUse: 'Do not use it to calculate salary, tax or statutory deductions, or to decide on disciplinary action. It compares days only.',
  next: 'Resolve each mismatch with the attendance owner, correct the record or the payroll input, and rerun until only explained differences remain.',
  summary: 'Most payroll errors are day-count errors: leave not netted, late joiners paid in full, absences missed. Comparing days recorded with days paid finds them cheaply and early.',
  caption: 'Four steps from locked attendance to approved payroll.',
  howToRead: ['Days that should be paid is days present plus approved paid leave.', 'A positive difference means paid for more days than recorded; negative means paid for fewer.', 'Only employees with a difference need attention.'],
  diagramTitle: 'From locked attendance to approved payroll', diagramCaption: 'Differences are fixed at the source, before the payroll is approved and paid.',
  steps: [['Lock attendance', 'Present and leave days'], ['List payroll days', 'Days paid per employee'], ['Compare', 'Difference per employee'], ['Resolve and approve', 'Fix then release']],
  sections: [
    sec('month', 'The payroll month', 'Record the month and its length.', [
      text('month', 'Payroll month', 'The month this payroll covers.', 'October'),
      num('days_in_month', 'Paid days in the month', 'days', 'The number of days the payroll treats as payable for a full month, for reference when checking differences.', '31'),
      text('approver', 'Who approves payroll (role)', 'The role that approves the payroll once mismatches are cleared, so the sheet has an accountable owner.', 'HR Manager'),
      long('policy', 'Pay rules that matter', 'Note rules that affect days, such as how weekly offs, holidays and half days are counted.', 'Weekly offs and company holidays are paid; half days count as 0.5.'),
    ]),
    sec('employees', 'Employees', 'List each employee by code with days present, leave and days paid.', [
      tbl('employees', 'Employees', 'Employee', 'One row per employee, by code and never by name. Enter days present, approved paid leave days, and the days paid in the payroll file.', [
        ct('code', 'Employee code', 'The employee\'s code. Do not enter names.'),
        cn('present', 'Days present', 'Days the attendance record shows as present, including weekly offs and holidays you pay.', 'days'),
        cn('leave', 'Approved paid leave', 'Days of approved paid leave in the month.', 'days'),
        cn('paid', 'Days paid in payroll', 'Days payroll is paying for this employee.', 'days'),
        cc('expected', 'Days that should be paid', 'Worked out: days present plus approved paid leave.', { op: 'calc', expr: expected, format: 'dp1' }),
        cc('diff', 'Difference', 'Worked out: days paid minus days that should be paid.', { op: 'calc', expr: diff, format: 'dp1' }),
        cc('gap', 'Size of difference', 'Worked out: the difference without its sign, used to rank.', { op: 'calc', expr: { abs: diff }, format: 'dp1' }),
        cc('flag', 'Check', 'Worked out: Matches when the difference is zero, otherwise Mismatch.', { op: 'when', expr: { abs: diff }, gt: 0, then: 'Mismatch', else: 'Matches', tones: { then: 'bad', else: 'good' } }),
      ], 3, 500),
    ]),
  ],
  plan: 'payroll mismatches',
  derived: [
    { key: 'count', label: 'Employees checked', rule: { op: 'calc', expr: { agg: 'count', table: 'employees', col: 'code' }, format: 'int' } },
    { key: 'net_days', label: 'Net days difference (paid minus recorded)', rule: { op: 'calc', expr: { agg: 'sum', table: 'employees', col: 'diff' }, format: 'dp1' } },
    { key: 'days_gap', label: 'Total days in mismatch (any direction)', rule: { op: 'calc', expr: { agg: 'sum', table: 'employees', col: 'gap' }, format: 'dp1' } },
  ],
  outputs: [{ key: 'largest', label: 'Largest mismatch', rule: { op: 'top', table: 'employees', by: 'gap', label: 'code' } }],
  analysisGuide: 'State how many employees were checked, how many do not match, and the largest mismatch. Separate overpayments (positive) from underpayments (negative), because an underpayment is a staff-relations problem and an overpayment is a recovery problem. Do not guess the cause: list the likely causes to check, such as leave not netted, a joining or leaving date, or a half day. Remind the reader to protect privacy by working with codes. Recommend that payroll is approved only after each mismatch is explained, with an owner by role and a date.',
  scenario: 'A payroll team checks four employees by code. Codes and days are fictional and for learning only.',
  values: { month: 'October', days_in_month: '31', approver: 'HR Manager', policy: 'Weekly offs and company holidays are paid; half days count as 0.5.' },
  tables: { employees: [{ code: 'E101', present: '29', leave: '2', paid: '31' }, { code: 'E102', present: '28', leave: '1', paid: '31' }, { code: 'E103', present: '31', leave: '0', paid: '31' }, { code: 'E104', present: '26', leave: '3', paid: '28' }] },
  actions: [['Check E102 and E104 attendance with the supervisor', 'HR Executive', 'Both records explained or corrected'], ['Correct the payroll input for any confirmed errors', 'Payroll Executive', 'Corrected payroll file'], ['Approve payroll after mismatches are cleared', 'HR Manager', 'Payroll approved']],
});
