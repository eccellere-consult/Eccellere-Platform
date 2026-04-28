import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { withDbTimeout } from "@/lib/db-timeout";
import { type Asset } from "@/lib/marketplace-data";
import { FeaturedMarketplaceCard } from "./FeaturedMarketplaceCard";

// Re-render at most once per minute. Avoids hitting the DB on every visitor.
export const revalidate = 60;

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  AI_TOOLKIT:            { label: "Agentic AI",              color: "bg-eccellere-teal/20 text-eccellere-teal" },
  STRATEGY_FRAMEWORK:    { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
  OPERATIONS_TEMPLATE:   { label: "Process Transformation",  color: "bg-blue-100 text-blue-700" },
  MSME_GROWTH_KIT:       { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
  FINANCIAL_MODEL:       { label: "Digital",                 color: "bg-purple-100 text-purple-700" },
  HR_PEOPLE:             { label: "Organisation",            color: "bg-green-100 text-green-700" },
  CONSULTING_ENGAGEMENT: { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
  WEBINAR:               { label: "Digital",                 color: "bg-blue-100 text-blue-700" },
  PLAYBOOK:              { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
  DIAGNOSTIC:            { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
  CALCULATOR:            { label: "Digital",                 color: "bg-purple-100 text-purple-700" },
  CASE_STUDY:            { label: "Strategy",                color: "bg-eccellere-gold/20 text-eccellere-gold" },
};

async function getFeaturedAssets(): Promise<Asset[]> {
  try {
    const rows = await withDbTimeout(
      prisma.asset.findMany({
        where: { status: { in: ["PUBLISHED", "APPROVED"] as never[] } },
        orderBy: [
          { createdAt: "desc" },
          { isFeatured: "desc" },
          { totalPurchases: "desc" },
        ],
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          serviceDomain: true,
          components: true,
          price: true,
          averageRating: true,
        },
      }),
      4000,
      "home.featured"
    );

    return rows.map((a) => {
      const catInfo =
        CATEGORY_DISPLAY[a.category as string] ?? {
          label: a.serviceDomain,
          color: "bg-eccellere-gold/20 text-eccellere-gold",
        };
      const format =
        Array.isArray(a.components) && (a.components as unknown[]).length > 0
          ? (a.components as string[])[0]
          : "PDF";
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        category: catInfo.label,
        categoryColor: catInfo.color,
        format,
        price: a.price,
        rating: a.averageRating ?? 0,
      } as unknown as Asset;
    });
  } catch {
    return [];
  }
}

export async function FeaturedMarketplace() {
  const assets = await getFeaturedAssets();

  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Marketplace
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Proven frameworks,{" "}
          <span className="italic">newest first</span>
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset, i) => (
            <FeaturedMarketplaceCard
              key={asset.id ?? asset.slug}
              asset={asset}
              index={i}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="ghost">
            <Link href="/marketplace">
              Browse all 200+ assets in the Marketplace →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
