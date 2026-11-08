import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const services = [
  {
    number: "01",
    slug: "agentic-ai",
    name: "Agentic AI",
    tagline: "AI strategy and implementation built around your industry and function",
    description:
      "From AI readiness assessments to full agentic workflow implementation — we help you identify where AI fits, build the business case, and deploy working solutions that your teams actually use. No jargon. No bloated proposals. Just AI that delivers ROI.",
    capabilities: [
      "AI Readiness Assessment & Benchmarking",
      "Agentic Workflow Design & Architecture",
      "LLM Strategy & Model Selection",
      "Prompt Engineering & RAG Pipelines",
      "AI-Augmented Decision Systems",
      "Change Management for AI Adoption",
    ],
    sectors: ["Manufacturing", "Retail", "Consumer Products", "Logistics"],
    featured: true,
  },
  {
    number: "02",
    slug: "strategy",
    name: "Strategy",
    tagline: "Market entry, growth planning, and competitive positioning",
    description:
      "200+ proven frameworks covering market sizing, growth strategy, competitive analysis, business model innovation, and strategic planning. We bring Big 4 methodologies adapted for industry and function specific planning decisions.",
    capabilities: [
      "Market Entry & Expansion Strategy",
      "Competitive Positioning & Differentiation",
      "Growth Planning & Revenue Modelling",
      "Business Model Innovation",
      "Strategic Planning & Roadmapping",
      "M&A Due Diligence & Integration",
    ],
    sectors: ["All Sectors"],
    featured: false,
  },
  {
    number: "03",
    slug: "process-transformation",
    name: "Process Transformation",
    tagline: "End-to-end operational redesign for efficiency and scale",
    description:
      "Lean manufacturing, supply chain optimisation, quality management systems, and operational excellence — we redesign your processes from the ground up, implementing the same methodologies used by global leaders, adapted for Indian operating conditions.",
    capabilities: [
      "Lean Manufacturing & Six Sigma",
      "Supply Chain Optimisation",
      "Quality Management Systems (ISO, TQM)",
      "Business Process Re-engineering",
      "Operational Excellence Programs",
      "Cost Reduction & Working Capital",
    ],
    sectors: ["Manufacturing", "Logistics"],
    featured: false,
  },
  {
    number: "04",
    slug: "digital",
    name: "Digital",
    tagline: "Digital roadmaps for businesses going digital-first",
    description:
      "From ERP selection to e-commerce launch, from data analytics to digital marketing — we help you build and execute a digital roadmap that connects technology investments to business outcomes.",
    capabilities: [
      "Digital Strategy & Roadmapping",
      "ERP Selection & Implementation Support",
      "E-Commerce & D2C Platform Strategy",
      "Data Analytics & Business Intelligence",
      "CRM & Marketing Automation",
      "Digital Maturity Assessment",
    ],
    sectors: ["Retail", "Consumer Products"],
    featured: false,
  },
  {
    number: "05",
    slug: "organisation-transformation",
    name: "Organisation Transformation",
    tagline: "People, culture, and capability building to sustain growth",
    description:
      "Scale demands new structures, new skills, and new ways of working. We help you build the organisation that your strategy requires — from talent frameworks to leadership development, from performance systems to culture design.",
    capabilities: [
      "Organisation Design & Restructuring",
      "Talent Management Frameworks",
      "Leadership Development Programs",
      "Performance Management Systems",
      "Culture Assessment & Transformation",
      "Change Management & Communication",
    ],
    sectors: ["All Sectors"],
    featured: false,
  },
];

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Strategy, Process Transformation, Agentic AI, Digital, and Organisation Transformation — five disciplines for deeper, industry and function specific planning and operations.",
};

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              What We Do
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Five disciplines,{" "}
              <span className="italic">one transformation platform</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              Every capability goes deeper than generic advice: it is built for your
              industry, your function, and the decisions your operations face.
            </p>
          </div>
        </section>

        {/* Services grid */}
        <section className="bg-eccellere-cream py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="space-y-16">
              {services.map((service) => (
                <div
                  key={service.slug}
                  id={service.slug}
                  className={`rounded border p-8 transition-all lg:p-12 ${
                    service.featured
                      ? "border-eccellere-gold bg-white shadow-md"
                      : "border-eccellere-ink/5 bg-white shadow-sm"
                  }`}
                >
                  <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                      <span className="font-mono text-sm text-eccellere-gold">
                        {service.number}
                      </span>
                      {service.featured && (
                        <span className="ml-3 rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">
                          Flagship
                        </span>
                      )}
                      <h2 className="mt-3 font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
                        {service.name}
                      </h2>
                      <p className="mt-2 text-base font-medium text-ink-mid">
                        {service.tagline}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-ink-mid">
                        {service.description}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {service.sectors.map((s) => (
                          <span
                            key={s}
                            className="rounded-sm bg-gold-pale px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-mid"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-ink-light">
                        Key Capabilities
                      </h3>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {service.capabilities.map((cap) => (
                          <li
                            key={cap}
                            className="flex items-start gap-2 text-sm text-ink-mid"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-eccellere-gold" />
                            {cap}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 flex gap-4">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-sm font-medium text-eccellere-gold hover:underline"
                        >
                          Learn more →
                        </Link>
                        <Link
                          href="/marketplace"
                          className="text-sm text-ink-light hover:text-eccellere-gold"
                        >
                          Browse frameworks →
                        </Link>
                      </div>
                    </div>
                  </div>
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
