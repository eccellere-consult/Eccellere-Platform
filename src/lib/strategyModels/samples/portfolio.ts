/**
 * samples/portfolio.ts — the worked examples for the Ansoff Matrix and the BCG growth-share matrix, told about the
 * fictional Anand Auto Components (Pune). Product-line revenues add up to the ₹9,800 lakh of the other demos.
 */
import type { ModelSample } from '../types';

export const PORTFOLIO_SAMPLES: Record<string, ModelSample> = {
  ansoff: {
    scenario: 'Anand Auto Components (Pune) — choosing where growth comes from over the next 12 to 36 months.',
    values: {
      products: 'Precision-machined shafts, gears and housings; welded chassis brackets; tooling and fixture design services.',
      markets: 'Indian passenger-vehicle OEMs and Tier-1 assemblers in the Pune–Chakan belt. Two anchor OEMs account for about 60% of revenue (one alone is 41%). Exports are negligible.',
      chosen: 'Market development',
      rationale: 'Market penetration scores highest (13 / 15) but would deepen the 41% dependence on one customer. Market development scores second (11 / 15), serves the 12-month goal of qualifying for two new OEM contracts, and spreads the customer base. Product development (EV housings) follows once those approvals are in hand. We would revisit if either OEM bid is lost.',
    },
    tables: {
      strategies: [
        { strategy: 'Market penetration', options: 'Win more part numbers at the two anchor OEMs; earn second-source status on parts currently single-sourced elsewhere; lift on-time delivery to 98% to become a preferred supplier.', potential: '3', fit: '5', risk: '1' },
        { strategy: 'Market development', options: 'Qualify with two new OEMs in the Chakan–Aurangabad belt (bids in progress); approach two Tier-1s that supply electric two-wheeler makers; test export to South-East Asian OEMs through a trading partner.', potential: '4', fit: '4', risk: '3' },
        { strategy: 'Product development', options: 'EV motor housings and battery-tray brackets; lightweight aluminium machining; contract tooling and fixture services for existing customers.', potential: '4', fit: '3', risk: '3' },
        { strategy: 'Diversification', options: 'Precision parts for rail, agricultural-equipment and defence supply chains; contract manufacturing for EV start-ups.', potential: '4', fit: '2', risk: '5' },
      ],
    },
    why: {
      products: 'Starting from what is actually sold keeps “new product” honest.',
      strategies: 'Scoring all four makes the trade-off visible: the highest score is not automatically the choice.',
      chosen: 'The choice differs from the top score on purpose, because penetration would raise customer concentration.',
      rationale: 'Naming what would change the decision makes the choice testable.',
    },
    analysis: {
      summary: 'The scores favour deepening existing accounts, but doing so would raise Anand’s biggest risk — 41% of revenue from one customer. Market development fits the 12-month goal, uses existing products and certifications, and spreads the customer base, so choosing it over the top-scoring option is reasoned rather than arbitrary. Product development (EV parts) is the natural second step; diversification is not yet justified.',
      verdict: {
        label: 'Market development now, product development next',
        rationale: 'It gives up two points of score for a material cut in customer-concentration risk, and builds the approvals that EV product development will need.',
      },
      findings: [
        { title: 'The highest score is not the best choice here', detail: 'Penetration scores 13 / 15 but would raise concentration; the rationale explicitly accepts a lower score to reduce that risk.' },
        { title: 'Certification is the bridge between strategies', detail: 'IATF 16949 supports both new-OEM qualification (market development) and EV housings (product development), so the approvals and capital are reused.' },
        { title: 'Diversification is premature', detail: 'It scores 7 / 15: fit is poor (2 / 5) and risk is the highest (5 / 5). It should wait until at least one new OEM is secured.' },
        { title: 'The moves are specific enough to cost', detail: 'Each option names accounts, regions or products; market development lists two bids already in progress.' },
      ],
      watchouts: [
        'The 12-month goal assumes both OEM bids succeed; if one is lost, weight should shift towards penetration at the anchor accounts.',
        'Prize and fit ratings are internal judgements; the export option has not been tested with a customer.',
        'Winning new OEMs and fixing the Line 2 rework compete for the same management time.',
      ],
    },
    recommendations: [
      'Pursue the two bid-stage OEM qualifications as the first-year growth strategy, treating each as a project with an owner, a budget and an approval date.',
      'Keep penetration alive at the anchor accounts without raising dependence: take second-source parts only where margin is above plan.',
      'Prepare EV housings as the second step: build one prototype batch in year one so product development starts from proven capability.',
      'Defer diversification; revisit it when two new OEMs are on board and the Line 2 rework is fixed.',
    ],
    actionables: [
      { action: 'Assign a project owner and an approval timeline to each of the two OEM qualifications', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Set a ceiling: no single customer above 35% of revenue within 24 months', owner: 'Founder', timeframe: 'This quarter', priority: 'High' },
      { action: 'Build one EV motor-housing prototype batch for customer trials', owner: 'Operations Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Test one export enquiry through the trading partner before committing sales resources', owner: 'Sales Head', timeframe: 'Within 6 months', priority: 'Low' },
    ],
  },

  bcg: {
    scenario: 'Anand Auto Components (Pune) — deciding where the cash from its product lines should go.',
    values: {
      growth_cutoff: '10',
      share_cutoff: '1.0',
      allocation: 'Use the cash from shafts and gears (a Cash cow) to fund the Star — welded brackets, once the Line 2 rework is fixed — and the EV pilot (a Question mark). Run machined housings for cash with no new capital, because EV adoption will shrink demand. Keep tooling services small until two EV programmes are confirmed.',
      notes: 'Market growth and relative share are management estimates from OEM volume forecasts and the largest competitor’s published capacity; to be checked against two customers’ forecasts.',
    },
    tables: {
      lines: [
        { name: 'Precision shafts and gears', revenue: '4700', growth: '9', share: '1.2', plan: 'Hold' },
        { name: 'Machined housings (engine and transmission)', revenue: '2300', growth: '4', share: '0.9', plan: 'Harvest' },
        { name: 'Welded chassis brackets', revenue: '1900', growth: '12', share: '1.1', plan: 'Build' },
        { name: 'Tooling and fixture services', revenue: '600', growth: '15', share: '0.3', plan: 'Hold' },
        { name: 'EV motor housings and battery trays (pilot)', revenue: '300', growth: '28', share: '0.2', plan: 'Build' },
      ],
    },
    why: {
      growth_cutoff: 'The usual 10% cut-off is kept; the auto-components market is growing at 8–10%, so it separates growth lines from the core.',
      lines: 'Growth is the growth of each line’s MARKET (EV parts 28%, housings 4%), not Anand’s own sales growth.',
      allocation: 'The decision follows the quadrants: fund the Star and the best Question mark from the Cash cow, run the Dog for cash.',
    },
    analysis: {
      summary: 'A healthy cash base funds the portfolio: shafts and gears (48% of revenue) are a Cash cow, welded brackets are a Star, and two small lines are Question marks. The weak spot is machined housings — 23% of revenue in a Dog whose market is shrinking as vehicles go electric.',
      verdict: {
        label: 'Healthy cash base, but 23% of revenue sits in a Dog',
        rationale: 'The Cash cow and the Star give a sound base, but nearly a quarter of revenue depends on a line the EV shift will erode.',
      },
      findings: [
        { title: 'The Cash cow can fund growth', detail: 'Shafts and gears bring in 48% of revenue in a 9%-growth market where Anand leads (1.2×). That cash can pay for the Star and the EV pilot.' },
        { title: 'The Star needs its quality problem fixed first', detail: 'Welded brackets are the one high-growth, high-share line, and also where the Line 2 rework hotspot is. Investing before fixing it would waste the cash.' },
        { title: 'Two Question marks compete for funding', detail: 'The EV pilot (28% growth, 0.2×) and tooling services (15%, 0.3×) both need cash; the plan funds the EV pilot and holds tooling.' },
        { title: 'A Dog is large', detail: 'Housings are 23% of revenue at 4% market growth and 0.9× share; treating them as a cash source with no new capital is consistent with the quadrant.' },
      ],
      watchouts: [
        'Relative share and market growth are management estimates; a small change moves lines across the cut-offs (shafts and gears are 9% growth against a 10% cut-off).',
        'The EV pilot is 3% of revenue; its quadrant may be a poor guide to its eventual size.',
        'Harvesting housings assumes the customers will not re-source early.',
      ],
    },
    recommendations: [
      'Fund the Star: use part of the Cash cow’s cash to fix the Line 2 welding hotspot, then expand welded-bracket capacity.',
      'Place a capped bet on the EV pilot — fund one prototype batch and two customer trials, with a clear gate before more capital.',
      'Run machined housings for cash: no new capital, protect margin, and plan the capacity release as EV adoption grows.',
      'Hold tooling services at current size until two EV programmes are confirmed, then decide whether to build or exit.',
    ],
    actionables: [
      { action: 'Complete the Line 2 welding root-cause fix and re-measure rework before approving any bracket capacity', owner: 'Operations Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Define the stage-gate (customer commitments, volumes) for releasing more capital to the EV pilot', owner: 'Founder', timeframe: 'This quarter', priority: 'High' },
      { action: 'Verify market-growth and relative-share estimates for each line against two customers’ volume forecasts', owner: 'Sales Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Draft a capacity-release plan for the housings line', owner: 'Operations Head', timeframe: 'Within 6 months', priority: 'Low' },
    ],
  },

  ge9box: {
    scenario: 'Anand Auto Components (Pune) — placing its five product lines on the nine-box to decide where investment goes.',
    values: {
      attractiveness_factors: 'Market growth (8–10% overall, 12% for welded assemblies, about 28% for EV parts); margin pressure from annual OEM price-downs; competitive intensity (regional shops on standard parts); exposure to the EV shift; entry barriers created by approvals and certification.',
      strength_factors: 'Relative share against the strongest rival; approvals and certification held (IATF 16949); cost position (4.8% rework, 74% utilisation); quality and delivery record; engineering support; dependence on one customer.',
      allocation: 'Fund the welded-bracket line first (a second welding line once the Line 2 rework is fixed) and the engineering-led parts that win approvals; keep shafts and gears as the cash engine with maintenance capital only; run machined housings for cash with no new capital; hold tooling services and the EV pilot at pilot scale until a second OEM confirms volumes.',
      notes: '',
    },
    tables: {
      units: [
        { unit: 'Precision shafts and gears', revenue: '4700', attractiveness: '3', strength: '5', plan: 'Hold and defend' },
        { unit: 'Machined housings (engine and transmission)', revenue: '2300', attractiveness: '2', strength: '3', plan: 'Harvest' },
        { unit: 'Welded chassis brackets', revenue: '1900', attractiveness: '4', strength: '3', plan: 'Invest to grow' },
        { unit: 'Tooling and fixture services', revenue: '600', attractiveness: '4', strength: '2', plan: 'Invest selectively' },
        { unit: 'EV motor housings and battery trays (pilot)', revenue: '300', attractiveness: '5', strength: '1', plan: 'Invest selectively' },
      ],
    },
    why: {
      attractiveness_factors: 'Each axis rests on named factors, so a rating can be argued with evidence rather than opinion.',
      units: 'Ratings run on the 1–5 scale and are placed by band (4–5 high, 3 middle, 1–2 low); the revenue gives the size of each unit.',
      allocation: 'The plan departs from the grid in one place on purpose: shafts and gears sit in an invest cell but are held, because cash is limited and they already lead.',
    },
    analysis: {
      summary: 'Anand has one strong cash unit, one growth unit worth backing, two promising but weak units and one unit to run down. Shafts and gears and welded brackets sit in the invest cells and carry 67% of revenue; machined housings (23%) fall in the harvest cell because their industry is losing attractiveness as vehicles go electric; tooling and the EV pilot are attractive markets Anand is not yet strong in.',
      verdict: {
        label: 'Back the brackets, hold the cash engine, harvest the housings',
        rationale: 'Two units are in the invest cells, two in the selective cells and one (23% of revenue) in the harvest cell — a spread that can fund its own growth if the cash engine is kept strong.',
      },
      findings: [
        { title: 'The cash engine is also the strongest unit', detail: 'Shafts and gears (48% of revenue) are strong (5) in a middling industry (3). The grid says invest, but the best use of limited cash is to defend the position, not to expand it.' },
        { title: 'Welded brackets are the best investment', detail: 'High attractiveness (4, 12% market growth) and average strength (3). The strength rating is held back by the Line 2 rework; fixing it moves the unit towards the top-left cell.' },
        { title: 'Two attractive units are weak', detail: 'Tooling services (4, 2) and the EV pilot (5, 1) are in attractive industries where Anand is small. They deserve option-sized money, not scale-up money, until strength is built.' },
        { title: 'Housings are a harvest, not a rescue', detail: 'Industry attractiveness is 2 and falling as EVs arrive; strength is average. Running the line for cash and releasing capacity as demand falls is consistent with the cell.' },
      ],
      watchouts: [
        'All ratings are management judgement from a short list of factors; none has been weighted or tested against customers.',
        'Shafts and gears sit exactly on a band boundary (attractiveness 3): a rating of 4 or 2 would change the zone.',
        'The grid is silent on how much cash each unit generates; the allocation depends on that, not on the cell alone.',
      ],
    },
    recommendations: [
      'Make welded brackets the first call on growth capital: fix the Line 2 welding hotspot, then approve the second welding line against signed volumes.',
      'Defend shafts and gears as the cash engine: maintenance capital only, protect margin through pricing and rework, and keep the quality record that makes it strong.',
      'Run machined housings for cash with no new capital and set a date to review the capacity they release.',
      'Keep tooling services and the EV pilot at pilot scale and set explicit gates (customer commitments and volumes) for releasing more.',
    ],
    actionables: [
      { action: 'Weight the industry and strength factors and re-score all five units with the finance and sales heads', owner: 'Strategy Lead', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Complete the Line 2 welding fix and re-rate the strength of the bracket unit', owner: 'Operations Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Define the gate (confirmed volumes from a second OEM) that releases more capital to tooling and the EV pilot', owner: 'Managing Director', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Prepare a capacity-release plan for the housings line', owner: 'Operations Head', timeframe: 'Within 6 months', priority: 'Low' },
    ],
  },

  dpm: {
    scenario: 'Anand Auto Components (Pune) — a second opinion on the same five product lines, using Shell’s policy matrix.',
    values: {
      prospects_factors: 'Market growth (8–10% overall, 28% for EV parts); market quality — price stability and the strength of annual price-downs; availability of inputs (three alloy mills, index pricing); environmental pressure (carbon-footprint disclosure required by 2027).',
      capability_factors: 'Market position (share against the leader, approvals held); production capability (rework 4.8%, 74% utilisation, tolerances); product development (tooling and design capability, EV experience).',
      decisions: 'Leader-level backing for shafts and gears (growth policy); push the welded-bracket line harder (try harder) once rework is fixed; set a decision date for tooling services and the EV pilot — double the commitment if a second OEM signs, otherwise stop; withdraw from machined housings in phases as demand falls.',
      cross_check: 'The two tools agree on shafts and gears and brackets (invest) and on housings (run down). They differ on tooling and the EV pilot: the nine-box says invest selectively; the policy matrix says double or quit, which is the sharper message — they need a decision date, not a drift.',
      notes: '',
    },
    tables: {
      units: [
        { unit: 'Precision shafts and gears', revenue: '4700', prospects: '3', capability: '5', evidence: 'Share 1.2× the nearest rival; sector growth 9% with steady price-downs; IATF 16949 and 91% repeat orders.' },
        { unit: 'Machined housings (engine and transmission)', revenue: '2300', prospects: '2', capability: '3', evidence: 'Sector growth 4% and shrinking with EVs; Anand’s share 0.9× the leader; tolerances good, utilisation 74%.' },
        { unit: 'Welded chassis brackets', revenue: '1900', prospects: '4', capability: '3', evidence: 'Sector growth 12%; share 1.1×, but 4.8% rework on Line 2 holds the capability back.' },
        { unit: 'Tooling and fixture services', revenue: '600', prospects: '4', capability: '2', evidence: 'EV tooling demand is growing 15%; Anand has the design skills but only 0.3× the leader’s share and little EV experience.' },
        { unit: 'EV motor housings and battery trays (pilot)', revenue: '300', prospects: '5', capability: '1', evidence: 'EV parts market growing about 28%; Anand has one pilot order and no aluminium thin-wall machining experience.' },
      ],
    },
    why: {
      prospects_factors: 'Shell’s own four factors for sector prospects are named, so the ratings can be challenged.',
      units: 'The policy is read from the cell where the two ratings meet; the evidence column is what justifies each rating.',
      cross_check: 'Comparing with the nine-box is the point of this tool: the disagreement on tooling and the EV pilot is where a decision is needed.',
    },
    analysis: {
      summary: 'The matrix names one growth business (shafts and gears), one to try harder with (welded brackets), two “double or quit” businesses (tooling services and the EV pilot) and one to withdraw from in phases (machined housings). The “double or quit” label is the key message: both attractive but weak businesses need a decision with a date, not a slow drift.',
      verdict: {
        label: 'Grow the core, push brackets, decide on tooling and EV by a date',
        rationale: 'The policies are consistent with the nine-box on three of five businesses; the two they treat differently are the ones needing a go or no-go.',
      },
      findings: [
        { title: 'Shafts and gears earn the growth policy', detail: 'Capability is strong (5) in a sector of average prospects (3). The policy is growth: invest to keep the lead rather than to expand it.' },
        { title: 'Brackets are the “try harder” business', detail: 'Attractive prospects (4) with average capability (3). Fixing the Line 2 rework is what could move it to leader.' },
        { title: '“Double or quit” is a deadline, not a status', detail: 'Tooling and the EV pilot combine attractive prospects (4–5) with weak capability (1–2). Either build the capability quickly or leave; staying small at length is the worst option.' },
        { title: 'Housings are a phased withdrawal', detail: 'Unattractive prospects (2) and average capability (3) point to withdrawing in phases and releasing the capacity as demand falls.' },
      ],
      watchouts: [
        'The sector-prospect ratings rest on the client’s own market view; none has been checked against outside data.',
        'Weak capability in tooling and EV is judged against the leader and may understate Anand’s edge with its own customers.',
        'Policies are labels for discussion; the money and people behind each one have not been costed.',
      ],
    },
    recommendations: [
      'Treat the shafts and gears growth policy as defending the cash engine: invest in quality, delivery and pricing discipline, not in more capacity.',
      'Give brackets the “try harder” push: fix Line 2, then approve the second welding line against signed volumes.',
      'Set a dated decision for the two “double or quit” businesses: a second OEM’s confirmed volume by a fixed date, or stop and redeploy the effort.',
      'Plan the phased withdrawal from housings, releasing machine hours and people to the bracket and EV lines as demand falls.',
    ],
    actionables: [
      { action: 'Agree a decision date and the evidence (signed volumes from a second OEM) for the tooling and EV “double or quit” calls', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Reconcile the policy matrix with the nine-box ratings and record why they differ on tooling and EV', owner: 'Strategy Lead', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Complete the Line 2 welding fix that decides whether brackets move from “try harder” to “leader”', owner: 'Operations Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Draft the phased-withdrawal plan for housings, with the machine hours released each quarter', owner: 'Operations Head', timeframe: 'Within 6 months', priority: 'Low' },
    ],
  },

  horizons3: {
    scenario: 'Anand Auto Components (Pune) — checking that today’s profit is not the only thing it is investing in.',
    values: {
      h1_core: 'Precision-machined shafts, gears and housings for passenger-vehicle OEMs and Tier-1 assemblers — about 86% of revenue and almost all of the profit. Defend and extend through lower rework, reliable delivery and pricing discipline.',
      h2_emerging: 'Welded chassis brackets (market growing 12%) and engineering-led tooling and fixture services; the second welding line is the enabling investment.',
      h3_options: 'EV motor housings and battery trays (a pilot with one OEM), lightweight aluminium machining, and contract manufacturing for EV start-ups.',
      balance_view: 'The core earns almost all the profit but receives only 13% of the new investment; Horizon 2 takes 70% because of the second welding line. Horizon 3 has two small pilots — enough to keep options open — but nothing decides when a pilot becomes a Horizon 2 business.',
      notes: '',
    },
    tables: {
      initiatives: [
        { initiative: 'Line 2 productivity and rework programme', horizon: 'Horizon 1', investment: '120', payoff: '260', years: '1' },
        { initiative: 'Index-linked pricing and preferred-supplier programme', horizon: 'Horizon 1', investment: '40', payoff: '180', years: '1.5' },
        { initiative: 'Second welding line for chassis brackets', horizon: 'Horizon 2', investment: '650', payoff: '420', years: '3' },
        { initiative: 'Engineering-led tooling and fixture services', horizon: 'Horizon 2', investment: '180', payoff: '160', years: '3' },
        { initiative: 'EV motor housing pilot with one OEM', horizon: 'Horizon 3', investment: '110', payoff: '300', years: '6' },
        { initiative: 'Aluminium machining capability', horizon: 'Horizon 3', investment: '90', payoff: '150', years: '7' },
      ],
    },
    why: {
      h1_core: 'Naming the core first shows how dependent today’s profit is on a business the EV shift will erode.',
      initiatives: 'Years to meaningful profit are checked against the horizon, so a project cannot sit in Horizon 2 while really being a decade away.',
      balance_view: 'The conclusion looks at where the money goes, not at what the plan says — which is what the model is for.',
    },
    analysis: {
      summary: 'Anand has initiatives in all three horizons, which is better than most MSMEs. The weak point is the balance: the core that earns almost all of the profit gets a small share of the money, Horizon 2 gets most of it through one large project (the second welding line), and nothing decides when a Horizon 3 pilot should graduate or stop.',
      verdict: {
        label: 'All three horizons are present — rebalance towards the core and gate Horizon 3',
        rationale: 'Investment is 13% / 70% / 17% across the horizons; the 70% sits in one project that depends on the core’s rework being fixed first.',
      },
      findings: [
        { title: 'The core is under-invested', detail: 'The two Horizon 1 programmes cost ₹160 lakh and promise ₹440 lakh a year of profit within two years; they also pay for Horizon 2, so they should come first.' },
        { title: 'Horizon 2 rests on one project', detail: 'The second welding line is ₹650 lakh of the ₹830 lakh in Horizon 2; if the Line 2 rework is not fixed, the new line will repeat the problem.' },
        { title: 'Horizon 3 is a set of pilots with no gate', detail: 'The EV pilot and aluminium capability cost ₹200 lakh together and are 6–7 years from meaningful profit; without a stage-gate they can drift or be starved.' },
        { title: 'Timing is consistent', detail: 'Every initiative sits in the horizon its years-to-profit says, so the horizons are being used as the model intends.' },
      ],
      watchouts: [
        'Payoffs and years to profit are estimates and, for Horizon 3, very uncertain.',
        'The split is by planned investment; time and attention of the management team are not counted but matter as much.',
        'The model does not value options: a small Horizon 3 pilot can matter far more than its cost.',
      ],
    },
    recommendations: [
      'Sequence the money: complete the two Horizon 1 programmes first because they fund and de-risk the second welding line.',
      'Release the Horizon 2 line in stages against signed volumes, so the biggest bet is not committed before its enabling fix is proven.',
      'Define a stage-gate for each Horizon 3 pilot — the customer commitment, the volume and the date — that decides whether it moves to Horizon 2 or stops.',
      'Review the three-horizon split every year at the board and write down what would change it.',
    ],
    actionables: [
      { action: 'Approve the Line 2 productivity and the pricing programmes as the first call on capital and name their owners', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Stage the second welding line so that its order is released only after the Line 2 rework target is met', owner: 'Operations Head', timeframe: 'This quarter', priority: 'High' },
      { action: 'Write the stage-gate (customer, volume, date) for the EV pilot and the aluminium capability', owner: 'Strategy Lead', timeframe: 'Within 60 days', priority: 'Medium' },
      { action: 'Put the three-horizon review on the annual board calendar', owner: 'Managing Director', timeframe: 'Within 90 days', priority: 'Low' },
    ],
  },

  parenting: {
    scenario: 'Anand Auto Components (Pune) — a future-state view: the parent company and five group units, checking where the parent adds value.',
    values: {
      parent_strengths: 'Quality systems (IATF 16949) and the approval know-how that OEMs trust; access to the two anchor OEMs; financial discipline and bank relationships; a design and tooling team that can solve manufacturing problems.',
      units_under_review: 'The components division (shafts, gears, housings and brackets), the tooling and fixture services unit, an EV pilot unit, a small alloy-bar trading arm, and a warehouse-leasing arm that rents spare space.',
      parenting_verdict: 'Keep the components division and invest in it (heartland). Keep the tooling unit but change how the parent runs it, with its own targets and a technical head (edge of the heartland). Move the EV pilot into a joint venture with an EV engineering partner rather than run it alone (value trap). Keep the alloy-bar trading arm as it is with no new capital (ballast). Sell or wind up the warehouse leasing (alien territory).',
      notes: '',
    },
    tables: {
      units: [
        { unit: 'Components division', opportunity: '4', fit: '5', value_added: 'Quality systems, OEM approvals and finance directly lift its margin and win rate; the parent’s weak point is not fixing the Line 2 rework quickly.' },
        { unit: 'Tooling and fixture services unit', opportunity: '4', fit: '3', value_added: 'The parent supplies design skills and customer access, but runs it like a production line with no separate targets, so it is under-managed.' },
        { unit: 'EV pilot unit', opportunity: '5', fit: '2', value_added: 'A large opportunity, but the parent has no aluminium thin-wall or EV powertrain experience and would be guessing; risk of destroying value by over-investing.' },
        { unit: 'Alloy-bar trading arm', opportunity: '2', fit: '4', value_added: 'The parent buys well and knows the mills, but there is little to improve in a low-margin trading business.' },
        { unit: 'Warehouse leasing', opportunity: '1', fit: '1', value_added: 'The parent adds nothing to a property-rental business and its attention is better spent elsewhere.' },
      ],
    },
    why: {
      parent_strengths: 'A specific list of what the parent is good at is what the fit ratings are tested against.',
      units: 'Each unit is rated on the two questions separately, so a tempting opportunity (the EV pilot) is not confused with a good fit.',
      parenting_verdict: 'Every unit gets a clear call, including the uncomfortable ones (a spin-out and a sale).',
    },
    analysis: {
      summary: 'The parent is genuinely strong in quality, approvals and customer access, which is why the components division sits in the heartland. The matrix then separates the units by whether the parent can really help: the tooling unit is an edge case that needs a different management approach, the EV pilot is a value trap because the opportunity is large but the parent does not understand the technology, the trading arm is ballast, and warehouse leasing is alien territory.',
      verdict: {
        label: 'One heartland unit, one value trap, one alien — keep, fix, spin out, sell',
        rationale: 'Only the components division is a clear home; the EV pilot would destroy value if the parent ran it alone, and the leasing arm is better owned by someone else.',
      },
      findings: [
        { title: 'The parent’s strengths decide the heartland', detail: 'Quality systems and OEM access explain why the components division is a clear fit (5) with real upside (4). The parent should spend its time there.' },
        { title: 'The EV pilot is a classic value trap', detail: 'Opportunity 5, fit 2: the size of the prize attracts attention, but running it alone invites over-investment in a field the parent does not understand.' },
        { title: 'The tooling unit needs different parenting', detail: 'Opportunity 4, fit 3: the parent helps with design and customers but manages it like a production line; separate targets and a technical head would raise its value.' },
        { title: 'Two units add nothing to the group', detail: 'The trading arm is safe but offers little to improve; warehouse leasing has no fit and no opportunity, so another owner would run it better.' },
      ],
      watchouts: [
        'The ratings are the founders’ view of their own parenting, which tends to be generous; they should be checked with the unit heads.',
        'The sample describes a five-unit group Anand does not yet have; the tool only applies once more than one business unit exists.',
        'The matrix says nothing about the price at which a unit could be sold or spun out.',
      ],
    },
    recommendations: [
      'Concentrate the parent’s time and capital on the components division, where its quality and customer-access strengths clearly add value.',
      'Change how the tooling unit is managed — its own targets, a technical head and a separate customer pipeline — before deciding on more investment.',
      'Move the EV pilot into a joint venture with a partner that understands EV engineering, limiting the capital at risk and keeping an option on the result.',
      'Sell or wind up the warehouse-leasing arm and keep the trading arm without new capital.',
    ],
    actionables: [
      { action: 'Test the fit ratings with the heads of the five units and revise any where they disagree', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Shortlist two EV engineering partners and draft joint-venture terms for the EV pilot', owner: 'Strategy Lead', timeframe: 'Within 90 days', priority: 'High' },
      { action: 'Set separate targets and appoint a technical head for the tooling unit', owner: 'Operations Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Get two indicative offers for the warehouse-leasing arm', owner: 'Finance Head', timeframe: 'Within 90 days', priority: 'Low' },
    ],
  },

  makebuyally: {
    scenario: 'Anand Auto Components (Pune) — deciding how to get EV-ready aluminium machining and tooling capability in 18 months.',
    values: {
      capability_gap: 'EV-specific aluminium thin-wall machining and tooling capability, needed within 18 months to qualify for motor-housing and battery-tray programmes with two OEMs. Anand has steel machining and tooling design skills but no aluminium thin-wall experience or fixtures.',
      verdict: 'Borrow (ally or contract)',
      rationale: 'Building is too slow and too uncertain for an 18-month window, and buying would cost more than six times the alliance and bring an integration project in the middle of the second-line project. An alliance gives the capability in about six months, limits the money at risk, and keeps the option to buy later. The risks are dependence on the partner and leakage of know-how, which the contract’s IP and exclusivity terms must cover.',
      notes: '',
    },
    tables: {
      routes: [
        { route: 'Build (make)', answer: 'Partly', evidence: 'Anand has CNC and tooling-design skills to extend, but no aluminium thin-wall experience; hiring two specialists would take six to nine months and the learning curve another six to nine.', months: '18', cost: '350' },
        { route: 'Borrow (ally or contract)', answer: 'Yes', evidence: 'A Chakan tooling specialist already runs aluminium housing lines and wants steady OEM-linked volume; a three-year manufacturing alliance with joint tooling development is available, on IP terms Anand can agree.', months: '6', cost: '120' },
        { route: 'Buy (acquire)', answer: 'Partly', evidence: 'One small aluminium machining shop is for sale, but its customers overlap with Anand’s, its equipment is old, and integrating it would distract from the second-line project.', months: '12', cost: '780' },
      ],
    },
    why: {
      capability_gap: 'A dated, specific gap (what, why, by when) is what the three questions are answered against.',
      routes: 'Each route is answered with evidence, not preference, and carries a time and a cost so the comparison is concrete.',
      rationale: 'The rationale names the risks of the chosen route (dependency, leakage) and how they are managed.',
    },
    analysis: {
      summary: 'Following the three questions in order, building holds only partly (no aluminium experience, and the learning curve alone is a year), but borrowing holds fully: a local specialist has the capability and wants the volume. Buying also holds only partly and would cost over six times as much. The questions point to borrowing, and the client’s own verdict agrees.',
      verdict: {
        label: 'Borrow (alliance) — the questions and the verdict agree',
        rationale: 'It is the fastest route (about six months) and the cheapest (₹120 lakh), and the only one where the question holds in full.',
      },
      findings: [
        { title: 'Build is a partial yes', detail: 'Anand has relevant skills to extend, but no aluminium thin-wall experience and 18 months to learn it: too slow to meet the OEM qualification window.' },
        { title: 'Borrow holds fully', detail: 'A Chakan specialist runs aluminium housing lines already and wants OEM-linked volume; the alliance can start in about six months.' },
        { title: 'Buy costs the most and distracts the most', detail: 'The only target for sale overlaps with Anand’s customers, runs old equipment and would arrive in the middle of the second-line project.' },
        { title: 'The main risk is dependence', detail: 'A three-year alliance leaves Anand reliant on one partner and exposed on know-how; exclusivity, IP and step-in rights must be in the contract.' },
      ],
      watchouts: [
        'Costs and times are estimates; the alliance’s terms have not been negotiated.',
        'A partner that is also a competitor for the same OEMs could limit what Anand learns.',
        'The option to buy later is only valuable if the contract gives Anand first refusal.',
      ],
    },
    recommendations: [
      'Pursue the alliance with the Chakan tooling specialist and negotiate IP ownership, exclusivity for Anand’s OEMs and step-in rights up front.',
      'Use the alliance to build the in-house capability gradually: second two of Anand’s engineers to the partner so the knowledge does not stay outside.',
      'Write a first-refusal clause into the contract so the buy route stays open if the partner is ever for sale.',
      'Set the gate for revisiting the choice: if the partner misses the six-month milestone, reopen the build and buy routes.',
    ],
    actionables: [
      { action: 'Open alliance talks with the Chakan specialist and agree heads of terms (scope, IP, exclusivity, price)', owner: 'Managing Director', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Draft the alliance contract with first-refusal and step-in clauses and have it reviewed by counsel', owner: 'Legal Adviser', timeframe: 'Within 90 days', priority: 'High' },
      { action: 'Nominate two engineers to work alongside the partner from day one', owner: 'Engineering Head', timeframe: 'This quarter', priority: 'Medium' },
      { action: 'Define the six-month milestone and the review that would reopen the build and buy routes', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  masynergy: {
    scenario: 'Anand Auto Components (Pune) — testing whether buying a heat-treatment and aluminium-machining specialist would pay.',
    values: {
      target: 'A Chakan heat-treatment and aluminium-machining specialist',
      deal_rationale: 'The alliance route was ranked first in the Make-Buy-Ally check; the buy route is analysed to see whether owning the capability outright would be worth the extra cost. It would bring in-house heat treatment, aluminium thin-wall machining and an experienced shop-floor team.',
      standalone_value: '700',
      price: '1100',
      discount_rate: '12',
      integration_plan: 'Keep the target’s foreman team and its two key engineers on retention terms; appoint one integration lead for 12 months reporting to the managing director; integrate quality systems first (IATF alignment), purchasing second; do not touch the target’s customers for the first six months. Biggest risks: loss of the key engineers, distraction from the second-line project, and loss of the target’s two customers who compete with Anand’s anchor OEM.',
      notes: 'All figures in ₹ lakh. Synergy values are management estimates; probabilities are judgement.',
    },
    tables: {
      synergies: [
        { type: 'Cost', source: 'In-house heat treatment replaces job work', value: '90', probability: '80', starts: 'Year 1', one_off: '20' },
        { type: 'Cost', source: 'Shared purchasing of alloy and aluminium bar', value: '40', probability: '70', starts: 'Year 2', one_off: '0' },
        { type: 'Cost', source: 'One quality and finance team instead of two', value: '35', probability: '60', starts: 'Year 2', one_off: '25' },
        { type: 'Revenue', source: 'Cross-selling EV housings to Anand’s two anchor OEMs', value: '150', probability: '40', starts: 'Year 3', one_off: '15' },
        { type: 'Capability or financial', source: 'Aluminium thin-wall machining know-how', value: '60', probability: '50', starts: 'Year 2', one_off: '10' },
        { type: 'Dis-synergy (a cost or loss)', source: 'Loss of two target customers that compete with Anand’s anchor OEM', value: '70', probability: '50', starts: 'Year 1', one_off: '0' },
      ],
    },
    why: {
      standalone_value: 'The synergies are worth only what the buyer creates; the standalone value is what the seller already owns.',
      synergies: 'Dis-synergies and the one-off cost to achieve each synergy are listed beside the benefits, and revenue synergies carry lower probabilities than cost synergies.',
      integration_plan: 'Names who runs the integration and the three risks most likely to destroy the synergies.',
    },
    analysis: {
      summary: 'On Anand’s own estimates the synergies are worth about ₹393 lakh over five years, risk-adjusted (₹176 lakh a year at full run-rate, after ₹70 lakh of one-off costs), against a premium of ₹400 lakh over the target’s standalone value. At the asking price the deal therefore does not create value: the buyer would pay the seller slightly more than the synergies are worth, and the estimates are the least certain part of the case.',
      verdict: {
        label: 'Do not pay ₹1,100 lakh — the premium is not covered',
        rationale: 'The ₹400 lakh premium is ₹7 lakh more than the ₹393 lakh value of the synergies, before any allowance for integration risk or a shortfall in the revenue synergy.',
      },
      findings: [
        { title: 'Cost synergies carry the case', detail: 'The three cost synergies are worth about ₹121 lakh a year risk-adjusted and are the most reliable; replacing job work with in-house heat treatment alone is ₹72 lakh a year.' },
        { title: 'The revenue synergy is the weakest link', detail: 'Cross-selling EV housings to the anchor OEMs is rated 40% likely and starts only in year three; it contributes ₹60 lakh a year risk-adjusted and is the first to fall away if the OEMs do not buy.' },
        { title: 'The dis-synergy is real', detail: 'Losing the two target customers that compete with Anand’s anchor OEM costs ₹35 lakh a year risk-adjusted, more than the overhead saving of ₹21 lakh.' },
        { title: 'The price is the problem, not the deal', detail: 'With a standalone value of ₹700 lakh, the premium of ₹400 lakh needs the synergies to land almost in full; at a price near ₹1,000 lakh (premium ₹300 lakh) there would be about ₹93 lakh of headroom.' },
      ],
      watchouts: [
        'Synergy values and probabilities are management estimates and have not been tested with the target’s customers or accounts.',
        'A 12% discount rate may be low for the acquisition of a small private business.',
        'The alliance route chosen in the Make-Buy-Ally check has not been valued on the same five-year basis, so the two cannot yet be compared.',
      ],
    },
    recommendations: [
      'Set a walk-away price of about ₹1,000 lakh (a premium of ₹300 lakh), which leaves roughly ₹90 lakh of headroom for estimates that prove optimistic, and decline anything above ₹1,100 lakh.',
      'Test the two largest synergies before bidding: confirm the heat-treatment saving against twelve months of actual job-work invoices, and the cross-sell with the two anchor OEMs.',
      'Treat the purchase as the second choice behind the alliance: value the alliance (₹120 lakh) on the same five-year basis before deciding between them.',
      'If the deal proceeds, protect the cost synergies, put the target’s two key engineers on retention terms, and appoint one integration lead for the first twelve months.',
    ],
    actionables: [
      { action: 'Cross-check the heat-treatment saving against twelve months of Anand’s job-work invoices', owner: 'Finance Head', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Set the walk-away price at about ₹1,000 lakh and agree it with the board before any talks', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Ask the two anchor OEMs whether they would buy EV housings from a combined business', owner: 'Sales Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Value the alliance route on the same five-year basis for comparison', owner: 'Strategy Lead', timeframe: 'Within 45 days', priority: 'Medium' },
    ],
  },

  pivotpersist: {
    scenario: 'Anand Auto Components (Pune) — checking whether to persist with, pivot or exit its machined-housings line as electric vehicles arrive.',
    values: {
      situation: 'The machined-housings line (engine and transmission housings, ₹2,300 lakh a year) has declined for two years as OEM programmes ended and vehicles move to electric drivetrains. The rest of the business is growing about 10% a year; this line is the part that has stalled.',
      recommended_path: 'Pivot (reinvent)',
      why: 'The line’s core is defensible for roughly three more years but not beyond, a reinvention path exists using skills and customers Anand already has, and staying is only the best use of the line’s machines and people if the pivot is pursued. Exit would waste a capable team and give up the option on EV housings.',
      pivot_type: 'Customer-need pivot (same customer, a more pressing problem)',
      h3_direction: 'Move the line from engine and transmission housings to EV motor housings and battery trays for the same two OEMs — their need (lighter, tighter-tolerance parts for electric platforms) is more pressing than the old one. Test the hypothesis with one prototype batch and a three-month pilot order before committing machines.',
      wind_down: 'Fallback if no OEM commits to EV volumes within two quarters: stop new capital in the line, sell spare machine hours to other Anand lines and to a partner, redeploy the team to welded brackets and tooling, and release the floor space for the second welding line.',
      notes: '',
    },
    tables: {
      trend: [
        { year: 'Three years ago', revenue: '2650', margin: '16' },
        { year: 'Two years ago', revenue: '2480', margin: '14' },
        { year: 'Last year', revenue: '2300', margin: '12' },
      ],
      tests: [
        { question: 'Is the core still defensible?', score: '3', evidence: 'Tolerances and certification are still better than regional shops, and the two OEMs still buy; but engine and transmission parts will fall as EV share rises, and margin has dropped from 16% to 12%.' },
        { question: 'Is there a credible reinvention path?', score: '4', evidence: 'EV motor housings and battery trays use the same machining skills, the same OEM relationships and much of the same tooling; one OEM has already placed a pilot order.' },
        { question: 'Is staying the best use of the capital and team?', score: '3', evidence: 'The machines and the team earn more in EV housings than in a shrinking line, but the welded-bracket line is a stronger use of new capital; staying is justified only with the pivot.' },
      ],
    },
    why: {
      situation: 'Starting from facts about the stall (since when, why) stops the check being an emotional reaction to one bad quarter.',
      tests: 'Each score is backed by evidence, and the three questions are framed so that a high score always means “yes”.',
      h3_direction: 'The pivot is stated as a testable hypothesis with a small first experiment, which is what separates a pivot from a hope.',
    },
    analysis: {
      summary: 'The housings line has lost revenue for two years running (₹2,650 lakh to ₹2,300 lakh, about 6.8% a year) and its margin has fallen from 16% to 12% as engine and transmission parts give way to electric drivetrains. The three tests score 3, 4 and 3: the core is defensible for a few more years but not for long, a credible reinvention path exists (EV motor housings and battery trays use the same skills and customers), and staying is justified only if the pivot is pursued. The scores point to pivoting, and the client’s own choice agrees.',
      verdict: {
        label: 'Pivot — reinvent the line around EV housings',
        rationale: 'The core scores only 3 and is eroding, but the reinvention path scores 4 and uses capabilities Anand already has; exit would give up the team and the option.',
      },
      findings: [
        { title: 'The decline is structural, not a bad year', detail: 'Revenue has fallen two years in a row and margin by four points; the cause, the shift to electric drivetrains, will not reverse.' },
        { title: 'The reinvention path is real', detail: 'Motor housings and battery trays reuse the machining skills, the OEM relationships and much of the tooling, and one OEM has already placed a pilot order.' },
        { title: 'Staying is only worth it with the pivot', detail: 'Standing still scores 3 on best use of capital: the welded-bracket line is a stronger use of new capital, so the line should either change or release its resources.' },
        { title: 'A fallback exists', detail: 'If no OEM commits to EV volumes within two quarters, the wind-down plan moves the team and floor space to welded brackets and the second line.' },
      ],
      watchouts: [
        'The scores are Anand’s own judgement, and the pilot order is one data point of demand.',
        'A customer-need pivot is a hypothesis: the test is the pilot order, not enthusiasm.',
        'Margins on EV housings are unknown and may be lower than on the legacy line.',
      ],
    },
    recommendations: [
      'Pivot the housings line towards EV motor housings and battery trays for the two existing OEMs, treating it as a testable hypothesis rather than a commitment.',
      'Run the smallest experiment first: one prototype batch and a three-month pilot order before any new machine is committed.',
      'Set a dated gate: if no OEM commits to EV volumes within two quarters, carry out the fallback plan and release the capacity.',
      'Protect the cash meanwhile: run the legacy housings for margin, with no new capital, until the pilot result is in.',
    ],
    actionables: [
      { action: 'Agree the pilot scope, price and acceptance criteria with the OEM that placed the pilot order', owner: 'Sales Head', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Build the prototype batch of EV motor housings on existing machines', owner: 'Operations Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Set the two-quarter gate and the fallback plan and agree them at the board', owner: 'Managing Director', timeframe: 'This quarter', priority: 'High' },
      { action: 'Estimate the margin on EV housings from the prototype costs', owner: 'Finance Head', timeframe: 'Within 60 days', priority: 'Medium' },
    ],
  },
};
