import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_ADMIN";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      authorName: true,
      category: true,
      status: true,
      heroImage: true,
      readingTime: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const tags = (body.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const baseSlug = slugify(title);
  if (!baseSlug) {
    return NextResponse.json({ error: "Unable to generate slug from title" }, { status: 400 });
  }

  let slug = baseSlug;
  let n = 1;
  while (true) {
    const exists = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) break;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const readingTime = Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 220));

  const publishedAt = status === "published" ? new Date() : null;
  const scheduledAt =
    status === "scheduled" && body.scheduledAt ? new Date(body.scheduledAt) : null;

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt: excerpt || null,
      content,
      category,
      tags,
      authorName,
      heroImage,
      status,
      publishedAt,
      scheduledAt,
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

  return NextResponse.json({ post }, { status: 201 });
}
