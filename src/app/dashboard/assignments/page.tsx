"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { inr } from "@/lib/admin/stats";

interface Row { id: string; title: string; status: string; group: "in_progress" | "completed" | "scheduled" | "other"; startDate: string | null; dueDate: string | null; agreedFee: number | null; specialistName: string | null; milestones: { id: string; title: string; isCompleted: boolean }[]; progress: number | null }
const FILTERS: { label: string; group: Row["group"] | "all" }[] = [{ label: "All", group: "all" }, { label: "In progress", group: "in_progress" }, { label: "Completed", group: "completed" }, { label: "Awaiting match", group: "scheduled" }];
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "not set");
const LABEL: Record<string, string> = { REQUESTED: "Requested", MATCHED: "Specialist matched", ACCEPTED: "Accepted", IN_PROGRESS: "In progress", DELIVERED: "Delivered", UNDER_REVIEW: "Under review", COMPLETED: "Completed", CANCELLED: "Cancelled", DISPUTED: "Disputed" };

export default function ClientAssignmentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<Row["group"] | "all">("all");
  useEffect(() => {
    fetch("/api/dashboard/assignments").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setRows(j.assignments); }).catch((e) => setErr(e.message || "Could not load."));
  }, []);
  if (err) return <p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>;
  if (!rows) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your assignments…</p>;
  const shown = rows.filter((r) => filter === "all" || r.group === filter);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Assignments</p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">My Assignments</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" onClick={() => setFilter(f.group)} className={cn("rounded-sm border px-3 py-1.5 text-sm", filter === f.group ? "border-eccellere-ink bg-eccellere-ink text-white" : "border-eccellere-border text-ink-mid hover:bg-eccellere-cream")}>{f.label}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="rounded-lg bg-white p-6 text-sm text-ink-mid shadow-sm">{rows.length === 0 ? "You have no assignments yet. When you request expert help, it appears here." : "Nothing in this view."}</p>}
      {shown.map((a) => (
        <div key={a.id} className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-medium text-eccellere-ink">{a.title}</p><p className="mt-0.5 text-xs text-ink-light">{a.specialistName ?? "Specialist not assigned yet"}</p></div>
            <span className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold-deep">{LABEL[a.status] ?? a.status}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-light">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Start {day(a.startDate)}</span>
            <span>Due {day(a.dueDate)}</span>
            <span className="font-mono text-eccellere-gold-deep">{a.agreedFee !== null ? inr(a.agreedFee) : "Fee not set"}</span>
          </div>
          {a.progress !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-ink-mid"><span>Milestones done</span><span className="font-mono">{a.progress}%</span></div>
              <div className="mt-1 h-2 rounded-full bg-eccellere-cream"><div className="h-full rounded-full bg-eccellere-gold" style={{ width: `${a.progress}%` }} /></div>
              <ul className="mt-3 space-y-1 text-sm text-ink-mid">{a.milestones.map((m) => <li key={m.id} className="flex items-center gap-2"><CheckCircle className={cn("h-4 w-4", m.isCompleted ? "text-eccellere-gold-deep" : "text-eccellere-border")} />{m.title}</li>)}</ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
