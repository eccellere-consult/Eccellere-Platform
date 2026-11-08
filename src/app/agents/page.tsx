import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AREAS, allAgents, pilotCount } from "@/lib/agents/catalogue";
import NotifyForm from "./NotifyForm";

export const metadata: Metadata = {
  title: "Agent Marketplace",
  description:
    "Eccellere+ Agent Marketplace: ready-to-deploy agents and tools mapped to every functional area of a business, from strategic planning to HR.",
};

export default function AgentMarketplacePage() {
  const total = allAgents().length;
  const pilots = pilotCount();
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Eccellere+ Agent Marketplace</p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Agents for every <span className="italic">function of the business</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/60">
              A catalogue of agents and tools mapped to each functional area, from strategic planning through to HR. Each one is built on
              established management methods and fixed formulas, so the same inputs always give the same answer.
            </p>
            <p className="mt-6 text-sm text-white/60">
              {total} agents in {AREAS.filter((a) => !a.proposed).length} functional areas · {pilots} in pilot · the rest are coming soon
            </p>
          </div>
        </section>

        <section className="bg-eccellere-cream py-16 lg:py-24">
          <div className="mx-auto max-w-[1280px] space-y-14 px-6">
            {AREAS.map((area) => (
              <div key={area.id} id={area.id}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-eccellere-ink/10 pb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">{area.code}</span>
                  <h2 className="font-display text-2xl text-eccellere-ink">{area.name}</h2>
                  {area.proposed && <span className="rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-mid">Area being added</span>}
                </div>
                <p className="mt-2 text-sm text-ink-mid">{area.purpose}</p>

                {area.agents.length > 0 && (
                  <ul className="mt-6 grid gap-4 md:grid-cols-3">
                    {area.agents.map((agent) => (
                      <li key={agent.slug} className="flex flex-col border border-eccellere-ink/10 bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-eccellere-ink">{agent.name}</h3>
                          <span className={agent.status === "pilot" ? "shrink-0 rounded-sm bg-eccellere-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-deep" : "shrink-0 rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-mid"}>
                            {agent.status === "pilot" ? "Pilot" : "Coming soon"}
                          </span>
                        </div>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-mid">{agent.does}</p>
                        {agent.status === "pilot" && agent.tool && (
                          <Link href={`/tools/${agent.tool}`} className="mt-4 text-sm font-medium text-gold-deep underline underline-offset-2">Open the pilot →</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-eccellere-ink py-16">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h2 className="font-display text-3xl font-light text-eccellere-cream">Get notified as agents go live</h2>
            <p className="mx-auto mb-8 mt-3 max-w-xl text-sm text-white/60">
              Leave your email. This also adds you to the Eccellere+ newsletter.
            </p>
            <NotifyForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
