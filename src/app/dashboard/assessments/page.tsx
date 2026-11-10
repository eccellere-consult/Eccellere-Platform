"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Loader2 } from "lucide-react";

interface A { id: string; createdAt: string; sector: string; score: number; max: number; pct: number; level: number; dimensions: { name: string; pct: number }[]; recommendations: string[] }
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default function AssessmentsPage() {
  const [rows, setRows] = useState<A[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/dashboard/assessments").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRows(j.assessments); }).catch((e) => setErr(e.message || "Could not load."));
  }, []);
  if (err) return <p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>;
  if (!rows) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your assessments…</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Assessments</p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">AI Readiness Assessments</h1>
        <p className="mt-1 text-sm text-ink-mid">Your saved results, newest first.</p>
      </div>
      {rows.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <BrainCircuit className="mx-auto h-8 w-8 text-eccellere-gold-deep" />
          <p className="mt-3 text-sm text-ink-mid">You have no saved assessments yet.</p>
          <Link href="/assessment" className="mt-4 inline-flex h-9 items-center rounded-sm bg-eccellere-gold-deep px-4 text-sm text-white">Take the assessment</Link>
        </div>
      )}
      {rows.map((a, i) => (
        <div key={a.id} className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div><p className="text-sm font-medium text-eccellere-ink">{day(a.createdAt)} · {a.sector}</p>{i === 0 && <p className="text-xs text-ink-light">Latest</p>}</div>
            <p className="font-mono text-2xl text-eccellere-ink">{a.score}<span className="text-sm text-ink-light"> / {a.max}</span> <span className="text-sm text-eccellere-gold-deep">({a.pct}%)</span></p>
          </div>
          <p className="mt-1 text-xs text-ink-light">Maturity level {a.level}</p>
          {a.dimensions.length > 0 && (
            <div className="mt-4 space-y-2">
              {a.dimensions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs text-ink-mid"><span className="capitalize">{d.name}</span><span className="font-mono">{d.pct}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-eccellere-cream"><div className="h-full rounded-full bg-eccellere-gold" style={{ width: `${Math.min(100, Math.max(0, d.pct))}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          {a.recommendations.length > 0 && (
            <div className="mt-4"><p className="text-xs font-medium uppercase tracking-wider text-ink-light">Recommendations</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-mid">{a.recommendations.map((r, k) => <li key={k}>{r}</li>)}</ul></div>
          )}
        </div>
      ))}
    </div>
  );
}
