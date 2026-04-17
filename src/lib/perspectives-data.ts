export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; text: string };

export type Article = {
  id: string;
  slug: string;
  category: string;
  title: string;
  teaser: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured: boolean;
  content: ContentBlock[];
  tags: string[];
  relatedSlugs: string[];
};

export const articles: Article[] = [
  {
    id: "1",
    slug: "why-indian-msmes-should-adopt-agentic-ai",
    category: "Agentic AI",
    title: "Why Indian MSMEs Should Adopt Agentic AI Before Their Competitors Do",
    teaser:
      "The window of advantage is narrow. Here's how early movers are gaining 30% efficiency improvements across manufacturing and logistics.",
    author: "Eccellere Research",
    authorRole: "Research & Insights Team",
    date: "Mar 2026",
    readTime: "6 min read",
    featured: true,
    content: [
      {
        type: "paragraph",
        text: "India's MSME sector stands at an inflection point. For the first time in decades, a technology shift — Agentic AI — offers small and mid-size businesses a genuine opportunity to leapfrog the operational gap with larger competitors. But the window is narrow, and early movers are already pulling ahead.",
      },
      {
        type: "heading",
        text: "What is Agentic AI?",
      },
      {
        type: "paragraph",
        text: "Unlike traditional AI tools that respond to queries, Agentic AI systems can plan, act, and adapt autonomously across multi-step tasks. Think of them as intelligent process workers: an AI agent that monitors your inventory, identifies a potential stockout, raises a purchase order with the right supplier at the right price — and emails the confirmation — all without human intervention.",
      },
      {
        type: "paragraph",
        text: "For MSMEs, this is transformative. The average manufacturing MSME employs 3–5 people to handle tasks that Agentic AI can execute more accurately, faster, and around the clock.",
      },
      {
        type: "heading",
        text: "The numbers from early adopters",
      },
      {
        type: "paragraph",
        text: "Eccellere has worked with 23 Indian MSMEs who implemented Agentic AI workflows in 2025. The results are striking: average 30% reduction in manual processing time, 18% reduction in inventory holding costs, and 22% faster quote-to-order cycles. These aren't pilot numbers — they're operational outcomes sustained over 9+ months.",
      },
      {
        type: "callout",
        text: "The businesses seeing the biggest gains weren't technology companies. They were a ₹45Cr auto-components manufacturer in Pune, a ₹20Cr D2C food brand in Bengaluru, and a ₹60Cr logistics firm in Chennai.",
      },
      {
        type: "heading",
        text: "Where to start: the three highest-ROI use cases",
      },
      {
        type: "paragraph",
        text: "Based on our engagement data, the three AI use cases that deliver the fastest positive ROI for Indian MSMEs are: (1) Intelligent demand forecasting and inventory management, which reduces overstock and stockouts simultaneously. (2) Automated supplier communication and purchase order management, eliminating a major source of human error. (3) Customer inquiry handling and order status automation, which improves response times by 10× and frees your customer service team for complex issues.",
      },
      {
        type: "heading",
        text: "The risk of waiting",
      },
      {
        type: "paragraph",
        text: "In most sectors, there is a 12–18 month window where early AI adopters gain a cost and speed advantage that becomes self-reinforcing — the data they collect makes their AI smarter, widening the gap further. If you start your AI journey in 2027, you will be competing against businesses that have 2 years of AI-optimised operations data. That's a hard gap to close.",
      },
      {
        type: "paragraph",
        text: "Start with an AI Readiness Assessment to understand your baseline. Then pick one use case, implement it well, and build from there. The businesses that will lead their sectors in 2028 are the ones starting today.",
      },
    ],
    tags: ["Agentic AI", "Manufacturing", "MSME", "Strategy"],
    relatedSlugs: ["10-highest-roi-ai-use-cases-for-mid-size-businesses", "lean-manufacturing-2026-what-changed"],
  },
  {
    id: "2",
    slug: "5-growth-frameworks-every-msme-founder-should-know",
    category: "Strategy",
    title: "5 Growth Frameworks Every MSME Founder Should Know",
    teaser:
      "From Ansoff to Blue Ocean — applied to the Indian context with real examples from sub-₹100Cr businesses.",
    author: "Eccellere Editorial",
    authorRole: "Editorial Team",
    date: "Feb 2026",
    readTime: "4 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Strategy frameworks aren't just for MBAs and big corporates. Some of the most useful strategic thinking tools available are directly applicable to MSMEs — with the right contextualisation for Indian business realities.",
      },
      {
        type: "heading",
        text: "1. Ansoff Matrix — for growth direction decisions",
      },
      {
        type: "paragraph",
        text: "The Ansoff Matrix helps you categorise and risk-assess your growth options: market penetration (sell more of what you make to existing customers), market development (take existing products to new segments or geographies), product development (new offerings to existing customers), and diversification. For MSMEs, this is particularly useful when board or founder discussions about growth become vague — the matrix forces specificity.",
      },
      {
        type: "heading",
        text: "2. Jobs-to-be-Done — for product and service design",
      },
      {
        type: "paragraph",
        text: "Customers don't buy products — they 'hire' them to do a job. A manufacturer buying an ERP system isn't buying software; they're hiring a solution to the job of 'give me real-time visibility into my production status so I don't miss shipping deadlines.' Understanding the job changes how you sell, price, and design.",
      },
      {
        type: "heading",
        text: "3. Porter's Five Forces — for strategic positioning",
      },
      {
        type: "paragraph",
        text: "Understanding the competitive dynamics of your industry helps you find the structural positions of strength. For an Indian manufacturer, this framework reveals whether your real threat is rival manufacturers, powerful distributors, cheap imports, or the risk of customers integrating backward.",
      },
      {
        type: "heading",
        text: "4. OKRs — for strategy execution",
      },
      {
        type: "paragraph",
        text: "Objectives and Key Results translate strategy into measurable quarterly commitments that everyone in the business can see and contribute to. For MSMEs scaling from ₹20Cr to ₹100Cr, OKRs are the most effective way to align a growing team around the same priorities.",
      },
      {
        type: "heading",
        text: "5. Blue Ocean Strategy — for escaping price wars",
      },
      {
        type: "paragraph",
        text: "If you're competing purely on price in a commoditised market, Blue Ocean asks: what if you redefined the competitive space entirely? Dozens of Indian SMEs have used this framework to create uncontested market space — by adding services, targeting different buyer profiles, or repositioning entirely.",
      },
      {
        type: "callout",
        text: "All five frameworks are available as India-contextualised templates in the Eccellere Marketplace. You can work through any of them in a half-day workshop.",
      },
    ],
    tags: ["Strategy", "Growth", "Frameworks", "MSME"],
    relatedSlugs: ["why-indian-msmes-should-adopt-agentic-ai", "competitive-analysis-in-30-minutes"],
  },
  {
    id: "3",
    slug: "lean-manufacturing-2026-what-changed",
    category: "Manufacturing",
    title: "Lean Manufacturing in 2026: What's Changed for Indian Factories",
    teaser:
      "Digital twins, IoT sensors, and the new lean playbook — a practical guide for factory owners.",
    author: "Eccellere Research",
    authorRole: "Research & Insights Team",
    date: "Feb 2026",
    readTime: "5 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Lean manufacturing has been transforming factories for 40 years. But the lean playbook of 2026 looks meaningfully different from the Toyota Production System of the 1980s — and the changes are particularly relevant for Indian manufacturers who are often implementing lean for the first time while simultaneously navigating digitalisation.",
      },
      {
        type: "heading",
        text: "Digital-physical integration changes the game",
      },
      {
        type: "paragraph",
        text: "Traditional lean relied on visual management — physical kanban cards, whiteboard dashboards, gemba walks. In 2026, these physical tools now have digital counterparts. IoT sensors provide real-time OEE data that previously required a dedicated measurement team. Digital andon systems alert supervisors instantly. The result: faster problem detection, lower administrative burden, and much richer data for continuous improvement.",
      },
      {
        type: "heading",
        text: "What hasn't changed",
      },
      {
        type: "paragraph",
        text: "The fundamentals remain unchanged: eliminating waste (muda), creating flow, establishing pull systems, and pursuing perfection through continuous improvement. No technology replaces the discipline of walking the floor, understanding root causes, and engaging the frontline workforce in problem-solving. The factories that are getting lean wrong in 2026 are the ones buying expensive technology before fixing the basics.",
      },
      {
        type: "callout",
        text: "Rule of thumb: if your value stream mapping shows more than 30% non-value-adding time, investing in IoT before fixing your process design is premature.",
      },
      {
        type: "heading",
        text: "For Indian manufacturers: focus on three priorities",
      },
      {
        type: "paragraph",
        text: "Based on our work with 30+ Indian manufacturing MSMEs in the last 12 months, the highest-impact lean priorities for Indian factories are: (1) Setup time reduction (SMED) — Indian SMEs average 4× longer changeover times than comparator businesses in China and Vietnam. (2) Quality at source — implementing mistake-proofing (poka-yoke) at the production step rather than relying on end-of-line inspection. (3) Visible performance management — simple daily management systems that every supervisor and manager can act on within their shift.",
      },
    ],
    tags: ["Manufacturing", "Lean", "Operations", "Digital"],
    relatedSlugs: ["why-indian-msmes-should-adopt-agentic-ai", "supply-chain-resilience-2025"],
  },
  {
    id: "4",
    slug: "10-highest-roi-ai-use-cases-for-mid-size-businesses",
    category: "Agentic AI",
    title: "The 10 Highest-ROI AI Use Cases for Mid-Size Businesses",
    teaser:
      "Forget chatbots. These AI applications deliver measurable returns in under 6 months for businesses doing ₹5–100Cr in revenue.",
    author: "Eccellere AI Lab",
    authorRole: "AI Research & Advisory",
    date: "Jan 2026",
    readTime: "8 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "The AI use case that gets the most attention — the customer service chatbot — is rarely the highest-ROI application for mid-size Indian businesses. Based on 18 months of AI implementation data across manufacturing, retail, and logistics MSMEs, here are the ten use cases that consistently deliver measurable payback within 6 months.",
      },
      {
        type: "heading",
        text: "1. Demand forecasting",
      },
      {
        type: "paragraph",
        text: "AI-based demand forecasting reduces inventory holding costs by 15–25% while improving in-stock rates. For a business with ₹5Cr in inventory, this is a ₹75L–₹125L annual saving. Implementation: 4–8 weeks with clean historical sales data.",
      },
      {
        type: "heading",
        text: "2. Accounts payable automation",
      },
      {
        type: "paragraph",
        text: "AI invoice processing eliminates manual data entry, catches mismatches before payment, and cuts processing cost per invoice from ₹150–200 to ₹20–30. For businesses processing 500+ invoices a month, ROI is typically under 3 months.",
      },
      {
        type: "heading",
        text: "3. Predictive maintenance",
      },
      {
        type: "paragraph",
        text: "Manufacturing MSMEs lose an average 8% of production capacity to unplanned downtime. AI-based predictive maintenance using vibration and temperature sensors can reduce unplanned downtime by 35–50%, with payback in under 4 months at typical Indian machine utilisation rates.",
      },
      {
        type: "callout",
        text: "Key insight: The common thread across high-ROI AI implementations is that they target repetitive, data-heavy processes where humans are currently adding minimal judgement value. Start there.",
      },
      {
        type: "heading",
        text: "The four that didn't make the list",
      },
      {
        type: "paragraph",
        text: "Generative AI content creation, HR recruitment screening, customer service chatbots, and market research automation are all useful tools — but they are rarely the first or highest-ROI AI application for an Indian MSME. They can wait until your core operational AI is working.",
      },
    ],
    tags: ["Agentic AI", "ROI", "Manufacturing", "Operations"],
    relatedSlugs: ["why-indian-msmes-should-adopt-agentic-ai", "5-growth-frameworks-every-msme-founder-should-know"],
  },
  {
    id: "5",
    slug: "building-d2c-brand-india-zero-to-1cr-monthly",
    category: "Retail",
    title: "Building a D2C Brand in India: From Zero to ₹1Cr Monthly Revenue",
    teaser:
      "A step-by-step playbook based on 12 Indian D2C success stories, including channel strategy, pricing, and fulfilment.",
    author: "Eccellere Editorial",
    authorRole: "Editorial Team",
    date: "Jan 2026",
    readTime: "7 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "India's D2C wave is real, but for every brand that reaches ₹1Cr monthly revenue, ten fail to get past ₹10L. The difference is rarely the product — it's the go-to-market strategy, unit economics, and execution discipline.",
      },
      {
        type: "heading",
        text: "The unit economics that matter",
      },
      {
        type: "paragraph",
        text: "Before you obsess over CAC and LTV ratios, get your gross margin right. D2C brands in India typically need 55%+ gross margin to build a sustainable business after accounting for paid acquisition costs, platform commissions, and returns. If your manufacturing cost plus fulfilment is more than 45% of retail price, fix that first.",
      },
      {
        type: "heading",
        text: "Channel strategy: the right sequence matters",
      },
      {
        type: "paragraph",
        text: "The most successful Indian D2C brands don't start with expensive Meta ads. They start with organic content and communities (typically Instagram and WhatsApp), build a small but highly engaged customer base, learn from them, then invest in paid acquisition only once they have product-market fit evidence.",
      },
      {
        type: "callout",
        text: "The brands that scaled fastest to ₹1Cr/month in our study all had one thing in common: they treated their first 100 customers as a research study, not a revenue target.",
      },
    ],
    tags: ["Retail", "D2C", "Strategy", "Marketing"],
    relatedSlugs: ["5-growth-frameworks-every-msme-founder-should-know", "competitive-analysis-in-30-minutes"],
  },
  {
    id: "6",
    slug: "erp-for-msmes-when-to-implement-2026",
    category: "Digital",
    title: "ERP for MSMEs: When to Implement and What to Choose in 2026",
    teaser:
      "The real cost of delayed ERP adoption, and a comparison framework for the top 5 options for Indian businesses.",
    author: "Eccellere Research",
    authorRole: "Research & Insights Team",
    date: "Dec 2025",
    readTime: "6 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "The most common ERP mistake made by Indian MSMEs is implementing too early — before processes are standardised — or too late — when the operational chaos has become a growth blocker. Getting the timing right is as important as the platform choice.",
      },
      {
        type: "heading",
        text: "The right time to implement ERP",
      },
      {
        type: "paragraph",
        text: "Three signals that you are ready for ERP: (1) You have 3+ departments that need to share data in real time (finance, operations, sales). (2) Month-end closing takes more than 5 business days. (3) You've hired more than one person primarily to reconcile data between systems. If two of these are true, you're ready.",
      },
      {
        type: "heading",
        text: "The top 5 options for Indian MSMEs in 2026",
      },
      {
        type: "paragraph",
        text: "For manufacturing MSMEs (₹10Cr–₹200Cr): Odoo remains the most cost-effective option with strong manufacturing modules. SAP Business One has the depth but requires a skilled implementation partner. For trading/distribution businesses: Tally Prime's ERP tier handles most needs at low cost. For retail and D2C: Unicommerce + accounting tools is often better than over-engineered ERP before ₹50Cr revenue.",
      },
    ],
    tags: ["Digital", "ERP", "Technology", "MSME"],
    relatedSlugs: ["10-highest-roi-ai-use-cases-for-mid-size-businesses", "5-growth-frameworks-every-msme-founder-should-know"],
  },
  {
    id: "7",
    slug: "hiring-your-first-cto-non-tech-founders",
    category: "Leadership",
    title: "Hiring Your First CTO: A Guide for Non-Tech Founders",
    teaser:
      "What to look for, what to pay, and the 3 critical mistakes that kill your first tech hire.",
    author: "Eccellere Editorial",
    authorRole: "Editorial Team",
    date: "Dec 2025",
    readTime: "5 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "For non-technical founders, hiring the first senior technology leader is one of the highest-stakes decisions in a business's history. Get it right and you accelerate. Get it wrong and you can lose 12–18 months of momentum while spending ₹50–80L on misaligned compensation.",
      },
      {
        type: "heading",
        text: "What a CTO at a growing MSME actually does",
      },
      {
        type: "paragraph",
        text: "In a ₹20–100Cr business, the CTO is primarily a leader, architect, and translator — not a coder. They translate business requirements into technology decisions, build and lead the tech team, and ensure the technology backbone scales as the business grows. If you need someone to write code, hire a senior engineer.",
      },
      {
        type: "heading",
        text: "The 3 mistakes that kill first tech hires",
      },
      {
        type: "paragraph",
        text: "Mistake 1: Hiring from large tech companies. Enterprise tech skills don't always map to the resource-constrained, move-fast context of an MSME. Look for people who have built things from scratch, not just maintained large systems. Mistake 2: Hiring a VP without a team. A CTO without engineers to lead becomes an expensive individual contributor. Hire a senior engineer first; promote or hire a CTO when you have 3–4 engineers. Mistake 3: Giving equity without vesting. Standard is 4-year vesting with a 1-year cliff. Non-negotiable.",
      },
    ],
    tags: ["Leadership", "Hiring", "Technology", "Strategy"],
    relatedSlugs: ["5-growth-frameworks-every-msme-founder-should-know", "erp-for-msmes-when-to-implement-2026"],
  },
  {
    id: "8",
    slug: "competitive-analysis-in-30-minutes",
    category: "Strategy",
    title: "Competitive Analysis in 30 Minutes: The MSME Shortcut",
    teaser:
      "You don't need a 6-week study. Use this rapid framework to map your competitive landscape this afternoon.",
    author: "Eccellere Research",
    authorRole: "Research & Insights Team",
    date: "Nov 2025",
    readTime: "3 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Most competitive analysis frameworks were designed for companies with strategy consulting budgets. The good news: for an MSME founder who knows their market, a rigorous competitive assessment can be done in under 30 minutes with the right structure.",
      },
      {
        type: "heading",
        text: "The 30-minute rapid competitive assessment",
      },
      {
        type: "paragraph",
        text: "Step 1 (5 mins): List your 5 highest-threat competitors. Not all competitors — the five you actually lose business to. Step 2 (10 mins): For each, rate them 1–5 on price competitiveness, product/service quality, distribution reach, brand strength, and customer service. Step 3 (10 mins): Plot the results on a 2×2 against your own scores. Where are you genuinely differentiated? Where are you vulnerable? Step 4 (5 mins): Identify one competitive threat to address in the next 90 days and one advantage to double down on.",
      },
      {
        type: "callout",
        text: "The purpose of competitive analysis is action, not knowledge. If your analysis doesn't change at least one decision this quarter, it was too abstract.",
      },
    ],
    tags: ["Strategy", "Competitive Analysis", "MSME", "Frameworks"],
    relatedSlugs: ["5-growth-frameworks-every-msme-founder-should-know", "building-d2c-brand-india-zero-to-1cr-monthly"],
  },
  {
    id: "9",
    slug: "supply-chain-resilience-2025",
    category: "Manufacturing",
    title: "Supply Chain Resilience: Lessons from Indian Manufacturers Who Survived 2025",
    teaser:
      "What the best-prepared factories did differently when disruptions hit — and the frameworks they used.",
    author: "Eccellere Research",
    authorRole: "Research & Insights Team",
    date: "Nov 2025",
    readTime: "6 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "2025 was a stress test for Indian supply chains. Component shortages, logistics disruptions, and demand swings separated the prepared manufacturers from the reactive ones. We interviewed 15 manufacturing MSMEs who emerged stronger — here's what they did differently.",
      },
      {
        type: "heading",
        text: "The resilience investments that paid off",
      },
      {
        type: "paragraph",
        text: "The most resilient manufacturers had three things in common: dual-sourcing for their top 10 components by spend (not just single-source with a backup shortlist), buffer inventory policies based on category risk rather than uniform days-on-hand rules, and real-time supply chain visibility — even if basic — that gave them 2–3 weeks warning of emerging shortages.",
      },
      {
        type: "heading",
        text: "The framework: supply chain risk tiers",
      },
      {
        type: "paragraph",
        text: "Categorise every significant input into four risk tiers: (Tier 1) Critical, single-source, long lead-time — these require strategic safety stock and active supplier development. (Tier 2) Important, limited alternatives — dual source immediately. (Tier 3) Standard, multiple suppliers — optimise cost. (Tier 4) Commodity, abundant supply — minimum inventory, just-in-time. Most MSMEs discover they have been managing all categories the same way when they run this exercise.",
      },
    ],
    tags: ["Manufacturing", "Supply Chain", "Operations", "Risk"],
    relatedSlugs: ["lean-manufacturing-2026-what-changed", "10-highest-roi-ai-use-cases-for-mid-size-businesses"],
  },
];
