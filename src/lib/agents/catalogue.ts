/**
 * The Eccellere+ Agent Marketplace catalogue: ready-to-deploy agents mapped to the functional areas of a business.
 *
 * Taken from the capability preview on eccellere.in (21 agents in 7 areas). An agent is "pilot" only once a working tool exists for it
 * (then `tool` holds the tool's slug in the Tools marketplace); everything else is "soon". Areas marked `proposed` close gaps in the
 * original seven (customer service, risk and compliance, data and IT) so the map covers the whole business with no overlap between areas.
 */

export type AgentStatus = 'pilot' | 'soon';

export interface Agent {
  slug: string;
  name: string;
  does: string;
  status: AgentStatus;
  /** slug of the working tool in the Tools marketplace, once the pilot exists */
  tool?: string;
}

export interface FunctionArea {
  id: string;
  code: string;
  name: string;
  flow: string;
  purpose: string;
  /** true for areas added to complete the map; their agents are still to be defined */
  proposed?: boolean;
  agents: Agent[];
}

/** A pilot: a working tool exists, under the same slug in the Tools marketplace. */
const pilot = (slug: string, name: string, does: string): Agent => ({ slug, name, does, status: 'pilot', tool: slug });

export const AREAS: FunctionArea[] = [
  {
    id: 'plan', code: 'PLAN', name: 'Strategy to Plan', flow: 'Strategy → Plan',
    purpose: 'Corporate strategy, planning cadence, and capital allocation.',
    agents: [
      pilot('strategy-plan-cascade', 'Strategy Cascade Agent', 'Turns board-level strategy into OKRs and quarterly plans.'),
      pilot('scenario-planner', 'Scenario Planner Agent', 'Builds best, base and worst case scenarios from your financial and market inputs.'),
      pilot('capital-allocation-advisor', 'Capital Allocation Advisor', 'Recommends where to deploy capital across competing initiatives.'),
    ],
  },
  {
    id: 'product', code: 'PRODUCT', name: 'Concept to Product', flow: 'Concept → Product',
    purpose: 'Idea screening, product definition, and portfolio decisions.',
    agents: [
      pilot('concept-screener', 'Concept Screener Agent', 'Scores and ranks new product and service ideas against strategic fit.'),
      pilot('product-spec-generator', 'Product Spec Generator', 'Drafts a structured product requirements document from a concept brief.'),
      pilot('voice-of-customer-synthesizer', 'Voice of Customer Agent', 'Synthesises customer feedback into prioritised product themes.'),
    ],
  },
  {
    id: 'sales', code: 'SALES', name: 'Market to Cash', flow: 'Market → Cash',
    purpose: 'Lead generation through collections: the full revenue cycle.',
    agents: [
      pilot('lead-to-quote-assistant', 'Lead-to-Quote Assistant', 'Qualifies inbound leads and drafts quotes from your price book.'),
      pilot('pricing-optimizer', 'Pricing Optimizer Agent', 'Recommends price points using margin, demand, and competitor signals.'),
      pilot('collections-follow-up-agent', 'Collections Follow-up Agent', 'Drafts and sequences overdue-invoice follow-ups by risk tier.'),
    ],
  },
  {
    id: 'scm', code: 'SCM', name: 'Forecast to Deliver', flow: 'Forecast → Deliver',
    purpose: 'Demand planning, production, and fulfilment.',
    agents: [
      pilot('demand-forecaster', 'Demand Forecaster Agent', 'Projects short-term demand from sales history and seasonality.'),
      pilot('production-scheduler', 'Production Scheduler Agent', 'Sequences production runs against capacity and order priority.'),
      pilot('otif-tracker', 'OTIF Tracker Agent', 'Monitors on-time-in-full delivery performance and flags at-risk orders.'),
    ],
  },
  {
    id: 'procure', code: 'PROCURE', name: 'Procure to Pay', flow: 'Procure → Pay',
    purpose: 'Sourcing, purchasing, and vendor payments.',
    agents: [
      pilot('vendor-onboarding-agent', 'Vendor Onboarding Agent', 'Runs new-vendor KYC, compliance checks, and onboarding checklists.'),
      pilot('po-invoice-matcher', 'PO-Invoice Matcher', 'Three-way matches purchase orders, goods receipts and invoices, flagging mismatches.'),
      pilot('supplier-risk-monitor', 'Supplier Risk Monitor', 'Tracks supplier financial and delivery risk signals over time.'),
    ],
  },
  {
    id: 'fin', code: 'FIN', name: 'Account to Report', flow: 'Account → Report',
    purpose: 'Bookkeeping, close, compliance, and management reporting.',
    agents: [
      pilot('close-the-books-agent', 'Close-the-Books Agent', 'Runs month-end close checklists and flags unreconciled entries.'),
      pilot('caro-compliance-checker', 'CARO Compliance Checker', 'Screens financials against CARO reporting requirements.'),
      pilot('mis-report-generator', 'MIS Report Generator', 'Compiles a monthly management information pack from your ledgers.'),
    ],
  },
  {
    id: 'hr', code: 'HR', name: 'Hire to Retire', flow: 'Hire → Retire',
    purpose: 'Recruitment through exit: the full employee lifecycle.',
    agents: [
      pilot('hire-to-onboard-agent', 'Hire-to-Onboard Agent', 'Runs structured onboarding checklists for new joiners.'),
      pilot('attendance-payroll-reconciler', 'Attendance-Payroll Reconciler', 'Cross-checks attendance records against payroll runs for discrepancies.'),
      pilot('exit-interview-analyzer', 'Exit Interview Analyzer', 'Synthesises exit interview themes into attrition-risk insights.'),
    ],
  },
  { id: 'service', code: 'SERVICE', name: 'Customer to Service', flow: 'Customer → Service', proposed: true,
    purpose: 'Support, warranty and after-sales service. Agents to be defined.', agents: [] },
  { id: 'risk', code: 'RISK', name: 'Risk to Assurance', flow: 'Risk → Assurance', proposed: true,
    purpose: 'Enterprise risk, regulatory compliance and internal audit. Agents to be defined.', agents: [] },
  { id: 'data', code: 'DATA', name: 'Data to Decision', flow: 'Data → Decision', proposed: true,
    purpose: 'Data, systems and analytics that every other area depends on. Agents to be defined.', agents: [] },
];

export const allAgents = (): Agent[] => AREAS.flatMap((a) => a.agents);
export const pilotCount = (): number => allAgents().filter((a) => a.status === 'pilot').length;

/**
 * Industry agents: the same kind of working worksheet, shaped around the measures one industry runs on. They sit beside the functional
 * areas, not inside them, so a business can start from its industry or from a function. Each uses the same fixed-formula engine.
 */
export const INDUSTRIES: FunctionArea[] = [
  {
    id: 'ind-manufacturing', code: 'MFG', name: 'Manufacturing', flow: 'Make → Ship',
    purpose: 'Plant effectiveness, yield and maintenance: where the floor loses time and money.',
    agents: [
      pilot('oee-calculator', 'OEE Calculator', 'Works out overall equipment effectiveness from availability, performance and quality, and shows the biggest loss.'),
      pilot('scrap-yield-analyzer', 'Scrap and Yield Analyzer', 'Ranks scrap and rework causes by cost and shows first-pass yield.'),
      pilot('maintenance-priority-ranker', 'Maintenance Priority Ranker', 'Ranks equipment for maintenance by criticality and failure risk.'),
    ],
  },
  {
    id: 'ind-retail', code: 'RTL', name: 'Retail', flow: 'Stock → Sell',
    purpose: 'Store productivity, stock cover and shrinkage: what each shop earns and loses.',
    agents: [
      pilot('store-performance-scorecard', 'Store Performance Scorecard', 'Compares stores on sales per square foot, conversion and basket size.'),
      pilot('stock-cover-markdown-planner', 'Stock Cover and Markdown Planner', 'Shows weeks of stock cover per item and flags slow stock for markdown.'),
      pilot('shrinkage-tracker', 'Shrinkage Tracker', 'Measures stock loss by cause and store against sales.'),
    ],
  },
  {
    id: 'ind-consumer-goods', code: 'CPG', name: 'Consumer Goods', flow: 'Promote → Distribute',
    purpose: 'Promotions, range and distributors: where trade spend and shelf space earn their keep.',
    agents: [
      pilot('trade-promotion-roi', 'Trade Promotion ROI', 'Compares extra sales margin with promotion spend to show which promotions paid back.'),
      pilot('sku-rationalisation', 'SKU Rationalisation', 'Ranks products by margin and sales speed to find the range worth keeping.'),
      pilot('distributor-health-check', 'Distributor Health Check', 'Scores distributors on fill rate, receivable days and sales growth.'),
    ],
  },
  {
    id: 'ind-logistics', code: 'LOG', name: 'Logistics', flow: 'Collect → Deliver',
    purpose: 'Lanes, fleet and warehouse: cost, utilisation and productivity of moving goods.',
    agents: [
      pilot('lane-profitability', 'Lane Profitability', 'Shows revenue, cost and margin per lane so unprofitable routes stand out.'),
      pilot('fleet-utilisation', 'Fleet Utilisation', 'Works out running days, load factor and cost per kilometre for each vehicle.'),
      pilot('warehouse-productivity', 'Warehouse Productivity', 'Measures picks per labour hour and order accuracy by shift.'),
    ],
  },
  {
    id: 'ind-technology-services', code: 'TSV', name: 'Technology Services', flow: 'Sell → Deliver',
    purpose: 'People, projects and service levels: how a services business turns hours into margin.',
    agents: [
      pilot('utilisation-bench', 'Utilisation and Bench', 'Shows billable utilisation by team and the cost of idle bench time.'),
      pilot('project-margin-forecast', 'Project Margin Forecast', 'Forecasts final cost and margin of a fixed-price project from work done so far.'),
      pilot('sla-breach-tracker', 'SLA Breach Tracker', 'Counts service-level breaches by client and cause against targets.'),
    ],
  },
];

export const industryAgents = (): Agent[] => INDUSTRIES.flatMap((a) => a.agents);
/** Every agent, functional and industry: what the detail page, the admin list and the install step work over. */
export const everyAgent = (): Agent[] => [...allAgents(), ...industryAgents()];
export const everyArea = (): FunctionArea[] => [...AREAS, ...INDUSTRIES];
