import { describe, expect, it } from 'vitest';
import { orderTimeline, milestoneProgress, groupOfAssignment, toAssessmentView } from '@/lib/client/summary';
import { auditWhere, auditPage } from '@/lib/admin/auditLog';

const t = new Date('2026-11-01T10:00:00Z');

describe('order timeline', () => {
  it('a paid order shows placed then payment received, with no invented times', () => {
    const s = orderTimeline({ status: 'PAID', createdAt: t, refundedAt: null });
    expect(s.map((x) => x.event)).toEqual(['Order placed', 'Payment received']);
    expect(s.every((x) => x.done)).toBe(true);
    expect(s[1].at).toBeNull();
  });
  it('a pending order is still waiting for payment', () => {
    const s = orderTimeline({ status: 'PENDING', createdAt: t, refundedAt: null });
    expect(s[1]).toMatchObject({ event: 'Waiting for payment', done: false });
  });
  it('failed and refunded orders say so', () => {
    expect(orderTimeline({ status: 'FAILED', createdAt: t, refundedAt: null })[1].event).toBe('Payment failed');
    const r = orderTimeline({ status: 'REFUNDED', createdAt: t, refundedAt: new Date('2026-11-05T00:00:00Z') });
    expect(r.at(-1)).toMatchObject({ event: 'Refunded', done: true });
  });
});

describe('assignments', () => {
  it('milestone progress is the share completed, and null with no milestones', () => {
    expect(milestoneProgress([{ isCompleted: true }, { isCompleted: false }, { isCompleted: true }, { isCompleted: false }])).toBe(50);
    expect(milestoneProgress([])).toBeNull();
  });
  it('groups statuses for the filters', () => {
    expect(groupOfAssignment('IN_PROGRESS')).toBe('in_progress');
    expect(groupOfAssignment('COMPLETED')).toBe('completed');
    expect(groupOfAssignment('REQUESTED')).toBe('scheduled');
    expect(groupOfAssignment('CANCELLED')).toBe('other');
  });
});

describe('assessments', () => {
  const base = { id: 'a', createdAt: t, sector: 'Manufacturing', totalScore: 90, maxScore: 150, maturityLevel: 3, recommendations: ['Do x', { text: 'Do y' }, ''] };
  it('turns the score into a percentage of the maximum and reads list-shaped dimensions', () => {
    const v = toAssessmentView({ ...base, dimensionScores: [{ name: 'Data', score: 15, max: 30 }, { dimension: 'People', score: 80 }] });
    expect(v.pct).toBe(60);
    expect(v.dimensions).toEqual([{ name: 'Data', pct: 50 }, { name: 'People', pct: 80 }]);
    expect(v.recommendations).toEqual(['Do x', 'Do y']);
  });
  it('reads keyed dimensions and survives a shape it does not know', () => {
    expect(toAssessmentView({ ...base, dimensionScores: { data_quality: 70 } }).dimensions).toEqual([{ name: 'data quality', pct: 70 }]);
    expect(toAssessmentView({ ...base, dimensionScores: 'junk', recommendations: null }).dimensions).toEqual([]);
  });
  it('falls back to 150 when the stored maximum is zero', () => { expect(toAssessmentView({ ...base, maxScore: 0, dimensionScores: [] }).pct).toBe(60); });
});

describe('audit log filters', () => {
  it('no filters means no restriction', () => { expect(auditWhere({})).toEqual({}); });
  it('combines the search text, item type and action', () => {
    const w = auditWhere({ q: ' toolkit ', entityType: 'Asset', action: 'toolkit_made_online' }) as { AND: unknown[] };
    expect(w.AND).toHaveLength(3);
    expect(JSON.stringify(w)).toContain('"contains":"toolkit"');
  });
  it('pages are whole numbers from 1, and nonsense becomes page 1', () => {
    expect([auditPage(3), auditPage('2'), auditPage(0), auditPage(-4), auditPage('abc'), auditPage(1.9)]).toEqual([3, 2, 1, 1, 1, 1]);
  });
});
