"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, Filter, CheckCircle, Clock, XCircle, Star, Loader2, RefreshCw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// One sample row shown only when no real specialists have registered yet
const SAMPLE_SPECIALIST = {
  id: "SAMPLE",
  name: "Vikram Patel (sample)",
  email: "sample@example.com",
  expertise: "Agentic AI, Digital Transformation",
  sectors: ["Manufacturing", "Retail"],
  status: "active",
  rawStatus: "ACTIVE",
  assets: 12,
  rating: 4.9,
  earnings: "₹3,42,500",
  joined: "Sep 2025",
  isSample: true,
};

type Specialist = {
  id: string;
  name: string;
  email: string;
  expertise: string;
  sectors: string[];
  status: string;
  rawStatus: string;
  assets: number;
  rating: number | null;
  earnings: string;
  joined: string;
  isSample?: boolean;
};

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  active:   { color: "bg-eccellere-teal/10 text-eccellere-teal",  icon: CheckCircle },
  pending:  { color: "bg-eccellere-gold/10 text-eccellere-gold",  icon: Clock },
  "needs info": { color: "bg-eccellere-gold/10 text-eccellere-gold-deep", icon: HelpCircle },
  inactive: { color: "bg-ink-light/10 text-ink-light",            icon: XCircle },
};

export default function AdminSpecialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchSpecialists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/specialists");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSpecialists(data.specialists ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load specialists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSpecialists(); }, [fetchSpecialists]);

  const isSampleOnly = specialists.length === 0 && !loading && !error;
  const displaySpecialists: Specialist[] = isSampleOnly ? [SAMPLE_SPECIALIST] : specialists;

  const filtered = displaySpecialists.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.expertise.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = specialists.filter((s) => s.status === "pending").length;

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Specialists</h1>
          {!loading && (
            <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold">
              {specialists.length}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="rounded-full bg-eccellere-error/10 px-2 py-0.5 text-xs text-eccellere-error">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={fetchSpecialists}
            className="ml-auto rounded p-1.5 text-ink-light hover:bg-eccellere-cream hover:text-eccellere-ink"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-eccellere-error/30 bg-eccellere-error/5 px-4 py-3 text-sm text-eccellere-error">
            Failed to load specialists: {error}.{" "}
            <button onClick={fetchSpecialists} className="underline hover:no-underline">Retry</button>
          </div>
        )}

        {isSampleOnly && (
          <div className="mb-4 rounded-md border border-eccellere-gold/30 bg-eccellere-gold/5 px-4 py-3 text-sm text-ink-mid">
            No registered specialists yet. Showing one sample card for reference.
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-ink-light">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">Loading specialists…</span>
          </div>
        )}

        {!loading && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                <input
                  type="text"
                  placeholder="Search specialists..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-light" />
                {["all", "pending", "needs info", "active", "inactive"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      filterStatus === s ? "bg-eccellere-gold text-white" : "bg-white text-ink-mid hover:bg-eccellere-cream"
                    )}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((spec) => {
                const cfg = statusConfig[spec.status] ?? statusConfig.pending;
                const StatusIcon = cfg.icon;
                const initials = spec.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={spec.id}
                    className={cn(
                      "rounded-lg bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                      spec.isSample && "opacity-50 italic"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eccellere-gold/10 font-mono text-sm text-eccellere-gold">
                          {initials}
                        </div>
                        <h3 className="mt-3 text-base font-medium text-eccellere-ink">{spec.name}</h3>
                        <p className="text-xs text-ink-light">{spec.email}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", cfg.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {spec.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-ink-mid">{spec.expertise}</p>

                    {spec.sectors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {spec.sectors.map((s) => (
                          <span key={s} className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-light">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-4 border-t border-eccellere-ink/5 pt-4 text-xs">
                      <span className="text-ink-light">{spec.assets} assets</span>
                      {spec.rating !== null && (
                        <span className="flex items-center gap-1 text-eccellere-gold">
                          <Star className="h-3 w-3 fill-current" />
                          {typeof spec.rating === "number" ? spec.rating.toFixed(1) : spec.rating}
                        </span>
                      )}
                      <span className="ml-auto font-mono text-eccellere-gold">{spec.earnings}</span>
                    </div>

                    {/* Approve / Reject now happen on the review screen, after the admin has seen the full profile. */}
                    <Link
                      href={`/admin/specialists/${encodeURIComponent(spec.id)}`}
                      className={cn(
                        "mt-3 block rounded-md px-3 py-2 text-center text-xs font-medium not-italic transition-colors",
                        spec.status === "pending" || spec.status === "needs info"
                          ? "bg-eccellere-ink text-white hover:bg-eccellere-ink/90"
                          : "border border-eccellere-ink/10 text-ink-mid hover:bg-eccellere-cream"
                      )}
                    >
                      {spec.status === "pending" || spec.status === "needs info" ? "Review profile and decide" : "View profile"}
                    </Link>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && !isSampleOnly && (
              <div className="mt-12 text-center text-sm text-ink-light">No specialists match your search.</div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
