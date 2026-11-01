"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowUp, ArrowDown, CheckCircle2, XCircle, Loader2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

type PId = "anthropic" | "openai" | "groq" | "xai";
interface PInfo { id: PId; label: string; note: string; envKey: string; defaultModel: string; keyConfigured: boolean }
interface Settings { primary: PId; fallbacks: PId[]; providers: Record<PId, { enabled: boolean; model: string }> }

export default function AiSettingsPage() {
  const [info, setInfo] = useState<PInfo[]>([]);
  const [s, setS] = useState<Settings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<PId | null>(null);
  const [tests, setTests] = useState<Partial<Record<PId, { ok: boolean; text: string }>>>({});

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/ai-settings");
      if (r.status === 401 || r.status === 403) return setErr("You do not have permission to manage AI settings.");
      if (!r.ok) return setErr("Could not load AI settings.");
      const d = await r.json();
      setInfo(d.providers);
      setS(d.settings);
    })().catch(() => setErr("Could not load AI settings."));
  }, []);

  if (err) return <div className="p-8 text-sm text-red-700">{err}</div>;
  if (!s) return <div className="p-8 text-sm text-ink-light">Loading…</div>;

  const by = Object.fromEntries(info.map((p) => [p.id, p])) as Record<PId, PInfo>;
  const order: PId[] = [s.primary, ...s.fallbacks.filter((f) => f !== s.primary)];
  const usable = order.filter((id) => s.providers[id].enabled && by[id].keyConfigured);

  const update = (fn: (c: Settings) => Settings) => { setMsg(null); setS((c) => (c ? fn(c) : c)); };
  const setPrimary = (id: PId) =>
    update((c) => ({ ...c, primary: id, fallbacks: [c.primary, ...c.fallbacks].filter((f, i, a) => f !== id && a.indexOf(f) === i) }));
  const move = (id: PId, dir: -1 | 1) =>
    update((c) => {
      const f = [...c.fallbacks]; const i = f.indexOf(id); const j = i + dir;
      if (i < 0 || j < 0 || j >= f.length) return c;
      [f[i], f[j]] = [f[j], f[i]];
      return { ...c, fallbacks: f };
    });

  async function save() {
    setSaving(true); setMsg(null);
    const r = await fetch("/api/admin/ai-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: s }) });
    const d = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) return setMsg({ kind: "warn", text: d.error ?? "Could not save." });
    setS(d.settings);
    setMsg(d.warning ? { kind: "warn", text: `Saved. ${d.warning}` } : { kind: "ok", text: "Saved. Changes apply within about 30 seconds." });
  }

  async function test(id: PId) {
    setTesting(id);
    const r = await fetch("/api/admin/ai-settings/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: id }) });
    const d = await r.json().catch(() => ({}));
    setTests((t) => ({ ...t, [id]: d.ok ? { ok: true, text: `Working (${d.model})` } : { ok: false, text: d.reason ?? d.error ?? "Failed" } }));
    setTesting(null);
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-ink-mid hover:text-eccellere-gold"><ChevronLeft className="h-3 w-3" /> Admin</Link>
      <h1 className="mt-3 font-display text-3xl font-light text-eccellere-ink">AI providers</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-mid">
        Choose which AI provider powers platform features, switch providers on or off, and set the fallback order. If the first provider fails,
        the next enabled one is tried. API keys are set as server environment variables and are never shown or stored here.
      </p>

      <div className={cn("mt-5 rounded p-3 text-sm", usable.length ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>
        {usable.length
          ? <>Active order: {usable.map((id) => by[id].label).join(" → ")}</>
          : <>No provider is both enabled and has an API key. AI features are currently unavailable.</>}
      </div>

      <ul className="mt-6 space-y-4">
        {order.map((id, idx) => {
          const p = by[id]; const st = s.providers[id]; const isPrimary = id === s.primary; const t = tests[id];
          return (
            <li key={id} className={cn("rounded bg-white p-5 shadow-sm", isPrimary && "ring-1 ring-eccellere-gold")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-eccellere-ink">
                    {p.label}
                    {isPrimary && <span className="rounded-sm bg-eccellere-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">Primary</span>}
                    {!isPrimary && <span className="text-[11px] font-normal text-ink-light">Fallback {idx}</span>}
                  </p>
                  <p className="text-xs text-ink-mid">{p.note}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px]", p.keyConfigured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                  <KeyRound className="h-3 w-3" /> {p.keyConfigured ? "Key configured" : `Set ${p.envKey}`}
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" className="h-4 w-4 accent-[#B8913A]" checked={st.enabled} onChange={(e) => update((c) => ({ ...c, providers: { ...c.providers, [id]: { ...st, enabled: e.target.checked } } }))} />
                  Enabled
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1 block text-xs text-ink-mid" htmlFor={`m-${id}`}>Model <span className="text-ink-light">(leave blank for default: {p.defaultModel})</span></label>
                  <input id={`m-${id}`} className="w-full border border-eccellere-ink/20 bg-white px-3 py-2 text-sm focus:border-eccellere-gold focus:outline-none" value={st.model} placeholder={p.defaultModel}
                    onChange={(e) => update((c) => ({ ...c, providers: { ...c.providers, [id]: { ...st, model: e.target.value } } }))} />
                </div>
                <div className="flex items-end gap-2">
                  {!isPrimary && (
                    <>
                      <button className="border border-eccellere-ink/20 p-2 hover:bg-eccellere-cream disabled:opacity-40" disabled={idx <= 1} onClick={() => move(id, -1)} aria-label={`Move ${p.label} up`}><ArrowUp className="h-4 w-4" /></button>
                      <button className="border border-eccellere-ink/20 p-2 hover:bg-eccellere-cream disabled:opacity-40" disabled={idx >= order.length - 1} onClick={() => move(id, 1)} aria-label={`Move ${p.label} down`}><ArrowDown className="h-4 w-4" /></button>
                      <button className="border border-eccellere-gold px-3 py-2 text-xs text-eccellere-gold hover:bg-eccellere-gold/10" onClick={() => setPrimary(id)}>Make primary</button>
                    </>
                  )}
                  <button className="bg-eccellere-ink px-3 py-2 text-xs text-white hover:opacity-90 disabled:opacity-50" disabled={testing === id || !p.keyConfigured} onClick={() => test(id)}>
                    {testing === id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </button>
                </div>
              </div>
              {t && (
                <p className={cn("mt-3 flex items-center gap-1 text-xs", t.ok ? "text-emerald-700" : "text-red-700")}>
                  {t.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} {t.text}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center gap-4">
        <button className="bg-eccellere-gold px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && <p className={cn("text-sm", msg.kind === "ok" ? "text-emerald-700" : "text-amber-700")} role="status">{msg.text}</p>}
      </div>
      <p className="mt-8 text-xs text-ink-light">
        The Test button sends one fixed, harmless prompt (no customer data). To add or change a key, update the environment variable on the server
        (Hostinger) and restart the app.
      </p>
    </div>
  );
}
