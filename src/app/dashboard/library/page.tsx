"use client";

import { useState } from "react";
import { Search, Download, Star, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Strategy", "Supply Chain", "Digital", "Finance", "HR & Talent", "Process"];

const assets = [
  {
    id: "1",
    title: "MSME Growth Strategy Playbook",
    category: "Strategy",
    specialist: "Dr. Priya Malhotra",
    rating: 4.8,
    reviews: 42,
    purchased: "Apr 10, 2026",
    format: "PDF",
    size: "3.2 MB",
    description: "A comprehensive 80-page playbook covering growth levers for manufacturing and retail MSMEs.",
    orderId: "ORD-2041",
  },
  {
    id: "2",
    title: "Supply Chain Risk Assessment Tool",
    category: "Supply Chain",
    specialist: "Vikram Nair",
    rating: 4.9,
    reviews: 61,
    purchased: "Apr 6, 2026",
    format: "Excel",
    size: "1.8 MB",
    description: "Interactive Excel model to map, score, and mitigate supply chain disruption risks.",
    orderId: "ORD-2038",
  },
  {
    id: "3",
    title: "Retail Analytics Dashboard Template",
    category: "Digital",
    specialist: "Ananya Krishnan",
    rating: 4.6,
    reviews: 29,
    purchased: "Mar 28, 2026",
    format: "Excel",
    size: "2.1 MB",
    description: "Pre-built Excel dashboard with pivot tables for retail chain performance analysis.",
    orderId: "ORD-2031",
  },
  {
    id: "4",
    title: "AI Readiness Benchmark Report",
    category: "Digital",
    specialist: "Rohan Desai",
    rating: 4.7,
    reviews: 18,
    purchased: "Mar 14, 2026",
    format: "PDF",
    size: "4.5 MB",
    description: "Industry benchmark data covering AI adoption across 400+ Indian MSMEs.",
    orderId: "ORD-2024",
  },
  {
    id: "5",
    title: "Working Capital Optimisation Framework",
    category: "Finance",
    specialist: "Meera Iyer",
    rating: 4.8,
    reviews: 35,
    purchased: "Feb 22, 2026",
    format: "PDF",
    size: "2.7 MB",
    description: "Step-by-step framework to reduce cash conversion cycle by 20–35 days.",
    orderId: "ORD-1988",
  },
  {
    id: "6",
    title: "HR Policy Manual Template — Manufacturing",
    category: "HR & Talent",
    specialist: "Sanjay Kulkarni",
    rating: 4.5,
    reviews: 22,
    purchased: "Feb 10, 2026",
    format: "Word",
    size: "820 KB",
    description: "Fully editable HR policy manual aligned to Indian labour laws for manufacturers.",
    orderId: "ORD-1964",
  },
  {
    id: "7",
    title: "SOP Mapping & Process Documentation Kit",
    category: "Process",
    specialist: "Dr. Priya Malhotra",
    rating: 4.7,
    reviews: 47,
    purchased: "Jan 30, 2026",
    format: "ZIP",
    size: "5.1 MB",
    description: "Templates and guides for documenting standard operating procedures across ops, finance, and HR.",
    orderId: "ORD-1941",
  },
  {
    id: "8",
    title: "Demand Forecasting Model — Consumer Goods",
    category: "Supply Chain",
    specialist: "Vikram Nair",
    rating: 4.9,
    reviews: 53,
    purchased: "Jan 15, 2026",
    format: "Excel",
    size: "2.4 MB",
    description: "Statistical demand forecasting model with seasonal adjustment for FMCG and D2C brands.",
    orderId: "ORD-1912",
  },
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.specialist.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">My Library</h1>
        <p className="mt-1 text-sm text-ink-light">
          {assets.length} purchased assets — download anytime
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
          <input
            type="text"
            placeholder="Search assets or specialists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-eccellere-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="h-4 w-4 flex-shrink-0 text-ink-light" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat
                  ? "bg-eccellere-gold text-white"
                  : "bg-white text-ink-light hover:text-eccellere-ink"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-ink-light">No assets match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-sm bg-eccellere-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-light">
                  {asset.category}
                </span>
                <span className="text-[10px] text-ink-light">{asset.format} · {asset.size}</span>
              </div>
              <h3 className="mt-3 text-sm font-medium text-eccellere-ink">{asset.title}</h3>
              <p className="mt-1 text-xs text-ink-light line-clamp-2">{asset.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-light">
                <span>by {asset.specialist}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                  {asset.rating} ({asset.reviews})
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-light/60">Purchased {asset.purchased}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex flex-1 items-center gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
