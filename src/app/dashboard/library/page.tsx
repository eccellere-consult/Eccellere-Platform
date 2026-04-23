"use client";

import { useState, useEffect } from "react";
import { Search, Download, Star, Eye, Filter, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES = ["All", "Strategy", "Supply Chain", "Digital", "Finance", "HR & Talent", "Process"];

type LibraryAsset = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  format: string;
  rating: number;
  orderNumber: string;
  purchasedAt: string;
  lastUpdated: string;
  hasFile: boolean;
  downloadEnabled: boolean;
  downloadUrl: string;
};

export default function LibraryPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetch("/api/dashboard/library")
      .then((r) => r.json())
      .then((data) => setAssets(data.assets ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assets.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
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
          {loading ? "Loading..." : `${assets.length} purchased asset${assets.length !== 1 ? "s" : ""} — download anytime`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
          <input
            type="text"
            placeholder="Search assets..."
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

      {/* Empty state — no purchases yet */}
      {!loading && assets.length === 0 && (
        <div className="rounded-lg bg-white py-16 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-ink-light/30" />
          <p className="mt-3 text-sm font-medium text-eccellere-ink">Your library is empty</p>
          <p className="mt-1 text-xs text-ink-light">Purchase assets from the marketplace to see them here.</p>
          <Link
            href="/marketplace"
            className="mt-4 inline-block rounded bg-eccellere-gold px-5 py-2 text-sm font-medium text-white hover:bg-eccellere-gold/90"
          >
            Browse Marketplace
          </Link>
        </div>
      )}

      {/* No search results */}
      {!loading && assets.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-ink-light">No assets match your search.</p>
        </div>
      )}

      {/* Asset Grid */}
      {filtered.length > 0 && (
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
                <span className="text-[10px] text-ink-light">{asset.format}</span>
              </div>
              <h3 className="mt-3 text-sm font-medium text-eccellere-ink">{asset.title}</h3>
              <p className="mt-1 text-xs text-ink-light line-clamp-2">{asset.description}</p>
              {asset.rating > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-ink-light">
                  <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                  {asset.rating.toFixed(1)}
                </div>
              )}
              <p className="mt-1 text-[11px] text-ink-light/60">
                Purchased {asset.purchasedAt} · {asset.orderNumber}
              </p>
              <div className="mt-4 flex gap-2">
                {asset.hasFile && asset.downloadEnabled ? (
                  <a
                    href={asset.downloadUrl}
                    download
                    className="flex flex-1 items-center justify-center gap-1.5 rounded bg-eccellere-gold px-3 py-1.5 text-xs font-medium text-white hover:bg-eccellere-gold/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <span
                    title={
                      !asset.hasFile
                        ? "The specialist has not uploaded the file yet"
                        : "Downloads for this asset are currently disabled"
                    }
                    className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded border border-eccellere-ink/10 bg-eccellere-ink/5 px-3 py-1.5 text-xs text-ink-light"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {!asset.hasFile ? "Pending upload" : "Downloads disabled"}
                  </span>
                )}
                <a
                  href={asset.hasFile && asset.downloadEnabled ? asset.downloadUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors",
                    asset.hasFile && asset.downloadEnabled
                      ? "border-eccellere-ink/20 text-eccellere-ink hover:border-eccellere-gold hover:text-eccellere-gold"
                      : "cursor-not-allowed border-eccellere-ink/10 text-ink-light/40"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
