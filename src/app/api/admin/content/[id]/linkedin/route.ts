import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shareBlogPostToLinkedIn } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      heroImage: true,
      tags: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const linkedin = await shareBlogPostToLinkedIn({
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    category: post.category,
    heroImage: post.heroImage,
    tags: post.tags,
  });

  if (linkedin.status === "failed") {
    return NextResponse.json({ error: linkedin.reason, linkedin }, { status: 400 });
  }

  return NextResponse.json({ linkedin });
}
