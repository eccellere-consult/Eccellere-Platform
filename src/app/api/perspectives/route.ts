import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.blogPost.findMany({
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
  });

  return NextResponse.json({ posts });
}