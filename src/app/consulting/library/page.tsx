import type { Metadata } from "next";
import Link from "next/link";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { PRACTICES } from "@/lib/tools/practice";
import { isCodeDefinition } from "@/lib/tools/runtime";
import LibraryShell from "./LibraryShell";
import LibraryBrowser, { type LibraryCard } from "./LibraryBrowser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consulting library", robots: { index: false, follow: false } };

async function loadCards(): Promise<LibraryCard[]> {
  try {
    const rows = await prismaRepo.listTools();
    return rows
      .filter((t) => t.status === "REVIEWED" || t.status === "PUBLISHED")
      .map((t) => {
        const code = isCodeDefinition(t.definition) ? t.definition : null;
        return {
          slug: t.slug, name: t.name, practice: t.practice, category: t.category, groupName: t.groupName, does: t.does ?? "",
          live: t.status === "PUBLISHED", handBuilt: !!code, layer: code?.layer ?? null,
          stages: code && code.phaseStart !== undefined ? `${code.phaseStart} to ${code.phaseEnd}` : null,
        };
      });
  } catch {
    return []; // tables not created yet
  }
}

/** The consulting library: every reviewed tool, whether or not clients can see it yet. Eccellere team only. */
export default async function ConsultingLibraryPage() {
  return (
    <LibraryShell next="/consulting/library">
      {async () => {
        const cards = await loadCards();
        return (
          <>
            <section className="bg-eccellere-ink">
              <div className="mx-auto max-w-[1280px] px-6 py-14">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Eccellere consulting</p>
                <h1 className="font-display text-[clamp(30px,5vw,52px)] font-light leading-[1.1] text-eccellere-cream">The consulting <span className="italic">library</span></h1>
                <p className="mt-4 max-w-2xl text-base font-light text-white/60">
                  Every strategy, process, digital, organisation and technology tool in one place, each with its method, a working worksheet, AI help and an action plan.
                  Tools are exposed to clients only when you choose.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs">
                  <Link href="/consulting/library/game-plan" className="border border-white/30 px-4 py-2 text-white hover:bg-white/10">My game plan: actions from my tools</Link>
                  <Link href="/admin/tools" className="border border-white/30 px-4 py-2 text-white hover:bg-white/10">Manage tools (admin)</Link>
                </div>
              </div>
            </section>
            <section className="mx-auto max-w-[1280px] px-6 py-10">
              <LibraryBrowser tools={cards} practices={[...PRACTICES]} />
            </section>
          </>
        );
      }}
    </LibraryShell>
  );
}
