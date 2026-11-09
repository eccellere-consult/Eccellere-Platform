import type { MakeOnlineResult, ToolkitAsset } from '@/lib/marketplace/makeOnline';

/** Runs "make online" over many toolkits, one after another, never stopping for one that cannot be done, and reports each in plain words. */
export interface BatchRow { slug: string; title: string; kind: MakeOnlineResult['kind']; detail: string }
export interface BatchSummary { rows: BatchRow[]; counts: Record<MakeOnlineResult['kind'], number>; total: number }

const DETAIL: Record<MakeOnlineResult['kind'], (r: MakeOnlineResult) => string> = {
  ok: () => 'Draft saved for review.',
  exists: () => 'Already has an online version; left as it is.',
  no_file: () => 'No file on the server to read.',
  unreadable: (r) => (r as { reason: string }).reason,
  ai_down: (r) => (r as { reason: string }).reason,
  failed: (r) => (r as { reason: string }).reason,
};

export async function makeAllOnline(assets: (ToolkitAsset & { id?: string })[], one: (a: ToolkitAsset) => Promise<MakeOnlineResult>, onProgress?: (done: number, total: number) => void): Promise<BatchSummary> {
  const counts = { ok: 0, exists: 0, no_file: 0, unreadable: 0, ai_down: 0, failed: 0 };
  const rows: BatchRow[] = [];
  for (const a of assets) {
    let r: MakeOnlineResult;
    try { r = await one(a); } catch (e) { r = { kind: 'failed', reason: e instanceof Error && e.message ? e.message : 'Stopped unexpectedly.' }; }
    counts[r.kind] += 1;
    rows.push({ slug: a.slug, title: a.title, kind: r.kind, detail: DETAIL[r.kind](r) });
    onProgress?.(rows.length, assets.length);
  }
  return { rows, counts, total: assets.length };
}
