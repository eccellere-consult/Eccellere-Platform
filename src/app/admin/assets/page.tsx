"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, ChevronLeft, Filter, Eye, CheckCircle, Clock,
  XCircle, Star, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Static seed rows (illustration only) ─────────────────────────────────────
interface StaticAsset {
  id: string; title: string; specialist: string; category: string;
  format: string; price: string; status: string; sales: number;
  rating: number | null; submitted: string;
}

const STATIC_ASSETS: StaticAsset[] = [
  { id: "AST-218", title: "MSME Growth Strategy Playbook",        specialist: "Vikram Patel",  category: "Strategy",     format: "PDF",           price: "₹2,499", status: "published", sales: 187, rating: 4.9, submitted: "Sep 2025" },
  { id: "AST-217", title: "AI Readiness Assessment Toolkit",      specialist: "Vikram Patel",  category: "Agentic AI",   format: "Excel",         price: "₹1,999", status: "published", sales: 142, rating: 4.9, submitted: "Oct 2025" },
  { id: "AST-216", title: "Lean Manufacturing Implementation Guide", specialist: "Rohit Kapoor", category: "Process",   format: "PDF + Template", price: "₹3,499", status: "published", sales: 98,  rating: 4.7, submitted: "Aug 2025" },
  { id: "AST-215", title: "E-Commerce Launch Checklist",          specialist: "Meera Rao",    category: "Digital",      format: "Template",      price: "₹999",   status: "published", sales: 234, rating: 4.6, submitted: "Nov 2025" },
  { id: "AST-219", title: "Digital Transformation Playbook v2",   specialist: "Vikram Patel",  category: "Digital",      format: "PDF",           price: "₹3,499", status: "pending",   sales: 0,   rating: null, submitted: "Apr 2026" },
  { id: "AST-220", title: "Route Optimisation Framework",         specialist: "Arun Nair",    category: "Logistics",    format: "Excel + PDF",   price: "₹2,999", status: "pending",   sales: 0,   rating: null, submitted: "Apr 2026" },
  { id: "AST-221", title: "MSME Financial Planning Template",     specialist: "Ananya Desai", category: "Strategy",     format: "Excel",         price: "₹1,499", status: "pending",   sales: 0,   rating: null, submitted: "Apr 2026" },
  { id: "AST-222", title: "Brand Identity Toolkit for D2C",       specialist: "Karan Singh",  category: "Digital",      format: "PDF + Figma",   price: "₹2,499", status: "pending",   sales: 0,   rating: null, submitted: "Apr 2026" },
  { id: "AST-200", title: "Basic HR Policy Template",             specialist: "Deepak Verma", category: "Organisation", format: "Word",          price: "₹799",   status: "rejected",  sales: 0,   rating: null, submitted: "Mar 2026" },
];

// ── DB asset shape from /api/admin/assets ─────────────────────────────────────
interface DbAsset {
  id: string;
  title: string;
  serviceDomain: string;
  category: string;
  status: string;
  price: number;
  totalPurchases: number;
  averageRating: number;
  createdAt: string;
  components: string[];
  author: { user: { name: string | null; email: string } };
}

// ── Unified display shape ─────────────────────────────────────────────────────
interface DisplayAsset {
  key: string;
  dbId?: string;
  displayId: string;
  title: string;
  specialist: string;
  category: string;
  format: string;
  price: string;
  filterStatus: "published" | "pending" | "rejected";
  statusLabel: string;
  statusColor: string;
  StatusIcon: React.ElementType;
  sales: number;
  rating: number | null;
  submitted: string;
  isStatic: boolean;
  canAct: boolean;
}

const DB_STATUS_CFG: Record<string, {
  filterStatus: "published" | "pending" | "rejected";
  label: string; color: string; icon: typeof CheckCircle; canAct: boolean;
}> = {
  SUBMITTED:           { filterStatus: "pending",   label: "Submitted",    color: "bg-eccellere-gold/10 text-eccellere-gold",   icon: Clock,       canAct: true  },
  UNDER_REVIEW:        { filterStatus: "pending",   label: "Under Review", color: "bg-blue-50 text-blue-600",                   icon: Clock,       canAct: true  },
  REVISIONS_REQUESTED: { filterStatus: "rejected",  label: "Revisions",    color: "bg-eccellere-error/10 text-eccellere-error", icon: XCircle,     canAct: false },
  APPROVED:            { filterStatus: "published", label: "Approved",     color: "bg-eccellere-teal/10 text-eccellere-teal",   icon: CheckCircle, canAct: false },
  PUBLISHED:           { filterStatus: "published", label: "Published",    color: "bg-eccellere-teal/10 text-eccellere-teal",   icon: CheckCircle, canAct: false },
  RETIRED:             { filterStatus: "rejected",  label: "Retired",      color: "bg-eccellere-ink/10 text-ink-light",         icon: XCircle,     canAct: false },
  DRAFT:               { filterStatus: "pending",   label: "Draft",        color: "bg-eccellere-gold/10 text-eccellere-gold",   icon: Clock,       canAct: false },
};

const STATIC_STATUS_CFG: Record<string, {
  filterStatus: "published" | "pending" | "rejected";
  color: string; icon: typeof CheckCircle;
}> = {
  published: { filterStatus: "published", color: "bg-eccellere-teal/10 text-eccellere-teal",   icon: CheckCircle },
  pending:   { filterStatus: "pending",   color: "bg-eccellere-gold/10 text-eccellere-gold",   icon: Clock       },
  rejected:  { filterStatus: "rejected",  color: "bg-eccellere-error/10 text-eccellere-error", icon: XCircle     },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function dbToDisplay(a: DbAsset): DisplayAsset {
  const cfg = DB_STATUS_CFG[a.status] ?? DB_STATUS_CFG.SUBMITTED;
  const format = Array.isArray(a.components) && a.components.length > 0 ? a.components[0] : "—";
  return {
    key: `db-${a.id}`,
    dbId: a.id,
    displayId: a.id.slice(0, 8).toUpperCase(),
    title: a.title,
    specialist: a.author.user.name ?? a.author.user.email,
    category: a.serviceDomain || a.category,
    format,
    price: `₹${a.price.toLocaleString("en-IN")}`,
    filterStatus: cfg.filterStatus,
    statusLabel: cfg.label,
    statusColor: cfg.color,
    StatusIcon: cfg.icon,
    sales: a.totalPurchases,
    rating: a.averageRating > 0 ? a.averageRating : null,
    submitted: formatDate(a.createdAt),
    isStatic: false,
    canAct: cfg.canAct,
  };
}

function staticToDisplay(a: StaticAsset): DisplayAsset {
  const cfg = STATIC_STATUS_CFG[a.status] ?? STATIC_STATUS_CFG.pending;
  return {
    key: `static-${a.id}`,
    displayId: a.id,
    title: a.title,
    specialist: a.specialist,
    category: a.category,
    format: a.format,
    price: a.price,
    filterStatus: cfg.filterStatus,
    statusLabel: a.status.charAt(0).toUpperCase() + a.status.slice(1),
    statusColor: cfg.color,
    StatusIcon: cfg.icon,
    sales: a.sales,
    rating: a.rating,
    submitted: a.submitted,
    isStatic: true,
    canAct: false,
  };
}

export default function AdminAssets() {
  const [dbAssets, setDbAssets] = useState<DbAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/assets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDbAssets(data.assets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  async function handleAction(dbId: string, action: "approve" | "reject") {
    setActionLoading(dbId + action);
    try {
      const res = await fetch("/api/admin/assets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dbId, action }),
      });
      if (!res.ok) throw new Error("Action failed");
    } finally {
      setActionLoading(null);
      await fetchAssets();
    }
  }

  const allAssets: DisplayAsset[] = [
    ...dbAssets.map(dbToDisplay),
    ...STATIC_ASSETS.map(staticToDisplay),
  ];

  const filtered = allAssets.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.specialist.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.filterStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = dbAssets.filter(
    (a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW"
  ).length;

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Assets</h1>
          <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold">
            {loading ? "…" : dbAssets.length > 0 ? dbAssets.length : STATIC_ASSETS.length}
          </span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-eccellere-error/10 px-2 py-0.5 text-xs text-eccellere-error">
              {pendingCount} pending review
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Could not load live data ({error}) — showing illustration data only.{" "}
              <button onClick={fetchAssets} className="underline hover:no-underline">
                Retry
              </button>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search assets or specialists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-light" />
            {["all", "published", "pending", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filterStatus === s
                    ? "bg-eccellere-gold text-white"
                    : "bg-white text-ink-mid hover:bg-eccellere-cream"
                )}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-ink-light">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Loading assets…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eccellere-ink/5">
                    <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Asset</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Specialist</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Category</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Status</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-medium uppercase tracking-wider text-ink-light">Price</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-medium uppercase tracking-wider text-ink-light">Sales</th>
                    <th className="w-44" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-eccellere-ink/5">
                  {filtered.map((asset) => (
                    <tr
                      key={asset.key}
                      className={cn(
                        "transition-colors hover:bg-eccellere-cream/50",
                        asset.isStatic && "opacity-60"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium text-eccellere-ink">{asset.title}</p>
                            <p className="text-xs text-ink-light">
                              {asset.displayId} · {asset.format} · {asset.submitted}
                            </p>
                          </div>
                          {asset.isStatic && (
                            <span className="rounded bg-eccellere-ink/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink-light">
                              sample
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-mid">{asset.specialist}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">
                          {asset.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                          asset.statusColor
                        )}>
                          <asset.StatusIcon className="h-3 w-3" />
                          {asset.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-eccellere-ink">{asset.price}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-sm text-ink-mid">{asset.sales}</span>
                          {asset.rating !== null && (
                            <span className="flex items-center gap-0.5 text-xs text-eccellere-gold">
                              <Star className="h-3 w-3 fill-current" />
                              {typeof asset.rating === "number" ? asset.rating.toFixed(1) : asset.rating}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!asset.isStatic && asset.canAct ? (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-[10px]"
                                disabled={actionLoading !== null}
                                onClick={() => handleAction(asset.dbId!, "approve")}
                              >
                                {actionLoading === asset.dbId + "approve"
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px]"
                                disabled={actionLoading !== null}
                                onClick={() => handleAction(asset.dbId!, "reject")}
                              >
                                {actionLoading === asset.dbId + "reject"
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : "Reject"}
                              </Button>
                            </>
                          ) : (
                            <button className="rounded p-1 text-ink-light hover:bg-eccellere-cream hover:text-eccellere-ink">
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-ink-light">
                  No assets match your filters.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
