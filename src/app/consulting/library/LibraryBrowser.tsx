"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LibraryCard {
  slug: string; name: string; practice: string | null; category: string; groupName: string | null; does: string;
  live: boolean; handBuilt: boolean; layer: string | null; stages: string | null;
}

const LAYERS: Record<string, string> = {
  L1: "Strategy and environment", L2: "Business model", L3: "Financial", L4: "Digital and AI", L5: "Organisation",
  L6: "Governance and KPIs", L7: "Go-to-market", L8: "People", L9: "Execution",
};

/**
 * The consulting library, two ways in: by practice (how the team organises engagements) and by framework layer (how the Strategy Hub orders
 * its frameworks: environment, business model, finance ... execution). Hand-built tools carry a layer and lifecycle stages; AI-drafted tools
 * appear under "Other tools" in the layer view until they are placed.
 */
export default function LibraryBrowser({ tools, practices }: { tools: LibraryCard[]; practices: string[] }) {
  const [view, setView] = useState<"practice" | "layer">("practice");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState("All");

  const keyOf = (t: LibraryCard) => (view === "practice" ? t.practice ?? "Not set" : t.layer ?? "Other tools");
  const order = view === "practice" ? [...practices, "Not set"] : [...Object.keys(LAYERS), "Other tools"];
  const label = (k: string) => (view === "layer" && LAYERS[k] ? `${k} ${LAYERS[k]}` : k);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tools.filter((t) => !needle || `${t.name} ${t.groupName ?? ""} ${t.does} ${t.practice ?? ""}`.toLowerCase().includes(needle));
  }, [tools, q]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of filtered) {
      const k = view === "practice" ? t.practice ?? "Not set" : t.layer ?? "Other tools";
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [filtered, view]);
  const groups = order.filter((k) => counts[k] && (pick === "All" || pick === k));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the library" placeholder="Search by tool, practice or word"
            className="w-full border border-eccellere-ink/20 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-eccellere-gold focus:outline-none" />
        </div>
        <div className="inline-flex border border-eccellere-ink/20 text-xs" role="tablist" aria-label="View">
          {(["practice", "layer"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); setPick("All"); }} className={cn("px-3 py-2", view === v ? "bg-eccellere-ink text-white" : "bg-white hover:bg-eccellere-cream")}>
              {v === "practice" ? "By practice" : "By framework layer"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Groups">
        {["All", ...order.filter((k) => counts[k])].map((k) => (
          <button key={k} role="tab" aria-selected={pick === k} onClick={() => setPick(k)} className={cn("border px-3 py-1.5 text-xs", pick === k ? "border-eccellere-ink bg-eccellere-ink text-white" : "border-eccellere-ink/20 bg-white text-ink-mid hover:border-eccellere-gold")}>
            {k === "All" ? `All ${filtered.length}` : `${label(k)} ${counts[k]}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-ink-mid">{tools.length === 0 ? "The library is empty. In the admin area, add the Strategy Hub tools or draft some tools, review them, and they appear here." : "No tool matches that search."}</p>
      ) : (
        groups.map((k) => (
          <section key={k} className="mt-8" aria-label={label(k)}>
            <h2 className="font-display text-xl font-medium text-eccellere-ink">{label(k)} <span className="text-sm font-normal text-ink-light">{counts[k]}</span></h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.filter((t) => (view === "practice" ? t.practice ?? "Not set" : t.layer ?? "Other tools") === k).map((t) => (
                <li key={t.slug}>
                  <Link href={`/consulting/library/${t.slug}`} className="flex h-full flex-col border border-eccellere-ink/10 bg-white p-4 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-eccellere-gold">
                    <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eccellere-gold">{view === "practice" ? t.category : t.practice ?? t.category}{t.groupName ? ` · ${t.groupName}` : ""}</span>
                    <span className="mt-1 font-display text-lg font-medium text-eccellere-ink">{t.name}</span>
                    <span className="mt-1 flex-1 text-sm text-ink-mid">{t.does}</span>
                    <span className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={cn("rounded-sm px-2 py-0.5", t.live ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700")}>{t.live ? "Live for clients" : "Library only"}</span>
                      {t.handBuilt && <span className="rounded-sm bg-violet-50 px-2 py-0.5 text-violet-800">Hand-built</span>}
                      {t.stages && <span className="text-ink-light">Stages {t.stages}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
