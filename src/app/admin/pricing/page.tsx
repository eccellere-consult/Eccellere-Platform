"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RECENCIES, RECENCY_LABEL, SCOPES, SCOPE_LABEL, type PriceRules, type Recency, type Scope } from "@/lib/marketplace/pricing";

type Row = { id: string; title: string; price: number; serviceDomain: string; scope: Scope | null; recency: Recency | null; next: number | null; reason?: string };
const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const field = "w-28 rounded border border-[#E5E2DB] bg-white px-2 py-1 text-sm text-[#0E0E0D]";
const btn = "rounded bg-[#7F611A] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50";
const btn2 = "rounded border border-[#7F611A] px-3 py-1.5 text-sm font-medium text-[#7F611A] disabled:opacity-50";

export default function AdminPricing() {
  const [rules, setRules] = useState<PriceRules | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pricing");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ ok: false, text: body.error ?? "Could not load pricing." });
    setRules(body.rules); setRows(body.assets);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const put = async (payload: Record<string, unknown>, done: (b: Record<string, unknown>) => string) => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: body.error ?? "That did not work." });
      else { setMsg({ ok: true, text: done(body) }); await load(); }
    } catch { setMsg({ ok: false, text: "No connection. Please try again." }); }
    setBusy(false);
  };

  const shown = useMemo(() => rows.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const changes = rows.filter((r) => r.next !== null && r.next !== r.price);
  const untagged = rows.filter((r) => r.next === null).length;
  const allShownPicked = shown.length > 0 && shown.every((r) => picked.has(r.id));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...picked];

  if (!rules) return <div className="p-6 text-sm">{msg ? msg.text : "Loading…"}</div>;
  const setRule = (g: "scope" | "recency", k: string, v: string) => setRules({ ...rules, [g]: { ...rules[g], [k]: Number(v) } } as PriceRules);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-[#0E0E0D]">
      <header>
        <p className="text-xs uppercase tracking-wide text-[#7F611A]">Commerce</p>
        <h1 className="font-display text-3xl">Pricing</h1>
        <p className="text-sm">Tag each asset by scope and by recency. Its price is the scope price plus the recency price. Assets not tagged on both stay at their current price.</p>
      </header>

      {msg && <p role="status" className={`rounded border px-3 py-2 text-sm ${msg.ok ? "border-[#B8913A] bg-[#FAF8F4]" : "border-[#B3392B] text-[#B3392B]"}`}>{msg.text}</p>}

      <section className="rounded border border-[#E5E2DB] bg-[#FAF8F4] p-4">
        <h2 className="mb-3 font-medium">1. The four prices (₹)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><h3 className="mb-2 text-sm font-medium">Scope</h3>
            {SCOPES.map((s) => <label key={s} className="mb-2 flex items-center justify-between gap-3 text-sm">{SCOPE_LABEL[s]}<input aria-label={SCOPE_LABEL[s]} className={field} type="number" min={0} value={rules.scope[s]} onChange={(e) => setRule("scope", s, e.target.value)} /></label>)}</div>
          <div><h3 className="mb-2 text-sm font-medium">Recency</h3>
            {RECENCIES.map((r) => <label key={r} className="mb-2 flex items-center justify-between gap-3 text-sm">{RECENCY_LABEL[r]}<input aria-label={RECENCY_LABEL[r]} className={field} type="number" min={0} value={rules.recency[r]} onChange={(e) => setRule("recency", r, e.target.value)} /></label>)}</div>
        </div>
        <p className="mt-2 text-xs">Price examples: {SCOPES.flatMap((s) => RECENCIES.map((r) => `${SCOPE_LABEL[s]} + ${RECENCY_LABEL[r]} = ${rupee(rules.scope[s] + rules.recency[r])}`)).join("; ")}.</p>
        <button className={`${btn} mt-3`} disabled={busy} onClick={() => put({ rules }, () => "Prices saved. No asset price has changed yet; use step 3.")}>Save the four prices</button>
      </section>

      <section className="rounded border border-[#E5E2DB] p-4">
        <h2 className="mb-3 font-medium">2. Tag assets, many at once</h2>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <input className="w-56 rounded border border-[#E5E2DB] px-2 py-1" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search assets" />
          <button className={btn2} onClick={() => setPicked(allShownPicked ? new Set() : new Set(shown.map((r) => r.id)))}>{allShownPicked ? "Clear selection" : `Select all ${shown.length} shown`}</button>
          <span>{picked.size} selected</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {SCOPES.map((s) => <button key={s} className={btn2} disabled={busy || !picked.size} onClick={() => put({ ids, scope: s }, (b) => `${b.tagged} asset(s) set to “${SCOPE_LABEL[s]}”.`)}>Scope: {SCOPE_LABEL[s]}</button>)}
          {RECENCIES.map((r) => <button key={r} className={btn2} disabled={busy || !picked.size} onClick={() => put({ ids, recency: r }, (b) => `${b.tagged} asset(s) set to “${RECENCY_LABEL[r]}”.`)}>Recency: {RECENCY_LABEL[r]}</button>)}
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white"><tr className="border-b border-[#E5E2DB]"><th className="p-2" /><th className="p-2">Asset</th><th className="p-2">Scope</th><th className="p-2">Recency</th><th className="p-2">Now</th><th className="p-2">New</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-[#E5E2DB]">
                  <td className="p-2"><input type="checkbox" aria-label={`Select ${r.title}`} checked={picked.has(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.scope ? SCOPE_LABEL[r.scope] : "—"}</td>
                  <td className="p-2">{r.recency ? RECENCY_LABEL[r.recency] : "—"}</td>
                  <td className="p-2">{rupee(r.price)}</td>
                  <td className="p-2">{r.next === null ? "stays" : r.next === r.price ? "same" : rupee(r.next)}</td>
                </tr>
              ))}
              {!shown.length && <tr><td className="p-3" colSpan={6}>No assets found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-[#E5E2DB] bg-[#FAF8F4] p-4">
        <h2 className="mb-2 font-medium">3. Apply to all tagged assets</h2>
        <p className="text-sm">{changes.length} price{changes.length === 1 ? "" : "s"} would change; {untagged} asset{untagged === 1 ? " is" : "s are"} not tagged on both and will stay as they are. The “New” column above shows each result. Saved prices are not applied until you press the button; the change is recorded in the audit log.</p>
        <button
          className={`${btn} mt-3`}
          disabled={busy || !changes.length}
          onClick={() => { if (window.confirm(`Change the price of ${changes.length} live asset(s) now? Customers will see the new prices straight away. Save the four prices first if you edited them.`)) void put({ apply: true }, (b) => `Done: ${b.changed} price(s) updated.`); }}
        >Apply new prices to {changes.length} asset{changes.length === 1 ? "" : "s"}</button>
      </section>
    </div>
  );
}
