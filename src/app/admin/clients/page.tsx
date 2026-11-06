"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// One sample row — shown only when no real clients have registered yet
const SAMPLE_CLIENT = {
  id: "SAMPLE",
  name: "Arjun Textiles Pvt Ltd (sample)",
  email: "sample@example.com",
  sector: "Manufacturing",
  status: "active",
  plan: "Growth",
  revenue: "₹1,24,500",
  joined: "Jan 2026",
  city: "",
  state: "",
};

type Client = {
  id: string;
  name: string;
  email: string;
  sector: string;
  status: string;
  approval?: "PENDING" | "APPROVED" | "BLOCKED";
  plan: string;
  revenue: string;
  joined: string;
  city?: string;
  state?: string;
};

const statusColors: Record<string, string> = {
  active: "bg-eccellere-teal/10 text-eccellere-teal",
  onboarding: "bg-eccellere-gold/10 text-eccellere-gold",
  churned: "bg-eccellere-error/10 text-eccellere-error",
};

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [waitingOnly, setWaitingOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "block" | "unblock") {
    if (action === "block" && !confirm("Block this client? They will be signed out and cannot sign in until you unblock them.")) return;
    setBusyId(id); setNotice(null);
    try {
      const r = await fetch(`/api/admin/clients/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setNotice(d.error ?? "That did not work.");
      else {
        setNotice(action === "approve" ? (d.emailed ? "Approved. The client has been emailed." : "Approved. The email could not be sent, so please tell the client.") : action === "block" ? "Blocked." : "Unblocked.");
        await fetchClients();
      }
    } catch { setNotice("Lost the connection. Please try again."); }
    setBusyId(null);
  }

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Show sample row only when DB returned zero real clients
  const displayClients: Client[] = clients.length === 0 && !loading && !error
    ? [SAMPLE_CLIENT]
    : clients;

  const filtered = displayClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesSector = filterSector === "all" || c.sector === filterSector;
    return matchesSearch && matchesSector && (!waitingOnly || c.approval === "PENDING");
  });

  const waiting = clients.filter((c) => c.approval === "PENDING").length;
  const isSampleOnly = clients.length === 0 && !loading && !error;

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Clients</h1>
          {!loading && (
            <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold">
              {clients.length}
            </span>
          )}
          <button
            onClick={fetchClients}
            className="ml-auto rounded p-1.5 text-ink-light hover:bg-eccellere-cream hover:text-eccellere-ink"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-md border border-eccellere-error/30 bg-eccellere-error/5 px-4 py-3 text-sm text-eccellere-error">
            Failed to load clients: {error}.{" "}
            <button onClick={fetchClients} className="underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Sample-only notice */}
        {isSampleOnly && (
          <div className="mb-4 rounded-md border border-eccellere-gold/30 bg-eccellere-gold/5 px-4 py-3 text-sm text-ink-mid">
            No registered clients yet. Showing one sample row for reference.
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-white" />
            ))}
          </div>
        )}

        {/* Filters + Table */}
        {!loading && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-light" />
                {["all", "Manufacturing", "Retail", "Logistics", "Consumer Products"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSector(s)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      filterSector === s
                        ? "bg-eccellere-gold text-white"
                        : "bg-white text-ink-mid hover:bg-eccellere-cream"
                    )}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={() => setWaitingOnly((v) => !v)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium", waitingOnly ? "bg-eccellere-gold text-white" : "bg-white text-ink-mid hover:bg-eccellere-cream")}
              >
                Awaiting approval ({waiting})
              </button>
              {notice && <span role="status" className="text-xs text-ink-mid">{notice}</span>}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-eccellere-ink/5">
                      <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Client
                      </th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Sector
                      </th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Plan
                      </th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Revenue
                      </th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-medium uppercase tracking-wider text-ink-light">
                        Joined
                      </th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-medium uppercase tracking-wider text-ink-light">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-eccellere-ink/5">
                    {filtered.map((client) => (
                      <tr
                        key={client.id}
                        className={cn(
                          "transition-colors hover:bg-eccellere-cream/50",
                          client.id === "SAMPLE" && "opacity-50 italic"
                        )}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-eccellere-ink">{client.name}</p>
                          <p className="text-xs text-ink-light">{client.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-mid">{client.sector}</td>
                        <td className="px-6 py-4">
                          {client.approval === "PENDING" || client.approval === "BLOCKED" ? (
                            <span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", client.approval === "PENDING" ? "bg-eccellere-gold/10 text-eccellere-gold-deep" : "bg-eccellere-error/10 text-eccellere-error")}>
                              {client.approval === "PENDING" ? "Awaiting approval" : "Blocked"}
                            </span>
                          ) : (
                            <span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", statusColors[client.status] ?? "bg-ink-light/10 text-ink-light")}>
                              {client.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-mid">{client.plan}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-eccellere-ink">{client.revenue}</td>
                        <td className="px-6 py-4 text-right text-xs text-ink-light">{client.joined}</td>
                        <td className="px-4 py-4">
                          {client.id !== "SAMPLE" && (
                            <div className="flex justify-end gap-2 whitespace-nowrap">
                              {client.approval === "PENDING" && (
                                <button disabled={busyId === client.id} onClick={() => decide(client.id, "approve")} className="border border-eccellere-ink/25 bg-eccellere-ink px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-40">Approve</button>
                              )}
                              {client.approval === "BLOCKED" ? (
                                <button disabled={busyId === client.id} onClick={() => decide(client.id, "unblock")} className="border border-eccellere-ink/25 bg-white px-3 py-1.5 text-xs hover:bg-eccellere-cream disabled:opacity-40">Unblock</button>
                              ) : (
                                <button disabled={busyId === client.id} onClick={() => decide(client.id, "block")} className="border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40">Block</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && !isSampleOnly && (
                <div className="py-12 text-center text-sm text-ink-light">
                  No clients match your search.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
