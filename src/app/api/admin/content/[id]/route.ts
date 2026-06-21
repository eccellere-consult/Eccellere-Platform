import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      authorName: true,
      excerpt: true,
      content: true,
      tags: true,
      status: true,
      scheduledAt: true,
      heroImage: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    category?: string;
    authorName?: string;
    excerpt?: string;
    content?: string;
    tags?: string;
    status?: "draft" | "published" | "scheduled";
    scheduledAt?: string | null;
    heroImage?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const title = (body.title || "").trim();
  const category = (body.category || "").trim();
  const authorName = (body.authorName || "Eccellere Team").trim();
  const excerpt = (body.excerpt || "").trim();
  const content = (body.content || "").trim();
  const status = body.status || "draft";
  const heroImage = body.heroImage || null;

  if (!title || !category || !content) {
    return NextResponse.json(
      { error: "Title, category, and content are required" },
      { status: 400 }
    );
  }

  if (status === "published" && !heroImage) {
    return NextResponse.json(
      {
        error:
          "Published posts require a hero image so they display at the top of the article and can be shared to LinkedIn.",
      },
      { status: 400 }
    );
  }

  const tags = (body.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const readingTime = Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 220));
  const scheduledAt =
    status === "scheduled" && body.scheduledAt ? new Date(body.scheduledAt) : null;

  const shouldSetPublishedAt = status === "published" && !existing.publishedAt;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      excerpt: excerpt || null,
      content,
      category,
      tags,
      authorName,
      heroImage,
      status,
      scheduledAt,
      publishedAt: status === "published" ? (shouldSetPublishedAt ? new Date() : existing.publishedAt) : null,
      readingTime,
      metaTitle: title,
      metaDescription: excerpt || content.slice(0, 155),
      primaryKeyword: tags[0] || null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ post });
}
