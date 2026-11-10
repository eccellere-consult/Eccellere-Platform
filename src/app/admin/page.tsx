"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, Package, IndianRupee, FileText, ClipboardList, UserCheck, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/admin/stats";
import type { DashboardData } from "@/lib/admin/loaders";

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/dashboard")
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error ?? "Could not load the dashboard."); return d as DashboardData; })
      .then((d) => { if (live) setData(d); })
      .catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  if (error) return <p className="m-6 rounded bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>;
  if (!data) return <p className="p-6 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading the dashboard…</p>;

  const { money, counts, activity } = data;
  const kpis = [
    ...(money ? [
      { label: "Total revenue", value: inr(money.totalRevenue), note: "Paid orders, all time", icon: IndianRupee },
      { label: "This month", value: inr(money.thisMonth), note: money.monthChange ? `${money.monthChange} vs last month` : "No earlier month to compare", icon: ArrowUpRight },
    ] : []),
    { label: "Active clients", value: String(counts.activeClients), note: `${counts.newClientsThisMonth} new this month`, icon: Users },
    { label: "Active specialists", value: String(counts.activeSpecialists), note: `${counts.specialistApplications} application${counts.specialistApplications === 1 ? "" : "s"} waiting`, icon: Briefcase },
  ];
  const maxBar = money ? Math.max(1, ...money.months.map((m) => m.value)) : 1;

  return (
    <div className="bg-eccellere-cream">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-light text-eccellere-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-mid">Platform overview · read from the live database at {new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-ink-light">{kpi.label}</p>
                <kpi.icon className="h-4 w-4 text-ink-light" />
              </div>
              <p className="mt-3 font-mono text-2xl font-medium text-eccellere-ink">{kpi.value}</p>
              <p className="mt-2 text-xs text-ink-light">{kpi.note}</p>
            </div>
          ))}
        </div>

        {money && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-eccellere-ink">Monthly revenue (₹)</h2>
                <span className="text-xs text-ink-light">Last 10 months, paid orders</span>
              </div>
              {money.months.every((m) => m.value === 0)
                ? <p className="mt-6 text-sm text-ink-light">No paid orders in the last 10 months yet.</p>
                : (
                  <div className="mt-6 flex items-end gap-2" style={{ height: 180 }}>
                    {money.months.map((m) => (
                      <div key={m.key} className="flex flex-1 flex-col items-center gap-1" title={`${m.label}: ${inr(m.value)}`}>
                        <span className="font-mono text-[10px] text-ink-light">{m.value ? (m.value >= 100000 ? `${(m.value / 100000).toFixed(1)}L` : `${Math.round(m.value / 1000)}k`) : "0"}</span>
                        <div className="w-full rounded-t bg-eccellere-gold/70 hover:bg-eccellere-gold" style={{ height: `${Math.max(2, (m.value / maxBar) * 140)}px` }} />
                        <span className="text-[10px] text-ink-light">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-eccellere-ink">Top selling toolkits</h2>
              {money.topAssets.length === 0 ? <p className="mt-4 text-sm text-ink-light">No sales yet.</p> : (
                <div className="mt-4 space-y-3">
                  {money.topAssets.map((a, i) => (
                    <div key={a.title + i} className="flex items-center gap-3 border-b border-eccellere-ink/5 pb-3 last:border-0 last:pb-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 font-mono text-[10px] text-eccellere-gold-deep">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-eccellere-ink">{a.title}</p>
                        <p className="text-[11px] text-ink-light">{a.sales} sale{a.sales === 1 ? "" : "s"}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-eccellere-gold-deep">{inr(a.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-medium text-eccellere-ink">Recent activity</h2>
            {activity.length === 0 ? <p className="mt-4 text-sm text-ink-light">Nothing recorded yet. Actions by the team (building a toolkit, changing a role) appear here.</p> : (
              <div className="mt-4">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-eccellere-ink/5 py-3 last:border-0">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-eccellere-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-eccellere-ink">{item.action}</p>
                      <p className="truncate text-xs text-ink-light">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-light">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-eccellere-ink">Needs your attention</h2>
            <div className="mt-4 space-y-2">
              <Button asChild className="w-full justify-start" size="sm"><Link href="/admin/assets"><Package className="mr-2 h-4 w-4" />Toolkits to review ({counts.assetsToReview})</Link></Button>
              <Button asChild variant="secondary" className="w-full justify-start" size="sm"><Link href="/admin/specialists"><Briefcase className="mr-2 h-4 w-4" />Specialist applications ({counts.specialistApplications})</Link></Button>
              <Button asChild variant="secondary" className="w-full justify-start" size="sm"><Link href="/admin/clients"><UserCheck className="mr-2 h-4 w-4" />Clients awaiting approval ({counts.clientsAwaitingApproval})</Link></Button>
              <Button asChild variant="ghost" className="w-full justify-start" size="sm"><Link href="/admin/tools"><ClipboardList className="mr-2 h-4 w-4" />Online tools</Link></Button>
              <Button asChild variant="ghost" className="w-full justify-start" size="sm"><Link href="/admin/content"><FileText className="mr-2 h-4 w-4" />Content</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
