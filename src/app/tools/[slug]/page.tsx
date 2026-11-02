import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { getPublishedTool } from "@/lib/tools/service";
import type { ToolRecord } from "@/lib/tools/repo";
import type { DeclarativeTool } from "@/lib/strategyModels/declarative";
import { renderDiagram } from "@/lib/strategyModels/diagrams/templates";
import Workspace from "./Workspace";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string): Promise<ToolRecord | null> {
  try { return await getPublishedTool(prismaRepo, slug); } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await find(slug);
  if (!tool) return { title: "Tool not found" };
  return { title: `${tool.name}: guided worksheet`, description: tool.does ?? undefined };
}

const PRINT_CSS = "@media print{header,footer,nav,.no-print{display:none!important}main{padding-top:0!important}body{background:#fff!important}}";

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = await find(slug);
  if (!tool) notFound();
  const def = tool.definition as DeclarativeTool;
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user?.email;
  const diagram = def.diagram ? (() => { try { return renderDiagram(def.diagram); } catch { return ""; } })() : "";
  const ref = def.reference;
  const originator = [ref.originator, ref.year].filter(Boolean).join(", ");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <Header />
      <main id="main-content" className="bg-eccellere-cream pt-[72px]">
        <section className="bg-eccellere-ink">
          <div className="mx-auto max-w-[1100px] px-6 py-12">
            <Link href="/tools" className="no-print text-xs text-white/60 hover:text-eccellere-gold">&larr; All tools</Link>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">{tool.category}{tool.groupName ? ` · ${tool.groupName}` : ""}</p>
            <h1 className="mt-2 font-display text-[clamp(30px,5vw,52px)] font-light leading-[1.1] text-eccellere-cream">{tool.name}</h1>
            <p className="mt-4 max-w-3xl text-base font-light text-white/70">{def.does}</p>
          </div>
        </section>

        <div className="mx-auto max-w-[1100px] px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <section className="rounded bg-white p-5 shadow-sm" aria-labelledby="route">
              <h2 id="route" className="font-display text-xl font-medium text-eccellere-ink">When to use it</h2>
              <p className="mt-2 text-sm text-ink-mid">{def.whenToUse}</p>
              {def.whenNotToUse && (<><h3 className="mt-4 text-sm font-medium text-eccellere-ink">When not to use it</h3><p className="mt-1 text-sm text-ink-mid">{def.whenNotToUse}</p></>)}
              <h3 className="mt-4 text-sm font-medium text-eccellere-ink">About the method</h3>
              <p className="mt-1 text-sm text-ink-mid">{ref.summary}</p>
              <p className="mt-2 text-xs text-ink-light">{originator ? `Source: ${originator}.` : "Originator not stated."}</p>
              {ref.howToRead.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-medium text-eccellere-ink">How to read the diagram</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-mid">{ref.howToRead.map((l, i) => <li key={i}>{l}</li>)}</ul>
                </>
              )}
              {def.next && (<><h3 className="mt-4 text-sm font-medium text-eccellere-ink">What comes next</h3><p className="mt-1 text-sm text-ink-mid">{def.next}</p></>)}
            </section>
            <section className="rounded bg-white p-4 shadow-sm" aria-label="Diagram of the method">
              {diagram ? <div dangerouslySetInnerHTML={{ __html: diagram }} /> : <p className="p-4 text-sm text-ink-light">This method has no standard diagram. The worksheet below is the whole tool.</p>}
              {ref.caption && <p className="mt-2 text-xs text-ink-light">{ref.caption}</p>}
            </section>
          </div>

          {signedIn ? (
            <Workspace slug={slug} definition={def} toolName={tool.name} />
          ) : (
            <section className="mt-8 rounded border border-eccellere-gold/40 bg-white p-6 text-center shadow-sm">
              <h2 className="font-display text-2xl font-medium text-eccellere-ink">Use this tool, free</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-mid">
                Sign in to open the worksheet. Your work saves as you type, the AI can draft the parts you have not filled in, and you finish with an analysis and a 30/60/90-day action plan.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href={`/login?next=/tools/${slug}`} className="bg-eccellere-ink px-5 py-2.5 text-sm text-white hover:opacity-90">Sign in</Link>
                <Link href="/register" className="border border-eccellere-ink/30 px-5 py-2.5 text-sm text-eccellere-ink hover:bg-eccellere-cream">Create a free account</Link>
              </div>
            </section>
          )}

          <p className="no-print mt-8 text-xs text-ink-light">
            {tool.source === "ai" ? "Drafted with AI" : "Written"} and reviewed by Eccellere{tool.reviewedAt ? ` on ${tool.reviewedAt.toLocaleDateString("en-GB")}` : ""}. Guidance, not advice: apply your own judgement.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
