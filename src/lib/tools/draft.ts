/**
 * Drafting one tool from its name: the instructions given to the AI, the reading of its reply, and the checks that decide
 * whether the draft needs a person's attention. Nothing here talks to a database or a provider directly (the AI call is
 * passed in), so the whole path is tested with a pretend AI.
 *
 * What the AI is never trusted with: who invented the tool and when (always left blank), the tool's name and slug (taken
 * from the list), and whether it is good enough to publish (the quality gate and a person decide that).
 */
import { normaliseDeclarative, qualityGate, type DeclarativeTool, type ToolCategory } from '@/lib/strategyModels/declarative';
import type { GenerateArgs, GenerateResult } from '@/lib/ai/providers';
import type { DraftOutcome, DrafterFn } from './service';
import { MIN_SCORE_TO_REVIEW, standardsCheck, standardsGaps } from './standards';

/** The marketplace category (and optional group) mapped to the engine's fixed set of tool categories. */
export function declarativeCategory(category: string, group?: string | null): ToolCategory {
  const g = (group ?? '').toLowerCase();
  if (g.startsWith('creative')) return 'creative';
  if (g.includes('root cause')) return 'root-cause';
  switch (category) {
    case 'Problem solving': return 'analytical';
    case 'Business analysis': return 'analytical';
    case 'Strategy': return 'strategy';
    case 'Project Management': return 'planning';
    case 'Change Management': return 'planning';
    case 'Decision Models': return 'decision-matrix';
    default: return 'other';
  }
}

/** A small, correct tool shown to the AI so it copies the exact shape and rule syntax. The tests run it through the quality gate. */
export const EXAMPLE_TOOL: DeclarativeTool = {
  schema: 1,
  slug: 'impact-effort-matrix',
  name: 'Impact-Effort Matrix',
  category: 'prioritisation',
  does: 'Sorts a list of options by the value they would create against the effort they need, so the quick wins and the money pits are visible side by side.',
  whenToUse: 'Use it when a team has more good ideas than capacity and needs a defensible order in which to start.',
  whenNotToUse: 'Do not use it when the options are not independent, or when one option is a legal or safety must-do whatever its effort.',
  next: 'Take the top options into a short plan with an owner and a date each.',
  reference: {
    originator: '',
    year: '',
    summary: 'A two-by-two that plots each option by expected impact and required effort. High impact for low effort comes first.',
    caption: 'Impact rises upwards, effort rises to the right. The top-left box is where to start.',
    howToRead: ['Read the top-left box first: high impact, low effort.', 'Treat the bottom-right box with suspicion: high effort for low impact.'],
  },
  diagram: {
    template: 'matrix2x2',
    title: 'Impact against effort',
    xAxis: { label: 'Effort', low: 'Low', high: 'High' },
    yAxis: { label: 'Impact', low: 'Low', high: 'High' },
    quadrants: [
      { name: 'Quick wins', hint: 'Do these first', tone: 'good' },
      { name: 'Big bets', hint: 'Plan carefully', tone: 'warn' },
      { name: 'Fill-ins', hint: 'Do if there is spare time', tone: 'neutral' },
      { name: 'Money pits', hint: 'Avoid', tone: 'bad' },
    ],
  },
  sections: [
    {
      key: 'decision',
      title: 'The decision',
      summary: 'Say what is being prioritised and why now.',
      parts: [
        { kind: 'field', key: 'decision', label: 'What are we choosing between?', type: 'longtext', help: 'Describe the decision in one or two sentences, including the time or budget limit that forces a choice.', example: 'Which of eight process fixes to start this quarter with two analysts and no extra budget.' },
        { kind: 'field', key: 'objective', label: 'What does success look like?', type: 'text', help: 'State the result you want and by when, so the options can be judged against something real and not against taste.', example: 'Cut order-to-cash delays by a third by the end of March.' },
        { kind: 'field', key: 'constraint', label: 'What limits the choice?', type: 'text', help: 'Name the budget, people, time or rules that make some options impossible; it stops the scoring from drifting into wishes.', example: 'Two analysts, no new tools, nothing that needs a vendor contract.' },
      ],
    },
    {
      key: 'score',
      title: 'Score the options',
      summary: 'Rate each option for impact and effort on the same one-to-five scale.',
      parts: [
        {
          kind: 'table', key: 'options', label: 'Options', help: 'List each option and rate it. Use the same scale for every row so the scores can be compared.', rowLabel: 'Option', minRows: 3,
          columns: [
            { key: 'option', header: 'Option', help: 'A short name everyone will recognise.', type: 'text' },
            { key: 'impact', header: 'Impact', help: 'How much value it creates if it works.', type: 'rating', scale: { min: 1, max: 5, low: 'Small', high: 'Large' } },
            { key: 'effort', header: 'Effort', help: 'How much time, money and attention it needs.', type: 'rating', scale: { min: 1, max: 5, low: 'Little', high: 'A lot' } },
            { key: 'ratio', header: 'Impact per effort', help: 'Worked out for you: impact divided by effort.', type: 'computed', rule: { op: 'calc', expr: { div: [{ cell: 'impact' }, { cell: 'effort' }] }, format: 'dp1' } },
          ],
        },
      ],
    },
    {
      key: 'plan',
      title: 'Action plan',
      summary: 'Turn the top options into dated actions with an owner and a measure.',
      parts: [
        { kind: 'field', key: 'decision_made', label: 'What did you decide, and why?', type: 'longtext', help: 'Write the decision in plain words with the main reason, so someone who was not in the room can follow it later.' },
        {
          kind: 'table', key: 'actions', label: 'Actions for the next 90 days', help: 'List the first actions in order. Give each an owner by role, a measure that shows it worked, and when it starts.', rowLabel: 'Action', minRows: 3,
          columns: [
            { key: 'action', header: 'Action', help: 'What will be done, in one clear sentence.', type: 'text' },
            { key: 'owner', header: 'Owner (role)', help: 'The role accountable, for example Finance Manager, not a named person.', type: 'text' },
            { key: 'measure', header: 'Measure of success', help: 'The number or event that proves it worked.', type: 'text' },
            { key: 'horizon', header: 'When', help: 'Pick the window in which it should start.', type: 'select', options: ['30 days', '60 days', '90 days'] },
          ],
        },
      ],
    },
  ],
  derived: [{ key: 'scored', label: 'Options scored', rule: { op: 'calc', expr: { agg: 'count', table: 'options', col: 'impact' }, format: 'int' } }],
  outputs: [{ key: 'start_with', label: 'Start with', rule: { op: 'top', table: 'options', by: 'ratio', label: 'option' } }],
  analysisGuide: 'Read the options in order of impact per effort. Say which two or three to start with and why. Flag any option rated high on both axes as a big bet that needs a plan, not a quick start. Flag any score that looks inflated or that nobody has evidence for, and say what would settle it.',
};

const SCHEMA_NOTES = `
SHAPE (JSON object; every key shown is allowed, nothing else):
{ "schema": 1, "slug", "name", "category", "does", "whenToUse", "whenNotToUse", "next",
  "reference": { "originator": "", "year": "", "summary", "caption", "howToRead": [2 to 4 short lines] },
  "diagram": ONE of
     { "template": "matrix2x2", "title", "xAxis": {"label","low","high"}, "yAxis": {...}, "quadrants": [4 x {"name","hint","tone": good|warn|bad|neutral}] (top-left, top-right, bottom-left, bottom-right) }
     { "template": "matrix3x3", "title", "xAxis", "yAxis", "cells": [9 strings, top row first] }
     { "template": "steps" | "cycle", "title", "steps": [3 to 8 x {"name","hint"}] }
     { "template": "canvasGrid", "title", "cols", "rows", "boxes": [{"name","hint","col","row","colSpan","rowSpan"}] }
     { "template": "scale", "title", "levels": [3 to 7 x {"name","hint"}] }
  "sections": [ { "key", "title", "summary", "parts": [ FIELD or TABLE ] } ],
  "derived": [ { "key", "label", "help", "rule" } ],
  "outputs": [ { "key", "label", "rule" } ]   (at least one),
  "analysisGuide": "how an analyst should read a filled-in tool" }
FIELD: { "kind":"field", "key", "label", "type": text|longtext|select|rating|number, "help", "example", "options": [for select, 2+], "scale": {min,max,low,high} for rating, "unit": required for number }
TABLE: { "kind":"table", "key", "label", "help", "rowLabel", "minRows", "maxRows", "fixedRows": [names, optional], "columns": [ { "key","header","help","type": text|longtext|number|select|rating|computed, "options","scale","unit","rule" (computed only) } ] }
RULES (the only calculations allowed; no code):
  { "op":"calc", "expr": EXPR, "format": int|dp1|dp2|pct }
  { "op":"weighted", "table", "value": column, "weight": column }
  { "op":"top", "table", "by": column, "label": column }
  { "op":"when", "expr": EXPR, "gt" or "lt": number, "then": text, "else": text }
  { "op":"template", "text": "words with {field_key} placeholders" }
  { "op":"quadrant", "x": EXPR, "y": EXPR, "midX", "midY", "names": [4 strings] }
EXPR: a number, {"field": key}, {"cell": column key} (inside a computed column only), {"agg": sum|avg|min|max|count, "table", "col"}, or {"add":[EXPR..]}, {"mul":[..]}, {"sub":[EXPR,EXPR]}, {"div":[EXPR,EXPR]}.
Keys are snake_case and unique. Labels are plain words and unique.`.trim();

export function buildDraftPrompt(name: string, category: string, compact = false, group: string | null = null): { system: string; user: string } {
  const system = [
    'You write tool definitions for a consulting platform used by senior managers. Each definition becomes a guided workspace: a reference card with a diagram, a form to fill in, a calculation, and a written analysis.',
    '',
    'RULES',
    '1. Describe the REAL, standard method behind the name, with its usual steps or elements in their usual order. If the name has more than one meaning, pick the one used in business and problem solving. If you are not sure of the standard method, say so in "confidence" and "concerns" instead of inventing one.',
    '2. Never state who invented the method or when. Leave reference.originator and reference.year as empty strings.',
    '3. Follow the Eccellere standard for a focused tool. Build the workspace in this order: (a) a first section that captures the situation, objective and constraints; (b) one or two sections that carry out the method itself; (c) a LAST section titled "Action plan" with a field for the decision and why, and a table of actions with columns action, owner (a role, never a person), measure of success and a 30/60/90-day horizon. ' + (compact ? 'Keep it short: 3 or 4 sections, 2 to 4 parts each.' : 'Use 3 to 5 sections with 2 to 6 parts each, at least 6 inputs in all.'),
    '4. Use a table for anything that repeats (options, causes, risks, criteria). Add a computed column or an output rule ONLY where the method really calculates something (a score, a ratio, a ranking). Never invent numbers or benchmarks.',
    '5. Every part needs help text of a full sentence or two: what to write, what good looks like and why it is asked. Every table column needs help too. Every text, select, rating and number field needs a realistic example.',
    '6. "does", "whenToUse" and "whenNotToUse" are one or two plain sentences each (at least 40, 30 and 30 characters). "analysisGuide" is three to six sentences (at least 200 characters) telling an analyst what to look for in a filled-in tool, the warning signs, what could be wrong with the inputs, and what to recommend. "next" names the next tool or action and why.',
    '7. Plain business English. No hype, no emojis, no placeholders such as TBD, TODO or lorem.',
    '8. Choose the diagram template that truly fits the method. If none fits, omit "diagram".',
    '9. Add two extra top-level keys: "confidence" ("high", "medium" or "low": how sure you are that this is the standard method) and "concerns" (a short list of anything a reviewer should check).',
    '',
    SCHEMA_NOTES,
    '',
    'A SMALL CORRECT EXAMPLE (for shape and rule syntax only; do not copy its content):',
    JSON.stringify(EXAMPLE_TOOL),
  ].join('\n');
  const user = `Write the tool definition for: ${name}\nIts marketplace category: ${category}${group ? ` (group: ${group})` : ''}\nSet "category" to "${declarativeCategory(category, group)}" and "slug" to the name in kebab-case. Reply with the JSON object only.`;
  return { system, user };
}

/** The first JSON object in a reply, tolerating a code fence or a sentence before or after it. Null if there is none that parses. */
export function extractJson(text: string): unknown | null {
  const stripped = text.replace(/```(?:json)?/gi, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(stripped.slice(start, end + 1)); } catch { return null; }
}

export type GenerateFn = (a: GenerateArgs) => Promise<GenerateResult | null>;

export interface DrafterDeps {
  generate: GenerateFn;
  /** Why no provider answered, in plain words (which keys are missing, which provider errored). */
  explainDown: (diag: string[]) => string;
  now?: () => Date;
}

const MAX_TOKENS = 7000;
const TIMEOUT_MS = 110_000;

/** Builds the drafter used by the batch run. Up to two AI calls per name: the second only after a cut-off or unreadable reply. */
export function makeDrafter(deps: DrafterDeps): DrafterFn {
  const now = deps.now ?? (() => new Date());
  return async (item): Promise<DraftOutcome> => {
    const diag: string[] = [];
    let calls = 0;
    let lastProblem = '';
    for (const compact of [false, true]) {
      const { system, user } = buildDraftPrompt(item.name, item.category, compact, item.groupName);
      const finish: { reason?: string } = {};
      calls++;
      const res = await deps.generate({ system, user, maxTokens: MAX_TOKENS, timeoutMs: TIMEOUT_MS, json: true, finish, diag });
      if (!res) return { kind: 'ai_down', reason: deps.explainDown(diag) };
      const raw = res.finishReason === 'length' || finish.reason === 'length' ? null : extractJson(res.text);
      if (!raw || typeof raw !== 'object') {
        lastProblem = res.finishReason === 'length' || finish.reason === 'length' ? 'The AI ran out of room and the answer was cut off.' : 'The AI did not return a readable answer.';
        continue;
      }
      return finishDraft(item, raw as Record<string, unknown>, res, calls, now());
    }
    return { kind: 'failed', reason: `${lastProblem} It was tried twice. Try again later or add this tool by hand.` };
  };
}

function finishDraft(
  item: { name: string; category: string; groupName: string | null; slug: string },
  raw: Record<string, unknown>,
  res: GenerateResult,
  calls: number,
  at: Date,
): DraftOutcome {
  const confidence = typeof raw.confidence === 'string' ? raw.confidence : 'unknown';
  const concerns = Array.isArray(raw.concerns) ? raw.concerns.filter((c): c is string => typeof c === 'string').slice(0, 8) : [];
  // The list is the authority on identity; the AI is the authority on content. It is never allowed to claim an originator or year.
  const forced = {
    ...raw,
    slug: item.slug,
    name: item.name,
    category: declarativeCategory(item.category, item.groupName),
    reference: { ...(typeof raw.reference === 'object' && raw.reference ? (raw.reference as object) : {}), originator: '', year: '' },
  };
  const { tool, issues } = normaliseDeclarative(forced);
  if (!tool) return { kind: 'failed', reason: 'The AI answer could not be read as a tool.' };
  tool.source = { draftedBy: 'ai', draftedAt: at.toISOString() };

  let gate = qualityGate(tool);
  const extraWarnings: string[] = [];
  // A bad worked example must not hold back an otherwise good tool: drop it, say so, and let the person add one.
  if (!gate.ok && tool.sample && gate.blockers.every((b) => b.startsWith('sample'))) {
    delete tool.sample;
    extraWarnings.push('The AI-written worked example had errors and was removed.');
    gate = qualityGate(tool);
  }
  // Warnings in normalise (for example "category set to other") that the gate does not repeat.
  for (const i of issues) if (i.level === 'warn' && !gate.warnings.some((w) => w.endsWith(i.message))) extraWarnings.push(`${i.path}: ${i.message}`);
  // The Eccellere Standards of Depth and Quality, applied to the structure. A draft far below the floor goes to review as an error.
  const standards = standardsCheck(tool);
  const errors = [...gate.blockers];
  if (standards.score < MIN_SCORE_TO_REVIEW) errors.push(`Standards: scored ${standards.score}/100 (${standards.band}); the Eccellere standard needs at least ${MIN_SCORE_TO_REVIEW} before review.`);
  for (const g of standardsGaps(standards)) extraWarnings.push(`Standards: ${g}`);
  if (confidence === 'low') extraWarnings.push('The AI said it is not sure this is the standard method. Check it against a trusted source.');
  for (const c of concerns) extraWarnings.push(`AI note: ${c}`);

  return {
    kind: 'ok',
    tool: {
      slug: item.slug,
      name: item.name,
      category: item.category,
      definition: tool,
      does: tool.does,
      whenToUse: tool.whenToUse,
      whenNotToUse: tool.whenNotToUse ?? null,
      groupName: item.groupName,
      quality: { errors, warnings: [...gate.warnings, ...extraWarnings], standards: { score: standards.score, level: standards.level, band: standards.band } },
      provenance: { draftedBy: 'ai', provider: res.provider, model: res.model, draftedAt: at.toISOString(), calls, confidence, finishReason: res.finishReason ?? null },
      source: 'ai',
    },
  };
}
