/**
 * The Eccellere Standards of Depth and Quality (Eccellere_Standards_of_Depth_and_Quality_SKILL.md, sections 9 and 11) applied to a
 * tool definition. This is the structural part of the Lite-Tool Test: what a program can check about a tool without judging whether it
 * is true. A person still reviews accuracy; this makes sure no tool reaches that review (or a client) as a lite form.
 *
 * The score is out of 100. L2 ("Focused tool", section 2.3) needs 75 or more AND an action plan. Below 60 is "major rework" (an error).
 */
import type { DeclTable, DeclarativeTool } from '@/lib/strategyModels/declarative';

export interface StandardsItem { id: string; label: string; points: number; earned: number; hint: string }
export interface StandardsResult { score: number; level: 'L0' | 'L1' | 'L2'; band: 'Publish-ready' | 'Near-ready' | 'Needs work' | 'Major rework' | 'Not ready'; items: StandardsItem[] }

export const MIN_SCORE_TO_REVIEW = 60;
export const L2_SCORE = 75;

const len = (s: string | undefined) => (s ?? '').trim().length;
const tables = (t: DeclarativeTool): DeclTable[] => t.sections.flatMap((s) => s.parts.filter((p): p is DeclTable => p.kind === 'table'));
const allParts = (t: DeclarativeTool) => t.sections.flatMap((s) => s.parts);

/** A table that works as the 30/60/90 action plan: actions with an owner role, and a measure or a time. */
export function actionPlanTable(t: DeclarativeTool): DeclTable | null {
  for (const s of t.sections) {
    for (const p of s.parts) {
      if (p.kind !== 'table' || p.board) continue;
      const heads = p.columns.map((c) => `${c.key} ${c.header}`.toLowerCase());
      const hasOwner = heads.some((h) => /(owner|responsible|who)\b/.test(h));
      const hasWhen = heads.some((h) => /(when|horizon|by\b|date|days|deadline)/.test(h));
      const hasMeasure = heads.some((h) => /(measure|kpi|metric|success)/.test(h));
      const named = /(action|plan|roadmap|next step|30)/i.test(`${s.title} ${p.label} ${p.key}`);
      if (p.columns.length >= 3 && hasOwner && (hasWhen || hasMeasure) && named) return p;
    }
  }
  return null;
}

export function standardsCheck(t: DeclarativeTool): StandardsResult {
  const parts = allParts(t);
  const fields = parts.filter((p) => p.kind === 'field');
  const nonLong = fields.filter((f) => f.kind === 'field' && f.type !== 'longtext');
  const tbls = tables(t);
  const helpOk = parts.length > 0 && parts.every((p) => len(p.help) >= 40);
  const exampleOk = nonLong.length === 0 || nonLong.every((f) => f.kind === 'field' && len(f.example) > 0);
  const colHelpOk = tbls.every((tb) => tb.board || tb.columns.every((c) => len(c.help) >= 12));
  const plan = actionPlanTable(t);
  const lastIsAction = t.sections.length > 0 && !!plan && t.sections[t.sections.length - 1].parts.includes(plan);
  const hasComputation = (t.derived?.length ?? 0) > 0 || (t.outputs ?? []).some((o) => o.rule.op !== 'template') || tbls.some((tb) => tb.columns.some((c) => c.type === 'computed'));

  const item = (id: string, label: string, points: number, ok: boolean | number, hint: string): StandardsItem => ({
    id, label, points, earned: typeof ok === 'number' ? Math.round(points * Math.max(0, Math.min(1, ok))) : ok ? points : 0, hint,
  });
  const items: StandardsItem[] = [
    item('route', 'Route: what it decides, when to use it, when not to', 10, len(t.does) >= 40 && len(t.whenToUse) >= 30 && len(t.whenNotToUse) >= 30, 'State what decision the tool enables, when to use it and when not to (skill 9.2 item 1).'),
    item('intake', 'Context intake before the method', 10, t.sections.length >= 3 && t.sections[0].parts.length >= 1, 'Open with a section that captures the situation, objective and constraints (9.2 item 2).'),
    item('depth', 'Enough substance to do the work (6 or more inputs, a table for anything repeating)', 15, Math.min(1, parts.length / 6) * (tbls.length ? 1 : 0.6), 'Add the inputs the method really needs, and a table for repeating items (2.1, symptoms 3 and 4).'),
    item('help', 'Every input says what to write and why we ask', 10, helpOk && colHelpOk, 'Make each help line a full sentence: what to enter, what good looks like, why it matters (9.3).'),
    item('examples', 'Realistic examples on every short answer', 5, exampleOk, 'Add an example to each text, select, rating and number field (9.3).'),
    item('calc', 'A shown calculation or score where the method has one', 10, hasComputation, 'Add a computed column, a derived figure or a ranked output; no hidden maths (9.6, 5.2).'),
    item('interpret', 'Guidance on how to read the result, warning signs and what to recommend', 10, len(t.analysisGuide) >= 200, 'Write the analysis guide as 3 to 6 sentences: what to look for, red flags, what to recommend (9.2 item 6).'),
    item('plan', 'An action plan with owner roles, measures and timing', 15, !!plan && (lastIsAction ? true : 0.8), 'End with a table of actions: action, owner (a role), measure, and 30/60/90 horizon (9.2 item 8).'),
    item('next', 'A named next step', 5, len(t.next) >= 15, 'Say which tool or action comes next and why (9.2 item 10).'),
    item('diagram', 'A diagram of the method', 5, !!t.diagram, 'Choose the diagram template that truly fits, or leave it out only if none does.'),
    item('example', 'A worked example', 5, !!t.sample, 'A short fictional example, clearly labelled, helps first-time users.'),
  ];
  const score = items.reduce((a, i) => a + i.earned, 0);
  const band = score >= 90 ? 'Publish-ready' : score >= 75 ? 'Near-ready' : score >= 60 ? 'Needs work' : score >= 40 ? 'Major rework' : 'Not ready';
  const level = score >= L2_SCORE && !!plan ? 'L2' : score >= MIN_SCORE_TO_REVIEW ? 'L1' : 'L0';
  return { score, level, band, items };
}

/** Plain-language lines for the review screen: only what fell short. */
export function standardsGaps(r: StandardsResult): string[] {
  return r.items.filter((i) => i.earned < i.points).map((i) => `${i.label} (${i.earned}/${i.points}). ${i.hint}`);
}
