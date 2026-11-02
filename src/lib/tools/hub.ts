/**
 * Brings the 36 hand-built Strategy Hub tools into the Consulting library. They keep their hand-drawn diagrams, worked examples and
 * calculations (they are code, not AI drafts), so a library entry only points at the model and records where it sits in the Framework
 * library: layer, lifecycle stages, and the golden thread (which tools feed it and which it feeds). Safe to run again: tools already
 * in the library are left alone.
 */
import { ALL_SEED } from '@/lib/seedStrategyFrameworks';
import { getModelDefinition } from '@/lib/strategyModels/registry';
import type { ToolsRepo } from './repo';
import { HUB_PLACEMENT } from './practice';
import type { CodeDefinition } from './runtime';

export const HUB_IDS = Object.keys(HUB_PLACEMENT);

export async function seedHubTools(repo: ToolsRepo, reviewerId: string, now: () => Date = () => new Date()): Promise<{ added: string[]; skipped: string[]; missing: string[] }> {
  const added: string[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];
  for (const toolId of HUB_IDS) {
    const model = getModelDefinition(toolId);
    const seed = ALL_SEED.find((s) => s.toolId === toolId);
    if (!model || !seed) { missing.push(toolId); continue; }
    if (await repo.getToolBySlug(toolId)) { skipped.push(toolId); continue; }
    const place = HUB_PLACEMENT[toolId];
    const definition: CodeDefinition = {
      kind: 'code', toolId,
      layer: seed.layer, phaseStart: seed.phaseStart, phaseEnd: seed.phaseEnd, nature: seed.nature,
      upstream: seed.upstreamTools, downstream: seed.downstreamTools, next: seed.nextStep,
    };
    await repo.saveTool({
      slug: toolId, name: seed.name, category: place.category, groupName: place.group, practice: place.practice, source: 'strategy-hub',
      does: seed.does, whenToUse: seed.whenToUse, whenNotToUse: seed.whenNotToUse || null,
      definition, status: 'REVIEWED',
      quality: { errors: [], warnings: [] },
      provenance: { importedFrom: 'strategy-hub', handBuilt: true, importedAt: now().toISOString() },
    });
    await repo.patchTool(toolId, { status: 'REVIEWED', reviewedById: reviewerId, reviewedAt: now() });
    added.push(toolId);
  }
  return { added, skipped, missing };
}
