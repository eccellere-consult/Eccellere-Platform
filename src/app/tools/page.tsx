import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { MARKET_CATEGORIES } from "@/lib/tools/service";
import ToolsBrowser, { type ToolCard } from "./ToolsBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Strategy and problem-solving tools",
  description:
    "Guided worksheets for strategy, problem solving, business analysis, project and change management, and decision models. Each has a diagram, when to use it, a workspace that saves as you go, and AI help. Free when you sign in.",
};

async function loadTools(): Promise<ToolCard[]> {
  try {
    const rows = await prismaRepo.listTools({ status: "PUBLISHED" });
    return rows.map((t) => ({ slug: t.slug, name: t.name, category: t.category, groupName: t.groupName, does: t.does ?? "", level: t.quality?.standards?.level ?? null }));
  } catch {
    return []; // tables not created yet, or the database is unreachable: show the empty state instead of an error page
  }
}

export default async function ToolsPage() {
  const tools = await loadTools();
  return (
    <>
      <Header />
      <main id="main-content" className="bg-eccellere-cream pt-[72px]">
        <section className="bg-eccellere-ink">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Tools</p>
            <h1 className="font-display text-[clamp(32px,5vw,56px)] font-light leading-[1.1] text-eccellere-cream">
              Think it through, <span className="italic">tool by tool</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base font-light text-white/60">
              Proven strategy and problem-solving methods as working worksheets. Each one shows the model, tells you when to use it and when not to, saves your work as you type,
              calculates what can be calculated, and ends in a 30/60/90-day action plan. AI can draft the parts you have not filled in. Free when you sign in.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-[1280px] px-6 py-10">
          <ToolsBrowser tools={tools} categories={[...MARKET_CATEGORIES]} />
        </section>
      </main>
      <Footer />
    </>
  );
}
