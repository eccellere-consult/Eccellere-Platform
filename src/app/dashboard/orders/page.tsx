"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Completed", "Processing", "Refunded"];

const orders = [
  {
    id: "ORD-2041",
    asset: "MSME Growth Strategy Playbook",
    category: "Strategy",
    date: "Apr 10, 2026",
    amount: "₹4,999",
    payment: "Razorpay",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-2038",
    asset: "Supply Chain Risk Assessment Tool",
    category: "Supply Chain",
    date: "Apr 6, 2026",
    amount: "₹7,500",
    payment: "UPI",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-2031",
    asset: "Retail Analytics Dashboard Template",
    category: "Digital",
    date: "Mar 28, 2026",
    amount: "₹5,499",
    payment: "Card",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-2024",
    asset: "AI Readiness Benchmark Report",
    category: "Digital",
    date: "Mar 14, 2026",
    amount: "₹3,299",
    payment: "UPI",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-1988",
    asset: "Working Capital Optimisation Framework",
    category: "Finance",
    date: "Feb 22, 2026",
    amount: "₹6,200",
    payment: "Razorpay",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-1964",
    asset: "HR Policy Manual Template — Manufacturing",
    category: "HR & Talent",
    date: "Feb 10, 2026",
    amount: "₹2,499",
    payment: "Card",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-1941",
    asset: "SOP Mapping & Process Documentation Kit",
    category: "Process",
    date: "Jan 30, 2026",
    amount: "₹8,999",
    payment: "UPI",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-1912",
    asset: "Demand Forecasting Model — Consumer Goods",
    category: "Supply Chain",
    date: "Jan 15, 2026",
    amount: "₹4,499",
    payment: "Razorpay",
    status: "completed",
    invoice: true,
  },
  {
    id: "ORD-1875",
    asset: "Digital Marketing Audit Framework",
    category: "Digital",
    date: "Dec 28, 2025",
    amount: "₹3,999",
    payment: "UPI",
    status: "refunded",
    invoice: false,
  },
  {
    id: "ORD-2050",
    asset: "Manufacturing Cost Reduction Toolkit",
    category: "Process",
    date: "Apr 13, 2026",
    amount: "₹5,999",
    payment: "Card",
    status: "processing",
    invoice: false,
  },
];

const statusStyles: Record<string, string> = {
  completed: "bg-eccellere-teal/10 text-eccellere-teal",
  processing: "bg-eccellere-gold/10 text-eccellere-gold",
  refunded: "bg-eccellere-error/10 text-eccellere-error",
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.asset.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const total = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + parseInt(o.amount.replace(/[₹,]/g, "")), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Client Dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">Order History</h1>
          <p className="mt-1 text-sm text-ink-light">
            {orders.length} orders · Lifetime spend{" "}
            <span className="font-mono font-medium text-eccellere-ink">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <button className="hidden items-center gap-1.5 rounded border border-eccellere-ink/10 bg-white px-3 py-2 text-xs text-ink-mid transition-colors hover:border-eccellere-gold/40 sm:flex">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
          <input
            type="text"
            placeholder="Search by order ID or asset name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-eccellere-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f
                  ? "bg-eccellere-gold text-white"
                  : "bg-white text-ink-light hover:text-eccellere-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-eccellere-ink/5 bg-eccellere-cream">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-light">
                  Order
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-light">
                  Asset
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-light">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-light">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-light">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-light">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eccellere-ink/5">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-eccellere-cream/40">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-ink-light">{order.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-eccellere-ink">{order.asset}</p>
                    <p className="mt-0.5 text-xs text-ink-light">{order.category} · {order.payment}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-ink-light">{order.date}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-sm text-eccellere-ink">
                    {order.amount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        statusStyles[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center gap-0.5 text-xs text-eccellere-gold hover:underline"
                      >
                        View <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      {order.invoice && (
                        <button className="text-xs text-ink-light hover:text-eccellere-ink">
                          Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-ink-light">No orders match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
