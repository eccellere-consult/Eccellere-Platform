"use client";

import Link from "next/link";
import {
  Users,
  Briefcase,
  Package,
  IndianRupee,
  FileText,
  MessageCircle,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const kpis = [
  {
    label: "Total Revenue",
    value: "₹24,85,000",
    change: "+12.4%",
    positive: true,
    icon: IndianRupee,
  },
  {
    label: "Active Clients",
    value: "342",
    change: "+28",
    positive: true,
    icon: Users,
  },
  {
    label: "Active Specialists",
    value: "47",
    change: "+5",
    positive: true,
    icon: Briefcase,
  },
  {
    label: "Pending Reviews",
    value: "18",
    change: "3 urgent",
    positive: false,
    icon: ClipboardList,
  },
];

const recentActivity = [
  {
    action: "New specialist application",
    detail: "Vikram Patel — Agentic AI",
    time: "12 min ago",
    type: "specialist",
  },
  {
    action: "Order completed",
    detail: "#ORD-2847 — Lean Manufacturing Guide",
    time: "34 min ago",
    type: "order",
  },
  {
    action: "Asset submitted for review",
    detail: "Digital Transformation Playbook v2",
    time: "1 hr ago",
    type: "asset",
  },
  {
    action: "Client registered",
    detail: "Arjun Textiles Pvt Ltd — Manufacturing",
    time: "2 hr ago",
    type: "client",
  },
  {
    action: "Payout processed",
    detail: "₹18,500 to Specialist #SP-042",
    time: "3 hr ago",
    type: "finance",
  },
  {
    action: "Chatbot flagged conversation",
    detail: "Client asked about refund process",
    time: "4 hr ago",
    type: "chatbot",
  },
];

const revenueData = [
  { month: "Jul", value: 18 },
  { month: "Aug", value: 22 },
  { month: "Sep", value: 19 },
  { month: "Oct", value: 28 },
  { month: "Nov", value: 32 },
  { month: "Dec", value: 26 },
  { month: "Jan", value: 35 },
  { month: "Feb", value: 30 },
  { month: "Mar", value: 42 },
  { month: "Apr", value: 38 },
];

const topAssets = [
  { name: "MSME Growth Strategy Playbook", sales: 187, revenue: "₹4,67,313" },
  { name: "AI Readiness Assessment Toolkit", sales: 142, revenue: "₹2,83,858" },
  { name: "Lean Manufacturing Guide", sales: 98, revenue: "₹3,42,902" },
  { name: "E-Commerce Launch Checklist", sales: 234, revenue: "₹2,33,766" },
  { name: "Supply Chain Optimisation Kit", sales: 76, revenue: "₹2,27,924" },
];

export default function AdminDashboard() {
  const maxBar = Math.max(...revenueData.map((d) => d.value));

  return (
    <div className="bg-eccellere-cream">

      {/* Main content */}
      <div>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-eccellere-ink/5 bg-white/80 px-6 backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search clients, orders, assets..."
              className="w-80 rounded-md border border-eccellere-ink/10 bg-eccellere-cream/50 py-2 pl-10 pr-4 text-sm text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-md p-2 text-ink-light transition-colors hover:bg-eccellere-cream hover:text-eccellere-ink">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-eccellere-error" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-eccellere-gold/20 text-center text-sm font-medium leading-8 text-eccellere-gold">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-light text-eccellere-ink">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-ink-mid">
              Platform overview · Updated just now
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-ink-light">
                    {kpi.label}
                  </p>
                  <kpi.icon className="h-4 w-4 text-ink-light" />
                </div>
                <p className="mt-3 font-mono text-2xl font-medium text-eccellere-ink">
                  {kpi.value}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {kpi.positive ? (
                    <ArrowUpRight className="h-3 w-3 text-eccellere-teal" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-eccellere-error" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      kpi.positive ? "text-eccellere-teal" : "text-eccellere-error"
                    )}
                  >
                    {kpi.change}
                  </span>
                  <span className="text-xs text-ink-light">this month</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-eccellere-ink">
                  Monthly Revenue (₹ Lakhs)
                </h2>
                <span className="text-xs text-ink-light">Last 10 months</span>
              </div>
              <div className="mt-6 flex items-end gap-2" style={{ height: 180 }}>
                {revenueData.map((d) => (
                  <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-ink-light">
                      {d.value}
                    </span>
                    <div
                      className="w-full rounded-t bg-eccellere-gold/70 transition-all hover:bg-eccellere-gold"
                      style={{ height: `${(d.value / maxBar) * 140}px` }}
                    />
                    <span className="text-[10px] text-ink-light">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Assets */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-eccellere-ink">
                Top Selling Assets
              </h2>
              <div className="mt-4 space-y-3">
                {topAssets.map((asset, i) => (
                  <div
                    key={asset.name}
                    className="flex items-center gap-3 border-b border-eccellere-ink/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 font-mono text-[10px] text-eccellere-gold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-eccellere-ink">
                        {asset.name}
                      </p>
                      <p className="text-[11px] text-ink-light">
                        {asset.sales} sales
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-eccellere-gold">
                      {asset.revenue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity & Module Quick Access */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-medium text-eccellere-ink">
                Recent Activity
              </h2>
              <div className="mt-4 space-y-0">
                {recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b border-eccellere-ink/5 py-3 last:border-0"
                  >
                    <div
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        item.type === "specialist" && "bg-eccellere-purple",
                        item.type === "order" && "bg-eccellere-teal",
                        item.type === "asset" && "bg-eccellere-gold",
                        item.type === "client" && "bg-eccellere-info",
                        item.type === "finance" && "bg-eccellere-gold",
                        item.type === "chatbot" && "bg-eccellere-error"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-eccellere-ink">{item.action}</p>
                      <p className="truncate text-xs text-ink-light">
                        {item.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-light">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-eccellere-ink">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-2">
                <Button asChild className="w-full justify-start" size="sm">
                  <Link href="/admin/assets">
                    <Package className="mr-2 h-4 w-4" />
                    Review pending assets (8)
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href="/admin/specialists">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Review specialist apps (5)
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href="/admin/chatbot">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    View flagged chats (2)
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href="/admin/finance">
                    <IndianRupee className="mr-2 h-4 w-4" />
                    Process payouts
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href="/admin/content">
                    <FileText className="mr-2 h-4 w-4" />
                    Publish draft articles (3)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
