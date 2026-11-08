import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AREAS, allAgents } from "@/lib/agents/catalogue";
import { pilotByAgent } from "@/lib/agents/pilots";
import { inputsOf, outputsOf } from "@/lib/agents/sipoc";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getPublishedTool } from "@/lib/tools/service";
import { loadEdits, sipocWithEdit } from "@/lib/agents/overrides";
import { prismaEditRepo } from "@/lib/agents/editRepo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = allAgents().find((a) => a.slug === slug);
  return agent ? { title: `${agent.name} | Agent Marketplace`, description: agent.does } : { title: "Agent Marketplace" };
}

/** Is the pilot's tool published for clients? A database problem must never break this page, so it counts as "not yet". */
async function isLive(slug: string): Promise<boolean> {
  try { return !!(await getPublishedTool(prismaRepo, slug)); } catch { return false; }
}

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gold-deep align-top";
const td = "px-3 py-3 align-top text-sm text-ink-mid";

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const agent = allAgents().find((a) => a.slug === slug);
  if (!agent) notFound();
  const area = AREAS.find((a) => a.agents.some((x) => x.slug === slug))!;
  const pilot = pilotByAgent(slug);
  const live = pilot ? await isLive(slug) : false;
  const edit = (await loadEdits(prismaEditRepo))[slug];
  const sipoc = pilot ? sipocWithEdit(pilot.sipoc, edit) : null;
  const does = edit?.does || agent.does;
  const inputs = pilot ? inputsOf(pilot.tool) : [];
  const outputs = pilot ? outputsOf(pilot.tool) : [];
  const results = outputs.filter((o) => o.kind === "result");
  const working = outputs.filter((o) => o.kind === "working");

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              <Link href="/agents" className="hover:underline">Agent Marketplace</Link> · {area.name}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(32px,5vw,56px)] font-light leading-[1.1] text-eccellere-cream">{agent.name}</h1>
            <p className="mt-5 max-w-2xl text-lg font-light text-white/60">{does}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-eccellere-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-eccellere-gold">
                {pilot ? (live ? "Pilot · open" : "Pilot · in review") : "Coming soon"}
              </span>
              {pilot && live && (
                <Link href={`/tools/${slug}`} className="bg-eccellere-gold px-5 py-2 text-sm font-medium text-eccellere-ink hover:opacity-90">Open the pilot →</Link>
              )}
            </div>
          </div>
        </section>

        {!pilot ? (
          <section className="bg-eccellere-cream py-16">
            <div className="mx-auto max-w-[1280px] px-6">
              <h2 className="font-display text-2xl text-eccellere-ink">Coming soon</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-mid">
                This agent is on the Eccellere+ roadmap and is not built yet. When its pilot is ready, this page will show what data it needs, how you
                provide and update that data, its SIPOC (suppliers, inputs, process, outputs, customers) and what it hands back.
              </p>
              <Link href="/agents" className="mt-6 inline-block text-sm font-medium text-gold-deep underline underline-offset-2">← Back to all agents</Link>
            </div>
          </section>
        ) : (
          <div className="bg-eccellere-cream py-14 lg:py-20">
            <div className="mx-auto max-w-[1280px] space-y-14 px-6">
              {/* SIPOC */}
              <section>
                <h2 className="font-display text-2xl text-eccellere-ink">SIPOC: how the agent works</h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-mid">Who supplies what, what goes in, what the agent does, what comes out, and who uses it.</p>
                <div className="mt-5 overflow-x-auto border border-eccellere-ink/10 bg-white">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="border-b border-eccellere-ink/10">
                        <th className={th}>Suppliers</th><th className={th}>Inputs</th><th className={th}>Process</th><th className={th}>Outputs</th><th className={th}>Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={td}><ul className="space-y-2">{sipoc!.suppliers.map((x) => <li key={x}>{x}</li>)}</ul></td>
                        <td className={td}><ul className="space-y-2">{inputs.map((i) => <li key={i.label}>{i.label}</li>)}</ul></td>
                        <td className={td}><ol className="list-decimal space-y-2 pl-4">{sipoc!.process.map((x) => <li key={x}>{x}</li>)}</ol></td>
                        <td className={td}><ul className="space-y-2">{results.map((o) => <li key={o.label}>{o.label}</li>)}</ul></td>
                        <td className={td}><ul className="space-y-2">{sipoc!.customers.map((x) => <li key={x}>{x}</li>)}</ul></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Input data */}
              <section>
                <h2 className="font-display text-2xl text-eccellere-ink">Input data it needs</h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-mid">Everything the agent asks for, in the order it asks. Columns marked &quot;worked out&quot; are calculated for you; you only fill the rest.</p>
                <div className="mt-5 overflow-x-auto border border-eccellere-ink/10 bg-white">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead><tr className="border-b border-eccellere-ink/10"><th className={th}>Data</th><th className={th}>Unit</th><th className={th}>What to enter</th></tr></thead>
                    <tbody className="divide-y divide-eccellere-ink/5">
                      {inputs.map((i) => (
                        <tr key={i.label}>
                          <td className={`${td} font-medium text-eccellere-ink`}>{i.label}{i.kind === "table" && <span className="ml-2 text-[10px] uppercase tracking-wider text-ink-mid">table</span>}</td>
                          <td className={td}>{i.unit ?? ""}</td>
                          <td className={td}>
                            {i.help}
                            {i.columns && (
                              <p className="mt-2 text-xs">
                                Columns: {i.columns.map((c) => `${c.header}${c.unit ? ` (${c.unit})` : ""}${c.computed ? " (worked out)" : ""}`).join("; ")}.
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Provide and update data */}
              <section>
                <h2 className="font-display text-2xl text-eccellere-ink">Provide and update your data</h2>
                <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-mid">
                  <li>Open the pilot and choose <strong>Download blank Excel template</strong>, or <strong>Download sample</strong> to see a filled example.</li>
                  <li>Fill the template with your own data and use <strong>Upload</strong> to load it; or type straight into the page. Both give the same result.</li>
                  <li>Your work saves automatically while you type, so you can come back and change any figure; results update at once.</li>
                  <li>To refresh: {sipoc!.refresh}</li>
                </ol>
                {!live && <p className="mt-3 text-sm text-ink-mid">The pilot is being reviewed and opens to clients once it is approved.</p>}
              </section>

              {/* Outputs */}
              <section>
                <h2 className="font-display text-2xl text-eccellere-ink">What you get back</h2>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div className="border border-eccellere-ink/10 bg-white p-5">
                    <h3 className="text-sm font-semibold text-eccellere-ink">Headline results</h3>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-mid">{results.map((o) => <li key={o.label}>{o.label}</li>)}</ul>
                    {working.length > 0 && (
                      <>
                        <h3 className="mt-5 text-sm font-semibold text-eccellere-ink">Working figures shown beside them</h3>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-mid">{working.map((o) => <li key={o.label}>{o.label}</li>)}</ul>
                      </>
                    )}
                  </div>
                  <div className="border border-eccellere-ink/10 bg-white p-5">
                    <h3 className="text-sm font-semibold text-eccellere-ink">In what form</h3>
                    <ul className="mt-3 space-y-3 text-sm text-ink-mid">
                      <li><strong className="text-eccellere-ink">Results at a glance</strong> on the page, updating as you type. <span className="text-gold-deep">Available</span></li>
                      <li><strong className="text-eccellere-ink">PDF report</strong> in the standard Eccellere layout, from Print / PDF on the tool page. <span className="text-gold-deep">Available</span></li>
                      <li><strong className="text-eccellere-ink">Dashboard over time</strong> that keeps each run and charts the change between runs. <span className="rounded-sm bg-eccellere-ink/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Planned</span></li>
                    </ul>
                    <p className="mt-4 text-xs text-ink-mid">The agent never lets AI invent a number: every result comes from the formulas below, and any AI writing is labelled and editable.</p>
                  </div>
                </div>
              </section>

              {/* Method */}
              <section>
                <h2 className="font-display text-2xl text-eccellere-ink">Method and limits</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2 text-sm leading-relaxed text-ink-mid">
                  <div><h3 className="font-semibold text-eccellere-ink">Based on</h3><p className="mt-1">{pilot.tool.reference.originator} ({pilot.tool.reference.year}).</p><p className="mt-2">{pilot.tool.reference.summary}</p></div>
                  <div>
                    <h3 className="font-semibold text-eccellere-ink">Use it when</h3><p className="mt-1">{pilot.tool.whenToUse}</p>
                    <h3 className="mt-3 font-semibold text-eccellere-ink">Do not use it when</h3><p className="mt-1">{pilot.tool.whenNotToUse}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
