import { describe, expect, it } from 'vitest';
import { interpret, qualityGate, sampleOf, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import { standardsCheck } from '@/lib/tools/standards';
import { LEAD_TO_QUOTE } from '@/lib/agents/pilots/leadToQuote';
import { COLLECTIONS } from '@/lib/agents/pilots/collectionsFollowUp';
import { PRODUCTION_SCHEDULER } from '@/lib/agents/pilots/productionScheduler';
import { OTIF_TRACKER } from '@/lib/agents/pilots/otifTracker';
import { PO_INVOICE_MATCHER } from '@/lib/agents/pilots/poInvoiceMatcher';
import { SUPPLIER_RISK_MONITOR } from '@/lib/agents/pilots/supplierRiskMonitor';
import { CLOSE_THE_BOOKS } from '@/lib/agents/pilots/closeTheBooks';
import { CARO_CHECKER } from '@/lib/agents/pilots/caroChecker';
import { MIS_REPORT } from '@/lib/agents/pilots/misReport';
import { ATTENDANCE_PAYROLL } from '@/lib/agents/pilots/attendancePayroll';
import { EXIT_INTERVIEW } from '@/lib/agents/pilots/exitInterview';

type Col = { key: string; compute?: (r: Record<string, string>, v: never) => string };
function harness(tool: DeclarativeTool, override: Record<string, string> = {}) {
  const def = interpret(tool);
  const sample = sampleOf(tool)!;
  const v = { fields: { ...sample.values, ...override }, tables: sample.tables } as never;
  const cell = (tableKey: string, row: number, key: string): string => {
    const t = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'table' && p.key === tableKey) as unknown as { columns: Col[] };
    return t.columns.find((c) => c.key === key)!.compute!((sample.tables[tableKey] as Record<string, string>[])[row], v);
  };
  const out = (key: string) => String(def.outputs!.find((o) => o.key === key)!.compute(v));
  const der = (key: string) => String(def.derived!.find((d) => d.key === key)!.compute(v));
  return { cell, out, der };
}
const num = (s: string) => Number(s.replace(/[^0-9.\-]/g, ''));

const ALL: [string, DeclarativeTool][] = [
  ['Lead-to-Quote', LEAD_TO_QUOTE], ['Collections Follow-up', COLLECTIONS], ['Production Scheduler', PRODUCTION_SCHEDULER], ['OTIF Tracker', OTIF_TRACKER],
  ['PO-Invoice Matcher', PO_INVOICE_MATCHER], ['Supplier Risk Monitor', SUPPLIER_RISK_MONITOR], ['Close-the-Books', CLOSE_THE_BOOKS], ['CARO Checker', CARO_CHECKER],
  ['MIS Report', MIS_REPORT], ['Attendance-Payroll', ATTENDANCE_PAYROLL], ['Exit Interview', EXIT_INTERVIEW],
];

describe.each(ALL)('%s: passes the platform checks', (_n, tool) => {
  it('has no quality-gate blockers', () => { expect(qualityGate(tool).blockers).toEqual([]); });
  it('meets the Eccellere standards for publication', () => { expect(standardsCheck(tool).score).toBeGreaterThanOrEqual(90); });
  it('ends with the standard action plan', () => { expect(tool.sections.at(-1)!.key).toBe('plan'); });
});

describe('Lead-to-Quote: hand-worked margin', () => {
  const h = harness(LEAD_TO_QUOTE);
  it('line totals and costs', () => {
    expect(num(h.cell('lines', 0, 'line_total'))).toBe(40000);
    expect(num(h.cell('lines', 1, 'line_cost'))).toBe(6000);
  });
  it('subtotal 50,000; after 5 percent discount 47,500; cost 34,000; margin 28.4 percent', () => {
    expect(num(h.der('subtotal'))).toBe(50000);
    expect(num(h.der('net_total'))).toBe(47500);
    expect(num(h.der('total_cost'))).toBe(34000);
    expect(num(h.out('margin'))).toBeCloseTo(28.4, 1);
    expect(h.out('floor_check')).toContain('At or above');
  });
  it('flags a quote below the floor', () => { expect(harness(LEAD_TO_QUOTE, { floor_pct: '30' }).out('floor_check')).toContain('Below floor'); });
});

describe('Collections Follow-up: hand-worked priority', () => {
  const h = harness(COLLECTIONS);
  it('priority = amount x days; share of 220,000 total', () => {
    expect(num(h.cell('invoices', 0, 'priority'))).toBe(120000 * 45);
    expect(num(h.cell('invoices', 0, 'share'))).toBeCloseTo(54.5, 1);
    expect(num(h.der('total_overdue'))).toBe(220000);
    expect(num(h.der('oldest'))).toBe(70);
  });
  it('escalates only past the escalation point; calls Mehta Traders first', () => {
    expect(h.cell('invoices', 0, 'step')).toBe('Escalate');
    expect(h.cell('invoices', 1, 'step')).toBe('Reminder');
    expect(h.out('call_first')).toContain('Mehta Traders');
  });
});

describe('Production Scheduler: hand-worked load', () => {
  const h = harness(PRODUCTION_SCHEDULER);
  it('load = hours / (16 x days)', () => {
    expect(num(h.cell('jobs', 0, 'load'))).toBeCloseTo(40 / 48 * 100, 0);
    expect(num(h.cell('jobs', 1, 'load'))).toBeCloseTo(150, 0);
  });
  it('flags the job that cannot be met, and works out total days (94 hours / 16)', () => {
    expect(h.cell('jobs', 1, 'verdict')).toContain('No');
    expect(h.cell('jobs', 0, 'verdict')).toBe('Yes');
    expect(num(h.der('days_needed'))).toBeCloseTo(5.9, 1);
    expect(h.out('tightest')).toContain('brackets');
  });
});

describe('OTIF Tracker: hand-worked rates', () => {
  const h = harness(OTIF_TRACKER);
  it('each order is tested for in full and on time', () => {
    expect([0, 1, 2, 3].map((i) => num(h.cell('orders', i, 'in_full')))).toEqual([1, 0, 1, 1]);
    expect([0, 1, 2, 3].map((i) => num(h.cell('orders', i, 'on_time')))).toEqual([1, 1, 0, 1]);
    expect([0, 1, 2, 3].map((i) => num(h.cell('orders', i, 'otif')))).toEqual([1, 0, 0, 1]);
  });
  it('OTIF 2 of 4 = 50 percent; on time and in full 75 percent each', () => {
    expect(num(h.out('otif_pct'))).toBe(50);
    expect(num(h.der('ontime_pct'))).toBe(75);
    expect(num(h.der('infull_pct'))).toBe(75);
  });
});

describe('PO-Invoice Matcher: hand-worked variance', () => {
  const h = harness(PO_INVOICE_MATCHER);
  it('values and variance', () => {
    expect(num(h.cell('lines', 1, 'po_value'))).toBe(10000);
    expect(num(h.cell('lines', 1, 'inv_value'))).toBe(11500);
    expect(num(h.cell('lines', 1, 'variance'))).toBe(1500);
    expect(num(h.cell('lines', 2, 'variance'))).toBe(150);
  });
  it('2 percent tolerance: line 1 matches, lines 2 and 3 are queried', () => {
    expect(h.cell('lines', 0, 'status')).toBe('Within tolerance');
    expect(h.cell('lines', 1, 'status')).toBe('Query');
    expect(h.cell('lines', 2, 'status')).toBe('Query'); // 150 > 2% of 3,000 = 60
  });
  it('totals and largest overcharge', () => {
    expect(num(h.der('net_variance'))).toBe(1650);
    expect(h.out('largest')).toContain('divider');
  });
});

describe('Supplier Risk Monitor: hand-worked exposure', () => {
  const h = harness(SUPPLIER_RISK_MONITOR);
  it('risk score is the average of four ratings; share is of total spend 1,000,000', () => {
    expect(num(h.cell('suppliers', 0, 'score'))).toBeCloseTo(2.75, 2);
    expect(num(h.cell('suppliers', 1, 'score'))).toBeCloseTo(4, 2);
    expect(num(h.cell('suppliers', 0, 'share'))).toBeCloseTo(60, 1);
  });
  it('exposure = score x share; the supplier with most exposure differs from the riskiest', () => {
    expect(num(h.cell('suppliers', 0, 'exposure'))).toBeCloseTo(165, 1);
    expect(num(h.cell('suppliers', 1, 'exposure'))).toBeCloseTo(120, 1);
    expect(h.out('top_exposure')).toContain('Shree');
    expect(h.out('top_score')).toContain('Apex');
  });
});

describe('Close-the-Books: hand-worked readiness', () => {
  const h = harness(CLOSE_THE_BOOKS);
  it('3 done + 2 in progress + 5 not started = 8 of 20 points = 40 percent', () => { expect(h.out('ready')).toContain('40'); });
  it('flags time pressure only under three days', () => {
    expect(harness(CLOSE_THE_BOOKS, { days_left: '2' }).out('timing')).toContain('Urgent');
    expect(harness(CLOSE_THE_BOOKS, { days_left: '5' }).out('timing')).toContain('Enough time');
  });
});

describe('CARO Checker: hand-worked readiness', () => {
  it('2 ready + 3 partly ready + 2 not started, 3 not applicable = 7 of 14 points = 50 percent', () => {
    expect(harness(CARO_CHECKER).out('ready')).toContain('50');
  });
  it('says plainly that it is not a compliance opinion', () => {
    expect(CARO_CHECKER.whenNotToUse).toMatch(/only your auditor/i);
  });
});

describe('MIS Report: hand-worked variance', () => {
  const h = harness(MIS_REPORT);
  it('variance percent against budget', () => {
    expect(num(h.cell('measures', 0, 'var_pct'))).toBeCloseTo(-10, 1);
    expect(num(h.cell('measures', 1, 'var_pct'))).toBeCloseTo(5, 1);
    expect(num(h.cell('measures', 2, 'var_pct'))).toBeCloseTo(-11.1, 1);
  });
  it('direction decides favourable or adverse: lower cost days are good, higher cost is bad', () => {
    expect(h.cell('measures', 0, 'call')).toBe('Adverse');
    expect(h.cell('measures', 1, 'call')).toBe('Adverse');
    expect(h.cell('measures', 2, 'call')).toBe('Favourable');
    expect(h.out('worst')).toContain('Revenue');
  });
});

describe('Attendance-Payroll Reconciler: hand-worked differences', () => {
  const h = harness(ATTENDANCE_PAYROLL);
  it('days that should be paid and the difference', () => {
    expect([0, 1, 2, 3].map((i) => num(h.cell('employees', i, 'expected')))).toEqual([31, 29, 31, 29]);
    expect([0, 1, 2, 3].map((i) => num(h.cell('employees', i, 'diff')))).toEqual([0, 2, 0, -1]);
  });
  it('flags mismatches in either direction and ranks the largest', () => {
    expect([0, 1, 2, 3].map((i) => h.cell('employees', i, 'flag'))).toEqual(['Matches', 'Mismatch', 'Matches', 'Mismatch']);
    expect(h.out('largest')).toContain('E102');
    expect(num(h.der('days_gap'))).toBe(3);
    expect(num(h.der('net_days'))).toBe(1);
  });
});

describe('Exit Interview Analyzer: hand-worked shares and cost', () => {
  const h = harness(EXIT_INTERVIEW);
  it('25 leavers; career growth is 40 percent; 6 of 10 regretted', () => {
    expect(num(h.der('total_leavers'))).toBe(25);
    expect(num(h.cell('reasons', 0, 'share'))).toBe(40);
    expect(num(h.cell('reasons', 0, 'regret_pct'))).toBe(60);
  });
  it('cost = leavers x 150,000; total 3,750,000', () => {
    expect(num(h.cell('reasons', 0, 'cost'))).toBe(1500000);
    expect(num(h.der('total_cost'))).toBe(3750000);
  });
  it('the most common reason and the most regretted reason are both Career growth here', () => {
    expect(h.out('top_reason')).toContain('Career growth');
    expect(h.out('top_regret')).toContain('Career growth');
  });
});
