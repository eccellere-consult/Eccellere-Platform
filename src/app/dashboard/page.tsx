"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from "react";
import {
  IndianRupee, BookOpen, ShoppingBag, Star, ArrowUpRight,
  Download, ClipboardList, Clock, CheckCircle, TrendingUp, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStats {
  name: string;
  kpis: {
    totalSpent: number;
    assetsPurchased: number;
    activeAssignments: number;
    aiReadinessScore: number | null;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    amount: number;
    createdAt: string;
    assets: string[];
  }[];
  recentAssets: {
    id: string;
    slug: string;
    title: string;
    category: string;
    components: string[];
    averageRating: number | null;
    specialistName: string;
    purchasedAt: string;
  }[];
  upcomingAssignments: {
    id: string;
    title: string;
    specialistName: string;
    dueDate: string | null;
    status: string;
  }[];
}

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-light">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-eccellere-error">{error ?? "Unable to load dashboard."}</p>
      </div>
    );
  }

  const { kpis, recentOrders, recentAssets, upcomingAssignments } = stats;

  const kpiCards: { label: string; value: string; change: string; icon: React.ElementType; positive: boolean | null }[] = [
    {
      label: "Total Spent",
      value: fmt(kpis.totalSpent),
      change: "Lifetime",
      icon: IndianRupee,
      positive: true as const,
    },
    {
      label: "Assets Purchased",
      value: String(kpis.assetsPurchased),
      change: kpis.assetsPurchased === 1 ? "1 asset" : `${kpis.assetsPurchased} assets`,
      icon: BookOpen,
      positive: true as const,
    },
    {
      label: "Active Assignments",
      value: String(kpis.activeAssignments),
      change: kpis.activeAssignments === 0 ? "None active" : `${kpis.activeAssignments} ongoing`,
      icon: ClipboardList,
      positive: null as null,
    },
    {
      label: "AI Readiness Score",
      value: kpis.aiReadinessScore != null ? `${kpis.aiReadinessScore}%` : "—",
      change: kpis.aiReadinessScore != null ? "Latest scan" : "Take assessment",
      icon: TrendingUp,
      positive: kpis.aiReadinessScore != null ? (true as const) : (null as null),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">
          {greeting()}, {stats.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-light">Here&apos;s your activity summary for today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-ink-light">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 text-ink-light" />
            </div>
            <p className="mt-3 font-mono text-2xl font-medium text-eccellere-ink">{kpi.value}</p>
            <p
              className={cn(
                "mt-1 text-xs",
                kpi.positive === true && "text-eccellere-teal",
                kpi.positive === false && "text-eccellere-error",
                kpi.positive === null && "text-ink-light"
              )}
            >
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-4">
              <h2 className="text-sm font-medium text-eccellere-ink">Recent Orders</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs text-eccellere-gold">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-light">No orders yet.</p>
            ) : (
              <div className="divide-y divide-eccellere-ink/5">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-eccellere-ink">
                        {order.assets[0] ?? order.orderNumber}
                        {order.assets.length > 1 && (
                          <span className="ml-1 text-xs text-ink-light">+{order.assets.length - 1} more</span>
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-light">
                        <span>{order.orderNumber}</span>
                        <span>·</span>
                        <span>{fmtDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-eccellere-ink">{fmt(order.amount)}</p>
                      <span className="mt-0.5 inline-block rounded-sm bg-eccellere-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-teal">
                        paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Assignments */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-4">
            <h2 className="text-sm font-medium text-eccellere-ink">Active Assignments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/assignments" className="flex items-center gap-1 text-xs text-eccellere-gold">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3 p-4">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-ink-light">No active assignments.</p>
            ) : (
              upcomingAssignments.map((a) => (
                <div key={a.id} className="rounded border border-eccellere-ink/5 bg-eccellere-cream p-4">
                  <p className="text-sm font-medium text-eccellere-ink">{a.title}</p>
                  <p className="mt-0.5 text-xs text-ink-light">with {a.specialistName}</p>
                  {a.dueDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-eccellere-gold">
                      <Clock className="h-3 w-3" />
                      Due {fmtDate(a.dueDate)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recently Purchased Assets */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-4">
          <h2 className="text-sm font-medium text-eccellere-ink">Recently Purchased Assets</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/library" className="flex items-center gap-1 text-xs text-eccellere-gold">
              My Library <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        {recentAssets.length === 0 ? (
          <p className="px-6 py-6 text-sm text-ink-light">
            No assets purchased yet.{" "}
            <Link href="/marketplace" className="underline hover:text-eccellere-gold">Browse marketplace →</Link>
          </p>
        ) : (
          <div className="divide-y divide-eccellere-ink/5">
            {recentAssets.map((asset) => {
              const format = Array.isArray(asset.components) && asset.components.length > 0
                ? asset.components[0] : "Download";
              return (
                <div key={asset.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-eccellere-ink">{asset.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-light">
                      <span className="rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {asset.category.replace(/_/g, " ")}
                      </span>
                      <span>by {asset.specialistName}</span>
                      {asset.averageRating != null && asset.averageRating > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                            {asset.averageRating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-light">{fmtDate(asset.purchasedAt)}</span>
                    <Button asChild size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                      <Link href={`/marketplace/${asset.slug}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex items-center gap-1.5 bg-eccellere-gold text-xs text-white hover:bg-eccellere-gold/90">
                      <a href={`/api/dashboard/download/${asset.id}`} download>
                        <Download className="h-3.5 w-3.5" />
                        {format}
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/advisor"
          className="flex items-center gap-4 rounded-lg bg-eccellere-ink p-5 transition-colors hover:bg-eccellere-ink/90"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-eccellere-gold/20">
            <svg className="h-5 w-5 text-eccellere-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Ask AI Advisor</p>
            <p className="mt-0.5 text-xs text-white/50">Get instant business guidance</p>
          </div>
        </Link>
        <Link
          href="/marketplace"
          className="flex items-center gap-4 rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-eccellere-gold/10">
            <ShoppingBag className="h-5 w-5 text-eccellere-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-eccellere-ink">Browse Marketplace</p>
            <p className="mt-0.5 text-xs text-ink-light">Explore our full catalogue</p>
          </div>
        </Link>
        <Link
          href="/dashboard/assessments"
          className="flex items-center gap-4 rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-eccellere-teal/10">
            <CheckCircle className="h-5 w-5 text-eccellere-teal" />
          </div>
          <div>
            <p className="text-sm font-medium text-eccellere-ink">View Assessments</p>
            <p className="mt-0.5 text-xs text-ink-light">Your AI readiness history</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
