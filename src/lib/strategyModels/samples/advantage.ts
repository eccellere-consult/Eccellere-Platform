/**
 * samples/advantage.ts — the worked examples for Blue Ocean's strategy canvas, the ERRC grid, VRIO, the resource-based view
 * and core competence, told about the fictional Anand Auto Components (Pune). The facts tie to the other demos.
 */
import type { ModelSample } from '../types';

export const ADVANTAGE_SAMPLES: Record<string, ModelSample> = {
  blueocean: {
    scenario: 'Anand Auto Components (Pune) — drawing its value curve against two kinds of rival, to find uncontested space.',
    values: {
      industry: 'Precision-machined and welded components for passenger-vehicle OEMs and Tier-1 assemblers',
      competitor_a: 'Regional machining shops',
      competitor_b: 'Large Tier-1 suppliers',
      noncustomers: 'Soon-to-be: Tier-2 buyers who source minimum-spec parts from regional shops and would leave for a lower price. Refusing: EV start-ups that avoid auto suppliers because quotes take six to eight weeks and tooling twelve to sixteen. Unexplored: non-automotive precision users (rail, agricultural equipment, drones) who have never thought of an auto supplier.',
      new_curve: 'Raise prototype and tooling speed and engineering support; reduce price competition and catalogue breadth; eliminate unpaid sample runs; create production-grade tooling in three weeks for start-ups, with the same quality system the OEMs will later require.',
      tagline: 'Production-grade tooling in three weeks',
      notes: '',
    },
    tables: {
      canvas: [
        { factor: 'Price', you: '3', a: '5', b: '3' },
        { factor: 'Speed of delivery', you: '4', a: '3', b: '4' },
        { factor: 'Certification and approvals', you: '5', a: '2', b: '5' },
        { factor: 'Engineering support', you: '4', a: '1', b: '3' },
        { factor: 'Flexibility on small batches', you: '4', a: '4', b: '2' },
        { factor: 'Speed of prototype tooling', you: '2', a: '1', b: '3' },
      ],
    },
    why: {
      canvas: 'The factors are the ones buyers actually compare suppliers on, and each score is against a named kind of rival, so the curve means something.',
      noncustomers: 'The three tiers of non-customers, not today’s customers, are where the new demand is.',
      new_curve: 'It says what to raise, reduce, eliminate and create — the input to the ERRC grid — rather than “do better”.',
    },
    analysis: {
      summary: 'Anand’s curve already differs from the industry’s on certification and engineering support, where it is ahead of regional shops and level with the large Tier-1s. It follows the industry on price and speed of delivery, and it is weak on the one factor the new customers care about most: the speed of prototype tooling. That is where the uncontested space is — start-ups that currently get quotes in weeks and tooling in months.',
      verdict: {
        label: 'Distinct on quality, undifferentiated on price — the blue ocean is prototype speed',
        rationale: 'The curve correlates only weakly with the industry average (r = 0.35), but the difference is on factors OEMs already value; the new demand sits with non-customers who value speed.',
      },
      findings: [
        { title: 'The curve is already different where it matters to OEMs', detail: 'Certification (5) and engineering support (4) put Anand well above regional shops and level with or above the large Tier-1s; the curve does not simply follow the industry’s.' },
        { title: 'Price and delivery follow the industry', detail: 'Anand scores 3 on price and 4 on delivery, close to the rivals’ average, so on those two factors it competes on the industry’s terms.' },
        { title: 'The weakest factor is the opportunity', detail: 'Anand scores 2 on prototype tooling speed, as the rivals do (1 and 3): nobody serves EV start-ups well, which makes it the most promising place to break away.' },
        { title: 'Non-customers are specific', detail: 'EV start-ups that avoid auto suppliers because of slow quotes and tooling are a concrete tier of “refusing” non-customers, with a clear unmet need.' },
      ],
      watchouts: [
        'All scores are Anand’s own judgement of itself and of two kinds of rival, not measured data.',
        'Start-up demand is unproven: no customer has yet paid for three-week tooling.',
        'A new curve for start-ups must not erode the quality and delivery record that wins OEM approvals.',
      ],
    },
    recommendations: [
      'Make prototype and tooling speed the headline of a new offer for EV start-ups, and test it with three paying pilots before building capacity.',
      'Keep the existing curve for OEMs — certification and engineering support — and stop competing on price for commodity parts.',
      'Use the ERRC grid to decide exactly what to eliminate, reduce, raise and create so the new curve is built on trade-offs rather than additions.',
      'Write the tagline into every start-up proposal and check that each promise in it can be met in the plant.',
    ],
    actionables: [
      { action: 'Interview ten EV start-ups about quote and tooling lead times and what they would pay for three-week tooling', owner: 'Sales Head', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Draft the ERRC grid for the start-up offer from this canvas', owner: 'Strategy Lead', timeframe: 'Within 30 days', priority: 'High' },
      { action: 'Cost a three-week prototype tooling process in the tool room and identify the one constraint that blocks it', owner: 'Engineering Head', timeframe: 'Within 60 days', priority: 'Medium' },
      { action: 'Score the same factors again with two customers’ own supplier scorecards to test the self-ratings', owner: 'Quality Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },

  errc: {
    scenario: 'Anand Auto Components (Pune) — turning the new value curve into four concrete moves for a start-up tooling offer.',
    values: {
      current_curve: 'Price, speed of delivery, certification and approvals, engineering support, flexibility on small batches, and speed of prototype tooling. Anand is ahead on certification and engineering support, level on price and delivery, and weak on prototype tooling speed.',
      eliminate: 'Unpaid sample runs for every enquiry\nQuotes for part families outside core capability\nOne-off special tooling that is never reused',
      reduce: 'Breadth of the catalogue: the number of part families quoted\nPrice-led tendering against regional shops\nInternal approval steps for repeat orders',
      raise: 'Speed of prototype tooling (from about twelve weeks to three)\nEngineering support before and after approval\nTransparency of cost: open-book quotes for start-ups',
      create: 'A tooling-and-prototype studio for EV start-ups with production-grade quality\nA bridge-to-production contract: tooling is paid back through the first production run',
      cost_effect: 'Dropping unpaid samples and narrowing the quoted part families cuts quoting and sampling cost by roughly a fifth (about ₹40 lakh a year); a standard fixture library cuts tooling hours on every new job.',
      value_effect: 'Start-ups get working tooling in three weeks instead of twelve and a clear path to production approval; OEMs get a supplier whose prototype and production quality are the same, which shortens their own approval cycle.',
      notes: '',
    },
    tables: {},
    why: {
      eliminate: 'Each box lists specific factors, one per line, so each can be costed and owned.',
      cost_effect: 'The grid is checked against cost and against value, because eliminating and reducing must pay for raising and creating.',
      create: 'The two “create” items are things the industry has never offered, not improvements to what it does.',
    },
    analysis: {
      summary: 'The grid is a genuine redesign rather than a list of additions: three items are eliminated and three reduced, which funds the three raised and two created. Together they describe a start-up offer that is faster and more open than anything a regional shop or a large Tier-1 sells, at a lower cost to serve.',
      verdict: {
        label: 'Value innovation — cost goes down and value goes up together',
        rationale: 'Eight of the eleven items cut cost or sharpen focus (eliminate and reduce) and five lift value (raise and create), and each side has a stated effect.',
      },
      findings: [
        { title: 'The cuts pay for the additions', detail: 'Eliminating unpaid samples and narrowing the quoted families removes roughly a fifth of quoting and sampling cost (about ₹40 lakh a year), which funds the faster tooling.' },
        { title: 'The created items are new to the industry', detail: 'A production-grade tooling studio for start-ups and a bridge-to-production contract are not offered by regional shops or by the large Tier-1s.' },
        { title: 'Speed is the pivot', detail: 'Prototype tooling speed appears as the raised factor and is the reason start-ups would switch; everything else supports it.' },
        { title: 'The effects follow from the boxes', detail: 'The cost effect names the eliminated and reduced items, and the value effect names the raised and created ones — the two sides are consistent.' },
      ],
      watchouts: [
        'The ₹40 lakh saving is an estimate that depends on how much sampling is actually unpaid today.',
        '“Three weeks” has not been demonstrated; it is the promise the whole offer rests on.',
        'Open-book quotes may weaken pricing power with larger customers if they leak.',
      ],
    },
    recommendations: [
      'Build the start-up offer around the single promise in the grid — production-grade tooling in three weeks — and refuse work that would dilute it.',
      'Stop the unpaid sample runs and the out-of-scope quotes immediately; they cost money today and fund nothing.',
      'Create the bridge-to-production contract so the tooling investment is recovered through the first production run and start-ups have a path to approval.',
      'Measure the effect: track quote-to-order time, tooling lead time and the share of tooling jobs that convert into production orders.',
    ],
    actionables: [
      { action: 'Stop unpaid sample runs and out-of-scope quotes and tell the sales team the rule', owner: 'Managing Director', timeframe: 'Next 30 days', priority: 'High' },
      { action: 'Draft the bridge-to-production contract terms and test them with two start-ups', owner: 'Sales Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Build a standard fixture library and set a three-week tooling target for one pilot job', owner: 'Engineering Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Set up the three tracking measures and review them monthly', owner: 'Strategy Lead', timeframe: 'This quarter', priority: 'Low' },
    ],
  },

  vrio: {
    scenario: 'Anand Auto Components (Pune) — testing which of its claimed advantages will last.',
    values: {
      scope: 'Anand Auto Components: certifications and quality systems, people and know-how, plant and processes, customer relationships and internal systems.',
      conclusion: 'Build the strategy on the certification and quality system — the one sustained advantage. Organise the tooling-design team so that it earns its value (separate targets and a technical head). Treat the OEM relationships as a temporary edge to convert into contracts quickly. Machining capacity is only at parity, and the welding process and order tracking are disadvantages to fix before growth.',
      notes: '',
    },
    tables: {
      resources: [
        { resource: 'IATF 16949 certification and the quality system behind it', valuable: 'Yes', rare: 'Yes', imitate: 'Yes', organised: 'Yes', evidence: 'Held by few Tier-2 suppliers in the belt; takes 18–24 months to earn; used in every OEM approval and audit.' },
        { resource: 'In-house tooling and fixture design team', valuable: 'Yes', rare: 'Yes', imitate: 'Yes', organised: 'No', evidence: 'Experienced engineers that few regional shops have; years to build; but run as part of production with no separate targets or pipeline.' },
        { resource: 'Sixteen-year relationships with two anchor OEMs', valuable: 'Yes', rare: 'Yes', imitate: 'No', evidence: 'A real edge today, but OEMs readily approve a second source, so a rival can win the same buyers within one programme cycle.' },
        { resource: 'CNC machining capacity (eleven machines)', valuable: 'Yes', rare: 'No', evidence: 'Necessary to compete, but regional shops have comparable machines.' },
        { resource: 'Welding process on Line 2', valuable: 'No', evidence: 'The 4.8% rework hotspot costs margin and delivery; it is currently a source of disadvantage.' },
        { resource: 'Order tracking on Excel and paper', valuable: 'No', evidence: 'Late-delivery incidents trace to manual tracking; it is a disadvantage rather than a resource.' },
      ],
    },
    why: {
      resources: 'Each resource is specific, and each “no” stops the chain, so the implication follows from the first failed test.',
      conclusion: 'The conclusion names the advantage to build on and what to do with each of the others.',
    },
    analysis: {
      summary: 'Of six resources and capabilities, only the certification and quality system passes all four tests and is a sustained advantage. The tooling-design team is valuable, rare and hard to copy but not organised to deliver its value, so it is an advantage Anand is not yet using. The OEM relationships are a real but temporary edge, machining capacity is parity, and two internal processes are disadvantages.',
      verdict: {
        label: 'One sustained advantage; one unexploited — organise the tooling team',
        rationale: 'Certification passes all four tests; the tooling-design team passes three but fails “organised to capture it”.',
      },
      findings: [
        { title: 'Certification is the lasting advantage', detail: 'It is valuable in every OEM approval, held by few suppliers in the belt, takes 18–24 months to earn and is backed by a working quality system.' },
        { title: 'The tooling team is an unused advantage', detail: 'It is rare and slow to build, but has no separate targets or pipeline, so its value reaches the business only indirectly.' },
        { title: 'The anchor relationships are temporary', detail: 'OEMs can add a second source within one programme cycle, so the relationships protect volume today but not the position.' },
        { title: 'Two processes are disadvantages', detail: 'The Line 2 welding process and manual order tracking cost margin and delivery performance and should be fixed before they cap growth.' },
      ],
      watchouts: [
        'The “rare” and “costly to imitate” answers are Anand’s own view and have not been checked against rivals.',
        'The tooling team depends on a handful of individuals; losing two would remove the advantage.',
        'Certification must be maintained at every audit; it is an advantage only while the system keeps working.',
      ],
    },
    recommendations: [
      'Build the strategy on the certification and quality system: make it the first line of every OEM proposal and protect it with a named owner for each audit.',
      'Organise the tooling-design team: give it its own targets, a technical head and a customer pipeline so its advantage reaches the P&L.',
      'Convert the temporary relationship edge into multi-year contracts with the two anchor OEMs before a second source is approved.',
      'Fix the welding process and replace manual order tracking; neither is a resource, and both hold back the real advantage.',
    ],
    actionables: [
      { action: 'Appoint a technical head for the tooling-design team and set separate targets for it', owner: 'Managing Director', timeframe: 'This quarter', priority: 'High' },
      { action: 'Open multi-year supply contract discussions with the two anchor OEMs', owner: 'Sales Head', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Complete the Line 2 welding fix and set up a simple order-tracking system', owner: 'Operations Head', timeframe: 'Within 90 days', priority: 'High' },
      { action: 'Check the “rare” and “costly to imitate” answers against two OEM supplier scorecards', owner: 'Quality Head', timeframe: 'Within 90 days', priority: 'Low' },
    ],
  },

  rbv: {
    scenario: 'Anand Auto Components (Pune) — taking stock of what it owns and can do, to see what its advantage is built on.',
    values: {
      core_capabilities: 'Winning and keeping OEM approvals quickly; redesigning parts for manufacturability; holding tight tolerances in volume.',
      advantage_story: 'Certified quality systems and an experienced engineering team shorten OEM approval and reduce the risk of rework for buyers. Both take years to build and rest on tacit know-how, so rivals cannot copy them within a bid cycle — which is why OEMs approve Anand as a second source.',
      gaps: 'Aluminium thin-wall machining and EV-specific experience; ERP and order tracking; working-capital strength; operator retention (18% attrition).',
      notes: '',
    },
    tables: {
      resources: [
        { type: 'Financial resources', what: 'Bank limits of ₹2,600 lakh in use; retained profit funds about ₹650 lakh of capital spending a year; working capital is tight at 71 debtor days.', strength: '2', hard_to_copy: '1' },
        { type: 'Physical resources', what: 'Eleven CNC machines, two welding lines and a tool room in the Pune–Chakan belt close to OEM plants; 74% utilisation.', strength: '3', hard_to_copy: '2' },
        { type: 'Technological resources', what: 'Tooling and fixture designs and process know-how for tight-tolerance shafts and gears; no patents.', strength: '3', hard_to_copy: '3' },
        { type: 'Reputation and brand', what: 'IATF 16949 and customer-specific approvals; a 91% repeat-order rate; trusted by two anchor OEMs.', strength: '5', hard_to_copy: '4' },
        { type: 'Organisational resources (systems, culture)', what: 'A documented quality system; no ERP and Excel tracking; owner-led decision-making.', strength: '3', hard_to_copy: '2' },
        { type: 'Human resources (skills and know-how)', what: 'Experienced tool-room and quality engineers and skilled CNC operators with long tenure on key programmes.', strength: '4', hard_to_copy: '4' },
      ],
    },
    why: {
      resources: 'Each type is described concretely and rated against competitors, and the “hard to copy” rating carries its reason in the description.',
      core_capabilities: 'Capabilities (what Anand does) are kept apart from resources (what it has).',
      advantage_story: 'It traces the chain from resources to capability to what customers value, and says why rivals cannot copy it quickly.',
    },
    analysis: {
      summary: 'Anand’s strength rests on two kinds of resource: its reputation and certifications, and its experienced engineers. Both are strong against rivals and slow to copy, and together they produce the capabilities that win approvals. Its financial, physical and organisational resources are ordinary or weak, and they, not the core strengths, are what limits growth.',
      verdict: {
        label: 'Two core strengths (reputation and people); finance and systems are the weak base',
        rationale: 'Reputation and brand scores 9/10 and human resources 8/10, while financial resources score 3/10 and the organisational ones 5/10.',
      },
      findings: [
        { title: 'The advantage is built on tacit know-how and trust', detail: 'Approvals and a long repeat-order record take years to earn and cannot be copied quickly, which is why they are rated hard to copy.' },
        { title: 'The capabilities are what customers pay for', detail: 'Fast approval, redesign for manufacturability and tolerance control are the activities OEMs value; they depend on both core strengths together.' },
        { title: 'Finance is the weakest resource', detail: 'Tight working capital (71 debtor days) limits how fast Anand can invest even where the advantage is strong.' },
        { title: 'Systems have not kept up with the business', detail: 'No ERP and manual tracking weaken delivery reliability, which is the one factor where Anand is behind its rivals.' },
      ],
      watchouts: [
        '“Stronger than competitors” is a self-assessment; it has not been compared with named rivals’ resources.',
        'Human resources are strong but concentrated in a few engineers; attrition of operators is 18%.',
        'The model says nothing about whether the resources are the right ones for EV parts, where Anand is inexperienced.',
      ],
    },
    recommendations: [
      'Build the strategy on reputation and people: put approvals and engineering support at the centre of the offer.',
      'Strengthen the weak base before expanding: shorten the cash cycle and introduce a simple ERP and order-tracking system.',
      'Protect the human resources that carry the advantage: retention terms for key engineers and a structured apprenticeship to reduce operator attrition.',
      'Close the EV capability gap deliberately, by borrowing or hiring, rather than assuming existing resources transfer.',
    ],
    actionables: [
      { action: 'Put retention terms in place for the five engineers who carry the approval and design know-how', owner: 'Managing Director', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Run the working-capital programme to bring debtor days towards 55', owner: 'Finance Head', timeframe: 'This quarter', priority: 'High' },
      { action: 'Select and start a simple ERP and order-tracking system', owner: 'Operations Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Compare the self-ratings with two named rivals’ resources using customer feedback', owner: 'Sales Head', timeframe: 'Within 90 days', priority: 'Low' },
    ],
  },

  corecompetence: {
    scenario: 'Anand Auto Components (Pune) — finding the competencies its next growth should be built on.',
    values: {
      candidate_source: 'The lasting advantages from VRIO (certification and the quality system) and the capabilities from the resource view (fast OEM approvals, redesign for manufacturability, tight tolerances in volume).',
      capability_base: 'Winning approvals quickly; redesign for manufacturability; holding tolerances in volume.',
      core_products: 'Precision-machined shafts, gears and housings and welded brackets — the components that carry the competence into every OEM programme.',
      new_applications: 'EV motor housings and battery trays; precision parts for rail, agricultural-equipment and defence supply chains; tooling and fixture services for EV start-ups.',
      build_plan: 'Invest in tooling-design talent and a standard fixture library; keep the key engineers on retention terms; protect know-how through documented standards and customer-specific IP terms.',
      notes: '',
    },
    tables: {
      competences: [
        { competence: 'Precision machining to OEM tolerances', markets: '4', benefit: '5', imitate: '4', applications: 'Motor housings and gearbox parts for EVs; precision parts for rail and agricultural equipment.' },
        { competence: 'Design for manufacture and tooling design', markets: '5', benefit: '4', imitate: '4', applications: 'Tooling and fixture services for start-ups; redesign of customers’ parts for lower cost.' },
        { competence: 'OEM approval and quality-system capability (PPAP, IATF)', markets: '4', benefit: '4', imitate: '5', applications: 'Any regulated or safety-critical component market that requires documented approvals.' },
        { competence: 'Welding of thin-section chassis assemblies', markets: '3', benefit: '3', imitate: '2', applications: 'Brackets and sub-frames; limited to road-vehicle chassis today.' },
        { competence: 'Just-in-time delivery to Chakan plants', markets: '2', benefit: '4', imitate: '3', applications: 'Only plants within a 90-km radius; a local advantage, not a transferable one.' },
      ],
    },
    why: {
      competences: 'Each candidate is a bundle of skills scored on Prahalad and Hamel’s three tests; the verdict follows the lowest score, so one weak test stops a competence being called core.',
      new_applications: 'It names where each competence could go next, which is what turns a list of strengths into a growth plan.',
    },
    analysis: {
      summary: 'Three of the five candidates pass all three tests and are core competencies: precision machining to OEM tolerances, design for manufacture and tooling design, and OEM approval and quality-system capability. Welding and just-in-time delivery are useful but not core: each is easy to copy or limited to a small area. The three real competencies point to the same next markets: EV components, other precision-critical industries, and tooling services.',
      verdict: {
        label: 'Three core competencies — build the next act on them',
        rationale: 'Machining, design for manufacture and approval capability each score 4 or 5 on access to markets, customer benefit and difficulty to imitate.',
      },
      findings: [
        { title: 'The strongest competence is the approval system', detail: 'It is the hardest to copy (5) and opens any market that requires documented approvals — far beyond passenger vehicles.' },
        { title: 'Design for manufacture is the most transferable', detail: 'It scores 5 on access to markets: it applies to start-ups, rail, agricultural equipment and any customer who needs a part redesigned.' },
        { title: 'Welding and delivery are not core', detail: 'Thin-section welding scores 2 on imitation and just-in-time delivery 2 on market access; both are useful but neither is a base for new businesses.' },
        { title: 'The applications are concrete', detail: 'Each core competence lists specific new products and markets, which is what links this tool to the growth choice.' },
      ],
      watchouts: [
        'The scores are Anand’s own view; “difficult to imitate” in particular needs evidence from competitors’ histories.',
        'Competencies depend on a few people, so leakage through attrition is the main risk to them.',
        'New applications are listed but not yet ranked or costed.',
      ],
    },
    recommendations: [
      'Base the next growth move on the three core competencies and judge every new product or market by whether it uses at least two of them.',
      'Prioritise EV components and tooling services, where design for manufacture and approvals are decisive and start-ups are underserved.',
      'Protect the competencies: retention terms for the engineers who carry them, and documented standards so the know-how survives individuals.',
      'Do not invest further in welding or just-in-time delivery as growth bases; keep them at the level the core business needs.',
    ],
    actionables: [
      { action: 'Rank the new applications by fit with the three core competencies and size of market', owner: 'Strategy Lead', timeframe: 'Within 60 days', priority: 'High' },
      { action: 'Document the design-for-manufacture and approval know-how as standards the team can train others on', owner: 'Engineering Head', timeframe: 'Within 90 days', priority: 'Medium' },
      { action: 'Put retention terms in place for the engineers who carry the core competencies', owner: 'Managing Director', timeframe: 'Within 45 days', priority: 'High' },
      { action: 'Take the top-ranked application to a feasibility review with one OEM and one start-up', owner: 'Sales Head', timeframe: 'This quarter', priority: 'Medium' },
    ],
  },
};
