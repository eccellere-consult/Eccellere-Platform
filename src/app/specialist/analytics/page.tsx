"use client";

import { BarChart3, Eye, Download, Star, TrendingUp, ArrowUpRight } from "lucide-react";

const assetStats = [
  { name: "MSME Growth Strategy Playbook", views: 2340, downloads: 187, rating: 4.9, revenue: "₹4,67,313" },
  { name: "Supply Chain Resilience Framework", views: 1120, downloads: 76, rating: 4.7, revenue: "₹2,27,924" },
  { name: "AI Implementation Roadmap for Manufacturing", views: 890, downloads: 42, rating: 4.8, revenue: "₹1,46,958" },
];

const monthlyViews = [
  { month: "Nov", views: 820 },
  { month: "Dec", views: 960 },
  { month: "Jan", views: 1100 },
  { month: "Feb", views: 980 },
  { month: "Mar", views: 1340 },
  { month: "Apr", views: 1150 },
];

export default function SpecialistAnalyticsPage() {
  const totalViews = assetStats.reduce((sum, a) => sum + a.views, 0);
  const totalDownloads = assetStats.reduce((sum, a) => sum + a.downloads, 0);
  const avgRating = (assetStats.reduce((sum, a) => sum + a.rating, 0) / assetStats.length).toFixed(1);
  const maxViews = Math.max(...monthlyViews.map((d) => d.views));

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Analytics</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">Performance Analytics</h1>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink-light">Total Views</p>
            <Eye className="h-4 w-4 text-ink-light" />
          </div>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{totalViews.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink-light">Total Downloads</p>
            <Download className="h-4 w-4 text-ink-light" />
          </div>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{totalDownloads}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink-light">Avg Rating</p>
            <Star className="h-4 w-4 text-ink-light" />
          </div>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{avgRating}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink-light">Conversion Rate</p>
            <TrendingUp className="h-4 w-4 text-ink-light" />
          </div>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{((totalDownloads / totalViews) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Views chart */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-eccellere-ink">Monthly Views</h2>
          <span className="flex items-center gap-1 text-xs text-eccellere-teal"><ArrowUpRight className="h-3 w-3" />+18% vs prior period</span>
        </div>
        <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
          {monthlyViews.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-ink-light">{d.views}</span>
              <div className="w-full rounded-t bg-eccellere-teal/60 transition-all hover:bg-eccellere-teal" style={{ height: `${(d.views / maxViews) * 160}px` }} />
              <span className="text-[10px] text-ink-light">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-asset breakdown */}
      <div className="mt-8 rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4">
          <h2 className="text-sm font-medium text-eccellere-ink">Per-Asset Performance</h2>
        </div>
        <div className="divide-y divide-eccellere-ink/5">
          {assetStats.map((a) => (
            <div key={a.name} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-eccellere-ink">{a.name}</p>
              <div className="flex items-center gap-6 text-xs text-ink-light">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.views}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{a.downloads}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />{a.rating}</span>
                <span className="font-mono text-sm text-eccellere-gold">{a.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
