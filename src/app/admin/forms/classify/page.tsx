"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { readJson } from "@/lib/toolkit/http";
import { cn } from "@/lib/utils";

interface TypeDef { id: string; label: string; tagline: string; example: string }
interface Cls { type: string; areas: string[]; sectors: string[]; basis: "rules" | "ai" | "person"; reason: string }
interface Row { slug: string; name: string; category: string; groupName: string | null; status: string; classification: Cls; approved: boolean; weak: boolean; depth: { score: number; gaps: string[] } | null; hand: boolean }

const chip = "border px-2 py-0.5 text-xs transition-colors";

/** Reclassify the catalogue by type, area and sector; check depth against the standard of the type; enrich with AI. A person approves. */
export default function ClassifyPage() {
  const [types, setTypes] = useState<TypeDef[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [deep, setDeep] = useState(85);
  const [aiReady, setAiReady] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [edits, setEdits] = useState<Record<string, Cls>>({});
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unapproved" | "weak" | "shallow">("unapproved");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/forms/classify");
    if (r.status === 401 || r.status === 403) return setLoadErr("You do not have permission to classify tools.");
    const d = await readJson(r);
    if (!r.ok) return setLoadErr(d.error ?? "Could not load the catalogue.");
    setLoadErr(null); setTypes(d.types); setAreas(d.areas); setSectors(d.sectors); setDeep(d.deepEnough); setAiReady(d.aiReady); setRows(d.rows); setEdits({});
  }, []);
  useEffect(() => { load().catch(() => setLoadErr("Could not load the catalogue.")); }, [load]);

  const current = (r: Row): Cls => edits[r.slug] ?? r.classification;
  const shown = useMemo(() => rows.filter((r) =>
    filter === "all" ? true : filter === "unapproved" ? !r.approved : filter === "weak" ? r.weak && !r.approved : !!r.depth && r.depth.score < deep), [rows, filter, deep]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[current(r).type] = (c[current(r).type] ?? 0) + 1;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, edits]);
  const dirty = Object.keys(edits).length;

  const set = (r: Row, patch: Partial<Cls>) => setEdits((e) => ({ ...e, [r.slug]: { ...current(r), ...patch, basis: "person" } }));
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function approve(slugs: string[]) {
    const changes = slugs.map((s) => { const r = rows.find((x) => x.slug === s)!; const c = current(r); return { slug: s, type: c.type, areas: c.areas, sectors: c.sectors }; });
    if (!changes.length) return;
    setBusy("approve"); setMsg(null);
    const r = await fetch("/api/admin/forms/classify", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changes }) });
    const d = await readJson(r);
    setBusy(null);
    if (!r.ok) return setMsg(d.error ?? "Could not save.");
    setMsg(`Approved ${d.saved} tool${d.saved === 1 ? "" : "s"}.${d.skipped?.length ? ` ${d.skipped.length} could not be saved (each needs at least one area).` : ""}`);
    await load();
  }

  async function refine() {
    const slugs = rows.filter((r) => r.weak && !r.approved).slice(0, 25).map((r) => r.slug);
    if (!slugs.length) return setMsg("No uncertain guesses to refine.");
    setBusy("ai"); setMsg(null);
    const r = await fetch("/api/admin/forms/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slugs }) });
    const d = await readJson(r);
    setBusy(null);
    if (!r.ok) return setMsg(d.error ?? "The AI could not refine these.");
    const next: Record<string, Cls> = {};
    for (const s of d.suggestions as { slug: string; classification: Cls }[]) next[s.slug] = s.classification;
    setEdits((e) => ({ ...e, ...next }));
    setMsg(`The AI suggested a change for ${Object.keys(next).length} of ${slugs.length} tools. Check them, then approve. Nothing is saved yet.`);
  }

  async function enrich(r: Row) {
    setBusy(r.slug); setMsg(null);
    const res = await fetch("/api/admin/forms/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: r.slug }) });
    const d = await readJson(res);
    setBusy(null);
    if (!res.ok) return setMsg(`${r.name}: ${d.error ?? "could not be enriched."}`);
    setMsg(`${r.name}: depth ${d.before} to ${d.after}. ${d.applied ? "It is back in review; open it and check the changes." : (d.notes ?? []).join(" ")}`);
    await load();
  }

  if (loadErr) return <div className="mx-auto max-w-3xl p-6 text-sm text-red-700">{loadErr}</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href="/admin/forms" className="inline-flex items-center gap-1 text-xs text-ink-light hover:text-eccellere-ink"><ChevronLeft className="h-3.5 w-3.5" /> Form Builder</Link>
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold-deep">Admin</p>
      <h1 className="font-display text-3xl text-eccellere-ink">Classify and deepen the catalogue</h1>
      <p className="mt-1 max-w-3xl text-sm text-ink-mid">Every tool gets one <strong>type</strong>, one or more <strong>business areas</strong> and, where it is industry-specific, a <strong>sector</strong>. The rules suggest; you approve. Clients can then filter the marketplace by all three. Each type has a depth standard, and the AI can raise a shallow tool to it for you to review.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {types.map((t) => (
          <div key={t.id} className="border border-eccellere-ink/10 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gold-deep">{counts[t.id] ?? 0} tools</p>
            <p className="mt-1 font-display text-xl text-eccellere-ink">{t.label}</p>
            <p className="mt-1 text-xs text-ink-mid">{t.tagline}. For example: {t.example}.</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {([["unapproved", "Not yet approved"], ["weak", "Rules unsure"], ["shallow", "Below standard depth"], ["all", "All"]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={cn(chip, filter === id ? "border-eccellere-ink bg-eccellere-ink text-white" : "border-eccellere-ink/20 bg-white text-ink-mid")}>{label}</button>
        ))}
        <span className="mx-2 h-4 border-l border-eccellere-ink/20" />
        <button type="button" disabled={!!busy || !aiReady} onClick={refine} className="inline-flex items-center gap-1 border border-eccellere-ink/30 bg-white px-3 py-1.5 text-xs disabled:opacity-50"><Sparkles className="h-3.5 w-3.5" /> {busy === "ai" ? "Asking the AI..." : "Refine unsure ones with AI"}</button>
        <button type="button" disabled={!!busy || !dirty} onClick={() => approve(Object.keys(edits))} className="border border-eccellere-ink bg-eccellere-ink px-3 py-1.5 text-xs text-white disabled:opacity-50">Approve {dirty || ""} changed</button>
        <button type="button" disabled={!!busy || !shown.length} onClick={() => approve(shown.filter((r) => !r.weak || edits[r.slug]).map((r) => r.slug))} className="border border-eccellere-ink/30 bg-white px-3 py-1.5 text-xs disabled:opacity-50">Approve all shown (except unsure)</button>
      </div>
      {msg && <p role="status" className="mt-3 border border-eccellere-gold/40 bg-eccellere-gold/5 p-3 text-sm text-eccellere-ink">{msg}</p>}

      <ul className="mt-5 space-y-3">
        {shown.length === 0 && <li className="text-sm text-ink-mid">Nothing to show in this view.</li>}
        {shown.map((r) => {
          const c = current(r);
          const short = r.depth && r.depth.score < deep;
          return (
            <li key={r.slug} className="border border-eccellere-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/admin/tools?open=${r.slug}`} className="font-medium text-eccellere-ink underline-offset-2 hover:underline">{r.name}</Link>
                  <p className="text-xs text-ink-light">{r.category}{r.groupName ? ` · ${r.groupName}` : ""} · {r.status.toLowerCase().replace("_", " ")}</p>
                </div>
                <p className={cn("text-xs", r.approved && !edits[r.slug] ? "text-emerald-800" : "text-ink-mid")}>
                  {edits[r.slug] ? "Changed, not saved" : r.approved ? "Approved" : c.basis === "ai" ? "AI suggestion" : r.weak ? "Rules unsure" : "Rules suggestion"}
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs text-ink-mid" htmlFor={`t-${r.slug}`}>Type</label>
                  <select id={`t-${r.slug}`} className="mt-1 w-full border border-eccellere-ink/20 bg-white px-2 py-1.5 text-sm" value={c.type} onChange={(e) => set(r, { type: e.target.value })}>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  {c.reason && <p className="mt-1 text-xs text-ink-light">{c.reason}</p>}
                </div>
                <fieldset>
                  <legend className="text-xs text-ink-mid">Area (at least one)</legend>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {areas.map((a) => <button key={a} type="button" aria-pressed={c.areas.includes(a)} onClick={() => set(r, { areas: toggle(c.areas, a) })} className={cn(chip, c.areas.includes(a) ? "border-eccellere-gold bg-eccellere-gold/10 text-eccellere-ink" : "border-eccellere-ink/20 text-ink-mid")}>{a}</button>)}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-xs text-ink-mid">Sector (none = every sector)</legend>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sectors.map((s) => <button key={s} type="button" aria-pressed={c.sectors.includes(s)} onClick={() => set(r, { sectors: toggle(c.sectors, s) })} className={cn(chip, c.sectors.includes(s) ? "border-eccellere-gold bg-eccellere-gold/10 text-eccellere-ink" : "border-eccellere-ink/20 text-ink-mid")}>{s}</button>)}
                  </div>
                </fieldset>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-eccellere-ink/10 pt-3 text-xs">
                {r.depth ? (
                  <details className="max-w-xl">
                    <summary className={cn("cursor-pointer", short ? "text-amber-800" : "text-emerald-800")}>Depth for this type: {r.depth.score}/100{short ? ` (standard is ${deep}) · ${r.depth.gaps.length} gap${r.depth.gaps.length === 1 ? "" : "s"}` : " · meets the standard"}</summary>
                    <ul className="mt-2 list-disc pl-5 text-ink-mid">{r.depth.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
                  </details>
                ) : <span className="text-ink-light">Hand-built tool: depth is not measured and it is not changed with AI.</span>}
                <div className="flex gap-2">
                  {short && r.status !== "PUBLISHED" && <button type="button" disabled={!!busy || !aiReady} onClick={() => enrich(r)} className="inline-flex items-center gap-1 border border-eccellere-ink/30 bg-white px-3 py-1.5 disabled:opacity-50">{busy === r.slug ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enriching...</> : <><Sparkles className="h-3.5 w-3.5" /> Enrich to standard</>}</button>}
                  {short && r.status === "PUBLISHED" && <span className="text-ink-light">Live: withdraw it from clients before enriching.</span>}
                  <button type="button" disabled={!!busy || c.areas.length === 0} onClick={() => approve([r.slug])} className="border border-eccellere-ink bg-eccellere-ink px-3 py-1.5 text-white disabled:opacity-50">Approve</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
