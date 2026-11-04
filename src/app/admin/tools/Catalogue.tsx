"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";
import { StatusChip, statusLabel } from "./ReviewPanel";

export interface CatalogueRow {
  slug: string; name: string; category: string; practice: string | null; source: string; groupName: string | null; status: string;
  errors: number; warnings: number; standards: { score: number; level: string } | null;
}

const field = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";
type BulkKind = "review" | "expose" | "withdraw" | "archive" | "delete";
const BULK_LABEL: Record<BulkKind, string> = { review: "Mark reviewed", expose: "Expose to clients", withdraw: "Withdraw from clients", archive: "Archive", delete: "Delete" };

/**
 * Step 3: every tool, with the clean-up controls. Select any number of tools and fix them with AI, mark them reviewed, expose or withdraw them,
 * archive them, or delete them. Each tool follows the same rules as on its own screen, and anything that cannot be done says why.
 */
export default function Catalogue({ rows, categories, open, setOpen, reload, aiReady }: {
  rows: CatalogueRow[]; categories: string[]; open: string | null; setOpen: (slug: string | null) => void; reload: () => void; aiReady: boolean;
}) {
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<{ title: string; lines: { slug: string; ok: boolean; text: string }[] } | null>(null);
  const [fixing, setFixing] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => (filterCat === "All" || r.category === filterCat) && (filterStatus === "All" || r.status === filterStatus)
      && (!onlyErrors || r.errors > 0) && (!n || `${r.name} ${r.groupName ?? ""} ${r.practice ?? ""}`.toLowerCase().includes(n)));
  }, [rows, filterCat, filterStatus, onlyErrors, q]);

  const nameOf = (slug: string) => rows.find((r) => r.slug === slug)?.name ?? slug;
  const sel = shown.filter((r) => picked.has(r.slug));
  const allShownPicked = shown.length > 0 && shown.every((r) => picked.has(r.slug));
  const toggle = (slug: string) => setPicked((p) => { const n = new Set(p); if (n.has(slug)) n.delete(slug); else n.add(slug); return n; });
  const toggleAll = () => setPicked((p) => { const n = new Set(p); if (allShownPicked) shown.forEach((r) => n.delete(r.slug)); else shown.forEach((r) => n.add(r.slug)); return n; });
  const fixable = (r: CatalogueRow) => r.status !== "PUBLISHED" && r.status !== "ARCHIVED" && r.source !== "strategy-hub";

  async function bulk(kind: BulkKind) {
    const slugs = sel.map((r) => r.slug);
    if (!slugs.length) return;
    if (kind === "delete" && !confirm(`Delete ${slugs.length} tool${slugs.length === 1 ? "" : "s"} for good? Tools that are live, or that people have saved work in, are kept and the reason is shown.`)) return;
    if (kind === "archive" && !confirm(`Archive ${slugs.length} tool${slugs.length === 1 ? "" : "s"}? They disappear from the library and the marketplace.`)) return;
    setBusy(kind); setReport(null);
    const r = await fetch("/api/admin/tools/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: kind, slugs }) });
    const d = await readJson(r);
    setBusy(null);
    if (!r.ok) return setReport({ title: BULK_LABEL[kind], lines: [{ slug: "", ok: false, text: d.error ?? "That did not work." }] });
    const results = d.results as { slug: string; ok: boolean; message?: string }[];
    setReport({ title: BULK_LABEL[kind], lines: results.map((x) => ({ slug: x.slug, ok: x.ok, text: x.ok ? "Done" : x.message ?? "Could not do that." })) });
    setPicked(new Set(results.filter((x) => !x.ok).map((x) => x.slug)));
    if (open && results.some((x) => x.ok && x.slug === open) && kind === "delete") setOpen(null);
    reload();
  }

  /** Fix with AI, one tool at a time (each is a slow AI call), two at once. */
  async function fixWithAi(slugs: string[]) {
    const list = slugs.filter((s) => { const r = rows.find((x) => x.slug === s); return r && fixable(r); });
    if (!list.length) return setReport({ title: "Fix with AI", lines: [{ slug: "", ok: false, text: "None of the selected tools can be fixed with AI (live, archived and hand-built tools are left alone)." }] });
    stop.current = false; setReport(null); setBusy("fix"); setFixing({ done: 0, total: list.length });
    const lines: { slug: string; ok: boolean; text: string }[] = [];
    let next = 0; let done = 0;
    const worker = async () => {
      while (!stop.current && next < list.length) {
        const slug = list[next++];
        try {
          const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fix" }) });
          const d = await readJson(r);
          if (!r.ok) lines.push({ slug, ok: false, text: d.error ?? "Could not fix." });
          else lines.push({ slug, ok: d.applied && d.after === 0, text: d.applied ? (d.after === 0 ? `Fixed (${d.before} problem${d.before === 1 ? "" : "s"} cleared)` : `Improved: ${d.before} problems down to ${d.after}. Open it to finish.`) : (d.notes?.[0] ?? "Nothing changed.") });
        } catch { lines.push({ slug, ok: false, text: "Lost the connection." }); }
        done++; setFixing({ done, total: list.length });
      }
    };
    await Promise.all([worker(), worker()]);
    setBusy(null); setFixing(null);
    setReport({ title: `Fix with AI: ${lines.filter((l) => l.ok).length} of ${list.length} fixed${stop.current ? " (stopped)" : ""}`, lines });
    reload();
  }

  /** Automatic clean-up, no AI and no cost: removes results and columns that cannot run and repairs broken diagram grids. Four at once. */
  async function tidy(slugs: string[]) {
    const list = slugs.filter((s) => { const r = rows.find((x) => x.slug === s); return r && fixable(r); });
    if (!list.length) return setReport({ title: "Clean up", lines: [{ slug: "", ok: false, text: "None of these tools can be cleaned up (live, archived and hand-built tools are left alone)." }] });
    stop.current = false; setReport(null); setBusy("tidy"); setFixing({ done: 0, total: list.length });
    const lines: { slug: string; ok: boolean; text: string }[] = [];
    const left = new Map<string, number>();
    let next = 0; let done = 0; let changed = 0;
    const worker = async () => {
      while (!stop.current && next < list.length) {
        const slug = list[next++];
        try {
          const r = await fetch(`/api/admin/tools/${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tidy" }) });
          const d = await readJson(r);
          if (!r.ok) lines.push({ slug, ok: false, text: d.error ?? "Could not clean up." });
          else {
            if (d.applied) changed++;
            for (const e of (d.remaining ?? []) as string[]) { const k = e.replace(/\[\d+\]/g, "[n]").replace(/\d+\/100/, "n/100").slice(0, 140); left.set(k, (left.get(k) ?? 0) + 1); }
            if (d.applied || (d.remaining?.length ?? 0) > 0) lines.push({ slug, ok: d.applied && d.after === 0, text: d.applied ? (d.after === 0 ? "Cleaned up: no problems left" : `Cleaned up: ${d.before} problems down to ${d.after}`) : `Nothing to clean automatically (${d.after} problem${d.after === 1 ? "" : "s"} remain)` });
          }
        } catch { lines.push({ slug, ok: false, text: "Lost the connection." }); }
        done++; setFixing({ done, total: list.length });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setBusy(null); setFixing(null);
    const common = [...left.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => ({ slug: "", ok: false, text: `${n} tool${n === 1 ? "" : "s"} still: ${k}` }));
    setReport({ title: `Clean up: ${changed} of ${list.length} changed. What is still wrong, most common first:`, lines: [...common, ...lines] });
    reload();
  }

  const clearable = rows.filter((r) => r.errors > 0 && fixable(r)).length;

  return (
    <section className="mt-6 rounded bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-medium text-eccellere-ink">3. Review, fix and publish</h2>
        <span className="text-xs text-ink-mid">{rows.length} tool{rows.length === 1 ? "" : "s"}, {rows.filter((r) => r.status === "PUBLISHED").length} live for clients, {rows.filter((r) => r.errors > 0).length} with problems</span>
        <input type="search" aria-label="Search tools" placeholder="Search" className={cn(field, "ml-auto w-40")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by section" className={cn(field, "w-44")} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option>All</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Filter by status" className={cn(field, "w-44")} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {["DRAFT", "NEEDS_REVIEW", "REVIEWED", "PUBLISHED", "ARCHIVED"].map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-1 text-xs"><input type="checkbox" className="accent-[#B8913A]" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} /> Only with problems</label>
      </div>

      {clearable > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded bg-amber-50 p-3 text-sm text-amber-950">
          <span>{clearable} tool{clearable === 1 ? " has" : "s have"} problems to fix.</span>
          <button className="inline-flex items-center gap-1 bg-eccellere-gold-deep px-3 py-1.5 text-xs text-white disabled:opacity-40" disabled={!!busy} onClick={() => tidy(rows.filter((r) => r.errors > 0 && fixable(r)).map((r) => r.slug))}>
            Clean up all {clearable} automatically (no AI)
          </button>
          <button className="inline-flex items-center gap-1 bg-eccellere-ink px-3 py-1.5 text-xs text-white disabled:opacity-40" disabled={!!busy || !aiReady} onClick={() => fixWithAi(rows.filter((r) => r.errors > 0 && fixable(r)).map((r) => r.slug))}>
            <Sparkles className="h-3.5 w-3.5" /> Fix all {clearable} with AI
          </button>
          {!aiReady && <span className="text-xs">Switch on an AI provider first.</span>}
        </div>
      )}

      {sel.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-eccellere-gold/50 bg-eccellere-cream p-3" role="toolbar" aria-label="Actions for the selected tools">
          <span className="text-sm font-medium text-eccellere-ink">{sel.length} selected</span>
          <button className="inline-flex items-center gap-1 bg-eccellere-ink px-3 py-1.5 text-xs text-white disabled:opacity-40" disabled={!!busy || !aiReady} onClick={() => fixWithAi(sel.map((r) => r.slug))}><Sparkles className="h-3.5 w-3.5" /> Fix with AI</button>
          {(["review", "expose", "withdraw", "archive"] as BulkKind[]).map((k) => (
            <button key={k} className="border border-eccellere-ink/25 bg-white px-3 py-1.5 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={!!busy} onClick={() => bulk(k)}>{busy === k ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : BULK_LABEL[k]}</button>
          ))}
          <button className="inline-flex items-center gap-1 border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40" disabled={!!busy} onClick={() => bulk("delete")}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          <button className="ml-auto text-xs underline" onClick={() => setPicked(new Set())}>Clear selection</button>
        </div>
      )}
      {fixing && (
        <p className="mt-3 text-sm text-ink-mid" role="status"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Fixing {fixing.done} of {fixing.total}… each tool takes up to a minute.{" "}
          <button className="underline" onClick={() => { stop.current = true; }}>Stop</button></p>
      )}
      {report && (
        <div className="mt-3 rounded border border-eccellere-ink/15 p-3 text-sm" role="status">
          <p className="font-medium text-eccellere-ink">{report.title}</p>
          <ul className="mt-1 max-h-48 overflow-auto text-xs">
            {report.lines.map((l, i) => <li key={`${l.slug}-${i}`} className={l.ok ? "text-emerald-800" : "text-red-700"}>{l.slug ? `${nameOf(l.slug)}: ` : ""}{l.text}</li>)}
          </ul>
          <button className="mt-1 text-[11px] underline" onClick={() => setReport(null)}>Hide</button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-ink-light">{rows.length === 0 ? "No tools yet. Add some above." : "No tools match those filters."}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-ink-light">
              <tr>
                <th className="w-8 py-2 pr-2"><input type="checkbox" aria-label="Select all shown" className="accent-[#B8913A]" checked={allShownPicked} onChange={toggleAll} /></th>
                <th className="pr-3">Tool</th><th className="pr-3">Section</th><th className="pr-3">Practice</th><th className="pr-3">Status</th><th className="pr-3">Standard</th><th className="pr-3">Checks</th><th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.slug} className={cn("border-t border-eccellere-ink/5", open === r.slug && "bg-eccellere-cream")}>
                  <td className="py-2 pr-2"><input type="checkbox" aria-label={`Select ${r.name}`} className="accent-[#B8913A]" checked={picked.has(r.slug)} onChange={() => toggle(r.slug)} /></td>
                  <td className="pr-3 font-medium text-eccellere-ink">{r.name}{r.groupName && <span className="block text-[11px] font-normal text-ink-light">{r.groupName}</span>}</td>
                  <td className="pr-3 text-xs text-ink-mid">{r.category}</td>
                  <td className="pr-3 text-xs text-ink-mid">{r.practice ?? "-"}</td>
                  <td className="pr-3"><StatusChip s={r.status} /></td>
                  <td className="pr-3 text-xs">{r.standards ? `${r.standards.score}/100 · ${r.standards.level}` : r.source === "strategy-hub" ? "Hand-built" : "-"}</td>
                  <td className="pr-3 text-xs">{r.errors > 0 ? <span className="text-red-700">{r.errors} to fix</span> : <span className="text-emerald-700">clear</span>}{r.warnings > 0 && <span className="text-ink-light"> · {r.warnings} notes</span>}</td>
                  <td className="whitespace-nowrap text-right">
                    {r.errors > 0 && fixable(r) && <button className="mr-1 inline-flex items-center gap-1 bg-eccellere-ink px-2.5 py-1 text-xs text-white disabled:opacity-40" disabled={!!busy || !aiReady} onClick={() => fixWithAi([r.slug])}><Sparkles className="h-3 w-3" /> Fix with AI</button>}
                    <button className="border border-eccellere-ink/20 px-3 py-1 text-xs hover:bg-white" onClick={() => setOpen(open === r.slug ? null : r.slug)}>{open === r.slug ? "Close" : r.status === "PUBLISHED" || r.status === "REVIEWED" ? "View" : "Review"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
