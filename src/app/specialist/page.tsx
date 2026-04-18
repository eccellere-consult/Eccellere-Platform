"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  ClipboardList,
  IndianRupee,
  User,
  BarChart3,
  Star,

  ArrowUpRight,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const kpis = [
  { label: "Total Earnings", value: "₹3,42,500", change: "+₹48K this month", icon: IndianRupee },
  { label: "Published Assets", value: "12", change: "3 pending review", icon: Package },
  { label: "Active Assignments", value: "3", change: "1 due this week", icon: ClipboardList },
  { label: "Avg Rating", value: "4.8", change: "from 87 reviews", icon: Star },
];

const dashboardSections = [
  {
    label: "My Assets",
    href: "/specialist/assets",
    description: "Manage your published frameworks, toolkits, and templates",
    icon: Package,
    stat: "12 published",
  },
  {
    label: "Submit New Asset",
    href: "/specialist/assets/new",
    description: "Create and submit a new framework or toolkit for review",
    icon: PlusCircle,
    stat: null,
  },
  {
    label: "Assignments",
    href: "/specialist/assignments",
    description: "View and manage your consulting assignments",
    icon: ClipboardList,
    stat: "3 active",
  },
  {
    label: "Earnings & Payouts",
    href: "/specialist/payments",
    description: "Track revenue, view payout history, and manage bank details",
    icon: IndianRupee,
    stat: "₹3.4L total",
  },
  {
    label: "Profile",
    href: "/specialist/profile",
    description: "Update your bio, certifications, and expertise areas",
    icon: User,
    stat: null,
  },
  {
    label: "Analytics",
    href: "/specialist/analytics",
    description: "View download stats, ratings, and revenue per asset",
    icon: BarChart3,
    stat: "1,247 downloads",
  },
];

const myAssets = [
  {
    name: "MSME Growth Strategy Playbook",
    status: "published",
    sales: 187,
    revenue: "₹4,67,313",
    rating: 4.9,
    views: 2340,
  },
  {
    name: "Supply Chain Resilience Framework",
    status: "published",
    sales: 76,
    revenue: "₹2,27,924",
    rating: 4.7,
    views: 1120,
  },
  {
    name: "AI Implementation Roadmap for Manufacturing",
    status: "published",
    sales: 42,
    revenue: "₹1,46,958",
    rating: 4.8,
    views: 890,
  },
  {
    name: "Digital Transformation Playbook v2",
    status: "pending",
    sales: 0,
    revenue: "—",
    rating: null,
    views: 0,
  },
  {
    name: "Retail Analytics Dashboard Template",
    status: "draft",
    sales: 0,
    revenue: "—",
    rating: null,
    views: 0,
  },
];

const assignments = [
  {
    client: "Arjun Textiles Pvt Ltd",
    project: "Process Transformation Assessment",
    status: "in-progress",
    dueDate: "Apr 28, 2026",
    value: "₹75,000",
  },
  {
    client: "FreshBasket D2C",
    project: "Omnichannel Strategy Workshop",
    status: "in-progress",
    dueDate: "May 5, 2026",
    value: "₹45,000",
  },
  {
    client: "SwiftShip Logistics",
    project: "AI Readiness Deep Dive",
    status: "in-progress",
    dueDate: "May 12, 2026",
    value: "₹60,000",
  },
  {
    client: "Precision Auto Components",
    project: "Lean Manufacturing Audit",
    status: "completed",
    dueDate: "Mar 15, 2026",
    value: "₹90,000",
  },
];

const earningsMonthly = [
  { month: "Nov", value: 28 },
  { month: "Dec", value: 35 },
  { month: "Jan", value: 42 },
  { month: "Feb", value: 38 },
  { month: "Mar", value: 52 },
  { month: "Apr", value: 48 },
];

export default function SpecialistDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "assignments" | "earnings">(
    "overview"
  );
  const maxBar = Math.max(...earningsMonthly.map((d) => d.value));

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "assets" as const, label: "My Assets" },
    { id: "assignments" as const, label: "Assignments" },
    { id: "earnings" as const, label: "Earnings" },
  ];

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Specialist Portal
              </p>
              <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
                Welcome back, Specialist
              </h1>
            </div>
            <Button asChild>
              <Link href="/specialist/assets/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit New Asset
              </Link>
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-ink-light">
                    {kpi.label}
                  </p>
                  <kpi.icon className="h-4 w-4 text-ink-light" />
                </div>
                <p className="mt-3 font-mono text-2xl font-medium text-eccellere-ink">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-ink-light">{kpi.change}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-10 flex gap-1 border-b border-eccellere-ink/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-eccellere-gold text-eccellere-gold"
                    : "border-transparent text-ink-light hover:text-eccellere-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-8">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick access modules */}
                <div className="space-y-3 lg:col-span-2">
                  <h2 className="text-sm font-medium text-eccellere-ink">Quick Access</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dashboardSections.map((section) => (
                      <Link
                        key={section.label}
                        href={section.href}
                        className="group rounded-lg border border-eccellere-ink/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-eccellere-gold/20 hover:shadow-md"
                      >
                        <section.icon className="h-5 w-5 text-eccellere-gold" />
                        <h3 className="mt-3 text-sm font-medium text-eccellere-ink">
                          {section.label}
                        </h3>
                        <p className="mt-1 text-xs text-ink-light line-clamp-2">
                          {section.description}
                        </p>
                        {section.stat && (
                          <span className="mt-2 inline-block font-mono text-xs text-eccellere-gold">
                            {section.stat}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Upcoming deadlines */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-medium text-eccellere-ink">
                    Upcoming Deadlines
                  </h2>
                  <div className="mt-4 space-y-3">
                    {assignments
                      .filter((a) => a.status === "in-progress")
                      .map((a) => (
                        <div
                          key={a.project}
                          className="border-b border-eccellere-ink/5 pb-3 last:border-0 last:pb-0"
                        >
                          <p className="text-sm text-eccellere-ink">{a.project}</p>
                          <p className="text-xs text-ink-light">{a.client}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-eccellere-gold" />
                            <span className="text-xs font-medium text-eccellere-gold">
                              {a.dueDate}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-eccellere-ink/5 px-6 py-4">
                  <h2 className="text-sm font-medium text-eccellere-ink">
                    My Assets ({myAssets.length})
                  </h2>
                </div>
                <div className="divide-y divide-eccellere-ink/5">
                  {myAssets.map((asset) => (
                    <div
                      key={asset.name}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-eccellere-ink">
                          {asset.name}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                              asset.status === "published" &&
                                "bg-eccellere-teal/10 text-eccellere-teal",
                              asset.status === "pending" &&
                                "bg-eccellere-gold/10 text-eccellere-gold",
                              asset.status === "draft" &&
                                "bg-ink-light/10 text-ink-light"
                            )}
                          >
                            {asset.status === "published" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {asset.status === "pending" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {asset.status === "draft" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {asset.status}
                          </span>
                          {asset.rating && (
                            <span className="flex items-center gap-1 text-xs text-eccellere-gold">
                              <Star className="h-3 w-3 fill-current" />
                              {asset.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <p className="flex items-center gap-1 text-xs text-ink-light">
                            <Eye className="h-3 w-3" /> Views
                          </p>
                          <p className="font-mono text-sm text-eccellere-ink">
                            {asset.views.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-1 text-xs text-ink-light">
                            <Download className="h-3 w-3" /> Sales
                          </p>
                          <p className="font-mono text-sm text-eccellere-ink">
                            {asset.sales}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-light">Revenue</p>
                          <p className="font-mono text-sm text-eccellere-gold">
                            {asset.revenue}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-eccellere-ink/5 px-6 py-4">
                  <h2 className="text-sm font-medium text-eccellere-ink">
                    Assignments ({assignments.length})
                  </h2>
                </div>
                <div className="divide-y divide-eccellere-ink/5">
                  {assignments.map((a) => (
                    <div
                      key={a.project}
                      className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-eccellere-ink">
                          {a.project}
                        </p>
                        <p className="text-xs text-ink-light">{a.client}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span
                          className={cn(
                            "rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                            a.status === "in-progress" &&
                              "bg-eccellere-info/10 text-eccellere-info",
                            a.status === "completed" &&
                              "bg-eccellere-teal/10 text-eccellere-teal"
                          )}
                        >
                          {a.status}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-ink-light">Due {a.dueDate}</p>
                          <p className="font-mono text-sm text-eccellere-gold">
                            {a.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-eccellere-ink">
                      Monthly Earnings (₹ Thousands)
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-eccellere-teal">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>+26% vs last quarter</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
                    {earningsMonthly.map((d) => (
                      <div
                        key={d.month}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="font-mono text-[10px] text-ink-light">
                          ₹{d.value}K
                        </span>
                        <div
                          className="w-full rounded-t bg-eccellere-gold/70 transition-all hover:bg-eccellere-gold"
                          style={{ height: `${(d.value / maxBar) * 160}px` }}
                        />
                        <span className="text-[10px] text-ink-light">{d.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-medium text-eccellere-ink">
                    Earnings Breakdown
                  </h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-mid">Asset Sales (60%)</span>
                        <span className="font-mono text-eccellere-gold">₹2,05,500</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream">
                        <div className="h-full w-[60%] rounded-full bg-eccellere-gold" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-mid">Assignments (35%)</span>
                        <span className="font-mono text-eccellere-gold">₹1,19,875</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream">
                        <div className="h-full w-[35%] rounded-full bg-eccellere-purple" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-mid">Bonuses (5%)</span>
                        <span className="font-mono text-eccellere-gold">₹17,125</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream">
                        <div className="h-full w-[5%] rounded-full bg-eccellere-teal" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-eccellere-ink/5 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-eccellere-ink">
                        Next Payout
                      </span>
                      <span className="font-mono text-sm text-eccellere-gold">₹48,250</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-light">
                      Processing on Apr 30, 2026
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
