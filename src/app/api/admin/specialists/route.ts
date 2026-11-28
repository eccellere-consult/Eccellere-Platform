import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSpecialistReviewer, listStatus } from "@/lib/admin/specialistReview";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isSpecialistReviewer(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let specialists;
  try {
    specialists = await Promise.race([
      prisma.specialistProfile.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          headline: true,
          currentRole: true,
          organisation: true,
          serviceDomains: true,
          sectorExpertise: true,
          status: true,
          averageRating: true,
          totalAssignments: true,
          totalEarnings: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
          publishedAssets: {
            select: { id: true },
          },
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 5000)
      ),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/specialists] DB error:", message);
    return NextResponse.json(
      { error: "Service temporarily unavailable", detail: message },
      { status: 503 }
    );
  }

  const mapped = specialists.map((s) => {
    const domains = Array.isArray(s.serviceDomains) ? s.serviceDomains as string[] : [];
    const sectors = Array.isArray(s.sectorExpertise) ? s.sectorExpertise as string[] : [];

    return {
      id: s.id,
      name: s.user.name || s.user.email,
      email: s.user.email,
      expertise: domains.slice(0, 3).join(", ") || s.headline || s.currentRole || "—",
      sectors: sectors.slice(0, 3),
      status: listStatus(s.status),
      rawStatus: s.status,
      assets: s.publishedAssets.length,
      rating: s.averageRating && s.averageRating > 0 ? s.averageRating : null,
      earnings: s.totalEarnings > 0
        ? `₹${s.totalEarnings.toLocaleString("en-IN")}`
        : "₹0",
      joined: new Date(s.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
    };
  });

  return NextResponse.json({ specialists: mapped });
}

// Approve / ask for more information / reject now live on the review screen: POST /api/admin/specialists/[id].
