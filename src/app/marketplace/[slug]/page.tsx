import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Download, Shield, Clock, FileText, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { assets as staticAssets, type Asset } from "@/lib/marketplace-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CATEGORY_DISPLAY: Record<string, { label: string; color: string }> = {
  AI_TOOLKIT:            { label: "Agentic AI",             color: "bg-eccellere-teal/20 text-eccellere-teal" },
  STRATEGY_FRAMEWORK:    { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
  OPERATIONS_TEMPLATE:   { label: "Process Transformation", color: "bg-blue-100 text-blue-700" },
  MSME_GROWTH_KIT:       { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
  FINANCIAL_MODEL:       { label: "Digital",                color: "bg-purple-100 text-purple-700" },
  HR_PEOPLE:             { label: "Organisation",           color: "bg-green-100 text-green-700" },
  CONSULTING_ENGAGEMENT: { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
  WEBINAR:               { label: "Digital",                color: "bg-blue-100 text-blue-700" },
  PLAYBOOK:              { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
  DIAGNOSTIC:            { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
  CALCULATOR:            { label: "Digital",                color: "bg-purple-100 text-purple-700" },
  CASE_STUDY:            { label: "Strategy",               color: "bg-eccellere-gold/20 text-eccellere-gold" },
};

async function getAsset(slug: string): Promise<Asset | null> {
  // Try DB first
  try {
    const a = await prisma.asset.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, description: true,
        category: true, serviceDomain: true, targetSectors: true,
        components: true, tags: true, price: true,
        averageRating: true, totalPurchases: true, isFeatured: true,
        updatedAt: true, status: true,
      },
    });
    if (a && a.status === "PUBLISHED") {
      const catInfo = CATEGORY_DISPLAY[a.category as string] ?? { label: a.serviceDomain, color: "bg-eccellere-gold/20 text-eccellere-gold" };
      const sectors = Array.isArray(a.targetSectors) && (a.targetSectors as unknown[]).length > 0
        ? (a.targetSectors as string[])
        : ["All Sectors"];
      const format = Array.isArray(a.components) && (a.components as unknown[]).length > 0
        ? (a.components as string[])[0]
        : "PDF";
      return {
        id: a.id,
        slug: a.slug,
        category: catInfo.label,
        categoryColor: catInfo.color,
        title: a.title,
        description: a.description,
        longDescription: a.description,
        includes: Array.isArray(a.tags) ? (a.tags as string[]) : [],
        format,
        price: a.price,
        rating: a.averageRating ?? 0,
        reviews: a.totalPurchases ?? 0,
        sectors,
        bestseller: a.isFeatured,
        lastUpdated: new Date(a.updatedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        previewItems: [],
      };
    }
  } catch {
    // DB unavailable — fall through to static
  }
  // Fall back to static data
  return staticAssets.find((a) => a.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const asset = await getAsset(slug);
  if (!asset) return {};
  return { title: asset.title, description: asset.description };
}

function formatPrice(p: number) {
  return "\u20b9" + p.toLocaleString("en-IN");
}

export default async function AssetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const asset = await getAsset(slug);
  if (!asset) notFound();

  const related = staticAssets
    .filter((a) => a.slug !== asset!.slug && (a.category === asset!.category || a.sectors.some((s) => asset!.sectors.includes(s))))
    .slice(0, 3);

  const discount = asset.originalPrice
    ? Math.round((1 - asset.price / asset.originalPrice) * 100)
    : null;

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        {/* Breadcrumb */}
        <div className="border-b border-eccellere-ink/5 bg-white">
          <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-2 px-6 text-sm text-ink-light">
            <Link href="/marketplace" className="flex items-center gap-1 hover:text-eccellere-gold transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Marketplace
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${asset.categoryColor}`}>{asset.category}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate text-eccellere-ink">{asset.title}</span>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Left: content */}
            <div>
              {/* Category + title */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2.5 py-1 text-xs font-medium ${asset.categoryColor}`}>
                  {asset.category}
                </span>
                {asset.bestseller && (
                  <span className="rounded bg-eccellere-gold text-white px-2.5 py-1 text-xs font-medium">
                    Bestseller
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-[clamp(24px,4vw,40px)] font-light text-eccellere-ink">
                {asset.title}
              </h1>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-ink-mid">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-eccellere-gold text-eccellere-gold" />
                  <strong className="text-eccellere-ink">{asset.rating}</strong>
                  <span className="text-ink-light">({asset.reviews} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-ink-light" />
                  {asset.format}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-ink-light" />
                  Updated {asset.lastUpdated}
                </span>
              </div>

              {/* Sectors */}
              <div className="mt-4 flex flex-wrap gap-2">
                {asset.sectors.map((s) => (
                  <span key={s} className="rounded-sm bg-eccellere-ink/5 px-2.5 py-1 text-xs text-ink-mid">
                    {s}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="mt-8 border-t border-eccellere-ink/5 pt-8">
                <h2 className="font-display text-xl font-light text-eccellere-ink">About this resource</h2>
                <p className="mt-4 text-sm leading-relaxed text-ink-mid">{asset.longDescription}</p>
              </div>

              {/* What's included */}
              <div className="mt-8 border-t border-eccellere-ink/5 pt-8">
                <h2 className="font-display text-xl font-light text-eccellere-ink">What&apos;s included</h2>
                <ul className="mt-4 space-y-3">
                  {asset.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-ink-mid">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-eccellere-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preview */}
              <div className="mt-8 border-t border-eccellere-ink/5 pt-8">
                <h2 className="font-display text-xl font-light text-eccellere-ink">Contents preview</h2>
                <div className="mt-4 space-y-2">
                  {asset.previewItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded bg-white p-3 text-sm text-ink-mid shadow-sm">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 text-xs font-medium text-eccellere-gold">
                        {i + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust signals */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-eccellere-ink/5 pt-8 sm:grid-cols-3">
                {[
                  { icon: Shield, label: "14-day money-back guarantee" },
                  { icon: Download, label: "Instant download after purchase" },
                  { icon: FileText, label: "India-specific content & context" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-ink-mid">
                    <Icon className="h-4 w-4 flex-shrink-0 text-eccellere-teal" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: purchase card */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-lg bg-white p-6 shadow-md">
                {/* Price */}
                <div className="flex items-end gap-3">
                  <span className="font-mono text-3xl font-light text-eccellere-ink">
                    {formatPrice(asset.price)}
                  </span>
                  {asset.originalPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-light line-through">{formatPrice(asset.originalPrice)}</span>
                      <span className="rounded bg-eccellere-teal/10 px-1.5 py-0.5 text-xs font-medium text-eccellere-teal">
                        {discount}% off
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1 text-xs text-ink-light">Inclusive of GST</div>

                <Button className="mt-5 w-full" size="lg">
                  Buy Now — {formatPrice(asset.price)}
                </Button>
                <Button variant="outline" className="mt-3 w-full" size="lg">
                  Preview Sample
                </Button>

                <div className="mt-5 space-y-2.5 border-t border-eccellere-ink/5 pt-5 text-xs text-ink-mid">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-eccellere-teal" />
                    14-day money-back guarantee
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-eccellere-teal" />
                    Instant access after purchase
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-eccellere-teal" />
                    {asset.format} format
                  </div>
                </div>

                <div className="mt-5 border-t border-eccellere-ink/5 pt-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-light">
                    Need a custom solution?
                  </p>
                  <p className="mt-1 text-xs text-ink-mid">
                    Talk to our team for bespoke consulting or group licensing.
                  </p>
                  <Link href="/contact" className="mt-2 block text-xs text-eccellere-gold hover:underline">
                    Book a discovery call →
                  </Link>
                </div>
              </div>

              {/* Rating breakdown */}
              <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-4xl font-light text-eccellere-ink">{asset.rating}</span>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= Math.round(asset.rating) ? "fill-eccellere-gold text-eccellere-gold" : "text-eccellere-ink/10"}`}
                        />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-light">{asset.reviews} verified reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related assets */}
          {related.length > 0 && (
            <div className="mt-16 border-t border-eccellere-ink/5 pt-12">
              <h2 className="font-display text-2xl font-light text-eccellere-ink">You may also like</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/marketplace/${r.slug}`}
                    className="group rounded-lg bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${r.categoryColor}`}>{r.category}</span>
                    <h3 className="mt-3 text-sm font-medium text-eccellere-ink group-hover:text-eccellere-gold transition-colors">
                      {r.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-ink-light">
                        <Star className="h-3.5 w-3.5 fill-eccellere-gold text-eccellere-gold" />
                        {r.rating}
                      </span>
                      <span className="font-mono text-sm font-medium text-eccellere-ink">
                        {formatPrice(r.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
