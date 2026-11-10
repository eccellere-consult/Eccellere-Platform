/**
 * "Build several toolkits with AI": the plan is made FIRST and costs nothing (no AI is called), so the owner sees how many toolkits
 * will be built and the worst-case total cost before agreeing. Only the toolkits in the agreed plan are ever built.
 * Pure logic: reading files and pricing are passed in, so all of this is tested without a database or an AI.
 */
import { costLine, estimateCost, type CostEstimate } from '@/lib/forms/cost';
import type { EstimateResult, ToolkitAsset } from '@/lib/marketplace/makeOnline';

export const DEFAULT_AI_BATCH = 10;
export const MAX_AI_BATCH = 25;

export interface PlanRow { slug: string; title: string; chars: number; lowUsd: number; highUsd: number }
export interface SkippedRow { slug: string; title: string; why: string }
export interface AiBatchPlan {
  rows: PlanRow[];
  skipped: SkippedRow[];
  /** More candidates than the limit: how many were left for a later run. */
  leftForLater: number;
  lowUsd: number;
  highUsd: number;
  model: string;
  text: string;
}

const money = (n: number) => Math.round(n * 100) / 100;

const WHY: Record<Exclude<EstimateResult['kind'], 'estimate'>, (r: never) => string> = {
  exists: () => 'Already has an online version that is reviewed, published or hand-made; left alone.',
  no_file: () => 'No file on the server to read.',
  unreadable: (r: { reason: string }) => r.reason as never,
};

export async function planAiBatch(assets: ToolkitAsset[], estimate: (a: ToolkitAsset) => Promise<EstimateResult>, limit = DEFAULT_AI_BATCH, price: (chars: number) => CostEstimate = estimateCost): Promise<AiBatchPlan> {
  const cap = Math.max(1, Math.min(MAX_AI_BATCH, Math.floor(limit) || DEFAULT_AI_BATCH));
  const candidates: PlanRow[] = [];
  const skipped: SkippedRow[] = [];
  for (const a of assets) {
    let e: EstimateResult;
    try { e = await estimate(a); } catch (err) { skipped.push({ slug: a.slug, title: a.title, why: err instanceof Error && err.message ? err.message : 'Could not be read.' }); continue; }
    if (e.kind !== 'estimate') { skipped.push({ slug: a.slug, title: a.title, why: WHY[e.kind](e as never) }); continue; }
    const c = price(e.chars);
    candidates.push({ slug: a.slug, title: a.title, chars: e.chars, lowUsd: c.lowUsd, highUsd: c.highUsd });
  }
  const rows = candidates.slice(0, cap);
  const lowUsd = money(rows.reduce((s, r) => s + r.lowUsd, 0));
  const highUsd = money(rows.reduce((s, r) => s + r.highUsd, 0));
  const model = price(0).model;
  const text = rows.length
    ? `${rows.length} toolkit${rows.length === 1 ? '' : 's'} will be built with ${model}. Estimated total cost: about US$${lowUsd.toFixed(2)} to US$${highUsd.toFixed(2)} (the top figure is the most it should cost).`
    : 'There is nothing to build with AI: every toolkit is either already online, has no readable file, or was skipped.';
  return { rows, skipped, leftForLater: Math.max(0, candidates.length - rows.length), lowUsd, highUsd, model, text };
}

/** Is the cost the person agreed to at least what the plan said? (They must have seen the top figure.) */
export const costAccepted = (plan: Pick<AiBatchPlan, 'highUsd'>, acceptedUsd: unknown): boolean =>
  typeof acceptedUsd === 'number' && Number.isFinite(acceptedUsd) && acceptedUsd + 0.005 >= plan.highUsd;

export { costLine };
