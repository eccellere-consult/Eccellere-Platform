"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Search } from "lucide-react";
import { toCsv } from "@/lib/admin/stats";

interface Entry { id: string; at: string; who: string; role: string | null; action: string; rawAction: string; detail: string; ip: string | null }
interface Data { page: number; pages: number; total: number; entityTypes: string[]; actions: string[]; entries: Entry[] }
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function AdminAuditLog() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [type, setType] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const r = await fetch(`/api/admin/audit-log?${new URLSearchParams({ q: applied, entityType: type, action, page: String(page) })}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load.");
        if (live) setD(j);
      } catch (e) { if (live) setErr(e instanceof Error ? e.message : "Could not load."); } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [applied, type, action, page]);

  const search = () => { setApplied(q); setPage(1); };
  const csv = () => {
    if (!d) return;
    const text = toCsv([["When", "Who", "Role", "What", "Detail", "IP"], ...d.entries.map((e) => [when(e.at), e.who, e.role ?? "", e.action, e.detail, e.ip ?? ""])]);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = "audit-log.csv"; a.click();
  };
  const sel = "h-9 rounded-sm border border-eccellere-border bg-white px-2 text-sm text-eccellere-ink";

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Audit log</h1>
          {d && <span className="rounded-full bg-eccellere-ink/5 px-2 py-0.5 text-xs text-ink-mid">{d.total.toLocaleString("en-IN")} entries</span>}
          <div className="flex-1" />
          <button type="button" onClick={csv} disabled={!d?.entries.length} className="h-9 rounded-sm border border-eccellere-border px-3 text-sm text-eccellere-ink hover:bg-eccellere-cream disabled:opacity-50">Download this page (CSV)</button>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-6 py-8">
        <p className="mb-4 text-sm text-ink-mid">A record of sensitive actions taken in the admin area: who did it, what, and when. Entries cannot be edited here.</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-light" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }} placeholder="Search action or item" aria-label="Search the audit log" className="h-9 w-64 rounded-sm border border-eccellere-border bg-white pl-8 pr-2 text-sm" /></div>
          <button type="button" onClick={search} className="h-9 rounded-sm bg-eccellere-ink px-3 text-sm text-white">Search</button>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by item type" className={sel}><option value="">All item types</option>{d?.entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Filter by action" className={sel}><option value="">All actions</option>{d?.actions.map((a) => <option key={a} value={a}>{a.replace(/[_-]+/g, " ")}</option>)}</select>
        </div>

        {err && <p className="mt-4 rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>}
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm">
          {loading && !d ? <p className="p-8 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-eccellere-ink/5 text-[11px] uppercase tracking-wider text-ink-light"><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">What</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">IP</th></tr></thead>
                <tbody className="divide-y divide-eccellere-ink/5">
                  {d?.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-eccellere-cream/50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-mid">{when(e.at)}</td>
                      <td className="px-4 py-3 text-eccellere-ink">{e.who}{e.role && <span className="ml-2 rounded-sm bg-eccellere-cream px-1.5 py-0.5 text-[10px] uppercase text-eccellere-gold-deep">{e.role.replace(/_/g, " ").toLowerCase()}</span>}</td>
                      <td className="px-4 py-3 text-ink-mid">{e.action}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-xs text-ink-light" title={e.detail}>{e.detail}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-ink-light">{e.ip ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {d && d.entries.length === 0 && <div className="py-12 text-center text-sm text-ink-light">{d.total === 0 && !applied && !type && !action ? "Nothing has been recorded yet." : "No entries match your filters."}</div>}
        </div>
        {d && d.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mid">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="h-9 rounded-sm border border-eccellere-border px-3 disabled:opacity-50">Newer</button>
            <span>Page {d.page} of {d.pages}</span>
            <button type="button" disabled={page >= d.pages || loading} onClick={() => setPage(page + 1)} className="h-9 rounded-sm border border-eccellere-border px-3 disabled:opacity-50">Older</button>
          </div>
        )}
      </main>
    </div>
  );
}
