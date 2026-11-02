/**
 * defs/environment.ts — frameworks that read the world around the business and the structure of its industry:
 * PESTEL / SWOT and Porter's Five Forces. (More are added here as the catalogue is converted.)
 *
 * Each definition follows the published model — its elements, in its order, under its names — and says in `help` what the
 * originator says belongs in each. Examples are placeholders; the worked example lives in samples/environment.ts.
 */
import { col, long, mean, numbers, section, select, sum, table, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues, Row } from '../types';

const rows = (v: ModelValues, key: string): Row[] => v.tables[key] ?? [];

// ── PESTEL / SWOT ────────────────────────────────────────────────────────────

const PESTEL_FACTORS = ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'] as const;
const EFFECTS = ['Opportunity', 'Threat', 'Mixed', 'Neutral'] as const;
const HORIZONS = ['Now', 'Within 1–3 years', 'Beyond 3 years'] as const;

const ratedFactors = (v: ModelValues): Row[] => rows(v, 'pestel_rating').filter((r) => r.effect && toNum(r.strength) !== null);

const pestel: ModelDefinition = {
  toolId: 'pestel',
  reference: {
    originator: 'PESTEL: Francis Aguilar’s environmental scanning (1967) · SWOT: Stanford Research Institute, 1960s',
    year: '1960s',
    summary: 'Two complementary scans. PESTEL looks outward at the six forces in the macro-environment; SWOT sets what you find against your own internal strengths and weaknesses, to show where you stand.',
    caption: 'PESTEL (left) scans the macro-environment; SWOT (right) sorts what you find into inside and outside, helpful and harmful.',
    howToRead: [
      'Start with PESTEL: list the specific factors in each of the six boxes, then rate how strongly each affects you and whether it helps or hurts.',
      'SWOT is the synthesis: strengths and weaknesses are inside the business, opportunities and threats are outside it.',
      'Good entries are specific and evidenced. An opportunity or a threat should usually trace back to a PESTEL factor.',
    ],
  },
  sections: [
    section('scope', 'Scope', 'What the scan is about, so every entry is judged against the same question.',
      text('scope', 'Scope of this analysis', 'The business, market or decision this scan is about, and the time horizon (for example, the next three years).', 'A Tier-2 auto-parts maker, next three years', { prefill: 'business_context' })),
    section('pestel', 'PESTEL — the macro-environment', 'List the specific external factors in each of the six categories, then rate how much each one matters.',
      long('political', 'Political', 'Government policy and stability: taxation, subsidies and incentives, trade policy and tariffs, public procurement, political stability, regulation of your sector.', 'Subsidies for local manufacturing; frequent GST rate changes'),
      long('economic', 'Economic', 'Growth, inflation, interest and exchange rates, commodity and input prices, labour costs, consumer spending power, availability of credit.', 'Steel prices swinging 10–15%; payment terms stretching to 90 days'),
      long('social', 'Social', 'Demographics, lifestyle and buying habits, education and skills, attitudes (to quality, to new technology), workforce expectations.', 'Skilled machinists scarce; buyers expect traceability'),
      long('technological', 'Technological', 'Automation and digital adoption, research and technology change, new materials and processes, intellectual property, how fast today’s technology becomes obsolete.', 'Shift to electric vehicles; machine monitoring'),
      long('environmental', 'Environmental', 'Climate and weather, energy and water, emission and waste norms, sustainability expectations from customers and lenders, resource scarcity.', 'Customers asking for carbon-footprint data'),
      long('legal', 'Legal', 'Industry standards and certification, labour and safety law, product liability, intellectual property, contract and competition law, compliance duties.', 'Customer certifications; tax compliance'),
      table('pestel_rating', 'Impact of each factor', 'Rate each factor: does it help or hurt, how strongly, and when does it bite?', 'Factor', [
        col.text('factor', 'Factor', 'The PESTEL category.'),
        col.select('effect', 'Effect', 'Does it help (an opportunity), hurt (a threat), both, or neither?', EFFECTS),
        col.rating('strength', 'Strength of effect', 'How strongly it affects the business.', { low: 'slight', high: 'decisive' }),
        col.select('horizon', 'When', 'When the effect is felt.', HORIZONS),
        col.computed('priority', 'Priority', 'Worked out from the strength.', (r) => {
          const s = toNum(r.strength);
          return s === null ? '' : s >= 4 ? 'High — act on it' : s === 3 ? 'Watch' : 'Low';
        }),
      ], { fixed: PESTEL_FACTORS }),
    ),
    section('swot', 'SWOT — inside and out', 'Sort what you know into the four boxes: inside the business and outside it, helpful and harmful.',
      long('strengths', 'Strengths', 'Internal and helpful: what the business does well, resources and capabilities others lack, advantages customers value, cost or quality edges.', 'Certified quality systems; in-house machining'),
      long('weaknesses', 'Weaknesses', 'Internal and harmful: where it falls short of rivals, missing resources or skills, process or cash problems, reasons customers leave.', 'Dependence on one customer; tight cash'),
      long('opportunities', 'Opportunities', 'External and helpful: trends in your favour (look back at PESTEL), unserved customer needs, weak or retreating rivals, new markets or technologies you could use.', 'New OEM contracts; electric-vehicle parts'),
      long('threats', 'Threats', 'External and harmful: trends against you (look back at PESTEL), new or stronger rivals, substitutes, cost or regulation changes, losing a key customer or supplier.', 'Input-price swings; larger rivals moving down'),
      long('so_what', 'So what?', 'The strategic implication: match strengths to opportunities, and fix or guard against weaknesses and threats. The two or three moves this scan points to.', 'Use the certification to win new accounts while fixing the cash cycle'),
    ),
  ],
  derived: [
    {
      key: 'balance',
      label: 'Opportunities vs threats',
      help: 'Counts the PESTEL factors you rated as opportunities and as threats.',
      compute: (v) => {
        const r = ratedFactors(v);
        if (r.length === 0) return null;
        const o = r.filter((x) => x.effect === 'Opportunity').length, t = r.filter((x) => x.effect === 'Threat').length;
        return `${o} opportunit${o === 1 ? 'y' : 'ies'} · ${t} threat${t === 1 ? '' : 's'}`;
      },
      tone: (v) => {
        const r = ratedFactors(v);
        const o = r.filter((x) => x.effect === 'Opportunity').length, t = r.filter((x) => x.effect === 'Threat').length;
        return o > t ? 'good' : t > o ? 'warn' : 'neutral';
      },
    },
    {
      key: 'strongest',
      label: 'Strongest outside factor',
      compute: (v) => {
        const r = ratedFactors(v);
        if (r.length === 0) return null;
        const top = [...r].sort((a, b) => Number(b.strength) - Number(a.strength))[0];
        return `${top.factor} (${top.effect.toLowerCase()}, ${top.strength}/5)`;
      },
    },
  ],
  outputs: [
    { key: 'scope', label: 'Scope of the analysis', compute: (v) => v.fields.scope?.trim() || null },
    { key: 'strengths', label: 'Strengths', compute: (v) => v.fields.strengths?.trim() || null },
    { key: 'weaknesses', label: 'Weaknesses', compute: (v) => v.fields.weaknesses?.trim() || null },
    { key: 'opportunities', label: 'Opportunities', compute: (v) => v.fields.opportunities?.trim() || null },
    { key: 'threats', label: 'Threats', compute: (v) => v.fields.threats?.trim() || null },
    { key: 'so_what', label: 'Strategic implication', compute: (v) => v.fields.so_what?.trim() || null },
    {
      key: 'external_factors',
      label: 'The outside factors that matter most',
      compute: (v) => {
        const r = ratedFactors(v).filter((x) => Number(x.strength) >= 4);
        return r.length ? r.map((x) => `${x.factor} (${x.effect.toLowerCase()})`).join(', ') : null;
      },
    },
  ],
  legacyLabels: { 'Industry sector': 'scope', 'Key challenges': 'weaknesses', 'Biggest external threat': 'threats' },
  analysisGuide:
    'The verdict is the strategic posture the scan points to. Use TOWS logic: strong and opportunity-rich → grow; strong but threat-heavy → use strengths to counter the threats; weak but opportunity-rich → fix weaknesses to seize the opportunity; weak and threat-heavy → defend or retrench. ' +
    'Check that every opportunity and threat traces to a PESTEL factor, and every strength and weakness is about the business itself (not the market). Flag entries that are generic ("good team") or have no evidence. Name the two or three outside factors that matter most, and say which weakness each one exposes.',
};

// ── Porter's Five Forces ─────────────────────────────────────────────────────

const FORCES = ['Threat of new entrants', 'Bargaining power of suppliers', 'Bargaining power of buyers', 'Threat of substitutes', 'Competitive rivalry'] as const;
const INTENSITY_WORD: Record<string, string> = { '1': 'Weak', '2': 'Modest', '3': 'Moderate', '4': 'Strong', '5': 'Intense' };

const ratedForces = (v: ModelValues): { force: string; n: number }[] =>
  rows(v, 'forces').flatMap((r) => { const n = toNum(r.intensity); return n === null ? [] : [{ force: r.force, n }]; });

/** Average intensity → how attractive the industry is. */
function attractiveness(avg: number): string {
  return avg <= 2.5 ? 'Attractive' : avg <= 3.5 ? 'Moderately attractive' : 'Unattractive';
}

const porter5: ModelDefinition = {
  toolId: 'porter5',
  reference: {
    originator: 'Michael E. Porter — “How Competitive Forces Shape Strategy”, Harvard Business Review',
    year: '1979, updated 2008',
    summary: 'Judges how attractive an industry is by how strongly five forces squeeze profit: rivalry among competitors, the threat of new entrants and of substitutes, and the bargaining power of buyers and of suppliers.',
    caption: 'Rivalry sits at the centre; the other four forces press on it from each side.',
    howToRead: [
      'Rate each force from 1 (weak pressure on profit) to 5 (intense pressure), and write the evidence behind the rating.',
      'The stronger the forces overall, the less profit the average competitor in the industry keeps.',
      'Look for the force that matters most: strategy is largely about positioning where the forces are weakest, or changing them.',
    ],
  },
  sections: [
    section('scope', 'Industry in scope', 'Define the industry narrowly enough that one set of competitors, buyers and suppliers applies.',
      text('industry', 'Industry and segment analysed', 'The industry (and, if it matters, the segment and geography) the five forces are assessed for. Too broad an industry hides the forces that actually bite.', 'Precision auto components for Indian car makers', { prefill: 'business_context' })),
    section('forces', 'The five forces', 'For each force, record what drives it in your industry and rate how hard it presses on profit.',
      table('forces', 'The five forces', 'One row per force: the evidence and an intensity rating.', 'Force', [
        col.text('force', 'Force', 'The force.'),
        col.long('drivers', 'What drives it — your evidence', 'The facts that make this force strong or weak in your industry. Cite numbers, names and examples, not opinions.'),
        col.rating('intensity', 'Intensity', 'How hard this force presses on industry profit.', { low: 'weak pressure on profit', high: 'intense pressure on profit' }),
        col.computed('reading', 'Reading', 'Worked out from the intensity.', (r) => INTENSITY_WORD[r.intensity] ?? ''),
      ], {
        fixed: FORCES,
        hints: {
          'Threat of new entrants': 'Economies of scale, capital needed, brand loyalty, switching costs, access to distribution, regulation, how rivals would retaliate',
          'Bargaining power of suppliers': 'Few suppliers or concentrated ones, costly to switch, unique or critical inputs, threat of the supplier moving into your business',
          'Bargaining power of buyers': 'Few large buyers, price sensitivity, low switching costs, buyers’ ability to make it themselves, how much of their cost you represent',
          'Threat of substitutes': 'Alternatives that meet the same need: relative price and performance, buyers’ readiness to switch, switching costs',
          'Competitive rivalry': 'Number and balance of competitors, industry growth, fixed and storage costs, differentiation, exit barriers',
        },
      })),
    section('meaning', 'What it means', 'Turn the five readings into a view on strategy.',
      long('implication', 'What the forces mean for strategy', 'Which forces can you influence? Where does the industry structure leave room for profit, and what position or move follows from that?', 'Compete where switching costs protect us; reduce reliance on one buyer'),
      long('notes', 'Notes', 'Anything else worth recording: sources of evidence, caveats, questions to follow up.', '')),
  ],
  derived: [
    {
      key: 'avg_intensity',
      label: 'Average force intensity',
      help: 'The mean of the five ratings. Shown once at least three forces are rated.',
      compute: (v) => { const r = ratedForces(v); return r.length >= 3 ? `${fmtNum(mean(r.map((x) => x.n))!)} / 5` : null; },
      tone: (v) => { const r = ratedForces(v); const m = mean(r.map((x) => x.n)); return m === null ? undefined : m <= 2.5 ? 'good' : m <= 3.5 ? 'warn' : 'bad'; },
    },
    {
      key: 'attractiveness',
      label: 'Industry attractiveness',
      compute: (v) => { const r = ratedForces(v); return r.length >= 3 ? attractiveness(mean(r.map((x) => x.n))!) : null; },
      tone: (v) => { const m = mean(ratedForces(v).map((x) => x.n)); return m === null ? undefined : m <= 2.5 ? 'good' : m <= 3.5 ? 'warn' : 'bad'; },
    },
    {
      key: 'strongest',
      label: 'Strongest force',
      compute: (v) => {
        const r = ratedForces(v);
        if (r.length === 0) return null;
        const max = Math.max(...r.map((x) => x.n));
        return r.filter((x) => x.n === max).map((x) => x.force).join(' · ') + ` (${max}/5)`;
      },
    },
  ],
  outputs: [
    { key: 'attractiveness', label: 'Industry attractiveness', compute: (v) => { const r = ratedForces(v); return r.length >= 3 ? `${attractiveness(mean(r.map((x) => x.n))!)} (${fmtNum(mean(r.map((x) => x.n))!)} / 5)` : null; } },
    { key: 'strongest_force', label: 'Strongest force', compute: (v) => { const r = ratedForces(v); if (!r.length) return null; const max = Math.max(...r.map((x) => x.n)); return r.filter((x) => x.n === max).map((x) => x.force).join(' · '); } },
    { key: 'weakest_force', label: 'Weakest force', compute: (v) => { const r = ratedForces(v); if (!r.length) return null; const min = Math.min(...r.map((x) => x.n)); return r.filter((x) => x.n === min).map((x) => x.force).join(' · '); } },
    { key: 'implication', label: 'What the forces mean for strategy', compute: (v) => v.fields.implication?.trim() || null },
    {
      key: 'structure_summary',
      label: 'Industry structure',
      compute: (v) => {
        const r = ratedForces(v);
        if (r.length < 3) return null;
        const avg = mean(r.map((x) => x.n))!;
        const max = Math.max(...r.map((x) => x.n)), min = Math.min(...r.map((x) => x.n));
        const names = (n: number) => r.filter((x) => x.n === n).map((x) => x.force).join(' and ');
        return `${attractiveness(avg)} (${fmtNum(avg)} / 5). Strongest force: ${names(max)} (${max}/5). Weakest: ${names(min)} (${min}/5).`;
      },
    },
  ],
  legacyLabels: { 'Supplier concentration': 'notes', 'Buyer power': 'notes' },
  analysisGuide:
    'The verdict is the industry attractiveness: average the five intensities (≤2.5 attractive, 2.5–3.5 moderately attractive, >3.5 unattractive) but weigh the strongest force more than the average suggests, because one intense force can dominate profit. ' +
    'Check each rating is backed by evidence in the "drivers" column and say where it is not. Name the strongest and the weakest force, and what a business in this position can do about the strongest one (differentiate, switch supplier, raise switching costs, change who the customers are). Do not confuse the industry\'s attractiveness with the client\'s own performance.',
};

// ── Porter's Generic Strategies ──────────────────────────────────────────────

const GENERIC_STRATEGIES = ['Cost leadership', 'Differentiation', 'Cost focus', 'Differentiation focus'] as const;
const NO_CHOICE = 'No clear choice yet (stuck in the middle)';

/** Fit with capabilities + fit with the industry + (6 − risk): out of 15. */
const strategyScore = (r: Row): number | null => {
  const a = toNum(r.capability), b = toNum(r.industry), c = toNum(r.risk);
  return a === null || b === null || c === null ? null : a + b + (6 - c);
};
const scoredStrategies = (v: ModelValues): { strategy: string; score: number }[] =>
  rows(v, 'strategies').flatMap((r) => { const s = strategyScore(r); return s === null ? [] : [{ strategy: r.strategy, score: s }]; });
const bestStrategies = (v: ModelValues): { names: string[]; score: number } | null => {
  const s = scoredStrategies(v);
  if (s.length < 2) return null;
  const top = Math.max(...s.map((x) => x.score));
  return { names: s.filter((x) => x.score === top).map((x) => x.strategy), score: top };
};

const portergeneric: ModelDefinition = {
  toolId: 'portergeneric',
  reference: {
    originator: 'Michael E. Porter — Competitive Strategy',
    year: '1980',
    summary: 'Porter argues that to earn above-average returns a business must choose how it will win: lowest cost, or differentiation, and across a broad market or a narrow segment. A business with no clear choice is “stuck in the middle” and earns the least.',
    caption: 'Two choices define the four strategies: how you win (lower cost or differentiation) and how wide a market you serve (broad or narrow).',
    howToRead: [
      'Pick one square: the source of your advantage (lower cost, or something buyers value enough to pay more for) and the scope you serve (the whole market, or one segment).',
      'Each square needs different capabilities and a different organisation; trying to be best at cost and at differentiation across the whole market usually means being neither.',
      'Test the choice against the Five Forces: a good position defends you against the strongest force.',
    ],
  },
  sections: [
    section('context', 'Where you compete', 'The industry structure the choice has to respond to, and how rivals are likely to react.',
      long('industry_structure', 'Industry structure (from Porter\'s Five Forces)', 'What the Five Forces say about the industry: how attractive it is and which force presses hardest. The choice below should defend you against that force.', 'Unattractive (3.8 / 5); buyer power is the strongest force', { prefill: { upstream: 'porter5', output: 'structure_summary' } }),
      long('rival_response', 'How rivals are likely to respond', 'Which competitors would react to your choice, and how (matching a price, copying a feature, defending a segment). Rivals who can easily copy a move make that choice weaker.', 'The larger Tier-1 would match a price cut within weeks', { prefill: { upstream: 'gametheory', output: 'decision' } })),
    section('strategies', 'The four generic strategies', 'Score each strategy for your business: how well it fits what you can do, how well it fits the industry, and how risky it is.',
      table('strategies', 'The four strategies', 'One row per strategy: how it would work for you, then three ratings. The score is worked out for you.', 'Strategy', [
        col.text('strategy', 'Strategy', 'The generic strategy.'),
        col.long('how', 'How it would work for you', 'What this strategy would mean in practice for your business — where the cost advantage or the difference buyers value would come from.'),
        col.rating('capability', 'Fit with your capabilities', 'Can you do this well today, with the people, plant and systems you have?', { low: 'poor fit', high: 'strong fit' }),
        col.rating('industry', 'Fit with the industry', 'Does this position protect profit given the five forces — in particular the strongest one?', { low: 'poor fit', high: 'strong fit' }),
        col.rating('risk', 'Risk', 'How likely is it to fail, be copied, or leave you exposed?', { low: 'low risk', high: 'high risk' }),
        col.computed('score', 'Score', 'Capability fit + industry fit + (6 − risk), out of 15.', (r) => { const s = strategyScore(r); return s === null ? '' : `${s} / 15`; }),
      ], {
        fixed: GENERIC_STRATEGIES,
        hints: {
          'Cost leadership': 'Lowest cost across a broad market: scale, learning curve, tight cost control, low-cost inputs and design for manufacture; price at or near the market, with the best margin',
          'Differentiation': 'Something unique across a broad market that buyers value and pay a premium for: quality, design, brand, service, technology or reliability',
          'Cost focus': 'A narrow segment served at lower cost than competitors who target the whole market',
          'Differentiation focus': 'A narrow segment whose special needs you serve better than anyone aiming at the whole market',
        },
      })),
    section('choice', 'Your choice', 'Commit to one position, and say what you will not do.',
      select('chosen', 'Chosen strategy', 'The one generic strategy you will pursue.', [...GENERIC_STRATEGIES, NO_CHOICE], 'Differentiation focus'),
      long('rationale', 'Why this one', 'The reasons for the choice, the capabilities it rests on, and what would make you change it.', 'It fits our certified, engineering-led parts and protects us from the strongest force'),
      long('trade_offs', 'What you will deliberately not do', 'Every real strategy gives something up. List the customers, products, prices or activities you will not chase, so you do not drift into being stuck in the middle.', 'No commodity parts without a margin floor'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'best',
      label: 'Highest-scoring strategy',
      help: 'The strategy with the best score. Shown once at least two are scored.',
      compute: (v) => { const b = bestStrategies(v); return b ? `${b.names.join(' / ')} (${b.score} / 15)` : null; },
    },
    {
      key: 'choice_check',
      label: 'Your choice against the scores',
      compute: (v) => {
        const chosen = v.fields.chosen;
        if (!chosen) return null;
        if (chosen === NO_CHOICE) return 'No clear choice — the risk is being stuck in the middle';
        const b = bestStrategies(v);
        if (!b) return null;
        return b.names.includes(chosen) ? `${chosen} matches the highest score` : `${chosen} differs from the highest score (${b.names.join(' / ')})`;
      },
      tone: (v) => {
        const chosen = v.fields.chosen;
        if (!chosen) return undefined;
        if (chosen === NO_CHOICE) return 'bad';
        const b = bestStrategies(v);
        return b ? (b.names.includes(chosen) ? 'good' : 'warn') : undefined;
      },
    },
  ],
  outputs: [
    { key: 'chosen_strategy', label: 'Chosen generic strategy', compute: (v) => v.fields.chosen?.trim() || null },
    { key: 'rationale', label: 'Why this strategy', compute: (v) => v.fields.rationale?.trim() || null },
    { key: 'trade_offs', label: 'What the business will not do', compute: (v) => v.fields.trade_offs?.trim() || null },
    { key: 'scores', label: 'Scores of the four strategies', compute: (v) => { const s = scoredStrategies(v); return s.length ? s.map((x) => `${x.strategy} ${x.score}/15`).join(' · ') : null; } },
  ],
  legacyLabels: { 'Chosen strategy': 'chosen' },
  analysisGuide:
    'The verdict is which generic strategy the business should commit to and whether its chosen strategy is the right one. Check the choice against the industry structure (does it defend against the strongest force?) and against the scores. Flag a business whose answers claim both cost leadership and differentiation across a broad market — that is the "stuck in the middle" pattern — unless the evidence shows it truly has both. ' +
    'Check that "what you will not do" names real trade-offs, that the "how it would work" column names where the advantage actually comes from, and that rivals\' likely response has been considered. A focus strategy must name a segment concretely.',
};

// ── Porter's Value Chain ─────────────────────────────────────────────────────

const ACTIVITIES = [
  'Inbound logistics', 'Operations', 'Outbound logistics', 'Marketing and sales', 'Service',
  'Firm infrastructure', 'Human resource management', 'Technology development', 'Procurement',
] as const;
const EDGE = ['Behind rivals', 'On par', 'Ahead of rivals'] as const;
const VALUE_ROLE = ['Cuts cost', 'Raises value to customers', 'Both', 'Neither (necessary only)'] as const;

const activityRows = (v: ModelValues): Row[] => rows(v, 'activities').filter((r) => r.activity);
const costShare = (r: Row): number | null => toNum(r.cost_share);
const joinNames = (rs: Row[]): string => rs.map((r) => r.activity).join(', ');
const isAdvantage = (r: Row): boolean => r.edge === 'Ahead of rivals' && !!r.role && r.role !== 'Neither (necessary only)';

const valuechain: ModelDefinition = {
  toolId: 'valuechain',
  reference: {
    originator: 'Michael E. Porter — Competitive Advantage',
    year: '1985',
    summary: 'Splits a business into the nine activities that create value and cost, so you can see exactly where margin and competitive advantage come from — and where money is spent without earning an edge.',
    caption: 'Five primary activities carry the product from inputs to the customer; four support activities run under all of them. What is left over is the margin.',
    howToRead: [
      'Primary activities (along the bottom) make and deliver the product; support activities (above) serve every primary activity.',
      'For each activity, record what you do, what share of cost it takes and how you compare with rivals. Advantage lives where you are ahead on something customers value or where you cost less.',
      'Margin is the gap between what customers pay and the total cost of all nine activities. Look for activities that cost a lot and earn no edge.',
    ],
  },
  sections: [
    section('scope', 'What is being analysed', 'A value chain describes one business or product line at a time.',
      text('scope', 'Business or product line analysed', 'The business, product line or family the chain is drawn for. Different product lines can have different chains.', 'Precision-machined components for OEMs', { prefill: 'business_context' })),
    section('chain', 'The nine activities', 'For each activity: what you do, its share of your cost, how you compare with rivals, and what it does for the business.',
      table('activities', 'Activities of the value chain', 'One row for each of Porter’s nine activities — five primary, four support.', 'Activity', [
        col.text('activity', 'Activity', 'The activity.'),
        col.long('what', 'What you do here', 'The main things done in this activity, and by whom. Be specific: machines, teams, systems, partners.'),
        col.num('cost_share', 'Share of total cost', 'About what share of your total cost this activity accounts for. The nine should add up to about 100.', '%'),
        col.select('edge', 'Compared with rivals', 'Honestly, how do you compare with your main competitors on this activity?', EDGE),
        col.select('role', 'What it does for the business', 'Does it lower your cost, raise the value customers see, both, or is it only necessary?', VALUE_ROLE),
        col.computed('reading', 'Reading', 'Worked out from the cost share and the comparison.', (r) => {
          const cost = costShare(r);
          if (isAdvantage(r)) return 'Source of advantage';
          if (cost !== null && cost >= 15 && r.edge === 'Behind rivals') return 'Costly and weak — fix first';
          if (cost !== null && cost >= 15 && r.edge !== 'Ahead of rivals') return 'Costly — look for savings';
          if (r.edge === 'Behind rivals') return 'A weakness to fix';
          return '';
        }),
      ], {
        fixed: ACTIVITIES,
        hints: {
          'Inbound logistics': 'Primary — receiving, storing and distributing inputs: warehousing, material handling, inventory control, transport scheduling',
          'Operations': 'Primary — turning inputs into the product: machining, assembly, testing, packaging, equipment maintenance, plant operations',
          'Outbound logistics': 'Primary — getting the finished product to buyers: finished-goods storage, order processing, delivery scheduling',
          'Marketing and sales': 'Primary — making buyers aware and able to buy: quoting, sales force, advertising, channels, pricing',
          'Service': 'Primary — keeping the product’s value after sale: installation, repair, training, spare parts, complaint handling',
          'Firm infrastructure': 'Support — general management, planning, finance, accounting, legal, quality management and the systems behind the whole chain',
          'Human resource management': 'Support — recruiting, hiring, training, developing and rewarding people',
          'Technology development': 'Support — product and process technology: design, tooling, automation, software, know-how',
          'Procurement': 'Support — buying the inputs used in every activity: materials, machinery, supplies and services',
        },
      })),
    section('reading', 'What it shows', 'Where the margin is made, and where it leaks.',
      long('linkages', 'Linkages between activities', 'Where one activity’s performance changes the cost or effectiveness of another — for example, better design lowering assembly cost and warranty claims. Linkages are often the real source of advantage.', 'Better tooling design cuts rework and delivery delays'),
      long('margin_driver', 'Biggest margin driver found', 'The one or two activities that most decide your margin — the biggest source of advantage, or the biggest leak.', 'Operations: rework and machine downtime on Line 2'),
      long('opportunities', 'Where to cut cost or add value', 'The moves this chain points to: costs to remove, activities to do better than rivals, activities to hand to a partner.', 'Fix the Line 2 welding hotspot; outsource heat treatment'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'cost_total',
      label: 'Total of the cost shares',
      help: 'The nine cost shares should add up to about 100%.',
      compute: (v) => { const n = numbers(activityRows(v).map((r) => r.cost_share)); return n.length ? `${fmtNum(sum(n), 1)}%` : null; },
      tone: (v) => { const n = numbers(activityRows(v).map((r) => r.cost_share)); if (!n.length) return undefined; const t = sum(n); return t >= 95 && t <= 105 ? 'good' : 'warn'; },
    },
    {
      key: 'biggest_cost',
      label: 'Costliest activity',
      compute: (v) => {
        const withCost = activityRows(v).filter((r) => costShare(r) !== null);
        if (!withCost.length) return null;
        const top = [...withCost].sort((a, b) => (costShare(b) ?? 0) - (costShare(a) ?? 0))[0];
        return `${top.activity} (${fmtNum(costShare(top) ?? 0, 1)}%)`;
      },
    },
    {
      key: 'advantage',
      label: 'Sources of advantage',
      help: 'Activities where you are ahead of rivals on something that cuts cost or raises customer value.',
      compute: (v) => { const a = activityRows(v).filter(isAdvantage); return a.length ? joinNames(a) : (activityRows(v).some((r) => r.edge) ? 'None yet' : null); },
      tone: (v) => (activityRows(v).some(isAdvantage) ? 'good' : activityRows(v).some((r) => r.edge) ? 'warn' : undefined),
    },
    {
      key: 'weak',
      label: 'Weaknesses to fix',
      compute: (v) => { const w = activityRows(v).filter((r) => r.edge === 'Behind rivals'); return w.length ? joinNames(w) : (activityRows(v).some((r) => r.edge) ? 'None' : null); },
      tone: (v) => (activityRows(v).some((r) => r.edge === 'Behind rivals') ? 'bad' : undefined),
    },
  ],
  outputs: [
    {
      key: 'cost_by_activity',
      label: 'Where the cost goes',
      compute: (v) => {
        const r = activityRows(v).filter((x) => costShare(x) !== null).sort((a, b) => (costShare(b) ?? 0) - (costShare(a) ?? 0));
        return r.length ? r.map((x) => `${x.activity} ${fmtNum(costShare(x) ?? 0, 1)}%`).join(', ') : null;
      },
    },
    { key: 'advantage_sources', label: 'Sources of advantage', compute: (v) => { const a = activityRows(v).filter(isAdvantage); return a.length ? joinNames(a) : null; } },
    { key: 'weaknesses', label: 'Weaknesses to fix', compute: (v) => { const w = activityRows(v).filter((r) => r.edge === 'Behind rivals'); return w.length ? joinNames(w) : null; } },
    { key: 'margin_driver', label: 'Biggest margin driver', compute: (v) => v.fields.margin_driver?.trim() || null },
  ],
  legacyLabels: { 'Primary activities reviewed': 'notes' },
  analysisGuide:
    'The verdict is where the business\'s margin and advantage actually come from, and where cost leaks. Compare each activity\'s cost share with the edge claimed for it: a large cost share with no edge is a leak, and an edge in a small activity is a weaker advantage than one in a large activity. ' +
    'Check that the cost shares add to about 100%, that "ahead of rivals" is backed by something specific, and that linkages between activities (not just each activity alone) were considered. Name the activity that most decides margin and the one that should be fixed or handed to a partner first.',
};

// ── Scenario planning ────────────────────────────────────────────────────────

const QUADRANTS = ['Top right', 'Top left', 'Bottom right', 'Bottom left'] as const;
const PLAUSIBILITY = ['Less plausible', 'Plausible', 'Highly plausible'] as const;
const SCENARIO_EFFECT = ['Good for us', 'Mixed', 'Bad for us'] as const;
const isCandidateAxis = (r: Row): boolean => (toNum(r.impact) ?? 0) >= 4 && (toNum(r.uncertainty) ?? 0) >= 4;
const describedScenarios = (v: ModelValues): Row[] => rows(v, 'scenarios').filter((r) => r.name && r.story);

const scenario: ModelDefinition = {
  toolId: 'scenario',
  reference: {
    originator: 'Pierre Wack at Royal Dutch Shell (1970s), developed by Peter Schwartz — The Art of the Long View',
    year: '1970s–1991',
    summary: 'Instead of one forecast, builds a few distinct, plausible futures around the two uncertainties that matter most and are least predictable — so the strategy holds up across more than one version of what happens next.',
    caption: 'The two critical uncertainties form the axes; each corner is a different, internally consistent future.',
    howToRead: [
      'Start from one focal question, list the forces that will shape the answer, then separate what is already certain from what is truly uncertain.',
      'Pick the two uncertainties that have the biggest impact and are hardest to predict. Their two ends form the axes, and the four corners are the four scenarios.',
      'Scenarios are not forecasts or best/worst cases: each must be plausible and tell a coherent story. Look for moves that work in all four, and signposts that tell you which one is unfolding.',
    ],
  },
  sections: [
    section('question', 'The question', 'What decision or future the scenarios are for.',
      text('focal_question', 'Focal question', 'The one decision or uncertainty the scenarios help with, as a question (for example, “Should we invest in a second line before the EV shift?”).', 'Should we add a second line over the next three years?', { prefill: 'business_context' }),
      select('time_horizon', 'Time horizon', 'How far ahead the scenarios look. Pick a horizon long enough for real change, short enough to plan for.', ['Next 3 years', 'Next 5 years', 'Next 10 years'], 'Next 5 years')),
    section('forces', 'Forces and uncertainties', 'What will shape the answer, and which parts of it are unknown.',
      long('driving_forces', 'Driving forces', 'The forces that will shape the answer — social, technological, economic, environmental and political. Include the input-cost, regulation, customer and competitor forces in your own industry.', 'Steel and energy prices; EV adoption; OEM supplier consolidation'),
      long('predetermined', 'What is already certain', 'Things that will happen whichever future arrives (predetermined elements): known demographics, contracts already signed, rules already passed.', 'Annual price-downs continue; GST compliance gets stricter'),
      table('uncertainties', 'Critical uncertainties', 'List the open questions, then rate how much each would matter and how unpredictable it is. The two with high scores on both make the best axes.', 'Uncertainty', [
        col.text('driver', 'Uncertainty', 'An open question the future depends on.'),
        col.rating('impact', 'Impact on the question', 'How much the answer to this uncertainty would change your situation.', { low: 'small', high: 'decisive' }),
        col.rating('uncertainty', 'How uncertain', 'How hard it is to predict which way it will go.', { low: 'fairly predictable', high: 'highly uncertain' }),
        col.computed('candidate', 'Axis?', 'Marked when impact and uncertainty are both 4 or 5.', (r) => (isCandidateAxis(r) ? 'Candidate axis' : '')),
      ], { min: 3, max: 8, example: { driver: 'Speed of EV adoption', impact: '5', uncertainty: '4' } })),
    section('axes', 'The two axes', 'Choose the two critical uncertainties and name both ends of each.',
      text('axis_x', 'Horizontal axis (critical uncertainty 1)', 'The first critical uncertainty.', 'Speed of EV adoption'),
      text('axis_x_ends', 'Its two ends (left — right)', 'What the left end and the right end mean, in a few words.', 'Gradual (10 years) — fast (3 years)'),
      text('axis_y', 'Vertical axis (critical uncertainty 2)', 'The second critical uncertainty — independent of the first.', 'OEM sourcing behaviour'),
      text('axis_y_ends', 'Its two ends (bottom — top)', 'What the bottom end and the top end mean, in a few words.', 'Consolidating suppliers — widening the supplier base')),
    section('scenarios', 'The four scenarios', 'One row per corner. Give each a name and tell its story as if it had happened.',
      table('scenarios', 'The four futures', 'Name each scenario, describe the world in it, say how plausible it is and what it means for you, and how you would respond.', 'Scenario', [
        col.text('quadrant', 'Corner', 'Where the scenario sits on the two axes.'),
        col.text('name', 'Scenario name', 'A short, memorable name that carries the story.'),
        col.long('story', 'What the world looks like', 'A short story: what happened, who the winners and losers are, what customers, rivals and suppliers are doing.'),
        col.select('plausibility', 'Plausibility', 'How plausible this future is (scenarios are not predictions, so this is a rough guide only).', PLAUSIBILITY),
        col.select('effect', 'Effect on you', 'Whether this future is good or bad for the business as it is today.', SCENARIO_EFFECT),
        col.long('response', 'How we would respond', 'The moves that would work best if this future arrived.'),
      ], {
        fixed: QUADRANTS,
        hints: {
          'Top right': 'Vertical axis at its top end, horizontal axis at its right end',
          'Top left': 'Vertical axis at its top end, horizontal axis at its left end',
          'Bottom right': 'Vertical axis at its bottom end, horizontal axis at its right end',
          'Bottom left': 'Vertical axis at its bottom end, horizontal axis at its left end',
        },
      })),
    section('moves', 'What to do', 'Turn the scenarios into decisions and early-warning signs.',
      long('robust_moves', 'Moves that work in every scenario', 'Actions worth taking whichever future arrives. These are the no-regret moves.', 'Qualify a second alloy source; shorten the cash cycle'),
      long('options_to_hold', 'Options to keep open', 'Moves that only pay off in one scenario: how to keep them cheap and ready, and what would trigger them.', 'Keep EV tooling at pilot scale until a second OEM confirms volumes'),
      table('signposts', 'Signposts', 'The early signals that tell you which scenario is unfolding, and what you would do when you see one.', 'Signpost', [
        col.text('signal', 'Early-warning signal', 'Something you can observe: a number, an announcement, a customer behaviour.'),
        col.select('points_to', 'Points to', 'The scenario this signal is evidence for.', QUADRANTS),
        col.text('trigger', 'What you would do', 'The decision this signal would trigger.'),
      ], { min: 2, max: 6, example: { signal: 'A second OEM announces a dedicated EV platform', points_to: 'Top right', trigger: 'Release EV tooling budget' } }),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [
    {
      key: 'axes_candidates',
      label: 'Strongest candidate axes',
      help: 'Uncertainties rated 4 or 5 on both impact and uncertainty.',
      compute: (v) => { const c = rows(v, 'uncertainties').filter(isCandidateAxis); return c.length ? c.map((r) => r.driver).join(' · ') : (rows(v, 'uncertainties').some((r) => r.impact) ? 'None rated high on both' : null); },
    },
    {
      key: 'scenarios_ready',
      label: 'Scenarios described',
      compute: (v) => { const n = describedScenarios(v).length; return n ? `${n} of 4` : null; },
      tone: (v) => (describedScenarios(v).length === 4 ? 'good' : describedScenarios(v).length > 0 ? 'warn' : undefined),
    },
    {
      key: 'exposure',
      label: 'Futures that are bad for you',
      compute: (v) => { const r = rows(v, 'scenarios').filter((x) => x.effect); if (!r.length) return null; const bad = r.filter((x) => x.effect === 'Bad for us'); return bad.length ? `${bad.length} of ${r.length}: ${bad.map((x) => x.name || x.quadrant).join(', ')}` : `None of ${r.length}`; },
      tone: (v) => { const r = rows(v, 'scenarios').filter((x) => x.effect); if (!r.length) return undefined; const bad = r.filter((x) => x.effect === 'Bad for us').length; return bad >= 2 ? 'bad' : bad === 1 ? 'warn' : 'good'; },
    },
  ],
  outputs: [
    { key: 'focal_question', label: 'Focal question', compute: (v) => v.fields.focal_question?.trim() || null },
    { key: 'scenario_names', label: 'The four scenarios', compute: (v) => { const s = describedScenarios(v); return s.length ? s.map((r) => `${r.name} (${r.quadrant.toLowerCase()}${r.effect ? `, ${r.effect.toLowerCase()}` : ''})`).join('; ') : null; } },
    { key: 'critical_uncertainties', label: 'Critical uncertainties', compute: (v) => (v.fields.axis_x && v.fields.axis_y ? `${v.fields.axis_x}; ${v.fields.axis_y}` : null) },
    { key: 'robust_moves', label: 'Moves that work in every scenario', compute: (v) => v.fields.robust_moves?.trim() || null },
  ],
  legacyLabels: { 'Key uncertainty': 'driving_forces', 'Best-case / base-case / worst-case scenarios': 'notes' },
  analysisGuide:
    'The verdict is whether the plan is robust across the four futures: name the moves that work in all of them, the ones that depend on a single future, and the scenario that would hurt most. Check that the two axes are genuinely independent critical uncertainties (not two views of one thing), that the scenarios are four distinct and plausible stories rather than best / base / worst cases, and that each has a name, a story and a response. ' +
    'Check the signposts are observable and linked to a decision. Flag scenarios the client has not described, and any scenario that is simply "business as usual".',
};

// ── Game theory / competitive response grid ──────────────────────────────────

const PAYOFF_ROWS = ['Option A → Response 1', 'Option A → Response 2', 'Option B → Response 1', 'Option B → Response 2'] as const;

interface Payoff { you: number; rival: number }
const payoffOf = (v: ModelValues, name: string): Payoff | null => {
  const r = rows(v, 'payoffs').find((x) => x.outcome === name);
  const you = r ? toNum(r.your_payoff) : null, rival = r ? toNum(r.rival_payoff) : null;
  return you === null || rival === null ? null : { you, rival };
};
/** The rival's best reply to an option: the response with the higher rival payoff (ties: both are best). */
const rivalBestReplies = (v: ModelValues, option: 'A' | 'B'): string[] => {
  const a = payoffOf(v, `Option ${option} → Response 1`), b = payoffOf(v, `Option ${option} → Response 2`);
  if (!a || !b) return [];
  return a.rival === b.rival ? ['1', '2'] : a.rival > b.rival ? ['1'] : ['2'];
};
/** Your best option against a response. */
const youBestOptions = (v: ModelValues, response: '1' | '2'): string[] => {
  const a = payoffOf(v, `Option A → Response ${response}`), b = payoffOf(v, `Option B → Response ${response}`);
  if (!a || !b) return [];
  return a.you === b.you ? ['A', 'B'] : a.you > b.you ? ['A'] : ['B'];
};
const nameOfRow = (row: string): { option: 'A' | 'B'; response: '1' | '2' } => ({ option: row.includes('Option A') ? 'A' : 'B', response: row.endsWith('1') ? '1' : '2' });
const equilibria = (v: ModelValues): string[] =>
  PAYOFF_ROWS.filter((row) => {
    const { option, response } = nameOfRow(row);
    return rivalBestReplies(v, option).includes(response) && youBestOptions(v, response).includes(option);
  });
const shown = (row: string, v: ModelValues): string => {
  const { option, response } = nameOfRow(row);
  const o = v.fields[option === 'A' ? 'option_a' : 'option_b'], r = v.fields[response === '1' ? 'response_1' : 'response_2'];
  return `${o || `Option ${option}`} / ${r || `Response ${response}`}`;
};

const gametheory: ModelDefinition = {
  toolId: 'gametheory',
  reference: {
    originator: 'John von Neumann & Oskar Morgenstern — Theory of Games and Economic Behavior; John Nash (equilibrium)',
    year: '1944 / 1950',
    summary: 'When your best move depends on what a rival does in return, lay the choices out as a payoff grid. It shows each side’s best reply, where the game is likely to settle (the Nash equilibrium), and whether both sides could do better by escaping it.',
    caption: 'Your options run down the side, the rival’s responses across the top; each cell shows what each side earns.',
    howToRead: [
      'Each cell is one outcome: you choose an option and the rival chooses a response. The two numbers are your payoff and the rival’s.',
      'The rival’s best reply to your option is the response that pays the rival most; your best option against a response is the one that pays you most.',
      'Where each side is already doing its best reply, neither wants to change: that is the equilibrium. If both sides would be better off elsewhere, it is a prisoner’s dilemma, and the escape is a credible commitment or a different game, not a bigger move.',
    ],
  },
  sections: [
    section('situation', 'The situation', 'Who the players are and what is being decided.',
      long('situation', 'Move being considered', 'The move you are thinking about (a price cut, a capacity addition, a new product) and why a competitor will care.', 'A 5% price cut on standard parts to win a second OEM\'s volume'),
      text('rival', 'The rival whose reaction matters', 'The one competitor (or the group acting as one) whose response changes what your move is worth. This tool suits a few identifiable rivals, not an anonymous crowd.', 'The larger regional Tier-1'),
      text('option_a', 'Your option A', 'One of your two options.', 'Hold prices'),
      text('option_b', 'Your option B', 'Your other option.', 'Cut prices 5%'),
      text('response_1', 'Rival\'s response 1', 'One of the rival’s two responses.', 'Hold prices'),
      text('response_2', 'Rival\'s response 2', 'The rival’s other response.', 'Match the cut')),
    section('payoffs', 'The payoffs', 'For each of the four outcomes, what each side earns. Use the same measure for both — for example, annual profit in ₹ lakh.',
      table('payoffs', 'The payoff grid', 'Four rows: each of your options against each of the rival’s responses (Option A / B and Response 1 / 2 are the ones you named above).', 'Outcome', [
        col.text('outcome', 'Outcome', 'Your option and the rival’s response.'),
        col.num('your_payoff', 'Your payoff', 'What you earn in this outcome.', '₹ lakh a year'),
        col.num('rival_payoff', 'Rival\'s payoff', 'What the rival earns in this outcome.', '₹ lakh a year'),
        col.computed('rival_best', 'Rival\'s best reply?', 'Yes when this response pays the rival more than the other response to the same option of yours.', (r, v) => { const { option, response } = nameOfRow(r.outcome ?? ''); return rivalBestReplies(v, option).includes(response) ? 'Yes' : ''; }),
        col.computed('you_best', 'Your best option?', 'Yes when this option pays you more than your other option against the same response.', (r, v) => { const { option, response } = nameOfRow(r.outcome ?? ''); return youBestOptions(v, response).includes(option) ? 'Yes' : ''; }),
      ], {
        fixed: PAYOFF_ROWS,
        hints: {
          'Option A → Response 1': 'You choose option A and the rival chooses response 1',
          'Option A → Response 2': 'You choose option A and the rival chooses response 2',
          'Option B → Response 1': 'You choose option B and the rival chooses response 1',
          'Option B → Response 2': 'You choose option B and the rival chooses response 2',
        },
      })),
    section('reading', 'What it means', 'The likely outcome, and what you will do about it.',
      long('likely_outcome', 'What you expect to happen', 'Where the game is likely to settle, in your own words, and whether either side could do better.', 'Both sides cut and both earn less'),
      long('decision', 'Your decision', 'The move you will make, and any commitment, signal or change to the game that makes it work (for example, competing on something the rival cannot match rather than on price).', 'Do not cut price; compete on approvals and engineering support'),
      long('notes', 'Notes', 'Anything else worth recording: assumptions behind the payoffs, other rivals, repeated play.', '')),
  ],
  derived: [
    {
      key: 'rival_replies',
      label: 'Rival\'s best reply',
      help: 'The rival’s best response to each of your options.',
      compute: (v) => {
        const a = rivalBestReplies(v, 'A'), b = rivalBestReplies(v, 'B');
        if (!a.length && !b.length) return null;
        const word = (rs: string[]) => (rs.length === 2 ? 'indifferent' : `response ${rs[0]}`);
        return `To A: ${a.length ? word(a) : '?'} · To B: ${b.length ? word(b) : '?'}`;
      },
    },
    {
      key: 'equilibrium',
      label: 'Where it settles (equilibrium)',
      help: 'The outcome where neither side wants to change its choice.',
      compute: (v) => { const e = equilibria(v); return e.length ? e.map((row) => shown(row, v)).join(' · ') : (PAYOFF_ROWS.every((r) => payoffOf(v, r)) ? 'No stable outcome in pure choices' : null); },
    },
    {
      key: 'dilemma',
      label: 'Could both do better?',
      compute: (v) => {
        const e = equilibria(v);
        if (e.length !== 1) return null;
        const at = payoffOf(v, e[0]);
        if (!at) return null;
        const better = PAYOFF_ROWS.filter((row) => { const p = payoffOf(v, row); return !!p && p.you > at.you && p.rival > at.rival; });
        return better.length ? `Yes — both would earn more at ${shown(better[0], v)} (a prisoner's dilemma)` : 'No — nobody can do better for both';
      },
      tone: (v) => { const e = equilibria(v); if (e.length !== 1) return undefined; const at = payoffOf(v, e[0]); if (!at) return undefined; return PAYOFF_ROWS.some((row) => { const p = payoffOf(v, row); return !!p && p.you > at.you && p.rival > at.rival; }) ? 'warn' : 'good'; },
    },
  ],
  outputs: [
    { key: 'equilibrium', label: 'Where the game settles', compute: (v) => { const e = equilibria(v); return e.length ? e.map((row) => shown(row, v)).join(' · ') : null; } },
    { key: 'likely_outcome', label: 'What is expected to happen', compute: (v) => v.fields.likely_outcome?.trim() || null },
    { key: 'decision', label: 'The decision on the move', compute: (v) => v.fields.decision?.trim() || null },
  ],
  legacyLabels: { 'Move being considered': 'situation', 'Likely competitor response': 'likely_outcome' },
  analysisGuide:
    'The verdict is whether the move is worth making once the rival\'s reply is taken into account, and what to do instead if it is not. Check the payoffs are in the same unit for both sides and are plausible (a rival cannot gain from a move that destroys its own margin), recompute the rival\'s best replies and your best options from the grid, and name the equilibrium. If it is a prisoner\'s dilemma, say so and say what could change the game (a credible commitment, a different basis of competition, a repeated-game reputation). ' +
    'Flag payoffs that look like opinion rather than estimates, a rival who cannot actually retaliate, and any option the client has not considered.',
};

export const ENVIRONMENT_MODELS: ModelDefinition[] = [pestel, porter5, portergeneric, valuechain, scenario, gametheory];
