import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Eccellere+ plans for small, medium and large enterprises: industry and function specific strategic planning and operations assets, AI advisory and specialist expertise.",
};

const plans = [
  {
    id: "micro",
    name: "Micro",
    tagline: "For micro enterprises (turnover up to ₹5 Cr)",
    monthlyPrice: null,
    annualPrice: 19999,
    priceLabel: "TBD",
    priceSub: "pricing to be announced",
    cta: "Get started",
    ctaHref: "/register?plan=micro",
    featured: false,
    features: [
      { label: "AI Readiness Assessment (basic)", included: true },
      { label: "5 marketplace asset downloads/year", included: true },
      { label: "Perspectives articles (unlimited)", included: true },
      { label: "AI Advisor chatbot (5 sessions/month)", included: true },
      { label: "Community forum access", included: true },
      { label: "1 specialist Q&A session (1 hr)", included: true },
      { label: "Sector benchmarks", included: false },
      { label: "Priority specialist matching", included: false },
      { label: "Custom AI roadmap report", included: false },
      { label: "Dedicated customer success manager", included: false },
    ],
  },
  {
    id: "small",
    name: "Small",
    tagline: "For small enterprises (turnover ₹5–75 Cr)",
    monthlyPrice: null,
    annualPrice: 149999,
    priceLabel: "TBD",
    priceSub: "pricing to be announced",
    cta: "Start growing",
    ctaHref: "/register?plan=small",
    featured: true,
    badge: "Most popular",
    features: [
      { label: "AI Readiness Assessment (full + sector benchmarks)", included: true },
      { label: "Unlimited marketplace downloads (member pricing)", included: true },
      { label: "Ready-to-use assets for your industry and your key functions", included: true },
      { label: "Perspectives articles (unlimited)", included: true },
      { label: "AI Advisor chatbot (unlimited sessions)", included: true },
      { label: "Community forum access", included: true },
      { label: "Sector benchmarks + peer comparison", included: true },
      { label: "Priority specialist matching", included: true },
      { label: "2 specialist consultations (4 hrs each)", included: true },
      { label: "Custom AI roadmap report (1/year)", included: true },
      { label: "5 team seats", included: true },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    tagline: "For medium enterprises (turnover ₹75 Cr–500 Cr)",
    monthlyPrice: null,
    annualPrice: 999999,
    priceLabel: "TBD",
    priceSub: "pricing to be announced",
    cta: "Talk to us",
    ctaHref: "/contact?plan=medium",
    featured: false,
    features: [
      { label: "Everything in Small plan", included: true },
      { label: "Industry and function assets across every business line you run", included: true },
      { label: "Unlimited team seats", included: true },
      { label: "GSTIN-level billing and PO support", included: true },
      { label: "Custom onboarding and training", included: true },
      { label: "Dedicated Customer Success Manager", included: true },
      { label: "Priority SLA on specialist matching (48-hour guarantee)", included: true },
      { label: "White-labelled reports", included: true },
      { label: "Custom framework development", included: true },
      { label: "On-site workshops (2 per quarter)", included: true },
      { label: "Quarterly business review with Eccellere leadership", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large enterprises and groups with several business units",
    monthlyPrice: null,
    annualPrice: null,
    priceLabel: "Custom",
    priceSub: "scoped with you; PO-based billing",
    cta: "Talk to us",
    ctaHref: "/contact?plan=enterprise",
    featured: false,
    features: [
      { label: "Everything in Medium plan", included: true },
      { label: "Every industry and function, rolled out across all business units", included: true },
      { label: "Custom industry and function assets built to your operating model", included: true },
      { label: "Dedicated specialist team", included: true },
      { label: "Enterprise security and access review (single sign-on, roles)", included: true },
      { label: "Programme governance and executive reporting", included: true },
      { label: "Agentic AI use cases scoped for your processes", included: true },
      { label: "Scope, price and terms agreed with you in writing", included: true },
    ],
  },
];

const featureCategories = [
  {
    name: "Industry and function depth",
    rows: [
      { label: "Industry and function assets", micro: "Starter selection", small: "Your industry and key functions", medium: "Every business line you run", enterprise: "All, plus custom-built" },
      { label: "Custom framework development", micro: "—", small: "—", medium: "Included", enterprise: "Included, scoped with you" },
    ],
  },
  {
    name: "Marketplace",
    rows: [
      { label: "Annual asset downloads", micro: "5 assets", small: "Unlimited (member price)", medium: "Unlimited", enterprise: "Unlimited" },
      { label: "Member pricing discount", micro: "—", small: "Up to 40% off", medium: "Up to 50% off", enterprise: "Agreed with you" },
      { label: "Early access to new assets", micro: "—", small: "7-day early access", medium: "First access", enterprise: "First access" },
    ],
  },
  {
    name: "AI Tools",
    rows: [
      { label: "AI Readiness Assessment", micro: "Basic (3 dimensions)", small: "Full (6 dimensions + benchmarks)", medium: "Full + custom dimensions", enterprise: "Full + custom dimensions" },
      { label: "AI Advisor chatbot sessions", micro: "5/month", small: "Unlimited", medium: "Unlimited + custom context", enterprise: "Unlimited + custom context" },
      { label: "AI Roadmap report", micro: "—", small: "1 per year", medium: "Quarterly", enterprise: "Quarterly, per business unit" },
    ],
  },
  {
    name: "Specialists & Support",
    rows: [
      { label: "Specialist consultations", micro: "1 session (1 hr)", small: "2 sessions (4 hrs each)", medium: "Dedicated team", enterprise: "Dedicated team" },
      { label: "Customer success", micro: "Email support", small: "Priority support", medium: "Named CSM", enterprise: "Named CSM + programme lead" },
      { label: "Team seats", micro: "1", small: "5", medium: "Unlimited", enterprise: "Unlimited" },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Eccellere+ subscriptions can be cancelled at any time. You keep access until the end of your billing period. No auto-renewal without reminder.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — paid plans include a 14-day free trial. No credit card required to start. You'll be notified 3 days before the trial ends.",
  },
  {
    q: "Can I get a GST invoice?",
    a: "Yes. All plans include GST-compliant invoices with Eccellere's GSTIN. Medium and Enterprise plans support PO-based billing.",
  },
  {
    q: "What happens to my purchased assets if I cancel?",
    a: "Individual marketplace asset purchases are permanent — you keep lifetime access to anything you've bought, regardless of subscription status.",
  },
  {
    q: "Do the plans cover consulting engagements?",
    a: "Subscriptions cover platform access, digital tools, and marketplace discounts. Consulting engagements (Strategy, Process Transformation, etc.) are separately scoped and priced.",
  },
  {
    q: "How do I choose between Small, Medium and Enterprise?",
    a: "Small suits one business with a clear industry and a few key functions. Medium suits a company running several business lines that needs every function covered. Enterprise suits groups with several business units that want assets built to their own operating model; it is scoped and priced with you.",
  },
  {
    q: "Is there a discount for NGOs or educational institutions?",
    a: "Yes — we offer 30% discounts for registered NGOs and educational institutions. Contact us with your registration documents.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold mb-4">
              Pricing
            </p>
            <h1 className="font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Transparent pricing,{" "}
              <span className="italic">no surprises</span>
            </h1>
            <p className="mt-6 mx-auto max-w-xl text-lg font-light text-white/50">
              Choose the plan that matches your size and how deep you need to go in your
              industry and functions. Cancel anytime. Paid plans include a 14-day free trial.
            </p>
          </div>
        </section>

        {/* ── Plan Cards ───────────────────────────────────────────────── */}
        <section className="bg-eccellere-cream py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border p-8 flex flex-col",
                    plan.featured
                      ? "border-eccellere-gold bg-eccellere-ink text-eccellere-cream shadow-xl scale-[1.02]"
                      : "border-eccellere-ink/10 bg-white"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-6">
                      <span className="rounded-full bg-eccellere-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h2
                      className={cn(
                        "text-xl font-semibold mb-1",
                        plan.featured ? "text-eccellere-cream" : "text-eccellere-ink"
                      )}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className={cn(
                        "text-sm font-light",
                        plan.featured ? "text-white/55" : "text-eccellere-ink/55"
                      )}
                    >
                      {plan.tagline}
                    </p>
                  </div>
                  <div className="mb-8">
                    <div
                      className={cn(
                        "font-display text-5xl font-light",
                        plan.featured ? "text-eccellere-gold" : "text-eccellere-ink"
                      )}
                    >
                      {plan.priceLabel}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        plan.featured ? "text-white/40" : "text-eccellere-ink/40"
                      )}
                    >
                      {plan.priceSub}
                    </p>
                  </div>
                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm">
                        {f.included ? (
                          <CheckCircle2
                            className={cn(
                              "mt-0.5 h-4 w-4 flex-none",
                              plan.featured ? "text-eccellere-gold" : "text-eccellere-gold"
                            )}
                          />
                        ) : (
                          <X
                            className={cn(
                              "mt-0.5 h-4 w-4 flex-none",
                              plan.featured ? "text-white/20" : "text-eccellere-ink/20"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            f.included
                              ? plan.featured
                                ? "text-white/80"
                                : "text-eccellere-ink/80"
                              : plan.featured
                              ? "text-white/30"
                              : "text-eccellere-ink/30"
                          )}
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "w-full rounded-full",
                      plan.featured
                        ? "bg-eccellere-gold text-white hover:bg-eccellere-gold-dark"
                        : "border border-eccellere-ink/20 bg-transparent text-eccellere-ink hover:bg-eccellere-ink hover:text-white"
                    )}
                  >
                    <Link href={plan.ctaHref}>{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature Comparison ───────────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink mb-12">
              Full feature comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-eccellere-ink/10">
                    <th className="py-3 text-left font-medium text-eccellere-ink/40 w-[40%]">
                      Feature
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        className={cn(
                          "py-3 text-center font-semibold",
                          p.featured ? "text-eccellere-gold" : "text-eccellere-ink"
                        )}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureCategories.map((cat) => (
                    <>
                      <tr key={`cat-${cat.name}`}>
                        <td
                          colSpan={5}
                          className="pt-6 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-eccellere-gold"
                        >
                          {cat.name}
                        </td>
                      </tr>
                      {cat.rows.map((row, ri) => (
                        <tr
                          key={`${cat.name}-${ri}`}
                          className="border-b border-eccellere-ink/5"
                        >
                          <td className="py-3 font-light text-eccellere-ink/70">
                            {row.label}
                          </td>
                          <td className="py-3 text-center text-eccellere-ink/60">{row.micro}</td>
                          <td className="py-3 text-center font-medium text-eccellere-ink">{row.small}</td>
                          <td className="py-3 text-center text-eccellere-ink/60">{row.medium}</td>
                          <td className="py-3 text-center text-eccellere-ink/60">{row.enterprise}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Consulting add-on callout ────────────────────────────────── */}
        <section className="bg-eccellere-gold-pale py-16">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold mb-4">
              Consulting Engagements
            </p>
            <h2 className="font-display text-[clamp(24px,4vw,44px)] font-light text-eccellere-ink mb-4">
              Need expert consulting, not just tools?
            </h2>
            <p className="mb-8 text-base font-light text-eccellere-ink/60 max-w-xl mx-auto">
              Our Strategy, Agentic AI, Process Transformation, Digital, and Organisation
              Transformation practices are independently scoped. Scoped to your needs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-eccellere-gold text-white hover:bg-eccellere-gold-dark"
              >
                <Link href="/services">Explore Services</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-eccellere-ink/20 text-eccellere-ink hover:bg-eccellere-ink hover:text-white"
              >
                <Link href="/contact">Get a Custom Quote</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink mb-12">
              Pricing FAQ
            </h2>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-eccellere-ink/10 p-6">
                  <h3 className="mb-2 text-sm font-semibold text-eccellere-ink">
                    {faq.q}
                  </h3>
                  <p className="text-sm font-light text-eccellere-ink/60 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
