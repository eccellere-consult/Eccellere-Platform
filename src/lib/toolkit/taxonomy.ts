/** Industry and topic lists for the Configure-Your-Own-Toolkit wizard (skill s5.1 domains). */

export const INDUSTRIES = [
  "Manufacturing",
  "Retail",
  "Consumer products / FMCG",
  "Logistics and supply chain",
  "Agriculture and food processing",
  "Healthcare and pharma",
  "Education and training",
  "IT and professional services",
  "Construction and real estate",
  "Financial services",
  "Hospitality and tourism",
  "Energy and utilities",
  "Other",
] as const;

export const TOPIC_GROUPS: Array<{ domain: string; topics: string[] }> = [
  { domain: "Strategy and growth", topics: ["Growth strategy and new markets", "Business model redesign", "Competitive positioning", "Export readiness", "Pricing strategy"] },
  { domain: "Leadership and organisation", topics: ["Organisation design", "Succession and family business governance", "Performance management"] },
  { domain: "Finance and working capital", topics: ["Working capital and cash flow", "Cost reduction and margin improvement", "Funding readiness", "Budgeting and financial controls"] },
  { domain: "Sales, marketing and customer", topics: ["Sales pipeline and conversion", "Customer retention and experience", "Brand and digital marketing", "Channel and distributor strategy"] },
  { domain: "Procurement and supply chain", topics: ["Procurement and supplier performance", "Inventory optimisation", "Demand planning and S&OP", "Logistics cost and delivery performance"] },
  { domain: "Manufacturing and quality", topics: ["Scrap, rework and quality", "Lean and productivity", "Maintenance and equipment effectiveness", "Safety and compliance"] },
  { domain: "Digital, data and AI", topics: ["AI readiness and use cases", "Digital transformation roadmap", "ERP selection and readiness", "Data and analytics maturity"] },
  { domain: "People, skills and change", topics: ["Hiring and talent retention", "Skills and capability building", "Change management and adoption"] },
  { domain: "Risk, compliance and governance", topics: ["Risk management", "Regulatory compliance", "Internal controls and audit readiness"] },
  { domain: "Sustainability and resilience", topics: ["Sustainability and ESG readiness", "Business continuity and resilience"] },
];

export const OTHER_TOPIC = "Other (describe below)";

export const CLARITY_LABEL: Record<string, string> = {
  clear: "Yes, clear",
  unclear: "No, not yet",
  unsure: "Not sure",
};
