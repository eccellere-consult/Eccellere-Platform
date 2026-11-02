/**
 * samples/business.ts — the worked examples for the Business Model Canvas and the Value Proposition Canvas, told about
 * the fictional Anand Auto Components (Pune). The cost shares are the real proportions of the sample financial statements
 * (materials 58% of revenue, people 14%, power and job work 7%, depreciation and finance 6%).
 */
import type { ModelSample } from '../types';

export const BUSINESS_SAMPLES: Record<string, ModelSample> = {
  bmc: {
    scenario: 'Anand Auto Components (Pune) — its business model today, on one page.',
    values: {
      customer_segments: 'OEM passenger-vehicle manufacturers (two anchor accounts, two more at bid stage); Tier-1 assemblers in the Pune–Chakan belt; emerging EV start-ups that need prototype-to-volume machining.',
      value_propositions: 'Certified (IATF 16949) precision parts with tight tolerances and faster approval cycles than regional shops; engineering support for manufacturability; reliable just-in-time delivery within a 90-km radius; one source for both machined and welded parts.',
      channels: 'Direct key-account sales with engineering-led technical visits; OEM vendor portals and request-for-quotation platforms; plant audits and approval submissions; trade shows; referrals from existing OEM buyers.',
      customer_relationships: 'A dedicated account manager and quality engineer for each anchor OEM; two-to-three-year supply agreements with annual price-down clauses; joint cost-reduction (value-engineering) projects; monthly scorecard reviews; trial-lot approvals for new accounts.',
      revenue_streams: 'Per-unit sales under annual contracts (about 92% of revenue); tooling and fixture recovery charges (about 5%); engineering and prototype services (about 3%). Payment terms are 60–90 days.',
      key_resources: 'CNC machining centres and two welding lines; IATF 16949 certification and quality systems; skilled operators and a tool-room team; approval and drawing history with each customer; bank working-capital lines.',
      key_activities: 'Precision machining and welding; quality inspection and traceability; tool-room and fixture design; new-part development and production-part approval; production planning and just-in-time dispatch.',
      key_partnerships: 'Three alloy-steel mills and forging suppliers; heat-treatment and plating job-workers; a logistics partner for milk-run dispatch; banks and MSME lenders; a trading partner for South-East Asian exports (being explored).',
      cost_structure: 'Raw materials (about 58% of revenue); employee cost (14%); power, fuel and job work (7%); depreciation and finance costs (6%). Mostly variable material cost on top of a high fixed plant cost, so margin is sensitive to utilisation (currently 74%).',
    },
    tables: {},
    why: {
      customer_segments: 'Naming the two segments still at bid stage shows where the model is changing, not just where it is.',
      value_propositions: 'Each element ties to a pain a buyer actually has: approval time, tolerance, delivery, vendor count.',
      revenue_streams: 'Percentages come from the sample statements, so the blocks can be tested against the financial model.',
      cost_structure: 'Shares match the sample profit and loss: the model must reconcile with the financials.',
    },
    analysis: {
      summary: 'The model is coherent at its core — certified precision parts, sold directly to a few large buyers under annual contracts — and its cost structure matches the financials. The strain is on the right-hand side: one segment dominates revenue, and the channels and relationships are built around two accounts. The left side (resources, activities, partners) is solid but concentrated on three steel mills.',
      verdict: {
        label: 'Coherent but narrow: one segment carries the model',
        rationale: 'Every value proposition has a segment, a channel and a revenue stream behind it, but the segment block is too thin to support the growth plan.',
      },
      findings: [
        { title: 'The value proposition is credible and specific', detail: 'Certified quality, fast approval, tight tolerances and just-in-time delivery each answer a real buyer pain, and the resources listed (CNC, IATF 16949, tool-room) are exactly what they require.' },
        { title: 'The customer side is thin', detail: 'Two anchor accounts and two bids is a narrow base; channels and relationships are described only for those accounts, so scaling to new segments would need new channels.' },
        { title: 'Revenue is almost one stream', detail: 'About 92% comes from per-unit sales. Tooling and engineering services (8%) are small but have higher margin potential and strengthen relationships.' },
        { title: 'The cost structure explains the margin', detail: 'Materials at 58% plus a high fixed plant cost mean margin moves with steel prices and utilisation (74%), which is why input-price pass-through matters.' },
      ],
      watchouts: [
        'Three steel mills are listed as the key partners — a concentration risk that the model does not yet address.',
        'No channel is described for export or EV start-ups, although both are in the segments block.',
        'Payment terms of 60–90 days sit inside the revenue block but are a cost to the model’s working capital.',
      ],
    },
    recommendations: [
      'Broaden the Customer Segments block with evidence: convert the two bid-stage OEMs into named segments with a channel and a relationship plan for each, so growth is a business-model change rather than a hope.',
      'Grow the smaller revenue streams: package tooling and engineering support as an offer (cost-down projects, prototype-to-volume service) with its own price.',
      'Add a second source in the Key Partnerships block for the main alloy grades, and reflect index-linked pricing in the Revenue Streams block.',
      'Describe a channel for the EV start-up segment before targeting it; the current direct-sales model may not reach them.',
    ],
    actionables: [
      { action: 'Write a one-page plan for each of the two bid-stage OEMs: contact map, approval steps, owner, date', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Price and package tooling and engineering support as a standalone offer', owner: 'Operations Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Qualify a second alloy-steel supplier for the two highest-volume grades', owner: 'Purchase Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Test one channel for EV start-ups (an incubator or a Tier-1 introduction) before expanding it', owner: 'Founder', timeframe: 'Within 6 months', priority: 'Low' },
    ],
  },

  vpc: {
    scenario: 'Anand Auto Components (Pune) — testing the fit between its offer and the purchasing teams at car makers.',
    values: {
      segment: 'Purchasing and supplier-quality teams at passenger-vehicle OEMs and Tier-1 assemblers for drivetrain and chassis parts.',
      jobs: '1. Source safety-critical machined parts that pass production-part approval first time (functional)\n2. Meet annual cost-down targets without quality escapes (functional)\n3. Keep production lines supplied without stoppages (functional)\n4. Be seen by management as using audited, ESG-ready suppliers (social)\n5. Avoid the stress of line-stoppage escalations (emotional)',
      pains: '1. Late or incomplete deliveries that stop the line\n2. Rework and rejection from inconsistent welding and finish\n3. Slow supplier response to engineering changes\n4. Suppliers that cannot meet traceability and carbon-reporting requests\n5. Price rises whenever steel moves',
      gains: '1. A supplier whose parts pass first time (a zero-defect target)\n2. Engineering input that cuts part cost (value engineering)\n3. One supplier for machined and welded parts (fewer vendors to manage)\n4. Dependable just-in-time dispatch from nearby',
      products: 'Precision-machined shafts, gears and housings; welded chassis brackets; fixture and tooling design; prototype-to-volume support.',
      pain_relievers: 'Certified (IATF 16949) process with in-line inspection and full traceability — answers pains 2 and 4. Delivery scorecard with a 95% on-time target — answers pain 1. A dedicated engineer for change requests — answers pain 3. Transparent, index-linked pricing — answers pain 5.',
      gain_creators: 'Annual value-engineering proposals (target 2–3% cost-down) — creates gain 2. One source for machined and welded parts — creates gain 3. Milk-run dispatch from within 90 km — creates gain 4. Early involvement in new-part design — supports gain 1.',
      pain_fit: '4',
      gain_fit: '4',
      evidence: 'Customer interviews',
      value_proposition: 'For OEM and Tier-1 sourcing teams who cannot afford line stoppages, Anand supplies certified, traceable machined and welded parts on a just-in-time schedule, with engineering support that lowers part cost — unlike regional job-shops that cannot guarantee quality or response time.',
    },
    tables: {},
    why: {
      segment: 'One specific buyer group, not “the auto industry”, so the jobs and pains are concrete.',
      pains: 'Listed most important first; pain 1 (late deliveries) is the one buyers escalate.',
      pain_relievers: 'Each reliever names the pain it answers, so gaps are visible.',
      evidence: 'Interviews with two anchor customers support the fit, but nothing has been tested with the bid-stage OEMs yet.',
    },
    analysis: {
      summary: 'The fit is strong on pains and gains that buyers already voice: delivery, quality, traceability and engineering input are all answered. The evidence is interviews with two existing customers, so the proposition is proven for them but not yet for the new OEMs Anand is bidding to.',
      verdict: {
        label: 'Strong fit (4.0 / 5), evidenced for two customers',
        rationale: 'Four of the five pains and three of the four gains have a named answer; the evidence is customer interviews rather than purchases by new segments.',
      },
      findings: [
        { title: 'Every top pain except one has a reliever', detail: 'Pains 1–5 are answered by named relievers; the weakest is pain 5 (steel-price rises), where index-linked pricing helps the buyer’s transparency but does not remove the rise.' },
        { title: 'The social job has only a partial answer', detail: '“Be seen using audited, ESG-ready suppliers” is answered by certification and traceability, but carbon reporting is a gap Anand cannot yet fill.' },
        { title: 'One gain creator supports rather than creates', detail: '“Early involvement in design” supports gain 1 (zero defects) but the link is indirect; a clearer mechanism would strengthen it.' },
        { title: 'The proposition sentence follows from the lists', detail: 'It names the job (no stoppages), the offer, the mechanism (engineering support) and the alternative (regional job-shops), consistent with the canvas.' },
      ],
      watchouts: [
        'Evidence is interviews with two existing customers; the proposition is untested with new OEMs.',
        'Carbon and ESG reporting is a real pain with no reliever yet.',
        'Ratings (4 and 4) are self-assessed.',
      ],
    },
    recommendations: [
      'Test the proposition with the two bid-stage OEMs: use the pains and gains list as the interview guide, and note which are different.',
      'Close the ESG reporting gap — it is a pain Anand cannot yet relieve and the one most likely to rise in importance.',
      'Make the engineering-involvement gain creator concrete: offer one design-review session per new part and measure first-time-right rates.',
      'Turn the proposition sentence into the opening of every bid response, with a proof point for each claim.',
    ],
    actionables: [
      { action: 'Run six structured interviews at the two bid-stage OEMs using the pains and gains lists', owner: 'Sales Head', timeframe: 'Next 60 days', priority: 'High' },
      { action: 'Draft a basic carbon and ESG disclosure pack for customers', owner: 'Quality Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Define the design-review offer and the first-time-right metric', owner: 'Operations Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Rewrite the bid template around the value proposition sentence with proof points', owner: 'Sales Head', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  leancanvas: {
    scenario: 'Anand Auto Components (Pune) — testing a new idea before building it: a tooling studio for EV start-ups.',
    values: {
      problem: '1. EV start-ups cannot get working prototype tooling and fixtures in weeks: tool rooms quote twelve to sixteen weeks.\n2. A start-up cannot afford two suppliers — one for prototypes and another for production — so every part is re-qualified.\n3. Founders fear a prototype supplier will not meet the quality system an OEM will later demand.',
      existing_alternatives: 'Regional tool rooms (slow and uneven in quality); Tier-1 suppliers (will not take small prototype runs); 3D-printing bureaux (fast but not production-grade); in-house tooling at the start-up (expensive and a distraction).',
      customer_segments: 'Seed- and Series-A-funded EV start-ups (two-wheelers, three-wheelers and components) in Pune, Bengaluru and Chennai; later, other precision-hardware start-ups such as drones and medical devices.',
      early_adopters: 'Five EV start-ups in the Pune–Chakan belt that already have a funded prototype programme, a launch date within twelve months and no tool room of their own.',
      uvp: 'Production-grade tooling and prototypes in three weeks, from a certified plant that can carry the part into production — one supplier from first prototype to OEM approval.',
      high_level_concept: 'A tooling studio for EV start-ups, with the quality system of an OEM supplier',
      solution: '1. A three-week prototype-tooling service on a standard fixture library.\n2. A design-for-manufacture review of every part before tooling starts.\n3. A bridge-to-production contract: tooling is paid back through the first production run.',
      unfair_advantage: 'An IATF 16949-certified production plant and a tooling-design team behind the tool room: start-ups can move to production approvals without changing supplier, and rivals cannot offer that without years of certification work.',
      channels: 'EV and hardware incubators and accelerators in Pune; OEM supplier-development programmes; referrals from the two anchor OEMs; founders’ communities and trade events.',
      key_metrics: 'Quote-to-order time; prototype tooling lead time (target three weeks); share of tooling jobs that convert into production orders within twelve months; revenue per start-up per year.',
      revenue_streams: 'Prototype tooling and fixture fees (₹4–8 lakh per programme); design-for-manufacture review fees; production-part margin from bridge-to-production contracts; engineering retainers.',
      cost_structure: 'Tool-room staff and machine hours; building the fixture library; certification and quality overhead shared with the plant; sales and incubator partnerships; sample material.',
      riskiest_assumption: 'That start-ups will pay a premium for three-week tooling and then give Anand the production order. Cheapest test: three paid pilot programmes with start-ups from two incubators within 90 days.',
      notes: '',
    },
    tables: {},
    why: {
      problem: 'Three specific problems in the customer’s words, each one something a founder could confirm or deny in an interview.',
      uvp: 'One sentence a start-up founder would repeat, with a number (three weeks) that can be tested.',
      unfair_advantage: 'The certified plant behind the tool room is something a start-up tool room cannot copy quickly.',
      riskiest_assumption: 'It names the one thing that decides the idea and the cheapest test of it, with a deadline.',
    },
    analysis: {
      summary: 'The idea has a sharp problem, a named group of early adopters and an unfair advantage rivals cannot quickly copy: a certified production plant behind a fast tool room. What it has not yet shown is that start-ups will pay a premium for speed and then buy production parts from Anand. The plan correctly identifies that as the riskiest assumption and proposes a cheap test.',
      verdict: {
        label: 'Worth testing — the risk is willingness to pay, not the idea',
        rationale: 'The problem, customer and advantage are specific; the unproven part is that speed earns a premium and leads to production orders.',
      },
      findings: [
        { title: 'The problem is concrete', detail: 'Twelve to sixteen weeks for tooling against a three-week need is a specific, checkable gap, and each of the three problems can be put to a founder.' },
        { title: 'The early adopters are reachable', detail: 'Five funded Pune-belt start-ups with launch dates inside twelve months can be contacted through two incubators within weeks.' },
        { title: 'The unfair advantage is real', detail: 'IATF 16949 certification takes 18–24 months; a start-up tool room or a 3D-printing bureau cannot offer a path to OEM approval without it.' },
        { title: 'The economics are plausible but untested', detail: 'Tooling fees of ₹4–8 lakh per programme are modest; the business case depends on conversion into production orders, which is exactly what the key metrics track.' },
      ],
      watchouts: [
        'No start-up has yet said it would pay more for three-week tooling; the claims about demand are the founders’ own.',
        'The idea may stretch the tool room and the plant at the moment the second welding line is being built.',
        'Production volumes of early-stage EV start-ups can be small and uncertain, so conversion may take longer than twelve months.',
      ],
    },
    recommendations: [
      'Run the cheapest test first: three paid pilot programmes with start-ups from two incubators within 90 days, with a written price for three-week tooling.',
      'Measure conversion, not interest: count how many pilots would place production orders, and what price and volume they would commit to.',
      'Protect the core business: ring-fence tool-room hours so pilots cannot delay OEM deliveries.',
      'If at least two of the three pilots convert, graduate the idea to a full Business Model Canvas and a minimum viable financial model.',
    ],
    actionables: [
      { action: 'Approach two EV incubators in Pune and book interviews with ten of their start-ups', owner: 'Sales Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Write the pilot offer: scope, three-week promise, fixed price and the bridge-to-production terms', owner: 'Engineering Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Reserve tool-room hours for pilots and agree a rule for protecting OEM work', owner: 'Operations Head', timeframe: 'Within 45 days', priority: 'Medium' },
      { action: 'Set up the four key-metric trackers (quote-to-order time, lead time, conversion, revenue per start-up)', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },
};
