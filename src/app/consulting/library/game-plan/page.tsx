import type { Metadata } from "next";
import Link from "next/link";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { gamePlanOf, type GamePlan } from "@/lib/tools/gameplan";
import LibraryShell from "../LibraryShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My game plan", robots: { index: false, follow: false } };

/** The actions from every tool the signed-in consultant has analysed, gathered in one 30/60/90-day plan. */
export default async function GamePlanPage() {
  return (
    <LibraryShell next="/consulting/library/game-plan">
      {async (who) => {
        let plan: GamePlan | null = null;
        try { plan = gamePlanOf(await prismaRepo.listFillinRows(who.id), await prismaRepo.listTools()); } catch { plan = null; }
        return (
          <div className="mx-auto max-w-[1100px] px-6 py-10">
            <Link href="/consulting/library" className="no-print text-xs text-ink-mid hover:text-eccellere-gold">&larr; Consulting library</Link>
            <h1 className="mt-3 font-display text-3xl font-light text-eccellere-ink">My game plan</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-mid">
              The actions from the analysis in each tool you have worked on, in one 30/60/90-day plan. Open a tool to change its answers or write its analysis again; this page updates.
            </p>
            {!plan || plan.total === 0 ? (
              <p className="mt-8 rounded bg-white p-6 text-sm text-ink-mid shadow-sm">
                No actions yet. Open a tool in the <Link className="text-eccellere-gold underline" href="/consulting/library">library</Link>, fill in the worksheet, and ask for the analysis. Its action plan appears here.
              </p>
            ) : (
              plan.windows.map((w) => w.items.length > 0 && (
                <section key={w.label} className="mt-8 rounded bg-white p-5 shadow-sm break-inside-avoid" aria-label={w.label}>
                  <h2 className="font-display text-xl font-medium text-eccellere-ink">{w.label} <span className="text-sm font-normal text-ink-light">{w.items.length}</span></h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead><tr className="text-[11px] uppercase tracking-wide text-ink-light"><th className="pb-1 pr-3">Action</th><th className="pb-1 pr-3">Owner (role)</th><th className="pb-1 pr-3">Priority</th><th className="pb-1">From</th></tr></thead>
                      <tbody>
                        {w.items.map((a, i) => (
                          <tr key={i} className="border-t border-eccellere-ink/10 align-top">
                            <td className="py-2 pr-3">{a.action}</td><td className="py-2 pr-3">{a.owner}</td><td className="py-2 pr-3">{a.priority}</td>
                            <td className="py-2"><Link className="text-eccellere-gold underline" href={`/consulting/library/${a.toolSlug}`}>{a.toolName}</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        );
      }}
    </LibraryShell>
  );
}
