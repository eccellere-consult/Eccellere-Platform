/**
 * samples/environment.ts — the worked examples for PESTEL / SWOT and Porter's Five Forces, told about the fictional
 * Anand Auto Components (Pune): a precision-machining MSME, ₹9,800 lakh revenue in FY 2024-25, 41% of it from one OEM,
 * 71 debtor days. Every figure ties to the other demos (Value Scan, CEO Cockpit). Fictional and illustrative.
 */
import type { ModelSample } from '../types';

export const ENVIRONMENT_SAMPLES: Record<string, ModelSample> = {
  pestel: {
    scenario: 'Anand Auto Components (Pune) — a precision-machining supplier scanning the outside world for the next three years.',
    values: {
      scope: 'Anand Auto Components Pvt Ltd, Pune — precision-machined shafts, gears and housings and welded brackets for passenger-vehicle OEMs and Tier-1 assemblers; planning horizon FY 2025-26 to FY 2027-28.',
      political: 'Government push for local manufacturing (production-linked incentives for auto components, “Make in India”) and support for the EV supply chain. GST rates and classifications change often. Free-trade talks could open export markets but also invite imports. Maharashtra offers capital subsidies to MSMEs.',
      economic: 'Auto demand is growing about 8–10% a year. Steel and alloy prices have swung ±12% in 18 months. Falling interest rates ease working-capital cost, but bank credit to MSMEs stays tight. A weaker rupee helps exports but raises imported tooling cost. OEMs are stretching payment terms to 60–90 days.',
      social: 'Skilled CNC operators and welders are scarce in the Pune–Chakan belt (about 18% attrition). Buyers increasingly expect traceability and ESG reporting from suppliers. A younger workforce expects training and a clean, safe plant. Urban demand is shifting to compact SUVs and electric two-wheelers.',
      technological: 'The shift to electric vehicles removes some engine and transmission parts but creates demand for motor housings, battery trays and lightweight brackets. Machine monitoring and ERP can cut rework and downtime. Competitors are adopting automated inspection.',
      environmental: 'OEMs will require carbon-footprint disclosure and renewable-energy use from Tier-2 suppliers by 2027. Power tariffs are rising. Waste (cutting fluids, scrap) and water-use rules are tightening.',
      legal: 'IATF 16949 and customer-specific certifications are the licence to supply. A GST arrears notice (₹42 lakh) and a qualified inventory verification need clearing. The MSME 45-day payment rule (Section 43B(h)) improves collections. Labour-code consolidation adds compliance work.',
      strengths: 'IATF 16949 certification and in-house CNC capability give faster OEM approvals and tighter tolerances than regional shops. Sixteen-year relationships with two anchor OEMs and a 91% repeat-order rate. An engineering team that can redesign parts for manufacturability.',
      weaknesses: '41% of revenue comes from one OEM. 71 debtor days and tight working capital. 4.8% rework driven by a welding hotspot on Line 2. An informal sales pipeline (22% win rate). Orders tracked on Excel and paper. GST arrears not yet cleared.',
      opportunities: 'Two new OEM contracts are at bid stage. EV component tooling (motor housings, battery trays) as existing customers re-source. Incentives and subsidies for a second line. Export access to South-East Asian OEMs. The MSME 45-day payment rule can shorten debtor days.',
      threats: 'Loss or de-sourcing by the customer that is 41% of revenue. Steel and alloy price swings. Larger Tier-1s moving into mid-volume parts. Skilled-labour attrition. ESG and carbon-reporting demands Anand cannot yet meet.',
      so_what: 'Use the certification and CNC strengths to win the two OEM bids and the EV tooling work (strengths → opportunities), while fixing the cash cycle and the Line 2 rework that would otherwise cap growth (weaknesses → opportunities). Cut concentration risk by landing at least one new OEM before the anchor customer renegotiates (strengths and weaknesses → threats).',
    },
    tables: {
      pestel_rating: [
        { factor: 'Political', effect: 'Opportunity', strength: '3', horizon: 'Within 1–3 years' },
        { factor: 'Economic', effect: 'Threat', strength: '5', horizon: 'Now' },
        { factor: 'Social', effect: 'Threat', strength: '3', horizon: 'Within 1–3 years' },
        { factor: 'Technological', effect: 'Mixed', strength: '4', horizon: 'Within 1–3 years' },
        { factor: 'Environmental', effect: 'Threat', strength: '3', horizon: 'Within 1–3 years' },
        { factor: 'Legal', effect: 'Mixed', strength: '4', horizon: 'Now' },
      ],
    },
    why: {
      scope: 'A scope with a horizon stops the scan drifting into generic trends.',
      economic: 'Input-price swings and stretched payment terms hit cash first, so economic factors are rated the most decisive.',
      pestel_rating: 'Technology is “mixed” because the EV shift removes some parts and creates others — the rating forces that to be looked at line by line.',
      weaknesses: 'Each weakness is evidenced from the Value Scan (debtor days, concentration, rework) rather than opinion.',
      threats: 'Two of the four threats trace straight back to rated PESTEL factors (economic, social).',
      so_what: 'Pairing the four lists turns them into three moves, which is what makes a SWOT useful.',
    },
    analysis: {
      summary: 'Anand is a technically strong, well-certified Tier-2 supplier in a growing but price-volatile market. The most decisive outside forces are economic (input prices and stretched payment terms) and technological (the shift to electric vehicles). They meet two internal weaknesses — dependence on one customer and a strained cash cycle — that limit how fast Anand can use its strengths.',
      verdict: {
        label: 'Growth posture — but fix the cash cycle first',
        rationale: 'Strengths and opportunities clearly outweigh threats, yet the two biggest weaknesses (41% single-customer dependence, 71 debtor days) sit exactly where the biggest threats land.',
      },
      findings: [
        { title: 'The EV shift cuts both ways', detail: 'It is rated “mixed” and strong (4/5): some machined parts disappear while motor housings and battery trays appear. Which of Anand’s product lines are exposed has not yet been mapped.' },
        { title: 'Economic factors act through cash', detail: 'Steel swings of ±12% and 60–90 day payment terms are the highest-rated factor (5/5), and they land on a business with 71 debtor days and tight working capital.' },
        { title: 'Weaknesses and threats overlap', detail: 'Customer concentration appears as a weakness and as a threat; the same is true of cash strain and input prices. Fixing these two things reduces several risks at once.' },
        { title: 'Certification is a durable edge', detail: 'IATF 16949 plus in-house CNC is the reason two new OEMs are bidding with Anand — it is the strength that links most directly to an opportunity.' },
      ],
      watchouts: [
        'Technology is rated “mixed” without a line-by-line exposure review — confirm which parts are at risk before committing capital.',
        'Incentive and subsidy eligibility is assumed, not checked.',
        'Customer ESG requirements are described generally; the actual supplier codes of the two anchor OEMs have not been read.',
      ],
    },
    recommendations: [
      'Make landing the two bid-stage OEM contracts the first strategic priority and EV tooling the second. Both turn strengths (certification, CNC) into the opportunities the scan identifies, and both reduce the 41% dependence.',
      'Fix the cash cycle before adding a second line: bring debtor days from 71 towards 55 using the MSME 45-day payment rule as leverage, and agree index-linked steel pricing with the top customers so input shocks stop reaching cash.',
      'Clear the compliance gaps (GST arrears, the inventory-verification qualification) now. They are cheap to fix and are the first thing an ESG-minded OEM auditor will find.',
      'Commission a short EV-exposure review of the parts catalogue so capital goes to lines that survive the shift.',
    ],
    actionables: [
      { action: 'Prepare and submit the two OEM bids with a quality-and-delivery proof pack drawn from the latest IATF audit', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Negotiate index-linked steel and alloy pricing clauses with the top three customers', owner: 'Finance Head', timeframe: 'This quarter', priority: 'High' },
      { action: 'Settle the GST arrears and close the two inventory-verification findings', owner: 'Finance Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Map every product line to EV / non-EV exposure and present it to the board', owner: 'Operations Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Collect the supplier ESG and carbon requirements of the two anchor OEMs and gap-check them', owner: 'Quality Head', timeframe: 'Within 90 days', priority: 'Medium' },
    ],
  },

  porter5: {
    scenario: 'Anand Auto Components (Pune) — judging how attractive its segment of the Indian auto-components industry really is.',
    values: {
      industry: 'Precision-machined shafts, gears, housings and welded brackets supplied to Indian passenger-vehicle OEMs and Tier-1 assemblers (Pune–Chakan belt).',
      implication: 'The industry is unattractive on average (3.8 / 5): profit is squeezed hardest by buyer power and rivalry. Anand can earn above-average returns only by moving up the approval ladder — certified, engineering-led parts that are hard to replace — and by reducing dependence on any single buyer. Supplier power argues for index-linked pricing and a second alloy source.',
      notes: '',
    },
    tables: {
      forces: [
        { force: 'Threat of new entrants', drivers: 'Capital-heavy: a CNC line costs ₹3–5 crore, and IATF 16949 certification takes 18–24 months, which blocks casual entrants. But OEMs readily approve a second source, and regional job-shops with spare capacity can move up. Brand matters little; approval history matters a lot.', intensity: '3' },
        { force: 'Bargaining power of suppliers', drivers: 'Three alloy-steel mills supply about 80% of inputs; prices follow the mill’s index and are not negotiable; lead times are 4–6 weeks. There is no credible forward integration, but there are few switching options for specific grades.', intensity: '4' },
        { force: 'Bargaining power of buyers', drivers: 'Few, large OEM buyers: the top customer is 41% of revenue. Annual price-down demands of 2–3%. Payment stretched to 60–90 days. Switching costs are moderate once a part is approved, but re-approval is slow — which protects incumbents.', intensity: '5' },
        { force: 'Threat of substitutes', drivers: 'Substitution is by technology, not by product: electric drivetrains remove some engine and transmission parts; castings and forgings can replace machined parts in some designs; lightweight materials change geometry. Slow-moving for the next three to five years.', intensity: '3' },
        { force: 'Competitive rivalry', drivers: 'Many regional machining shops compete on price for standard parts, and two or three larger Tier-1s compete on scale and capability. Industry growth of 8–10% eases rivalry, but high fixed costs and excess regional capacity keep price pressure on commodity parts.', intensity: '4' },
      ],
    },
    why: {
      industry: 'Defining the segment narrowly (precision parts for OEMs, not “auto components”) is what makes the forces concrete.',
      forces: 'Each rating is anchored to a fact in the drivers column; buyer power is rated 5 because one customer is 41% of revenue.',
      implication: 'The conclusion names a position to move to, not just a verdict.',
    },
    analysis: {
      summary: 'Profit in this segment is squeezed mainly from the customer side: a few large OEM buyers set prices and payment terms, and rivalry on standard parts is intense. Entry barriers (capital, certification) and slow substitution give some protection, but not enough to offset buyer power.',
      verdict: {
        label: 'Unattractive industry (3.8 / 5)',
        rationale: 'Average force intensity is 3.8, and the two strongest forces — buyers (5) and rivalry (4) — act directly on price and volume.',
      },
      findings: [
        { title: 'Buyer power dominates', detail: 'With one OEM at 41% of revenue and annual price-downs of 2–3%, the buyer side can reset Anand’s margin at will. This is the force to change first.' },
        { title: 'Certification protects, but only up to a point', detail: 'IATF 16949 and slow re-approval keep new entrants at bay (3/5), but OEMs readily add a second source, so the protection does not extend to price.' },
        { title: 'Supplier power is a cost-pass-through problem', detail: 'Three mills supply 80% of inputs at index prices. The risk is not availability but margin timing when steel moves.' },
        { title: 'Rivalry depends on the kind of part', detail: 'Pressure is high on standard machined parts and much lower on engineering-led, certified parts — which is where Anand should position.' },
      ],
      watchouts: [
        'Ratings are Anand’s own judgement; none has been checked against competitor data or customer interviews.',
        'The segment is defined narrowly; the picture is worse if it is widened to general machining.',
        'Substitution risk is rated moderate on the assumption that EV adoption stays gradual.',
      ],
    },
    recommendations: [
      'Compete where the forces are weakest: engineering-led, certified parts where re-approval protects the supplier, rather than commodity machining where rivalry and buyer power are highest.',
      'Reduce buyer power by widening the customer base — set a target of at least three OEM accounts above 15% of revenue each within 24 months — rather than relying on the current anchor customer.',
      'Neutralise supplier power: qualify a second source for the main alloy grades and agree index-linked price pass-through with customers so steel movements stop hitting margin.',
      'Use the MSME 45-day payment rule as a lever with the largest buyers to shorten the 71-day debtor cycle.',
    ],
    actionables: [
      { action: 'Segment the product list into “commodity” and “engineering-led” parts and report margin by group', owner: 'Finance Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Open approval trials with two new OEM buyers to start reducing the 41% concentration', owner: 'Sales Head', timeframe: 'This quarter', priority: 'High' },
      { action: 'Qualify a second alloy-steel source for the two highest-volume grades', owner: 'Purchase Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Add index-linked pricing clauses to the next contract renewals', owner: 'Sales Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  portergeneric: {
    scenario: 'Anand Auto Components (Pune) — choosing how to compete once the industry structure is known.',
    values: {
      industry_structure: 'Unattractive (3.8 / 5). Strongest force: Bargaining power of buyers (5/5). Weakest: Threat of new entrants and Threat of substitutes (3/5).',
      rival_response: 'The larger regional Tier-1 would match a price cut within weeks — it has the scale to absorb it. It would be far slower to match approvals and engineering support, which take 18–24 months to build. The game-theory grid says a price war leaves both sides worse off, so the choice should not depend on price.',
      chosen: 'Differentiation focus',
      rationale: 'Anand cannot out-scale the larger Tier-1s on cost (74% capacity utilisation, steel bought at index prices), and a broad differentiation play would put it up against OEM-owned engineering. A narrow focus — certified, engineering-led precision parts for OEM programmes in the Pune–Chakan belt — uses what it already has (IATF 16949 certification, in-house CNC, a design team) and sits where buyer power and rivalry are weakest, because re-approval is slow and protects the incumbent supplier.',
      trade_offs: 'No commodity machining without a margin floor (contribution of at least 18%). No customers who will buy only on price. No new product families outside precision-machined and welded assemblies for road vehicles until the second line is running above 70% utilisation.',
      notes: '',
    },
    tables: {
      strategies: [
        { strategy: 'Cost leadership', how: 'Out-scale regional shops on standard parts: higher volumes, better material yield, rework cut from 4.8% to 2%. Anand’s scale and input costs are not the lowest in the region, and the biggest customer would keep demanding price-downs.', capability: '2', industry: '2', risk: '4' },
        { strategy: 'Differentiation', how: 'Be the preferred broad-line supplier on quality, delivery and design support across every part family. It needs investment in brand and engineering at a scale Anand does not have.', capability: '3', industry: '4', risk: '3' },
        { strategy: 'Cost focus', how: 'Be the lowest-cost supplier for one family (shafts) in one region. A narrower base, but still exposed to the price-down demands of the big buyers.', capability: '3', industry: '3', risk: '3' },
        { strategy: 'Differentiation focus', how: 'Certified, engineering-led parts for OEM programmes (tight tolerances, full traceability, redesign for manufacturability), sold on approval history and engineering support rather than price. Re-approval is slow, which protects the supplier.', capability: '5', industry: '4', risk: '2' },
      ],
    },
    why: {
      industry_structure: 'The choice starts from what the five forces say: buyer power is the force to defend against.',
      strategies: 'Scoring all four squares makes the trade-off visible; the winner also carries the lowest risk.',
      chosen: 'The choice matches the highest score (13 / 15) and the reasons are written down.',
      trade_offs: 'Naming what Anand will not do is what stops a focus strategy from drifting into the middle.',
    },
    analysis: {
      summary: 'Differentiation focus is the strongest fit. It uses Anand’s certification and engineering strengths, avoids a cost race against larger Tier-1s that Anand cannot win, and sits where buyer power — the strongest force — is weakest, because re-approval is slow and protects the incumbent supplier. The main risk is staying too narrow while one customer still holds 41% of revenue.',
      verdict: {
        label: 'Differentiation focus (13 / 15)',
        rationale: 'It scores highest on capability fit (5) and industry fit (4) and carries the lowest risk (2); cost leadership scores only 6 because Anand lacks the scale and would face the strongest force head-on.',
      },
      findings: [
        { title: 'Cost leadership is the wrong race', detail: 'Utilisation is 74% and steel is bought at index prices; a larger Tier-1 can match any price cut within weeks. A cost strategy would also hand more power to the customer that already buys 41% of revenue.' },
        { title: 'The chosen position defends against the strongest force', detail: 'Buyer power is the strongest of the five forces (5/5). Slow re-approval and an approval history that rivals lack make Anand harder to replace on certified parts.' },
        { title: 'Rivals can copy a price move but not an approval record', detail: 'Matching a price cut takes weeks; matching IATF-grade quality systems and OEM approvals takes 18–24 months — the basis of a durable position.' },
        { title: 'The trade-offs are explicit', detail: 'Declining commodity work without a margin floor is exactly what keeps the business out of the middle.' },
      ],
      watchouts: [
        'The scores are Anand’s own judgement and have not been tested with customers.',
        'A focus strategy depends on a few programmes: losing the anchor OEM (41%) would hit the focus segment hard.',
        'The 18% contribution floor for commodity work is a proposal and has not been costed.',
      ],
    },
    recommendations: [
      'Commit to differentiation focus and write it into the annual plan: one line of positioning (“certified, engineering-led precision parts for OEM programmes”) and the qualification criteria for new customers.',
      'Reprice or exit commodity lines that earn less than an 18% contribution margin, and stop quoting against pure-price tenders.',
      'Invest where the position is built: design-for-manufacture reviews, first-article inspection and the quality-and-delivery proof pack used in OEM approvals.',
      'Reduce concentration inside the focus: win at least two more OEM programmes in the same segment so that no customer is above 30% of revenue.',
    ],
    actionables: [
      { action: 'Write the one-page positioning and the “not for us” list (what Anand will not quote) and agree it at the board', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Compute contribution margin by part family and mark every line below 18% for repricing or exit', owner: 'Finance Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Build the quality-and-delivery proof pack from the latest IATF audit for the two bid-stage OEMs', owner: 'Quality Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Make a design-for-manufacture review a standard step on every new OEM enquiry', owner: 'Engineering Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  valuechain: {
    scenario: 'Anand Auto Components (Pune) — tracing where its margin is made and lost, activity by activity.',
    values: {
      scope: 'Anand Auto Components — precision-machined shafts, gears and housings and welded brackets for passenger-vehicle OEMs and Tier-1 assemblers; FY 2024-25 cost structure.',
      linkages: 'Tooling and fixture design (technology development) decides first-pass yield in operations and rework on the welding line, which in turn drives delivery delays (outbound logistics) and complaint visits (service). Procurement’s steel pricing terms decide the margin operations can protect. The OEM approval process (sales) depends on the quality records produced in operations.',
      margin_driver: 'Operations. Rework of 4.8% (the Line 2 welding hotspot) and machine downtime hold margin back more than anything else; procurement is second because material is 58% of revenue at index prices.',
      opportunities: 'Fix the Line 2 welding hotspot (rework from 4.8% to 2% is worth about ₹130 lakh a year); agree index-linked pass-through clauses with the top customers; hand heat treatment to a qualified partner instead of expanding it in-house; improve on-time delivery with a simple order-tracking and dispatch plan.',
      notes: '',
    },
    tables: {
      activities: [
        { activity: 'Inbound logistics', what: 'Steel and alloy bar inward inspection, two stores, first-in-first-out bins; inbound freight from three mills with 4–6 week lead times.', cost_share: '5', edge: 'On par', role: 'Neither (necessary only)' },
        { activity: 'Operations', what: 'Eleven CNC machines and two welding lines; machining, welding, heat-treatment finishing; 74% utilisation; 4.8% rework, concentrated on Line 2.', cost_share: '66', edge: 'On par', role: 'Both' },
        { activity: 'Outbound logistics', what: 'Milk-run deliveries to the Chakan OEM plants; weekly dispatch plans; 88% on-time delivery against a 95% target.', cost_share: '4', edge: 'Behind rivals', role: 'Raises value to customers' },
        { activity: 'Marketing and sales', what: 'Key-account sales by the managing director and two sales engineers; OEM supplier portals and RFQ responses; 22% win rate.', cost_share: '4', edge: 'On par', role: 'Raises value to customers' },
        { activity: 'Service', what: 'Complaint handling and 8D reports; rework and return handling; on-site support for new-part launches.', cost_share: '2', edge: 'Ahead of rivals', role: 'Raises value to customers' },
        { activity: 'Firm infrastructure', what: 'IATF 16949 quality system, finance and compliance, management; no ERP yet — orders tracked on Excel and paper.', cost_share: '8', edge: 'Ahead of rivals', role: 'Raises value to customers' },
        { activity: 'Human resource management', what: 'Recruitment and training of CNC operators and welders; 18% attrition; apprenticeship tie-up with a local ITI.', cost_share: '3', edge: 'Behind rivals', role: 'Neither (necessary only)' },
        { activity: 'Technology development', what: 'Tooling and fixture design and process engineering; an in-house design team redesigns parts for manufacturability.', cost_share: '4', edge: 'Ahead of rivals', role: 'Both' },
        { activity: 'Procurement', what: 'Three alloy-steel mills on index pricing; job-work vendors for plating and heat treatment; no qualified second source for the main grades.', cost_share: '4', edge: 'Behind rivals', role: 'Cuts cost' },
      ],
    },
    why: {
      scope: 'One product family per chain keeps the cost shares meaningful.',
      activities: 'The nine shares add up to 100%, and each “ahead of rivals” is tied to something specific (certification, tooling design, responsiveness).',
      margin_driver: 'Operations carries two-thirds of cost, so a small rework fix moves margin more than any other activity.',
    },
    analysis: {
      summary: 'Anand’s margin is made — and lost — in operations: two-thirds of the cost sits there, and 4.8% rework and 74% utilisation hold it back. Its real advantages are around the plant — engineering (tooling design), certification and responsiveness after sale — but they are not yet turned into price or volume. Outbound delivery, people and procurement are weaker than rivals and leak margin.',
      verdict: {
        label: 'Advantage in engineering and certification; margin leaks in operations',
        rationale: 'Three activities are ahead of rivals (service, infrastructure and certification, technology), but operations — 66% of cost — is only on par and carries the 4.8% rework.',
      },
      findings: [
        { title: 'Operations decides margin', detail: 'At 66% of total cost, cutting rework by about two points is worth roughly ₹130 lakh a year, more than any other single lever.' },
        { title: 'The advantages are real but not monetised', detail: 'Engineering support and certification make Anand easier to approve, yet quoting treats parts as commodities, so none of it reaches price.' },
        { title: 'Delivery and procurement are quiet weaknesses', detail: '88% on-time delivery and a single-source pricing position on the main alloy grades cost margin and credibility with OEM buyers.' },
        { title: 'Linkages matter more than any single activity', detail: 'Better tooling design lowers rework and delay; fixing the welding hotspot also lifts on-time delivery and cuts complaint visits.' },
      ],
      watchouts: [
        'Cost shares are management estimates, not an activity-based costing; the operations share may be overstated because materials are attributed to it.',
        '“Ahead of rivals” is Anand’s own view; it has not been checked against OEM supplier scorecards.',
        'The ₹130 lakh saving assumes the 2% rework target is reached on both lines.',
      ],
    },
    recommendations: [
      'Treat operations as the first margin project: fix the Line 2 welding hotspot, track rework and first-pass yield weekly, and aim for 2% rework within two quarters.',
      'Turn engineering and certification into price and share by packaging design-for-manufacture and the proof pack into the quotation for engineering-led parts.',
      'Close the delivery gap with an order-tracking and dispatch plan that lifts on-time delivery from 88% to 95%, because it feeds straight into OEM scorecards.',
      'Qualify a second source on the two main alloy grades and agree index-linked pass-through in customer contracts to take procurement off the weakness list.',
    ],
    actionables: [
      { action: 'Run a two-week root-cause study on the Line 2 welding hotspot and agree a fix and a rework target', owner: 'Operations Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Start weekly tracking of rework, first-pass yield and on-time delivery on a single page', owner: 'Quality Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Add the design-for-manufacture review and the proof pack to the standard quotation for OEM programmes', owner: 'Sales Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Qualify a second source on the two highest-volume alloy grades', owner: 'Purchase Head', timeframe: 'Within 90 days', priority: 'Medium' },
    ],
  },

  scenario: {
    scenario: 'Anand Auto Components (Pune) — testing a capacity decision against four possible futures.',
    values: {
      focal_question: 'Should Anand add a second machining line and EV tooling capacity over the next five years — and how much, how fast?',
      time_horizon: 'Next 5 years',
      driving_forces: 'Speed of EV adoption (which parts disappear and which appear); steel and alloy price volatility; OEM sourcing policy (fewer large Tier-1s or a wider supplier base); availability of skilled CNC operators; MSME credit conditions and the 45-day payment rule; incentives for local manufacturing.',
      predetermined: 'Annual OEM price-downs of 2–3% continue. Carbon-footprint disclosure becomes a condition of supply by 2027. GST compliance gets stricter. Passenger-vehicle volumes keep growing at 8–10% over the next three years.',
      axis_x: 'Speed of EV adoption',
      axis_x_ends: 'Gradual (ten years) — fast (three to four years)',
      axis_y: 'OEM sourcing behaviour',
      axis_y_ends: 'Consolidating to a few large Tier-1s — widening the supplier base to MSMEs',
      robust_moves: 'Qualify a second alloy source and agree index-linked pricing; bring debtor days from 71 to about 55; fix the Line 2 rework; win at least two new OEM programmes so that no customer is above 30% of revenue. All four pay off in every scenario.',
      options_to_hold: 'EV tooling capacity: keep it at pilot scale until a second OEM confirms EV volumes. Second machining line: place the order only when utilisation passes 80% or two new contracts are signed; floor space and power can be prepared cheaply now. Export development: keep as a low-cost option while the supplier base widens.',
      notes: '',
    },
    tables: {
      uncertainties: [
        { driver: 'Speed of EV adoption', impact: '5', uncertainty: '5' },
        { driver: 'OEM sourcing behaviour (a few large Tier-1s or a wider supplier base)', impact: '5', uncertainty: '4' },
        { driver: 'Steel and alloy price level', impact: '4', uncertainty: '3' },
        { driver: 'Availability of skilled operators', impact: '3', uncertainty: '3' },
        { driver: 'Credit conditions for MSMEs', impact: '3', uncertainty: '4' },
      ],
      scenarios: [
        { quadrant: 'Top right', name: 'Open road', story: 'EV platforms launch quickly and OEMs need many new suppliers for motor housings and battery trays. Capacity-constrained OEMs approve MSMEs fast; certified suppliers with tooling skills win programmes within a year. Prices hold up because demand outruns supply for the first few years.', plausibility: 'Plausible', effect: 'Good for us', response: 'Add the second line and EV tooling early; push the two OEM bids; hire and train operators ahead of orders.' },
        { quadrant: 'Top left', name: 'Steady widening', story: 'EV volumes grow slowly while OEMs spread risk across more suppliers for combustion parts too. Conventional parts hold their volume for a decade and Anand wins share on quality and delivery.', plausibility: 'Highly plausible', effect: 'Good for us', response: 'Grow the core lines, invest in quality and delivery to win share, and add the second line only as contracts are signed.' },
        { quadrant: 'Bottom right', name: 'Squeeze', story: 'EV platforms launch fast, but OEMs concentrate on a few global Tier-1s who bring their own supply chains. Combustion-engine part volumes fall while MSMEs are shut out of EV programmes; the remaining buyers push price-downs hard.', plausibility: 'Less plausible', effect: 'Bad for us', response: 'Cut cost, protect cash, move into sub-assemblies for the Tier-1s and into non-auto precision parts; do not add capacity.' },
        { quadrant: 'Bottom left', name: 'Slow lane', story: 'Combustion parts stay dominant, but OEMs concentrate on fewer, larger suppliers. Anand is squeezed on price and must earn preferred-supplier status or lose volume.', plausibility: 'Plausible', effect: 'Mixed', response: 'Earn preferred-supplier status with the two anchor OEMs, reduce cost through rework and yield, and keep EV as an option.' },
      ],
      signposts: [
        { signal: 'A second OEM announces a dedicated EV platform with local-content targets', points_to: 'Top right', trigger: 'Release the EV tooling budget and place the second-line order' },
        { signal: 'RFQs for combustion parts open to new suppliers', points_to: 'Top left', trigger: 'Raise quoting capacity and bid for share' },
        { signal: 'Global Tier-1s win the EV platform sourcing at the OEMs Anand serves', points_to: 'Bottom right', trigger: 'Freeze capacity and pursue sub-assembly deals with the Tier-1s' },
        { signal: 'An anchor OEM cuts its approved-supplier list', points_to: 'Bottom left', trigger: 'Switch to the preferred-supplier plan and the cost programme' },
      ],
    },
    why: {
      focal_question: 'A scenario set answers one decision; this one is about how much capacity to add and when.',
      uncertainties: 'Only the two uncertainties rated high on both impact and unpredictability become the axes.',
      scenarios: 'Four stories, not a best / base / worst case: each is a plausible, different world with its own response.',
      robust_moves: 'These moves are the ones that pay off in all four futures, so they do not wait for the future to be known.',
    },
    analysis: {
      summary: 'The two uncertainties that matter most — how fast electric vehicles arrive and whether OEMs widen or narrow their supplier base — are outside Anand’s control and point to very different capacity needs. The plan should therefore be a set of no-regret moves that pay off in every future, plus capacity bought in stages against clear signposts.',
      verdict: {
        label: 'Do the no-regret moves now; stage the new capacity',
        rationale: 'Only one of the four futures (Squeeze) is clearly bad, but the second line would be stranded in it; the cash-cycle, rework and customer-mix fixes pay off in all four.',
      },
      findings: [
        { title: 'The two axes are the right ones', detail: 'EV speed and OEM sourcing behaviour both rate 5 on impact and 4–5 on uncertainty, and they are independent of each other: one is about technology, the other about buyer behaviour.' },
        { title: 'Four moves win in every future', detail: 'A second alloy source, a shorter cash cycle, the rework fix and a broader customer base are valuable whichever scenario arrives.' },
        { title: 'Capacity is the bet that differs', detail: 'The second line pays off in “Open road” and “Steady widening”, is neutral in “Slow lane” and would be a burden in “Squeeze”.' },
        { title: 'The signposts can be observed', detail: 'Each is an OEM announcement or an RFQ pattern Anand can see within months, so the staged decisions have real triggers.' },
      ],
      watchouts: [
        'Plausibility ratings are judgement; no outside data on OEM sourcing plans was used.',
        'The scenarios do not cover a sharp credit squeeze or the failure of a major supplier.',
        'The signposts have no owner or review date yet.',
      ],
    },
    recommendations: [
      'Stage the second line: prepare floor space, power and funding now, and place the order only when utilisation passes 80% or two new contracts are signed.',
      'Do the four no-regret moves in the next two quarters whichever scenario unfolds: second alloy source, debtor days towards 55, the Line 2 rework fix and two new OEM programmes.',
      'Keep EV tooling at pilot scale and release the budget on the first confirmed EV volume from a second OEM.',
      'Review the signposts every quarter at the board and record which scenario they point to.',
    ],
    actionables: [
      { action: 'Prepare line-ready floor space, power and a funding plan for the second line without ordering the machine', owner: 'Operations Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Agree the four no-regret moves with owners and dates in the board plan', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Assign an owner and a quarterly review date to each of the four signposts', owner: 'Strategy Lead', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Define the trigger (utilisation above 80% or two signed contracts) that releases the second-line order', owner: 'Finance Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  gametheory: {
    scenario: 'Anand Auto Components (Pune) — weighing a price cut against how its main rival would respond.',
    values: {
      situation: 'Anand is considering a 5% price cut on standard shafts and housings to win a second OEM’s volume. Its larger regional Tier-1 rival supplies the same OEMs and sees prices through the RFQ process, so it will notice within weeks and may respond.',
      rival: 'The larger regional Tier-1 supplier',
      option_a: 'Hold prices',
      option_b: 'Cut prices 5%',
      response_1: 'Hold prices',
      response_2: 'Match the cut',
      likely_outcome: 'The rival’s best reply to a cut is to match it, and its best reply to Anand holding is also to cut and take the volume. Anand’s best option against a rival that cuts is to cut too. The game settles at both sides cutting, where each earns less than if both had held — a price war that helps only the buyers.',
      decision: 'Do not cut price. Compete on approvals, engineering support and delivery reliability, which the rival cannot copy in weeks; make that visible to the OEMs through the proof pack; and keep price discipline on standard parts with a margin floor.',
      notes: 'Payoffs are annual profit from the standard-parts business in ₹ lakh, estimated from FY 2024-25 margins; to be refined with the finance team.',
    },
    tables: {
      payoffs: [
        { outcome: 'Option A → Response 1', your_payoff: '120', rival_payoff: '150' },
        { outcome: 'Option A → Response 2', your_payoff: '60', rival_payoff: '190' },
        { outcome: 'Option B → Response 1', your_payoff: '170', rival_payoff: '90' },
        { outcome: 'Option B → Response 2', your_payoff: '80', rival_payoff: '100' },
      ],
    },
    why: {
      situation: 'It names one move and one rival who can actually retaliate; the tool is for a few identifiable players, not an anonymous crowd.',
      payoffs: 'Both sides’ payoffs are in the same unit (annual profit), so each side’s best reply can be read straight off the grid.',
      decision: 'The decision acts on the finding: escape the dilemma by changing the basis of competition, not by moving first.',
    },
    analysis: {
      summary: 'Read off the grid, the rival’s best reply to either of Anand’s options is to cut, and Anand’s best option against a rival that cuts is to cut as well. The game therefore settles at both sides cutting, where Anand earns ₹80 lakh and the rival ₹100 lakh — less for both than if each had held (₹120 lakh and ₹150 lakh). It is a prisoner’s dilemma, and a unilateral price cut is the first step into it.',
      verdict: {
        label: 'Do not cut price — it is a prisoner’s dilemma',
        rationale: 'The only stable outcome has both sides cutting and both earning less than at “hold / hold”; because the rival can match within weeks, a cut cannot buy lasting share.',
      },
      findings: [
        { title: 'The rival always prefers to cut', detail: 'Against Anand holding, the rival earns 190 by cutting against 150 by holding; against Anand cutting, 100 against 90. Cutting is its best reply either way.' },
        { title: 'Anand is pulled into cutting too', detail: 'Against a rival that cuts, Anand earns 80 by cutting and only 60 by holding, so once the rival moves Anand follows.' },
        { title: 'Both are worse off at the equilibrium', detail: 'At “cut / match” Anand earns 80 and the rival 100, against 120 and 150 if both had held. Nobody can reach the better outcome alone.' },
        { title: 'The way out is a different game', detail: 'Approvals, engineering support and delivery reliability take 18–24 months to copy; a price cut takes weeks. Competing there avoids the dilemma.' },
      ],
      watchouts: [
        'Payoffs are estimates from last year’s margins and are the weakest part of the analysis; the conclusion holds only while the rival gains more from cutting than from holding.',
        'The model treats the game as one round; repeated play (reputation, signalling) could support a different outcome.',
        'Only one rival is modelled; a second rival would make price discipline harder.',
      ],
    },
    recommendations: [
      'Hold price on standard parts and set a margin floor below which Anand does not quote, so that a rival price move does not pull Anand along.',
      'Compete on what a rival cannot copy quickly: show the approval history, the quality record and the engineering support to the two OEMs in a one-page proof pack.',
      'Use the rival’s likely reaction as an input to strategy: favour moves (certified, engineering-led parts) that the rival can only answer slowly.',
      'Re-run the grid with better payoffs from the finance team before any pricing move above 2%.',
    ],
    actionables: [
      { action: 'Set a margin floor for standard parts and brief the sales team that quotes below it need board approval', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Build the one-page proof pack (approvals, quality and delivery record, engineering support) for the second OEM', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Refine the four payoffs with actual margins by part family and the rival’s likely cost position', owner: 'Finance Head', timeframe: 'Within 45 days', priority: 'Medium' },
    ],
  },
};
