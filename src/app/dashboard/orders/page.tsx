"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Completed", "Processing", "Refunded"];

type Order = {
  id: string;
  dbId?: string;
  assetId?: string;
  asset: string;
  assetSlug?: string;
  category: string;
  date: string;
  amount: string;
  payment: string;
  status: string;
  invoice: boolean;
  invoiceUrl?: string | null;
};

const statusStyles: Record<string, string> = {
  completed: "bg-eccellere-teal/10 text-eccellere-teal",
  processing: "bg-eccellere-gold/10 text-eccellere-gold",
  refunded: "bg-eccellere-error/10 text-eccellere-error",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetch("/api/dashboard/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

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
          {loading ? (
            <p className="mt-1 text-sm text-ink-light">Loading orders…</p>
          ) : (
            <p className="mt-1 text-sm text-ink-light">
              {orders.length} orders · Lifetime spend{" "}
              <span className="font-mono font-medium text-eccellere-ink">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </p>
          )}
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
                      {order.assetSlug && (
                        <Link
                          href={`/marketplace/${order.assetSlug}`}
                          className="flex items-center gap-0.5 text-xs text-eccellere-gold hover:underline"
                        >
                          View <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                      {order.status === "completed" && (
                        <a
                          href={`/api/dashboard/download/${order.assetId}`}
                          download
                          className="flex items-center gap-1 text-xs text-eccellere-ink hover:text-eccellere-gold"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      )}
                      {order.invoice && order.invoiceUrl && (
                        <a
                          href={order.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-ink-light hover:text-eccellere-ink"
                        >
                          Invoice
                        </a>
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
            <p className="text-sm text-ink-light">
              {loading ? "Loading…" : orders.length === 0 ? "You have no orders yet." : "No orders match your search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
