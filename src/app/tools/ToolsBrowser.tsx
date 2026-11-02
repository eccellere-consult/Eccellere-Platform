"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolCard { slug: string; name: string; category: string; groupName: string | null; does: string; level: string | null }

export default function ToolsBrowser({ tools, categories }: { tools: ToolCard[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tools) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [tools]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tools.filter((t) => (cat === "All" || t.category === cat)
      && (!needle || `${t.name} ${t.groupName ?? ""} ${t.does}`.toLowerCase().includes(needle)));
  }, [tools, q, cat]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" aria-hidden />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tools" placeholder="Search tools, for example fishbone or pareto"
            className="w-full border border-eccellere-ink/20 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-eccellere-gold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections">
          {["All", ...categories.filter((c) => counts[c])].map((c) => (
            <button
              key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={cn("border px-3 py-1.5 text-xs transition-colors", cat === c ? "border-eccellere-ink bg-eccellere-ink text-white" : "border-eccellere-ink/20 bg-white text-ink-mid hover:border-eccellere-gold")}
            >
              {c}{c !== "All" && <span className="ml-1 opacity-60">{counts[c]}</span>}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-ink-mid">{tools.length === 0 ? "The first tools are being prepared. Please check back soon." : "No tool matches that search. Try a shorter word or choose All."}</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}`} className="flex h-full flex-col border border-eccellere-ink/10 bg-white p-5 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-eccellere-gold">
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-eccellere-gold">{t.category}{t.groupName ? ` · ${t.groupName}` : ""}</span>
                <span className="mt-2 font-display text-2xl font-light text-eccellere-ink">{t.name}</span>
                <span className="mt-2 flex-1 text-sm text-ink-mid">{t.does}</span>
                <span className="mt-4 flex items-center justify-between text-xs text-ink-light">
                  <span>Free when you sign in</span>
                  {t.level === "L2" && <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-emerald-800">Full worksheet and action plan</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
