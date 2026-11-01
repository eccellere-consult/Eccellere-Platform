"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIT_LABEL, type KitType } from "@/lib/toolkit/engine";

interface KitRow {
  id: string;
  title: string;
  industry: string;
  kitType: KitType;
  status: "DRAFT" | "IN_PROGRESS" | "SUBMITTED";
  version: number;
  updatedAt: string;
  _count: { responses: number; evidence: number };
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-eccellere-ink/10 text-eccellere-ink",
  IN_PROGRESS: "bg-eccellere-gold/15 text-eccellere-gold",
  SUBMITTED: "bg-emerald-100 text-emerald-800",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
};

export default function MyToolkitsPage() {
  const [kits, setKits] = useState<KitRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/toolkits");
      if (r.status === 401) {
        setError("Please sign in to see your toolkits.");
        return;
      }
      const d = await r.json();
      setKits(d.kits ?? []);
    } catch {
      setError("Could not load your toolkits. Please refresh.");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}" and all its answers and uploads? This cannot be undone.`)) return;
    const r = await fetch(`/api/toolkits/${id}`, { method: "DELETE" });
    if (r.ok) setKits((k) => (k ?? []).filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Configure your own</p>
          <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">My Toolkits</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mid">
            Can&apos;t find the right kit in the marketplace? Describe your situation and we&apos;ll build a staged form you
            complete yourself or with AI help, then print as a report. Your answers and uploads stay private to you.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/toolkits/new">
            <Plus className="h-4 w-4" /> New toolkit
          </Link>
        </Button>
      </div>

      {error && <p className="mt-8 rounded bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!error && kits === null && <p className="mt-10 text-sm text-ink-light">Loading…</p>}

      {kits && kits.length === 0 && (
        <div className="mt-10 rounded border border-dashed border-eccellere-ink/20 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-eccellere-gold" />
          <p className="mt-3 font-medium text-eccellere-ink">No toolkits yet</p>
          <p className="mt-1 text-sm text-ink-mid">Start with your industry and the problem you want to address.</p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/toolkits/new">Create your first toolkit</Link>
          </Button>
        </div>
      )}

      {kits && kits.length > 0 && (
        <ul className="mt-8 space-y-3">
          {kits.map((k) => (
            <li key={k.id} className="flex items-center gap-4 rounded bg-white p-5 shadow-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/toolkits/${k.id}`} className="block truncate font-medium text-eccellere-ink hover:text-eccellere-gold">
                  {k.title}
                </Link>
                <p className="mt-1 text-xs text-ink-mid">
                  {KIT_LABEL[k.kitType]} · {k.industry} · v{k.version} · {k._count.responses} answers · {k._count.evidence} files ·
                  updated {new Date(k.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className={`rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLE[k.status]}`}>
                {STATUS_LABEL[k.status]}
              </span>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/dashboard/toolkits/${k.id}`}>{k.status === "SUBMITTED" ? "View" : "Continue"}</Link>
              </Button>
              <button
                onClick={() => remove(k.id, k.title)}
                className="text-ink-light hover:text-red-600"
                aria-label={`Delete ${k.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
