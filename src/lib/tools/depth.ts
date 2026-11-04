/**
 * The standard depth for each type of asset, and a plain-words list of what a given tool is still missing.
 *
 * This sits on top of the general quality gate and the Eccellere standards score (`standards.ts`): those say whether a page is sound;
 * this says whether it is DEEP ENOUGH FOR WHAT IT IS. A survey needs scored dimensions and a way to read the result; a toolkit needs a
 * diagnosis, a prioritisation and an action plan; a desk tool needs inputs, working and results. Structure only: it cannot tell whether
 * the content is true, and a person still reviews that. Pure code.
 */
import type { DeclarativeTool, DeclTable } from '@/lib/strategyModels/declarative';
import { actionPlanTable } from './standards';
import { assetTypeLabel, type AssetTypeId } from './taxonomy';

export interface DepthCheck { id: string; label: string; ok: boolean; fix: string }
export interface DepthResult { type: AssetTypeId; score: number; checks: DepthCheck[]; gaps: string[] }

const len = (s: string | undefined) => (s ?? '').trim().length;

function facts(t: DeclarativeTool) {
  const parts = t.sections.flatMap((s) => s.parts);
  const fields = parts.filter((p) => p.kind === 'field');
  const tables = parts.filter((p): p is DeclTable => p.kind === 'table');
  const cols = tables.flatMap((x) => x.columns);
  const ratings = fields.filter((f) => f.kind === 'field' && f.type === 'rating').length + cols.filter((c) => c.type === 'rating').length;
  const choices = fields.filter((f) => f.kind === 'field' && f.type === 'select').length + cols.filter((c) => c.type === 'select').length;
  const numbers = fields.filter((f) => f.kind === 'field' && f.type === 'number').length + cols.filter((c) => c.type === 'number').length;
  const computed = cols.filter((c) => c.type === 'computed').length;
  const rules = [...(t.derived ?? []).map((d) => d.rule), ...(t.outputs ?? []).map((o) => o.rule), ...cols.map((c) => c.rule).filter((r): r is NonNullable<typeof r> => !!r)];
  return { fields, tables, ratings, choices, numbers, computed, rules, text: JSON.stringify(t.sections).toLowerCase() };
}

function commonChecks(t: DeclarativeTool): DepthCheck[] {
  return [
    { id: 'purpose', label: 'Says what it does, when to use it and when not to', ok: len(t.does) >= 40 && len(t.whenToUse) >= 40 && len(t.whenNotToUse) >= 20, fix: 'Write a clear "what it does", "when to use it" and "when not to use it".' },
    { id: 'guide', label: 'Explains how to read the result', ok: len(t.analysisGuide) >= 300, fix: 'Write a longer guide on how to read the result and what to do next (at least a short paragraph per outcome).' },
    { id: 'sample', label: 'Has a worked example', ok: !!t.sample, fix: 'Add a worked example with realistic, clearly fictional values.' },
    { id: 'diagram', label: 'Has a picture of the method', ok: !!t.diagram, fix: 'Add a diagram that shows the method.' },
    { id: 'next', label: 'Says what to do next', ok: len(t.next) >= 20, fix: 'Say what to do after finishing this, and which tool to use next.' },
  ];
}

export function checksFor(type: AssetTypeId, t: DeclarativeTool): DepthCheck[] {
  const f = facts(t);
  const common = commonChecks(t);
  if (type === 'survey') {
    const scored = f.ratings + f.choices;
    return [
      { id: 'dimensions', label: 'Questions grouped in at least 3 dimensions', ok: t.sections.filter((s) => s.parts.length > 0).length >= 3, fix: 'Group the questions into at least three clear dimensions (sections) that do not overlap.' },
      { id: 'questions', label: 'At least 12 scored questions', ok: scored >= 12, fix: 'Add scored questions until there are at least 12, spread across the dimensions, one idea per question.' },
      { id: 'scale', label: 'A defined answer scale', ok: f.ratings > 0 || f.choices >= 6, fix: 'Use a rating scale with a named low and high end, the same for all questions in a dimension.' },
      { id: 'profile', label: 'Asks who is answering (role, team or site)', ok: f.fields.some((x) => x.kind === 'field' && (x.type === 'select' || x.type === 'text') && /role|team|site|department|function|location|unit|level/.test(`${x.key} ${x.label}`.toLowerCase())), fix: 'Add two or three profile questions (for example role, team, site) so results can be cut and compared.' },
      { id: 'scoring', label: 'Works out a score per dimension and overall', ok: f.rules.some((r) => r.op === 'calc' || r.op === 'weighted') && (t.outputs?.length ?? 0) + (t.derived?.length ?? 0) >= 2, fix: 'Add a score for each dimension and an overall score, worked out from the answers.' },
      { id: 'bands', label: 'Turns the score into a reading (bands)', ok: f.rules.some((r) => r.op === 'when') || /band|low|high|stage|level|score of/.test(t.analysisGuide.toLowerCase()), fix: 'Add score bands (for example low, developing, strong) with what each means and what to do.' },
      { id: 'open', label: 'Has at least one open question for comments', ok: f.fields.some((x) => x.kind === 'field' && x.type === 'longtext'), fix: 'Add one open question for comments, so the survey captures what the scale cannot.' },
      ...common,
    ];
  }
  if (type === 'toolkit') {
    return [
      { id: 'stages', label: 'Moves through at least 4 steps (context, evidence, analysis, actions)', ok: t.sections.length >= 4, fix: 'Structure it as steps: context, evidence gathered, analysis, and actions, in that order.' },
      { id: 'evidence', label: 'Collects evidence in a table', ok: f.tables.some((x) => x.columns.length >= 3), fix: 'Add an evidence table with at least three columns (finding, evidence or source, impact).' },
      { id: 'prioritise', label: 'Ranks or scores what it finds', ok: f.rules.some((r) => r.op === 'weighted' || r.op === 'top' || r.op === 'quadrant') || f.computed > 0, fix: 'Rank the findings with a score (for example impact times effort) so the biggest issue comes first.' },
      { id: 'results', label: 'Shows at least two results at a glance', ok: (t.outputs?.length ?? 0) + (t.derived?.length ?? 0) >= 2, fix: 'Add at least two results that summarise the diagnosis (for example the top issue and the total impact).' },
      { id: 'actions', label: 'Ends in an action plan with owners and dates', ok: !!actionPlanTable(t), fix: 'Add an action plan table: action, owner role, when, and how success is measured.' },
      ...common,
      { id: 'links', label: 'Points to related tools', ok: (t.links?.buildsOn?.length ?? 0) + (t.links?.feeds?.length ?? 0) > 0, fix: 'Name the tools that come before and after this one.' },
    ];
  }
  return [
    { id: 'inputs', label: 'Takes in at least 4 inputs', ok: f.numbers + f.fields.length >= 4, fix: 'Add the inputs the person needs to enter, each with a unit and an example.' },
    { id: 'working', label: 'Does real working (calculations or rules)', ok: f.rules.length >= 2 || f.computed >= 1, fix: 'Add the calculation or rule that turns the inputs into a result, shown step by step.' },
    { id: 'results', label: 'Gives at least two clear results', ok: (t.outputs?.length ?? 0) + (t.derived?.length ?? 0) >= 2, fix: 'Add at least two results (for example the total and the verdict), each in plain words.' },
    { id: 'assumptions', label: 'States the assumptions', ok: /assumption/.test(f.text) || t.sections.some((s) => /assumption/.test(`${s.title} ${s.summary}`.toLowerCase())), fix: 'Add an assumptions section so every number can be challenged.' },
    ...common.filter((c) => c.id !== 'diagram'),
  ];
}

/** Scores a tool against the depth standard of its type. `score` is the share of checks met, out of 100. */
export function depthOf(type: AssetTypeId, t: DeclarativeTool): DepthResult {
  const checks = checksFor(type, t);
  const ok = checks.filter((c) => c.ok).length;
  return { type, score: Math.round((100 * ok) / checks.length), checks, gaps: checks.filter((c) => !c.ok).map((c) => c.fix) };
}

/** Depth the team treats as finished. */
export const DEEP_ENOUGH = 85;

/** The instruction handed to the existing "Modify with AI" step to bring a tool up to its type's depth. */
export function enrichInstruction(type: AssetTypeId, gaps: readonly string[], ctx: { areas?: readonly string[]; sectors?: readonly string[] } = {}): string {
  const lines = [
    `Raise this page to the standard depth for a "${assetTypeLabel(type)}" asset. Keep the name, the category and every existing field key. Add or improve only what is listed:`,
    ...gaps.slice(0, 10).map((g) => `- ${g}`),
    ctx.areas?.length ? `Business area: ${ctx.areas.join(', ')}. Use the vocabulary a head of that function would use.` : '',
    ctx.sectors?.length ? `Sector: ${ctx.sectors.join(', ')}. Use examples and terms from that sector.` : 'Keep it sector-neutral.',
    'Rules: do not invent benchmarks, statistics or figures; any numbers in the worked example must be clearly fictional; do not name an originator or year; keep it simple, one idea per question, no overlap between sections.',
  ];
  return lines.filter(Boolean).join('\n');
}
