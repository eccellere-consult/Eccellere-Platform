/**
 * "Fix with AI" and "Modify with AI" for a tool page, and "Suggest tools with AI" for the add stage.
 *
 * Fix: the page has problems (the quality gate, the standards floor, a missing diagram or example). First the missing parts are completed
 * with their own focused call; then, if errors remain, the AI is given the page and the exact list of problems and asked for the corrected page.
 * Modify: the same, driven by an instruction from the administrator ("make the questions more specific to banking", "add a risk column").
 *
 * Safety: a correction is applied only if it is no worse than what was there (a change that makes things worse is refused and explained);
 * identity (name, slug, section), the originator and the review state are never taken from the AI; whatever the AI drops that was fine
 * (diagram, worked example) is kept; and every result is re-checked and goes back to review.
 */
import { normaliseDeclarative, type DeclarativeTool } from '@/lib/strategyModels/declarative';
import type { GenerateArgs, GenerateResult } from '@/lib/ai/providers';
import { SCHEMA_NOTES, extractJson } from './draft';
import { DEFAULT_DRAFT_SKILL } from './skill';
import { assess } from './standards';
import { completePage } from './complete';
import { isCodeDefinition } from './runtime';
import { ToolsError, slugify } from './service';
import type { QualityResult, ToolRecord, ToolsRepo } from './repo';

type Generate = (a: GenerateArgs) => Promise<GenerateResult | null>;

export function buildRepairMessages(tool: DeclarativeTool, issues: string[], instruction: string, skill?: string): { system: string; user: string } {
  const system = [
    (skill?.trim() || DEFAULT_DRAFT_SKILL).trim(),
    '',
    '# Your task now: correct an existing tool page',
    'You are given a finished tool page (JSON) and a list of problems and/or an instruction from the administrator. Return the COMPLETE corrected page as ONE JSON object in the same format.',
    'Change only what is needed. Keep every key, label, section and rule that is not part of a problem, so people\'s saved work still matches. Do not rename keys or labels unless a problem requires it. Keep "diagram" and "sample" unless they are the problem; if you change the fields or tables a sample refers to, update the sample to match.',
    'Do not change "name", "slug", "category" or "reference.originator" / "reference.year". Add "confidence" and "concerns" as in the skill.',
    '',
    '# Format (fixed)',
    SCHEMA_NOTES,
  ].join('\n');
  const { source, ...page } = tool; void source;
  const user = [
    issues.length ? `PROBLEMS TO FIX:\n${issues.map((i) => `- ${i}`).join('\n')}` : '',
    instruction.trim() ? `\nINSTRUCTION FROM THE ADMINISTRATOR (follow it as far as it is sensible and keeps the page valid):\n${instruction.trim().slice(0, 3000)}` : '',
    '\nCURRENT PAGE (JSON):',
    JSON.stringify(page),
    '\nReply with the corrected JSON object only.',
  ].filter(Boolean).join('\n');
  return { system, user };
}

export interface FixOutcome {
  tool: ToolRecord;
  applied: boolean;
  before: number;
  after: number;
  notes: string[];
}

/** Fix the problems on a page, and/or change it as instructed, using AI. */
export async function fixTool(
  repo: ToolsRepo,
  slug: string,
  generate: Generate,
  opts: { instruction?: string; skill?: string } = {},
): Promise<FixOutcome> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live for clients. Withdraw it from clients before changing it.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool. It is not changed with AI.');
  const instruction = (opts.instruction ?? '').trim();
  let def = JSON.parse(JSON.stringify(tool.definition)) as DeclarativeTool;
  const before = assess(def);
  const notes: string[] = [];

  // 1. missing diagram / worked example: their own focused call
  const need = { diagram: !def.diagram, sample: !def.sample, originator: false };
  if (need.diagram || need.sample) {
    const done = await completePage(generate, def, need);
    def = done.tool;
    notes.push(...done.notes);
    if (done.added.length) notes.push(`Added: ${done.added.join(' and ')}.`);
  }

  // 2. whatever is still wrong (or the administrator's instruction): one correction call
  let current = assess(def);
  let applied = !!(need.diagram || need.sample) && current.errors.length < before.errors.length;
  if (current.errors.length > 0 || instruction) {
    const issues = current.errors;
    const { system, user } = buildRepairMessages(def, issues, instruction, opts.skill);
    const res = await generate({ system, user, maxTokens: 7000, timeoutMs: 110_000, json: true }).catch(() => null);
    if (!res) throw new ToolsError('AI_DOWN', 'The AI did not answer, so nothing was changed. Check the AI providers setting, then try again.');
    const raw = res.finishReason === 'length' ? null : extractJson(res.text);
    if (!raw || typeof raw !== 'object') {
      notes.push('The AI answer was cut off or unreadable, so the correction was not applied.');
    } else {
      const r = raw as Record<string, unknown>;
      const forced = {
        ...r,
        slug: def.slug, name: def.name, category: def.category,
        reference: { ...(typeof r.reference === 'object' && r.reference ? (r.reference as object) : {}), originator: def.reference.originator, year: def.reference.year },
      };
      const { tool: next } = normaliseDeclarative(forced);
      if (!next) {
        notes.push('The AI answer could not be read as a tool page, so the correction was not applied.');
      } else {
        // keep what was fine and the AI dropped
        if (!next.diagram && def.diagram) next.diagram = def.diagram;
        if (!next.sample && def.sample) next.sample = def.sample;
        if (!next.next && def.next) next.next = def.next;
        next.source = def.source;
        let after = assess(next);
        // an example that no longer fits the changed fields: ask once for a new one
        let repaired = next;
        if (after.errors.some((e) => e.startsWith('sample'))) {
          const withoutSample = JSON.parse(JSON.stringify(next)) as DeclarativeTool;
          delete withoutSample.sample;
          const done = await completePage(generate, withoutSample, { diagram: false, sample: true, originator: false });
          repaired = done.tool;
          after = assess(repaired);
        }
        const worse = after.errors.length > current.errors.length || (!instruction && after.errors.length >= current.errors.length && (after.standards?.score ?? 0) <= (current.standards?.score ?? 0));
        if (worse) {
          notes.push(`The AI's correction was not applied: it would leave ${after.errors.length} problem${after.errors.length === 1 ? '' : 's'} (there ${current.errors.length === 1 ? 'is' : 'are'} ${current.errors.length} now). ${after.errors.length ? ` Still wrong: ${after.errors.slice(0, 3).join(' | ')}.` : ''} ${instruction ? 'Try rewording the instruction.' : 'Use "Try again: send the exact problems", "Draft again with AI", or edit the wording by hand.'}`);
        } else {
          def = repaired;
          applied = true;
          current = after;
          if (instruction) notes.push('Your instruction was applied.');
        }
      }
    }
  }

  const quality: QualityResult = assess(def, notes.filter((n) => /not applied|cut off|unreadable|could not/i.test(n)));
  const prov = { ...(tool.provenance ?? {}), lastAiFixAt: new Date().toISOString() } as Record<string, unknown>;
  if (applied) {
    await repo.saveTool({
      slug, name: def.name, category: tool.category, groupName: tool.groupName, practice: tool.practice, definition: def,
      does: def.does, whenToUse: def.whenToUse, whenNotToUse: def.whenNotToUse ?? null, quality, provenance: prov,
      status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT',
    });
    const updated = await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status: quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT', quality });
    return { tool: updated!, applied, before: before.errors.length, after: quality.errors.length, notes };
  }
  return { tool, applied, before: before.errors.length, after: before.errors.length, notes };
}

// ── Suggest tools with AI (the add stage) ───────────────────────────────────────────────────────────────────────

export interface SuggestedTool { name: string; group: string }

export function buildSuggestMessages(args: { topic: string; practice?: string; count: number; existing: string[] }): { system: string; user: string } {
  const system = [
    'You suggest well-known, real consulting and management tools (frameworks, models, templates, techniques) for a library used by senior managers and consultants.',
    'Only suggest established methods that people actually use, with their usual names. Never invent a method or a name. Do not suggest anything already on the list you are given.',
    'Give each a short group name such as "Process improvement", "Digital and data", "Organisation design" or "Risk management".',
    `Return ONE JSON object: {"tools":[{"name":"<usual name>","group":"<group>"}]} with up to ${args.count} entries, most useful first.`,
  ].join('\n');
  const user = [
    `TOPIC OR NEED: ${args.topic.trim().slice(0, 1000)}`,
    args.practice && args.practice !== 'Auto' ? `CONSULTING PRACTICE: ${args.practice}` : '',
    args.existing.length ? `ALREADY ON THE LIST (do not repeat):\n${args.existing.slice(0, 400).join('; ')}` : '',
  ].filter(Boolean).join('\n\n');
  return { system, user };
}

export type SuggestResult = { ok: true; tools: SuggestedTool[] } | { ok: false; reason: string };

export async function suggestTools(generate: Generate, args: { topic: string; practice?: string; count?: number; existing: string[] }): Promise<SuggestResult> {
  if (args.topic.trim().length < 3) return { ok: false, reason: 'Say what you need tools for, for example "root cause analysis in manufacturing" or "change management for a bank".' };
  const count = Math.min(Math.max(args.count ?? 15, 3), 30);
  const { system, user } = buildSuggestMessages({ ...args, count });
  const res = await generate({ system, user, maxTokens: 2500, timeoutMs: 60_000, json: true }).catch(() => null);
  if (!res) return { ok: false, reason: 'The AI did not answer. Check the AI providers setting, then try again.' };
  const raw = res.finishReason === 'length' ? null : extractJson(res.text);
  const list = raw && typeof raw === 'object' ? (raw as { tools?: unknown }).tools : null;
  if (!Array.isArray(list)) return { ok: false, reason: 'The AI did not return a readable list. Please try again.' };
  const have = new Set(args.existing.map(slugify));
  const seen = new Set<string>();
  const tools: SuggestedTool[] = [];
  for (const t of list) {
    if (!t || typeof t !== 'object') continue;
    const name = String((t as { name?: unknown }).name ?? '').replace(/[|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    const group = String((t as { group?: unknown }).group ?? '').replace(/[|\n\r]+/g, ' ').trim().slice(0, 60);
    const slug = slugify(name);
    if (!name || name.length > 80 || !slug || have.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    tools.push({ name, group });
    if (tools.length >= count) break;
  }
  if (tools.length === 0) return { ok: false, reason: 'The AI suggested nothing new for that. Try a different or wider topic.' };
  return { ok: true, tools };
}

