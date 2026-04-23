import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// GET /api/marketplace/assets — public, returns all PUBLISHED assets
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const rawAssets = await prisma.asset.findMany({
    where: {
      status: "PUBLISHED" as never,
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
      { isFeatured: "desc" },
      { totalPurchases: "desc" },
      { createdAt: "desc" },
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
      updatedAt: true,
    },
  });

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
      previewItems: [] as string[],
    };
  });

  return NextResponse.json({ assets });
}
