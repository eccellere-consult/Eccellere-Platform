/**
 * defs/business.ts — the business-model and financial frameworks: the Business Model Canvas and the Value Proposition
 * Canvas. (More are added here as the catalogue is converted.)
 */
import { long, mean, rating, section, select, text } from '../build';
import { fmtNum, toNum } from '../values';
import type { ModelDefinition, ModelValues } from '../types';

const filled = (v: ModelValues, key: string): string | null => v.fields[key]?.trim() || null;

// ── Business Model Canvas ────────────────────────────────────────────────────

const bmc: ModelDefinition = {
  toolId: 'bmc',
  reference: {
    originator: 'Alexander Osterwalder & Yves Pigneur — Business Model Generation',
    year: '2010',
    summary: 'Describes how a business creates, delivers and captures value on one page, as nine linked building blocks.',
    caption: 'Value propositions in the centre; who you serve on the right; what you need to deliver it on the left; costs and revenue along the bottom.',
    howToRead: [
      'The right side is about value and customers (segments, relationships, channels); the left side is about the means (activities, resources, partners).',
      'Work in this order: who you serve, what you offer them, how you reach them, how you earn, what you need, who helps, and what it costs.',
      'The blocks must fit together: every value proposition needs a segment, a channel and a revenue stream.',
    ],
  },
  sections: [
    section('blocks', 'The nine building blocks', 'Describe each block in the order Osterwalder suggests.',
      long('customer_segments', 'Customer Segments', 'For whom are we creating value? Who are our most important customers? Mass market, niche, segmented, diversified or multi-sided.', 'Tier-1 auto makers and export accounts', { prefill: { upstream: 'vpc', output: 'customer_segment' } }),
      long('value_propositions', 'Value Propositions', 'What value do we deliver to the customer? Which customer problems are we solving and which needs satisfying? What bundle of products and services do we offer each segment?', 'Certified precision parts, delivered just in time', { prefill: { upstream: 'vpc', output: 'value_proposition' } }),
      long('channels', 'Channels', 'Through which channels do our segments want to be reached? How do we reach them now? How are our channels integrated, and which work best and cost least?', 'Direct key-account sales'),
      long('customer_relationships', 'Customer Relationships', 'What type of relationship does each segment expect? Which have we established, how costly are they, and how do they fit the rest of the model?', 'A dedicated account manager per key customer'),
      long('revenue_streams', 'Revenue Streams', 'For what value are customers really willing to pay? What and how do they pay now? How much does each stream contribute to total revenue?', 'Per-unit contract manufacturing', { prefill: 'business_context' }),
      long('key_resources', 'Key Resources', 'What key resources do our value propositions, channels, relationships and revenue streams require? Physical, intellectual, human, financial.', 'Machining capacity, certifications, skilled people'),
      long('key_activities', 'Key Activities', 'What key activities do our value propositions, channels, customer relationships and revenue streams require? Production, problem solving, platform or network.', 'Machining, inspection, new-part development', { prefill: { upstream: 'porter5', output: 'implication' } }),
      long('key_partnerships', 'Key Partnerships', 'Who are our key partners and suppliers? Which key resources do we get from them, and which key activities do they perform?', 'Steel mills, job-workers, logistics'),
      long('cost_structure', 'Cost Structure', 'What are the most important costs in our model? Which key resources and activities are the most expensive? Is the model cost-driven or value-driven, and which costs are fixed?', 'Raw material, labour, power, depreciation'),
    ),
  ],
  derived: [],
  outputs: [
    { key: 'customer_segments', label: 'Customer segments', compute: (v) => filled(v, 'customer_segments') },
    { key: 'value_propositions', label: 'Value propositions', compute: (v) => filled(v, 'value_propositions') },
    { key: 'revenue_streams', label: 'Revenue streams', compute: (v) => filled(v, 'revenue_streams') },
    { key: 'cost_structure', label: 'Cost structure', compute: (v) => filled(v, 'cost_structure') },
    { key: 'key_activities', label: 'Key activities', compute: (v) => filled(v, 'key_activities') },
  ],
  analysisGuide:
    'The verdict is how coherent the business model is: do the blocks fit together? Check the logic across blocks — every value proposition should have a customer segment it serves, a channel that reaches that segment and a revenue stream that pays for it; the key activities, resources and partners should be what the value propositions actually require; the cost structure should be what those activities and resources cost. ' +
    'Name the weakest link (a block that is vague, unevidenced or inconsistent with the rest), the revenue and cost drivers that matter most, and which blocks changed most if earlier tools in the thread suggest a different model.',
};

// ── Value Proposition Canvas ─────────────────────────────────────────────────

const EVIDENCE = ['Assumption only', 'Customer interviews', 'Tested with prototypes', 'Paying customers'] as const;

const fitRatings = (v: ModelValues): number[] => ['pain_fit', 'gain_fit'].map((k) => toNum(v.fields[k])).filter((n): n is number => n !== null);
const fitWord = (m: number): string => (m >= 4 ? 'Strong fit' : m >= 3 ? 'Partial fit' : 'Weak fit');

const vpc: ModelDefinition = {
  toolId: 'vpc',
  reference: {
    originator: 'Alexander Osterwalder, Yves Pigneur, Gregory Bernarda & Alan Smith — Value Proposition Design',
    year: '2014',
    summary: 'Tests whether what you offer fits what one customer segment needs. The customer profile lists their jobs, pains and gains; the value map lists your products and services and how they relieve those pains and create those gains.',
    caption: 'The value map (left) answers the customer profile (right): pain relievers against pains, gain creators against gains.',
    howToRead: [
      'Work on one customer segment at a time — a profile for a mixed crowd fits nobody.',
      'List jobs, pains and gains with the most important first, then check that your pain relievers and gain creators answer the top ones.',
      'Fit is reached when your offer addresses the pains and gains the customer ranks highest — and you have evidence they do.',
    ],
  },
  sections: [
    section('segment', 'The customer segment', 'The one group this canvas is about.',
      text('segment', 'Customer segment', 'The specific group of customers this canvas is about, described precisely enough that you could find one tomorrow.', 'Purchasing teams at car makers', { prefill: 'business_context' })),
    section('profile', 'Customer profile', 'What the customer is trying to do, what gets in the way, and what they hope for. One item per line, most important first.',
      long('jobs', 'Customer jobs', 'What the customer is trying to get done: functional jobs (tasks), social jobs (how they want to be seen) and emotional jobs (how they want to feel).', 'Meet quality certification on tight lead times'),
      long('pains', 'Pains', 'What annoys, blocks or frightens the customer before, during and after the job: costs, risks, obstacles, bad outcomes.', 'Late deliveries stopping the line'),
      long('gains', 'Gains', 'What the customer wants or would be delighted by: required, expected, desired and unexpected gains.', 'A supplier whose parts pass first time')),
    section('value_map', 'Value map', 'What you offer, and how it answers the profile. One item per line, matched to the pain or gain it addresses.',
      long('products', 'Products & Services', 'The list of products and services your value proposition is built around.', 'Machined and welded parts, tooling design'),
      long('pain_relievers', 'Pain Relievers', 'How your products and services eliminate or reduce specific pains. Say which pain each one answers.', 'In-line inspection and full traceability'),
      long('gain_creators', 'Gain Creators', 'How your products and services create the gains the customer wants. Say which gain each one answers.', 'Annual cost-down proposals from engineering')),
    section('fit', 'Fit', 'How well the two sides match, how sure you are, and the proposition in a sentence.',
      rating('pain_fit', 'Pain fit', 'How well do your pain relievers answer the pains the customer ranks highest?', { low: 'barely', high: 'fully' }, '4'),
      rating('gain_fit', 'Gain fit', 'How well do your gain creators deliver the gains the customer ranks highest?', { low: 'barely', high: 'fully' }, '4'),
      select('evidence', 'Evidence for the fit', 'How do you know? An assumption is fine to start with — just label it as one.', EVIDENCE, 'Customer interviews'),
      long('value_proposition', 'Value proposition', 'One or two sentences: for [segment] who [job or pain], our [offer] [relieves / creates …], unlike [alternative].', 'For sourcing teams who cannot afford line stoppages, we supply certified parts just in time')),
  ],
  derived: [
    {
      key: 'fit_score',
      label: 'Fit',
      help: 'The average of the pain fit and the gain fit.',
      compute: (v) => { const r = fitRatings(v); return r.length === 2 ? `${fmtNum(mean(r)!)} / 5 — ${fitWord(mean(r)!).toLowerCase()}` : null; },
      tone: (v) => { const r = fitRatings(v); if (r.length < 2) return undefined; const m = mean(r)!; return m >= 4 ? 'good' : m >= 3 ? 'warn' : 'bad'; },
    },
  ],
  outputs: [
    { key: 'customer_segment', label: 'Customer segment', compute: (v) => filled(v, 'segment') },
    { key: 'value_proposition', label: 'Value proposition', compute: (v) => filled(v, 'value_proposition') },
    { key: 'top_pains', label: 'Pains', compute: (v) => filled(v, 'pains') },
    { key: 'fit', label: 'Fit', compute: (v) => { const r = fitRatings(v); return r.length === 2 ? `${fitWord(mean(r)!)} (${fmtNum(mean(r)!)} / 5), evidence: ${v.fields.evidence || 'not stated'}` : null; } },
  ],
  legacyLabels: {},
  analysisGuide:
    'The verdict is the quality of the fit: do the pain relievers and gain creators answer the pains and gains the customer ranks highest, and is there evidence? ' +
    'Check the match item by item: name the top pains and gains that have NO answer on the value-map side, and any pain reliever or gain creator that answers something the customer did not list (wasted effort). ' +
    'A fit rated high on "assumption only" is a hypothesis, not a fit — say so. Check the segment is specific and the value proposition sentence follows from the lists.',
};

// ── Lean Canvas ──────────────────────────────────────────────────────────────

const leancanvas: ModelDefinition = {
  toolId: 'leancanvas',
  reference: {
    originator: 'Ash Maurya — Running Lean (adapted from the Business Model Canvas)',
    year: '2010',
    summary: 'A one-page plan for an idea that does not yet have a business. It swaps the Business Model Canvas’s partners, activities, resources and relationships for the things a new venture must prove first: the problem, the solution, the key metrics and the unfair advantage.',
    caption: 'Start with the problem and the customer on the left and right; the value proposition sits in the middle; the money runs along the bottom.',
    howToRead: [
      'Fill it in quickly, in this order: problem, customer segments, unique value proposition, solution, channels, revenue streams, cost structure, key metrics, unfair advantage. Keep each box to what you actually know.',
      'The problem and the customer are the riskiest parts: most new ventures fail by building a solution for a problem nobody has. Name the early adopters, not “everyone”.',
      'Treat every box as a hypothesis. Pick the riskiest assumption and design the cheapest test of it before you build anything.',
    ],
  },
  sections: [
    section('problem', 'The problem and the customer', 'Who has the problem, how they cope today, and who would try a solution first.',
      long('problem', 'Problem', 'The top one to three problems the customer has, in their own words — specific enough that you could ask a customer about each.', 'EV start-ups cannot get prototype tooling in weeks', { prefill: { upstream: 'pestel', output: 'opportunities' } }),
      long('existing_alternatives', 'Existing alternatives', 'How customers solve each problem today: a competitor, a workaround, or doing nothing.', 'Regional tool rooms, 3D printing bureaux, in-house tooling'),
      long('customer_segments', 'Customer segments', 'Who has the problem: the target customers. Be narrow — “everyone” is not a segment.', 'Seed-funded EV start-ups in Pune and Bengaluru', { prefill: 'business_context' }),
      long('early_adopters', 'Early adopters', 'The specific people or firms who feel the problem most acutely and would try an unfinished solution first.', 'Five Pune start-ups with a funded prototype and no tool room')),
    section('value', 'The value', 'What you offer, in one sentence, and why it cannot easily be copied.',
      long('uvp', 'Unique value proposition', 'A single, clear, compelling message that states why you are different and worth buying — in a sentence a customer would repeat.', 'Production-grade tooling in three weeks'),
      text('high_level_concept', 'High-level concept', 'Your idea in the form “X for Y” that anyone understands at once (for example, “YouTube for cooking”).', 'A tooling studio for EV start-ups'),
      long('solution', 'Solution', 'The top three features that address the problems — not a product list.', '1. Three-week prototype tooling. 2. Design review on every part. 3. Bridge to production'),
      long('unfair_advantage', 'Unfair advantage', 'Something that cannot easily be copied or bought: insider knowledge, a certification, a team, an existing community or customer base.', 'A certified production plant behind the tool room', { prefill: { upstream: 'pestel', output: 'strengths' } })),
    section('reach', 'Reaching customers', 'How you find them, and how you will know it is working.',
      long('channels', 'Channels', 'The path to customers: the free and paid ways of reaching them, inbound and outbound.', 'Incubators, OEM supplier programmes, referrals'),
      long('key_metrics', 'Key metrics', 'The few numbers that tell you how the business is doing — acquisition, activation, retention, revenue and referral.', 'Quote-to-order time; conversion to production orders')),
    section('money', 'The money', 'How the business would earn, and what it would cost.',
      long('revenue_streams', 'Revenue streams', 'How you will earn: the price, the margin and the lifetime value of a customer.', 'Tooling fees, design reviews, production margin'),
      long('cost_structure', 'Cost structure', 'The costs of reaching customers, delivering the solution, people, premises and so on — fixed and variable.', 'Tool-room staff, machine hours, fixture library')),
    section('test', 'What to test first', 'The assumption that decides everything.',
      long('riskiest_assumption', 'Riskiest assumption', 'The one thing that, if wrong, kills the idea — and the cheapest test of it.', 'That start-ups will pay a premium for speed and then give us the production order'),
      long('notes', 'Notes', 'Anything else worth recording.', '')),
  ],
  derived: [],
  outputs: [
    { key: 'problem', label: 'The problem', compute: (v) => filled(v, 'problem') },
    { key: 'customer_segments', label: 'Customer segments', compute: (v) => filled(v, 'customer_segments') },
    { key: 'uvp', label: 'Unique value proposition', compute: (v) => filled(v, 'uvp') },
    { key: 'solution', label: 'Solution', compute: (v) => filled(v, 'solution') },
    { key: 'channels', label: 'Channels', compute: (v) => filled(v, 'channels') },
    { key: 'revenue_streams', label: 'Revenue streams', compute: (v) => filled(v, 'revenue_streams') },
    { key: 'cost_structure', label: 'Cost structure', compute: (v) => filled(v, 'cost_structure') },
    { key: 'key_metrics', label: 'Key metrics', compute: (v) => filled(v, 'key_metrics') },
    { key: 'unfair_advantage', label: 'Unfair advantage', compute: (v) => filled(v, 'unfair_advantage') },
    { key: 'riskiest_assumption', label: 'Riskiest assumption', compute: (v) => filled(v, 'riskiest_assumption') },
  ],
  legacyLabels: { 'Top 1-3 problems': 'problem', 'Proposed solution': 'solution', 'Key metrics to watch': 'key_metrics' },
  analysisGuide:
    'The verdict is whether the idea is worth testing and what to test first. Check the problem is specific and expressed from the customer\'s side (not a disguised solution), that the early adopters are a named, reachable group, that the unique value proposition is a single sentence that would make a customer stop, and that the unfair advantage is genuinely hard to copy (a slogan or "better service" is not). ' +
    'Check the revenue and cost boxes are consistent with each other and with a believable price, and that the key metrics are measurable weekly. Name the riskiest assumption, say whether the proposed test is the cheapest way to settle it, and say when the idea is ready to graduate to the full Business Model Canvas.',
};

export const BUSINESS_MODELS: ModelDefinition[] = [bmc, vpc, leancanvas];
