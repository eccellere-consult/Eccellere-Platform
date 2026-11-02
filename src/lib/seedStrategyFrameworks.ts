/**
 * seedStrategyFrameworks.ts — idempotently seeds the Strategy Hub's
 * original 16 illustrative frameworks (transcribed from preview.html's
 * former hardcoded SHM_TOOLS array, HTML entities decoded back to plain
 * text since these now flow through a real DB column, not a hand-escaped
 * JS string literal). All seeded rows are `status: 'published'` — this is
 * trusted, Eccellere-authored catalogue content, not an admin draft
 * awaiting review. Mirrors the ensureSelfServiceToolsSeeded() idiom.
 */

import pool from './mysql';
import { ensureStrategyFrameworksTable, type StrategyFrameworkInput } from './strategyFrameworks';
import { ALL_MODELS } from './strategyModels/registry';
import { flattenStructure } from './strategyModels/values';

const STRATEGY_FRAMEWORKS_SEED: StrategyFrameworkInput[] = [
  {
    toolId: 'pestel', name: 'PESTEL / SWOT', layer: 'L1', phaseStart: 0, phaseEnd: 6, nature: 'diagnostic',
    does: 'Scans the macro-environment and synthesises internal strengths and weaknesses — the first read on where you stand.',
    whenToUse: 'Before any growth-vector or business-model decision, and again whenever the market shifts.',
    nextStep: "Feeds the Ansoff Matrix (growth vector context) and Porter's Five Forces (industry factors).",
    fields: [
      { label: 'Industry sector', value: 'Auto components (Tier-2 supplier)', source: 'Business Context' },
      { label: 'Key challenges', value: 'Cash flow, raw material cost volatility', source: 'Business Context' },
      { label: 'Biggest external threat', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['ansoff', 'porter5'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'ansoff', name: 'Ansoff Matrix', layer: 'L1', phaseStart: 1, phaseEnd: 4, nature: 'decision',
    does: 'Chooses the growth vector — penetration, market development, product development, or diversification.',
    whenToUse: 'Once PESTEL/SWOT has surfaced the opportunity space and you need to commit to a direction.',
    nextStep: 'The chosen vector feeds Business Model Canvas (Channels, Customer Segments) and your GTM plan.',
    fields: [
      { label: 'Current products', value: 'Precision-machined brake components', source: 'Business Context' },
      { label: 'Current markets', value: 'Domestic OEM, Tier-1 suppliers', source: 'Business Context' },
      { label: 'Chosen growth vector', value: 'Market development — export to SE Asia OEMs', source: 'Manual' },
    ],
    upstreamTools: ['pestel'], downstreamTools: ['bmc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'bcg', name: 'BCG Matrix', layer: 'L1', phaseStart: 3, phaseEnd: 5, nature: 'decision',
    does: 'Places each product line by market growth vs. relative share — Star, Cash Cow, Question Mark, or Dog — to guide where to invest, hold, or exit.',
    whenToUse: 'Once you have two or more product lines and need to allocate limited capital between them.',
    nextStep: "Investment calls here feed the Investment Prioritization Matrix and the Financial Model's capex line.",
    fields: [
      { label: 'Product lines', value: 'Brake pads, brake discs, clutch assemblies', source: 'Business Context' },
      { label: 'Revenue share (Value Scan)', value: '62% / 29% / 9%', source: 'Value Scan' },
      { label: 'Quadrant placement', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'porter5', name: "Porter's Five Forces", layer: 'L1', phaseStart: 1, phaseEnd: 5, nature: 'diagnostic',
    does: 'Rates industry attractiveness across five competitive pressures — new entrants, substitutes, buyer power, supplier power, and rivalry.',
    whenToUse: 'Startup through Maturity, whenever you need an honest read on how defensible your position really is.',
    nextStep: 'Feeds Business Model Canvas (Key Activities, Cost Structure framing).',
    fields: [
      { label: 'Supplier concentration', value: 'High — 3 alloy suppliers control 80% of input', source: 'Value Scan' },
      { label: 'Buyer power', value: '', source: 'Manual' },
    ],
    upstreamTools: ['pestel'], downstreamTools: ['bmc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'bmc', name: 'Business Model Canvas', layer: 'L2', phaseStart: 1, phaseEnd: 5, nature: 'design',
    does: 'Designs how the business creates, delivers, and captures value across nine linked blocks.',
    whenToUse: 'After the growth vector is chosen — this is where the model gets built, block by block.',
    whenNotToUse: "Pre-revenue, still testing whether the idea itself holds up — start with the Lean Canvas instead, and graduate here once there's a real customer segment and revenue line to build the other seven blocks around.",
    evidenceRequirements: 'A named customer segment with at least one real conversation or sale behind it — every other block should trace back to that segment, not be filled in generically.',
    reportTemplate: 'The nine blocks laid out in the standard canvas grid, with the two or three blocks that changed most since the last review called out explicitly.',
    nextStep: 'Revenue Streams and Cost Structure feed directly into the Three-Statement Financial Model.',
    fields: [
      { label: 'Customer segments', value: 'Tier-1 auto OEMs, export accounts', source: 'upstream: Ansoff Matrix' },
      { label: 'Value propositions', value: '', source: 'Manual' },
      { label: 'Channels', value: '', source: 'Manual' },
      { label: 'Customer relationships', value: '', source: 'Manual' },
      { label: 'Revenue streams', value: 'Per-unit contract manufacturing', source: 'Business Context' },
      { label: 'Key resources', value: '', source: 'Manual' },
      { label: 'Key activities', value: '', source: 'Manual' },
      { label: 'Key partnerships', value: '', source: 'Manual' },
      { label: 'Cost structure', value: '', source: 'Manual' },
    ],
    upstreamTools: ['ansoff', 'porter5', 'leancanvas', 'vpc'], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'vpc', name: 'Value Proposition Canvas', layer: 'L2', phaseStart: 0, phaseEnd: 2, nature: 'design',
    does: "Matches customer jobs, pains and gains against your product's relievers and creators — a fit check before you build.",
    whenToUse: 'Ideation through Early Growth, before locking in the full Business Model Canvas.',
    nextStep: 'Validated value propositions feed Business Model Canvas.',
    fields: [
      { label: 'Customer jobs', value: 'Meet OEM quality certification on tight lead times', source: 'Manual' },
      { label: 'Pain relievers', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['bmc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'financial', name: 'Three-Statement Financial Model', layer: 'L3', phaseStart: 1, phaseEnd: 5, nature: 'quantitative',
    does: 'Turns the business model into a full P&L, Balance Sheet, and Cash Flow projection.',
    whenToUse: 'Whenever the model changes materially, and at minimum once a year for planning.',
    nextStep: "Outputs feed the Balanced Scorecard's Financial perspective and the Investment Prioritization Matrix.",
    fields: [
      { label: 'Latest revenue (Value Scan)', value: '₹18.4 Cr FY 2024-25', source: 'Value Scan' },
      { label: 'EBITDA margin (Value Scan)', value: '11.2%', source: 'Value Scan' },
      { label: 'Capex assumption', value: '', source: 'Manual' },
    ],
    upstreamTools: ['bmc', 'bcg', 'mvfm', 'pivotpersist'], downstreamTools: ['bsc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'unitecon', name: 'Unit Economics (CAC:LTV)', layer: 'L3', phaseStart: 1, phaseEnd: 3, nature: 'quantitative',
    does: "Checks whether the model is fundamentally scalable — what it costs to win a customer against what they're worth over time.",
    whenToUse: 'Startup through Early Growth, before pouring capital into scaling a broken ratio.',
    nextStep: "A healthy ratio greenlights the Financial Model's growth assumptions.",
    fields: [
      { label: 'Customer acquisition cost', value: '', source: 'Manual' },
      { label: 'Average contract value (Value Scan)', value: '₹34L / annum', source: 'Value Scan' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'agenticai', name: 'Eccellere 7-Stage Agentic AI Model', layer: 'L4', phaseStart: 1, phaseEnd: 5, nature: 'diagnostic',
    does: "Places you on Eccellere's own AI adoption ladder — from prompt marketplace use, through workflows and skill.md methodologies, to fully autonomous agents.",
    whenToUse: 'Startup through Maturity — revisit whenever you adopt a new AI capability.',
    nextStep: "Feeds the Target Operating Model (L5) and the Balanced Scorecard's Learning & Growth perspective.",
    fields: [
      { label: 'Current AI usage (Value Scan)', value: 'Ad-hoc ChatGPT use, no workflows', source: 'Value Scan' },
      { label: 'Target stage', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['sevens', 'bsc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'sevens', name: 'McKinsey 7S', layer: 'L5', phaseStart: 2, phaseEnd: 5, nature: 'diagnostic',
    does: 'Checks alignment across strategy, structure, systems, shared values, skills, style, and staff.',
    whenToUse: 'Early Growth through Maturity, whenever growth is starting to strain the organisation.',
    whenNotToUse: 'A team small enough that everyone still sits in one room — the seven elements have nothing meaningful to diverge on yet at that scale.',
    evidenceRequirements: 'An honest read of each of the seven elements, not just the org chart — "structure" is easy to state, "style" and "shared values" require someone willing to say the uncomfortable version.',
    scoringGuidance: 'Rate each of the seven elements as aligned, partially aligned, or misaligned with the stated strategy — the elements that are misaligned are the actual finding, not the ones that are fine.',
    reportTemplate: 'Seven short entries, one per element, each ending in an alignment rating — closing with which one or two misalignments matter most right now.',
    nextStep: 'Feeds the RACI Matrix and Functional Strategy documents (L7).',
    fields: [
      { label: 'Employee count band', value: '51–100', source: 'Business Context' },
      { label: 'Strategy', value: '', source: 'Manual' },
      { label: 'Structure', value: 'Structure lagging strategy — flat org past 60 staff', source: 'Value Scan' },
      { label: 'Systems', value: '', source: 'Manual' },
      { label: 'Shared values', value: '', source: 'Manual' },
      { label: 'Skills', value: '', source: 'Manual' },
      { label: 'Style', value: '', source: 'Manual' },
      { label: 'Staff', value: '', source: 'Manual' },
    ],
    upstreamTools: ['agenticai'], downstreamTools: ['raci'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'raci', name: 'RACI Matrix', layer: 'L5', phaseStart: 2, phaseEnd: 5, nature: 'governance',
    does: 'Assigns Responsible, Accountable, Consulted, and Informed for every key decision — removes ambiguity about who actually decides.',
    whenToUse: 'Whenever a 7S review surfaces unclear ownership.',
    whenNotToUse: 'A team of two or three where everyone already knows who decides what — the overhead of a formal matrix outweighs the ambiguity it would remove.',
    evidenceRequirements: 'A specific, named decision (not "marketing decisions" in general) and the actual people involved, not their job titles alone.',
    scoringGuidance: 'Exactly one person should be Accountable per decision — if two names land in that column, the exercise has surfaced the real problem, not finished the form.',
    reportTemplate: 'The decision, then one row per person naming their role (R/A/C/I) — flagging explicitly if any decision has zero or multiple Accountable owners.',
    nextStep: 'Clarified ownership feeds Functional Strategy execution (L7) directly.',
    fields: [
      { label: 'Decision in question', value: '', source: 'Manual' },
      { label: 'Responsible (does the work)', value: '', source: 'Manual' },
      { label: 'Accountable (owns the outcome — exactly one name)', value: '', source: 'Manual' },
      { label: 'Consulted (input sought before deciding)', value: '', source: 'Manual' },
      { label: 'Informed (told after the decision)', value: '', source: 'Manual' },
    ],
    upstreamTools: ['sevens'], downstreamTools: ['stp'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'bsc', name: 'Balanced Scorecard', layer: 'L6', phaseStart: 3, phaseEnd: 5, nature: 'governance',
    does: 'Measures the plan across four perspectives — Financial, Customer, Internal Process, and Learning & Growth — so no single metric hides the whole picture.',
    whenToUse: "Growth through Maturity, once there's enough of a plan worth tracking.",
    nextStep: 'Objectives cascade directly into OGSM and team-level OKRs.',
    fields: [
      { label: 'Financial objective', value: 'From Financial Model outputs', source: 'upstream: Financial Model' },
      { label: 'Customer objective', value: '', source: 'Manual' },
    ],
    upstreamTools: ['financial', 'agenticai', 'startupkpis'], downstreamTools: ['ogsm', 'okrs'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'ogsm', name: 'OGSM', layer: 'L6', phaseStart: 2, phaseEnd: 4, nature: 'governance',
    does: 'Cascades Objectives, Goals, Strategies and Measures into one page everyone can hold themselves to.',
    whenToUse: 'Early Growth through Growth/Scale, as an annual planning ritual.',
    nextStep: 'Strategies decompose into functional OKRs (L9).',
    fields: [
      { label: 'Top objective', value: '', source: 'Manual' },
    ],
    upstreamTools: ['bsc'], downstreamTools: ['okrs'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'stp', name: 'STP — Segmentation, Targeting, Positioning', layer: 'L7', phaseStart: 2, phaseEnd: 5, nature: 'design',
    does: 'Segments the market, picks the target, and defines the position you want to own in their minds.',
    whenToUse: 'Marketing function, whenever the customer base or offer changes materially.',
    nextStep: 'Sets the frame for the 7Ps Marketing Mix and the Customer Journey Map.',
    fields: [
      { label: 'Customer type', value: 'B2B', source: 'Business Context' },
      { label: 'Chosen position', value: '', source: 'Manual' },
    ],
    upstreamTools: ['raci'], downstreamTools: [], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'ninebox', name: '9-Box Talent Grid', layer: 'L8', phaseStart: 3, phaseEnd: 5, nature: 'decision',
    does: 'Plots people on performance vs. potential to guide succession and development decisions.',
    whenToUse: 'HR function, Growth through Maturity, typically an annual or half-yearly review.',
    nextStep: 'Feeds functional OKRs and, for high-potential staff, individual KRAs (L9).',
    fields: [
      { label: 'Review cohort', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['okrs'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'okrs', name: 'OKRs → Individual KRAs', layer: 'L9', phaseStart: 2, phaseEnd: 6, nature: 'execution',
    does: 'Cascades scorecard and functional-model objectives into quarterly Key Results, then into the slice of each Key Result one person owns.',
    whenToUse: 'Every quarter, once a Balanced Scorecard or functional decision model exists to decompose from.',
    nextStep: "Terminal — this is where the golden thread reaches an individual's actual accountability.",
    fields: [
      { label: 'Parent objective', value: 'From Balanced Scorecard', source: 'upstream: Balanced Scorecard' },
      { label: 'Key result', value: '', source: 'Manual' },
      { label: 'Owner', value: '', source: 'Manual' },
    ],
    upstreamTools: ['bsc', 'ogsm', 'ninebox', 'first90'], downstreamTools: [], industryTemplates: null, status: 'published',
  },
];

// L1 Corporate Strategy — the remaining 15 of 20 catalogue frameworks not
// already above (Ansoff/BCG/Porter5/PESTEL-SWOT). Transcribed and expanded
// from the eccellere-strategy-hub-architect skill's framework-catalogue.md
// (names, layer, phase-fit, and one-line use are the real source; does/
// whenToUse/nextStep/fields/nature are authored here, grounded in that
// source, matching the existing rows' prose style and illustrative business
// (a precision-machined auto-components MSME) for continuity.
const L1_REMAINING_SEED: StrategyFrameworkInput[] = [
  {
    toolId: 'ge9box', name: 'GE-McKinsey 9-Box Matrix', layer: 'L1', phaseStart: 3, phaseEnd: 5, nature: 'decision',
    does: "Places each business unit or product line on a 9-cell grid — industry attractiveness vs. competitive strength — to prioritise where to invest, hold, or divest; a richer alternative to the BCG Matrix's simpler 2x2.",
    whenToUse: "Growth/Scale through Maturity, once BCG's simpler grid feels too coarse for a multi-factor competitive position.",
    nextStep: 'Investment priorities feed the Financial Model’s capital allocation.',
    fields: [
      { label: 'Business units / product lines', value: 'Brake components, clutch assemblies, export accessories', source: 'Business Context' },
      { label: 'Industry attractiveness score', value: '', source: 'Manual' },
      { label: 'Competitive strength score', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'horizons3', name: 'McKinsey Three Horizons Model', layer: 'L1', phaseStart: 3, phaseEnd: 6, nature: 'decision',
    does: "Balances three time horizons at once — the core you defend today (H1), the adjacent bets scaling now (H2), and the transformational bets that might become tomorrow's core (H3).",
    whenToUse: 'Growth/Scale through Renewal, whenever the current business risks stalling and new bets need a deliberate resourcing split, not an accidental one.',
    nextStep: "Feeds portfolio decisions in the BCG/9-Box matrices and the Financial Model's R&D budget line.",
    fields: [
      { label: 'H1 — core business', value: 'Precision-machined brake and clutch components', source: 'Business Context' },
      { label: 'H2 — adjacent bet', value: '', source: 'Manual' },
      { label: 'H3 — transformational bet', value: '', source: 'Manual' },
    ],
    upstreamTools: ['pivotpersist'], downstreamTools: ['bcg', 'financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'portergeneric', name: "Porter's Generic Strategies", layer: 'L1', phaseStart: 2, phaseEnd: 5, nature: 'decision',
    does: 'Forces a choice of competitive stance — cost leadership, differentiation, or focus — since trying to be all three at once usually means being none of them well.',
    whenToUse: "Early Growth through Maturity, once Porter's Five Forces has clarified industry structure and a clear stance needs committing to.",
    nextStep: "The chosen stance shapes the Business Model Canvas's Value Proposition and Cost Structure blocks.",
    fields: [
      { label: "Industry structure (from Porter's Five Forces)", value: '', source: 'upstream: Porter’s Five Forces' },
      { label: 'Chosen strategy', value: '', source: 'Manual' },
    ],
    upstreamTools: ['porter5'], downstreamTools: ['bmc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'valuechain', name: "Porter's Value Chain", layer: 'L1', phaseStart: 3, phaseEnd: 5, nature: 'diagnostic',
    does: 'Breaks the business into primary and support activities to see exactly where margin and differentiation are actually created internally.',
    whenToUse: "Growth through Maturity, when cost or differentiation isn't obviously coming from anywhere in particular and needs tracing activity by activity.",
    nextStep: "Identified margin/cost drivers feed the Financial Model's cost-structure assumptions.",
    fields: [
      { label: 'Primary activities reviewed', value: 'Inbound logistics, machining, quality inspection, dispatch', source: 'Business Context' },
      { label: 'Biggest margin driver found', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'blueocean', name: 'Blue Ocean Strategy / Strategy Canvas', layer: 'L1', phaseStart: 0, phaseEnd: 3, nature: 'design',
    does: 'Maps your offering against competitors on the factors customers actually value, looking for an uncontested space rather than competing head-on.',
    whenToUse: 'Ideation through Early Growth, when the industry feels commoditised and a genuinely different value curve is worth exploring.',
    nextStep: 'A validated new value curve feeds the ERRC Grid to make the redesign concrete.',
    fields: [
      { label: 'Factors the industry competes on', value: 'Price, lead time, certification, customisation', source: 'Manual' },
      { label: 'Your current curve vs. competitors', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['errc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'errc', name: 'ERRC Grid (Eliminate-Reduce-Raise-Create)', layer: 'L1', phaseStart: 0, phaseEnd: 4, nature: 'design',
    does: 'Forces four blunt questions on the value curve — what to Eliminate, Reduce, Raise, and Create — turning a Blue Ocean insight into a concrete redesign.',
    whenToUse: 'Right after a Strategy Canvas has surfaced a differentiation opportunity, to make it actionable rather than aspirational.',
    nextStep: "The redesigned offering feeds the Business Model Canvas's Value Proposition block.",
    fields: [
      { label: 'Eliminate', value: '', source: 'Manual' },
      { label: 'Reduce', value: '', source: 'Manual' },
      { label: 'Raise', value: '', source: 'Manual' },
      { label: 'Create', value: '', source: 'Manual' },
    ],
    upstreamTools: ['blueocean'], downstreamTools: ['bmc'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'vrio', name: 'VRIO Framework', layer: 'L1', phaseStart: 2, phaseEnd: 5, nature: 'diagnostic',
    does: 'Tests whether a resource or capability is genuinely a sustainable advantage — Valuable, Rare, Inimitable, and Organised to capture — or just a temporary edge.',
    whenToUse: "Early Growth through Maturity, whenever a claimed 'advantage' needs an honest stress test before betting strategy on it.",
    nextStep: 'Confirmed advantages feed the Core Competence Framework and the Generic Strategies positioning.',
    fields: [
      { label: 'Resource/capability being tested', value: 'IATF 16949 certification + in-house CNC capability', source: 'Business Context' },
      { label: 'VRIO verdict', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['corecompetence', 'pivotpersist'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'rbv', name: 'Resource-Based View (RBV)', layer: 'L1', phaseStart: 4, phaseEnd: 5, nature: 'diagnostic',
    does: "Builds strategy outward from the firm's own hard-to-replicate internal capabilities, rather than starting from the external market.",
    whenToUse: "Maturity, when external-market frameworks alone aren't explaining why the business still wins deals — the answer is usually internal.",
    nextStep: "Feeds the Core Competence Framework's transferable-capability review.",
    fields: [
      { label: 'Core internal capabilities', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['corecompetence'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'scenario', name: 'Scenario Planning (Shell-style)', layer: 'L1', phaseStart: 3, phaseEnd: 6, nature: 'diagnostic',
    does: 'Builds a small set of plausible, distinct futures — not a single forecast — so the strategy is robust across more than one version of what happens next.',
    whenToUse: 'Growth through Renewal, under real uncertainty (input-cost shocks, new regulation, a new entrant) where a single forecast would be false precision.',
    nextStep: "Stress-tests the Financial Model's assumptions and Risk Heat Map likelihood ratings.",
    fields: [
      { label: 'Key uncertainty', value: 'Raw material (alloy) price volatility', source: 'Business Context' },
      { label: 'Best-case / base-case / worst-case scenarios', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published',
  },
  {
    toolId: 'gametheory', name: 'Game Theory / Competitive Response Grid', layer: 'L1', phaseStart: 4, phaseEnd: 5, nature: 'decision',
    does: 'Maps out how competitors are likely to respond to a given move before you make it, so you are not surprised by the retaliation.',
    whenToUse: 'Maturity, in a concentrated market where a pricing or capacity move will provoke a direct competitor reaction.',
    whenNotToUse: 'A fragmented market with many small competitors — this tool earns its keep against a small number of identifiable rivals who can actually retaliate, not an anonymous crowd.',
    evidenceRequirements: "A named short-list of competitors capable of responding, and a read on each one's likely incentive and capacity to react.",
    reportTemplate: 'The move under consideration, each named competitor\'s likely response and its severity, and whether the move is still worth making once retaliation is priced in.',
    nextStep: 'Informs the chosen Generic Strategy and pricing decisions.',
    fields: [
      { label: 'Move being considered', value: '', source: 'Manual' },
      { label: 'Likely competitor response', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['portergeneric'], industryTemplates: null, status: 'published', audience: 'consulting_pro',
  },
  {
    toolId: 'parenting', name: 'Corporate Parenting Advantage', layer: 'L1', phaseStart: 3, phaseEnd: 4, nature: 'decision',
    does: 'Checks whether the parent company genuinely adds value to a business unit — or whether the unit would simply do better standalone.',
    whenToUse: "Growth/Scale, once you're running more than one business unit and need an honest fit-to-parent read.",
    whenNotToUse: 'A single-site, single-business-unit MSME — there is no parent-vs-standalone question to ask until a second business unit actually exists.',
    evidenceRequirements: 'A separable P&L per business unit, and a candid list of what the parent actually provides (capital, brand, shared services) versus what it costs the unit in overhead or decision lag.',
    reportTemplate: 'Per business unit: what the parent provides, what it costs, and a verdict — the parent adds value, is neutral, or is a drag the unit would be better without.',
    nextStep: 'Feeds portfolio decisions in the BCG/9-Box matrices.',
    fields: [
      { label: 'Business units under review', value: '', source: 'Manual' },
      { label: 'Parent value-add per unit', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['bcg', 'ge9box'], industryTemplates: null, status: 'published', audience: 'consulting_pro',
  },
  {
    toolId: 'dpm', name: 'Directional Policy Matrix (Shell/DPM)', layer: 'L1', phaseStart: 4, phaseEnd: 5, nature: 'decision',
    does: 'An alternative to the GE-McKinsey grid for the same job — plotting market attractiveness against competitive capability to guide investment.',
    whenToUse: 'Maturity, as a second-opinion cross-check alongside or instead of the 9-Box Matrix.',
    whenNotToUse: 'As a first-choice tool — this exists as a cross-check once the GE-McKinsey 9-Box has already been run, not a replacement for it.',
    evidenceRequirements: 'The same market and competitive data already gathered for the 9-Box Matrix — this is a second lens on that data, not a fresh data-collection exercise.',
    scoringGuidance: 'Rate market attractiveness and business capability High/Medium/Low each, same convention as the 9-Box, so the two grids are directly comparable.',
    nextStep: 'Feeds the same downstream investment decisions as the 9-Box Matrix.',
    fields: [
      { label: 'Market attractiveness rating', value: '', source: 'Manual' },
      { label: 'Business capability rating', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['financial'], industryTemplates: null, status: 'published', audience: 'consulting_pro',
  },
  {
    toolId: 'makebuyally', name: 'Make-Buy-Ally Framework', layer: 'L1', phaseStart: 3, phaseEnd: 4, nature: 'decision',
    does: 'Decides whether a needed capability should be built in-house, bought/acquired, or accessed through an alliance.',
    whenToUse: "Growth/Scale, whenever a capability gap (new process, geography, or technology) needs closing and the sourcing route isn't obvious.",
    whenNotToUse: 'A capability gap that is cheap and fast to build in-house — this framework earns its keep on genuinely hard sourcing calls, not routine hiring or a small tooling purchase.',
    evidenceRequirements: 'A rough cost and time estimate for each of the three routes (build, buy, ally) — even directional numbers are enough to make the comparison honest.',
    reportTemplate: 'The capability gap, the three routes each with a one-line cost/time/risk read, and the recommended verdict with its rationale.',
    nextStep: "A 'buy' or 'ally' verdict feeds the M&A Synergy Map; a 'make' verdict feeds the Operating Model Canvas.",
    fields: [
      { label: 'Capability gap', value: '', source: 'Manual' },
      { label: 'Make/Buy/Ally verdict', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['masynergy'], industryTemplates: null, status: 'published', audience: 'consulting_pro',
  },
  {
    toolId: 'masynergy', name: 'M&A Synergy Map', layer: 'L1', phaseStart: 3, phaseEnd: 5, nature: 'quantitative',
    does: 'Screens a potential acquisition target for where real synergy — cost, revenue, or capability — would actually come from, before a term sheet gets drafted.',
    whenToUse: "Growth through Maturity, once Make-Buy-Ally has pointed toward 'buy' and a specific target is on the table.",
    whenNotToUse: "Before there's an actual target on the table — this maps synergy for a specific acquisition, it isn't a general M&A-readiness check.",
    evidenceRequirements: "The target's own financials where available, plus a specific, named list of overlaps (shared customers, duplicate overhead, combinable capacity) — vague synergy claims without a named source don't survive this framework.",
    scoringGuidance: 'Classify each synergy source as cost, revenue, or capability, and rate confidence High/Medium/Low — a deal built entirely on Low-confidence synergies is a red flag worth stating plainly.',
    reportTemplate: 'A table of named synergy sources, each with its type, a rough value estimate, and a confidence rating — then a one-line overall verdict on whether the deal stands up without the synergies.',
    nextStep: "Confirmed synergies feed the Financial Model's deal valuation (DCF/NPV).",
    fields: [
      { label: 'Target under review', value: '', source: 'Manual' },
      { label: 'Synergy sources identified', value: '', source: 'Manual' },
    ],
    upstreamTools: ['makebuyally'], downstreamTools: ['financial'], industryTemplates: null, status: 'published', audience: 'consulting_pro',
  },
  {
    toolId: 'corecompetence', name: 'Core Competence Framework (Prahalad & Hamel)', layer: 'L1', phaseStart: 4, phaseEnd: 6, nature: 'diagnostic',
    does: "Identifies which capabilities are genuinely transferable across products or markets — the ones worth building the business's next act around.",
    whenToUse: "Maturity through Renewal, when the current business is plateauing and the next move should leverage what you're already excellent at.",
    nextStep: "Feeds the Ansoff Matrix's diversification vector and the Three Horizons Model's H3 bet.",
    fields: [
      { label: 'Candidate core competencies', value: '', source: 'Manual' },
      { label: 'Transferable market/product applications', value: '', source: 'Manual' },
    ],
    upstreamTools: ['vrio', 'rbv'], downstreamTools: ['ansoff', 'horizons3', 'pivotpersist'], industryTemplates: null, status: 'published',
  },
];

// MSME/startup gap-fill — closes the highest-priority empty layer×phase
// cells identified in the framework-quality assessment: Ideation/Startup
// coverage was thin across L2/L3/L6/L9, and Renewal had no diagnostic
// outside L1. Each one is a deliberately LIGHTER counterpart to an existing
// heavier tool (Lean Canvas before BMC, a minimum-viable model before the
// Three-Statement Model, a few tracked numbers before a Balanced Scorecard,
// a 90-day plan before quarterly OKRs) rather than a new standalone
// category — so the "graduate to the heavier tool" story is explicit in
// each one's nextStep, matching this catalogue's golden-thread convention.
// All tagged audience 'msme' or 'both' — this pass is about the
// self-service tier specifically, not the deep enterprise (L4/L7/L8) gaps,
// which stay backlogged for a future consulting_pro pass.
const MSME_GAP_FILL_SEED: StrategyFrameworkInput[] = [
  {
    toolId: 'leancanvas', name: 'Lean Canvas', layer: 'L2', phaseStart: 0, phaseEnd: 2, nature: 'design',
    does: "Sketches a one-page business model for an idea that doesn't have a business yet — problem, solution, key metrics, unfair advantage — before committing to the full Business Model Canvas.",
    whenToUse: "Ideation and very early Startup, testing a new idea before there's a proven customer or revenue line to model.",
    whenNotToUse: 'Once the business has paying customers and a repeatable model — move to the Business Model Canvas, which captures partners, channels and cost structure this canvas deliberately leaves out.',
    evidenceRequirements: "Whatever the founder can state with conviction today — real customer conversations if they exist, but this canvas is designed to work from a stated hypothesis, not audited data.",
    scoringGuidance: '',
    reportTemplate: 'One page: the problem, the solution, the customer segment, and the single unfair advantage — written so a first-time reader understands the bet being made in under a minute.',
    nextStep: 'A validated canvas graduates into the full Business Model Canvas once there is a real customer segment and revenue line to build the other blocks around.',
    fields: [
      { label: 'Top 1-3 problems', value: "MSMEs can't get working-capital loans approved fast enough during a demand spike", source: 'Manual' },
      { label: 'Proposed solution', value: '', source: 'Manual' },
      { label: 'Key metrics to watch', value: '', source: 'Manual' },
      { label: 'Unfair advantage', value: '', source: 'Manual' },
      { label: 'Customer segments', value: '', source: 'Business Context' },
    ],
    upstreamTools: ['pestel'], downstreamTools: ['bmc'], industryTemplates: null, status: 'published', audience: 'msme',
  },
  {
    toolId: 'mvfm', name: 'Minimum Viable Financial Model', layer: 'L3', phaseStart: 0, phaseEnd: 2, nature: 'quantitative',
    does: "A one-sheet cash and unit-cost projection — enough to know if the idea can plausibly become a real business — built before a full three-statement model is worth the effort.",
    whenToUse: 'Ideation through early Startup, before there is enough transaction history for the Three-Statement Financial Model to be more than guesswork.',
    whenNotToUse: 'Once there are 6+ months of real transactions — switch to the Three-Statement Financial Model, which uses actuals instead of assumptions.',
    evidenceRequirements: 'Best-guess unit price, unit cost, and expected monthly volume — assumptions are expected here and should be labelled as assumptions, not presented as fact.',
    scoringGuidance: '',
    reportTemplate: 'A single table: monthly revenue, cost, and cash position for the next 12 months under a base-case assumption set, with the break-even month called out explicitly.',
    nextStep: 'Once assumptions are replaced by real transaction history, this graduates into the Three-Statement Financial Model.',
    fields: [
      { label: 'Unit price', value: '', source: 'Manual' },
      { label: 'Unit cost', value: '', source: 'Manual' },
      { label: 'Expected monthly volume (Month 1)', value: '', source: 'Manual' },
      { label: 'Fixed monthly costs', value: '', source: 'Manual' },
      { label: 'Starting cash', value: '', source: 'Business Context' },
    ],
    upstreamTools: ['leancanvas'], downstreamTools: ['financial'], industryTemplates: null, status: 'published', audience: 'msme',
  },
  {
    toolId: 'startupkpis', name: 'Startup KPI Tracker', layer: 'L6', phaseStart: 0, phaseEnd: 2, nature: 'governance',
    does: "Picks the 3-5 numbers that actually matter before a business has enough going on to need a full Balanced Scorecard — a weekly discipline, not a system.",
    whenToUse: 'Ideation through Startup, for a team too small to need four scorecard perspectives but that still needs to know if the week went well.',
    whenNotToUse: 'Once the business has multiple functions with genuinely different objectives — move to the Balanced Scorecard, which is built for exactly that.',
    evidenceRequirements: "Whatever is already being tracked informally — a notebook, a spreadsheet, a weekly WhatsApp update. This framework just names and disciplines it.",
    scoringGuidance: "Pick numbers with a clear direction of good (up or down) and a weekly cadence — if a metric can't be checked weekly, it belongs in a later, heavier framework instead.",
    reportTemplate: "A five-row table: metric, this week's number, last week's number, direction, and one line on what changed.",
    nextStep: 'As the business adds functions and objectives multiply, this graduates into the Balanced Scorecard.',
    fields: [
      { label: 'Metric 1', value: '', source: 'Manual' },
      { label: 'Metric 2', value: '', source: 'Manual' },
      { label: 'Metric 3', value: '', source: 'Manual' },
      { label: 'Review cadence', value: 'Weekly', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['bsc'], industryTemplates: null, status: 'published', audience: 'msme',
  },
  {
    toolId: 'first90', name: 'First 90 Days Plan', layer: 'L9', phaseStart: 1, phaseEnd: 2, nature: 'execution',
    does: 'Breaks the next 90 days into three specific, sequenced blocks of work — lighter than a full quarterly OKR cycle, which assumes more structure than a very early team has yet.',
    whenToUse: 'Startup phase, right after a founding team commits to a direction and needs a concrete near-term plan rather than a long-range one.',
    whenNotToUse: 'Once the team is running a real quarterly cadence with multiple contributors — move to OKRs, which formalises objectives and ownership across more than one or two people.',
    evidenceRequirements: 'The single biggest near-term risk or opportunity the team has already identified — this plan should attack that, not read as a generic checklist.',
    scoringGuidance: "Each 30-day block should have one clear done/not-done outcome, not a list of activities — if it can't be marked done, rewrite it.",
    reportTemplate: "Three sections, one per 30-day block: what must be true by the end of it, the 2-3 actions that get there, and who's doing them.",
    nextStep: 'As the team and cadence mature, this graduates into quarterly OKRs.',
    fields: [
      { label: 'Days 1-30 outcome', value: '', source: 'Manual' },
      { label: 'Days 31-60 outcome', value: '', source: 'Manual' },
      { label: 'Days 61-90 outcome', value: '', source: 'Manual' },
      { label: 'Biggest risk this plan addresses', value: '', source: 'Manual' },
    ],
    upstreamTools: [], downstreamTools: ['okrs'], industryTemplates: null, status: 'published', audience: 'msme',
  },
  {
    toolId: 'pivotpersist', name: 'Pivot-or-Persist Check', layer: 'L1', phaseStart: 5, phaseEnd: 6, nature: 'diagnostic',
    does: "A structured gut-check for a business that has plateaued or is losing ground — is the core still defensible, does it need reinvention, or is it time to wind down and redeploy capital elsewhere?",
    whenToUse: "Renewal phase, when growth has stalled for more than a year and the honest question is no longer 'how do we grow faster' but 'should we still be doing this.'",
    whenNotToUse: "Earlier lifecycle stages, or a business that's merely had one bad year — a single down year is a Value Scan question, not a pivot-or-persist one.",
    evidenceRequirements: 'At least 2-3 years of revenue and margin trend, and an honest read of whether the core capability is still genuinely differentiated — see VRIO and Core Competence.',
    scoringGuidance: 'Score three questions 1-5 each — is the core still defensible, is there a credible reinvention path, is there a better use of the capital and team elsewhere — and let the LOWEST score, not the average, drive the recommendation.',
    reportTemplate: 'One page: the three scores, which one is lowest and why, and a single recommended path — persist, pivot, or exit.',
    nextStep: "A 'pivot' verdict feeds the Three Horizons Model's H3 bet; an 'exit' verdict feeds the Financial Model's wind-down scenario; a 'persist' verdict returns to the standard Value Scan cycle.",
    fields: [
      { label: 'Is the core still defensible? (1-5)', value: '', source: 'Manual' },
      { label: 'Is there a credible reinvention path? (1-5)', value: '', source: 'Manual' },
      { label: 'Revenue trend, last 3 years', value: '', source: 'Value Scan' },
      { label: 'Recommended path', value: '', source: 'Manual' },
    ],
    upstreamTools: ['corecompetence', 'vrio'], downstreamTools: ['horizons3', 'financial'], industryTemplates: null, status: 'published', audience: 'both',
  },
];

// Appended to, layer by layer, as the catalogue expansion continues —
// keeps each layer's seed data reviewable as its own array rather than one
// undifferentiated 90-entry list.
export const ALL_SEED: StrategyFrameworkInput[] = [...STRATEGY_FRAMEWORKS_SEED, ...L1_REMAINING_SEED, ...MSME_GAP_FILL_SEED];

let seeded = false;
export async function ensureStrategyFrameworksSeeded(): Promise<void> {
  if (seeded) return;
  await ensureStrategyFrameworksTable();
  for (const fw of ALL_SEED) {
    await pool.query(
      `INSERT INTO strategy_frameworks (
        tool_id, name, layer, phase_start, phase_end, nature, does, when_to_use, when_not_to_use,
        evidence_requirements, scoring_guidance, report_template, next_step,
        fields, upstream_tools, downstream_tools, industry_templates, status, audience
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        -- Genuinely new tool_ids insert in full. An already-seeded row only
        -- ever backfills the framework-quality columns added in this pass
        -- (and ONLY while they're still empty) — never does/whenToUse/
        -- fields/status, which an admin may have already hand-edited live.
        -- Same non-destructive spirit as this file's own header comment.
        when_not_to_use = IF(when_not_to_use IS NULL OR when_not_to_use = '', VALUES(when_not_to_use), when_not_to_use),
        evidence_requirements = IF(evidence_requirements IS NULL OR evidence_requirements = '', VALUES(evidence_requirements), evidence_requirements),
        scoring_guidance = IF(scoring_guidance IS NULL OR scoring_guidance = '', VALUES(scoring_guidance), scoring_guidance),
        report_template = IF(report_template IS NULL OR report_template = '', VALUES(report_template), report_template),
        -- audience backfills only from the untouched column default ('both')
        -- — every pre-existing row is sitting at exactly that today since
        -- the column is brand new, so this is a one-time correction, not an
        -- ongoing override; an admin who deliberately sets a tier after this
        -- lands is never overwritten (nothing here can move a row OFF a
        -- non-default value).
        audience = IF(audience = 'both', VALUES(audience), audience)`,
      [
        fw.toolId, fw.name, fw.layer, fw.phaseStart, fw.phaseEnd, fw.nature,
        fw.does, fw.whenToUse, fw.whenNotToUse ?? '',
        fw.evidenceRequirements ?? '', fw.scoringGuidance ?? '', fw.reportTemplate ?? '', fw.nextStep,
        JSON.stringify(fw.fields), JSON.stringify(fw.upstreamTools), JSON.stringify(fw.downstreamTools),
        null, fw.status, fw.audience ?? 'both',
      ]
    ).catch(() => {});
  }
  await backfillDeepenedFields();
  await syncModelFields();
  seeded = true;
}

// The three frameworks whose `fields` were restructured to match their real
// canonical parts in the framework-quality pass (BMC's 9 blocks, 7S's 7
// elements, RACI's 4 roles) — deliberately NOT handled by the generic
// ON DUPLICATE KEY UPDATE above, since `fields` is genuinely admin-editable
// content and "still empty" isn't a safe signal for JSON the way it is for
// the plain-text columns. Instead: a named, one-time backfill for exactly
// these three tool_ids, gated on the row's field count still being at or
// below its known PRE-this-pass count (3/2/1 respectively) — a real signal
// specific enough that no legitimate admin customisation would coincidentally
// match it, so this never overwrites a framework an admin has since edited.
const DEEPENED_FIELD_COUNT_CEILING: Record<string, number> = { bmc: 3, sevens: 2, raci: 1 };
async function backfillDeepenedFields(): Promise<void> {
  for (const toolId of Object.keys(DEEPENED_FIELD_COUNT_CEILING)) {
    const seed = ALL_SEED.find((f) => f.toolId === toolId);
    if (!seed) continue;
    await pool.query(
      `UPDATE strategy_frameworks SET fields = ?
       WHERE tool_id = ? AND JSON_LENGTH(fields) <= ?`,
      [JSON.stringify(seed.fields), toolId, DEEPENED_FIELD_COUNT_CEILING[toolId]]
    ).catch(() => {});
  }
}

/**
 * A framework with a model has the model's own fields (see strategyFrameworks.ts, which serves them regardless of what the
 * row holds). This keeps the stored column in step too, so anything reading the table directly sees the same list. Only
 * rows that differ are written, so a deploy does not touch every row's updated_at.
 */
async function syncModelFields(): Promise<void> {
  for (const model of ALL_MODELS) {
    const wanted = JSON.stringify(flattenStructure(model));
    try {
      const [rows] = (await pool.query('SELECT fields FROM strategy_frameworks WHERE tool_id = ? LIMIT 1', [model.toolId])) as [{ fields: unknown }[], unknown];
      if (!rows || rows.length === 0) continue;
      const raw = rows[0].fields;
      let current = '';
      try { current = JSON.stringify(typeof raw === 'string' ? JSON.parse(raw) : raw); } catch { current = ''; }
      if (current !== wanted) await pool.query('UPDATE strategy_frameworks SET fields = ? WHERE tool_id = ?', [wanted, model.toolId]);
    } catch {
      // a failed sync is harmless: the catalogue serves the model's fields regardless of the stored column
    }
  }
}

