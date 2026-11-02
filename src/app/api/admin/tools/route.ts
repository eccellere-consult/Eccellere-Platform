import { NextResponse } from "next/server";
import { prismaRepo } from "@/lib/tools/prismaRepo";
import { MARKET_CATEGORIES } from "@/lib/tools/service";
import { aiReady, readAuth, toolsGuard } from "@/lib/tools/server";

export const dynamic = "force-dynamic";

/** GET /api/admin/tools - every tool in the catalogue (all statuses) with its quality summary, for the admin list. */
export const GET = toolsGuard(async () => {
  const auth = await readAuth();
  if (auth.error) return auth.error;
  const tools = await prismaRepo.listTools();
  return NextResponse.json({
    categories: MARKET_CATEGORIES,
    aiReady: await aiReady(),
    tools: tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      category: t.category,
      groupName: t.groupName,
      status: t.status,
      errors: t.quality?.errors.length ?? 0,
      warnings: t.quality?.warnings.length ?? 0,
      standards: t.quality?.standards ?? null,
      reviewedAt: t.reviewedAt,
      publishedAt: t.publishedAt,
      updatedAt: t.updatedAt,
    })),
  });
});
