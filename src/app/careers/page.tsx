import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers | Eccellere",
  description:
    "Join Eccellere — India's premier consulting platform for MSMEs. We're building a team of specialists, technologists, and operators who care about outcomes.",
};

const openRoles = [
  {
    title: "Strategy Associate",
    team: "Consulting",
    type: "Full-time · Remote",
    description:
      "Work directly with cross-sector MSME clients on growth strategy, market entry, and organisational improvement engagements.",
  },
  {
    title: "AI Solutions Engineer",
    team: "Technology",
    type: "Full-time · Bengaluru",
    description:
      "Build and deploy agentic AI workflows for manufacturing, retail, and logistics clients using LLMs, workflow orchestration, and modern cloud infrastructure.",
  },
  {
    title: "Client Success Manager",
    team: "Client Operations",
    type: "Full-time · Bengaluru",
    description:
      "Own engagement delivery and client satisfaction for a portfolio of consulting clients from onboarding through to outcome delivery.",
  },
];

const values = [
  {
    title: "Outcomes Over Busyness",
    description: "We measure impact, not hours. Every team member is expected to own results.",
  },
  {
    title: "Built for Indian Business",
    description: "Our work is rooted in the reality of Indian markets, regulations, and business culture.",
  },
  {
    title: "Small Team, Big Scope",
    description: "Early team members shape the company — your ideas, systems, and decisions will be felt for years.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main className="pt-[72px]">
        {/* Hero */}
        <section className="bg-eccellere-ink py-20 text-white">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-eccellere-gold">
              Careers
            </p>
            <h1 className="mb-4 font-display text-4xl font-semibold md:text-5xl">
              Build the Future of MSME Consulting
            </h1>
            <p className="max-w-2xl text-lg text-white/70">
              We&apos;re a small team doing ambitious work. If you want your
              contributions to matter from day one, Eccellere is for you.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="border-b py-16">
          <div className="mx-auto max-w-[1280px] px-6">
            <h2 className="mb-10 font-display text-2xl font-semibold text-eccellere-ink">
              How We Work
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {values.map((v) => (
                <div key={v.title}>
                  <h3 className="mb-2 font-semibold text-eccellere-ink">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-mid">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Roles */}
        <section className="py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <h2 className="mb-10 font-display text-2xl font-semibold text-eccellere-ink">
              Open Roles
            </h2>
            <div className="flex flex-col gap-5">
              {openRoles.map((role) => (
                <div
                  key={role.title}
                  className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-lg font-semibold text-eccellere-ink">
                        {role.title}
                      </h3>
                      <span className="rounded-full bg-gold-pale px-3 py-0.5 text-xs font-medium text-eccellere-gold">
                        {role.team}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{role.type}</p>
                    <p className="text-sm text-ink-mid">{role.description}</p>
                  </div>
                  <Button asChild size="sm" className="shrink-0 self-start">
                    <Link href={`/contact?type=careers&role=${encodeURIComponent(role.title)}`}>
                      Apply
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* No role listed CTA */}
            <div className="mt-12 rounded-lg border border-dashed border-stone-300 bg-stone-50 py-10 text-center">
              <p className="mb-1 text-sm font-medium text-ink-mid">
                Don&apos;t see a role that fits?
              </p>
              <p className="mb-5 text-sm text-stone-500">
                We&apos;re always interested in exceptional people. Send us a note.
              </p>
              <Button asChild variant="outline">
                <Link href="/contact?type=careers">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
