/**
 * Small, pure helpers for the admin Dashboard and Finance screens: rupee formatting, month buckets, percentage change and
 * "time ago". No database and no clock of their own (the caller passes `now`), so every one of them is tested with fixed dates.
 * Money in this platform is stored in whole rupees.
 */

export const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

export interface MonthBucket { key: string; label: string; value: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** The last `months` calendar months (UTC), oldest first, each with the sum of the amounts dated inside it. Months with no sales show 0. */
export function monthBuckets(rows: { at: Date; amount: number }[], now: Date, months: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({ key: monthKey(d), label: MONTHS[d.getUTCMonth()], value: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const r of rows) { const b = byKey.get(monthKey(r.at)); if (b) b.value += r.amount; }
  return buckets;
}

/** "+12.4%" / "-3.0%", or null when there is no earlier figure to compare with (never a made-up percentage). */
export function pctChange(current: number, previous: number): string | null {
  if (!(previous > 0)) return null;
  const p = ((current - previous) / previous) * 100;
  return `${p >= 0 ? '+' : '-'}${Math.abs(p).toFixed(1)}%`;
}

export function ago(then: Date, now: Date): string {
  const s = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : then.toISOString().slice(0, 10);
}

/** A plain-words line for an audit-log row, so the dashboard reads like news, not like a database. */
export function describeAudit(action: string, entityType: string, entityId: string): { action: string; detail: string } {
  const known: Record<string, string> = {
    toolkit_made_online: 'Toolkit made online (no AI)',
    toolkit_made_online_with_ai: 'Toolkit made online with AI',
    user_role_changed: 'User role changed',
    user_status_changed: 'User access changed',
  };
  const words = known[action] ?? action.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return { action: words, detail: entityType && entityId ? `${entityType} · ${entityId}` : entityId || entityType };
}

/** Fits a list of transactions into CSV text (quotes doubled, so a comma or quote in a title never breaks the file). */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}
