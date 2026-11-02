/**
 * defs/execution.ts — the frameworks that turn the plan into what people do: STP (segmentation, targeting, positioning),
 * the 9-box talent grid, OKRs down to individual KRAs, and the First 90 Days plan.
 *
 * Each definition follows the published model — its elements, in its order, under its names — and says in `help` what the
 * originator says belongs in each. Examples are placeholders; the worked examples live in samples/execution.ts.
 */
import { col, long, section, select, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, Row } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];
const filled = (v: ModelValues, key: string): string | null => v.fields[key]?.trim() || null;
const lines = (s: string | undefined): string[] => (s ?? '').split(/[\n;]+/).map((x) => x.replace(/^[\s•*-]+/, '').trim()).filter(Boolean);
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

// ── STP: segmentation, targeting, positioning ────────────────────────────────

const SEGMENT_CRITERIA = ['size', 'growth', 'reach', 'fit', 'room'] as const;
/** A segment's score: the five ratings added up (out of 25). Null until all five are given. */
function segmentScore(r: Row): number | null {
  const n = SEGMENT_CRITERIA.map((k) => toNum(r[k]));
  return n.every((x): x is number => x !== null) ? n.reduce((a, b) => a + b, 0) : null;
}
const scoredSegments = (v: ModelValues): { name: string; score: number }[] =>
  rows(v, 'segments').flatMap((r) => { const s = segmentScore(r); return r.segment?.trim() && s !== null ? [{ name: r.segment.trim(), score: s }] : []; });
/** Rank by score; segments with the same score share a rank. */
function segmentRank(r: Row, v: ModelValues): string {
  const s = segmentScore(r);
  return s === null || !r.segment?.trim() ? '' : String(scoredSegments(v).filter((x) => x.score > s).length + 1);
}
const topSegment = (v: ModelValues): { name: string; score: number } | null => scoredSegments(v).sort((a, b) => b.score - a.score)[0] ?? null;
const same = (a: string, b: string): boolean => { const x = a.toLowerCase().trim(), y = b.toLowerCase().trim(); return !!x && !!y && (x.includes(y) || y.includes(x)); };
/** Moore's positioning statement, put together from its six parts; null until at least four are given. */
function positioningStatement(v: ModelValues): string | null {
  const g = (k: string) => v.fields[k]?.trim() ?? '';
  const [t, n, c, b, a, r] = ['target_customers', 'need', 'category', 'benefit', 'alternative', 'reason_to_believe'].map(g);
  if ([t, n, c, b, a, r].filter(Boolean).length < 4) return null;
  return `For ${t || '…'} who ${n || '…'}, we are ${c || '…'} that ${b || '…'}. Unlike ${a || '…'}, ${r || '…'}.`;
}

const stp: ModelDefinition = {
  toolId: 'stp',
  reference: {
    originator: 'Wendell Smith (market segmentation, 1956), Philip Kotler (segmentation, targeting, positioning), Al Ries and Jack Trout (positioning, 1981) and Geoffrey Moore (the positioning statement, 1991)',
    year: '1956–1991',
    summary: 'A business cannot be the best choice for everyone. STP asks three questions in order: how can the market be divided into groups that want different things (segmentation), which of those groups will you serve (targeting), and what place do you want to hold in their minds against the alternatives (positioning).',
    caption: 'Divide the market, choose where to compete, then own a place in the customer’s mind that rivals do not hold.',
    howToRead: [
      'Split the market by what makes buyers behave differently — who they are, how they buy and what they need — then score each segment on its size, growth, how easy it is to reach, how well it fits you and how open it is.',
      'Choose a target on the scores, and say plainly which segments you will not pursue and why.',
      'Write the positioning statement for the target: who they are, what they need, what you are, the one benefit that matters and the proof that makes it believable. Then check that the proof is true today.',
    ],
  },
  sections: [
    section('market', 'The market', 'The kind of customer, and how the market can be divided.',
      select('customer_type', 'Customer type', 'Who the customers are: businesses (B2B), consumers (B2C), consumers reached through a business (B2B2C) or government and institutions (B2G).', ['B2B', 'B2C', 'B2B2C', 'B2G'], 'B2B', { prefill: 'business_context' }),
      long('segmentation_basis', 'How the market is divided', 'The bases that make buyers behave differently: who they are (industry, size, region), how they buy (volume, process, loyalty) and what they need (benefits sought).', 'By OEM type and by programme: established OEM or EV start-up; high-volume machined or low-volume welded')),
    section('segments', 'Segmentation: the segments', 'One row per segment. Score each from 1 to 5 on the five tests; the score and the rank are worked out for you.',
      table('segments', 'Segments and how attractive each is', 'Three to eight segments. A high number is always good: a large, growing, reachable segment that fits you and is not crowded scores 25.', 'Segment', [
        col.text('segment', 'Segment', 'A group of customers who want the same thing and behave alike.'),
        col.long('needs', 'What it needs and buys on', 'What this group wants and what decides its choice of supplier.'),
        col.rating('size', 'Size', 'How big the segment is for you.', { low: 'small', high: 'large' }),
        col.rating('growth', 'Growth', 'How fast the segment is growing.', { low: 'shrinking', high: 'fast growing' }),
        col.rating('reach', 'Reach', 'How easy it is to reach and serve the segment.', { low: 'hard to reach', high: 'easy to reach' }),
        col.rating('fit', 'Fit', 'How well the segment fits your strengths and what you can deliver.', { low: 'poor fit', high: 'strong fit' }),
        col.rating('room', 'Room', 'How much room there is: few strong rivals scores high, a crowded segment scores low.', { low: 'crowded', high: 'open' }),
        col.computed('score', 'Score (of 25)', 'The five ratings added up.', (r) => { const s = segmentScore(r); return s === null ? '' : String(s); }),
        col.computed('rank', 'Rank', 'Position among the scored segments; equal scores share a rank.', (r, v) => segmentRank(r, v)),
      ], { min: 3, max: 8, example: { segment: 'Established OEMs — welded brackets', size: '4', growth: '4', reach: '4', fit: '5', room: '3' } })),
    section('targeting', 'Targeting: where to compete', 'The segment you will serve, and the ones you will not.',
      text('target', 'Target segment', 'The segment (or segments) you will serve first, named as in the table. It should be one of the top-scoring ones, or you should say why not.', 'Established OEMs — welded brackets'),
      long('target_why', 'Why this target', 'The reasons, with the scores and the facts behind them.', 'It scores highest; the market is growing and the engineering team fits'),
      long('not_targeting', 'Segments you will not pursue', 'The segments left alone for now, and why — focus is the point of targeting.', 'Tier-1 overflow work would pull capacity from the bracket line'),
      text('decision_owner', 'Who decides the target and the position', 'The person accountable for the choice. The RACI chart shows who that is.', 'Sales Head, signed off by the MD', { prefill: { upstream: 'raci', output: 'accountable_owners' } })),
    section('positioning', 'Positioning: the place to own', 'The positioning statement, in six short parts, and the position in one line.',
      text('target_customers', 'Target customers', 'Completes “For …”: the customers, as specifically as you can.', 'OEM programme and sourcing managers in chassis components'),
      text('need', 'Their need', 'Completes “who …”: the need or opportunity, starting with a verb.', 'need welded brackets that pass approval first time'),
      text('category', 'What we are', 'Completes “we are …”: the frame of reference you want them to put you in, with “a” or “an”.', 'an IATF 16949 chassis-bracket specialist'),
      text('benefit', 'The main benefit', 'Completes “that …”: the one benefit that gives the compelling reason to buy.', 'cuts approval time and rework'),
      text('alternative', 'The alternative they use today', 'Completes “Unlike …”: what the customer would otherwise do or buy.', 'general fabricators and large Tier-1 suppliers'),
      text('reason_to_believe', 'Why we are different, and the proof', 'Completes the last sentence: what makes the position believable, in a clause that could be checked.', 'we have the engineering team and a certified line built for brackets'),
      text('chosen_position', 'Chosen position', 'The place you want to own in the customer’s mind, in a few words.', 'The bracket partner that gets it right first time'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'top',
      label: 'Top-scoring segment',
      compute: (v) => { const t = topSegment(v); return t ? `${t.name} (${t.score} of 25)` : null; },
    },
    {
      key: 'target_check',
      label: 'Does the target follow the scores?',
      compute: (v) => { const t = topSegment(v), target = filled(v, 'target'); return t && target ? (same(target, t.name) ? 'The target is the top-scoring segment' : `The target is not the top-scoring segment — ${t.name} is`) : null; },
      tone: (v) => { const t = topSegment(v), target = filled(v, 'target'); return t && target ? (same(target, t.name) ? 'good' : 'warn') : undefined; },
    },
    {
      key: 'statement',
      label: 'The positioning statement',
      help: 'Put together from the six parts. Read it aloud: if it does not make sense, a part is wrong.',
      compute: (v) => positioningStatement(v),
    },
  ],
  outputs: [
    { key: 'target_segment', label: 'The target segment', compute: (v) => filled(v, 'target') },
    { key: 'positioning_statement', label: 'The positioning statement', compute: (v) => positioningStatement(v) },
    { key: 'chosen_position', label: 'The chosen position', compute: (v) => filled(v, 'chosen_position') },
    {
      key: 'segments_ranked',
      label: 'The segments, ranked',
      compute: (v) => { const s = scoredSegments(v).sort((a, b) => b.score - a.score); return s.length ? s.map((x, i) => `${i + 1}. ${x.name} (${x.score} of 25)`).join('\n') : null; },
    },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is whether the business has chosen a segment on evidence and can honestly claim the position it has written. Use the scores, the ranks and the positioning statement as worked out from the answers; never recompute them. Check that the segments are different groups of buyers who want different things (not product lines), that the ratings are justified, that the target follows the top scores or says why it does not, that the not-pursued list is real, and that the positioning statement has one benefit, a named alternative and proof that is true today. ' +
    'The commonest failure is a position the business cannot yet prove: compare each claim with the facts in the earlier tools (quality, delivery, cost) and say which claim is not yet supported.',
};

// ── 9-box talent grid ────────────────────────────────────────────────────────

const LEVELS = ['Low', 'Moderate', 'High'] as const;
type Level = (typeof LEVELS)[number];
/** Potential (up) by performance (across): the nine boxes and their usual names. */
const BOXES: Record<Level, Record<Level, string>> = {
  High: { Low: 'Enigma', Moderate: 'Growth employee', High: 'Star' },
  Moderate: { Low: 'Dilemma', Moderate: 'Core player', High: 'High performer' },
  Low: { Low: 'Underperformer', Moderate: 'Effective', High: 'Trusted professional' },
};
const TOP_BOXES = ['Star', 'Growth employee', 'High performer'];
const ATTENTION_BOXES = ['Enigma', 'Dilemma', 'Underperformer'];
const boxOf = (r: Row): string => BOXES[r.potential as Level]?.[r.performance as Level] ?? '';
const peopleRows = (v: ModelValues): Row[] => rows(v, 'people').filter((r) => r.person?.trim());
const placed = (v: ModelValues): Row[] => peopleRows(v).filter((r) => boxOf(r));
const inBoxes = (v: ModelValues, names: readonly string[]): Row[] => placed(v).filter((r) => names.includes(boxOf(r)));
const withRole = (r: Row): string => (r.role?.trim() ? `${r.person.trim()} (${r.role.trim()})` : r.person.trim());
const atRisk = (v: ModelValues): Row[] => inBoxes(v, TOP_BOXES).filter((r) => r.retention_risk === 'High');

const ninebox: ModelDefinition = {
  toolId: 'ninebox',
  reference: {
    originator: 'The nine-box grid of performance and potential, developed at McKinsey & Company for General Electric and used in talent reviews and succession planning ever since',
    year: '1970s',
    summary: 'Places each person on two scales — how well they perform now, and how much further they could grow — to give nine boxes that call for different actions: promote and stretch the stars, keep and reward the solid performers, find out what is behind the enigmas, and deal with underperformance.',
    caption: 'Performance runs across, potential runs up. The top right is where the next leaders are; the bottom left is where action is needed.',
    howToRead: [
      'Rate each person’s performance over the last two review periods against what was agreed, and their potential on how fast they learn and how much bigger a role they could carry — on evidence, not impressions.',
      'Read the box, then the action it calls for: stretch and succession for the top boxes, development and recognition for the middle, a conversation for the enigmas and a plan for underperformance.',
      'Check the top boxes for retention risk and the critical roles for a ready successor. Calibrate with others, and never hand a person their box as a label.',
    ],
  },
  sections: [
    section('cohort', 'The review', 'Who was reviewed, and how the ratings were made.',
      text('cohort', 'Review cohort', 'The group reviewed: a function, a plant, a grade, with the number of people and the period.', 'Supervisors and engineers, eight people, half-yearly review'),
      long('evidence', 'How performance and potential were judged', 'The evidence for each scale: results against agreed goals for performance; learning speed, range and drive for potential. Written, so the ratings can be challenged.', 'Performance: the last two quarters against key results. Potential: judged by the head and a peer on learning speed and appetite for bigger roles'),
      long('calibration', 'Who calibrated the ratings, and when', 'Ratings made by one manager are usually too kind or too harsh; say who compared them across the group.', 'The four heads and the HR Lead, in one meeting in March')),
    section('people', 'The people', 'One row per person. Rate performance and potential; the box is worked out for you.',
      table('people', 'People, performance and potential', 'Performance and potential are each low, moderate or high. The box and its name are worked out for you.', 'Person', [
        col.text('person', 'Person', 'The person’s name.'),
        col.text('role', 'Role', 'Their current role.'),
        col.select('performance', 'Performance', 'How well they perform now against what was agreed.', LEVELS),
        col.select('potential', 'Potential', 'How much further they could grow — into a bigger or a different role.', LEVELS),
        col.select('retention_risk', 'Risk of leaving', 'How likely it is that they will leave in the next year.', LEVELS),
        col.computed('box', 'Box', 'The box on the grid, from performance and potential.', (r) => boxOf(r)),
        col.long('action', 'Action', 'What to do: the stretch, the development, the succession role or the conversation.'),
      ], { min: 4, max: 15, example: { person: 'Meena Joshi', role: 'Quality engineer', performance: 'High', potential: 'High', retention_risk: 'Medium' } })),
    section('succession', 'Succession', 'The roles that matter, and who could fill them.',
      long('critical_roles', 'Critical roles and who could fill them', 'The roles the business cannot do without, and whether each has someone ready, someone nearly ready, or nobody.', 'Line 2 supervisor: nobody ready; Quality Head’s deputy: one candidate nearly ready'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'distribution',
      label: 'Where the people are',
      compute: (v) => (placed(v).length ? `Top boxes ${inBoxes(v, TOP_BOXES).length} · Middle ${placed(v).length - inBoxes(v, TOP_BOXES).length - inBoxes(v, ATTENTION_BOXES).length} · Needs attention ${inBoxes(v, ATTENTION_BOXES).length}` : null),
    },
    {
      key: 'stars',
      label: 'Stars',
      compute: (v) => (placed(v).length ? inBoxes(v, ['Star']).map((r) => r.person.trim()).join(', ') || 'None yet' : null),
    },
    {
      key: 'at_risk',
      label: 'Top-box people at high risk of leaving',
      help: 'The people you can least afford to lose.',
      compute: (v) => (placed(v).length ? atRisk(v).map((r) => `${r.person.trim()} (${boxOf(r)})`).join(', ') || 'None' : null),
      tone: (v) => (placed(v).length ? (atRisk(v).length ? 'warn' : 'good') : undefined),
    },
    {
      key: 'attention',
      label: 'Needing a conversation or a plan',
      compute: (v) => (placed(v).length ? inBoxes(v, ATTENTION_BOXES).map((r) => `${r.person.trim()} (${boxOf(r)})`).join(', ') || 'None' : null),
    },
  ],
  outputs: [
    {
      key: 'high_potentials',
      label: 'The high-potential people',
      compute: (v) => { const h = placed(v).filter((r) => r.potential === 'High' && (r.performance === 'Moderate' || r.performance === 'High')); return h.length ? h.map(withRole).join(', ') : null; },
    },
    { key: 'succession_risks', label: 'Top-box people at high risk of leaving', conditional: true, compute: (v) => (atRisk(v).length ? atRisk(v).map((r) => withRole(r)).join(', ') : null) },
    {
      key: 'development_actions',
      label: 'The development and succession actions',
      compute: (v) => { const a = peopleRows(v).filter((r) => r.action?.trim()).map((r) => `${r.person.trim()}: ${r.action.trim()}`); return a.length ? a.join('\n') : null; },
    },
    {
      key: 'distribution',
      label: 'Where the people are on the grid',
      compute: (v) => (placed(v).length ? `Top boxes ${inBoxes(v, TOP_BOXES).length} · Middle ${placed(v).length - inBoxes(v, TOP_BOXES).length - inBoxes(v, ATTENTION_BOXES).length} · Needs attention ${inBoxes(v, ATTENTION_BOXES).length}` : null),
    },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is whether the business has a bench it can build on, where it is at risk of losing it, and what to do for each box. Use the boxes, the distribution and the retention risks as worked out from the ratings; never re-rate anyone. Check that the ratings rest on written evidence and were calibrated, that potential is not just performance in disguise, that the top boxes carry named stretch and succession actions, and that every critical role has a successor. ' +
    'Name the person in a top box with the highest risk of leaving, the critical role with nobody ready, and one conversation to have (usually the enigma). Never recommend telling people their box.',
};

// ── OKRs → individual KRAs ───────────────────────────────────────────────────

const KR_REFS = ['KR 1', 'KR 2', 'KR 3', 'KR 4', 'KR 5', 'KR 6'] as const;
/** Progress from the start to the target, as a percentage held between 0 and 100; works for a target that is lower than the start. */
function progressOf(r: Row): number | null {
  const s = toNum(r.start), t = toNum(r.target), c = toNum(r.current);
  if (s === null || t === null || c === null) return null;
  if (t === s) return c === t ? 100 : 0;
  return Math.max(0, Math.min(100, ((c - s) / (t - s)) * 100));
}
/** The key results that have been written, each with its number — its position in the table, so “KR 2” is always the second row. */
const krRows = (v: ModelValues): { row: Row; n: number }[] => rows(v, 'krs').flatMap((row, i) => (row.kr?.trim() ? [{ row, n: i + 1 }] : []));
const lowConfidence = (v: ModelValues): { row: Row; n: number }[] => krRows(v).filter(({ row }) => { const c = toNum(row.confidence); return c !== null && c <= 2; });
const uncovered = (v: ModelValues): string[] => {
  const covered = new Set(rows(v, 'kras').filter((r) => r.person?.trim()).map((r) => r.supports));
  return krRows(v).map(({ n }) => `KR ${n}`).filter((k) => !covered.has(k));
};

const okrs: ModelDefinition = {
  toolId: 'okrs',
  reference: {
    originator: 'Andy Grove (Objectives and Key Results at Intel, 1970s) and John Doerr — Measure What Matters (2018)',
    year: '1970s / 2018',
    summary: 'An Objective says where to go this quarter, in words that inspire; three to five Key Results say how you will know you got there, each a number with a start and a target. Individual KRAs then cut each key result into the slice one person owns, so the plan reaches every person’s week.',
    caption: 'An objective, its few measurable key results, and below each the slice a named person owns.',
    howToRead: [
      'Start from the parent objective in the scorecard or the OGSM, and write one Objective for the quarter that is ambitious and has no number in it.',
      'Give it three to five Key Results: each a measure with a start value, a target and the current value. A key result is an outcome, not an activity, and should feel like a stretch (confidence about 3 out of 5).',
      'Cut each key result into individual KRAs: the slice one person owns and how it is measured. Check that every key result has someone owning a slice, and review confidence every week.',
    ],
  },
  sections: [
    section('basis', 'Where this quarter’s objective comes from', 'The scorecard, the yearly goals, the people and the near-term plan that the objective draws on.',
      long('parent_objective', 'Parent objective', 'The objective from the Balanced Scorecard (or the OGSM) that this quarter serves.', 'Internal process: cut rework on Line 2', { prefill: { upstream: 'bsc', output: 'objectives' } }),
      long('yearly_goals', 'The yearly goals this quarter serves', 'The goals from the OGSM plan that the key results should move.', 'Goal 2: EBITDA margin 16.5%', { prefill: { upstream: 'ogsm', output: 'goals' } }),
      long('people_context', 'People who could own the stretch', 'The high-potential people from the 9-box review: natural owners of a stretch key result.', 'Meena Joshi (Quality engineer)', { prefill: { upstream: 'ninebox', output: 'high_potentials' } }),
      long('near_term_plan', 'What the 90-day plan committed to', 'What the near-term plan has already promised in the same period, so the key results do not compete with it.', 'Pilot offer written; two pilots signed', { prefill: { upstream: 'first90', output: 'outcomes' } })),
    section('objective', 'The objective and its key results', 'One objective for the quarter and three to five key results.',
      text('objective', 'Objective for the quarter', 'One ambitious, qualitative statement of what to achieve this quarter. No number in it.', 'Prove Line 2 so the second welding line can be approved'),
      table('krs', 'Key results', 'Three to five outcomes with a start, a target and the current value. Progress is worked out for you.', 'Key result', [
        col.text('kr', 'Key result', 'A measurable outcome, not an activity.'),
        col.num('start', 'Start', 'Where the measure stands at the start of the quarter.'),
        col.num('target', 'Target', 'The value that means the key result is achieved. It may be lower than the start.'),
        col.num('current', 'Current', 'Where the measure stands now.'),
        col.computed('progress', 'Progress', 'How far the current value is from the start towards the target.', (r) => { const p = progressOf(r); return p === null ? '' : `${fmtNum(p, 0)}%`; }),
        col.rating('confidence', 'Confidence', 'How likely it is that the target will be reached by the end of the quarter.', { low: 'unlikely', high: 'certain' }),
        col.text('owner', 'Owner', 'The one person who answers for the key result.'),
      ], { min: 3, max: 6, example: { kr: 'Line 2 rework rate (%)', start: '5.4', target: '3', current: '4.6', confidence: '3', owner: 'Quality Head' } })),
    section('kras', 'Individual KRAs', 'The slice of each key result that one person owns.',
      table('kras', 'Individual KRAs', 'One row per person per key result: what they own and how it is measured.', 'KRA', [
        col.text('person', 'Person', 'The person who owns this slice, with their role.'),
        col.select('supports', 'Supports', 'The key result this slice contributes to (KR 1 is the first key result above, and so on).', KR_REFS),
        col.long('kra', 'Their slice', 'What this person owns: a responsibility, not a list of tasks.'),
        col.text('measure', 'Measure', 'How their slice is measured.'),
        col.text('kra_target', 'Target', 'The value that counts as done.'),
      ], { min: 3, max: 10, example: { person: 'Rohit Kulkarni (Line 2 supervisor)', supports: 'KR 2', kra: 'Make sure every shift uses the new fixture', measure: 'Shifts using the new fixture', kra_target: 'All 3 shifts' } })),
    section('rhythm', 'Keeping it alive', 'How progress is reviewed.',
      long('review_rhythm', 'How progress is reviewed', 'The rhythm of check-ins and when confidence is updated.', 'A 20-minute weekly check-in; confidence updated every Friday'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'kr_count',
      label: 'Key results',
      help: 'Three to five is the rule: fewer leaves the objective unmeasured, more dilutes the focus.',
      compute: (v) => (krRows(v).length ? plural(krRows(v).length, 'key result') : null),
      tone: (v) => (krRows(v).length ? (krRows(v).length >= 3 && krRows(v).length <= 5 ? 'good' : 'warn') : undefined),
    },
    {
      key: 'progress',
      label: 'Average progress',
      compute: (v) => { const p = krRows(v).map(({ row }) => progressOf(row)).filter((x): x is number => x !== null); return p.length ? `${fmtNum(p.reduce((a, b) => a + b, 0) / p.length, 0)}%` : null; },
    },
    {
      key: 'at_risk',
      label: 'Low confidence',
      help: 'Key results with confidence of 1 or 2 out of 5: where help is needed.',
      compute: (v) => (krRows(v).some(({ row }) => toNum(row.confidence) !== null) ? lowConfidence(v).map(({ row, n }) => `KR ${n}: ${row.kr.trim()}`).join('; ') || 'None — confidence is 3 or more on every key result' : null),
      tone: (v) => (krRows(v).some(({ row }) => toNum(row.confidence) !== null) ? (lowConfidence(v).length ? 'warn' : 'good') : undefined),
    },
    {
      key: 'coverage',
      label: 'Key results with someone owning a slice',
      compute: (v) => (krRows(v).length ? (uncovered(v).length ? `${uncovered(v).join(', ')} ${uncovered(v).length === 1 ? 'has' : 'have'} no individual KRA` : 'Every key result has someone owning a slice') : null),
      tone: (v) => (krRows(v).length ? (uncovered(v).length ? 'warn' : 'good') : undefined),
    },
  ],
  outputs: [
    { key: 'objective', label: 'The objective for the quarter', compute: (v) => filled(v, 'objective') },
    {
      key: 'key_results',
      label: 'The key results',
      compute: (v) => { const k = krRows(v).map(({ row, n }) => `KR ${n}: ${row.kr.trim()}${progressOf(row) !== null ? ` — ${fmtNum(progressOf(row)!, 0)}%` : ''}${row.owner?.trim() ? ` (${row.owner.trim()})` : ''}`); return k.length ? k.join('\n') : null; },
    },
    {
      key: 'individual_kras',
      label: 'The individual KRAs',
      compute: (v) => { const k = rows(v, 'kras').filter((r) => r.person?.trim() && r.kra?.trim()).map((r) => `${r.person.trim()} → ${r.supports || 'no key result'}: ${r.kra.trim()}`); return k.length ? k.join('\n') : null; },
    },
    { key: 'at_risk', label: 'The key results with low confidence', conditional: true, compute: (v) => (lowConfidence(v).length ? lowConfidence(v).map(({ row, n }) => `KR ${n}: ${row.kr.trim()}`).join('; ') : null) },
  ],
  legacyLabels: { 'Key result': 'krs#1.kr', 'Owner': 'krs#1.owner' },
  analysisGuide:
    'The verdict is whether the quarter has a clear objective whose key results are real outcomes that reach individual people, or a list of activities. Use the progress, the confidence flags and the coverage as worked out from the answers; never recompute them. Check that the objective is qualitative and ambitious, that each key result is a measurable outcome with a start and a target (not a task), that the confidence is about 3 out of 5 (a key result everyone is sure of is not a stretch), that the key results follow from the scorecard and the yearly goals, and that every key result has a person owning a slice with a measure. ' +
    'Name the key result most at risk, one that is really an activity, and the person carrying too much or too little. Say whether the people chosen suit the stretch and whether the near-term plan competes for the same time.',
};

// ── First 90 days ────────────────────────────────────────────────────────────

const BLOCKS = ['Days 1–30', 'Days 31–60', 'Days 61–90'] as const;
const BLOCK_STATUS = ['Not started', 'On track', 'Behind', 'Done'] as const;
const blockRow = (v: ModelValues, name: string): Row | undefined => rows(v, 'plan').find((r) => r.block === name);
/** A block is ready when it has one outcome, two or three actions and an owner; otherwise the first thing missing. */
function blockCheck(r: Row): string {
  const has = (k: string) => !!r[k]?.trim();
  if (!has('outcome') && !has('actions') && !has('owner')) return '';
  if (!has('outcome')) return 'Add the outcome';
  if (lines(r.actions).length === 0) return 'Add the actions';
  if (lines(r.actions).length > 3) return 'Too many actions — keep to 2 or 3';
  if (!has('owner')) return 'Add an owner';
  return 'Ready';
}
const anyBlock = (v: ModelValues): boolean => BLOCKS.some((b) => blockCheck(blockRow(v, b) ?? {}) !== '');

const first90: ModelDefinition = {
  toolId: 'first90',
  reference: {
    originator: 'The 30-60-90 day plan, a standard near-term planning format for new teams, new leaders and new ventures',
    year: 'Standard practice',
    summary: 'For a young team, a quarterly OKR cycle asks for more structure than it has. A first-90-days plan breaks the next three months into three sequenced 30-day blocks, each with one outcome that is either done or not done, the two or three actions that get there, and the person who owns them — aimed at the single biggest risk.',
    caption: 'Three 30-day blocks, each with one done-or-not-done outcome, two or three actions and an owner.',
    howToRead: [
      'Start with the direction the team has committed to and the single biggest risk or opportunity. The plan should attack that, not be a generic checklist.',
      'For each 30-day block write one outcome that can be marked done or not done (if it cannot, rewrite it), then the two or three actions that get there and who does them.',
      'Review at the end of each block: done, on track or behind. When the team and the cadence mature, graduate to quarterly OKRs.',
    ],
  },
  sections: [
    section('direction', 'The direction', 'What the team has committed to, and what the plan must settle.',
      long('direction', 'The direction the team has committed to', 'The decision that sets the plan: what the team is now trying to do.', 'Test the EV tooling studio idea with three paid pilot programmes'),
      long('risk', 'Biggest risk this plan addresses', 'The single biggest near-term risk or opportunity. The plan should attack this.', 'That start-ups will not pay a premium for speed'),
      long('success', 'What success looks like on day 90', 'How the team will know the 90 days have worked, in a sentence or two.', 'Three paid pilots delivered and two written intents to buy')),
    section('plan', 'The three blocks', 'One row per 30-day block. One outcome that is done or not done, two or three actions, one owner.',
      table('plan', 'The plan, block by block', 'Write the outcome first, then the actions that get there. The check says what is still missing.', 'Block', [
        col.text('block', 'Block', 'The 30 days the row covers.'),
        col.long('outcome', 'What must be true at the end', 'One outcome that is either done or not done — not a list of activities.'),
        col.long('actions', 'The two or three actions', 'The actions that get there, one per line.'),
        col.text('owner', 'Who', 'The person who owns the block.'),
        col.select('status', 'Status', 'Where the block stands now.', BLOCK_STATUS),
        col.computed('check', 'Check', 'Ready when there is an outcome, two or three actions and an owner.', (r) => blockCheck(r)),
      ], {
        fixed: BLOCKS,
        hints: { 'Days 1–30': 'Set up: the first block settles what everything else rests on', 'Days 31–60': 'Build and test: the work that proves or disproves the idea', 'Days 61–90': 'Prove and decide: results, and what happens next' },
      }),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'ready',
      label: 'Blocks ready',
      compute: (v) => (anyBlock(v) ? `${BLOCKS.filter((b) => blockCheck(blockRow(v, b) ?? {}) === 'Ready').length} of ${BLOCKS.length}` : null),
      tone: (v) => (anyBlock(v) ? (BLOCKS.every((b) => blockCheck(blockRow(v, b) ?? {}) === 'Ready') ? 'good' : 'warn') : undefined),
    },
    {
      key: 'to_fix',
      label: 'Still to finish',
      compute: (v) => (anyBlock(v) ? BLOCKS.filter((b) => blockCheck(blockRow(v, b) ?? {}) !== 'Ready').map((b) => `${b}: ${blockCheck(blockRow(v, b) ?? {}).toLowerCase() || 'empty'}`).join('; ') || 'None — every block is ready' : null),
    },
    {
      key: 'progress',
      label: 'Progress so far',
      compute: (v) => {
        const s = BLOCKS.map((b) => blockRow(v, b)?.status).filter(Boolean) as string[];
        return s.length ? BLOCK_STATUS.filter((x) => s.includes(x)).map((x) => `${x} ${s.filter((y) => y === x).length}`).join(' · ') : null;
      },
    },
  ],
  outputs: [
    {
      key: 'outcomes',
      label: 'The outcome of each 30-day block',
      compute: (v) => { const o = BLOCKS.flatMap((b) => { const x = blockRow(v, b)?.outcome?.trim(); return x ? [`${b}: ${x}`] : []; }); return o.length ? o.join('\n') : null; },
    },
    { key: 'biggest_risk', label: 'The biggest risk the plan addresses', compute: (v) => filled(v, 'risk') },
    { key: 'success_90', label: 'What success looks like on day 90', compute: (v) => filled(v, 'success') },
  ],
  legacyLabels: {
    'Days 1-30 outcome': 'plan#Days 1–30.outcome',
    'Days 31-60 outcome': 'plan#Days 31–60.outcome',
    'Days 61-90 outcome': 'plan#Days 61–90.outcome',
  },
  analysisGuide:
    'The verdict is whether the plan is a real, sequenced attack on the one biggest risk, or a generic checklist. Use the checks as worked out. Test each block: its outcome must be something that can be marked done or not done (an outcome like "make progress on pilots" fails; "two pilots signed and paid" passes), its actions two or three and specific, and its owner one person. Check the blocks build on one another, that day 90 answers the biggest risk, and that the plan is small enough for the team. ' +
    'Say which block is weakest and what should be cut. When the team has several contributors and a real quarterly cadence, recommend graduating to OKRs.',
};

export const EXECUTION_MODELS: ModelDefinition[] = [stp, ninebox, okrs, first90];

// Exported for the tests, which check the rules directly.
export { segmentScore, segmentRank, positioningStatement, boxOf, progressOf, blockCheck, uncovered, atRisk, BOXES };
