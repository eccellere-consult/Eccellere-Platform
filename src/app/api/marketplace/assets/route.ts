import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache public marketplace asset list for 60 s on the server to avoid hammering
// the DB on every page load (Hostinger shared DB has a tiny connection pool).
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

// GET /api/marketplace/assets — public, returns all PUBLISHED or APPROVED assets
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  // Hard 5-second timeout — prevents a stale DB connection from hanging the request
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("DB timeout")), 5000)
  );

  let rawAssets;
  try {
    rawAssets = await Promise.race([
      prisma.asset.findMany({
        where: {
          status: { in: ["PUBLISHED", "APPROVED"] as never[] },
          ...(search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: [
          { createdAt: "desc" },
          { isFeatured: "desc" },
          { totalPurchases: "desc" },
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          serviceDomain: true,
          targetSectors: true,
          components: true,
          tags: true,
          price: true,
          averageRating: true,
          totalPurchases: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      timeoutPromise,
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[marketplace/assets] DB error:", message);
    return NextResponse.json(
      { assets: [], dbError: message },
      { status: 200 } // 200 so client can read the body and show a warning
    );
  }

  const assets = rawAssets.map((a) => {
    const catInfo =
      CATEGORY_DISPLAY[a.category as string] ?? {
        label: a.serviceDomain,
        color: "bg-eccellere-gold/20 text-eccellere-gold",
      };
    const sectors = Array.isArray(a.targetSectors) && (a.targetSectors as unknown[]).length > 0
      ? (a.targetSectors as string[])
      : ["All Sectors"];
    const format =
      Array.isArray(a.components) && (a.components as unknown[]).length > 0
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
      lastUpdated: new Date(a.updatedAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      createdAt: new Date(a.createdAt).toISOString(),
      previewItems: [] as string[],
    };
  });

  return NextResponse.json(
    { assets },
    {
      headers: {
        // Browsers must NOT cache this response — they should always ask the
        // server (or the upstream CDN). The CDN/proxy then serves a fresh
        // copy for 60s and stale for 5min while revalidating in the
        // background. This prevents the "old screens visible" symptom while
        // keeping origin DB pressure low.
        "Cache-Control": search
          ? "private, no-store"
          : "private, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
