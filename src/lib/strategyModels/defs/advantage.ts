/**
 * defs/advantage.ts — the frameworks that ask where a business's competitive advantage comes from and whether it will last:
 * Blue Ocean's strategy canvas, the ERRC grid, VRIO, the resource-based view and core competence.
 *
 * Each definition follows the published model — its elements, in its order, under its names — and says in `help` what the
 * originator says belongs in each. Examples are placeholders; the worked examples live in samples/advantage.ts.
 */
import { col, long, mean, section, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, Row } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];
const lines = (s: string | undefined): string[] => (s ?? '').split(/[\n;]+/).map((x) => x.replace(/^[\s•*-]+/, '').trim()).filter(Boolean);

// ── Blue Ocean strategy canvas ───────────────────────────────────────────────

const industryLevel = (r: Row): number | null => { const m = mean([toNum(r.a), toNum(r.b)].filter((n): n is number => n !== null)); return m; };
const gapOf = (r: Row): number | null => { const y = toNum(r.you), i = industryLevel(r); return y === null || i === null ? null : y - i; };
/** A difference with its sign — +3, −2 — and a plain 0 when level. */
const signed = (n: number): string => { const a = fmtNum(Math.abs(n)); return a === '0' ? '0' : `${n >= 0 ? '+' : '−'}${a}`; };
const canvasRows = (v: ModelValues): Row[] => rows(v, 'canvas').filter((r) => r.factor);

/** Pearson correlation of two equal-length series; null when either has no spread. */
function correlation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i += 1) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}
function curveSimilarity(v: ModelValues): number | null {
  const pairs = canvasRows(v).flatMap((r) => { const y = toNum(r.you), i = industryLevel(r); return y === null || i === null ? [] : [[y, i]]; });
  return correlation(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
}
const similarityWords = (r: number): string => {
  const shown = r < 0 ? `−${fmtNum(-r, 2)}` : fmtNum(r, 2); // a proper minus sign, like every other figure
  return r >= 0.8 ? `r = ${shown} — your curve follows the industry’s: a red ocean` : r >= 0.5 ? `r = ${shown} — partly different from the industry` : `r = ${shown} — clearly different from the industry: a blue-ocean candidate`;
};

const blueocean: ModelDefinition = {
  toolId: 'blueocean',
  reference: {
    originator: 'W. Chan Kim & Renée Mauborgne — Blue Ocean Strategy',
    year: '2005',
    summary: 'Competing head-on with rivals in an existing industry (a red ocean) leaves little room for profit. The strategy canvas draws how you and your rivals compete on the factors the industry fights over, so you can see where your curve merely follows theirs and where you could break away into uncontested space (a blue ocean).',
    caption: 'Factors the industry competes on run along the bottom; how much each firm offers rises up the side. A good strategy has a curve that is different, focused and easy to put in a tagline.',
    howToRead: [
      'List the factors the industry competes on, then score what you and your two main rivals offer on each (1 = little, 5 = a great deal).',
      'If your curve runs alongside the industry’s you are competing on the same terms as everyone else. A blue-ocean curve diverges: high where the industry is low, low where it is high.',
      'Look beyond today’s customers: the biggest new demand usually sits with non-customers who find the industry’s offer too costly, too complex or irrelevant.',
    ],
  },
  sections: [
    section('industry', 'The industry and the rivals', 'Who is being compared with whom.',
      text('industry', 'Industry and offering compared', 'The industry, and the product or service whose value curve is drawn.', 'Precision auto components for OEMs', { prefill: 'business_context' }),
      text('competitor_a', 'Main competitor A', 'The first rival, or the typical rival of one kind (for example, a regional machining shop).', 'Regional machining shops'),
      text('competitor_b', 'Main competitor B', 'The second rival, or a rival of a different kind (for example, a large Tier-1).', 'Large Tier-1 suppliers')),
    section('canvas', 'The strategy canvas', 'The factors the industry competes on, scored for you and for each rival.',
      table('canvas', 'Factors the industry competes on', 'One row per factor. Score the level each firm offers from 1 (little) to 5 (a great deal). The industry level and your gap are worked out for you.', 'Factor', [
        col.text('factor', 'Factor the industry competes on', 'A factor customers compare suppliers on: price, lead time, certification, customisation, service, delivery reliability.'),
        col.rating('you', 'You', 'How much you offer on this factor.', { low: 'little', high: 'a great deal' }),
        col.rating('a', 'Competitor A', 'How much competitor A offers on this factor.', { low: 'little', high: 'a great deal' }),
        col.rating('b', 'Competitor B', 'How much competitor B offers on this factor.', { low: 'little', high: 'a great deal' }),
        col.computed('industry', 'Industry level', 'The average of the two rivals.', (r) => { const i = industryLevel(r); return i === null ? '' : fmtNum(i); }),
        col.computed('gap', 'Your gap', 'You minus the industry level.', (r) => { const g = gapOf(r); return g === null ? '' : signed(g); }),
      ], { min: 5, max: 12, example: { factor: 'Price', you: '3', a: '2', b: '4' } })),
    section('newcurve', 'The way out', 'Where the curve should break from the industry.',
      long('noncustomers', 'Non-customers', 'The three tiers of non-customers: “soon-to-be” (buy the minimum and are ready to leave), “refusing” (choose not to buy because the offer does not fit) and “unexplored” (never considered the industry). What would they value?', 'Start-ups that need prototype tooling in weeks, not months'),
      long('new_curve', 'The new value curve', 'How your curve should differ: the factors you would raise, reduce, eliminate or create, and for whom. This is the input to the ERRC grid.', 'Raise engineering support and lead time; reduce price competition'),
      text('tagline', 'Tagline', 'A compelling tagline that states the strategy in a sentence a customer would repeat. A good strategy has focus, divergence and a tagline that tells the truth.', 'Production-grade tooling in three weeks'),
      long('notes', 'Notes', 'Anything else worth recording: sources of the scores, doubts, questions to follow up.', '')),
  ],
  derived: [
    {
      key: 'similarity',
      label: 'How closely your curve follows the industry',
      help: 'The correlation between your curve and the rivals’ average across the factors. Shown once at least three factors are scored.',
      compute: (v) => { const r = curveSimilarity(v); return r === null ? null : similarityWords(r); },
      tone: (v) => { const r = curveSimilarity(v); return r === null ? undefined : r >= 0.8 ? 'warn' : r >= 0.5 ? 'neutral' : 'good'; },
    },
    {
      key: 'biggest_gap',
      label: 'Your biggest difference from the industry',
      compute: (v) => {
        const g = canvasRows(v).flatMap((r) => { const x = gapOf(r); return x === null ? [] : [{ factor: r.factor, gap: x }]; });
        if (!g.length) return null;
        const top = [...g].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
        return `${top.factor} (${signed(top.gap)})`;
      },
    },
    {
      key: 'above_below',
      label: 'Factors above and below the industry',
      compute: (v) => {
        const g = canvasRows(v).flatMap((r) => { const x = gapOf(r); return x === null ? [] : [x]; });
        return g.length ? `Above on ${g.filter((x) => x > 0).length} · below on ${g.filter((x) => x < 0).length} · level on ${g.filter((x) => x === 0).length}` : null;
      },
    },
  ],
  outputs: [
    {
      key: 'industry_factors',
      label: 'The factors the industry competes on, and where you stand',
      compute: (v) => {
        const r = canvasRows(v).filter((x) => toNum(x.you) !== null);
        return r.length ? r.map((x) => `${x.factor} (you ${x.you}${industryLevel(x) !== null ? `, industry ${fmtNum(industryLevel(x)!)}` : ''})`).join('; ') : null;
      },
    },
    { key: 'curve_similarity', label: 'How closely your curve follows the industry', compute: (v) => { const r = curveSimilarity(v); return r === null ? null : similarityWords(r); } },
    { key: 'new_curve', label: 'The new value curve', compute: (v) => v.fields.new_curve?.trim() || null },
    { key: 'noncustomers', label: 'Non-customers worth winning', compute: (v) => v.fields.noncustomers?.trim() || null },
    { key: 'tagline', label: 'Tagline', compute: (v) => v.fields.tagline?.trim() || null },
  ],
  legacyLabels: { 'Factors the industry competes on': 'notes', 'Your current curve vs. competitors': 'notes' },
  analysisGuide:
    'The verdict is whether the client has a differentiated value curve or is competing on the industry\'s terms, and what the new curve should be. Use the curve similarity worked out from the scores: a high correlation with the industry average is a red ocean. Check that the factors are ones customers actually compare, that the scores are honest (a client rating itself 5 on everything is not drawing a curve), and that the new curve names what to raise, reduce, eliminate and create rather than just "do better". ' +
    'Check the tagline is honest and focused. The strongest blue-ocean ideas come from non-customers; say whether the client has identified any, and what they would value.',
};

// ── ERRC grid ────────────────────────────────────────────────────────────────

const boxItems = (v: ModelValues, key: string): number => lines(v.fields[key]).length;
const errcBalance = (v: ModelValues): { cost: number; value: number } => ({ cost: boxItems(v, 'eliminate') + boxItems(v, 'reduce'), value: boxItems(v, 'raise') + boxItems(v, 'create') });

const errc: ModelDefinition = {
  toolId: 'errc',
  reference: {
    originator: 'W. Chan Kim & Renée Mauborgne — Blue Ocean Strategy (the four actions framework and the ERRC grid)',
    year: '2005',
    summary: 'Four questions turn the value curve from the strategy canvas into a redesign: which factors to eliminate, which to reduce, which to raise and which to create. Eliminating and reducing cut cost; raising and creating lift buyer value; doing both at once is value innovation.',
    caption: 'Eliminate and reduce lower the cost structure; raise and create lift buyer value.',
    howToRead: [
      'Eliminate: factors the industry takes for granted that buyers no longer value. Reduce: factors that have been over-engineered in a race with rivals.',
      'Raise: factors whose level should go well above the industry’s. Create: factors the industry has never offered.',
      'Check the four boxes against each other: a grid with nothing eliminated or reduced adds cost without the offsetting saving, and one with nothing raised or created is only a cost cut.',
    ],
  },
  sections: [
    section('start', 'Where you start', 'The value curve the grid redesigns.',
      long('current_curve', 'The factors the industry competes on today', 'The factors the industry competes on and where you stand today (from the strategy canvas).', 'Price, lead time, certification, customisation, engineering support', { prefill: { upstream: 'blueocean', output: 'industry_factors' } })),
    section('grid', 'The four actions', 'List the factors under each action, one per line. Keep each short and specific.',
      long('eliminate', 'Eliminate', 'Which of the factors that the industry takes for granted should be eliminated?', 'Free sample runs for every enquiry'),
      long('reduce', 'Reduce', 'Which factors should be reduced well below the industry’s standard?', 'Catalogue breadth; number of part families quoted'),
      long('raise', 'Raise', 'Which factors should be raised well above the industry’s standard?', 'Engineering support; speed of prototype tooling'),
      long('create', 'Create', 'Which factors should be created that the industry has never offered?', 'Production-grade tooling in three weeks for start-ups')),
    section('result', 'What it adds up to', 'The effect of the grid on cost and on value.',
      long('cost_effect', 'What this does to your costs', 'How eliminating and reducing lower your cost structure, and by how much if you can estimate it.', 'Fewer part families and no free samples cut quoting cost by about a fifth'),
      long('value_effect', 'What this does for buyer value', 'How raising and creating lift what buyers get, and which buyers (or non-customers) will pay for it.', 'Start-ups get working tooling in three weeks instead of twelve'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'items',
      label: 'Items in each box',
      compute: (v) => {
        const n = [boxItems(v, 'eliminate'), boxItems(v, 'reduce'), boxItems(v, 'raise'), boxItems(v, 'create')];
        return n.some((x) => x > 0) ? `Eliminate ${n[0]} · Reduce ${n[1]} · Raise ${n[2]} · Create ${n[3]}` : null;
      },
    },
    {
      key: 'balance',
      label: 'Is it value innovation?',
      help: 'Value innovation lowers cost and raises value at the same time.',
      compute: (v) => {
        const { cost, value } = errcBalance(v);
        if (cost === 0 && value === 0) return null;
        if (cost === 0) return 'Nothing eliminated or reduced: this adds value but not a cost advantage';
        if (value === 0) return 'Nothing raised or created: this only cuts cost';
        return 'Yes — cost goes down and value goes up together';
      },
      tone: (v) => { const { cost, value } = errcBalance(v); return cost === 0 && value === 0 ? undefined : cost > 0 && value > 0 ? 'good' : 'warn'; },
    },
  ],
  outputs: [
    {
      key: 'redesigned_offer',
      label: 'The redesigned offering',
      compute: (v) => {
        const part = (label: string, key: string) => (lines(v.fields[key]).length ? `${label}: ${lines(v.fields[key]).join(', ')}` : '');
        const text = [part('Eliminate', 'eliminate'), part('Reduce', 'reduce'), part('Raise', 'raise'), part('Create', 'create')].filter(Boolean).join('. ');
        return text || null;
      },
    },
    { key: 'raise_create', label: 'What is raised and created', compute: (v) => [...lines(v.fields.raise), ...lines(v.fields.create)].join(', ') || null },
    { key: 'cost_effect', label: 'Effect on costs', compute: (v) => v.fields.cost_effect?.trim() || null },
    { key: 'value_effect', label: 'Effect on buyer value', compute: (v) => v.fields.value_effect?.trim() || null },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is whether the grid is a genuine redesign (value innovation) or an incremental tweak. Check each box has specific, distinct factors (not "improve quality"), that something is genuinely eliminated or reduced (most clients list only additions), that what is raised or created matches the new curve and would be valued by non-customers, and that the cost and value effects follow from the grid. ' +
    'Flag factors that appear in two boxes and any "created" factor that rivals could copy in a month. State the effect on the cost structure in numbers where the client has them.',
};

// ── VRIO ─────────────────────────────────────────────────────────────────────

const YES_NO = ['Yes', 'No'] as const;
/** Barney's VRIO table: the answers to value, rarity, imitation cost and organisation give the competitive implication. */
function vrioImplication(r: Row): string {
  if (r.valuable === 'No') return 'Competitive disadvantage';
  if (r.valuable !== 'Yes') return '';
  if (r.rare === 'No') return 'Competitive parity';
  if (r.rare !== 'Yes') return '';
  if (r.imitate === 'No') return 'Temporary competitive advantage';
  if (r.imitate !== 'Yes') return '';
  if (r.organised === 'No') return 'Unexploited competitive advantage';
  return r.organised === 'Yes' ? 'Sustained competitive advantage' : '';
}
const VRIO_ORDER = ['Sustained competitive advantage', 'Unexploited competitive advantage', 'Temporary competitive advantage', 'Competitive parity', 'Competitive disadvantage'] as const;
const VRIO_SHORT: Record<(typeof VRIO_ORDER)[number], string> = { 'Sustained competitive advantage': 'Sustained', 'Unexploited competitive advantage': 'Unexploited', 'Temporary competitive advantage': 'Temporary', 'Competitive parity': 'Parity', 'Competitive disadvantage': 'Disadvantage' };
const vrioRows = (v: ModelValues): { name: string; implication: string }[] =>
  rows(v, 'resources').flatMap((r) => { const i = vrioImplication(r); return r.resource && i ? [{ name: r.resource, implication: i }] : []; });
const vrioNames = (v: ModelValues, implication: string): string => vrioRows(v).filter((x) => x.implication === implication).map((x) => x.name).join(', ');

const vrio: ModelDefinition = {
  toolId: 'vrio',
  reference: {
    originator: 'Jay B. Barney — “Firm Resources and Sustained Competitive Advantage” (1991) and Gaining and Sustaining Competitive Advantage (1995)',
    year: '1991 / 1995',
    summary: 'Tests whether a resource or capability is really a source of lasting advantage with four questions asked in order: is it valuable, is it rare, is it costly for rivals to imitate, and is the firm organised to capture its value? Each answer narrows what it can be worth.',
    caption: 'Four questions, asked in order. Only a resource that passes all four is a sustained competitive advantage.',
    howToRead: [
      'Valuable: does it let you exploit an opportunity or neutralise a threat? Rare: do few or no rivals control it? Costly to imitate: would a rival without it face a cost or time disadvantage getting it? Organised: do your policies, processes and people let you capture its value?',
      'A “no” stops the chain: not valuable is a disadvantage; valuable but common is only parity; valuable and rare but easily copied is a temporary advantage; passing the first three but not organised is an unexploited advantage.',
      'Test specific resources (a certification, a team, a customer relationship), not broad labels such as “quality”.',
    ],
  },
  sections: [
    section('scope', 'What is being tested', 'The business, and the kinds of resource and capability in scope.',
      text('scope', 'Business and resources in scope', 'The business or unit, and the kinds of resource tested: physical, human, organisational, financial, intangible (reputation, relationships, know-how).', 'Anand Auto Components: certifications, people, plant, relationships', { prefill: 'business_context' })),
    section('resources', 'The resources and capabilities', 'One row per resource or capability. Answer the four questions in order; the implication is worked out for you.',
      table('resources', 'Resources and capabilities tested', 'Answer Yes or No to each question. A “No” settles the implication, so later questions can be left blank.', 'Resource', [
        col.text('resource', 'Resource or capability', 'The specific resource or capability being tested.'),
        col.select('valuable', 'Valuable?', 'Does it let you exploit an opportunity or neutralise a threat?', YES_NO),
        col.select('rare', 'Rare?', 'Do few or no competitors control it?', YES_NO),
        col.select('imitate', 'Costly to imitate?', 'Would a competitor without it face a cost or time disadvantage in getting or developing it?', YES_NO),
        col.select('organised', 'Organised to capture it?', 'Are your policies, processes, structure and incentives set up to exploit it?', YES_NO),
        col.computed('implication', 'Competitive implication', 'Worked out from the four answers.', (r) => vrioImplication(r)),
        col.long('evidence', 'Evidence', 'What supports each answer: facts, not opinions.'),
      ], { min: 4, max: 10, example: { resource: 'IATF 16949 certification', valuable: 'Yes', rare: 'Yes', imitate: 'Yes', organised: 'Yes' } })),
    section('conclusion', 'What it means', 'Which advantages to build the strategy on.',
      long('conclusion', 'VRIO verdict', 'Which resources are real, lasting advantages, which are temporary, which are unexploited (and what organising them would take), and what this means for strategy.', 'Certification and engineering are lasting; delivery is parity'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'counts',
      label: 'Resources by implication',
      compute: (v) => {
        const r = vrioRows(v);
        return r.length ? VRIO_ORDER.filter((i) => r.some((x) => x.implication === i)).map((i) => `${VRIO_SHORT[i]} ${r.filter((x) => x.implication === i).length}`).join(' · ') : null;
      },
    },
    {
      key: 'sustained',
      label: 'Sustained advantages',
      compute: (v) => vrioNames(v, 'Sustained competitive advantage') || (vrioRows(v).length ? 'None yet' : null),
      tone: (v) => (vrioRows(v).length ? (vrioNames(v, 'Sustained competitive advantage') ? 'good' : 'warn') : undefined),
    },
    {
      key: 'unexploited',
      label: 'Advantages not yet captured',
      help: 'Valuable, rare and costly to imitate, but the business is not organised to exploit them.',
      compute: (v) => vrioNames(v, 'Unexploited competitive advantage') || (vrioRows(v).length ? 'None' : null),
      tone: (v) => (vrioNames(v, 'Unexploited competitive advantage') ? 'warn' : undefined),
    },
  ],
  outputs: [
    { key: 'sustained_advantages', label: 'Sustained advantages', compute: (v) => vrioNames(v, 'Sustained competitive advantage') || null },
    { key: 'temporary_advantages', label: 'Temporary advantages', compute: (v) => vrioNames(v, 'Temporary competitive advantage') || null },
    { key: 'unexploited_advantages', label: 'Advantages not yet captured', compute: (v) => vrioNames(v, 'Unexploited competitive advantage') || null },
    { key: 'conclusion', label: 'VRIO verdict', compute: (v) => v.fields.conclusion?.trim() || null },
  ],
  legacyLabels: { 'Resource/capability being tested': 'notes' },
  analysisGuide:
    'The verdict is which of the client\'s claimed advantages will actually last. Recompute each implication from the four answers: a resource is a sustained advantage only if all four are yes. Challenge every "yes" on rare and costly-to-imitate (is it really rare in this industry? would a rival really need years?) and every "yes" on organised (what in the structure, systems or incentives proves it?). ' +
    'Flag broad labels instead of specific resources, resources that depend on one person, and any "advantage" that is really a legal requirement for doing business (parity). Say what organising an unexploited advantage would take, and which advantage the strategy should be built on.',
};

// ── Resource-based view ──────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  'Financial resources', 'Physical resources', 'Technological resources', 'Reputation and brand',
  'Organisational resources (systems, culture)', 'Human resources (skills and know-how)',
] as const;
const resourceScore = (r: Row): number | null => { const s = toNum(r.strength), h = toNum(r.hard_to_copy); return s === null || h === null ? null : s + h; };
const resourcePotential = (r: Row): string => { const t = resourceScore(r); return t === null ? '' : t >= 8 ? 'Core strength' : t >= 6 ? 'Useful' : 'Ordinary'; };
const scoredResources = (v: ModelValues): { name: string; score: number }[] =>
  rows(v, 'resources').flatMap((r) => { const t = resourceScore(r); return t === null ? [] : [{ name: r.type, score: t }]; });

const rbv: ModelDefinition = {
  toolId: 'rbv',
  reference: {
    originator: 'Birger Wernerfelt (1984); Jay Barney (1991); Robert Grant (1991) — the resource-based view of the firm',
    year: '1984–1991',
    summary: 'Instead of starting from the market, the resource-based view starts from what the firm owns and can do. Resources (financial, physical, technological, reputation, organisational, human) combine into capabilities; those that are valuable, rare, hard to copy and hard to substitute explain why some firms keep winning.',
    caption: 'Resources combine into capabilities, which create competitive advantage and, through it, superior performance.',
    howToRead: [
      'Take stock of the six kinds of resource (Grant’s classification), then rate how strong each is against your competitors and how hard it would be for them to copy.',
      'Resources on their own rarely create advantage: the question is how they are combined into capabilities — what the business can do better than rivals.',
      'Strong and hard-to-copy resources are the foundation to build on; gaps in either are what to fix or avoid betting on.',
    ],
  },
  sections: [
    section('stocktake', 'Taking stock of resources', 'The six kinds of resource: what you have, how strong it is against rivals, and how hard it would be to copy.',
      table('resources', 'Resources by type', 'One row per kind of resource. The potential is worked out from the two ratings.', 'Resource type', [
        col.text('type', 'Resource type', 'The kind of resource.'),
        col.long('what', 'What the business has', 'The specific resources of this kind: assets, systems, people, relationships. Be concrete.'),
        col.rating('strength', 'Strength against competitors', 'How strong this resource is compared with your competitors’.', { low: 'weaker', high: 'much stronger' }),
        col.rating('hard_to_copy', 'Hard for rivals to copy', 'How difficult and slow it would be for a competitor to match it.', { low: 'easy to copy', high: 'very hard to copy' }),
        col.computed('potential', 'Potential', 'Strength + difficulty to copy: 8 or more is a core strength, 6–7 useful, below that ordinary.', (r) => resourcePotential(r)),
      ], {
        fixed: RESOURCE_TYPES,
        hints: {
          'Financial resources': 'Cash, borrowing capacity, access to capital and the strength of the balance sheet',
          'Physical resources': 'Plant, machinery, location, facilities, access to raw materials',
          'Technological resources': 'Technology, patents, process know-how, designs, software and data',
          'Reputation and brand': 'Brand, reputation with customers and suppliers, certifications and approvals held',
          'Organisational resources (systems, culture)': 'Systems and processes, planning and control, culture, structure, routines',
          'Human resources (skills and know-how)': 'Skills, experience and know-how of the people, their commitment, and their ability to work together',
        },
      })),
    section('capabilities', 'From resources to advantage', 'What the resources add up to.',
      long('core_capabilities', 'Core internal capabilities', 'What the business can do better than rivals by combining its resources — the activities it does well because of the resources it has (not the resources themselves).', 'Winning OEM approvals fast; redesigning parts for manufacturability'),
      long('advantage_story', 'How these resources create advantage', 'The chain from resources to capabilities to what customers value and pay for, and why rivals cannot simply copy it.', 'Certification and tooling design shorten approvals, which wins programmes'),
      long('gaps', 'Gaps to close', 'Resources or capabilities the strategy needs that the business lacks or is weak in, and how they would be closed (build, borrow or buy).', 'No aluminium thin-wall machining experience'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'strongest',
      label: 'Strongest resource',
      compute: (v) => {
        const s = scoredResources(v);
        if (!s.length) return null;
        const top = Math.max(...s.map((x) => x.score));
        return `${s.filter((x) => x.score === top).map((x) => x.name).join(' · ')} (${top}/10)`;
      },
    },
    {
      key: 'weakest',
      label: 'Weakest resource',
      compute: (v) => {
        const s = scoredResources(v);
        if (!s.length) return null;
        const low = Math.min(...s.map((x) => x.score));
        return `${s.filter((x) => x.score === low).map((x) => x.name).join(' · ')} (${low}/10)`;
      },
      tone: (v) => { const s = scoredResources(v); return s.length && Math.min(...s.map((x) => x.score)) <= 4 ? 'warn' : undefined; },
    },
    {
      key: 'core',
      label: 'Core strengths',
      help: 'Resource types scoring 8 or more out of 10.',
      compute: (v) => { const s = scoredResources(v).filter((x) => x.score >= 8); return s.length ? s.map((x) => x.name).join(', ') : (scoredResources(v).length ? 'None yet' : null); },
      tone: (v) => (scoredResources(v).length ? (scoredResources(v).some((x) => x.score >= 8) ? 'good' : 'warn') : undefined),
    },
  ],
  outputs: [
    { key: 'core_strengths', label: 'Core resource strengths', compute: (v) => { const s = scoredResources(v).filter((x) => x.score >= 8); return s.length ? s.map((x) => x.name).join(', ') : null; } },
    { key: 'capabilities', label: 'Core internal capabilities', compute: (v) => v.fields.core_capabilities?.trim() || null },
    { key: 'advantage_story', label: 'How the resources create advantage', compute: (v) => v.fields.advantage_story?.trim() || null },
    { key: 'gaps', label: 'Gaps to close', compute: (v) => v.fields.gaps?.trim() || null },
  ],
  legacyLabels: { 'Core internal capabilities': 'core_capabilities' },
  analysisGuide:
    'The verdict is what the business is really built on and whether it is enough. Use the potential scores (strength plus difficulty to copy). Check the client has separated resources (what it has) from capabilities (what it does with them), that "strong" ratings are against named competitors, and that the "hard to copy" ratings have a reason (time, cost, tacit knowledge, relationships). ' +
    'Name the one or two core strengths the strategy should be built on, the weakest resource type and whether it is a gap or simply unimportant, and whether the advantage story is a chain a rival could not easily copy.',
};

// ── Core competence ──────────────────────────────────────────────────────────

const competenceScores = (r: Row): number[] => ['markets', 'benefit', 'imitate'].map((k) => toNum(r[k])).filter((n): n is number => n !== null);
function competenceVerdict(r: Row): string {
  const s = competenceScores(r);
  if (s.length < 3) return '';
  const min = Math.min(...s);
  return min >= 4 ? 'Core competence' : min >= 3 ? 'Candidate — strengthen the weakest test' : 'Not a core competence';
}
const competences = (v: ModelValues): { name: string; verdict: string }[] =>
  rows(v, 'competences').flatMap((r) => { const x = competenceVerdict(r); return r.competence && x ? [{ name: r.competence, verdict: x }] : []; });

const corecompetence: ModelDefinition = {
  toolId: 'corecompetence',
  reference: {
    originator: 'C. K. Prahalad & Gary Hamel — “The Core Competence of the Corporation”, Harvard Business Review',
    year: '1990',
    summary: 'A company is like a tree: end products are the leaves, business units the branches, core products the trunk, and the root system — the core competencies that feed everything above it — is the source of its strength. A core competence passes three tests: it opens access to many markets, it makes a real difference to what customers value, and it is hard to imitate.',
    caption: 'Competencies are the roots, core products the trunk, business units the branches and end products the leaves.',
    howToRead: [
      'List the candidate competencies — bundles of skills and technology, not single skills or products — and score each on the three tests from 1 to 5.',
      'A core competence scores 4 or 5 on all three: it gives access to a wide variety of markets, makes a significant contribution to the customer benefits of the end product, and is difficult for competitors to imitate.',
      'Then ask where else the competence could be applied: new products and new markets are where the next business comes from.',
    ],
  },
  sections: [
    section('candidates', 'The candidates', 'Where the list of competencies comes from, and the capabilities behind it.',
      long('candidate_source', 'Where the candidates come from', 'The lasting advantages found earlier (VRIO) and the resource and capability view: the skills and technologies the business is best at.', 'Certification, tooling design, precision machining', { prefill: { upstream: 'vrio', output: 'sustained_advantages' } }),
      long('capability_base', 'The capabilities behind them', 'The capabilities from the resource-based view that each competence is built on.', 'Fast OEM approvals; redesign for manufacturability', { prefill: { upstream: 'rbv', output: 'capabilities' } })),
    section('tests', 'The three tests', 'Score each candidate competence from 1 to 5 on the three tests of Prahalad and Hamel.',
      table('competences', 'Candidate competencies', 'One row per candidate. The verdict is worked out from the lowest of the three scores.', 'Competence', [
        col.text('competence', 'Candidate core competence', 'A bundle of skills and technology that runs through the business — not a single product or a single skill.'),
        col.rating('markets', 'Access to many markets', 'Does it open access to a wide variety of markets, not just today’s?', { low: 'one market', high: 'many markets' }),
        col.rating('benefit', 'Customer benefit', 'Does it make a significant contribution to the benefits customers see in the end product?', { low: 'slight', high: 'significant' }),
        col.rating('imitate', 'Difficult to imitate', 'How hard would it be for competitors to copy, given the combination of skills and technology?', { low: 'easy to copy', high: 'very difficult' }),
        col.computed('verdict', 'Core competence?', 'Core (4 or 5 on every test), candidate (3 or more), or not core.', (r) => competenceVerdict(r)),
        col.long('applications', 'Where it could be applied', 'The products and markets, today’s and new, where the competence could be used.'),
      ], { min: 3, max: 8, example: { competence: 'Precision machining to OEM tolerances', markets: '4', benefit: '5', imitate: '4' } })),
    section('tree', 'The tree and the next act', 'What the competencies mean for products and growth.',
      long('core_products', 'Core products', 'The components or products that embody the competence and could be sold to other businesses (the trunk of the tree).', 'Precision shafts, gears and housings'),
      long('new_applications', 'Transferable market/product applications', 'New products and markets where the competence could be applied. These feed the growth choices (Ansoff) and the longer-term bets (Three Horizons).', 'EV motor housings; rail and agricultural-equipment parts'),
      long('build_plan', 'How to build and protect it', 'What it takes to build the competence further and keep it from leaking: investment, people, partners, protection.', 'Invest in tooling design talent; keep key engineers'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'counts',
      label: 'Competencies by verdict',
      compute: (v) => {
        const c = competences(v);
        return c.length ? `Core ${c.filter((x) => x.verdict === 'Core competence').length} · Candidate ${c.filter((x) => x.verdict.startsWith('Candidate')).length} · Not core ${c.filter((x) => x.verdict.startsWith('Not')).length}` : null;
      },
    },
    {
      key: 'core',
      label: 'Core competencies',
      compute: (v) => { const c = competences(v).filter((x) => x.verdict === 'Core competence'); return c.length ? c.map((x) => x.name).join(', ') : (competences(v).length ? 'None yet' : null); },
      tone: (v) => (competences(v).length ? (competences(v).some((x) => x.verdict === 'Core competence') ? 'good' : 'warn') : undefined),
    },
  ],
  outputs: [
    { key: 'core_competences', label: 'Core competencies', compute: (v) => { const c = competences(v).filter((x) => x.verdict === 'Core competence'); return c.length ? c.map((x) => x.name).join(', ') : null; } },
    { key: 'new_applications', label: 'New applications of the competence', compute: (v) => v.fields.new_applications?.trim() || null },
    { key: 'core_products', label: 'Core products', compute: (v) => v.fields.core_products?.trim() || null },
  ],
  legacyLabels: { 'Candidate core competencies': 'notes' },
  analysisGuide:
    'The verdict is which, if any, of the candidates are genuine core competencies and where they could take the business next. A core competence scores 4 or 5 on all three tests; use the verdicts as worked out from the lowest score. Check that each candidate is a bundle of skills and technology (not a product or a single skill), that "access to many markets" is argued with named markets, and that "difficult to imitate" has a reason. ' +
    'Name the one competence the next move should be built on, the most promising new application, and whether the competencies feed the growth choices and the longer-term bets.',
};

export const ADVANTAGE_MODELS: ModelDefinition[] = [blueocean, errc, vrio, rbv, corecompetence];

// Exported for the tests, which check the rules directly.
export { vrioImplication, competenceVerdict, correlation };
