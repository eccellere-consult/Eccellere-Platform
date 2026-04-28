import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDbTimeout } from "@/lib/db-timeout";

// GET /api/dashboard/library — returns assets the logged-in user has purchased
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          clientProfile: { select: { id: true } },
          orders: {
            where: { status: "PAID" },
            select: {
              orderNumber: true,
              createdAt: true,
              items: {
                select: {
                  asset: {
                    select: {
                      id: true,
                      slug: true,
                      title: true,
                      description: true,
                      category: true,
                      serviceDomain: true,
                      components: true,
                      fileUrls: true,
                      downloadEnabled: true,
                      averageRating: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      6000,
      "library"
    );

    if (!user) {
      return NextResponse.json({ assets: [] });
    }

    // Deduplicate: a user could have bought the same asset twice (edge case)
    const seen = new Set<string>();
    const assets = user.orders
      .flatMap((o) =>
        o.items.map((item) => ({
          asset: item.asset,
          orderNumber: o.orderNumber,
          purchasedAt: o.createdAt,
        }))
      )
      .filter(({ asset }) => {
        if (seen.has(asset.id)) return false;
        seen.add(asset.id);
        return true;
      })
      .map(({ asset, orderNumber, purchasedAt }) => {
        const format =
          Array.isArray(asset.components) && (asset.components as unknown[]).length > 0
            ? (asset.components as string[])[0]
            : "PDF";
        const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
        return {
          id: asset.id,
          slug: asset.slug,
          title: asset.title,
          description: asset.description,
          category: asset.serviceDomain ?? asset.category ?? "General",
          format,
          rating: asset.averageRating ?? 0,
          orderNumber,
          purchasedAt: new Date(purchasedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          lastUpdated: new Date(asset.updatedAt).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
          hasFile: fileUrls.length > 0,
          downloadEnabled: (asset as unknown as { downloadEnabled: boolean }).downloadEnabled ?? true,
          downloadUrl: `/api/dashboard/download/${asset.id}`,
          filePublicPath: fileUrls[0] ?? null,
        };
      });

    return NextResponse.json({ assets });
  } catch (err) {
    console.error("[dashboard/library] DB error:", err);
    return NextResponse.json({ assets: [], dbError: String(err) });
  }
}
