export type ServiceFaq = {
  question: string;
  answer: string;
};

export type SectorApplication = {
  sector: string;
  challenges: string[];
  useCases: string[];
  caseStudySnippet: string;
};

export type ServiceApproachStep = {
  step: number;
  title: string;
  description: string;
};

export type ServiceData = {
  slug: string;
  name: string;
  tagline: string;
  heroDescription: string;
  heroCtaLabel: string;
  startingPrice: string;
  sectors: string[];
  painPoints: { headline: string; body: string }[];
  approach: ServiceApproachStep[];
  deliverables: string[];
  sectorApplications: SectorApplication[];
  relatedAssetSlugs: string[];
  faqs: ServiceFaq[];
  featured?: boolean;
  // Extras for Agentic AI flagship page
  maturityLevels?: { level: number; label: string; description: string }[];
  governancePoints?: string[];
};

export const servicesData: ServiceData[] = [
  // ── 1. Agentic AI ──────────────────────────────────────────────────────────
  {
    slug: "agentic-ai",
    name: "Agentic AI",
    tagline: "AI strategy and implementation purpose-built for India's MSMEs",
    heroDescription:
      "From AI readiness assessments to full agentic workflow implementation — we help you identify exactly where AI fits in your business, build the ROI case, and deploy working AI solutions your teams actually use. No vendors pushing products. No bloated proposals. Just AI that delivers measurable outcomes.",
    heroCtaLabel: "Book a Free AI Diagnostic",
    startingPrice: "₹75,000",
    featured: true,
    sectors: ["Manufacturing", "Retail", "Consumer Products", "Logistics"],
    painPoints: [
      {
        headline: "\"We know AI is important, but don't know where to start\"",
        body: "Most MSMEs hear about AI from vendors with something to sell. We start with your business model — revenue drivers, bottlenecks, data availability — and identify the 3 highest-ROI AI opportunities before recommending anything.",
      },
      {
        headline: "\"We tried AI and it didn't work\"",
        body: "Failed AI projects almost always fail at the same point: mismatch between technology capability and operating model readiness. Our AI Readiness Assessment pinpoints exactly which prerequisites you're missing, so implementation sticks.",
      },
      {
        headline: "\"Our data isn't ready for AI\"",
        body: "Waiting for perfect data before starting AI is the most common mistake. We design AI implementations that work with the data you have today, and build the data infrastructure in parallel — so you get results in months, not years.",
      },
      {
        headline: "\"AI feels like a distraction from running the business\"",
        body: "We run AI adoption as sprint-based projects with a defined scope, timeline, and success metrics. Every implementation has a business owner accountable for the outcome, not just a tech team building features.",
      },
    ],
    approach: [
      { step: 1, title: "AI Readiness Assessment", description: "6-dimension evaluation of your AI readiness across Strategy, Data, Technology, Talent, Governance, and Culture. Sector-benchmarked." },
      { step: 2, title: "Opportunity Identification", description: "Map 20+ potential AI use cases against your sector and operations. Score by ROI, feasibility, and time-to-value. Select the top 3–5 to pursue." },
      { step: 3, title: "Business Case Design", description: "Quantify the value of each AI use case: cost savings, revenue impact, productivity gains. Build board-level ROI projections." },
      { step: 4, title: "Architecture & Vendor Strategy", description: "Design the AI architecture (build vs buy vs rent). Evaluate and shortlist appropriate tools, models, and infrastructure — without vendor bias." },
      { step: 5, title: "Pilot & Proof of Concept", description: "Stand up a working PoC within 6–8 weeks. Measure against baseline KPIs. Iterate fast before scaling." },
      { step: 6, title: "Scale & Change Management", description: "Roll out across the business with structured change management. Train teams. Build internal AI governance. Ensure sustainability." },
    ],
    deliverables: [
      "AI Readiness Assessment report with sector benchmarks",
      "AI Opportunity Map with prioritised use cases",
      "Business case document with ROI projections",
      "Technology architecture recommendations (vendor-neutral)",
      "Implementation roadmap (90-day, 12-month, 3-year)",
      "Working Proof of Concept for the #1 priority use case",
      "AI Governance Framework designed for your risk profile",
      "Team training curriculum and capability building plan",
    ],
    sectorApplications: [
      {
        sector: "Manufacturing",
        challenges: ["Unplanned downtime", "Quality defects", "Demand variability", "Manual inspection"],
        useCases: ["Predictive maintenance using equipment sensor data", "Computer vision for defect detection on production lines", "Demand forecasting reducing excess inventory by 25–40%", "AI-driven production scheduling to maximise OEE"],
        caseStudySnippet: "A textile manufacturer in Surat deployed an AI demand forecasting model that reduced finished goods inventory by 32% and improved on-time delivery from 76% to 94% over 8 months.",
      },
      {
        sector: "Retail",
        challenges: ["Stockouts and overstock", "Customer churn", "Manual reordering", "Margin pressure"],
        useCases: ["AI-powered replenishment automation reducing stockouts by 40%", "Personalised product recommendations increasing basket size by 18%", "Customer churn prediction model with proactive retention campaigns", "Dynamic pricing engine for seasonal and category trading"],
        caseStudySnippet: "A 42-store apparel retailer deployed AI-powered replenishment across its warehouse, cutting overstock write-offs by ₹1.2Cr annually while improving in-stock availability from 83% to 96%.",
      },
      {
        sector: "Consumer Products",
        challenges: ["D2C unit economics", "Returns prediction", "Influencer ROI", "Innovation speed"],
        useCases: ["AI-driven unit economics optimiser identifying unprofitable SKUs", "Returns prediction model reducing reverse logistics costs", "Content and creative performance prediction for paid media", "AI-assisted NPD: trend analysis and gap identification"],
        caseStudySnippet: "A D2C food brand used AI to analyse their 380-SKU range and identified 60 SKUs contributing negative gross margin. Rationalising these improved blended gross margin from 38% to 51% in 2 quarters.",
      },
      {
        sector: "Logistics",
        challenges: ["Route inefficiency", "Driver productivity", "Warehouse picking errors", "Demand uncertainty"],
        useCases: ["AI route optimisation reducing fuel costs by 15–22%", "Predictive load planning to improve vehicle utilisation", "Warehouse slotting AI to reduce pick path by 30%", "Delivery time prediction improving customer communication"],
        caseStudySnippet: "A Bangalore-based 3PL deployed AI route optimisation for its 280-vehicle fleet. Fuel costs dropped 18% and on-time delivery improved from 88% to 97% within 4 months of go-live.",
      },
    ],
    relatedAssetSlugs: [
      "ai-readiness-assessment-toolkit",
      "ai-use-case-prioritisation-matrix",
      "prompt-engineering-playbook-for-business",
      "data-analytics-starter-kit",
    ],
    maturityLevels: [
      { level: 1, label: "AI Unaware", description: "No structured AI usage. Data fragmented across Excel and legacy systems. Leadership has not prioritised AI." },
      { level: 2, label: "AI Curious", description: "Experimenting with AI tools (ChatGPT, Copilot). No formal strategy. Mostly departmental, ad-hoc usage." },
      { level: 3, label: "AI Enabled", description: "One or two production AI use cases live. Data infrastructure improving. AI ownership assigned to a champion." },
      { level: 4, label: "AI Integrated", description: "AI embedded in 5+ business processes. Centralised AI governance. Growing internal capability." },
      { level: 5, label: "AI-Native", description: "AI-first decision-making culture. Real-time data pipelines. Continuous learning systems. AI centre of excellence." },
    ],
    governancePoints: [
      "AI policy and responsible use charter",
      "Model risk management framework",
      "Data governance aligned to DPDP Act 2023",
      "Human-in-the-loop design for high-stakes decisions",
      "Vendor assessment and third-party AI risk",
      "Bias detection and fairness monitoring protocols",
    ],
    faqs: [
      { question: "Do we need to have structured data before starting with AI?", answer: "No. We regularly work with MSMEs who have most of their data in Excel spreadsheets or legacy systems. Our AI Readiness Assessment tells you exactly where you are and what the fastest path forward is given your data reality today." },
      { question: "How long does an AI implementation project take?", answer: "A typical AI Readiness Assessment + Business Case takes 4–6 weeks. A full implementation — from assessment to a working production PoC — typically takes 12–16 weeks. We work in 4-week sprints to keep the project visible and accountable." },
      { question: "What's the typical ROI on an AI project?", answer: "For manufacturing AI use cases (predictive maintenance, quality inspection), companies typically see 10–30% cost reduction within the first year. Retail AI (demand forecasting, personalisation) typically delivers 15–40% improvement in the targeted metric within 6 months." },
      { question: "Do you implement AI yourselves or just advise?", answer: "We do both. For strategy, assessment, and architecture, we lead ourselves. For implementation, we either implement directly with your team or orchestrate the right technology partners — always staying accountable for the outcome." },
      { question: "Is AI relevant for a business doing ₹20 Cr in revenue?", answer: "Absolutely. Some of the highest-ROI AI use cases — demand forecasting, automated invoice processing, quality inspection — are achievable with standard cloud services at costs well within the reach of ₹20–50 Cr businesses. The barrier isn't technology cost — it's knowing where to start." },
      { question: "What is the DPDP Act and how does it affect our AI plans?", answer: "India's Digital Personal Data Protection Act (2023) governs how you collect, store, and process personal data. Any AI use case involving customer data needs to be DPDP-compliant. We incorporate data privacy by design into every AI implementation." },
    ],
  },

  // ── 2. Strategy ────────────────────────────────────────────────────────────
  {
    slug: "strategy",
    name: "Strategy",
    tagline: "Market entry, growth planning, and competitive positioning for India's ambitious businesses",
    heroDescription:
      "Rigorous strategy work doesn't have to take 6 months or cost ₹50 Lacs. We bring Big 4 methodology adapted for the speed, scale, and operating context of India's MSMEs and growth-stage startups. From market entry analysis to 3-year growth plans — built to execute, not to sit on a shelf.",
    heroCtaLabel: "Book a Strategy Discovery Call",
    startingPrice: "₹1,50,000",
    sectors: ["All Sectors"],
    painPoints: [
      {
        headline: "\"We're growing, but we don't know exactly why — so can't reliably repeat it\"",
        body: "Accidental growth is dangerous. If you can't identify which markets, segments, and products are driving your best economics, you can't scale it. Strategy starts with understanding what's actually working before prescribing what to do next.",
      },
      {
        headline: "\"New markets look attractive, but analysis is gut feel\"",
        body: "Market entry decisions made on instinct destroy capital. Our structured market sizing, competitive assessment, and channel analysis frameworks give you a quantified view of any new market before you commit a single rupee.",
      },
      {
        headline: "\"Competitors are undercutting us and we can't explain our premium\"",
        body: "Price pressure is always a symptom of insufficient differentiation. Strategic positioning work clarifies your authentic competitive advantages and builds a communication framework that makes price comparison irrelevant.",
      },
      {
        headline: "\"Leadership team is busy but not aligned on direction\"",
        body: "The most expensive strategy problem is leadership misalignment. A shared, tested strategic framework — built collaboratively — is the fastest path to a team that executes with confidence.",
      },
    ],
    approach: [
      { step: 1, title: "Strategic Audit", description: "Full internal analysis: revenue composition, margin by product/segment, organisational capabilities, resource deployment. External: market structure, competitive dynamics, customer jobs-to-be-done." },
      { step: 2, title: "Market & Opportunity Sizing", description: "Bottom-up market sizing for each target segment. Assess market attractiveness, entry barriers, growth rates, and white spaces." },
      { step: 3, title: "Strategic Options Generation", description: "Structured creativity session to generate 5–7 distinct strategic paths. Stress-test each scenario against capabilities, capital, and risk tolerance." },
      { step: 4, title: "Strategy Selection & Design", description: "Evaluate options against a structured multi-criteria framework. Select and refine the winning strategy with board-level conviction." },
      { step: 5, title: "Roadmap & OKR Design", description: "Translate strategy into a 3-year roadmap with clear milestones. Design Objective and Key Results (OKRs) to cascade from corporate to teams." },
      { step: 6, title: "Execution & Governance", description: "Quarterly strategy reviews. Pivot protocols. Governance mechanisms to keep the strategy alive and adaptive as market conditions change." },
    ],
    deliverables: [
      "Strategic Audit report: internal capability + external opportunity assessment",
      "Market sizing models (bottom-up, by segment)",
      "Competitive positioning map with differentiation strategy",
      "Strategic Options evaluation matrix",
      "3-year strategic roadmap with milestones",
      "OKR framework (corporate to team level)",
      "Investor-ready strategy narrative (for funding contexts)",
      "90-day execution quick-start plan",
    ],
    sectorApplications: [
      {
        sector: "Manufacturing",
        challenges: ["Commodity pricing pressure", "Export market entry", "Product diversification risk", "Tier 1 supplier development"],
        useCases: ["Market entry strategy for ASEAN export markets", "Value-added product diversification to escape commodity trap", "Strategic partnership frameworks for OEM relationships", "Make vs buy analysis for backward/forward integration"],
        caseStudySnippet: "A Pune-based precision engineering manufacturer was stuck in commodity competition. Our strategy work identified a ₹90 Cr addressable opportunity in the defence component market. 18 months later, they had their first defence contract worth ₹12 Cr.",
      },
      {
        sector: "Retail",
        challenges: ["Omnichannel integration", "Category expansion risk", "D2C channel cannibalisation", "Franchise vs owned store trade-offs"],
        useCases: ["Omnichannel strategy: right-sizing physical footprint vs digital investment", "Category adjacency strategy: identifying next logical expansion", "Own brand strategy for margin improvement", "Geographic expansion framework with store prioritisation"],
        caseStudySnippet: "A 120-store electronics retailer was losing share to e-commerce. Our omnichannel strategy repositioned them as a 'high-touch experience + click-and-collect' retailer. Sales per sq ft improved by 28% over 18 months.",
      },
      {
        sector: "Consumer Products",
        challenges: ["D2C unit economics", "Distribution scale vs margin", "Brand positioning in crowded categories", "International entry"],
        useCases: ["Portfolio strategy: which SKUs to scale, hold, or delete", "D2C vs GT vs modern trade: channel strategy and trade-offs", "Brand architecture: parent vs sub-brand strategy", "Southeast Asia market entry: market selection and GTM"],
        caseStudySnippet: "A wellness brand was losing money on 40% of its SKU range. Our portfolio strategy work identified 3 'hero SKUs' to invest behind. Revenue from hero SKUs grew 3x while total marketing spend fell 20%.",
      },
      {
        sector: "Logistics",
        challenges: ["3PL price pressure", "Last-mile economics", "Geographic over-extension", "Customer concentration risk"],
        useCases: ["Service line strategy: which logistics services to own vs partner", "Geographic concentration strategy: depth over breadth", "Value-added services: moving beyond pure transport", "Customer portfolio strategy to reduce concentration risk"],
        caseStudySnippet: "A ₹40 Cr 3PL was spreading itself too thin across 8 states. Our strategy concentrated operations in 3 core corridors. Revenue grew 35% in those corridors while overall margin improved from 6% to 11%.",
      },
    ],
    relatedAssetSlugs: [
      "msme-growth-strategy-playbook",
      "competitive-landscape-analyzer",
      "pricing-strategy-workshop-kit",
      "ecommerce-launch-checklist",
    ],
    faqs: [
      { question: "How long does a strategy engagement take?", answer: "A full strategic review and roadmap design typically takes 8–12 weeks. Targeted strategy sprints (e.g., market entry analysis for one market) can be completed in 3–4 weeks." },
      { question: "Is a strategy engagement relevant for a ₹25 Cr business?", answer: "Absolutely. Strategic clarity is most valuable at inflection points — when you're approaching the ₹25–50 Cr mark and facing growth choices that will shape the next decade. This is exactly when informal strategy becomes dangerous." },
      { question: "What happens to the strategy after you leave?", answer: "We build the strategy artefacts in a format that your team can own and iterate on. We also provide quarterly check-in options and access to our OKR tracking templates to keep strategy alive." },
      { question: "Do you work with investor-backed startups or only bootstrapped businesses?", answer: "Both. For investor-backed companies, we have experience preparing board-ready strategy narratives and investor communications. For bootstrapped businesses, we focus on capital-efficient strategy that maximises return on available resources." },
      { question: "Will you sign an NDA?", answer: "Yes. We sign NDAs before any strategy engagement begins. All client information is treated as confidential and is never shared with competitors or third parties." },
      { question: "Can strategy work be done remotely?", answer: "Yes. We run virtual strategy workshops effectively using structured facilitation techniques and collaboration tools. Most of our post-COVID strategy work is delivered in a hybrid format — remote workshops with in-person alignment sessions at key milestones." },
    ],
  },

  // ── 3. Process Transformation ──────────────────────────────────────────────
  {
    slug: "process-transformation",
    name: "Process Transformation",
    tagline: "End-to-end operational redesign for efficiency, quality, and scale",
    heroDescription:
      "Lean manufacturing, supply chain optimisation, quality management systems, and operational excellence — we redesign your processes from the ground up. We implement global methodologies adapted for Indian operating conditions: mixed product lines, seasonal workforces, constrained capital, and the reality of imperfect data.",
    heroCtaLabel: "Get a Free Process Diagnostic",
    startingPrice: "₹1,20,000",
    sectors: ["Manufacturing", "Retail", "Logistics"],
    painPoints: [
      {
        headline: "\"We're producing more, but margins keep shrinking\"",
        body: "Volume growth masking operational inefficiency is the defining trap of the ₹50–200 Cr manufacturing business. Our waste analysis frameworks reveal exactly where your cost is hiding — and the fastest path to recovering it.",
      },
      {
        headline: "\"Quality is inconsistent and we can't trace why\"",
        body: "Quality problems you can't trace are quality problems that will recur. Robust quality management systems — root cause analysis, SPC, CAPA — turn quality from firefighting into prevention.",
      },
      {
        headline: "\"Supply chain disruptions keep catching us off guard\"",
        body: "Most MSME supply chains are optimised for a world without disruption. Our supply chain resilience frameworks redesign your supplier base, inventory strategy, and contingency protocols for the volatility of the 2020s.",
      },
      {
        headline: "\"Our team knows the processes exist, but nobody follows them consistently\"",
        body: "SOPs that live in folders don't drive compliance. We design processes for how your people actually work — simple, visual, reinforced by the right management disciplines — so adherence becomes the default, not the exception.",
      },
    ],
    approach: [
      { step: 1, title: "Process Diagnostic", description: "Comprehensive as-is mapping: value stream analysis, waste identification (7 wastes), capacity utilisation, cycle time, and quality yield. Baseline KPI capture." },
      { step: 2, title: "Value Stream Mapping", description: "End-to-end value stream map identifying current state vs ideal state. Prioritise improvement opportunities by impact and feasibility." },
      { step: 3, title: "Solution Design", description: "Design the future state: process redesign, standard work, error-proofing (poka-yoke), visual management, and KPI measurement systems." },
      { step: 4, title: "Pilot Implementation", description: "Run pilots on the highest-impact improvement area. Validate results against baseline. Refine before full rollout." },
      { step: 5, title: "Full-Scale Rollout", description: "Deploy improvements across the operation. Build standard operating procedures, visual management boards, and supervisor playbooks." },
      { step: 6, title: "Sustain & Continuous Improvement", description: "Establish Kaizen culture and governance. Train internal CI champions. Implement daily management systems to sustain gains." },
    ],
    deliverables: [
      "As-is process maps (value stream + swimlane format)",
      "Waste and inefficiency analysis report",
      "Future state process design documents",
      "Standard Operating Procedures (SOPs) — visual, A3 format",
      "Quality Management System design (ISO-aligned if required)",
      "KPI framework and measurement plan",
      "Supervisor and team leader training materials",
      "Continuous Improvement governance charter",
    ],
    sectorApplications: [
      {
        sector: "Manufacturing",
        challenges: ["OEE below 65%", "Rework and scrap rates", "Changeover time", "Inventory WIP"],
        useCases: ["5S workplace organisation program rolled out across factory floor", "SMED (Single Minute Exchange of Die) to reduce changeover time by 50%", "TPM: Total Productive Maintenance to increase OEE from 58% to 78%", "Lean quality circles reducing defect rate from 4.2% to <1%"],
        caseStudySnippet: "A plastic injection moulding manufacturer in Pune had OEE of 53% and a defect rate of 6.1%. Our 16-week process transformation program raised OEE to 74% and reduced defects to 0.9%, adding ₹3.2 Cr to annual EBITDA.",
      },
      {
        sector: "Retail",
        challenges: ["Replenishment lead time", "Store operations consistency", "Shrinkage", "Workforce productivity"],
        useCases: ["Replenishment process redesign reducing lead time from 7 days to 2 days", "Store operations standardisation across multi-location chains", "Loss prevention process design reducing shrinkage by 60%", "Workforce productivity improvement: tasks per hour metrics"],
        caseStudySnippet: "A 35-store supermarket chain had replenishment lead time of 9 days causing chronic stockouts. Our process redesign reduced lead time to 2 days, cutting lost sales by an estimated ₹2.1 Cr per year.",
      },
      {
        sector: "Logistics",
        challenges: ["Warehouse throughput", "Loading dock efficiency", "Documentation errors", "Last-mile visibility"],
        useCases: ["Warehouse slotting redesign: ABC analysis reducing travel time by 35%", "Loading dock standardisation eliminating 40-minute average delays", "Error-proofing documentation processes: POD accuracy to 99.8%", "Last-mile operations workflow redesign for D2C deliveries"],
        caseStudySnippet: "A Chennai-based cold chain logistics provider had warehouse throughput of 1,100 cases/hour against a target of 1,800. Our process redesign achieved 1,720 cases/hour within 10 weeks.",
      },
      {
        sector: "Consumer Products",
        challenges: ["New product introduction time", "Formulation compliance", "Packaging operations", "Co-manufacturing management"],
        useCases: ["NPD stage-gate process reducing time-to-market from 18 to 10 months", "Formulation change management process to maintain compliance", "Packaging operations lean transformation: 3 line changeover to 45 minutes", "Co-manufacturer governance framework with tiered audit process"],
        caseStudySnippet: "A specialty food brand was taking 22 months to launch new products, missing seasonal windows. Our NPD process redesign reduced time-to-market to 9 months — enabling them to launch 4 new SKUs in a single FY for the first time.",
      },
    ],
    relatedAssetSlugs: [
      "lean-manufacturing-implementation-guide",
      "supply-chain-optimisation-toolkit",
      "quality-management-system-template-pack",
      "employee-capability-building-roadmap",
    ],
    faqs: [
      { question: "Can process transformation be done without disrupting production?", answer: "Yes. We design all implementations as parallel workstreams — the improvement work happens alongside production, not instead of it. We pilot in contained areas before broad rollout to minimise disruption risk." },
      { question: "How long before we see results?", answer: "Quick wins typically appear within 4–8 weeks of starting implementation. Significant P&L impact — measurable improvement in cost, quality, or throughput — typically shows in 3–6 months." },
      { question: "Do we need to hire new people for this?", answer: "Rarely. Process transformation is about achieving more with existing people through better systems and structures. If capability gaps require new hires, we'll identify those precisely during the diagnostic phase." },
      { question: "We've tried lean before and it didn't stick. What's different?", answer: "Lean implementations fail when they're events (workshops, kaizen blitzes) rather than systems. We build the management discipline, visual management, and supervisor behaviours that sustain improvement after we leave." },
      { question: "Is ISO certification part of your scope?", answer: "We design QMS frameworks that are ISO 9001 / ISO 45001 compatible. If you want formal certification, we work alongside your chosen certification body — but we don't certify ourselves." },
      { question: "Can this work for a logistics or retail business, not just manufacturing?", answer: "Absolutely. Process transformation principles — standardisation, waste elimination, measurement, continuous improvement — apply in any operations-heavy environment. About 35% of our process work is in logistics and retail." },
    ],
  },

  // ── 4. Digital ─────────────────────────────────────────────────────────────
  {
    slug: "digital",
    name: "Digital",
    tagline: "Digital roadmaps that connect technology investments to business outcomes",
    heroDescription:
      "From ERP selection to e-commerce launch, from data analytics architecture to CRM design — we help you build and execute a digital roadmap that delivers measurable business outcomes. We're technology agnostic and vendor neutral: we recommend what's right for your business, not what earns us a commission.",
    heroCtaLabel: "Get a Digital Maturity Assessment",
    startingPrice: "₹90,000",
    sectors: ["Retail", "Consumer Products", "Manufacturing", "Logistics"],
    painPoints: [
      {
        headline: "\"We've invested in technology but can't point to the business impact\"",
        body: "Technology for its own sake is an expensive distraction. Every digital investment we recommend is anchored to a business KPI — cost reduction, revenue growth, time saving — with measurable success criteria defined before purchase.",
      },
      {
        headline: "\"Our data is everywhere and we can't make sense of it\"",
        body: "Data that can't be acted on is a cost, not an asset. Our data architecture work creates a single version of truth — connected, accessible, and structured to answer your most important business questions.",
      },
      {
        headline: "\"We need to go online but don't know D2C from B2B marketplace\"",
        body: "E-commerce is not a single decision — it's a series of interdependent choices about channel, platform, fulfilment, pricing, and customer experience. We map the full landscape and design the right model for your brand and supply chain.",
      },
      {
        headline: "\"Every vendor says they're the right choice — we can't evaluate objectively\"",
        body: "Vendor selection without a structured framework is a gamble. We run objective RFP processes — with weighted scoring against your actual requirements — that routinely save clients 25–40% versus self-selected vendor outcomes.",
      },
    ],
    approach: [
      { step: 1, title: "Digital Maturity Assessment", description: "Evaluate current digital maturity across 6 dimensions: Operations, Customer, Data, Financial Systems, Supply Chain, and Team Capability. Benchmark against sector peers." },
      { step: 2, title: "Business Requirement Mapping", description: "Translate business objectives into technology requirements. Define must-have vs nice-to-have capabilities. Establish success metrics." },
      { step: 3, title: "Technology Architecture Design", description: "Design the target technology stack — applications, integrations, and data flows. Build the integration map to eliminate silos." },
      { step: 4, title: "Vendor Evaluation & Selection", description: "Run structured RFP: vendor longlisting, weighted scorecard, demo evaluation, reference checks, commercial negotiation support." },
      { step: 5, title: "Implementation Planning", description: "Phase the implementation to manage risk and deliver early value. Resource plan, governance structure, change management approach." },
      { step: 6, title: "Go-Live & Adoption", description: "Hands-on go-live support. User training. Adoption monitoring. Post-implementation optimisation and lessons learned." },
    ],
    deliverables: [
      "Digital Maturity Assessment report with benchmarks",
      "Technology requirements document (functional + non-functional)",
      "Target architecture blueprint and integration map",
      "Vendor shortlist and RFP package",
      "Vendor evaluation scorecard and recommendation",
      "Implementation project plan with phases and resource plan",
      "Change management and training plan",
      "Post-go-live success dashboard and review protocol",
    ],
    sectorApplications: [
      {
        sector: "Retail",
        challenges: ["Omnichannel inventory visibility", "POS fragmentation", "Customer data unification", "Online/offline margin management"],
        useCases: ["Unified commerce platform: single inventory view across stores and D2C", "CRM unification: linking online and offline purchase history", "E-commerce platform selection: Shopify vs Unicommerce vs custom", "Loyalty programme digitalisation and analytics"],
        caseStudySnippet: "A 28-store footwear retailer had 4 disparate POS systems with no unified customer view. Our digital transformation delivered a unified commerce platform in 9 months, enabling personalised CRM that lifted repeat purchase rate by 24%.",
      },
      {
        sector: "Consumer Products",
        challenges: ["D2C platform selection", "Influencer ROI tracking", "Channel data integration", "Marketing automation"],
        useCases: ["D2C platform build: Shopify Plus or custom vs marketplace strategy", "Marketing data stack: GA4 + Meta Pixel + first-party data architecture", "Distributor portal digitalisation for secondary sales tracking", "Subscription commerce implementation for recurring revenue"],
        caseStudySnippet: "A skincare D2C brand rebuilt their marketing data stack with our data architecture team. Attribution accuracy improved from 40% to 89%, enabling media budget reallocation that reduced customer acquisition cost by 31%.",
      },
      {
        sector: "Manufacturing",
        challenges: ["ERP selection complexity", "Shop floor digitisation", "Customer order portal", "Supplier integration"],
        useCases: ["ERP selection: SAP vs Oracle vs Odoo vs Tally Prime — right-sized", "IoT sensor integration for OEE and predictive maintenance", "Customer self-service portal for order tracking and documentation", "EDI/API integration with key customers and suppliers"],
        caseStudySnippet: "A ₹120 Cr auto components manufacturer had run on Tally for 12 years and was outgrowing it. Our ERP selection process identified Odoo as the right balance of capability and cost. Implementation went live in 22 weeks, 12% under budget.",
      },
      {
        sector: "Logistics",
        challenges: ["TMS selection", "Proof of delivery digitalisation", "Customer portal", "GPS and tracking integration"],
        useCases: ["TMS evaluation and selection: Locus vs FarEye vs custom build", "Digital POD implementation eliminating paper trail, reducing disputes", "Customer visibility portal: real-time shipment tracking API", "Fleet telematics integration for fuel and route analytics"],
        caseStudySnippet: "A 3PL operating 180 vehicles went from paper POD to digital in 8 weeks. Billing disputes dropped by 78%. Days Sales Outstanding (DSO) fell from 54 to 31 days, freeing ₹1.8 Cr in working capital.",
      },
    ],
    relatedAssetSlugs: [
      "data-analytics-starter-kit",
      "ecommerce-launch-checklist",
      "competitive-landscape-analyzer",
      "ai-use-case-prioritisation-matrix",
    ],
    faqs: [
      { question: "Do you implement the technology or just advise?", answer: "We advise on strategy, architecture, and vendor selection — and we project-manage implementation alongside your chosen technology partners. For specific technologies like Shopify or Odoo, we have certified implementation partners we can recommend." },
      { question: "Are you vendor neutral?", answer: "Yes, entirely. We don't receive commission from any technology vendor. Our recommendations are based solely on what's right for your business requirements and budget." },
      { question: "How do you handle ERP projects that typically overrun?", answer: "ERP overruns typically stem from scope creep and poor requirements definition. Our structured requirements process locks scope before vendor selection, and our phased implementation approach delivers value in stages — reducing the risk of a big-bang failure." },
      { question: "What's the minimum business size for a digital transformation engagement?", answer: "Revenue of ₹10 Cr or above typically justifies a structured digital investment. Below that, we often recommend a lighter-touch Digital Roadmap Sprint (4 weeks) that focuses on the 3 highest-impact quick wins." },
      { question: "Can you help with ONDC, GeM, or government portal integrations?", answer: "Yes. We have specific experience with ONDC network participants, GeM marketplace sellers, and GST/e-invoicing integrations that are critical for the Indian MSME context." },
      { question: "How do you ensure the team actually uses the new system?", answer: "Change management and adoption are built into every engagement from day one — not bolted on at the end. We design training programmes, change champions networks, and adoption KPIs that we track for 90 days post go-live." },
    ],
  },

  // ── 5. Organisation Transformation ─────────────────────────────────────────
  {
    slug: "organisation-transformation",
    name: "Organisation Transformation",
    tagline: "People, culture, and capability building to sustain growth",
    heroDescription:
      "Scale demands new structures, new skills, and new ways of working. We help you build the organisation that your strategy requires — from org design and talent frameworks to leadership development and culture transformation. We work at the intersection of strategy and people, because execution depends on both.",
    heroCtaLabel: "Book an Organisation Health Check",
    startingPrice: "₹1,25,000",
    sectors: ["All Sectors"],
    painPoints: [
      {
        headline: "\"We're scaling fast but everyone reports to the founder\"",
        body: "The founder-centric org design that works at ₹10 Cr breaks at ₹50 Cr. Redesigning from a hub-and-spoke to a distributed, accountable structure is one of the most high-impact and underinvested moves a scaling business can make.",
      },
      {
        headline: "\"Good people keep leaving — and we don't fully understand why\"",
        body: "Retention problems are usually symptoms of structural issues — unclear career paths, poor management quality, misaligned performance systems, or a culture that doesn't match the organisation's stated values. Our culture diagnostics go below the surface.",
      },
      {
        headline: "\"Our managers are great individual contributors but struggle as people leaders\"",
        body: "Promoting your best performers into management without equipping them for the role is the most common talent mistake growing businesses make. Our management capability programs build practical people leadership skills that drive team performance.",
      },
      {
        headline: "\"Strategy is clear at the top — but doesn't translate into daily team decisions\"",
        body: "Execution failure is almost always an alignment failure. OKRs, performance management, and management cadences convert strategic intent into the daily decisions of your frontline teams.",
      },
    ],
    approach: [
      { step: 1, title: "Org Health Diagnostic", description: "360-degree organisational health assessment: structure, spans, culture, talent depth, engagement, and people systems. Benchmark against high-growth Indian companies of similar scale." },
      { step: 2, title: "Design Principles & Target Model", description: "Co-design with leadership: articulate the organisation design principles that must hold (e.g., customer proximity, speed, ownership). Design the target operating model." },
      { step: 3, title: "Org Structure Redesign", description: "Design the new structure: reporting lines, spans, role accountabilities, decision rights, and critical new roles required. Run a talent mapping exercise against the new structure." },
      { step: 4, title: "People Systems Design", description: "Design or redesign: performance management system, grading and compensation framework, career architecture, OKR methodology, and talent review process." },
      { step: 5, title: "Capability Building", description: "Design and deliver targeted capability programmes: management excellence, leadership acceleration, technical reskilling. Build internal L&D capability." },
      { step: 6, title: "Culture Activation", description: "Define culture explicitly: values, behaviours, rituals, and recognition. Cascade culture through management behaviours and performance system alignment." },
    ],
    deliverables: [
      "Organisational Health Assessment report",
      "Target Organisation Design (structure charts, RACI, accountabilities)",
      "Talent mapping against new structure with gap analysis",
      "Performance Management System design",
      "Career architecture and grading framework",
      "OKR implementation guide and cascade template",
      "Management capability development programme",
      "Culture Activation Plan: values, behaviours, rituals, recognition",
    ],
    sectorApplications: [
      {
        sector: "Manufacturing",
        challenges: ["Shop floor culture", "Multi-shift management", "Contractor workforce alignment", "Technical skill gaps"],
        useCases: ["Shift supervisor development programme for multi-shift operations", "Technical skills taxonomy and reskilling roadmap for Industry 4.0", "Contractor management governance and performance framework", "Kaizen culture embedding through visual management and idea systems"],
        caseStudySnippet: "A steel component manufacturer found that 60% of quality issues traced back to shift handover breakdown. A supervisor development programme and standardised handover protocol reduced quality-related downtime by 45% in 6 months.",
      },
      {
        sector: "Retail",
        challenges: ["High frontline attrition", "Store manager performance variance", "Customer service culture", "Multi-location culture consistency"],
        useCases: ["Store manager performance framework with KPIs and coaching cadence", "Frontline onboarding and 90-day capability programme to reduce early attrition", "Customer service culture programme linked to NPS improvement", "Regional VP operating model for managing 30+ store clusters"],
        caseStudySnippet: "A fashion retailer had 120% annual attrition in frontline staff. Our frontline talent programme — covering hiring, onboarding, and first-90-days experience — reduced attrition to 68% and cut training cost per hire by 40%.",
      },
      {
        sector: "Consumer Products",
        challenges: ["Functional silos slowing NPD", "Marketing-Sales misalignment", "D2C team culture vs legacy brand team", "Agency coordination"],
        useCases: ["Cross-functional NPD team design with shared OKRs and stage-gate governance", "Marketing-Sales alignment: joint planning and shared revenue ownership", "D2C centre of excellence design within a traditional CPG structure", "Agency management governance for multiple agency relationships"],
        caseStudySnippet: "A mid-size FMCG brand had Marketing and Sales operating as separate kingdoms with separate bonus pools. A shared P&L structure and joint business planning process increased national sales team NPS by 38 points in one year.",
      },
      {
        sector: "Logistics",
        challenges: ["Driver productivity culture", "Operations manager capability", "Night shift coordination", "Union relations"],
        useCases: ["Driver engagement programme linking pay, recognition, and safety behaviour", "Operations manager development: from coordinator to business manager", "24/7 operations governance model with handover standards", "IR framework for managing unionised workforce at scale"],
        caseStudySnippet: "A logistics company with 400 drivers had driver attrition of 45% annually. Our driver engagement redesign — covering pay transparency, career paths, and recognition — reduced attrition to 22% and improved on-time delivery by 8 points.",
      },
    ],
    relatedAssetSlugs: [
      "employee-capability-building-roadmap",
      "competitive-landscape-analyzer",
      "msme-growth-strategy-playbook",
      "supply-chain-optimisation-toolkit",
    ],
    faqs: [
      { question: "Isn't org transformation something we should manage internally with HR?", answer: "Internal HR teams are invaluable for execution — but rarely have the bandwidth or external perspective to design the transformation alongside running day-to-day operations. We bring the frameworks, benchmarks, and facilitation. Your HR team owns the execution with us alongside." },
      { question: "How do you handle the politics of restructuring?", answer: "Organisation redesign always has political dimensions — we anticipate them rather than ignore them. Our process is designed to build broad ownership among leadership before any design is announced, de-risking resistance significantly." },
      { question: "What's the difference between OD work and conventional HR consulting?", answer: "Organisation transformation connects people strategy directly to business strategy. We don't design org charts in isolation — every structural recommendation is grounded in the strategic choices the business is making and the capabilities required to execute them." },
      { question: "Can you help with redundancy processes if the restructure involves role elimination?", answer: "We advise on the process design, communication approach, and legal compliance requirements for any restructuring that involves role elimination. For complex situations, we work alongside your employment law counsel." },
      { question: "How long does a typical organisation transformation engagement last?", answer: "A phased engagement typically runs 4–9 months: 6–8 weeks for diagnostic and design, 3–6 months for implementation and capability building. Culture change is a 12–24 month journey — we help you start it well." },
      { question: "What if leadership isn't aligned on the need for change?", answer: "Leadership misalignment is the #1 risk to any transformation. We address this directly by facilitating a structured leadership alignment workshop as the first step — surfacing disagreements in a constructive environment before design begins." },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return servicesData.find((s) => s.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return servicesData.map((s) => s.slug);
}
