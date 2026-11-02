/**
 * defs/portfolio.ts — the growth and portfolio frameworks: the Ansoff Matrix and the BCG growth-share matrix.
 * (More are added here as the catalogue is converted.)
 */
import { col, long, num, section, select, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, Row } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];

// ── Ansoff Matrix ────────────────────────────────────────────────────────────

const ANSOFF = ['Market penetration', 'Market development', 'Product development', 'Diversification'] as const;

/** potential + fit + (6 − risk): higher is more attractive. Null until all three are rated. */
function ansoffScore(r: Row): number | null {
  const p = toNum(r.potential), f = toNum(r.fit), k = toNum(r.risk);
  return p === null || f === null || k === null ? null : p + f + (6 - k);
}

const scoredStrategies = (v: ModelValues): { strategy: string; score: number }[] =>
  rows(v, 'strategies').flatMap((r) => { const s = ansoffScore(r); return s === null ? [] : [{ strategy: r.strategy, score: s }]; });

const topStrategy = (v: ModelValues): { strategy: string; score: number } | null => {
  const s = scoredStrategies(v);
  return s.length ? [...s].sort((a, b) => b.score - a.score)[0] : null;
};

const ansoff: ModelDefinition = {
  toolId: 'ansoff',
  reference: {
    originator: 'H. Igor Ansoff — “Strategies for Diversification”, Harvard Business Review',
    year: '1957',
    summary: 'Chooses a growth direction by combining two questions — are we selling existing or new products, into existing or new markets? — which gives four strategies of rising risk.',
    caption: 'Moving right (new products) or down (new markets) takes you further from what you know, and risk rises.',
    howToRead: [
      'Market penetration is closest to what you do today and carries the least risk; diversification changes both products and markets at once and carries the most.',
      'List the concrete moves under each strategy, then rate the size of the prize, how well it fits your capabilities, and the risk.',
      'Most businesses should exhaust penetration before moving outward — unless the core market is saturated.',
    ],
  },
  sections: [
    section('today', 'Where you are today', 'The starting point the four strategies are measured from.',
      long('products', 'Current products and services', 'What you sell now: the products and services that earn most of your revenue.', 'Precision-machined components', { prefill: 'business_context' }),
      long('markets', 'Current markets and customers', 'Who you sell to now: customer segments, industries, regions and channels.', 'Domestic car makers and their suppliers', { prefill: 'business_context' })),
    section('options', 'The four growth strategies', 'For each strategy, list the moves you could make, then rate the prize, the fit and the risk.',
      table('strategies', 'Growth options', 'One row per Ansoff strategy.', 'Strategy', [
        col.text('strategy', 'Strategy', 'The Ansoff strategy.'),
        col.long('options', 'Moves you could make', 'The concrete initiatives under this strategy — specific enough to cost and schedule.'),
        col.rating('potential', 'Size of the prize', 'How much revenue or margin it could add.', { low: 'small', high: 'large' }),
        col.rating('fit', 'Fit with your capabilities', 'How well your skills, assets and relationships suit it.', { low: 'poor fit', high: 'strong fit' }),
        col.rating('risk', 'Risk', 'How likely it is to go wrong, and how costly that would be.', { low: 'low risk', high: 'high risk' }),
        col.computed('score', 'Attractiveness', 'Prize + fit + safety (6 − risk), out of 15. An aid to comparison, not a verdict.', (r) => { const s = ansoffScore(r); return s === null ? '' : `${s} / 15`; }),
      ], {
        fixed: ANSOFF,
        hints: {
          'Market penetration': 'Existing products, existing markets — win share from rivals, raise usage per customer, retain and cross-sell, price and promote',
          'Market development': 'Existing products, new markets — new regions or countries, new customer segments, new sales channels',
          'Product development': 'New products, existing markets — new models, features, services or packaging for your current customers',
          'Diversification': 'New products, new markets — related (adjacent to what you do) or unrelated; the riskiest, so the case must be the strongest',
        },
      })),
    section('choice', 'Your choice', 'Commit to a direction, and say why.',
      select('chosen', 'Chosen growth strategy', 'The strategy you will pursue first.', ANSOFF, 'Market development'),
      long('rationale', 'Why this one, and what would change your mind', 'The reasons for the choice, the risks you are accepting, and what evidence would make you switch.', 'Penetration is nearly saturated; new markets spread the customer base', { prefill: { upstream: 'pestel', output: 'so_what' } })),
  ],
  derived: [
    {
      key: 'top',
      label: 'Highest-scoring strategy',
      help: 'Prize + fit + safety, out of 15.',
      compute: (v) => { const t = topStrategy(v); return t ? `${t.strategy} (${t.score} / 15)` : null; },
    },
    {
      key: 'choice_check',
      label: 'Your choice against the scores',
      compute: (v) => {
        const t = topStrategy(v), chosen = v.fields.chosen;
        if (!t || !chosen) return null;
        return chosen === t.strategy ? 'Matches the highest score' : `Differs from the highest score (${t.strategy}) — explain why in your rationale`;
      },
      tone: (v) => { const t = topStrategy(v), chosen = v.fields.chosen; return !t || !chosen ? undefined : chosen === t.strategy ? 'good' : 'warn'; },
    },
  ],
  outputs: [
    { key: 'chosen_strategy', label: 'Chosen growth strategy', compute: (v) => v.fields.chosen?.trim() || null },
    { key: 'rationale', label: 'Rationale for the choice', compute: (v) => v.fields.rationale?.trim() || null },
    {
      key: 'chosen_moves',
      label: 'Moves under the chosen strategy',
      compute: (v) => rows(v, 'strategies').find((r) => r.strategy === v.fields.chosen)?.options?.trim() || null,
    },
    { key: 'top_scoring', label: 'Highest-scoring strategy', compute: (v) => topStrategy(v)?.strategy ?? null },
  ],
  legacyLabels: { 'Current products': 'products', 'Current markets': 'markets', 'Chosen growth vector': 'rationale' },
  analysisGuide:
    'The verdict is the recommended growth strategy and, if it matters, the order (for example "market development now, product development next"). ' +
    'Compare the chosen strategy with the attractiveness scores and with the risk ratings: if it departs from the highest score, say whether the rationale justifies that. ' +
    'Penetration should be exhausted before the client moves outward unless the core is saturated; diversification needs the strongest evidence. Check that each option is a concrete move, not a slogan, and that the choice is consistent with what the earlier tools in the thread established.',
};

// ── BCG growth-share matrix ──────────────────────────────────────────────────

const DEFAULT_GROWTH_CUTOFF = 10;
const DEFAULT_SHARE_CUTOFF = 1;

function bcgQuadrant(r: Row, v: ModelValues): string {
  const g = toNum(r.growth), s = toNum(r.share);
  if (g === null || s === null) return '';
  const gc = toNum(v.fields.growth_cutoff) ?? DEFAULT_GROWTH_CUTOFF;
  const sc = toNum(v.fields.share_cutoff) ?? DEFAULT_SHARE_CUTOFF;
  return g >= gc ? (s >= sc ? 'Star' : 'Question mark') : s >= sc ? 'Cash cow' : 'Dog';
}

const PLURAL: Record<string, string> = { Star: 'Stars', 'Question mark': 'Question marks', 'Cash cow': 'Cash cows', Dog: 'Dogs' };
const QUADRANTS = ['Star', 'Cash cow', 'Question mark', 'Dog'] as const;

const classified = (v: ModelValues): { name: string; revenue: number | null; q: string; plan: string }[] =>
  rows(v, 'lines').flatMap((r) => { const q = bcgQuadrant(r, v); return q ? [{ name: r.name ?? '', revenue: toNum(r.revenue), q, plan: r.plan ?? '' }] : []; });

function revenueMix(v: ModelValues): { q: string; pct: number }[] | null {
  const items = classified(v).filter((x) => x.revenue !== null && x.revenue > 0);
  const total = items.reduce((a, x) => a + x.revenue!, 0);
  if (!total) return null;
  return QUADRANTS.map((q) => ({ q, pct: (items.filter((x) => x.q === q).reduce((a, x) => a + x.revenue!, 0) / total) * 100 }));
}

const bcg: ModelDefinition = {
  toolId: 'bcg',
  reference: {
    originator: 'Bruce Henderson — Boston Consulting Group',
    year: '1970',
    summary: 'Sorts each product line or business unit by two things — how fast its market is growing and how large its share is relative to the strongest competitor — into Stars, Question marks, Cash cows and Dogs, to decide where to invest, hold, harvest or exit.',
    caption: 'Market growth (up) against relative market share (across, high on the left). Bubble area is the product line’s revenue.',
    howToRead: [
      'Relative share is your share divided by the largest competitor’s share. A 20% share against a 40% leader is 0.5×; 1.0× or more means you lead.',
      'Market growth is the growth of the market, not of your own sales. Above the cut-off is “high growth”.',
      'Cash cows should fund Stars and the best Question marks; Dogs are held for cash or exited.',
    ],
  },
  sections: [
    section('settings', 'Cut-offs', 'Where “high” begins on each axis. The usual values are filled in if you leave these blank.',
      num('growth_cutoff', 'Market growth cut-off', 'The growth rate above which a market counts as high growth. 10% is common; use your industry’s own average growth if it is very different.', '% a year', '10'),
      num('share_cutoff', 'Relative share cut-off', 'The relative share at or above which you count as strong. 1.0× means you are as big as the largest competitor; some use 1.5×.', '×', '1.0')),
    section('lines', 'Your product lines', 'One row per product line or business unit. Quadrants are worked out for you.',
      table('lines', 'Product lines', 'Enter each product line with its revenue and its two BCG measures.', 'Product line', [
        col.text('name', 'Product line or business unit', 'The product line, business unit or brand.'),
        col.num('revenue', 'Revenue', 'Annual revenue of the line (its size on the chart).', '₹ lakh'),
        col.num('growth', 'Market growth rate', 'How fast the MARKET for this line is growing a year — not your own sales growth.', '%'),
        col.num('share', 'Relative market share', 'Your market share ÷ the largest competitor’s share. 1.0 = equal to the leader.', '×'),
        col.computed('quadrant', 'Quadrant', 'Worked out from growth and share against the cut-offs.', (r, v) => bcgQuadrant(r, v)),
        col.select('plan', 'Strategy', 'What you will do with it.', ['Build', 'Hold', 'Harvest', 'Divest']),
      ], { min: 3, max: 10, example: { name: 'Brake pads', revenue: '4,700', growth: '9', share: '1.2' } })),
    section('decision', 'Where the cash goes', 'The portfolio decision the matrix is for.',
      long('allocation', 'Capital allocation decision', 'Where the cash from Cash cows and Stars will go: which lines to fund, hold, harvest or exit, and what must be true to move a Question mark.', 'Fund the Star from the Cash cow; run the Dog for cash'),
      long('notes', 'Notes', 'Anything else worth recording: sources of the share and growth figures, caveats.', '')),
  ],
  derived: [
    {
      key: 'mix',
      label: 'Revenue by quadrant',
      compute: (v) => { const m = revenueMix(v); return m ? m.filter((x) => x.pct > 0).map((x) => `${PLURAL[x.q]} ${Math.round(x.pct)}%`).join(' · ') : null; },
    },
    {
      key: 'balance',
      label: 'Portfolio balance',
      compute: (v) => {
        const c = classified(v);
        if (c.length === 0) return null;
        const has = (q: string) => c.some((x) => x.q === q);
        const m = revenueMix(v);
        const dogs = m?.find((x) => x.q === 'Dog')?.pct ?? 0;
        if (!has('Cash cow') && (has('Question mark') || has('Star'))) return 'No cash cow: nothing funds the growth lines';
        if (dogs >= 25) return `${Math.round(dogs)}% of revenue is in Dogs`;
        if (has('Cash cow') && (has('Star') || has('Question mark'))) return 'Cash cows can fund the growth lines';
        return 'Add more product lines for a balanced view';
      },
      tone: (v) => {
        const c = classified(v);
        const has = (q: string) => c.some((x) => x.q === q);
        const dogs = revenueMix(v)?.find((x) => x.q === 'Dog')?.pct ?? 0;
        if (!has('Cash cow') && (has('Question mark') || has('Star'))) return 'bad';
        if (dogs >= 25) return 'warn';
        return has('Cash cow') && (has('Star') || has('Question mark')) ? 'good' : 'neutral';
      },
    },
  ],
  outputs: [
    {
      key: 'quadrants',
      label: 'Where each product line sits',
      compute: (v) => {
        const c = classified(v);
        return c.length ? QUADRANTS.filter((q) => c.some((x) => x.q === q)).map((q) => `${PLURAL[q]}: ${c.filter((x) => x.q === q).map((x) => x.name).join(', ')}`).join('; ') : null;
      },
    },
    { key: 'build_lines', label: 'Lines to build', compute: (v) => classified(v).filter((x) => x.plan === 'Build').map((x) => x.name).join(', ') || null },
    { key: 'harvest_divest_lines', label: 'Lines to harvest or divest', compute: (v) => classified(v).filter((x) => x.plan === 'Harvest' || x.plan === 'Divest').map((x) => x.name).join(', ') || null },
    { key: 'allocation', label: 'Capital allocation decision', compute: (v) => v.fields.allocation?.trim() || null },
    { key: 'revenue_mix', label: 'Revenue by quadrant', compute: (v) => { const m = revenueMix(v); return m ? m.filter((x) => x.pct > 0).map((x) => `${PLURAL[x.q]} ${fmtNum(x.pct, 0)}%`).join(', ') : null; } },
  ],
  legacyLabels: { 'Product lines': 'notes', 'Revenue share (Value Scan)': 'notes', 'Quadrant placement': 'allocation' },
  analysisGuide:
    'The verdict is the health of the portfolio: is there a Cash cow generating the cash, and is it being directed to the Stars and the best Question marks? ' +
    'Use the quadrants as worked out from the figures (they are shown in the table). Check that growth is the MARKET\'s growth and share is RELATIVE share (against the largest competitor) — flag figures that look like the client\'s own growth or absolute share. ' +
    'Say how much revenue sits in each quadrant, name the lines to build, hold, harvest and divest, and call out any plan that contradicts the quadrant (for example investing in a Dog) and whether the notes justify it.',
};

// ── GE–McKinsey nine-box and the Directional Policy Matrix ───────────────────

/** Whole-number ratings read in three bands: 4–5 high, 3 middle, 1–2 low. */
type Band = 'high' | 'mid' | 'low';
const bandOf = (n: number | null): Band | null => (n === null ? null : n >= 4 ? 'high' : n === 3 ? 'mid' : 'low');

type GeZone = 'Invest / grow' | 'Invest selectively' | 'Harvest / divest';
/** Rows: industry attractiveness. Columns: business strength (strong, average, weak). */
const GE_GRID: Record<Band, Record<Band, GeZone>> = {
  high: { high: 'Invest / grow', mid: 'Invest / grow', low: 'Invest selectively' },
  mid: { high: 'Invest / grow', mid: 'Invest selectively', low: 'Harvest / divest' },
  low: { high: 'Invest selectively', mid: 'Harvest / divest', low: 'Harvest / divest' },
};
const ATTR_WORD: Record<Band, string> = { high: 'High', mid: 'Medium', low: 'Low' };
const STRENGTH_WORD: Record<Band, string> = { high: 'Strong', mid: 'Average', low: 'Weak' };

function geCell(r: Row): { zone: GeZone; cell: string } | null {
  const a = bandOf(toNum(r.attractiveness)), s = bandOf(toNum(r.strength));
  return a === null || s === null ? null : { zone: GE_GRID[a][s], cell: `${ATTR_WORD[a]} attractiveness · ${STRENGTH_WORD[s]}` };
}
const geUnits = (v: ModelValues): { name: string; revenue: number | null; zone: GeZone; plan: string }[] =>
  rows(v, 'units').flatMap((r) => { const c = geCell(r); return c ? [{ name: r.unit ?? '', revenue: toNum(r.revenue), zone: c.zone, plan: r.plan ?? '' }] : []; });
const GE_ZONES: GeZone[] = ['Invest / grow', 'Invest selectively', 'Harvest / divest'];
const GE_SHORT: Record<GeZone, string> = { 'Invest / grow': 'Grow', 'Invest selectively': 'Selective', 'Harvest / divest': 'Harvest' };
const namesIn = (xs: { name: string }[]): string => xs.map((x) => x.name).filter(Boolean).join(', ');
const GE_PLANS = ['Invest to grow', 'Invest selectively', 'Hold and defend', 'Harvest', 'Divest'] as const;

const ge9box: ModelDefinition = {
  toolId: 'ge9box',
  reference: {
    originator: 'General Electric and McKinsey & Company — the GE–McKinsey nine-box matrix',
    year: '1970s',
    summary: 'Rates each business unit on two things — how attractive its industry is and how strong the business is within it — and places it on a nine-cell grid whose zones say where to invest, where to be selective, and where to harvest or divest. A finer alternative to the BCG matrix.',
    caption: 'Industry attractiveness (up) against business strength (strong on the left). The zones run from invest at the top left to harvest or divest at the bottom right.',
    howToRead: [
      'Weigh several factors for each axis (not one number): for the industry, things like size, growth, profitability and competitive intensity; for the business, things like relative share, brand, cost position and quality.',
      'Rate each unit 1–5 on both axes. Four or five is high, three is middle, one or two is low; the grid cell it lands in gives its zone.',
      'Green cells: invest to grow. Gold cells: invest selectively, protect earnings. Red cells: harvest, or divest. Then ask where the cash to invest will come from.',
    ],
  },
  sections: [
    section('factors', 'What you weighed', 'The nine-box rests on a short list of factors for each axis. Write down which you used, so the ratings can be challenged.',
      long('attractiveness_factors', 'Industry attractiveness — what you weighed', 'The factors that make an industry attractive to be in: market size and growth, profit margins, competitive intensity, entry barriers, technology and regulatory change, cyclicality. Say which mattered most.', 'Market growth, margins, competitive intensity, EV exposure'),
      long('strength_factors', 'Business strength — what you weighed', 'The factors that make a business strong in its industry: relative market share and its trend, brand, cost position, product quality, distribution and customer access, management and people. Say which mattered most.', 'Share against the leader, approvals held, cost position, quality record')),
    section('units', 'Your businesses', 'One row per business unit or product line: its size, and a 1–5 rating on each axis.',
      table('units', 'Business units on the grid', 'The zone is worked out from the two ratings.', 'Business unit', [
        col.text('unit', 'Business unit or product line', 'The unit being placed on the grid.'),
        col.num('revenue', 'Revenue', 'Annual revenue — the size of the unit (the bubble on the grid).', '₹ lakh'),
        col.rating('attractiveness', 'Industry attractiveness', 'How attractive the unit’s industry is, from the factors you weighed.', { low: 'unattractive', high: 'very attractive' }),
        col.rating('strength', 'Business strength', 'How strong the business is within its industry, from the factors you weighed.', { low: 'weak', high: 'strong' }),
        col.computed('cell', 'Grid cell', 'Where the two ratings put the unit on the grid.', (r) => geCell(r)?.cell ?? ''),
        col.computed('zone', 'Zone', 'The strategy the cell points to.', (r) => geCell(r)?.zone ?? ''),
        col.select('plan', 'Your plan', 'What you will actually do with the unit.', GE_PLANS),
      ], { min: 3, max: 10, example: { unit: 'Brake components', revenue: '4,700', attractiveness: '3', strength: '4' } })),
    section('decision', 'Where the money goes', 'The investment decision the grid is for.',
      long('allocation', 'Investment priorities', 'Which units get investment, which are held for cash, and which are harvested or sold — and where the cash to invest will come from.', 'Fund the growth unit from the units that earn the most cash'),
      long('notes', 'Notes', 'Anything else worth recording: sources of the ratings, caveats.', '')),
  ],
  derived: [
    {
      key: 'zones',
      label: 'Units by zone',
      compute: (v) => { const u = geUnits(v); return u.length ? GE_ZONES.map((z) => `${GE_SHORT[z]} ${u.filter((x) => x.zone === z).length}`).join(' · ') : null; },
    },
    {
      key: 'harvest_share',
      label: 'Revenue in harvest / divest cells',
      help: 'The share of revenue sitting in the red cells.',
      compute: (v) => {
        const u = geUnits(v).filter((x) => x.revenue !== null && x.revenue > 0);
        const total = u.reduce((a, x) => a + x.revenue!, 0);
        return total ? `${fmtNum((u.filter((x) => x.zone === 'Harvest / divest').reduce((a, x) => a + x.revenue!, 0) / total) * 100, 0)}%` : null;
      },
      tone: (v) => {
        const u = geUnits(v).filter((x) => x.revenue !== null && x.revenue > 0);
        const total = u.reduce((a, x) => a + x.revenue!, 0);
        if (!total) return undefined;
        const share = u.filter((x) => x.zone === 'Harvest / divest').reduce((a, x) => a + x.revenue!, 0) / total;
        return share >= 0.5 ? 'bad' : share >= 0.25 ? 'warn' : 'good';
      },
    },
    {
      key: 'invest',
      label: 'Units to invest in',
      compute: (v) => { const u = geUnits(v).filter((x) => x.zone === 'Invest / grow'); return u.length ? namesIn(u) : (geUnits(v).length ? 'None in the green cells' : null); },
    },
  ],
  outputs: [
    { key: 'zone_summary', label: 'Where each unit sits', compute: (v) => { const u = geUnits(v); return u.length ? GE_ZONES.filter((z) => u.some((x) => x.zone === z)).map((z) => `${z}: ${namesIn(u.filter((x) => x.zone === z))}`).join('; ') : null; } },
    { key: 'invest_units', label: 'Units to invest in', compute: (v) => namesIn(geUnits(v).filter((x) => x.zone === 'Invest / grow' || x.plan === 'Invest to grow')) || null },
    { key: 'harvest_units', label: 'Units to harvest or divest', compute: (v) => namesIn(geUnits(v).filter((x) => x.plan === 'Harvest' || x.plan === 'Divest')) || null },
    { key: 'allocation', label: 'Investment priorities', compute: (v) => v.fields.allocation?.trim() || null },
  ],
  legacyLabels: { 'Business units / product lines': 'notes', 'Industry attractiveness score': 'notes', 'Competitive strength score': 'notes' },
  analysisGuide:
    'The verdict is whether the portfolio is balanced between units that earn and units that grow, and where investment should go. Use the zones as worked out from the ratings. Check that each axis is rated from several factors (not one), that the ratings are evidenced, and that no unit is rated high on both axes just because the client is fond of it. ' +
    'Name the units to invest in, the ones to run for earnings and the ones to harvest or divest, call out any plan that contradicts the zone (for example investing in a red cell) and whether the notes justify it, and say where the cash to invest will come from.',
};

type DpmBand = 'Strong' | 'Average' | 'Weak';
/** Shell's policy for each cell: rows are the company's competitive capability, columns the prospects of the business sector. */
const DPM_POLICY: Record<DpmBand, [string, string, string]> = {
  Strong: ['Cash generation', 'Growth', 'Leader'],
  Average: ['Phased withdrawal', 'Custodial', 'Try harder'],
  Weak: ['Disinvest', 'Phased withdrawal', 'Double or quit'],
};
const DPM_POLICIES = ['Leader', 'Growth', 'Try harder', 'Double or quit', 'Custodial', 'Cash generation', 'Phased withdrawal', 'Disinvest'] as const;
function dpmPolicy(r: Row): string {
  const p = toNum(r.prospects), c = toNum(r.capability);
  if (p === null || c === null) return '';
  const row: DpmBand = c >= 4 ? 'Strong' : c === 3 ? 'Average' : 'Weak';
  return DPM_POLICY[row][p >= 4 ? 2 : p === 3 ? 1 : 0];
}
const dpmUnits = (v: ModelValues): { name: string; policy: string }[] =>
  rows(v, 'units').flatMap((r) => { const p = dpmPolicy(r); return p ? [{ name: r.unit ?? '', policy: p }] : []; });

const dpm: ModelDefinition = {
  toolId: 'dpm',
  reference: {
    originator: 'S. J. Q. Robinson, R. E. Hichens & D. P. Wade — “The Directional Policy Matrix: Tool for Strategic Planning”, Long Range Planning (Shell Chemicals)',
    year: '1978',
    summary: 'Sets each business’s sector prospects against the company’s competitive capabilities on a nine-cell grid, and gives each cell a named policy: leader, growth, try harder, double or quit, custodial, cash generation, phased withdrawal or disinvest. Often used as a second opinion beside the GE–McKinsey nine-box.',
    caption: 'Business sector prospects across, the company’s competitive capabilities down. Every cell names the policy to follow.',
    howToRead: [
      'Rate the prospects of each business’s sector (market growth, market quality, availability of inputs, environmental aspects) and your capabilities in it (market position, production capability, product development), each from 1 to 5.',
      'The cell where the two ratings meet names the policy: for example strong capability in an attractive sector is “leader”, weak capability in an attractive sector is “double or quit”.',
      'Use it to cross-check the nine-box: where the two disagree, find out why before committing capital.',
    ],
  },
  sections: [
    section('factors', 'What you weighed', 'Write down the factors behind each axis so the ratings can be challenged.',
      long('prospects_factors', 'Business sector prospects — what you weighed', 'Shell’s factors: market growth, market quality (profit stability, how much price competition), availability of inputs, and environmental aspects such as regulation and sustainability pressure.', 'Market growth, price stability, EV exposure'),
      long('capability_factors', 'Competitive capabilities — what you weighed', 'Shell’s factors: your market position (share and standing), production capability (cost, quality, capacity) and product research and development.', 'Share against the leader, approvals held, cost position, design capability')),
    section('units', 'Your businesses', 'One row per business or product line, with a 1–5 rating on each axis.',
      table('units', 'Businesses on the matrix', 'The policy is worked out from the two ratings.', 'Business', [
        col.text('unit', 'Business or product line', 'The business being placed on the matrix.'),
        col.num('revenue', 'Revenue', 'Annual revenue — the size of the business.', '₹ lakh'),
        col.rating('prospects', 'Sector prospects', 'How attractive the prospects of the business’s sector are.', { low: 'unattractive', high: 'attractive' }),
        col.rating('capability', 'Your competitive capability', 'How strong your capabilities are in that sector.', { low: 'weak', high: 'strong' }),
        col.computed('policy', 'Policy', 'The policy for the cell where the two ratings meet.', (r) => dpmPolicy(r)),
        col.long('evidence', 'Evidence for the ratings', 'The facts behind the two ratings.'),
      ], { min: 3, max: 10, example: { unit: 'Brake components', revenue: '4,700', prospects: '3', capability: '5' } })),
    section('decision', 'What it means', 'The policy decisions, and how they compare with the nine-box.',
      long('decisions', 'Policy decisions', 'What you will do with each business, following its policy, and the money or people involved.', 'Fund the leader; run cash-generation lines for cash'),
      long('cross_check', 'How this compares with the nine-box', 'Where this reading differs from the GE–McKinsey nine-box for the same businesses, and why. Different answers are a reason to look again at the evidence.', 'Both put the engine parts in the invest cells'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'policies',
      label: 'Businesses by policy',
      compute: (v) => { const u = dpmUnits(v); return u.length ? DPM_POLICIES.filter((p) => u.some((x) => x.policy === p)).map((p) => `${p} ${u.filter((x) => x.policy === p).length}`).join(' · ') : null; },
    },
    {
      key: 'back',
      label: 'To back',
      help: 'Businesses with the leader, growth or try-harder policy.',
      compute: (v) => { const u = dpmUnits(v).filter((x) => ['Leader', 'Growth', 'Try harder'].includes(x.policy)); return u.length ? namesIn(u) : (dpmUnits(v).length ? 'None' : null); },
    },
    {
      key: 'exit',
      label: 'To run down or leave',
      help: 'Businesses with the phased-withdrawal or disinvest policy.',
      compute: (v) => { const u = dpmUnits(v).filter((x) => ['Phased withdrawal', 'Disinvest'].includes(x.policy)); return u.length ? namesIn(u) : (dpmUnits(v).length ? 'None' : null); },
      tone: (v) => (dpmUnits(v).some((x) => ['Phased withdrawal', 'Disinvest'].includes(x.policy)) ? 'warn' : undefined),
    },
  ],
  outputs: [
    { key: 'policy_summary', label: 'Policy for each business', compute: (v) => { const u = dpmUnits(v); return u.length ? u.map((x) => `${x.name}: ${x.policy}`).join('; ') : null; } },
    { key: 'back_units', label: 'Businesses to back', compute: (v) => namesIn(dpmUnits(v).filter((x) => ['Leader', 'Growth', 'Try harder'].includes(x.policy))) || null },
    { key: 'decisions', label: 'Policy decisions', compute: (v) => v.fields.decisions?.trim() || null },
  ],
  legacyLabels: { 'Market attractiveness rating': 'notes', 'Business capability rating': 'notes' },
  analysisGuide:
    'The verdict is the policy for each business and whether the set of policies makes sense together: something has to generate the cash that growth policies consume. Use the policies as worked out from the ratings (leader, growth, try harder, double or quit, custodial, cash generation, phased withdrawal, disinvest). Check each rating has evidence from the factors Shell names, and compare with the nine-box if the client has done it: say where the two disagree and which to trust. ' +
    'Flag a "double or quit" business that has not been given a decision date, and any plan that contradicts the policy.',
};

// ── Three Horizons ───────────────────────────────────────────────────────────

const HORIZONS_LIST = ['Horizon 1', 'Horizon 2', 'Horizon 3'] as const;
type HorizonName = (typeof HORIZONS_LIST)[number];
/** Where years-to-meaningful-profit puts an initiative: up to 2 years is Horizon 1, 2–5 Horizon 2, beyond Horizon 3. */
const horizonForYears = (years: number): HorizonName => (years <= 2 ? 'Horizon 1' : years <= 5 ? 'Horizon 2' : 'Horizon 3');
const initiatives = (v: ModelValues): Row[] => rows(v, 'initiatives').filter((r) => r.initiative);
const investmentByHorizon = (v: ModelValues): { h: HorizonName; amount: number }[] =>
  HORIZONS_LIST.map((h) => ({ h, amount: initiatives(v).filter((r) => r.horizon === h).reduce((a, r) => a + (toNum(r.investment) ?? 0), 0) }));
const namesFor = (v: ModelValues, h: HorizonName): string => initiatives(v).filter((r) => r.horizon === h).map((r) => r.initiative).join(', ');

const horizons3: ModelDefinition = {
  toolId: 'horizons3',
  reference: {
    originator: 'Mehrdad Baghai, Stephen Coley & David White (McKinsey & Company) — The Alchemy of Growth',
    year: '1999',
    summary: 'A business that wants to keep growing has to manage three time horizons at once: defend and extend the core it earns from today, build the emerging businesses that will be tomorrow’s growth, and plant the options that may become the core after that.',
    caption: 'Three overlapping growth curves over time: today’s core fades, the emerging businesses rise as it does, and the options start further out.',
    howToRead: [
      'Horizon 1 is the core you earn from now (usually the next two years), Horizon 2 the emerging businesses that will become significant over about two to five years, Horizon 3 the options that may pay off in five years or more.',
      'List the initiatives in each horizon with what they cost and when they should start to earn. An initiative that is too far from earning for Horizon 2, or too near for Horizon 3, is in the wrong place.',
      'The warning sign is a business that puts almost all its investment into Horizon 1: it earns well today and has nothing to grow from when the core fades.',
    ],
  },
  sections: [
    section('horizons', 'The three horizons', 'Describe, in a sentence or two each, what belongs in each horizon for your business.',
      long('h1_core', 'H1 — core business', 'Horizon 1: the businesses that earn most of today’s profit. How to defend and extend them: efficiency, share, pricing, cost.', 'Precision-machined brake and clutch components', { prefill: 'business_context' }),
      long('h2_emerging', 'H2 — adjacent bet', 'Horizon 2: emerging businesses that are growing and need investment to scale — a new product, market or business model that is already showing traction.', 'EV motor housings and battery trays', { prefill: { upstream: 'corecompetence', output: 'new_applications' } }),
      long('h3_options', 'H3 — transformational bet', 'Horizon 3: options on possible future businesses — ideas, pilots and partnerships that are cheap now and may become the core later.', 'Lightweight aluminium machining; contract manufacturing for EV start-ups', { prefill: { upstream: 'pivotpersist', output: 'h3_direction' } })),
    section('initiatives', 'The initiatives', 'List what you are doing or plan to do in each horizon, with the money involved and when it should earn.',
      table('initiatives', 'Initiatives by horizon', 'One row per initiative. The timing check compares the years to meaningful profit with the horizon you chose.', 'Initiative', [
        col.text('initiative', 'Initiative', 'The project, product, market or business being built or defended.'),
        col.select('horizon', 'Horizon', 'Where it belongs: Horizon 1 (core), 2 (emerging) or 3 (options).', HORIZONS_LIST),
        col.num('investment', 'Investment', 'What you will put in over the next three years (money, plus a cost for people’s time if you can).', '₹ lakh'),
        col.num('payoff', 'Expected profit at maturity', 'Annual profit the initiative could earn once it is established.', '₹ lakh a year'),
        col.num('years', 'Years to meaningful profit', 'How many years until it earns a meaningful profit.', 'years'),
        col.computed('timing', 'Timing check', 'Compares the years to profit with the horizon (up to 2 years: Horizon 1; 2–5: Horizon 2; beyond 5: Horizon 3).', (r) => {
          const y = toNum(r.years);
          if (y === null || !r.horizon) return '';
          const fit = horizonForYears(y);
          return fit === r.horizon ? 'Fits the horizon' : `Timing looks like ${fit}`;
        }),
      ], { min: 3, max: 12, example: { initiative: 'Line 2 productivity programme', horizon: 'Horizon 1', investment: '120', payoff: '260', years: '1' } })),
    section('balance', 'Is the balance right?', 'Look at where the money is going.',
      long('balance_view', 'Is the balance right?', 'Whether the split of investment across the three horizons gives the business a future as well as a present, and what you would change.', 'Too little going into Horizon 3; fund two pilots'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'split',
      label: 'Investment by horizon',
      compute: (v) => {
        const by = investmentByHorizon(v), total = by.reduce((a, x) => a + x.amount, 0);
        return total > 0 ? by.map((x) => `${x.h.replace('Horizon ', 'H')} ${fmtNum((x.amount / total) * 100, 0)}%`).join(' · ') : null;
      },
      tone: (v) => {
        const by = investmentByHorizon(v), total = by.reduce((a, x) => a + x.amount, 0);
        if (total <= 0) return undefined;
        const h1 = by[0].amount / total, h3 = by[2].amount / total;
        return h1 >= 0.9 || h3 === 0 ? 'warn' : 'good';
      },
    },
    {
      key: 'future',
      label: 'Is anything building the future?',
      compute: (v) => {
        const list = initiatives(v);
        if (!list.length) return null;
        const future = list.filter((r) => r.horizon === 'Horizon 2' || r.horizon === 'Horizon 3');
        return future.length ? `${future.length} initiative${future.length === 1 ? '' : 's'} in Horizons 2 and 3` : 'No — everything is in Horizon 1';
      },
      tone: (v) => (initiatives(v).length ? (initiatives(v).some((r) => r.horizon === 'Horizon 2' || r.horizon === 'Horizon 3') ? 'good' : 'bad') : undefined),
    },
    {
      key: 'misplaced',
      label: 'Initiatives in the wrong horizon',
      compute: (v) => {
        const checked = initiatives(v).filter((r) => toNum(r.years) !== null && r.horizon);
        if (!checked.length) return null;
        const wrong = checked.filter((r) => horizonForYears(toNum(r.years)!) !== r.horizon);
        return wrong.length ? wrong.map((r) => r.initiative).join(', ') : 'None';
      },
      tone: (v) => {
        const checked = initiatives(v).filter((r) => toNum(r.years) !== null && r.horizon);
        return checked.length ? (checked.some((r) => horizonForYears(toNum(r.years)!) !== r.horizon) ? 'warn' : 'good') : undefined;
      },
    },
  ],
  outputs: [
    { key: 'investment_split', label: 'Investment by horizon', compute: (v) => { const by = investmentByHorizon(v), total = by.reduce((a, x) => a + x.amount, 0); return total > 0 ? by.map((x) => `${x.h} ${fmtNum((x.amount / total) * 100, 0)}%`).join(', ') : null; } },
    { key: 'h2_bets', label: 'Horizon 2 initiatives', compute: (v) => namesFor(v, 'Horizon 2') || v.fields.h2_emerging?.trim() || null },
    { key: 'h3_bets', label: 'Horizon 3 initiatives', compute: (v) => namesFor(v, 'Horizon 3') || v.fields.h3_options?.trim() || null },
    { key: 'h1_core', label: 'The core business', compute: (v) => v.fields.h1_core?.trim() || null },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is whether the business is managing all three horizons or living off Horizon 1. Look at the investment split and at what sits in Horizons 2 and 3; a business with no Horizon 2 or 3 initiatives has no growth beyond the core, and one that puts everything into the far horizons is neglecting the profit that funds them. Check each initiative sits in the horizon its timing says (up to two years Horizon 1, two to five Horizon 2, beyond that Horizon 3). ' +
    'Name the Horizon 2 bet most likely to become the next core and the Horizon 3 options worth keeping cheap, and say what the balance should be before more capital is committed.',
};

// ── Corporate parenting advantage ────────────────────────────────────────────

const PARENTING_ZONES = ['Heartland', 'Edge of heartland', 'Ballast', 'Alien territory', 'Value trap'] as const;
/** Opportunity to add value against fit with the parent: high on both is the heartland; the extremes elsewhere are the other zones. */
function parentingZone(r: Row): string {
  const o = bandOf(toNum(r.opportunity)), f = bandOf(toNum(r.fit));
  if (o === null || f === null) return '';
  if (o === 'high' && f === 'high') return 'Heartland';
  if (o === 'high' && f === 'low') return 'Value trap';
  if (o === 'low' && f === 'high') return 'Ballast';
  if (o === 'low' && f === 'low') return 'Alien territory';
  return 'Edge of heartland';
}
const parentingUnits = (v: ModelValues): { name: string; zone: string }[] =>
  rows(v, 'units').flatMap((r) => { const z = parentingZone(r); return z ? [{ name: r.unit ?? '', zone: z }] : []; });

const parenting: ModelDefinition = {
  toolId: 'parenting',
  reference: {
    originator: 'Michael Goold, Andrew Campbell & Marcus Alexander — Corporate-Level Strategy: Creating Value in the Multibusiness Company',
    year: '1994',
    summary: 'A business unit belongs in a group only if the parent adds more value than it costs — or than another owner would add. The parenting-fit matrix asks two questions of each unit: is there an opportunity for the parent to improve it, and does the parent understand what the unit needs?',
    caption: 'Opportunity for the parent to add value (up) against fit with the parent’s skills (poor on the left). Only the heartland is a clear home.',
    howToRead: [
      'Heartland: a real opportunity to improve the unit, and a parent that understands its needs. This is where a parent creates value.',
      'Ballast: the parent understands the unit but there is little to improve; it is safe but adds nothing. Value trap: a tempting opportunity the parent will mishandle because it does not understand the unit.',
      'Alien territory: little to gain and little understanding, so another owner would do better. Edge of heartland: partial fit; decide after a closer look.',
    ],
  },
  sections: [
    section('parent', 'The parent', 'What the parent is genuinely good at, and the units under review.',
      long('parent_strengths', 'What the parent adds (parenting strengths)', 'What the parent is distinctively good at: for example financial control, a shared brand, technical know-how, access to customers or capital, management development. Be specific; “support” is not a strength.', 'Quality systems, customer access, financial discipline'),
      long('units_under_review', 'Business units under review', 'The business units, subsidiaries or product groups being reviewed, and how each is run today.', 'Components division and the tooling services unit')),
    section('units', 'Fit unit by unit', 'Rate each unit on the two questions of the matrix.',
      table('units', 'Parenting fit by unit', 'One row per unit. The zone is worked out from the two ratings.', 'Business unit', [
        col.text('unit', 'Business unit', 'The unit under review.'),
        col.rating('opportunity', 'Opportunity for the parent to add value', 'How much scope there is to improve the unit — better performance, cost, growth or decisions — that the parent could help with.', { low: 'little to improve', high: 'a great deal' }),
        col.rating('fit', 'Fit with the parent', 'How well the parent understands what this unit needs to succeed and has the skills to help with it.', { low: 'does not understand it', high: 'understands it well' }),
        col.computed('zone', 'Zone', 'Worked out from the two ratings.', (r) => parentingZone(r)),
        col.long('value_added', 'What the parent adds — or destroys', 'The specific help the parent gives this unit today, and any way the parent holds it back (bureaucracy, wrong targets, starving it of capital).'),
      ], { min: 2, max: 8, example: { unit: 'Tooling services', opportunity: '4', fit: '2' } })),
    section('decision', 'What it means', 'Which units belong in the group.',
      long('parenting_verdict', 'Which units to keep, fix or release', 'For each unit: keep it, change how the parent manages it, or release it to a better owner — and the first step.', 'Keep components; spin the tooling unit into a partnership'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'zones',
      label: 'Units by zone',
      compute: (v) => { const u = parentingUnits(v); return u.length ? PARENTING_ZONES.filter((z) => u.some((x) => x.zone === z)).map((z) => `${z} ${u.filter((x) => x.zone === z).length}`).join(' · ') : null; },
    },
    {
      key: 'heartland',
      label: 'Heartland units',
      compute: (v) => { const u = parentingUnits(v).filter((x) => x.zone === 'Heartland'); return u.length ? namesIn(u) : (parentingUnits(v).length ? 'None' : null); },
      tone: (v) => (parentingUnits(v).length ? (parentingUnits(v).some((x) => x.zone === 'Heartland') ? 'good' : 'warn') : undefined),
    },
    {
      key: 'at_risk',
      label: 'Alien territory and value traps',
      compute: (v) => { const u = parentingUnits(v).filter((x) => x.zone === 'Alien territory' || x.zone === 'Value trap'); return u.length ? namesIn(u) : (parentingUnits(v).length ? 'None' : null); },
      tone: (v) => (parentingUnits(v).some((x) => x.zone === 'Alien territory' || x.zone === 'Value trap') ? 'bad' : undefined),
    },
  ],
  outputs: [
    { key: 'zone_summary', label: 'Where each unit sits', compute: (v) => { const u = parentingUnits(v); return u.length ? PARENTING_ZONES.filter((z) => u.some((x) => x.zone === z)).map((z) => `${z}: ${namesIn(u.filter((x) => x.zone === z))}`).join('; ') : null; } },
    { key: 'keep_units', label: 'Units that fit the parent', compute: (v) => namesIn(parentingUnits(v).filter((x) => x.zone === 'Heartland' || x.zone === 'Edge of heartland')) || null },
    { key: 'release_units', label: 'Units another owner would run better', compute: (v) => namesIn(parentingUnits(v).filter((x) => x.zone === 'Alien territory' || x.zone === 'Value trap')) || null },
    { key: 'verdict', label: 'Which units to keep, fix or release', compute: (v) => v.fields.parenting_verdict?.trim() || null },
  ],
  legacyLabels: { 'Parent value-add per unit': 'notes' },
  analysisGuide:
    'The verdict is which units the parent should keep, change its management of, or release. Use the zones as worked out from the two ratings. The test is "would this unit be worth more under a different owner?" — say so plainly for alien-territory units and value traps. Check that the parent\'s strengths are specific and are used by the units placed in the heartland, and that fit is rated on the unit\'s real needs (its critical success factors), not on how pleasant the unit is to own. ' +
    'Remind the client that this tool only applies once there is more than one business unit.',
};

// ── Make, buy or ally (build, borrow or buy) ─────────────────────────────────

const ROUTES = ['Build (make)', 'Borrow (ally or contract)', 'Buy (acquire)'] as const;
const YES_NO = ['Yes', 'Partly', 'No'] as const;
const ROUTE_VERDICTS = [...ROUTES, 'Combine routes', 'No route needed'] as const;

const routeAnswer = (v: ModelValues, route: string): string => rows(v, 'routes').find((r) => r.route === route)?.answer ?? '';
/** The three questions in order: build if you can, otherwise borrow if you can, otherwise buy if you can. */
function routeIndicated(v: ModelValues): string | null {
  const [b, a, y] = ROUTES.map((r) => routeAnswer(v, r));
  if (!b && !a && !y) return null;
  if (b === 'Yes') return ROUTES[0];
  if (a === 'Yes') return ROUTES[1];
  if (y === 'Yes') return ROUTES[2];
  const partly = ROUTES.filter((r) => routeAnswer(v, r) === 'Partly');
  if (partly.length > 0) return `Combine routes (${partly.map((r) => r.split(' (')[0].toLowerCase()).join(' + ')})`;
  return b && a && y ? 'No route fits — revisit the need' : null;
}

const makebuyally: ModelDefinition = {
  toolId: 'makebuyally',
  reference: {
    originator: 'Laurence Capron & Will Mitchell — Build, Borrow, or Buy: Solving the Growth Dilemma',
    year: '2012',
    summary: 'When a business needs a capability it does not have, it can build it inside, borrow it through a contract or an alliance, or buy a company that has it. Capron and Mitchell turn the choice into three questions asked in order, so the route follows from the facts rather than from habit.',
    caption: 'Ask the questions in order: can we build it, can we borrow it, can we buy it?',
    howToRead: [
      'Build first, if the business has relevant resources inside and the time to develop the capability itself.',
      'Borrow if it cannot build in time: through a contract when the capability can be specified and bought, or through an alliance when it needs a partner it can trust to work alongside it.',
      'Buy when it needs full control, no one can lend it the capability, and a target can be found, afforded and integrated. A route that fails its question is not a route.',
    ],
  },
  sections: [
    section('gap', 'The gap', 'What is missing, and why it matters.',
      long('capability_gap', 'Capability gap', 'The capability or resource the business needs and does not have — a process, a technology, a geography, a certification — why it matters, and by when it is needed.', 'Aluminium machining and EV-specific tooling capability within 18 months', { prefill: 'business_context' })),
    section('routes', 'The three questions', 'Answer each question for the gap above, with the evidence.',
      table('routes', 'The three routes', 'One row per route. Answer Yes, Partly or No, and say why; add the time and cost if you can.', 'Route', [
        col.text('route', 'Route', 'The route to closing the gap.'),
        col.select('answer', 'Does it hold?', 'Does the question for this route have a yes answer?', YES_NO),
        col.long('evidence', 'The evidence', 'The facts behind the answer: the resources you have, the partners and contracts available, the targets you know of.'),
        col.num('months', 'Time to have the capability', 'How long until the capability is working by this route.', 'months'),
        col.num('cost', 'Cost', 'What this route would cost to get the capability working.', '₹ lakh'),
      ], {
        fixed: ROUTES,
        hints: {
          'Build (make)': 'Do we have relevant resources inside — people, plant, know-how we can extend — and enough time to develop the capability ourselves?',
          'Borrow (ally or contract)': 'Can we get it through a contract (if it can be specified and bought) or an alliance (if we need a partner we can trust to work with us) without giving away what we want to keep?',
          'Buy (acquire)': 'Is there a target that has it, can we afford it, and can we integrate it so the capability survives and we keep the control we need?',
        },
      })),
    section('verdict', 'The route you choose', 'Commit to a route, and say what would change it.',
      select('verdict', 'Make/Buy/Ally verdict', 'The route you choose for the gap.', ROUTE_VERDICTS, 'Borrow (ally or contract)'),
      long('rationale', 'Why this route, and what would change it', 'The reasons for the choice, the risks you are accepting (dependency, leakage, integration), and what would make you choose differently.', 'We cannot build in 18 months; a tooling partner already has the capability', { prefill: 'business_context' }),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'indicated',
      label: 'Where the three questions point',
      help: 'Build if the first answer is yes, else borrow if the second is, else buy if the third is.',
      compute: (v) => routeIndicated(v),
      tone: (v) => { const r = routeIndicated(v); return r === null ? undefined : r.startsWith('No route') ? 'bad' : r.startsWith('Combine') ? 'warn' : 'good'; },
    },
    {
      key: 'speed',
      label: 'Fastest route',
      compute: (v) => {
        const timed = rows(v, 'routes').filter((r) => toNum(r.months) !== null && r.answer && r.answer !== 'No');
        if (!timed.length) return null;
        const best = [...timed].sort((a, b) => (toNum(a.months) ?? 0) - (toNum(b.months) ?? 0))[0];
        return `${best.route} — ${fmtNum(toNum(best.months) ?? 0, 0)} months`;
      },
    },
    {
      key: 'agree',
      label: 'Your verdict against the questions',
      compute: (v) => {
        const verdict = v.fields.verdict, indicated = routeIndicated(v);
        if (!verdict || !indicated) return null;
        return indicated.startsWith(verdict.split(' (')[0]) ? 'Agrees with the questions' : `The questions point to ${indicated.toLowerCase()} — explain why you differ`;
      },
      tone: (v) => { const verdict = v.fields.verdict, indicated = routeIndicated(v); return verdict && indicated ? (indicated.startsWith(verdict.split(' (')[0]) ? 'good' : 'warn') : undefined; },
    },
  ],
  outputs: [
    { key: 'verdict', label: 'Route chosen', compute: (v) => v.fields.verdict?.trim() || null },
    { key: 'indicated_route', label: 'Where the three questions point', compute: (v) => routeIndicated(v) },
    { key: 'capability_gap', label: 'Capability gap', compute: (v) => v.fields.capability_gap?.trim() || null },
    { key: 'rationale', label: 'Why this route', compute: (v) => v.fields.rationale?.trim() || null },
  ],
  legacyLabels: { 'Make/Buy/Ally verdict': 'verdict' },
  analysisGuide:
    'The verdict is the route the evidence supports and whether the client\'s own choice agrees. Check the three questions were answered honestly and in order: build only if the internal resources are genuinely relevant and there is time; borrow only if the capability can be specified in a contract or a trustworthy partner exists, and say what could leak or lock the client in; buy only if a real target exists, is affordable and can be integrated. ' +
    'Flag a "build" that depends on hiring people the client has failed to hire before, a "borrow" with no named partner, and a "buy" with no target. A buy verdict should be passed on to the M&A synergy map; a build verdict to the operating model.',
};

// ── M&A synergy map ──────────────────────────────────────────────────────────

const SYNERGY_TYPES = ['Cost', 'Revenue', 'Capability or financial', 'Dis-synergy (a cost or loss)'] as const;
const SYNERGY_START = ['Year 1', 'Year 2', 'Year 3'] as const;
const SYNERGY_YEARS = 5;
const DEFAULT_DISCOUNT = 12;

interface SynergyLine { risked: number; start: number; oneOff: number }
function synergyLine(r: Row): SynergyLine | null {
  const value = toNum(r.value), p = toNum(r.probability);
  if (value === null || p === null) return null;
  const sign = r.type === 'Dis-synergy (a cost or loss)' ? -1 : 1;
  const start = r.starts === 'Year 3' ? 3 : r.starts === 'Year 2' ? 2 : 1;
  return { risked: (sign * value * Math.min(100, Math.max(0, p))) / 100, start, oneOff: toNum(r.one_off) ?? 0 };
}
const synergyLines = (v: ModelValues): SynergyLine[] => rows(v, 'synergies').flatMap((r) => { const l = synergyLine(r); return l ? [l] : []; });
const discountRate = (v: ModelValues): number => (toNum(v.fields.discount_rate) ?? DEFAULT_DISCOUNT) / 100;

/** Present value over five years of the risk-adjusted synergies, from the year each begins, less the one-off costs of achieving them. */
function synergyNpv(v: ModelValues): number | null {
  const lines = synergyLines(v);
  if (!lines.length) return null;
  const rate = discountRate(v);
  let npv = 0;
  for (const l of lines) {
    for (let t = l.start; t <= SYNERGY_YEARS; t += 1) npv += l.risked / Math.pow(1 + rate, t);
    npv -= l.oneOff;
  }
  return npv;
}
const lakh = (n: number): string => `${n < 0 ? '−' : ''}₹${fmtNum(Math.abs(n), 0)} lakh`;
const premiumPaid = (v: ModelValues): number | null => {
  const price = toNum(v.fields.price), standalone = toNum(v.fields.standalone_value);
  return price === null || standalone === null ? null : price - standalone;
};

const masynergy: ModelDefinition = {
  toolId: 'masynergy',
  reference: {
    originator: 'Michael Porter, Mark Sirower and Aswath Damodaran on valuing synergy (Competitive Advantage; The Synergy Trap; Investment Valuation)',
    year: '1985–2012',
    summary: 'An acquisition creates value only if the combined business is worth more than the two apart, and only if the buyer does not hand all of that gain to the seller in the price. The synergy map lists where the gain would come from, how likely it is, what it costs to achieve, and what it is worth against the premium.',
    caption: 'Cost, revenue and capability synergies add to the target’s value; dis-synergies and the cost of integration take away from it. Pay no more than the net.',
    howToRead: [
      'Cost synergies (overheads, purchasing, plant use) are the most reliable; revenue synergies (cross-selling, new markets) are the least. Capability and financial synergies sit between.',
      'For each synergy, put an annual value at full run-rate, the chance of achieving it, when it begins, and any one-off cost to achieve it. Dis-synergies (customers lost, people lost, distraction) are entered as positive losses.',
      'The net present value of the synergies is the most you can justify paying above the target’s standalone value. If the premium is higher, the buyer pays the seller for value it will have to create itself.',
    ],
  },
  sections: [
    section('target', 'The deal', 'Who is being bought, and why.',
      text('target', 'Target under review', 'The company, business or asset being considered.', 'A Chakan heat-treatment and tooling specialist', { prefill: 'business_context' }),
      long('deal_rationale', 'Why this target', 'The strategic reason for buying it rather than building or borrowing the capability.', 'Gives us in-house heat treatment and EV tooling capability', { prefill: { upstream: 'makebuyally', output: 'rationale' } })),
    section('price', 'Value and price', 'The numbers the synergies are measured against.',
      num('standalone_value', 'Standalone value of the target', 'What the target is worth on its own, without any benefit from you.', '₹ lakh', '600'),
      num('price', 'Price you expect to pay', 'The price you expect to pay for the target.', '₹ lakh', '780'),
      num('discount_rate', 'Discount rate', 'The yearly return you require on the deal’s risk. 12–15% is typical for an Indian MSME; leave blank to use 12%.', '% a year', '12')),
    section('synergies', 'Where the value would come from', 'List every synergy and dis-synergy you can name, with its value, its probability and its timing.',
      table('synergies', 'Synergies and dis-synergies', 'One row per source. The risk-adjusted annual value is worked out for you.', 'Synergy', [
        col.select('type', 'Type', 'Cost, revenue, capability or financial; or a dis-synergy (something lost).', SYNERGY_TYPES),
        col.text('source', 'Where it comes from', 'The specific source: which cost, which customers, which capability.'),
        col.num('value', 'Annual value at full run-rate', 'The yearly benefit once fully achieved (for a dis-synergy, the yearly loss, as a positive number).', '₹ lakh'),
        col.num('probability', 'Chance of achieving it', 'Your honest estimate of the chance it is achieved in full.', '%'),
        col.select('starts', 'First full year', 'The first year the full benefit is felt.', SYNERGY_START),
        col.num('one_off', 'One-off cost to achieve', 'A one-time cost needed to achieve it (integration, redundancy, systems).', '₹ lakh'),
        col.computed('risked', 'Risk-adjusted annual value', 'Annual value × chance (negative for a dis-synergy).', (r) => { const l = synergyLine(r); return l ? `${l.risked < 0 ? '−' : ''}₹${fmtNum(Math.abs(l.risked), 0)} lakh` : ''; }),
      ], { min: 4, max: 12, example: { type: 'Cost', source: 'In-house heat treatment replaces job work', value: '90', probability: '80', starts: 'Year 1', one_off: '20' } })),
    section('integration', 'Making it happen', 'The risks that decide whether the synergies are real.',
      long('integration_plan', 'Integration risks and plan', 'What could stop the synergies being achieved (people, systems, customers, culture) and how the integration will be run and by whom.', 'Keep the target’s foreman team; one integration lead for 12 months'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'run_rate',
      label: 'Risk-adjusted annual synergy',
      compute: (v) => { const l = synergyLines(v); return l.length ? `${lakh(l.reduce((a, x) => a + x.risked, 0))} a year` : null; },
    },
    {
      key: 'one_off',
      label: 'One-off cost to achieve',
      compute: (v) => { const l = synergyLines(v); return l.length ? lakh(l.reduce((a, x) => a + x.oneOff, 0)) : null; },
    },
    {
      key: 'npv',
      label: 'Value of the synergies (5-year NPV)',
      help: 'Risk-adjusted synergies over five years at the discount rate, less the one-off costs. It is the most you can justify paying above the standalone value.',
      compute: (v) => { const n = synergyNpv(v); return n === null ? null : lakh(n); },
      tone: (v) => { const n = synergyNpv(v); return n === null ? undefined : n > 0 ? 'good' : 'bad'; },
    },
    {
      key: 'premium_check',
      label: 'The premium against the synergies',
      compute: (v) => {
        const n = synergyNpv(v), p = premiumPaid(v);
        if (n === null || p === null) return null;
        return p <= n ? `Premium of ${lakh(p)} is covered — headroom ${lakh(n - p)}` : `Premium of ${lakh(p)} is ${lakh(p - n)} more than the synergies are worth`;
      },
      tone: (v) => { const n = synergyNpv(v), p = premiumPaid(v); return n === null || p === null ? undefined : p <= n ? 'good' : 'bad'; },
    },
  ],
  outputs: [
    { key: 'synergy_value', label: 'Value of the synergies (5-year NPV)', compute: (v) => { const n = synergyNpv(v); return n === null ? null : lakh(n); } },
    { key: 'premium_check', label: 'Premium against the synergies', compute: (v) => { const n = synergyNpv(v), p = premiumPaid(v); return n === null || p === null ? null : p <= n ? `Covered (premium ${lakh(p)}, synergies ${lakh(n)})` : `Not covered (premium ${lakh(p)}, synergies ${lakh(n)})`; } },
    { key: 'target', label: 'Target', compute: (v) => v.fields.target?.trim() || null },
    { key: 'deal_rationale', label: 'Why this target', compute: (v) => v.fields.deal_rationale?.trim() || null },
  ],
  legacyLabels: { 'Synergy sources identified': 'notes' },
  analysisGuide:
    'The verdict is whether the deal creates value at the expected price. Compare the premium (price less standalone value) with the net present value of the risk-adjusted synergies: if the premium is larger, the buyer is paying away value it must create alone. Recheck the arithmetic from the table, weight cost synergies more than revenue synergies, and challenge every probability above 80% for revenue synergies and any synergy with no named owner. ' +
    'Check that dis-synergies and one-off costs are included, not just benefits, and that the integration plan names who runs it. Say what price would make the deal work.',
};

// ── Pivot or persist ─────────────────────────────────────────────────────────

const TESTS = ['Is the core still defensible?', 'Is there a credible reinvention path?', 'Is staying the best use of the capital and team?'] as const;
const PATHS = ['Persist (defend the core)', 'Pivot (reinvent)', 'Exit and redeploy'] as const;
const PIVOT_TYPES = [
  'Zoom-in (one feature becomes the whole product)',
  'Zoom-out (the product becomes one feature of a bigger offering)',
  'Customer-segment pivot (same product, different customer)',
  'Customer-need pivot (same customer, a more pressing problem)',
  'Platform pivot (an application becomes a platform, or the reverse)',
  'Business-architecture pivot (high margin and low volume, or the reverse)',
  'Value-capture pivot (a different way of earning from the same value)',
  'Engine-of-growth pivot (a different way of growing)',
  'Channel pivot (a different way of reaching customers)',
  'Technology pivot (the same solution, a different technology)',
] as const;
const YEARS = ['Three years ago', 'Two years ago', 'Last year'] as const;

const testScore = (v: ModelValues, question: string): number | null => toNum(rows(v, 'tests').find((r) => r.question === question)?.score);

/** Persist if the core is defensible and staying is worth it; pivot if the core is weak but reinvention is credible; exit if staying is not the best use, or neither the core nor reinvention holds. */
function indicatedPath(v: ModelValues): string | null {
  const core = testScore(v, TESTS[0]), reinvent = testScore(v, TESTS[1]), stay = testScore(v, TESTS[2]);
  if (core === null || reinvent === null || stay === null) return null;
  if (stay <= 2 || (core <= 2 && reinvent <= 2)) return PATHS[2];
  if (core >= 4 && stay >= 3) return PATHS[0];
  if (reinvent >= 4 && stay >= 3) return PATHS[1];
  return 'Unclear — gather more evidence first';
}
const trendRows = (v: ModelValues): { year: string; revenue: number; margin: number | null }[] =>
  YEARS.flatMap((y) => { const r = rows(v, 'trend').find((x) => x.year === y); const rev = r ? toNum(r.revenue) : null; return r && rev !== null ? [{ year: y, revenue: rev, margin: toNum(r.margin) }] : []; });
const cagr = (v: ModelValues): number | null => {
  const t = trendRows(v);
  if (t.length < 2 || t[0].revenue <= 0) return null;
  return Math.pow(t[t.length - 1].revenue / t[0].revenue, 1 / (YEARS.indexOf(t[t.length - 1].year as (typeof YEARS)[number]) - YEARS.indexOf(t[0].year as (typeof YEARS)[number]))) - 1;
};

const pivotpersist: ModelDefinition = {
  toolId: 'pivotpersist',
  reference: {
    originator: 'Eric Ries — The Lean Startup (the pivot-or-persevere decision); the exit option follows standard corporate-renewal practice',
    year: '2011',
    summary: 'When growth has stalled, the honest question is not “how do we grow faster?” but “should we still be doing this?”. Three tests give the answer: is the core still defensible, is there a credible way to reinvent it, and is staying the best use of the capital and the people?',
    caption: 'Three questions in order lead to three paths: persist, pivot or exit and redeploy.',
    howToRead: [
      'Score each question from 1 (no) to 5 (yes) and write the evidence. The paths follow the scores: a defensible core persists; a weak core with a credible reinvention pivots; a business that is not the best use of its capital, or has neither, exits and redeploys.',
      'A pivot is a structured course correction that keeps what you have learned and changes one fundamental thing — the customer, the need, the channel, the way you earn — to test a new hypothesis.',
      'This is a Renewal-phase tool. One bad year is a Value Scan question; pivot-or-persist is for a business that has stalled for more than a year.',
    ],
  },
  sections: [
    section('situation', 'What has changed', 'The plateau or decline, in plain facts.',
      long('situation', 'What has changed', 'What has stalled or declined, since when, and what you think is behind it. Use figures, not feelings.', 'Growth stalled two years ago as two OEM programmes ended', { prefill: 'value_scan' }),
      table('trend', 'Revenue and margin, last three years', 'The trend behind the question. The change from year to year is worked out for you.', 'Year', [
        col.text('year', 'Year', 'The year.'),
        col.num('revenue', 'Revenue', 'Annual revenue.', '₹ lakh'),
        col.num('margin', 'Operating margin', 'Operating profit as a share of revenue.', '%'),
        col.computed('change', 'Change in revenue', 'The change from the year before, worked out for you.', (r, v) => {
          const i = YEARS.indexOf(r.year as (typeof YEARS)[number]);
          if (i <= 0) return '';
          const prev = rows(v, 'trend').find((x) => x.year === YEARS[i - 1]);
          const a = toNum(r.revenue), b = prev ? toNum(prev.revenue) : null;
          return a === null || b === null || b === 0 ? '' : `${a >= b ? '+' : '−'}${fmtNum(Math.abs((a / b - 1) * 100), 1)}%`;
        }),
      ], { fixed: YEARS })),
    section('tests', 'The three tests', 'Score each question from 1 (no) to 5 (yes), and write the evidence.',
      table('tests', 'The diagnostic questions', 'One row per question.', 'Question', [
        col.text('question', 'Question', 'The question.'),
        col.rating('score', 'Score', 'Your honest score for the question.', { low: 'no', high: 'yes' }),
        col.long('evidence', 'The evidence', 'The facts behind the score: customers, margins, rivals, capabilities, cash.'),
      ], {
        fixed: TESTS,
        hints: {
          'Is the core still defensible?': 'Do customers still need what you make, do you still hold an edge rivals cannot easily copy, and are margins holding? (Check VRIO and the core competencies.)',
          'Is there a credible reinvention path?': 'A specific new direction you could take with real customer pull, using capabilities you have or can get, at a cost you can afford.',
          'Is staying the best use of the capital and team?': 'Compared with putting the same money and people into something else, is carrying on here the best use? Score 1 if a clearly better use exists.',
        },
      })),
    section('decision', 'The path', 'Commit to a path and plan the first steps.',
      select('recommended_path', 'Recommended path', 'The path you choose.', PATHS, 'Pivot (reinvent)'),
      long('why', 'Why this path', 'The reasons for the choice, the risks you accept, and what would make you change it.', 'The core is defensible for three years but not beyond', { prefill: 'business_context' }),
      select('pivot_type', 'If pivoting: what kind of pivot', 'The kind of change to test (Ries’s catalogue). Leave blank if you are not pivoting.', PIVOT_TYPES, 'Customer-need pivot (same customer, a more pressing problem)'),
      long('h3_direction', 'If pivoting: the new direction', 'The new direction to test, the hypothesis behind it, and the smallest experiment that would show whether it works. It feeds the Three Horizons model as a bet.', 'Test EV motor housings with two OEMs before committing capital'),
      long('wind_down', 'If exiting: wind-down and redeployment', 'How the business would be wound down or sold, what it would release, and where the capital and people would go. It feeds the financial model as a scenario.', ''),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'indicated',
      label: 'Where the scores point',
      help: 'Persist if the core is defensible; pivot if it is weak but reinvention is credible; exit if staying is not the best use or neither holds.',
      compute: (v) => indicatedPath(v),
      tone: (v) => { const p = indicatedPath(v); return p === null ? undefined : p === PATHS[0] ? 'good' : p === PATHS[1] ? 'warn' : p === PATHS[2] ? 'bad' : 'neutral'; },
    },
    {
      key: 'lowest',
      label: 'Lowest score',
      help: 'The weakest of the three answers is the one that matters most.',
      compute: (v) => {
        const scores = TESTS.flatMap((q) => { const s = testScore(v, q); return s === null ? [] : [{ q, s }]; });
        if (!scores.length) return null;
        const min = Math.min(...scores.map((x) => x.s));
        return `${scores.filter((x) => x.s === min).map((x) => x.q.replace(/\?$/, '')).join(' · ')} (${min}/5)`;
      },
    },
    {
      key: 'growth',
      label: 'Revenue growth a year',
      compute: (v) => { const g = cagr(v); return g === null ? null : `${g >= 0 ? '+' : '−'}${fmtNum(Math.abs(g) * 100, 1)}% a year`; },
      tone: (v) => { const g = cagr(v); return g === null ? undefined : g > 0.03 ? 'good' : g >= 0 ? 'warn' : 'bad'; },
    },
    {
      key: 'agree',
      label: 'Your path against the scores',
      compute: (v) => { const p = indicatedPath(v), chosen = v.fields.recommended_path; return !p || !chosen ? null : p === chosen ? 'Agrees with the scores' : `The scores point to “${p}” — explain why you differ`; },
      tone: (v) => { const p = indicatedPath(v), chosen = v.fields.recommended_path; return !p || !chosen ? undefined : p === chosen ? 'good' : 'warn'; },
    },
  ],
  outputs: [
    { key: 'recommended_path', label: 'Recommended path', compute: (v) => v.fields.recommended_path?.trim() || null },
    { key: 'indicated_path', label: 'Where the scores point', compute: (v) => indicatedPath(v) },
    { key: 'h3_direction', label: 'The new direction to test (if pivoting)', conditional: true, compute: (v) => (v.fields.recommended_path === PATHS[1] ? v.fields.h3_direction?.trim() || null : null) },
    { key: 'wind_down', label: 'Wind-down and redeployment (if exiting)', conditional: true, compute: (v) => (v.fields.recommended_path === PATHS[2] ? v.fields.wind_down?.trim() || null : null) },
  ],
  legacyLabels: {
    'Is the core still defensible? (1-5)': 'tests#Is the core still defensible?.score',
    'Is there a credible reinvention path? (1-5)': 'tests#Is there a credible reinvention path?.score',
    'Revenue trend, last 3 years': 'notes',
    'Recommended path': 'recommended_path',
  },
  analysisGuide:
    'The verdict is the path — persist, pivot or exit and redeploy — and whether the client\'s own choice agrees with their scores. Weigh the weakest answer most: one clear "no" matters more than three middling answers. Check the scores against the trend (a business growing at 8% a year is unlikely to have a core that is not defensible) and against the evidence written for each. ' +
    'For a pivot, check the new direction is a testable hypothesis with a small first experiment, uses capabilities the business has, and names which fundamental thing changes. For an exit, check the wind-down says where the capital and people go. Remind the client this tool is for a business that has stalled for more than a year.',
};

export const PORTFOLIO_MODELS: ModelDefinition[] = [ansoff, bcg, ge9box, dpm, horizons3, parenting, makebuyally, masynergy, pivotpersist];

// Exported for the tests, which check the quadrant rule directly.
export { bcgQuadrant, ansoffScore, geCell, dpmPolicy, parentingZone, horizonForYears };
