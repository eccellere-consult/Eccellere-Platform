import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Clock, FileText, ChevronRight, ArrowLeft, Check, Download } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { assets as staticAssets, type Asset } from "@/lib/marketplace-data";
import { prisma } from "@/lib/prisma";
import { PurchaseCard } from "@/components/marketplace/PurchaseCard";

// Cache each slug page for 5 minutes; revalidate in background.
// Avoids a live DB round-trip on every request which caused 503 hangs.
export const revalidate = 300;

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

/** Wraps a promise with a hard timeout — prevents DB hangs from stalling the page */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function getAsset(slug: string): Promise<Asset | null> {
  // Try DB first (4s hard timeout — fail fast rather than hang)
  try {
    const a = await withTimeout(prisma.asset.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, title: true, description: true,
        aboutResource: true, whatIncluded: true, contentsPreview: true, documentExcerpt: true,
        category: true, serviceDomain: true, targetSectors: true,
        components: true, tags: true, price: true,
        averageRating: true, totalPurchases: true, isFeatured: true,
        updatedAt: true, status: true,
      },
    }), 4000);
    if (a && a.status === "PUBLISHED") {
      const catInfo = CATEGORY_DISPLAY[a.category as string] ?? { label: a.serviceDomain, color: "bg-eccellere-gold/20 text-eccellere-gold" };
      const sectors = Array.isArray(a.targetSectors) && (a.targetSectors as unknown[]).length > 0
        ? (a.targetSectors as string[])
        : ["All Sectors"];
      const format = Array.isArray(a.components) && (a.components as unknown[]).length > 0
        ? (a.components as string[])[0]
        : "PDF";

      // Prefer structured fields; fall back to tags for includes, empty for preview
      const aboutResource = typeof a.aboutResource === "string" && a.aboutResource.trim()
        ? a.aboutResource
        : a.description;
      const includes = Array.isArray(a.whatIncluded) && (a.whatIncluded as unknown[]).length > 0
        ? (a.whatIncluded as string[])
        : Array.isArray(a.tags) ? (a.tags as string[]) : [];
      const dbContentsPreview = Array.isArray(a.contentsPreview) && (a.contentsPreview as unknown[]).length > 0
        ? (a.contentsPreview as string[])
        : [];

      return {
        id: a.id,
        slug: a.slug,
        category: catInfo.label,
        categoryColor: catInfo.color,
        title: a.title,
        description: a.description,
        longDescription: aboutResource,
        aboutResource,
        includes,
        contentsPreview: dbContentsPreview,
        format,
        price: a.price,
        rating: a.averageRating ?? 0,
        reviews: a.totalPurchases ?? 0,
        sectors,
        bestseller: a.isFeatured,
        lastUpdated: new Date(a.updatedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        previewItems: dbContentsPreview,
        documentExcerpt: typeof a.documentExcerpt === "string" && a.documentExcerpt.trim() ? a.documentExcerpt.trim() : undefined,
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

              {/* Preview — bullet points entered by the specialist during submission */}
              {asset.previewItems && asset.previewItems.length > 0 && (
                <div className="mt-8 border-t border-eccellere-ink/5 pt-8">
                  <h2 className="font-display text-xl font-light text-eccellere-ink">Contents preview</h2>
                  <ul className="mt-4 space-y-3">
                    {asset.previewItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-ink-mid">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-eccellere-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust signals */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-eccellere-ink/5 pt-8">
                {[
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
              <PurchaseCard asset={asset!} discount={discount} />
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
