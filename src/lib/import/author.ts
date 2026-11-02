/**
 * import/author.ts — asks an AI to turn the text of one tool (from a deck, or from a short brief) into a declarative tool definition, and
 * checks what comes back before anything is saved. The AI call itself is injected (`CallJson`), so the same code runs with the real provider,
 * with a fake one in the tests, and in any app.
 *
 * What it guarantees:
 *  - The reply must be one JSON object that normalises into a DeclarativeTool and passes the quality gate; otherwise it is retried ONCE with the
 *    exact problems listed, and after that it is kept as "needs review" (a person fixes it) or "failed" (nothing usable), never published.
 *  - A reply cut off by the token limit is retried once asking for a shorter tool.
 *  - An originator or year the slide does not state stays blank. The tool is stamped as drafted by AI, with its slides and a hash of their text,
 *    so the same text is never drafted twice and a person can see where it came from.
 */
import { createHash } from 'node:crypto';
import { TOOL_CATEGORIES, normaliseDeclarative, type DeclarativeTool, type Issue } from '../strategyModels/declarative';

export interface AuthorInput {
  /** The tool's text from the deck, or a short brief typed by the admin. */
  text: string;
  nameHint?: string;
  categoryHint?: string;
  existingSlugs: readonly string[];
  /** The section's own stages, if it has them, so the tool can name one. */
  stages?: readonly string[];
}

/** The schema as the AI is shown it. Kept short on purpose: a long schema makes the reply long, and a cut-off reply is the commonest failure. */
export const SCHEMA_TEXT = `{
  "slug": "kebab-case-name", "name": "Tool name as the source calls it", "category": "${TOOL_CATEGORIES.join('|')}", "stage": "optional, one of the section's stages",
  "does": "one or two sentences: what the tool does", "whenToUse": "one sentence", "whenNotToUse": "optional, one honest sentence", "next": "optional: what its result feeds",
  "reference": { "originator": "ONLY if the source names it, else \\"\\"", "year": "ONLY if the source gives it, else \\"\\"", "summary": "what the tool is, in your own words", "caption": "one line under the diagram", "howToRead": ["2 to 4 short lines"] },
  "diagram": { "template": "matrix2x2|matrix3x3|steps|cycle|canvasGrid|scale", "title": "...", ...template fields... },
  "sections": [ { "key": "snake_case", "title": "...", "summary": "...", "parts": [
      { "kind": "field", "key": "snake_case", "label": "the tool's own element name", "type": "text|longtext|select|rating|number", "help": "what to enter (over 10 characters)", "example": "short generic example", "options": ["for select"], "scale": {"min":1,"max":5,"low":"...","high":"..."}, "unit": "for number" },
      { "kind": "table", "key": "snake_case", "label": "...", "help": "...", "rowLabel": "Row", "columns": [ { "key": "snake_case", "header": "...", "help": "...", "type": "text|longtext|number|select|rating|computed", "rule": {"op":"calc", ...} } ], "fixedRows": ["optional: the model's own rows"], "minRows": 3, "maxRows": 12 },
      { "kind": "table", ...as above with "columns": [] and "board": { "spec": {"layout":"regions|grid", "noteLabel":"idea", "noteColumn":"idea", "regionColumn":"group", "freeRegions":{"max":5}, "xColumn":"effort", "yColumn":"impact", "axes":{"x":{"label":"","low":"","high":""},"y":{"label":"","low":"","high":""}}, "quadrants":[{"name":"","xHigh":false,"yHigh":true}], "maxNoteChars":120}, "regions":["fixed region names"], "scale":{"min":1,"max":10} } } ] } ],
  "derived": [ { "key": "snake_case", "label": "...", "rule": RULE } ], "outputs": [ { "key": "snake_case", "label": "the conclusion others can build on", "rule": RULE } ],
  "analysisGuide": "how the verdict is reached (over 40 characters)",
  "sample": { "scenario": "one line, a fictional company", "values": {"field_key": "..."}, "tables": {"table_key": [{"column_key": "..."}]}, "why": {"part_key": "one line"} },
  "links": { "buildsOn": ["slug"], "feeds": ["slug"] }
}
RULE is one of: {"op":"calc","expr":EXPR,"format":"int|dp1|dp2|pct","suffix":""} | {"op":"weighted","table":"","value":"","weight":""} | {"op":"top","table":"","by":"","label":""} | {"op":"quadrant","x":EXPR,"y":EXPR,"midX":5,"midY":5,"names":["low-low","high-low","low-high","high-high"]} | {"op":"template","text":"{field_key}"} | {"op":"when","expr":EXPR,"gt":3,"then":"","else":""}
EXPR is a number, {"field":"key"}, {"cell":"column_key"} (inside a computed column), {"agg":"sum|avg|min|max|count","table":"key","col":"column_key"}, or {"add":[EXPR,...]}, {"mul":[...]}, {"sub":[EXPR,EXPR]}, {"div":[EXPR,EXPR]}.`;

export function buildAuthorMessages(input: AuthorInput): { system: string; user: string } {
  return {
    system: [
      'You turn the text describing ONE analytical or creative problem-solving tool into the definition of a workspace page where a person fills the tool in.',
      'Output ONLY one JSON object in the schema below. No markdown, no commentary, no code fences.',
      'RULES:',
      '1. Follow the source. Use the tool\'s own element names, in its own order, as the labels of the fields and rows. Do not add claims the source does not make; put everything in your own words.',
      '2. Never invent who created the tool or when: put an originator or year only if the source states it, otherwise leave them as empty strings.',
      '3. A 2x2 decision model is a grid board (a table with a "board" of layout "grid", two axes and four named quadrants) plus a matrix2x2 diagram with the same names. A list of causes under categories is a regions board. A fixed set of rows the model names goes in "fixedRows". A checklist or step list is a table or a set of fields.',
      '4. Every part needs help text over 10 characters; give text, select, rating and number fields a short generic example; a number needs a unit; a select needs at least 2 options; ratings default to 1 to 5 with words for the low and high ends.',
      '5. Anything computed (a score, a total, a quadrant, a top item) is a RULE, never prose. Use only the rule vocabulary. At least one output: the conclusion another tool could build on.',
      '6. Keep it compact: 1 to 3 sections, 4 to 10 parts. A short complete tool is better than a long one that is cut off.',
      '7. A sample is optional: include one only if the source gives enough for a realistic worked example, for a fictional company, with numbers that agree with your rules.',
      `Category: one of ${TOOL_CATEGORIES.join(', ')}.${input.stages?.length ? ` Stage: one of ${input.stages.join(', ')} (or omit).` : ''}`,
      `Slugs already taken (do not reuse): ${input.existingSlugs.slice(0, 200).join(', ') || '(none)'}.`,
      'SCHEMA:',
      SCHEMA_TEXT,
    ].join('\n'),
    user: `${input.nameHint ? `Tool: ${input.nameHint}\n` : ''}${input.categoryHint ? `Suggested category: ${input.categoryHint}\n` : ''}Source text:\n${input.text.slice(0, 12000)}\n\nWrite the JSON.`,
  };
}

export function parseDraft(raw: string, ctx: { existingSlugs?: string[] } = {}): { tool: DeclarativeTool | null; issues: Issue[]; parseError?: string } {
  let j: unknown;
  try { j = JSON.parse(raw); } catch { return { tool: null, issues: [], parseError: 'The reply was not valid JSON' }; }
  return normaliseDeclarative(j, ctx);
}

export type DraftStatus = 'draft' | 'needs_review' | 'failed';
export interface DraftResult { status: DraftStatus; tool: DeclarativeTool | null; issues: Issue[]; attempts: number; note?: string }
export type CallJson = (m: { system: string; user: string }) => Promise<{ content: string; finishReason: string | null }>;

export interface Candidate { name: string; text: string; slides: number[] }
export const slideHash = (text: string): string => createHash('sha256').update(text.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 32);

/**
 * Drafts one tool. At most two AI calls: the second only when the first was cut off or did not pass, and it says exactly what was wrong.
 */
export async function draftTool(call: CallJson, cand: Candidate, ctx: { existingSlugs: string[]; categoryHint?: string; stages?: readonly string[]; deck?: string; now?: () => string }): Promise<DraftResult> {
  const base = buildAuthorMessages({ text: cand.text, nameHint: cand.name, categoryHint: ctx.categoryHint, existingSlugs: ctx.existingSlugs, stages: ctx.stages });
  let extra = '';
  let last: { tool: DeclarativeTool | null; issues: Issue[]; parseError?: string } = { tool: null, issues: [] };
  for (let attempt = 1; attempt <= 2; attempt++) {
    let reply: { content: string; finishReason: string | null };
    try { reply = await call({ system: base.system, user: base.user + extra }); }
    catch (e) { return { status: 'failed', tool: null, issues: [], attempts: attempt, note: e instanceof Error ? e.message : 'The AI call failed' }; }
    if (reply.finishReason === 'length') { extra = '\n\nYour previous reply was cut off. Write a MORE COMPACT tool: fewer parts, shorter text, no sample.'; last = { tool: null, issues: [], parseError: 'The reply was cut off' }; continue; }
    last = parseDraft(reply.content, { existingSlugs: ctx.existingSlugs });
    const blockers = last.issues.filter((i) => i.level === 'error');
    if (last.tool && !blockers.length) break;
    extra = `\n\nYour previous reply had these problems; fix them and return the whole JSON again:\n${last.parseError ?? blockers.slice(0, 8).map((i) => `- ${i.path}: ${i.message}`).join('\n')}`;
  }
  const blockers = last.issues.filter((i) => i.level === 'error');
  if (!last.tool) return { status: 'failed', tool: null, issues: last.issues, attempts: 2, note: last.parseError ?? 'Nothing usable came back' };
  const tool: DeclarativeTool = { ...last.tool, source: { deck: ctx.deck, slides: cand.slides, hash: slideHash(cand.text), draftedBy: 'ai', draftedAt: (ctx.now ?? (() => new Date().toISOString()))() } };
  return { status: blockers.length ? 'needs_review' : 'draft', tool, issues: last.issues, attempts: blockers.length ? 2 : (extra ? 2 : 1) };
}

export const planBatches = <T,>(items: readonly T[], size: number): T[][] => (items.length ? Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size)) : []);

/** What a run will cost in AI calls, said before it starts (one to group the slides, one per tool, and up to one retry each). */
export function estimate(tools: number, opts: { grouping?: boolean } = {}): { minCalls: number; maxCalls: number; text: string } {
  const g = opts.grouping ? Math.max(1, Math.ceil(tools / 60)) : 0;
  return { minCalls: tools + g, maxCalls: tools * 2 + g, text: `${tools} tools: ${tools + g} to ${tools * 2 + g} AI calls${g ? `, including ${g} to group the slides` : ''}.` };
}
