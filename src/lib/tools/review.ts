/**
 * What an admin can do to a draft on the review screen: correct its words, or have the AI draft it again. Every change is re-checked
 * (quality gate and Eccellere standards) and sends the tool back to review, because what was approved is no longer what is on screen.
 */
import { qualityGate, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import type { QualityResult, ToolRecord, ToolsRepo } from './repo';
import { MIN_SCORE_TO_REVIEW, standardsCheck, standardsGaps } from './standards';
import { ToolsError, type DrafterFn } from './service';

export interface ToolEdits {
  name?: string;
  does?: string;
  whenToUse?: string;
  whenNotToUse?: string;
  next?: string;
  analysisGuide?: string;
  reference?: { summary?: string; caption?: string; howToRead?: string[]; originator?: string; year?: string };
}

/** Quality result for a definition, in the shape stored with the tool. */
export function assess(tool: DeclarativeTool, extraWarnings: string[] = []): QualityResult {
  const gate = qualityGate(tool);
  const s = standardsCheck(tool);
  const errors = [...gate.blockers];
  if (s.score < MIN_SCORE_TO_REVIEW) errors.push(`Standards: scored ${s.score}/100 (${s.band}); the Eccellere standard needs at least ${MIN_SCORE_TO_REVIEW} before review.`);
  return {
    errors,
    warnings: [...gate.warnings, ...extraWarnings, ...standardsGaps(s).map((g) => `Standards: ${g}`)],
    standards: { score: s.score, level: s.level, band: s.band },
  };
}

const clean = (x: unknown) => (typeof x === 'string' ? x.trim() : undefined);

/**
 * Apply text corrections. Originator and year may be filled in here, by a person who has opened a source; the AI never sets them.
 * Anything not listed in ToolEdits (structure, keys, labels, rules) is deliberately not editable on this screen.
 */
export async function editTool(repo: ToolsRepo, slug: string, edits: ToolEdits): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live. Take it off the marketplace before editing it.');
  const def = JSON.parse(JSON.stringify(tool.definition)) as DeclarativeTool;

  for (const k of ['does', 'whenToUse', 'whenNotToUse', 'next', 'analysisGuide'] as const) {
    const v = clean(edits[k]);
    if (v !== undefined) (def as unknown as Record<string, string>)[k] = v;
  }
  const name = clean(edits.name);
  if (name) def.name = name;
  if (edits.reference) {
    def.reference = { ...def.reference };
    for (const k of ['summary', 'caption', 'originator', 'year'] as const) {
      const v = clean(edits.reference[k]);
      if (v !== undefined) def.reference[k] = v;
    }
    if (Array.isArray(edits.reference.howToRead)) def.reference.howToRead = edits.reference.howToRead.map((x) => String(x).trim()).filter(Boolean);
  }
  def.source = { ...(def.source ?? { draftedBy: 'ai' as const }) };
  const quality = assess(def);
  await repo.saveTool({
    slug, name: def.name, category: tool.category, groupName: tool.groupName, definition: def,
    does: def.does, whenToUse: def.whenToUse, whenNotToUse: def.whenNotToUse ?? null, quality,
    status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT',
  });
  // a changed tool is no longer the one a person approved
  return (await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT', quality }))!;
}

/** Draft this tool again from its name. Replaces the content; the previous draft is not kept. */
export async function redraftTool(repo: ToolsRepo, slug: string, drafter: DrafterFn): Promise<{ tool?: ToolRecord; paused?: string; failed?: string }> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live. Take it off the marketplace before drafting it again.');
  const out = await drafter({ name: tool.name, category: tool.category, groupName: tool.groupName, slug });
  if (out.kind === 'ai_down') return { paused: out.reason };
  if (out.kind === 'failed') return { failed: out.reason };
  const status = (out.tool.quality?.errors.length ?? 0) > 0 ? 'NEEDS_REVIEW' : 'DRAFT';
  await repo.saveTool({ ...out.tool, status });
  const updated = await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status });
  return { tool: updated! };
}
