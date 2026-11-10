"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { inr } from "@/lib/admin/stats";

interface Row { id: string; title: string; status: string; dueDate: string | null; agreedFee: number | null; clientName: string }
interface Data { active: Row[]; completed: Row[]; activeValue: number }

const LABEL: Record<string, string> = { MATCHED: "Matched", ACCEPTED: "Accepted", IN_PROGRESS: "In progress", DELIVERED: "Delivered", UNDER_REVIEW: "Under review" };
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "no date set");

export default function SpecialistAssignmentsPage() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/specialist/assignments").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); }).catch((e) => setErr(e.message || "Could not load."));
  }, []);
  if (err) return <p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>;
  if (!d) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your assignments…</p>;

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Assignments</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">My Assignments</h1>
      <p className="mt-1 text-sm text-ink-mid">{d.active.length} active, worth {inr(d.activeValue)} in agreed fees.</p>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-eccellere-ink">Active ({d.active.length})</h2>
        <div className="mt-3 space-y-3">
          {d.active.length === 0 && <p className="rounded-lg bg-white p-5 text-sm text-ink-mid shadow-sm">No active assignments. When the Eccellere team matches you with a client, it appears here.</p>}
          {d.active.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium text-eccellere-ink">{a.title}</p><p className="mt-0.5 text-xs text-ink-light">{a.clientName}</p></div>
              <div className="flex items-center gap-6">
                <span className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold-deep">{LABEL[a.status] ?? a.status}</span>
                <div className="flex items-center gap-1 text-xs text-ink-light"><Clock className="h-3 w-3" />Due {day(a.dueDate)}</div>
                <span className="font-mono text-sm text-eccellere-gold-deep">{a.agreedFee !== null ? inr(a.agreedFee) : "Fee not set"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-eccellere-ink">Completed ({d.completed.length})</h2>
        <div className="mt-3 space-y-3">
          {d.completed.length === 0 && <p className="rounded-lg bg-white p-5 text-sm text-ink-mid shadow-sm">Nothing completed yet.</p>}
          {d.completed.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium text-eccellere-ink">{a.title}</p><p className="mt-0.5 text-xs text-ink-light">{a.clientName}</p></div>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1 rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold-deep"><CheckCircle className="h-3 w-3" />Completed</span>
                <span className="font-mono text-sm text-eccellere-gold-deep">{a.agreedFee !== null ? inr(a.agreedFee) : "Fee not set"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
