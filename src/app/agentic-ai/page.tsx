"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  ClipboardCheck,
  BookOpen,
  RefreshCw,
  Crown,
  Factory,
  ShoppingBag,
  Package,
  Truck,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight,
  Star,
  ChevronLeft,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/marketplace-data";

/* ─── Data ─────────────────────────────────────────────────── */

const offerings = [
  {
    icon: ClipboardCheck,
    number: "01",
    title: "Agentic AI Readiness Assessment",
    tagline: "Know exactly where you stand before you invest a rupee",
    description:
      "A structured diagnostic that maps your business across six AI readiness dimensions — data maturity, process digitisation, leadership alignment, talent readiness, infrastructure, and governance. Produces a scored report, sector benchmark comparison, and a prioritised 90-day AI roadmap specific to your industry and scale.",
    summary:
      "Most MSMEs waste their first AI investment because they start with the wrong problem. This assessment identifies your highest-ROI AI opportunity — not in theory, but grounded in your actual data quality, workflows, and team capability.",
    outputs: [
      "6-dimension AI Readiness Score benchmarked against sector peers",
      "Capability gap analysis — what's missing and how to close it fast",
      "Top 3 high-ROI AI opportunities ranked by effort vs. impact",
      "90-day implementation roadmap with week-by-week milestones",
      "Investment sizing guide: budget, tools, and talent requirements",
    ],
    sectorExamples: [
      {
        sector: "Manufacturing",
        example:
          "Auto ancillary unit: data maturity score 2/5 → priority AI opportunity = production planning agent to eliminate overtime and missed deliveries.",
      },
      {
        sector: "Retail",
        example:
          "Fashion boutique chain: process digitisation score 3/5 → priority = inventory velocity AI to cut dead stock by 30%.",
      },
      {
        sector: "Consumer Products",
        example:
          "Regional FMCG brand: distribution reach score 1/5 → priority = AI-driven distributor performance monitoring before scaling outlets.",
      },
      {
        sector: "Logistics",
        example:
          "Last-mile delivery startup: talent score 4/5, infra score 2/5 → priority = route optimisation agent before any AI upskilling investment.",
      },
    ],
    cta: "Take Free Assessment",
    href: "/assessment",
    color: "bg-eccellere-gold/5 border-eccellere-gold/30",
    featured: false,
  },
  {
    icon: BookOpen,
    number: "02",
    title: "Ready-to-Use AI Skills Library",
    tagline: "20 pre-built, tested AI skills across 4 MSME sectors",
    description:
      "Each AI skill is a complete, plug-in capability that instantly gives your team — or your AI agent — deep operational expertise in a specific domain. No prompting. No configuration. No AI expertise needed. Select a skill, describe your challenge, and receive structured India-contextualised outputs within minutes. Built on real MSME operational knowledge, not generic templates.",
    summary:
      "Enterprise AI teams take months to build domain knowledge. Our Skills Library gives MSME founders that knowledge pre-packaged — a Manufacturing Production Planner, a Retail Inventory Velocity Manager, a D2C Revenue Engine, and 17 more — all instantly deployable with zero technical setup.",
    outputs: [
      "Manufacturing (5 skills): Production Planner, Inventory Controller, Quality System Builder, Supplier Development, Cost & Profitability Analyser",
      "Retail (5 skills): Store Performance Optimizer, Inventory Velocity Manager, Loyalty & Customer Growth, Digital Presence Activator, Credit & Collections Manager",
      "Consumer Products (5 skills): Brand Launch Planner, Distribution Builder, D2C Revenue Engine, Price & Revenue Optimizer, Trade Marketing Planner",
      "Logistics (5 skills): Route & Network Optimizer, Fleet Performance Manager, Warehouse Ops Planner, Last-Mile Delivery Agent, Logistics Cost Reducer",
      "Each skill outputs structured reports, trackers, and decision frameworks in WhatsApp-deliverable format",
    ],
    sectorExamples: [
      {
        sector: "Manufacturing",
        example:
          "manufacturing-production-planner: inputs machine list + order book → outputs Master Production Schedule, OEE improvement roadmap, bottleneck analysis, daily target card in WhatsApp format.",
      },
      {
        sector: "Retail",
        example:
          "retail-inventory-velocity-manager: inputs POS data → outputs ABC-XYZ SKU classification, reorder level formulas, dead stock liquidation matrix, shrinkage investigation checklist.",
      },
      {
        sector: "Consumer Products",
        example:
          "consumer-products-d2c-revenue-engine: inputs Shopify/WooCommerce data → outputs D2C funnel diagnostic, CAC by channel tracker, LTV:CAC ratio, retention WhatsApp sequences.",
      },
      {
        sector: "Logistics",
        example:
          "logistics-route-optimizer: inputs delivery zones + fleet data → outputs route efficiency map, cost-per-km benchmarks, hub-and-spoke design recommendation.",
      },
    ],
    cta: "Browse Skills in Marketplace",
    href: "/marketplace?category=AI+Skills",
    color: "bg-eccellere-purple/5 border-eccellere-purple/20",
    featured: false,
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "AI Agents for Recurring Tasks",
    tagline: "Set it up once — your agent handles it every single time",
    description:
      "Purpose-built agentic workflows that autonomously execute your most time-consuming recurring business tasks. Each agent is pre-configured with MSME-specific business logic, integrates with your existing tools (WhatsApp, ERP, POS, email), and escalates to a human only when genuinely needed. From purchase order creation to daily sales health cards — you design the rule, the agent executes it.",
    summary:
      "MSME managers spend 60–70% of their time on tasks that follow predictable, repeatable logic — creating POs, generating reports, sending reminders, updating scorecards. These are exactly the tasks AI agents eliminate. Free your team for decisions that actually require human judgment.",
    outputs: [
      "Purchase order auto-creation when inventory crosses reorder point — supplier query, PO draft, WhatsApp approval loop",
      "Weekly production schedule generation and distribution to floor supervisors via WhatsApp",
      "Supplier performance scoring and automatic CAPA trigger when quality drops below threshold",
      "Daily sales health card: revenue vs. target, top 5 SKUs, slow movers, outlet-wise gap — delivered by 8am",
      "Customer win-back sequence: automatic outreach to 30/60/90-day lapsed buyers with personalised offers",
      "Distributor claim processing, credit note generation, and outstanding reconciliation — automated end-to-end",
    ],
    sectorExamples: [
      {
        sector: "Manufacturing",
        example:
          "RM stock ≤ reorder point → agent queries 3 approved suppliers → selects best OTIF+price → generates PO → WhatsApp approval to manager → logs to ERP on confirmation. Zero manual steps.",
      },
      {
        sector: "Retail",
        example:
          "Daily 8am card: 5 stores × 5 KPIs (footfall, conversion, ATV, revenue, vs. target) → colour-coded WhatsApp summary to owner → anomaly alert if any store >15% below target.",
      },
      {
        sector: "Consumer Products",
        example:
          "Monthly distributor scorecard: pulls sell-in/sell-out data → ranks distributors → triggers improvement email to bottom-quartile → logs to CRM automatically.",
      },
      {
        sector: "Logistics",
        example:
          "End-of-day route reconciliation: planned vs. actual delivery → flags missed drops → calculates cost-per-km → sends performance summary to dispatch head via WhatsApp.",
      },
    ],
    cta: "See Agent Demos",
    href: "/contact?type=ai-agents",
    color: "bg-eccellere-teal/5 border-eccellere-teal/20",
    featured: false,
  },
  {
    icon: Crown,
    number: "04",
    title: "CEO AI Co-Pilot",
    tagline: "A McKinsey-grade strategic partner — available 24/7 on WhatsApp",
    description:
      "The CEO Co-Pilot is a production-grade, 8-layer agentic AI system — not a chatbot — that functions as a daily strategic thinking partner. It converts vague pain points into structured MECE issue trees, conducts branching diagnostic conversations via WhatsApp (2–5 questions per session), routes questions to functional heads when needed, and closes the loop by assigning actions, tracking execution, and validating outcomes against KPIs.",
    summary:
      "A McKinsey team works in structured 8-week sprints. Your CEO Co-Pilot works every day, retains memory of every decision you've made, knows your industry's critical KPIs, and turns your morning voice note into a board-ready action plan by 9am. Designed for promoters who are too close to the business to see it clearly.",
    outputs: [
      "Daily strategic briefing: top 3 decisions pending, top 2 risks, one opportunity — delivered via WhatsApp by 7:30am",
      "MECE-structured problem diagnosis from free-form CEO input (voice or text)",
      "Branching diagnostic conversation — 2 to 5 questions per session, zero jargon, one question at a time",
      "Multi-stakeholder input: routes unanswered questions to CFO, COO, sales head — consolidates responses",
      "Prioritised action plan with KPI targets, owner assignments, and effort × impact ranking",
      "Closed-loop execution engine: follow-up reminders, escalation logic, outcome validation vs. KPI targets",
    ],
    sectorExamples: [
      {
        sector: "Manufacturing",
        example:
          "CEO: 'Our margins are down 3%.' → Co-Pilot activates Manufacturing Margin issue tree → 3 questions on volume/pricing/cost → root cause: RM price increase not passed to buyers → action plan: pricing review + supplier renegotiation, assigned to COO and CFO.",
      },
      {
        sector: "Retail",
        example:
          "CEO: 'Same-store sales declining 12% YoY.' → Co-Pilot activates Retail Revenue tree → footfall → conversion → ATV branches → identifies conversion drop → routes to store manager → action plan: visual merchandising + staff training sprint.",
      },
      {
        sector: "Consumer Products",
        example:
          "CEO: 'New distributor appointment is stuck.' → Co-Pilot activates Distribution tree → identifies territory conflict with existing partner → action plan: territory carve-out + ROI calculator drafted and sent to distributor.",
      },
      {
        sector: "Logistics",
        example:
          "CEO: 'We are losing 2 major clients.' → Co-Pilot activates Customer Retention tree → 4 questions on service level and pricing → identifies OTIF below SLA → action plan: route re-optimisation + client review agenda drafted.",
      },
    ],
    cta: "Request CEO Co-Pilot Demo",
    href: "/contact?type=ceo-copilot",
    color: "bg-eccellere-gold/5 border-eccellere-gold/40",
    featured: true,
  },
  {
    icon: Lightbulb,
    number: "05",
    title: "AI Consulting",
    tagline: "Strategy, business case, platform selection, and implementation roadmap",
    description:
      "For MSMEs that want to build a credible AI strategy before committing to platforms or vendors. Our consulting engagement delivers a board-ready AI strategy aligned to your 3-year growth plan, a quantified business case with ROI model, a shortlist of platforms matched to your budget and IT maturity, and a phased implementation roadmap with change management built in. We help you make the right AI investment decision — not just any AI decision.",
    summary:
      "Most AI projects fail because they start with a technology choice, not a business problem. Our AI Consulting engagement flips that — we start with your P&L, your bottlenecks, and your 3-year growth plan, then work backwards to identify the right AI use cases, the right platforms, and the right phasing to generate ROI without disrupting operations.",
    outputs: [
      "AI Strategy Document: vision, principles, 3 strategic priorities, success metrics — ready for board presentation",
      "Business Case: 3-year ROI model, payback period, risk-adjusted NPV for top 3 AI use cases",
      "Platform Shortlist: India-available AI tools evaluated by budget tier (₹5L / ₹20L / ₹50L+), integration ease, MSME fit",
      "Implementation Roadmap: 12-month phased plan with quick wins in Month 1–3, scaled deployment in Month 4–9",
      "Vendor Selection Support: RFP framework, evaluation scorecard, negotiation guidance for AI vendors",
      "Change Management Plan: team readiness assessment, upskilling agenda, governance model, AI policy document",
    ],
    sectorExamples: [
      {
        sector: "Manufacturing",
        example:
          "₹80 Cr auto ancillary: 3 AI use cases identified → ₹1.8 Cr annual saving modelled → platform shortlist: SAP Business AI vs. custom LangGraph → Phase 1 live in 90 days.",
      },
      {
        sector: "Retail",
        example:
          "30-store fashion chain: inventory AI prioritised → ₹2.4 Cr capital freed via dead stock reduction → Vinculum + custom AI layer selected → 12-month roadmap delivered.",
      },
      {
        sector: "Consumer Products",
        example:
          "Regional FMCG brand: secondary sales AI identified as highest ROI → Bizom with custom analytics layer → payback period: 14 months.",
      },
      {
        sector: "Logistics",
        example:
          "Mid-size 3PL: route optimisation AI saves ₹1.1 Cr/year → Board business case built → FarEye selected → 6-month deployment roadmap.",
      },
    ],
    cta: "Talk to an AI Consultant",
    href: "/contact?type=ai-consulting",
    color: "bg-eccellere-teal/5 border-eccellere-teal/30",
    featured: false,
  },
];

const skillSectors = [
  {
    icon: Factory,
    name: "Manufacturing",
    color: "text-eccellere-gold",
    bg: "bg-eccellere-gold/10",
    skills: [
      { name: "Production Planner", desc: "MPS, OEE, shift-level scheduling, bottleneck analysis" },
      { name: "Inventory Controller", desc: "ABC-XYZ classification, reorder policy, GST challan" },
      { name: "Quality System Builder", desc: "FTR tracker, Pareto analysis, CAPA register" },
      { name: "Supplier Development", desc: "Scorecard, TCO calculator, ARC negotiation template" },
      { name: "Cost & Profitability Analyser", desc: "Product cost card, break-even, make vs. buy" },
    ],
  },
  {
    icon: ShoppingBag,
    name: "Retail",
    color: "text-eccellere-purple",
    bg: "bg-eccellere-purple/10",
    skills: [
      { name: "Store Performance Optimizer", desc: "FCAR dashboard, peak hour heatmap, staff scheduling" },
      { name: "Inventory Velocity Manager", desc: "Dead stock classification, inventory turns, shrinkage" },
      { name: "Loyalty & Customer Growth", desc: "CLV calculator, win-back sequence, referral playbook" },
      { name: "Digital Presence Activator", desc: "GMB optimisation, ONDC onboarding, WhatsApp Business" },
      { name: "Credit & Collections Manager", desc: "Khata ageing, credit policy, escalating reminder flow" },
    ],
  },
  {
    icon: Package,
    name: "Consumer Products",
    color: "text-eccellere-teal",
    bg: "bg-eccellere-teal/10",
    skills: [
      { name: "Brand Launch Planner", desc: "GTM checklist, 90-day tracker, FSSAI/BIS compliance" },
      { name: "Distribution Builder", desc: "Territory mapping, distributor ROI, channel conflict framework" },
      { name: "D2C Revenue Engine", desc: "Funnel diagnostic, CAC by channel, LTV:CAC, retention flows" },
      { name: "Price & Revenue Optimizer", desc: "Pricing architecture, retailer/distributor margin waterfall" },
      { name: "Trade Marketing Planner", desc: "BTL calendar, scheme ROI, sell-through rate KPIs" },
    ],
  },
  {
    icon: Truck,
    name: "Logistics",
    color: "text-eccellere-gold",
    bg: "bg-eccellere-gold/10",
    skills: [
      { name: "Route & Network Optimizer", desc: "Hub-spoke design, cost-per-km benchmarks" },
      { name: "Fleet Performance Manager", desc: "Utilisation tracker, maintenance trigger, downtime log" },
      { name: "Warehouse Operations Planner", desc: "SLOB report, space utilisation, pick-pack optimisation" },
      { name: "Last-Mile Delivery Agent", desc: "OTIF tracker, exception alerts, delivery reconciliation" },
      { name: "Logistics Cost Reducer", desc: "Freight benchmarking, mode mix optimisation" },
    ],
  },
];

const ceopilotLayers = [
  { label: "L1", name: "Interaction Layer", desc: "WhatsApp + chat — one question at a time via Twilio" },
  { label: "L2", name: "Orchestration Layer", desc: "Multi-agent coordination via LangGraph with stateful workflows" },
  { label: "L3", name: "Memory Layer", desc: "CEO decisions, priorities, and business patterns retained in Vector DB" },
  { label: "L4", name: "Knowledge Layer", desc: "Industry issue trees, KPI frameworks, consulting playbooks" },
  { label: "L5", name: "Diagnosis Engine", desc: "Hypothesis-driven MECE root cause mapping with confidence scoring" },
  { label: "L6", name: "Strategy Layer", desc: "Action plans prioritised by Impact × Confidence ÷ Effort" },
  { label: "L7", name: "Execution Layer", desc: "Task routing, follow-up reminders, escalation, KPI validation" },
  { label: "L8", name: "Collaboration Layer", desc: "Routes questions to functional heads, consolidates multi-stakeholder input" },
];

const consultingSteps = [
  {
    icon: BarChart3,
    step: "Step 1",
    title: "Strategy",
    desc: "Map your growth priorities and identify where AI creates the highest competitive advantage. Outputs a board-ready AI vision document with 3 strategic priorities and success metrics.",
  },
  {
    icon: TrendingUp,
    step: "Step 2",
    title: "Business Case",
    desc: "Quantify ROI for top 3 use cases — 3-year model, payback period, risk-adjusted NPV. Built on your actual P&L data, not industry averages.",
  },
  {
    icon: Layers,
    step: "Step 3",
    title: "Platform Selection",
    desc: "Evaluate India-available AI platforms by budget tier (₹5L / ₹20L / ₹50L+), integration fit, and MSME maturity. Includes RFP support and vendor negotiation guidance.",
  },
  {
    icon: ArrowRight,
    step: "Step 4",
    title: "Roadmap",
    desc: "12-month phased implementation plan with quick wins in Month 1–3, scaled deployment in Month 4–9, and a change management + upskilling plan built in.",
  },
];

const roadmap = [
  {
    phase: "01",
    title: "Assess",
    duration: "Week 1–2",
    description: "AI Readiness Assessment, data audit, and use case identification tailored to your sector, scale, and existing tools.",
  },
  {
    phase: "02",
    title: "Prioritise",
    duration: "Week 3",
    description: "Score AI use cases by ROI, feasibility, and strategic fit. Select the right skills, agents, and consulting depth for your context.",
  },
  {
    phase: "03",
    title: "Build",
    duration: "Week 4–8",
    description: "Deploy pre-built AI skills and agents. Configure CEO Co-Pilot with your business context. Sprint-based delivery with weekly demos.",
  },
  {
    phase: "04",
    title: "Scale",
    duration: "Ongoing",
    description: "Measure outcomes, train your team, expand AI skills across departments. We stay engaged until results are locked in.",
  },
];

/* ─── Page ──────────────────────────────────────────────────── */

export default function AgenticAIPage() {
  const [agenticAssets, setAgenticAssets] = useState<Asset[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  useEffect(() => {
    fetch("/api/marketplace/assets")
      .then((r) => r.json())
      .then((data) => {
        const all: Asset[] = data.assets ?? [];
        setAgenticAssets(all.filter((a) => a.category === "Agentic AI"));
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-eccellere-purple py-24 lg:py-32">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(184,145,58,0.25) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-sm border border-eccellere-gold/30 bg-eccellere-gold/10 px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-eccellere-gold" />
                <span className="text-xs font-medium text-eccellere-gold">
                  Flagship Service
                </span>
              </div>
              <h1 className="mt-6 font-display text-[clamp(36px,7vw,80px)] font-light leading-[1.05] text-eccellere-cream">
                Agentic AI for{" "}
                <span className="italic text-eccellere-gold">
                  Indian MSMEs
                </span>
              </h1>
              <p className="mt-6 text-lg font-light leading-relaxed text-white/60">
                Not just AI strategy — we assess, build, deploy, and consult. Five
                purpose-built offerings for the scale, budgets, and operational
                complexity of India&apos;s micro, small, and medium enterprises.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/assessment">Take Free AI Assessment</Link>
                </Button>
                <Button asChild variant="ghostLight" size="lg">
                  <Link href="/contact?type=ai">Talk to AI Specialist</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── What is Agentic AI ── */}
        <section className="py-20 lg:py-[120px]">
          <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                What is Agentic AI?
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                AI that doesn&apos;t just answer —{" "}
                <span className="italic">it acts</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Traditional AI gives you predictions. Agentic AI gives you
                autonomous agents that perceive, reason, plan, and execute
                multi-step tasks — from reordering inventory when stock runs low,
                to diagnosing a sales decline root cause, to generating your
                weekly production schedule automatically.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Autonomous decision-making within defined guardrails",
                  "Multi-step task execution without human intervention",
                  "Continuous learning from your business data and decisions",
                  "Seamless integration with WhatsApp, ERP, POS, and CRM",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-ink-mid">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-eccellere-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-eccellere-ink p-8 lg:p-10">
              <div className="space-y-6 font-mono text-sm">
                <div className="text-eccellere-gold">
                  {"// Agentic AI Workflow Example — Manufacturing"}
                </div>
                <div className="text-white/70">
                  <span className="text-eccellere-gold">agent</span>.observe(
                  <span className="text-eccellere-teal">
                    &quot;RM_stock &lt; reorder_point&quot;
                  </span>
                  )
                </div>
                <div className="text-white/70">
                  <span className="text-eccellere-gold">agent</span>.reason(
                  <span className="text-eccellere-teal">
                    &quot;compare 3 approved suppliers on OTIF + price&quot;
                  </span>
                  )
                </div>
                <div className="text-white/70">
                  <span className="text-eccellere-gold">agent</span>.decide(
                  <span className="text-eccellere-teal">
                    &quot;select best price × lead time score&quot;
                  </span>
                  )
                </div>
                <div className="text-white/70">
                  <span className="text-eccellere-gold">agent</span>.execute(
                  <span className="text-eccellere-teal">
                    &quot;draft_purchase_order → WhatsApp approval&quot;
                  </span>
                  )
                </div>
                <div className="text-white/70">
                  <span className="text-eccellere-gold">agent</span>.log(
                  <span className="text-eccellere-teal">
                    &quot;ERP entry + audit trail created&quot;
                  </span>
                  )
                </div>
                <div className="mt-4 border-t border-white/10 pt-4 text-xs text-white/40">
                  {"// Zero manual intervention. Full audit trail."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Marketplace Carousel ── */}
        {agenticAssets.length > 0 && (
          <section className="border-y border-eccellere-ink/5 bg-eccellere-cream py-10">
            <div className="mx-auto max-w-[1280px] px-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                    From the Marketplace
                  </p>
                  <p className="mt-1 text-sm text-ink-mid">
                    Tools &amp; playbooks to accelerate your AI journey
                  </p>
                </div>
                <Link
                  href="/marketplace?category=Agentic+AI"
                  className="flex items-center gap-1 text-xs font-medium text-eccellere-gold hover:underline"
                >
                  Browse all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="relative">
                {/* Prev button */}
                <button
                  onClick={() => scrollCarousel("left")}
                  aria-label="Scroll left"
                  className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-eccellere-gold hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Next button */}
                <button
                  onClick={() => scrollCarousel("right")}
                  aria-label="Scroll right"
                  className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-eccellere-gold hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                {agenticAssets.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/marketplace/${asset.slug}`}
                    className="group flex w-64 shrink-0 flex-col rounded bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block rounded-sm bg-eccellere-purple/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-eccellere-purple">
                        {asset.category}
                      </span>
                      {asset.bestseller && (
                        <span className="rounded-sm bg-eccellere-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                          Bestseller
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-medium leading-snug text-eccellere-ink">
                      {asset.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-mid">
                      {asset.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-eccellere-ink/5 pt-3">
                      <span className="font-mono text-base font-medium text-eccellere-ink">
                        ₹{asset.price.toLocaleString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-eccellere-gold">
                        <Star className="h-3 w-3 fill-current" />
                        {asset.rating > 0 ? asset.rating : "New"}
                      </span>
                    </div>
                  </Link>
                ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 5 MSME Offerings ── */}
        <section className="bg-gold-pale py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                MSME-Specific Offerings
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                Five offerings built{" "}
                <span className="italic">only for MSMEs</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Not enterprise tools stripped down. Purpose-built for India&apos;s
                micro, small, and medium businesses — affordable, deployable in
                days, generating ROI from week one. Each offering is
                sector-contextualised across Manufacturing, Retail, Consumer
                Products, and Logistics.
              </p>
            </div>

            <div className="mt-16 space-y-10">
              {offerings.map((offering, i) => (
                <motion.div
                  key={offering.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`rounded-xl border p-8 lg:p-10 ${offering.color} ${
                    offering.featured ? "ring-2 ring-eccellere-gold/40" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 border-b border-eccellere-ink/10 pb-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-eccellere-ink">
                      <offering.icon className="h-5 w-5 text-eccellere-gold" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-eccellere-gold">{offering.number}</span>
                        {offering.featured && (
                          <span className="rounded-sm bg-eccellere-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-eccellere-ink">
                            Flagship
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-2xl font-semibold text-eccellere-ink">
                        {offering.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium italic text-ink-mid">
                        {offering.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Body: 3 columns */}
                  <div className="mt-6 grid gap-8 lg:grid-cols-3">

                    {/* Col 1: Description + Summary */}
                    <div>
                      <p className="text-sm leading-relaxed text-ink-mid">
                        {offering.description}
                      </p>
                      <div className="mt-4 rounded-sm border-l-2 border-eccellere-gold bg-eccellere-gold/5 p-3">
                        <p className="text-xs italic leading-relaxed text-eccellere-ink/70">
                          {offering.summary}
                        </p>
                      </div>
                      <Button asChild variant="default" size="sm" className="mt-6">
                        <Link href={offering.href}>
                          {offering.cta}
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>

                    {/* Col 2: What you get */}
                    <div>
                      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-eccellere-gold">
                        What you get
                      </p>
                      <ul className="space-y-2.5">
                        {offering.outputs.map((output) => (
                          <li key={output} className="flex items-start gap-2 text-sm text-ink-mid">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-eccellere-gold" />
                            {output}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Col 3: Sector examples */}
                    <div>
                      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-eccellere-gold">
                        Sector examples
                      </p>
                      <div className="space-y-3">
                        {offering.sectorExamples.map((ex) => (
                          <div
                            key={ex.sector}
                            className="rounded border border-eccellere-ink/10 bg-white/60 p-3"
                          >
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-eccellere-ink/50">
                              {ex.sector}
                            </div>
                            <p className="text-xs leading-relaxed text-ink-mid">
                              {ex.example}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Skills Library Grid ── */}
        <section className="py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Offering 02 — Skills Library Detail
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                20 sector skills,{" "}
                <span className="italic">ready to deploy today</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Each skill is a pre-built, tested AI capability for a specific
                MSME operational domain. Select a skill, describe your challenge,
                and get structured India-contextualised reports, trackers, and
                decision frameworks within minutes.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {skillSectors.map((sector, i) => (
                <motion.div
                  key={sector.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-lg bg-white p-6 shadow-sm"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-sm ${sector.bg}`}>
                    <sector.icon className={`h-5 w-5 ${sector.color}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-eccellere-ink">
                    {sector.name}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {sector.skills.map((skill) => (
                      <li key={skill.name} className="text-sm">
                        <div className="flex items-start gap-2">
                          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-eccellere-gold" />
                          <div>
                            <span className="font-medium text-eccellere-ink">{skill.name}</span>
                            <p className="mt-0.5 text-xs text-ink-mid">{skill.desc}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="default">
                <Link href="/marketplace?category=AI+Skills">
                  Explore All 20 Skills in the Marketplace
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── CEO Co-Pilot Deep Dive ── */}
        <section className="bg-eccellere-ink py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-sm border border-eccellere-gold/30 bg-eccellere-gold/10 px-3 py-1">
                  <Crown className="h-3.5 w-3.5 text-eccellere-gold" />
                  <span className="text-xs font-medium text-eccellere-gold">
                    Offering 04 — CEO Co-Pilot
                  </span>
                </div>
                <h2 className="mt-6 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-cream">
                  A McKinsey-grade partner,{" "}
                  <span className="italic text-eccellere-gold">
                    built into your WhatsApp
                  </span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/60">
                  The CEO Co-Pilot is a production-grade, 8-layer agentic AI system —
                  not a chatbot. It combines conversational intelligence, MECE
                  diagnostic reasoning, multi-stakeholder input consolidation, and a
                  closed-loop execution engine into a unified daily operating
                  system for business leaders. Built for Manufacturing, Retail,
                  Consumer Products, and Logistics CEOs.
                </p>
                <blockquote className="mt-8 border-l-2 border-eccellere-gold pl-4">
                  <p className="text-base italic text-white/70">
                    &ldquo;A scalable McKinsey-in-a-box — personalized to each CEO,
                    embedded in daily operations, and built to ensure things get
                    done.&rdquo;
                  </p>
                </blockquote>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { stat: "8", label: "Architecture layers" },
                    { stat: "4", label: "Industries covered" },
                    { stat: "2–5", label: "Questions per session" },
                    { stat: "24/7", label: "Always available" },
                  ].map((item) => (
                    <div key={item.label} className="rounded border border-white/10 p-4">
                      <div className="font-mono text-2xl text-eccellere-gold">{item.stat}</div>
                      <div className="mt-1 text-xs text-white/50">{item.label}</div>
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="mt-8">
                  <Link href="/contact?type=ceo-copilot">
                    Request a CEO Co-Pilot Demo
                  </Link>
                </Button>
              </div>
              <div>
                <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-eccellere-gold">
                  8-Layer System Architecture
                </p>
                <div className="space-y-3">
                  {ceopilotLayers.map((layer, i) => (
                    <motion.div
                      key={layer.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      className="flex items-start gap-4 rounded border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-eccellere-gold/15">
                        <span className="font-mono text-xs font-semibold text-eccellere-gold">
                          {layer.label}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-eccellere-cream">
                          {layer.name}
                        </div>
                        <div className="mt-0.5 text-xs text-white/40">
                          {layer.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Consulting Detail ── */}
        <section className="bg-eccellere-cream py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-sm border border-eccellere-teal/30 bg-eccellere-teal/10 px-3 py-1">
                <Lightbulb className="h-3.5 w-3.5 text-eccellere-teal" />
                <span className="text-xs font-medium text-eccellere-teal">
                  Offering 05 — AI Consulting
                </span>
              </div>
              <h2 className="mt-6 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                AI strategy before you{" "}
                <span className="italic">spend a rupee on AI</span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Most MSME AI projects fail because they start with a technology
                choice, not a business problem. Our consulting engagement starts
                with your P&amp;L and growth priorities — then works backwards to the
                right AI strategy, the right platforms, and a phased roadmap with
                ROI built in.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {consultingSteps.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-lg border border-eccellere-teal/20 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-eccellere-teal/10">
                    <s.icon className="h-5 w-5 text-eccellere-teal" strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 font-mono text-xs text-eccellere-teal">{s.step}</p>
                  <h3 className="mt-1 text-lg font-semibold text-eccellere-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 rounded-xl bg-eccellere-ink p-8 lg:p-12">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-eccellere-gold">
                    What the consulting engagement delivers
                  </p>
                  <ul className="mt-4 space-y-3">
                    {[
                      "AI Strategy Document aligned to your 3-year growth plan — board-ready",
                      "Business Case: 3-year ROI model, payback period, risk-adjusted NPV per use case",
                      "Platform Shortlist: India-available tools evaluated by budget tier (₹5L / ₹20L / ₹50L+)",
                      "Implementation Roadmap: 12-month phased plan with quick wins in Month 1–3",
                      "Vendor RFP framework, evaluation scorecard, and negotiation guidance",
                      "Change Management Plan: upskilling agenda, governance model, AI policy document",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-eccellere-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-eccellere-gold">
                    Sector examples
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        label: "Manufacturing",
                        text: "₹80 Cr auto ancillary → 3 AI use cases identified → ₹1.8 Cr annual saving modelled → platform shortlist: SAP Business AI vs. custom LangGraph → Phase 1 live in 90 days.",
                      },
                      {
                        label: "Retail",
                        text: "30-store fashion chain → inventory AI prioritised → ₹2.4 Cr capital freed via dead stock reduction → Vinculum + custom AI layer selected → 12-month roadmap delivered.",
                      },
                      {
                        label: "Consumer Products",
                        text: "Regional FMCG brand → secondary sales AI as highest ROI → Bizom with custom analytics layer → payback period: 14 months.",
                      },
                      {
                        label: "Logistics",
                        text: "Mid-size 3PL → route optimisation AI saves ₹1.1 Cr/year → Board business case built → FarEye selected → 6-month deployment roadmap.",
                      },
                    ].map((ex) => (
                      <div key={ex.label} className="rounded border border-white/10 bg-white/5 p-3">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-eccellere-gold/70">
                          {ex.label}
                        </div>
                        <p className="text-xs leading-relaxed text-white/60">{ex.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t border-white/10 pt-8 text-center">
                <Button asChild size="lg" className="bg-eccellere-gold text-eccellere-ink hover:bg-eccellere-gold/90">
                  <Link href="/contact?type=ai-consulting">
                    Talk to an AI Consultant
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Engagement Roadmap ── */}
        <section className="bg-gold-pale py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                How We Work
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                From assessment to impact{" "}
                <span className="italic">in 8 weeks</span>
              </h2>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-4">
              {roadmap.map((step, i) => (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="relative"
                >
                  {i < roadmap.length - 1 && (
                    <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-eccellere-gold/20 md:block" />
                  )}
                  <div className="relative rounded bg-white p-6 shadow-sm">
                    <span className="font-mono text-3xl text-eccellere-gold/30">
                      {step.phase}
                    </span>
                    <h3 className="mt-3 text-lg font-medium text-eccellere-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-eccellere-gold">
                      {step.duration}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink-mid">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-eccellere-gold py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h2 className="font-display text-[clamp(28px,5vw,48px)] font-light text-eccellere-ink">
              Ready to bring Agentic AI{" "}
              <span className="italic">to your business?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-eccellere-ink/70">
              Start with a free assessment. No commitment, no contracts. Just
              clarity on where AI can drive the most impact — across all five
              of our MSME offerings.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-eccellere-ink text-eccellere-cream hover:bg-eccellere-ink/90"
              >
                <Link href="/assessment">Take Free AI Assessment</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-eccellere-ink/30 text-eccellere-ink hover:bg-eccellere-ink/10"
              >
                <Link href="/contact?type=ai-consulting">
                  Talk to an AI Consultant
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
