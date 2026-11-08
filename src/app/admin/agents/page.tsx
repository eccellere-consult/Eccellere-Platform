"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TitleBlock } from "@/components/standard/AdminFrame";
import { readJson } from "@/lib/toolkit/http";
import type { AgentRow } from "@/lib/agents/server";

const box = "w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none";
const label = "mt-4 block text-xs font-semibold uppercase tracking-wider text-gold-deep";

interface Version { version: number; editedBy: string | null; createdAt: string; snapshot: unknown }
const lines = (xs: string[] | null | undefined) => (xs ?? []).join("\n");

export default function AgentControlPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ does: "", suppliers: "", process: "", customers: "", refresh: "" });
  const [history, setHistory] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/agents");
    const d = await readJson(r);
    if (!r.ok) return setLoadErr(d.error ?? "Could not load the agents.");
    setAgents(d.agents);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = agents.find((a) => a.slug === slug) ?? null;

  async function open(a: AgentRow) {
    setSlug(a.slug); setMsg(null);
    setForm({ does: a.edit?.does ?? "", suppliers: lines(a.edit?.suppliers), process: lines(a.edit?.process), customers: lines(a.edit?.customers), refresh: a.edit?.refresh ?? "" });
    const r = await fetch(`/api/admin/agents/${a.slug}`);
    const d = await readJson(r);
    setHistory(r.ok ? d.history : []);
  }

  async function save() {
    if (!current) return;
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/agents/${current.slug}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await readJson(r);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Could not save." });
    setMsg({ ok: true, text: `Saved (version ${d.version}). It shows on the Agent Marketplace now.` });
    await load();
    const h = await readJson(await fetch(`/api/admin/agents/${current.slug}`));
    setHistory(h.history ?? []);
  }

  async function reset() {
    if (!current) return;
    if (!window.confirm("Put the default wording back for this agent? Your edit stays in the history.")) return;
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/agents/${current.slug}`, { method: "DELETE" });
    const d = await readJson(r);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error ?? "Could not reset." });
    setForm({ does: "", suppliers: "", process: "", customers: "", refresh: "" });
    setMsg({ ok: true, text: `Default wording restored (version ${d.version}).` });
    await load();
  }

  const areas = Array.from(new Set(agents.map((a) => a.area)));

  return (
    <div>
      <TitleBlock kicker="Agent Marketplace" title="Agent control" purpose="Edit what each agent says about itself: its description and, for pilots, its SIPOC. Formulas are never changed here." />
      {loadErr && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadErr}</p>}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <nav aria-label="Agents" className="space-y-4">
          {areas.map((area) => (
            <div key={area}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-deep">{area}</p>
              <ul className="mt-1 divide-y divide-eccellere-ink/5 border border-eccellere-ink/10 bg-white">
                {agents.filter((a) => a.area === area).map((a) => (
                  <li key={a.slug}>
                    <button onClick={() => void open(a)} className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-eccellere-cream ${slug === a.slug ? "bg-eccellere-cream font-medium" : ""}`}>
                      <span>{a.name}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-mid">{a.edit ? "Edited · " : ""}{a.status === "pilot" ? "Pilot" : "Soon"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <section className="rounded bg-white p-5 shadow-sm">
          {!current ? (
            <p className="text-sm text-ink-mid">Choose an agent on the left to edit its wording. A box left empty uses the default text.</p>
          ) : (
            <>
              <h2 className="font-display text-xl text-eccellere-ink">{current.name}</h2>
              <p className="mt-1 text-xs text-ink-mid">{current.area} · {current.status === "pilot" ? "Pilot" : "Coming soon"}{current.edit ? ` · edited, version ${current.edit.version}` : " · default wording"}</p>

              <label className={label} htmlFor="does">Description</label>
              <textarea id="does" className={box} rows={3} value={form.does} onChange={(e) => setForm({ ...form, does: e.target.value })} placeholder={current.defaults?.does} />
              <p className="mt-1 text-xs text-ink-mid">Up to 400 characters. Shown on the card and the agent page.</p>

              {current.sipocEditable ? (
                <>
                  {([["suppliers", "Suppliers (one per line)"], ["process", "Process steps (one per line)"], ["customers", "Customers (one per line)"]] as const).map(([k, t]) => (
                    <div key={k}>
                      <label className={label} htmlFor={k}>{t}</label>
                      <textarea id={k} className={box} rows={4} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={lines(current.defaults?.[k])} />
                    </div>
                  ))}
                  <label className={label} htmlFor="refresh">How to refresh the data</label>
                  <textarea id="refresh" className={box} rows={2} value={form.refresh} onChange={(e) => setForm({ ...form, refresh: e.target.value })} placeholder={current.defaults?.refresh} />
                  <p className="mt-1 text-xs text-ink-mid">Inputs and outputs are read from the tool itself, so they cannot be edited here and never go out of date.</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-ink-mid">This agent is not built yet, so only its description can be edited. Its SIPOC is written when the pilot is built.</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button className="bg-eccellere-ink px-4 py-2 text-xs text-white hover:opacity-90 disabled:opacity-40" disabled={busy} onClick={() => void save()}>
                  {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save"}
                </button>
                {current.edit && <button className="border border-eccellere-ink/30 px-4 py-2 text-xs hover:bg-eccellere-cream disabled:opacity-40" disabled={busy} onClick={() => void reset()}>Restore default wording</button>}
                {msg && <span className={`text-sm ${msg.ok ? "text-ink-mid" : "text-red-700"}`} role="status">{msg.text}</span>}
              </div>

              {history.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-eccellere-ink">History</h3>
                  <ul className="mt-2 divide-y divide-eccellere-ink/5 border border-eccellere-ink/10 text-sm text-ink-mid">
                    {history.map((h) => (
                      <li key={h.version} className="flex justify-between gap-3 px-3 py-2">
                        <span>Version {h.version}{h.snapshot ? "" : " · reset to default"}</span>
                        <span className="text-xs">{new Date(h.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
