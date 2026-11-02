/**
 * What an admin can do to a draft on the review screen: correct its words, or have the AI draft it again. Every change is re-checked
 * (quality gate and Eccellere standards) and sends the tool back to review, because what was approved is no longer what is on screen.
 */
import type { DeclarativeTool } from '@/lib/strategyModels/declarative';
import type { ToolRecord, ToolsRepo } from './repo';
import { assess } from './standards';
import { completePage, readSuggestion, type OriginatorSuggestion } from './complete';
import type { GenerateArgs, GenerateResult } from '@/lib/ai/providers';
import { ToolsError, type DrafterFn } from './service';
import { isCodeDefinition } from './runtime';

export interface ToolEdits {
  name?: string;
  does?: string;
  whenToUse?: string;
  whenNotToUse?: string;
  next?: string;
  analysisGuide?: string;
  reference?: { summary?: string; caption?: string; howToRead?: string[]; originator?: string; year?: string };
}

export { assess } from './standards';

const clean = (x: unknown) => (typeof x === 'string' ? x.trim() : undefined);

/**
 * Apply text corrections. Originator and year may be filled in here, by a person who has opened a source; the AI never sets them.
 * Anything not listed in ToolEdits (structure, keys, labels, rules) is deliberately not editable on this screen.
 */
export async function editTool(repo: ToolsRepo, slug: string, edits: ToolEdits): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live for clients. Withdraw it from clients before editing it.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool. Its wording is changed in the code, not here.');
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
    slug, name: def.name, category: tool.category, groupName: tool.groupName, practice: tool.practice, definition: def,
    does: def.does, whenToUse: def.whenToUse, whenNotToUse: def.whenNotToUse ?? null, quality,
    status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT',
  });
  // a changed tool is no longer the one a person approved
  return (await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT', quality }))!;
}

/** Draft this tool again from its name. Replaces the content; the previous draft is not kept. */
export async function redraftTool(repo: ToolsRepo, slug: string, drafter: DrafterFn, brief?: string): Promise<{ tool?: ToolRecord; paused?: string; failed?: string }> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live for clients. Withdraw it from clients before drafting it again.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool. It is not drafted by AI.');
  const out = await drafter({ name: tool.name, category: tool.category, groupName: tool.groupName, practice: tool.practice, brief: brief?.trim() || (typeof tool.provenance?.brief === 'string' ? tool.provenance.brief : null), slug });
  if (out.kind === 'ai_down') return { paused: out.reason };
  if (out.kind === 'failed') return { failed: out.reason };
  const status = (out.tool.quality?.errors.length ?? 0) > 0 ? 'NEEDS_REVIEW' : 'DRAFT';
  await repo.saveTool({ ...out.tool, status });
  const updated = await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status });
  return { tool: updated! };
}

/** Confirm the originator and year (typed by a person who has checked a source, or the AI's suggestion accepted as it is). */
export async function confirmOriginator(repo: ToolsRepo, slug: string, input?: { name?: string; year?: string }): Promise<ToolRecord> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool.');
  const sug = tool.provenance?.originatorSuggestion as OriginatorSuggestion | undefined;
  const name = (input?.name ?? sug?.name ?? '').trim();
  const year = (input?.year ?? sug?.year ?? '').trim();
  if (!name) throw new ToolsError('NOTHING_TO_CONFIRM', 'There is no originator to confirm. Type one, or leave it as "Originator not stated".');
  return editTool(repo, slug, { reference: { originator: name, year } }).then(async (t) => {
    const prov = { ...(t.provenance ?? {}) } as Record<string, unknown>;
    if (prov.originatorSuggestion) prov.originatorSuggestion = { ...(prov.originatorSuggestion as object), status: 'confirmed' };
    prov.originatorConfirmed = true;
    return (await repo.saveTool({ slug, name: t.name, category: t.category, definition: t.definition, provenance: prov }), (await repo.getToolBySlug(slug))!);
  });
}

/** Add whatever a page is missing (diagram, worked example, suggested originator) with one focused AI call, then re-check the page. */
export async function completeTool(
  repo: ToolsRepo,
  slug: string,
  generate: (a: GenerateArgs) => Promise<GenerateResult | null>,
): Promise<{ tool: ToolRecord; added: string[]; notes: string[] }> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live for clients. Withdraw it from clients before changing it.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool.');
  const def = tool.definition as DeclarativeTool;
  const hasSuggestion = !!readSuggestion(tool.provenance?.originatorSuggestion);
  const need = { diagram: !def.diagram, sample: !def.sample, originator: !def.reference.originator?.trim() && !hasSuggestion };
  if (!need.diagram && !need.sample && !need.originator) return { tool, added: [], notes: ['The page already has a diagram, a worked example and an originator note.'] };
  const done = await completePage(generate, def, need);
  const quality = assess(done.tool, done.notes);
  const prov = { ...(tool.provenance ?? {}) } as Record<string, unknown>;
  if (done.suggestion) prov.originatorSuggestion = done.suggestion;
  await repo.saveTool({
    slug, name: done.tool.name, category: tool.category, groupName: tool.groupName, practice: tool.practice, definition: done.tool,
    does: done.tool.does, whenToUse: done.tool.whenToUse, whenNotToUse: done.tool.whenNotToUse ?? null, quality, provenance: prov,
    status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT',
  });
  const updated = await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT', quality });
  return { tool: updated!, added: done.added, notes: done.notes };
}
