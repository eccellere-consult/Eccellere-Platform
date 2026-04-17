"use client";

import Link from "next/link";
import {
  IndianRupee,
  BookOpen,
  ShoppingBag,
  Star,
  ArrowUpRight,
  Download,
  ClipboardList,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Total Spent", value: "₹42,500", change: "Lifetime", icon: IndianRupee, positive: true },
  { label: "Assets Purchased", value: "8", change: "2 this month", icon: BookOpen, positive: true },
  { label: "Active Assignments", value: "2", change: "1 due this week", icon: ClipboardList, positive: null },
  { label: "AI Readiness Score", value: "72%", change: "+8 pts last scan", icon: TrendingUp, positive: true },
];

const recentOrders = [
  { id: "ORD-2041", asset: "MSME Growth Strategy Playbook", date: "Apr 10, 2026", amount: "₹4,999", status: "completed" },
  { id: "ORD-2038", asset: "Supply Chain Risk Assessment Tool", date: "Apr 6, 2026", amount: "₹7,500", status: "completed" },
  { id: "ORD-2031", asset: "Retail Analytics Dashboard", date: "Mar 28, 2026", amount: "₹5,499", status: "completed" },
  { id: "ORD-2024", asset: "AI Readiness Benchmark Report", date: "Mar 14, 2026", amount: "₹3,299", status: "completed" },
];

const recentAssets = [
  {
    id: "1",
    title: "MSME Growth Strategy Playbook",
    category: "Strategy",
    specialist: "Dr. Priya Malhotra",
    rating: 4.8,
    purchased: "Apr 10, 2026",
    format: "PDF",
  },
  {
    id: "2",
    title: "Supply Chain Risk Assessment Tool",
    category: "Supply Chain",
    specialist: "Vikram Nair",
    rating: 4.9,
    purchased: "Apr 6, 2026",
    format: "Excel",
  },
  {
    id: "3",
    title: "Retail Analytics Dashboard Template",
    category: "Digital",
    specialist: "Ananya Krishnan",
    rating: 4.6,
    purchased: "Mar 28, 2026",
    format: "Excel",
  },
];

const upcomingDeadlines = [
  {
    project: "Digital Transformation Roadmap",
    specialist: "Vikram Nair",
    status: "in-progress",
    dueDate: "Apr 28, 2026",
  },
  {
    project: "Process Audit — Manufacturing Unit",
    specialist: "Dr. Priya Malhotra",
    status: "in-progress",
    dueDate: "May 5, 2026",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">
          Good morning, Rahul
        </h1>
        <p className="mt-1 text-sm text-ink-light">Here&apos;s your activity summary for today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
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
            <div className="divide-y divide-eccellere-ink/5">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-eccellere-ink">{order.asset}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-light">
                      <span>{order.id}</span>
                      <span>·</span>
                      <span>{order.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-eccellere-ink">{order.amount}</p>
                    <span className="mt-0.5 inline-block rounded-sm bg-eccellere-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-teal">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            {upcomingDeadlines.map((a) => (
              <div
                key={a.project}
                className="rounded border border-eccellere-ink/5 bg-eccellere-cream p-4"
              >
                <p className="text-sm font-medium text-eccellere-ink">{a.project}</p>
                <p className="mt-0.5 text-xs text-ink-light">with {a.specialist}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-eccellere-gold">
                  <Clock className="h-3 w-3" />
                  Due {a.dueDate}
                </div>
              </div>
            ))}
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
        <div className="divide-y divide-eccellere-ink/5">
          {recentAssets.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-eccellere-ink">{asset.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-light">
                  <span className="rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {asset.category}
                  </span>
                  <span>by {asset.specialist}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                    {asset.rating}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-light">{asset.purchased}</span>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  {asset.format}
                </Button>
              </div>
            </div>
          ))}
        </div>
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
            <p className="mt-0.5 text-xs text-ink-light">218 assets available</p>
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
