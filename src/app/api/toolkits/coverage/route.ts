import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, guard } from "@/lib/toolkit/server";
import { scoreCatalogue } from "@/lib/toolkit/coverage";

export const dynamic = "force-dynamic";

/**
 * GET /api/toolkits/coverage?q=...
 * Read-only: suggests published marketplace kits that may already cover the topic.
 * Never writes to the catalogue, orders or payments.
 */
async function GET_(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 600);
  if (q.trim().length < 3) return NextResponse.json({ matches: [] });

  const items = await prisma.asset.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true, title: true, description: true, category: true, serviceDomain: true,
      targetSectors: true, tags: true, price: true, memberPrice: true,
    },
    take: 500,
  });
  return NextResponse.json({ matches: scoreCatalogue(q, items) });
}

export const GET = guard(GET_);
