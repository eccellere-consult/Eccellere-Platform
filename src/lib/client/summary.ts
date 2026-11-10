/**
 * Pure helpers for the client's Order detail, Assignments and Assessments screens. No database, no clock of their own.
 * Money is whole rupees. Nothing is invented: a step with no recorded time shows no time.
 */
export interface TimelineStep { event: string; at: Date | null; done: boolean }

/** What can be said truthfully about an order from what is stored: it was placed, and its status says what happened since. */
export function orderTimeline(o: { status: string; createdAt: Date; refundedAt: Date | null }): TimelineStep[] {
  const steps: TimelineStep[] = [{ event: 'Order placed', at: o.createdAt, done: true }];
  const paid = ['PAID', 'REFUND_REQUESTED', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(o.status);
  if (o.status === 'FAILED') steps.push({ event: 'Payment failed', at: null, done: false });
  else if (o.status === 'CANCELLED') steps.push({ event: 'Order cancelled', at: null, done: false });
  else steps.push({ event: paid ? 'Payment received' : 'Waiting for payment', at: null, done: paid });
  if (o.status === 'REFUND_REQUESTED') steps.push({ event: 'Refund requested', at: null, done: true });
  if (o.status === 'REFUNDED' || o.status === 'PARTIALLY_REFUNDED') steps.push({ event: o.status === 'REFUNDED' ? 'Refunded' : 'Partly refunded', at: o.refundedAt, done: true });
  return steps;
}

export const ORDER_STATUS_LABEL: Record<string, string> = { PENDING: 'Pending', PAID: 'Paid', FAILED: 'Failed', REFUND_REQUESTED: 'Refund requested', REFUNDED: 'Refunded', PARTIALLY_REFUNDED: 'Partly refunded', CANCELLED: 'Cancelled' };

/** Share of milestones completed, 0 to 100; null when the assignment has no milestones (never a made-up percentage). */
export function milestoneProgress(milestones: { isCompleted: boolean }[]): number | null {
  if (!milestones.length) return null;
  return Math.round((milestones.filter((m) => m.isCompleted).length / milestones.length) * 100);
}

export type AssignmentGroup = 'in_progress' | 'completed' | 'scheduled' | 'other';
export function groupOfAssignment(status: string): AssignmentGroup {
  if (['ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'UNDER_REVIEW'].includes(status)) return 'in_progress';
  if (status === 'COMPLETED') return 'completed';
  if (['REQUESTED', 'MATCHED'].includes(status)) return 'scheduled';
  return 'other';
}

export interface AssessmentView { id: string; createdAt: Date; sector: string; score: number; max: number; pct: number; level: number; dimensions: { name: string; pct: number }[]; recommendations: string[] }

/** Reads a saved assessment defensively: the stored JSON may be a list or a keyed object, and a shape we do not recognise shows nothing rather than wrong numbers. */
export function toAssessmentView(a: { id: string; createdAt: Date; sector: string; totalScore: number; maxScore: number; maturityLevel: number; dimensionScores: unknown; recommendations: unknown }): AssessmentView {
  const max = a.maxScore > 0 ? a.maxScore : 150;
  const dims: { name: string; pct: number }[] = [];
  const d = a.dimensionScores;
  if (Array.isArray(d)) {
    for (const x of d) { const o = x as { name?: unknown; dimension?: unknown; score?: unknown; max?: unknown }; const name = String(o?.name ?? o?.dimension ?? ''); const s = Number(o?.score); const m = Number(o?.max); if (name && Number.isFinite(s)) dims.push({ name, pct: Number.isFinite(m) && m > 0 ? Math.round((s / m) * 100) : Math.round(s) }); }
  } else if (d && typeof d === 'object') {
    for (const [k, v] of Object.entries(d as Record<string, unknown>)) { const s = Number(v); if (Number.isFinite(s)) dims.push({ name: k.replace(/[_-]+/g, ' '), pct: Math.round(s) }); }
  }
  const r = a.recommendations;
  const recs = Array.isArray(r) ? r.map((x) => (typeof x === 'string' ? x : String((x as { text?: unknown; recommendation?: unknown })?.text ?? (x as { recommendation?: unknown })?.recommendation ?? ''))).filter(Boolean) : [];
  return { id: a.id, createdAt: a.createdAt, sector: a.sector, score: a.totalScore, max, pct: Math.round((a.totalScore / max) * 100), level: a.maturityLevel, dimensions: dims, recommendations: recs };
}
