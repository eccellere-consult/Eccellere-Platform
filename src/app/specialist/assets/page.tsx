"use client";

import Link from "next/link";
import { Package, Eye, Download, Star, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const assets = [
  { name: "MSME Growth Strategy Playbook", status: "published", sales: 187, revenue: "₹4,67,313", rating: 4.9, views: 2340 },
  { name: "Supply Chain Resilience Framework", status: "published", sales: 76, revenue: "₹2,27,924", rating: 4.7, views: 1120 },
  { name: "AI Implementation Roadmap for Manufacturing", status: "published", sales: 42, revenue: "₹1,46,958", rating: 4.8, views: 890 },
  { name: "Digital Transformation Playbook v2", status: "pending", sales: 0, revenue: "—", rating: null, views: 0 },
  { name: "Retail Analytics Dashboard Template", status: "draft", sales: 0, revenue: "—", rating: null, views: 0 },
];

export default function SpecialistAssetsPage() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Assets</p>
          <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">My Assets</h1>
        </div>
        <Button asChild>
          <Link href="/specialist/assets/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit New
          </Link>
        </Button>
      </div>

      <div className="mt-8 rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4">
          <p className="text-sm font-medium text-eccellere-ink">{assets.length} assets</p>
        </div>
        <div className="divide-y divide-eccellere-ink/5">
          {assets.map((asset) => (
            <div key={asset.name} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-eccellere-ink">{asset.name}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className={cn(
                    "rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    asset.status === "published" && "bg-eccellere-teal/10 text-eccellere-teal",
                    asset.status === "pending" && "bg-eccellere-gold/10 text-eccellere-gold",
                    asset.status === "draft" && "bg-ink-light/10 text-ink-light"
                  )}>{asset.status}</span>
                  {asset.rating && (
                    <span className="flex items-center gap-1 text-xs text-ink-light">
                      <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                      {asset.rating}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-ink-light">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{asset.views}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{asset.sales}</span>
                <span className="font-mono text-sm text-eccellere-gold">{asset.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
