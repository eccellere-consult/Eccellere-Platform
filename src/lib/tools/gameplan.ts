/**
 * The "game plan": the actions from the analysis in every tool a person has worked on, gathered into one 30/60/90-day plan. Pure, so the
 * page and the tests share it. Mirrors the Game Plan idea in the Framework and Game Plan library: tools produce actions, a plan collects them.
 */
import type { FillinRow, ToolRecord } from './repo';

export const WINDOWS = ['Next 30 days', '30 to 60 days', '60 to 90 days', 'Later or not dated'] as const;
export type Window = (typeof WINDOWS)[number];

export interface PlanItem { action: string; owner: string; priority: string; timeframe: string; toolSlug: string; toolName: string }
export interface GamePlan { total: number; windows: { label: Window; items: PlanItem[] }[] }

/** Which window a free-text timeframe belongs to ("Next 30 days", "within 60 days", "Q1"...). Unrecognised text goes to "Later or not dated". */
export function windowOf(timeframe: string): Window {
  const t = timeframe.toLowerCase();
  if (/\b(30)\b.*\b(60)\b|\b30\s*(to|-|–)\s*60\b/.test(t)) return '30 to 60 days';
  if (/\b(60)\b.*\b(90)\b|\b60\s*(to|-|–)\s*90\b/.test(t)) return '60 to 90 days';
  const n = Number(t.match(/\b(\d{1,3})\s*days?\b/)?.[1]);
  if (Number.isFinite(n) && n > 0) return n <= 30 ? 'Next 30 days' : n <= 60 ? '30 to 60 days' : n <= 90 ? '60 to 90 days' : 'Later or not dated';
  if (/\b(this|next)\s+(week|month)\b|\bimmediate|\bnow\b/.test(t)) return 'Next 30 days';
  return 'Later or not dated';
}

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export function gamePlanOf(fillins: FillinRow[], tools: Pick<ToolRecord, 'slug' | 'name'>[]): GamePlan {
  const names = new Map(tools.map((t) => [t.slug, t.name]));
  const items: PlanItem[] = [];
  for (const f of fillins) {
    // only the live work: case 0 is the default worksheet; other cases are separate engagements and are listed with it for now
    for (const a of f.actionables ?? []) {
      if (!a?.action?.trim()) continue;
      items.push({ action: a.action.trim(), owner: a.owner, priority: a.priority, timeframe: a.timeframe, toolSlug: f.toolSlug, toolName: names.get(f.toolSlug) ?? f.toolSlug });
    }
  }
  const windows = WINDOWS.map((label) => ({
    label,
    items: items.filter((i) => windowOf(i.timeframe) === label).sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) || a.toolName.localeCompare(b.toolName)),
  }));
  return { total: items.length, windows };
}
