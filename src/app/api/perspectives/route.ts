import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDbTimeout } from "@/lib/db-timeout";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await withDbTimeout(
      prisma.blogPost.findMany({
        where: { status: { in: ["published", "scheduled"] } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          authorName: true,
          authorBio: true,
          heroImage: true,
          readingTime: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      6000,
      "perspectives.list"
    );

    return NextResponse.json({ posts });
  } catch {
    // Keep the perspectives page stable by falling back to static content.
    return NextResponse.json({ posts: [] });
  }
}