/**
 * defs/operating.ts — the frameworks that turn a strategy into how the organisation runs and is steered: Eccellere's own
 * 7-Stage Agentic AI Maturity Model, McKinsey 7S, the RACI matrix, the Balanced Scorecard, OGSM and the Startup KPI Tracker.
 *
 * Each definition follows the published model — its elements, in its order, under its names — and says in `help` what the
 * originator says belongs in each. Examples are placeholders; the worked examples live in samples/operating.ts.
 */
import { col, long, section, select, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, Row, Tone } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];
const filled = (v: ModelValues, key: string): string | null => v.fields[key]?.trim() || null;
const lines = (s: string | undefined): string[] => (s ?? '').split(/[\n;]+/).map((x) => x.replace(/^[\s•*-]+/, '').trim()).filter(Boolean);
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

// ── Eccellere 7-Stage Agentic AI Maturity Model ──────────────────────────────

const STAGES = ['Prompt marketplace', 'Prompt workflows', 'skill.md', 'Event and schedule connections', 'Flow orchestration', 'Autonomous operation', 'Coded agents'] as const;
type Stage = (typeof STAGES)[number];
const STAGE_STATUS = ['Not started', 'Trying it', 'In regular use', 'Embedded in the process'] as const;
const inUse = (r: Row | undefined): boolean => r?.status === 'In regular use' || r?.status === 'Embedded in the process';
const stageRow = (v: ModelValues, s: Stage): Row | undefined => rows(v, 'stages').find((r) => r.stage === s);
const stageName = (n: number): string => (n < 1 ? 'Not yet at Stage 1' : `Stage ${n} — ${STAGES[n - 1]}`);
const targetStage = (v: ModelValues): number => STAGES.indexOf((v.fields.target_stage ?? '') as Stage) + 1;

/**
 * The rung the business has reached — the highest stage such that every stage up to it is in regular use — and any stage in use
 * above a gap in the ladder. Null until a status has been given.
 */
function ladder(v: ModelValues): { current: number; above: number[] } | null {
  if (!rows(v, 'stages').some((r) => r.status)) return null;
  let current = 0;
  while (current < STAGES.length && inUse(stageRow(v, STAGES[current]))) current += 1;
  const above = STAGES.map((_, i) => i + 1).filter((n) => n > current + 1 && inUse(stageRow(v, STAGES[n - 1])));
  return { current, above };
}
const gapToTarget = (v: ModelValues): { text: string; tone: Tone } | null => {
  const l = ladder(v), t = targetStage(v);
  if (!l || !t) return null;
  if (t <= l.current) return { text: `Target reached — ${stageName(l.current)}`, tone: 'good' };
  const n = t - l.current;
  return { text: `${plural(n, 'stage')} to go, from ${l.current < 1 ? 'the start' : `Stage ${l.current}`} to Stage ${t}`, tone: n >= 3 ? 'warn' : 'neutral' };
};

const agenticai: ModelDefinition = {
  toolId: 'agenticai',
  reference: {
    originator: 'Eccellere — the 7-Stage Agentic AI Maturity Model (proprietary)',
    year: 'Eccellere framework',
    summary: 'A ladder for how a business uses AI, from borrowing ready-made prompts to running purpose-built agents. Each rung rests on the one below: you cannot safely connect AI to your systems before you have written down how the work is done, or let agents run it before there are guardrails and people watching.',
    caption: 'Seven rungs, from using prompts to running agents. Each stage asks for more structure, more trust and more care than the last.',
    howToRead: [
      'For each stage say where the business is: not started, trying it, in regular use, or embedded in how the work is done — and give one real example.',
      'Your stage is the highest rung where every rung up to it is in regular use. Anything in use above a gap is a warning: autonomous work resting on no written skills is fragile.',
      'Aim for the next rung, not the top: name what stands in the way, the two or three moves that would get you there, and who checks the AI’s work as it takes on more.',
    ],
  },
  sections: [
    section('today', 'Where you are today', 'How AI is used now, and what is behind each of the seven stages.',
      long('current_usage', 'How AI is used today', 'In plain words: who uses AI, for what, with which tools, and what is connected to what. The Value Scan’s answer is the starting point.', 'A few people use ChatGPT for emails; nothing is connected to the ERP', { prefill: 'value_scan' }),
      table('stages', 'The seven stages', 'One row per stage, from the bottom of the ladder up. Say where the business is and what is actually there.', 'Stage', [
        col.text('stage', 'Stage', 'The stage of the model.'),
        col.select('status', 'Where you are', 'Not started; trying it (a pilot or an experiment); in regular use (part of someone’s normal week); or embedded in the process (the work is not done without it).', STAGE_STATUS),
        col.long('evidence', 'What you have', 'The tool, who uses it, and one real example. “In regular use” means someone does it every week, not that it is planned.'),
        col.computed('reached', 'On the ladder?', 'Reached when the stage is in regular use or embedded.', (r) => (inUse(r) ? 'Reached' : r.status === 'Trying it' ? 'In trial' : '')),
      ], {
        fixed: STAGES,
        hints: {
          'Prompt marketplace': 'People use ready-made prompts from a shared library in a chat tool',
          'Prompt workflows': 'Several prompts are chained into a repeatable routine that a person runs',
          'skill.md': 'How the business does a task is written down as a reusable skill the AI follows',
          'Event and schedule connections': 'AI runs on a trigger (an email, a form, a date) or on a schedule, connected to your systems',
          'Flow orchestration': 'Skills and tools are chained into flows with branches, approvals and hand-offs',
          'Autonomous operation': 'Agents carry out a whole piece of work; people supervise by exception',
          'Coded agents': 'Purpose-built agents in code, with their own tools, tests and monitoring',
        },
      })),
    section('target', 'Where you want to be', 'The next rung to aim for, what stands in the way and how it is kept safe.',
      select('target_stage', 'Target stage', 'The stage to reach in the next twelve months. The next rung or two, not the top.', STAGES, 'Event and schedule connections'),
      long('target_why', 'Why that stage, and by when', 'What it would change for the business, in numbers if you can, and the date.', 'Weekly debtor reminders run on a schedule, which supports faster collection'),
      long('blockers', 'What stands in the way', 'Skills, data quality, trust in the output, budget, tools, time or rules about customer data.', 'Nobody owns the prompt library; the way quotes are done is in people’s heads'),
      long('next_moves', 'The next moves', 'Two or three moves that would take you to the next rung, each with an owner and a date.', 'Name an owner for the prompt library; document the quote-review chain'),
      long('guardrails', 'Guardrails', 'Who checks the AI’s work, what it must never be given or allowed to do, and who approves anything that touches money, prices or customers.', 'No customer drawings in public tools; a named person reviews every customer message'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'current',
      label: 'Where you are on the ladder',
      help: 'The highest stage where every stage up to it is in regular use.',
      compute: (v) => { const l = ladder(v); return l ? stageName(l.current) : null; },
    },
    {
      key: 'next',
      label: 'The next rung',
      compute: (v) => { const l = ladder(v); return l ? (l.current >= STAGES.length ? 'The top of the ladder' : stageName(l.current + 1)) : null; },
    },
    {
      key: 'gap',
      label: 'Distance to your target',
      compute: (v) => gapToTarget(v)?.text ?? null,
      tone: (v) => gapToTarget(v)?.tone,
    },
    {
      key: 'skipped',
      label: 'Rungs skipped',
      help: 'A stage in use above a gap in the ladder.',
      compute: (v) => {
        const l = ladder(v);
        if (!l) return null;
        if (!l.above.length) return 'None — each rung rests on the one below';
        return `${l.above.map((n) => STAGES[n - 1]).join(', ')} in use without ${STAGES[l.current]}`;
      },
      tone: (v) => { const l = ladder(v); return l ? (l.above.length ? 'warn' : 'good') : undefined; },
    },
    {
      key: 'in_use',
      label: 'Stages in regular use',
      compute: (v) => (ladder(v) ? `${rows(v, 'stages').filter(inUse).length} of ${STAGES.length}` : null),
    },
  ],
  outputs: [
    {
      key: 'ai_summary',
      label: 'Where the business is on the AI ladder',
      compute: (v) => {
        const l = ladder(v);
        if (!l) return null;
        const t = targetStage(v);
        return `${stageName(l.current)} today${t ? `; target ${stageName(t)}` : ''}${l.current < STAGES.length ? `; next rung ${stageName(l.current + 1)}` : ''}`;
      },
    },
    { key: 'current_stage', label: 'Current stage', compute: (v) => { const l = ladder(v); return l ? stageName(l.current) : null; } },
    { key: 'gap', label: 'Distance to the target stage', compute: (v) => gapToTarget(v)?.text ?? null },
    { key: 'next_moves', label: 'The next moves', compute: (v) => filled(v, 'next_moves') },
    { key: 'blockers', label: 'What stands in the way', compute: (v) => filled(v, 'blockers') },
    { key: 'guardrails', label: 'Guardrails', compute: (v) => filled(v, 'guardrails') },
  ],
  legacyLabels: { 'Current AI usage (Value Scan)': 'current_usage' },
  analysisGuide:
    'The verdict is where the business really is on the seven-stage ladder, whether its target is realistic, and the next rung to climb. Use the current stage, the next rung and the distance to the target as worked out from the answers; never recompute them. Test each "in regular use" against its evidence: a named tool, named users and a real example, not a plan. Flag any stage in use above a gap in the ladder, any move to stage 4 or above with no guardrails and no named person checking the work, and a target more than two rungs above the current stage. ' +
    'Prefer the next rung and a first use case that moves a number the business already tracks (debtor days, rework, quote turnaround) over a wish list of technology.',
};

// ── McKinsey 7S ──────────────────────────────────────────────────────────────

const ELEMENTS = ['Strategy', 'Structure', 'Systems', 'Shared values', 'Skills', 'Style', 'Staff'] as const;
const HARD_S = new Set<string>(['Strategy', 'Structure', 'Systems']);
const ALIGNMENT = ['Aligned', 'Partially aligned', 'Misaligned'] as const;
const elementRow = (v: ModelValues, name: string): Row | undefined => rows(v, 'elements').find((r) => r.element === name);
const ratedElements = (v: ModelValues): Row[] => rows(v, 'elements').filter((r) => r.element && (ALIGNMENT as readonly string[]).includes(r.alignment));
const countOf = (rs: Row[], a: (typeof ALIGNMENT)[number]): number => rs.filter((r) => r.alignment === a).length;
const alignmentCounts = (v: ModelValues): string | null => {
  const r = ratedElements(v);
  return r.length ? `Aligned ${countOf(r, 'Aligned')} · Partly ${countOf(r, 'Partially aligned')} · Misaligned ${countOf(r, 'Misaligned')}` : null;
};
const hardSoftCounts = (v: ModelValues): string | null => {
  const r = ratedElements(v), hard = r.filter((x) => HARD_S.has(x.element)), soft = r.filter((x) => !HARD_S.has(x.element));
  return r.length ? `Hard S’s ${countOf(hard, 'Aligned')} of ${hard.length} aligned · Soft S’s ${countOf(soft, 'Aligned')} of ${soft.length} aligned` : null;
};

const sevens: ModelDefinition = {
  toolId: 'sevens',
  reference: {
    originator: 'Robert Waterman, Tom Peters and Julien Phillips — “Structure Is Not Organization” (1980), developed at McKinsey & Company with Richard Pascale and Anthony Athos',
    year: '1980',
    summary: 'An organisation is more than its structure. Seven elements — strategy, structure and systems (the “hard” S’s), and shared values, skills, style and staff (the “soft” S’s) — have to fit each other and the strategy. When one is out of line, change in another will not hold.',
    caption: 'Shared values sit at the centre, linked to every other element. The hard S’s are easier to see and to change; the soft S’s decide whether the change sticks.',
    howToRead: [
      'Describe each element as it really is, not as it is written down: the structure people actually work in, the style leaders actually show.',
      'Rate each as aligned, partly aligned or misaligned with the strategy and with the other six. The elements that are out of line are the finding.',
      'Look at the centre first: if shared values do not fit the strategy, fixing the hard S’s alone will not stick. Then choose the one or two changes that matter most.',
    ],
  },
  sections: [
    section('business', 'The business', 'Who the organisation is, and the strategy the other six elements have to support.',
      text('size_band', 'Number of employees', 'The size band of the business: the 7S question changes as a business grows past a few dozen people.', '51–100', { prefill: 'business_context' }),
      long('ai_position', 'Where the business is on the AI ladder', 'From the 7-Stage Agentic AI Model: it speaks directly to Systems and Skills.', 'Stage 1 — prompt marketplace; target Stage 4', { prefill: { upstream: 'agenticai', output: 'ai_summary' } })),
    section('elements', 'The seven elements', 'One row per element, Strategy first. Say how it really is, rate its fit with the strategy, and say what would have to change.',
      table('elements', 'The seven elements', 'Describe each element honestly and rate it. The “hard or soft” column is worked out for you.', 'Element', [
        col.text('element', 'Element', 'One of the seven S’s.'),
        col.computed('kind', 'Hard or soft', 'Strategy, structure and systems are the hard S’s; shared values, skills, style and staff are the soft S’s.', (r) => (!r.element ? '' : HARD_S.has(r.element) ? 'Hard' : 'Soft')),
        col.long('today', 'What it looks like today', 'The honest version: how it really works, not how it is written down.', { half: true }),
        col.select('alignment', 'Fit with the strategy', 'Does this element support the strategy and fit the other six?', ALIGNMENT),
        col.long('change', 'What would have to change', 'The change that would bring it into line. Leave blank if it is aligned.', { half: true }),
      ], {
        fixed: ELEMENTS,
        hints: {
          'Strategy': 'The plan for how the business will win and where it will compete',
          'Structure': 'How the organisation is divided, who reports to whom, and who decides',
          'Systems': 'The processes, tools and routines through which work and information flow',
          'Shared values': 'The beliefs everything else is built around — what the business really stands for',
          'Skills': 'What the business and its people are distinctively good at',
          'Style': 'How leaders actually behave and manage, and the culture that results',
          'Staff': 'The people: who they are, how they are developed, rewarded and kept',
        },
      })),
    section('reading', 'What it adds up to', 'The misalignments that matter and what to change first.',
      long('main_misfit', 'The misalignments that matter most right now', 'Which one or two elements out of line would stop the strategy first, and why.', 'Structure and style: the organisation is too flat for the size and decisions queue up'),
      long('first_changes', 'The changes to make first', 'The one or two changes to make first, each with an owner and a date, and what to leave alone.', 'Add two plant-level leaders; give the Operations Head the daily decisions'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'counts',
      label: 'Alignment of the seven',
      compute: (v) => alignmentCounts(v),
      tone: (v) => { const r = ratedElements(v); if (!r.length) return undefined; const m = countOf(r, 'Misaligned'); return m === 0 && countOf(r, 'Partially aligned') === 0 ? 'good' : m >= 3 ? 'bad' : 'warn'; },
    },
    { key: 'hard_soft', label: 'Hard and soft', help: 'Companies tend to fix structure and systems and leave style, skills and staff alone.', compute: (v) => hardSoftCounts(v) },
    {
      key: 'misaligned',
      label: 'Misaligned elements',
      compute: (v) => (ratedElements(v).length ? ratedElements(v).filter((r) => r.alignment === 'Misaligned').map((r) => r.element).join(', ') || 'None misaligned' : null),
      tone: (v) => (ratedElements(v).length ? (ratedElements(v).some((r) => r.alignment === 'Misaligned') ? 'warn' : 'good') : undefined),
    },
    {
      key: 'centre',
      label: 'Shared values (the centre)',
      help: 'If the centre is out of line with the strategy, fixing the other six will not hold.',
      compute: (v) => { const a = elementRow(v, 'Shared values')?.alignment; return a && (ALIGNMENT as readonly string[]).includes(a) ? a : null; },
      tone: (v) => { const a = elementRow(v, 'Shared values')?.alignment; return a === 'Aligned' ? 'good' : a === 'Partially aligned' ? 'warn' : a === 'Misaligned' ? 'bad' : undefined; },
    },
  ],
  outputs: [
    {
      key: 'misfits',
      label: 'The elements out of line with the strategy',
      compute: (v) => {
        const out = ratedElements(v).filter((r) => r.alignment !== 'Aligned').map((r) => `${r.element} (${r.alignment === 'Misaligned' ? 'misaligned' : 'partly aligned'})${r.change?.trim() ? `: ${r.change.trim()}` : ''}`);
        return out.length ? out.join('; ') : null;
      },
    },
    {
      key: 'ownership_issues',
      label: 'What the review found about structure, style and who decides',
      compute: (v) => {
        const parts = ['Structure', 'Style', 'Staff'].flatMap((name) => {
          const r = elementRow(v, name);
          const said = [r?.today?.trim(), r?.change?.trim() ? `change: ${r.change.trim()}` : ''].filter(Boolean).join(' — ');
          return said ? [`${name}: ${said}`] : [];
        });
        return parts.length ? parts.join('\n') : null;
      },
    },
    { key: 'first_changes', label: 'The changes to make first', compute: (v) => filled(v, 'first_changes') },
    { key: 'alignment_summary', label: 'How aligned the organisation is', compute: (v) => { const a = alignmentCounts(v), h = hardSoftCounts(v); return a && h ? `${a} · ${h}` : a; } },
  ],
  legacyLabels: {
    'Employee count band': 'size_band',
    'Strategy': 'elements#Strategy.today',
    'Structure': 'elements#Structure.today',
    'Systems': 'elements#Systems.today',
    'Shared values': 'elements#Shared values.today',
    'Skills': 'elements#Skills.today',
    'Style': 'elements#Style.today',
    'Staff': 'elements#Staff.today',
  },
  analysisGuide:
    'The verdict is whether the organisation is aligned to carry out its strategy, and which one or two misalignments matter most. Use the alignment counts and the hard and soft split as worked out from the ratings. Test each rating against its description: an element rated "aligned" whose description reveals a problem is the commonest error. Look at the shared values at the centre, at whether the misalignments are hard or soft (companies tend to fix structure and systems and leave style, skills and staff alone), and at which one would block the strategy first. ' +
    'End with the one or two changes to make first, each with an owner, and say what to leave alone. Where the AI ladder is known, say what it means for Systems and Skills.',
};

// ── RACI matrix ──────────────────────────────────────────────────────────────

/** The names in a cell: "Sales Head, MD" and "Sales Head and MD" are two people; a blank cell has none. */
const nameList = (s: string | undefined): string[] => (s ?? '').split(/[,;&\n/]+|\band\b/i).map((x) => x.trim()).filter(Boolean);
const decisionRows = (v: ModelValues): Row[] => rows(v, 'decisions').filter((r) => r.decision?.trim());
/** The rule of the chart: exactly one Accountable name, and someone who does the work. */
function raciCheck(r: Row): string {
  if (!r.decision?.trim()) return '';
  const accountable = nameList(r.accountable);
  if (accountable.length === 0) return 'No one accountable';
  if (accountable.length > 1) return 'More than one accountable';
  if (nameList(r.responsible).length === 0) return 'Nobody does the work';
  return 'One owner';
}
const clearCount = (v: ModelValues): { clear: number; total: number } => ({ clear: decisionRows(v).filter((r) => raciCheck(r) === 'One owner').length, total: decisionRows(v).length });
const problemList = (v: ModelValues): string[] => decisionRows(v).filter((r) => raciCheck(r) !== 'One owner').map((r) => `${r.decision.trim()} (${raciCheck(r).toLowerCase()})`);
/** Who is accountable for the most decisions (only decisions with exactly one accountable name count). */
function busiest(v: ModelValues): { name: string; count: number; total: number } | null {
  const owners = decisionRows(v).filter((r) => nameList(r.accountable).length === 1).map((r) => nameList(r.accountable)[0]);
  if (!owners.length) return null;
  const tally = new Map<string, { name: string; count: number }>();
  for (const o of owners) { const k = o.toLowerCase(); tally.set(k, { name: tally.get(k)?.name ?? o, count: (tally.get(k)?.count ?? 0) + 1 }); }
  const top = [...tally.values()].sort((a, b) => b.count - a.count)[0];
  return { ...top, total: owners.length };
}

const raci: ModelDefinition = {
  toolId: 'raci',
  reference: {
    originator: 'The responsibility assignment matrix (RACI), standard in project management and governance (as in the PMI PMBOK Guide)',
    year: 'Standard practice',
    summary: 'For every decision or task, one name is Accountable and owns the outcome; others are Responsible (do the work), Consulted (asked before) or Informed (told after). Writing it down removes the ambiguity about who actually decides — and shows where one person holds too much.',
    caption: 'One row per decision, one letter per person: R does the work, A owns the outcome (exactly one), C is asked before, I is told after.',
    howToRead: [
      'List specific decisions or tasks — “approve a price change above 5%”, not “pricing” — and name the people, not only their titles.',
      'Check each row: exactly one Accountable, and at least one Responsible. Two Accountables, or none, is the finding — not a form to finish.',
      'Look across the rows: if one person is Accountable for most decisions, the chart has found a bottleneck, not an owner.',
    ],
  },
  sections: [
    section('scope', 'What the chart covers', 'The area, the people, and what the review found.',
      text('scope', 'What the chart covers', 'The function, project or process: a chart for “everything” says nothing.', 'Order-to-cash and plant operations'),
      long('from_7s', 'What the 7S review found about ownership', 'Unclear ownership, decisions that queue, roles that overlap — from the McKinsey 7S review.', 'Structure lagging strategy; decisions queue at the MD', { prefill: { upstream: 'sevens', output: 'ownership_issues' } }),
      long('people', 'The people and roles in the chart', 'The names, with their roles, so every cell uses the same names.', 'Managing Director; Operations Head; Sales Head; Finance Head; Quality Head')),
    section('decisions', 'The decisions', 'One row per decision or task. The check column tells you if a row breaks the rule.',
      table('decisions', 'Decisions and who has which role', 'Name one person in the Accountable column. The check is worked out for you.', 'Decision', [
        col.text('decision', 'Decision or task', 'A specific decision or task, not a whole area.'),
        col.text('responsible', 'Responsible (does the work)', 'The people who do the work. One or several.'),
        col.text('accountable', 'Accountable (owns the outcome — exactly one name)', 'The single person who answers for the outcome and has the final say.'),
        col.text('consulted', 'Consulted (asked before)', 'People whose input is sought before the decision is made.'),
        col.text('informed', 'Informed (told after)', 'People told of the decision once it is made.'),
        col.computed('check', 'Check', 'One owner is right; none, or more than one, is the finding.', (r) => raciCheck(r)),
      ], { min: 4, max: 15, example: { decision: 'Approve a price change above 5%', responsible: 'Sales Head', accountable: 'Managing Director', consulted: 'Finance Head', informed: 'Plant managers' } })),
    section('rules', 'How it will work', 'How disagreements are settled and when the chart is reviewed.',
      long('rules', 'How disputes are settled and when it is reviewed', 'Who breaks a tie, and the date the chart is looked at again.', 'The MD settles ties within two days; review every six months'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'clear',
      label: 'Decisions with one clear owner',
      compute: (v) => { const { clear, total } = clearCount(v); return total ? `${clear} of ${total}` : null; },
      tone: (v) => { const { clear, total } = clearCount(v); return total ? (clear === total ? 'good' : clear === 0 ? 'bad' : 'warn') : undefined; },
    },
    {
      key: 'problems',
      label: 'Decisions that break the rule',
      compute: (v) => (decisionRows(v).length ? problemList(v).join('; ') || 'None — every decision has one accountable owner' : null),
      tone: (v) => (decisionRows(v).length ? (problemList(v).length ? 'warn' : 'good') : undefined),
    },
    {
      key: 'load',
      label: 'Who is accountable for the most',
      help: 'One person accountable for half of the decisions or more is a bottleneck.',
      compute: (v) => { const b = busiest(v); return b ? `${b.name}: ${b.count} of ${b.total} decisions` : null; },
      tone: (v) => { const b = busiest(v); return b ? (b.total >= 4 && b.count / b.total >= 0.5 ? 'warn' : 'good') : undefined; },
    },
  ],
  outputs: [
    {
      key: 'ownership_summary',
      label: 'How clear the ownership is',
      compute: (v) => {
        const { clear, total } = clearCount(v), b = busiest(v);
        return total ? `${clear} of ${total} decisions have one clear owner${b ? `; ${b.name} is accountable for ${b.count} of ${b.total}` : ''}` : null;
      },
    },
    { key: 'unclear_decisions', label: 'Decisions without a clear owner', conditional: true, compute: (v) => (problemList(v).length ? problemList(v).join('; ') : null) },
    {
      key: 'accountable_owners',
      label: 'Who is accountable',
      compute: (v) => { const names = [...new Set(decisionRows(v).flatMap((r) => nameList(r.accountable)))]; return names.length ? names.join(', ') : null; },
    },
    { key: 'rules', label: 'How disputes are settled', compute: (v) => filled(v, 'rules') },
  ],
  legacyLabels: {
    'Decision in question': 'decisions#1.decision',
    'Responsible (does the work)': 'decisions#1.responsible',
    'Accountable (owns the outcome — exactly one name)': 'decisions#1.accountable',
    'Consulted (input sought before deciding)': 'decisions#1.consulted',
    'Informed (told after the decision)': 'decisions#1.informed',
  },
  analysisGuide:
    'The verdict is whether ownership is clear enough for the organisation to decide quickly, and where it is not. Use the checks and the accountability load as worked out from the answers; never recount them. A decision with two accountable names, or none, is the finding, not a detail. Look for one person accountable for most decisions (a bottleneck, typically the founder), decisions that are too broad to own ("pricing"), Consulted lists so long that nothing gets decided, and decisions that are missing altogether (credit, capital spending, quality escapes). ' +
    'Where the 7S review found ownership problems, say whether this chart fixes them. Recommend the smallest changes: move one accountability, name one person, split one decision.',
};

// ── Balanced Scorecard ───────────────────────────────────────────────────────

const PERSPECTIVES = ['Financial', 'Customer', 'Internal process', 'Learning and growth'] as const;
const perspectiveRow = (v: ModelValues, name: string): Row | undefined => rows(v, 'perspectives').find((r) => r.perspective === name);
/** A perspective is complete when it has an objective, a measure and a target; otherwise the first thing missing. */
function perspectiveStatus(r: Row): string {
  const has = (k: string) => !!r[k]?.trim();
  if (!has('objectives') && !has('measures') && !has('targets') && !has('initiatives')) return '';
  if (!has('objectives')) return 'Add an objective';
  if (!has('measures')) return 'Add a measure';
  if (!has('targets')) return 'Add a target';
  return 'Complete';
}
const incompletePerspectives = (v: ModelValues): string[] => PERSPECTIVES.filter((p) => perspectiveStatus(perspectiveRow(v, p) ?? {}) !== 'Complete');
const anyPerspectiveAnswered = (v: ModelValues): boolean => PERSPECTIVES.some((p) => perspectiveStatus(perspectiveRow(v, p) ?? {}) !== '');

const bsc: ModelDefinition = {
  toolId: 'bsc',
  reference: {
    originator: 'Robert S. Kaplan and David P. Norton — “The Balanced Scorecard: Measures That Drive Performance”, Harvard Business Review',
    year: '1992 / 1996',
    summary: 'A single financial number hides how the results were produced. The Balanced Scorecard translates the strategy into objectives, measures, targets and initiatives across four perspectives — financial, customer, internal process, and learning and growth — so that results and the drivers of results are watched together.',
    caption: 'Four perspectives joined by cause and effect: learning and growth improves the internal processes, which delight customers, which produce the financial results.',
    howToRead: [
      'Start from the strategy, then for each perspective ask its question: how do we look to owners, how do customers see us, what must we be excellent at, can we keep improving?',
      'Give each perspective one to three objectives, a measure for each, a target for the measure and the initiative that will move it.',
      'Check the balance: results (lagging) matched by drivers (leading), short term by long term. Then draw the chain of cause and effect between the objectives.',
    ],
  },
  sections: [
    section('basis', 'Where the plan comes from', 'The strategy, and what the earlier tools say about each perspective.',
      long('strategy', 'The strategy the scorecard translates', 'The strategy in a few sentences. A scorecard without a strategy is a list of measures.', 'Grow brackets and engineering-led work, fix rework, collect faster'),
      long('financial_plan', 'The financial plan behind the Financial objectives', 'From the Three-Statement Financial Model: where revenue, margin and cash are meant to go.', 'Revenue ₹9,800 lakh → ₹14,385 lakh in three years', { prefill: { upstream: 'financial', output: 'summary' } }),
      long('ai_readiness', 'How ready the business is to use AI', 'From the 7-Stage Agentic AI Model; it belongs under Learning and growth.', 'Stage 1 — prompt marketplace; target Stage 4', { prefill: { upstream: 'agenticai', output: 'ai_summary' } }),
      long('weekly_kpis', 'The numbers already tracked weekly', 'From the Startup KPI Tracker: the few numbers that are checked every week are candidates for measures.', 'Orders won; debtor days; rework %', { prefill: { upstream: 'startupkpis', output: 'kpi_list' } })),
    section('scorecard', 'The scorecard', 'One row per perspective: the objectives, how each is measured, the target and what will be done.',
      table('perspectives', 'Objectives, measures, targets and initiatives', 'One to three objectives in each perspective, each with a measure and a target. The completeness check is worked out for you.', 'Perspective', [
        col.text('perspective', 'Perspective', 'One of the four perspectives.'),
        col.long('objectives', 'Objectives', 'What the business must achieve in this perspective — one to three, one per line.'),
        col.long('measures', 'Measures', 'How each objective is measured: a number you can read, one per line in the same order.', { half: true }),
        col.long('targets', 'Targets', 'The value each measure must reach, and by when, one per line in the same order.', { half: true }),
        col.long('initiatives', 'Initiatives', 'The projects or actions that will move the measures.'),
        col.computed('status', 'Complete?', 'Complete when there is an objective, a measure and a target.', (r) => perspectiveStatus(r)),
      ], {
        fixed: PERSPECTIVES,
        hints: {
          'Financial': 'How do we look to our owners and lenders?',
          'Customer': 'How do our customers see us?',
          'Internal process': 'What must we excel at to deliver for customers?',
          'Learning and growth': 'Can we keep improving, learning and creating value?',
        },
      })),
    section('reading', 'How it fits together', 'The chain of cause and effect, and whether the scorecard is balanced.',
      long('strategy_map', 'The strategy map: how the objectives drive one another', 'Which learning and process objectives drive the customer results, and through them the financial results.', 'Skills and AI use → faster quoting → more programmes won → revenue'),
      long('balance_view', 'Is it balanced?', 'Are results (lagging measures) matched by drivers (leading measures), and short-term objectives by long-term ones?', 'Two of the four perspectives rely only on lagging measures'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'complete',
      label: 'Perspectives complete',
      compute: (v) => (anyPerspectiveAnswered(v) ? `${PERSPECTIVES.length - incompletePerspectives(v).length} of ${PERSPECTIVES.length}` : null),
      tone: (v) => (anyPerspectiveAnswered(v) ? (incompletePerspectives(v).length === 0 ? 'good' : 'warn') : undefined),
    },
    {
      key: 'needs',
      label: 'Still to finish',
      compute: (v) => (anyPerspectiveAnswered(v) ? incompletePerspectives(v).join(', ') || 'None — all four are complete' : null),
    },
    {
      key: 'objective_count',
      label: 'Objectives in all',
      help: 'Most scorecards carry about 10 to 16 objectives in all; more than that and nothing stands out.',
      compute: (v) => { if (!anyPerspectiveAnswered(v)) return null; const n = PERSPECTIVES.reduce((a, p) => a + lines(perspectiveRow(v, p)?.objectives).length, 0); return `${n} objective${n === 1 ? '' : 's'}`; },
      tone: (v) => { const n = PERSPECTIVES.reduce((a, p) => a + lines(perspectiveRow(v, p)?.objectives).length, 0); return anyPerspectiveAnswered(v) ? (n > 16 ? 'warn' : 'neutral') : undefined; },
    },
  ],
  outputs: [
    {
      key: 'objectives',
      label: 'The objectives, by perspective',
      compute: (v) => {
        const out = PERSPECTIVES.flatMap((p) => { const o = lines(perspectiveRow(v, p)?.objectives); return o.length ? [`${p}: ${o.join('; ')}`] : []; });
        return out.length ? out.join('\n') : null;
      },
    },
    {
      key: 'measures_targets',
      label: 'The measures and targets, by perspective',
      compute: (v) => {
        const out = PERSPECTIVES.flatMap((p) => {
          const r = perspectiveRow(v, p), m = lines(r?.measures), t = lines(r?.targets);
          return m.length ? [`${p}: ${m.map((x, i) => (t[i] ? `${x} → ${t[i]}` : x)).join('; ')}`] : [];
        });
        return out.length ? out.join('\n') : null;
      },
    },
    { key: 'strategy_map', label: 'The strategy map', compute: (v) => filled(v, 'strategy_map') },
    { key: 'scorecard_status', label: 'How complete the scorecard is', compute: (v) => (anyPerspectiveAnswered(v) ? `${PERSPECTIVES.length - incompletePerspectives(v).length} of ${PERSPECTIVES.length} perspectives complete` : null) },
  ],
  legacyLabels: {
    'Financial objective': 'perspectives#Financial.objectives',
    'Customer objective': 'perspectives#Customer.objectives',
  },
  analysisGuide:
    'The verdict is whether the scorecard turns the strategy into a balanced, measurable set of objectives — or is a list of metrics. Use the completeness of each perspective as worked out. Check that each objective has a measure that can be read as a number and a target with a date, that results (lagging) are matched by drivers (leading) in the other perspectives, that the learning and growth and internal process objectives actually explain the customer and financial ones (the strategy map), and that there are few enough objectives to remember. ' +
    'Name the perspective that is weakest, an objective with no measure, and a measure that does not follow from the strategy. Where the earlier tools give a financial plan, an AI position or weekly KPIs, say whether the scorecard uses them.',
};

// ── OGSM ─────────────────────────────────────────────────────────────────────

const GOAL_REFS = ['Goal 1', 'Goal 2', 'Goal 3', 'Goal 4', 'Goal 5', 'Goal 6'] as const;
/** The goals that have been written, each with its number — its position in the table, so "Goal 2" is always the second row. */
const goalRows = (v: ModelValues): { row: Row; n: number }[] => rows(v, 'goals').flatMap((row, i) => (row.goal?.trim() ? [{ row, n: i + 1 }] : []));
const strategyRows = (v: ModelValues): Row[] => rows(v, 'strategies').filter((r) => r.strategy?.trim());
/** A goal is measurable if its target (or the goal itself) carries a number. */
const isMeasurable = (r: Row): boolean => /\d/.test(`${r.target ?? ''}`) || (!r.target?.trim() && /\d/.test(r.goal ?? ''));
function strategyStatus(r: Row): string {
  if (!r.strategy?.trim()) return '';
  if (!r.measure?.trim()) return 'Add a measure';
  if (!r.target?.trim()) return 'Add a target';
  if (!r.owner?.trim()) return 'Add an owner';
  return 'Complete';
}
/** The goals no strategy supports. */
function unsupportedGoals(v: ModelValues): string[] {
  const supported = new Set(strategyRows(v).map((r) => r.supports));
  return goalRows(v).map((r) => `Goal ${r.n}`).filter((g) => !supported.has(g));
}

const ogsm: ModelDefinition = {
  toolId: 'ogsm',
  reference: {
    originator: 'The OGSM planning method — a one-page descendant of Management by Objectives and Japanese hoshin kanri, widely used in consumer-goods companies',
    year: 'Late 20th century',
    summary: 'OGSM puts the whole plan on one page: an Objective that says where the business is going, the Goals that make it measurable, the Strategies that say how, and the Measures that show each strategy is working. Everyone can see how their work supports the objective.',
    caption: 'Objective, Goals, Strategies and Measures read left to right: each column answers the one before it.',
    howToRead: [
      'Write one Objective: an inspiring statement of what the business is trying to become or achieve this year, not a number.',
      'Give it three to five Goals with a number and a date, then the Strategies — how the business will reach each goal — and a Measure and target for every strategy.',
      'Check the chain: every goal has a strategy, every strategy a measure, target and owner, and the whole thing fits on one page.',
    ],
  },
  sections: [
    section('objective', 'Objective', 'Where the business is going this year.',
      long('objective', 'Objective', 'One inspiring statement of what the business wants to achieve or become — qualitative, with no number in it. The Balanced Scorecard’s objectives are the starting point.', 'Become the OEMs’ first-choice supplier for welded brackets', { prefill: { upstream: 'bsc', output: 'objectives' } })),
    section('goals', 'Goals', 'The results that make the objective measurable — a number and a date.',
      table('goals', 'Goals', 'Three to five goals, each with a target and a date.', 'Goal', [
        col.text('goal', 'Goal', 'A result that would show the objective achieved.'),
        col.text('target', 'Target', 'The number to reach: a value, a percentage or a count.'),
        col.text('by_when', 'By when', 'The date or the end of the period.'),
        col.computed('measurable', 'Measurable?', 'A goal needs a number to be a goal.', (r) => (!r.goal?.trim() ? '' : isMeasurable(r) ? 'Yes' : 'Add a number')),
      ], { min: 3, max: 6, example: { goal: 'Revenue', target: '₹10,878 lakh', by_when: 'March 2026' } })),
    section('strategies', 'Strategies and Measures', 'How each goal will be reached, how you will know it is working, and who is responsible.',
      table('strategies', 'Strategies and their measures', 'One row per strategy: the goal it serves, the measure that shows progress, its target and its owner.', 'Strategy', [
        col.text('strategy', 'Strategy', 'How the business will reach the goal — a choice, not a task.'),
        col.select('supports', 'Supports', 'The goal this strategy serves (Goal 1 is the first goal above, and so on).', GOAL_REFS),
        col.text('measure', 'Measure', 'The number that shows the strategy is working.'),
        col.text('target', 'Target', 'The value the measure must reach.'),
        col.text('owner', 'Owner', 'The one person who answers for it.'),
        col.computed('status', 'Complete?', 'Complete when there is a measure, a target and an owner.', (r) => strategyStatus(r)),
      ], { min: 3, max: 8, example: { strategy: 'Fix Line 2 rework', supports: 'Goal 2', measure: 'Rework rate', target: '2%', owner: 'Operations Head' } })),
    section('review', 'Keeping it alive', 'How the plan is reviewed.',
      long('review', 'How and when it is reviewed', 'The rhythm of reviews and who takes part.', 'Monthly review with the four heads; the MD signs off changes'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'counts',
      label: 'Goals and strategies',
      help: 'Three to five goals and three to eight strategies keep it to one page.',
      compute: (v) => (goalRows(v).length || strategyRows(v).length ? `${plural(goalRows(v).length, 'goal')} · ${plural(strategyRows(v).length, 'strategy', 'strategies')}` : null),
      tone: (v) => { const g = goalRows(v).length, s = strategyRows(v).length; return g || s ? (g >= 2 && g <= 6 && s >= 2 && s <= 8 ? 'good' : 'warn') : undefined; },
    },
    {
      key: 'unsupported',
      label: 'Goals with no strategy',
      compute: (v) => (goalRows(v).length ? unsupportedGoals(v).join(', ') || 'None — every goal has a strategy' : null),
      tone: (v) => (goalRows(v).length ? (unsupportedGoals(v).length ? 'warn' : 'good') : undefined),
    },
    {
      key: 'unmeasured',
      label: 'Strategies still to finish',
      compute: (v) => {
        if (!strategyRows(v).length) return null;
        const n = strategyRows(v).filter((r) => strategyStatus(r) !== 'Complete').length;
        return n ? `${plural(n, 'strategy', 'strategies')} without a measure, target or owner` : 'None — each has a measure, a target and an owner';
      },
      tone: (v) => (strategyRows(v).length ? (strategyRows(v).some((r) => strategyStatus(r) !== 'Complete') ? 'warn' : 'good') : undefined),
    },
  ],
  outputs: [
    { key: 'objective', label: 'The objective', compute: (v) => filled(v, 'objective') },
    {
      key: 'goals',
      label: 'The goals',
      compute: (v) => (goalRows(v).length ? goalRows(v).map(({ row, n }) => `Goal ${n}: ${row.goal.trim()}${row.target?.trim() ? ` — ${row.target.trim()}` : ''}${row.by_when?.trim() ? ` (${row.by_when.trim()})` : ''}`).join('\n') : null),
    },
    {
      key: 'strategies',
      label: 'The strategies, with their measures and owners',
      compute: (v) => (strategyRows(v).length ? strategyRows(v).map((r) => `${r.strategy.trim()} (${r.supports || 'no goal'}): ${[r.measure?.trim(), r.target?.trim() ? `→ ${r.target.trim()}` : '', r.owner?.trim() ? `— ${r.owner.trim()}` : ''].filter(Boolean).join(' ')}`).join('\n') : null),
    },
  ],
  legacyLabels: { 'Top objective': 'objective' },
  analysisGuide:
    'The verdict is whether the plan is a one-page chain from objective to measures that people can hold themselves to, or a wish list. Use the counts and the completeness checks as worked out. Check that the objective is a direction, not a number; that each goal has a number and a date; that each strategy is a choice (how), not a task or a goal restated; that every goal has at least one strategy and every strategy a measure, a target and one owner; and that the whole plan is small enough to keep in mind. ' +
    'Name the goal with the weakest strategy, a measure that cannot be read from the business’s own figures, and an owner with too much on their name. Where the Balanced Scorecard is known, say whether the goals follow from its objectives.',
};

// ── Startup KPI tracker ──────────────────────────────────────────────────────

const KPI_STAGES = ['Acquisition', 'Activation', 'Retention', 'Revenue', 'Referral', 'Cash or operations'] as const;
const KPI_DIRECTION = ['Up is good', 'Down is good'] as const;
const kpiRows = (v: ModelValues): Row[] => rows(v, 'kpis').filter((r) => r.metric?.trim());
/** The week's movement of one metric as a percentage, and whether it is the right way. Null until both weeks are given. */
function movement(r: Row): { pct: number; better: boolean } | null {
  const a = toNum(r.this_week), b = toNum(r.last_week);
  if (a === null || b === null) return null;
  if (b === 0) return a === 0 ? { pct: 0, better: true } : { pct: a > 0 ? 100 : -100, better: r.good === 'Down is good' ? a < 0 : a > 0 };
  const pct = ((a - b) / Math.abs(b)) * 100;
  return { pct, better: r.good === 'Down is good' ? pct <= 0 : pct >= 0 };
}
function kpiChange(r: Row): string {
  const m = movement(r);
  if (!m) return '';
  if (Math.abs(m.pct) < 0.5) return 'Flat';
  return `${m.pct > 0 ? 'Up' : 'Down'} ${fmtNum(Math.abs(m.pct), 0)}% — ${m.better ? 'better' : 'worse'}`;
}
const moved = (v: ModelValues): { row: Row; m: { pct: number; better: boolean } }[] => kpiRows(v).flatMap((row) => { const m = movement(row); return m ? [{ row, m }] : []; });

const startupkpis: ModelDefinition = {
  toolId: 'startupkpis',
  reference: {
    originator: 'Dave McClure (AARRR “pirate metrics”), Sean Ellis (the North Star metric) and Alistair Croll and Benjamin Yoskovitz (Lean Analytics: the One Metric That Matters)',
    year: '2007–2013',
    summary: 'A young business needs three to five numbers it can read every week, not a dashboard. Choose the one number that best shows customers getting value (the North Star), then a few that follow the customer from first contact to repeat business and cash — and look at them on the same day each week.',
    caption: 'Acquisition, activation, retention, revenue and referral: the path of a customer. The North Star is the one number that says it is working.',
    howToRead: [
      'Pick a North Star: the one number that best shows customers getting value. Then pick three to five metrics along the customer’s path, each with a clear direction of good.',
      'Each week enter this week’s number beside last week’s. A metric you cannot read weekly belongs in a heavier tool.',
      'Read the movement, not the level: how many are moving the right way, which moved the wrong way, and one line on why.',
    ],
  },
  sections: [
    section('northstar', 'The North Star and the rhythm', 'The one number that matters most, and how often you look.',
      text('north_star', 'North Star metric', 'The one number that best shows customers getting value from what you sell. It should rise when the business is genuinely doing better.', 'Programmes in production', {}),
      select('cadence', 'Review cadence', 'How often the numbers are read together.', ['Weekly', 'Fortnightly', 'Monthly'], 'Weekly')),
    section('kpis', 'The numbers', 'Three to five metrics, with this week against last week.',
      table('kpis', 'Metrics, this week and last week', 'One row per metric. The movement is worked out for you.', 'Metric', [
        col.text('metric', 'Metric', 'What is measured: a number that can be read every week.'),
        col.select('stage', 'Where on the customer’s path', 'Acquisition (finding you), activation (first value), retention (coming back), revenue (paying), referral (telling others), or cash and operations.', KPI_STAGES),
        col.num('this_week', 'This week', 'This week’s number.'),
        col.num('last_week', 'Last week', 'Last week’s number.'),
        col.select('good', 'Direction of good', 'Is a higher number better, or a lower one?', KPI_DIRECTION),
        col.computed('change', 'Movement', 'The change since last week, and whether it is the right way.', (r) => kpiChange(r)),
        col.text('what_changed', 'What changed', 'One line on why it moved.'),
      ], { min: 3, max: 5, example: { metric: 'RFQs received', stage: 'Acquisition', this_week: '8', last_week: '6', good: 'Up is good' } })),
    section('reading', 'The week in a line', 'What the numbers say.',
      long('week_summary', 'The week in a sentence', 'What the numbers say about the week, and the one thing to do about it.', 'Enquiries are up, but rework rose again; fix the welding fixture first'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'moving',
      label: 'Moving the right way',
      compute: (v) => { const m = moved(v); return m.length ? `${m.filter((x) => x.m.better).length} of ${m.length}` : null; },
      tone: (v) => { const m = moved(v); if (!m.length) return undefined; const share = m.filter((x) => x.m.better).length / m.length; return share >= 0.6 ? 'good' : share < 0.4 ? 'bad' : 'warn'; },
    },
    {
      key: 'worst',
      label: 'Moving the wrong way',
      compute: (v) => {
        const m = moved(v);
        if (!m.length) return null;
        const worse = m.filter((x) => !x.m.better).sort((a, b) => Math.abs(b.m.pct) - Math.abs(a.m.pct));
        return worse.length ? worse.map((x) => `${x.row.metric.trim()} (${x.m.pct > 0 ? 'up' : 'down'} ${fmtNum(Math.abs(x.m.pct), 0)}%)`).join(', ') : 'None — nothing moved the wrong way';
      },
      tone: (v) => { const m = moved(v); return m.length ? (m.some((x) => !x.m.better) ? 'warn' : 'good') : undefined; },
    },
    {
      key: 'path',
      label: 'Covered on the customer’s path',
      help: 'The metrics should follow the customer from first contact to repeat business and cash.',
      compute: (v) => { const s = [...new Set(kpiRows(v).map((r) => r.stage).filter(Boolean))]; return kpiRows(v).length ? (s.length ? s.join(' · ') : 'No stage chosen yet') : null; },
    },
  ],
  outputs: [
    {
      key: 'kpi_list',
      label: 'The weekly numbers',
      compute: (v) => {
        const out = kpiRows(v).map((r) => `${r.metric.trim()}${r.stage ? ` (${r.stage.toLowerCase()})` : ''}: ${r.this_week?.trim() || '—'}${r.last_week?.trim() ? ` against ${r.last_week.trim()} last week` : ''}${r.good ? `; ${r.good.toLowerCase()}` : ''}`);
        return out.length ? out.join('\n') : null;
      },
    },
    { key: 'north_star', label: 'The North Star metric', compute: (v) => filled(v, 'north_star') },
    { key: 'week_summary', label: 'The week in a sentence', compute: (v) => filled(v, 'week_summary') },
  ],
  legacyLabels: { 'Metric 1': 'kpis#1.metric', 'Metric 2': 'kpis#2.metric', 'Metric 3': 'kpis#3.metric' },
  analysisGuide:
    'The verdict is whether these few numbers tell the owner, each week, whether the business is getting better — or are vanity metrics. Use the movement figures as worked out. Check that the North Star really shows customers getting value (not activity or sales effort), that each metric has a clear direction of good and can be read weekly, that the metrics follow the customer from first contact to cash rather than all sitting at one stage, and that "what changed" names a cause. ' +
    'Name the one metric to act on this week and the one to drop or replace. Say when the business has outgrown this tracker and needs the Balanced Scorecard.',
};

export const OPERATING_MODELS: ModelDefinition[] = [agenticai, sevens, raci, bsc, ogsm, startupkpis];

// Exported for the tests, which check the rules directly.
export { ladder, gapToTarget, raciCheck, nameList, busiest, perspectiveStatus, strategyStatus, unsupportedGoals, isMeasurable, movement, kpiChange };
