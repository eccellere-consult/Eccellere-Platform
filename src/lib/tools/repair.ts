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
import { diagramIssues, type DiagramSpec } from '@/lib/strategyModels/diagrams/templates';
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

/**
 * A result (an "output" or a "derived" value) whose rule the engine cannot run is optional extra, never the heart of the tool. Rather than
 * ask the AI to guess again, take such results out and say which. Returns the list of what was removed.
 */
export function dropBrokenResults(def: DeclarativeTool): string[] {
  const dropped: string[] = [];
  for (let round = 0; round < 8; round++) {
    const hits = assess(def).errors
      .map((e) => /^(outputs|derived)\[(\d+)\]/.exec(e))
      .filter((m): m is RegExpExecArray => !!m);
    if (!hits.length) break;
    // remove from the highest index down so earlier indexes stay valid
    const seen = new Set<string>();
    for (const m of hits.sort((a, b) => Number(b[2]) - Number(a[2]))) {
      const key = `${m[1]}${m[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const list = (m[1] === 'outputs' ? def.outputs : def.derived) as { label?: string }[] | undefined;
      const i = Number(m[2]);
      if (list && list[i]) { dropped.push(list[i].label || `${m[1]} ${i + 1}`); list.splice(i, 1); }
    }
  }
  return dropped;
}

type GridBox = { name?: string; hint?: string; col?: number; row?: number; colSpan?: number; rowSpan?: number };

/**
 * Structural faults the AI makes again and again, repaired without asking the AI anything:
 *  - a "canvasGrid" diagram with unnamed boxes or boxes that fall outside the grid (the grid is widened within its limits, boxes are
 *    trimmed to fit, unnamed ones are removed; with fewer than 2 boxes left the diagram is taken out so it can be re-made);
 *  - a calculated column whose rule the engine cannot run (it becomes a plain number column people fill in, so the table keeps working).
 * Returns plain-words notes of what was changed.
 */
export function repairStructure(def: DeclarativeTool, opts: { simpleDiagram?: boolean } = {}): string[] {
  const notes: string[] = [];
  const d = def.diagram as unknown as ({ template?: string; title?: string; cols?: number; rows?: number; boxes?: GridBox[] } | undefined);
  if (d && d.template === 'canvasGrid' && diagramIssues(def.diagram as DiagramSpec).length > 0) {
    const whole = (n: unknown, dflt: number) => (Number.isFinite(Number(n)) ? Math.max(0, Math.floor(Number(n))) : dflt);
    const named = (Array.isArray(d.boxes) ? d.boxes : []).filter((b): b is GridBox => !!b && typeof b.name === 'string' && b.name.trim().length > 0 && whole(b.col, 0) <= 5 && whole(b.row, 0) <= 4);
    if (named.length < 2) {
      delete (def as { diagram?: unknown }).diagram;
      notes.push('Removed a diagram whose boxes were unnamed or outside its grid. Use "Complete the page" to have a new one drawn.');
    } else {
      for (const b of named) {
        b.col = whole(b.col, 0); b.row = whole(b.row, 0);
        b.colSpan = Math.max(1, whole(b.colSpan ?? 1, 1)); b.rowSpan = Math.max(1, whole(b.rowSpan ?? 1, 1));
      }
      d.cols = Math.min(6, Math.max(1, whole(d.cols, 3), ...named.map((b) => (b.col ?? 0) + 1)));
      d.rows = Math.min(5, Math.max(1, whole(d.rows, 3), ...named.map((b) => (b.row ?? 0) + 1)));
      for (const b of named) {
        b.colSpan = Math.min(b.colSpan ?? 1, d.cols - (b.col ?? 0));
        b.rowSpan = Math.min(b.rowSpan ?? 1, d.rows - (b.row ?? 0));
      }
      d.boxes = named;
      if (!d.title?.trim()) d.title = def.name;
      notes.push('Fixed the diagram: every box now has a name and sits inside the grid.');
    }
  }
  // no diagram at all: a simple "steps" picture of the sections, in order (3 to 8 steps), so the tool is not blocked for want of one
  if (opts.simpleDiagram && !def.diagram && def.sections.length >= 3) {
    const names = def.sections.map((s) => s.title.trim()).filter(Boolean);
    const steps = (names.length > 8 ? [...names.slice(0, 7), names[names.length - 1]] : names).map((n) => ({ name: n.length > 30 ? `${n.slice(0, 29)}…` : n }));
    if (steps.length >= 3) {
      (def as { diagram?: unknown }).diagram = { template: 'steps', title: def.name.slice(0, 60), steps };
      notes.push('Added a simple diagram showing the sections as steps. Ask “Modify with AI” for a richer one.');
    }
  }
  // a choice list with fewer than 2 choices cannot be answered: it becomes a plain text answer
  for (const s of def.sections) {
    for (const p of s.parts) {
      if (p.kind === 'field' && p.type === 'select' && (p.options?.length ?? 0) < 2) {
        p.type = 'text'; delete (p as { options?: unknown }).options;
        notes.push(`“${p.label}” had fewer than 2 choices, so it is now a plain text answer.`);
      } else if (p.kind === 'table' && !p.board) {
        for (const c of p.columns) {
          if (c.type === 'select' && (c.options?.length ?? 0) < 2) {
            c.type = 'text'; delete (c as { options?: unknown }).options;
            notes.push(`The column “${c.header || c.key}” had fewer than 2 choices, so it is now a plain text column.`);
          }
        }
      }
    }
  }
  for (let round = 0; round < 6; round++) {
    const hits = assess(def).errors
      .map((e) => /^sections\[(\d+)\]\.parts\[(\d+)\]\.columns\[(\d+)\]\.rule/.exec(e))
      .filter((m): m is RegExpExecArray => !!m);
    if (!hits.length) break;
    let changed = false;
    for (const m of hits) {
      const part = def.sections[Number(m[1])]?.parts[Number(m[2])];
      const col = part && part.kind === 'table' && !part.board ? part.columns[Number(m[3])] : undefined;
      if (col && col.type === 'computed') {
        col.type = 'number';
        delete (col as { rule?: unknown }).rule;
        notes.push(`The column “${col.header || col.key}” had a calculation the tool cannot run, so people now enter it themselves.`);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return notes;
}

/**
 * The automatic clean-up, with no AI: removes results and columns that cannot run and repairs a broken diagram grid, then re-checks.
 * Saves only when something changed and the page is no worse; the tool goes back to review. `remaining` lists what is still wrong.
 */
export async function tidyTool(repo: ToolsRepo, slug: string): Promise<FixOutcome & { remaining: string[] }> {
  const tool = await repo.getToolBySlug(slug);
  if (!tool) throw new ToolsError('NOT_FOUND', 'That tool was not found.');
  if (tool.status === 'PUBLISHED') throw new ToolsError('WRONG_STATE', 'This tool is live for clients. Withdraw it from clients before changing it.');
  if (isCodeDefinition(tool.definition)) throw new ToolsError('WRONG_STATE', 'This is a hand-built Strategy Hub tool. It is not changed automatically.');
  const def = JSON.parse(JSON.stringify(tool.definition)) as DeclarativeTool;
  const before = assess(def);
  const notes: string[] = [];
  const removed = dropBrokenResults(def);
  if (removed.length) notes.push(`Removed ${removed.length} result${removed.length === 1 ? '' : 's'} that could not run: ${removed.map((r) => `“${r}”`).join(', ')}.`);
  notes.push(...repairStructure(def, { simpleDiagram: true }));
  if (!(def.outputs ?? []).length) {
    const f = def.sections.flatMap((s) => s.parts).find((p) => p.kind === 'field');
    const text = f && f.kind === 'field' ? f.label + ': {' + f.key + '}' : 'Your entries are recorded in the tables above.';
    def.outputs = [{ key: 'summary', label: 'Summary of your entry', rule: { op: 'template', text } as never }];
    notes.push('Added a simple summary result so a later tool can build on this one. Ask "Modify with AI" for a richer one.');
  }
  const quality: QualityResult = assess(def);
  const changed = notes.length > 0;
  // Standards-score errors are about thin content, not breakage: they do not count against a structural repair
  const hard = (l: string[]) => l.filter((e) => !e.startsWith('Standards:')).length;
  if (!changed || hard(quality.errors) > hard(before.errors) || (hard(quality.errors) === hard(before.errors) && quality.errors.length > before.errors.length)) {
    return { tool, applied: false, before: before.errors.length, after: before.errors.length, notes, remaining: before.errors };
  }
  const status = quality.errors.length ? 'NEEDS_REVIEW' : 'DRAFT';
  await repo.saveTool({
    slug, name: def.name, category: tool.category, groupName: tool.groupName, practice: tool.practice, definition: def,
    does: def.does, whenToUse: def.whenToUse, whenNotToUse: def.whenNotToUse ?? null, quality,
    provenance: { ...(tool.provenance ?? {}), lastTidyAt: new Date().toISOString() } as Record<string, unknown>, status,
  });
  const updated = await repo.patchTool(slug, { reviewedById: null, reviewedAt: null, status, quality });
  return { tool: updated!, applied: true, before: before.errors.length, after: quality.errors.length, notes, remaining: quality.errors };
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
  const removed = dropBrokenResults(def);
  if (removed.length) notes.push(`Removed ${removed.length} result${removed.length === 1 ? '' : 's'} the AI had written with a rule this tool cannot run: ${removed.map((r) => `“${r}”`).join(', ')}. Ask "Modify with AI" to add a result back if you need it.`);
  const structural = repairStructure(def);
  notes.push(...structural);

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
  let applied = (removed.length > 0 || structural.length > 0 || !!(need.diagram || need.sample)) &&current.errors.length < before.errors.length;
  if (current.errors.length > 0 || instruction) {
    const issues = current.errors;
    const { system, user } = buildRepairMessages(def, issues, instruction, opts.skill);
    const res = await generate({ system, user, maxTokens: 7000, timeoutMs: 110_000, json: true, quality: true }).catch(() => null);
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

