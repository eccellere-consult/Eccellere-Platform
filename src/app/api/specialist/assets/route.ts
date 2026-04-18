import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const CATEGORY_MAP: Record<string, string> = {
  "Strategy & Planning": "STRATEGY_FRAMEWORK",
  "Process Transformation": "OPERATIONS_TEMPLATE",
  "Financial Management": "FINANCIAL_MODEL",
  "Digital & Technology": "AI_TOOLKIT",
  "Organisation Design": "HR_PEOPLE",
  "Agentic AI": "AI_TOOLKIT",
  "Sales & Marketing": "MSME_GROWTH_KIT",
  "Supply Chain": "OPERATIONS_TEMPLATE",
  "HR & Talent": "HR_PEOPLE",
  Other: "PLAYBOOK",
};

// Allowed MIME types for uploaded asset files
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "specialist") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const title = (formData.get("title") as string | null)?.trim();
  const tagline = (formData.get("tagline") as string | null)?.trim();
  const category = (formData.get("category") as string | null)?.trim();
  const format = (formData.get("format") as string | null)?.trim();
  const price = (formData.get("price") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const targetAudience = (formData.get("targetAudience") as string | null)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string | null) || "[]";
  const file = formData.get("file") as File | null;

  // Validate required fields
  if (!title || !tagline || !category || !format || !price || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const priceNum = parseInt(price, 10);
  if (isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(tagsRaw);
    if (!Array.isArray(tags)) tags = [];
  } catch {
    tags = [];
  }

  // Handle file upload
  let fileUrl = "";
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename — strip any path traversal characters
    const safeName = file.name
      .replace(/[^\w.\-]/g, "_")
      .replace(/\.{2,}/g, "_")
      .slice(0, 200);
    const uniqueName = `${Date.now()}-${safeName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "assets");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, uniqueName), buffer);

    fileUrl = `/uploads/assets/${uniqueName}`;
  }

  // Get the specialist profile linked to the session user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { specialistProfile: true },
  });

  if (!user?.specialistProfile) {
    return NextResponse.json({ error: "Specialist profile not found" }, { status: 404 });
  }

  const slug = `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)}-${Date.now()}`;

  const asset = await prisma.asset.create({
    data: {
      slug,
      title,
      description,
      category: (CATEGORY_MAP[category] ?? "PLAYBOOK") as never,
      serviceDomain: category,
      targetSectors: [],
      complexityLevel: "Intermediate",
      tags,
      targetAudience,
      price: priceNum,
      components: [format],
      fileUrls: fileUrl ? [fileUrl] : [],
      previewImages: [],
      status: "SUBMITTED",
      authorId: user.specialistProfile.id,
    },
  });

  return NextResponse.json({ success: true, assetId: asset.id });
}
