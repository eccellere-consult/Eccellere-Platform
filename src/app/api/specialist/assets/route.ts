import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { getUploadsDir } from "@/lib/uploads";
import { ensurePreviewDocx } from "@/lib/preview-docx";

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

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB — conservative for Hostinger shared hosting

// ─── Shared upload helper ─────────────────────────────────────────────────────
async function saveUploadedFile(file: File): Promise<string> {
  const safeName = file.name
    .replace(/[^\w.\-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(0, 200);
  const uniqueName = `${Date.now()}-${safeName}`;

  // Uploads dir — UPLOADS_DIR env var (production) or <APP_ROOT>/public/uploads (dev)
  const uploadDir = path.join(getUploadsDir(), "assets");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  const destPath = path.join(uploadDir, uniqueName);

  const nodeReadable = Readable.fromWeb(
    file.stream() as import("stream/web").ReadableStream
  );
  const writeStream = createWriteStream(destPath);
  await pipeline(nodeReadable, writeStream);

  // For .docx uploads, pre-generate a sibling preview file truncated to the
  // first 5 pages. Failure here must not block the upload — it's purely a
  // marketing/preview optimisation.
  if (path.extname(destPath).toLowerCase() === ".docx") {
    try {
      await ensurePreviewDocx(destPath, 5);
    } catch (err) {
      console.error("[saveUploadedFile] preview generation failed:", err);
    }
  }

  return `/uploads/assets/${uniqueName}`;
}

// ─── GET /api/specialist/assets — list the session specialist's own assets ────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { specialistProfile: { select: { id: true } } },
  });

  if (!user?.specialistProfile) {
    return NextResponse.json({ assets: [] });
  }

  const assets = await prisma.asset.findMany({
    where: { authorId: user.specialistProfile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      components: true,
      fileUrls: true,
      totalPurchases: true,
      totalRevenue: true,
      totalViews: true,
      averageRating: true,
      createdAt: true,
      serviceDomain: true,
      targetAudience: true,
      tags: true,
      aboutResource: true,
      whatIncluded: true,
      contentsPreview: true,
    },
  });

  return NextResponse.json({ assets });
}

// ─── PATCH /api/specialist/assets — attach/replace the file on an existing asset
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const assetId = (formData.get("assetId") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!assetId || !file) {
    return NextResponse.json({ error: "assetId and file are required" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Verify the asset belongs to this specialist
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { specialistProfile: { select: { id: true } } },
  });
  if (!user?.specialistProfile) {
    return NextResponse.json({ error: "Specialist profile not found" }, { status: 404 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, authorId: user.specialistProfile.id },
    select: { id: true },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found or not owned by you" }, { status: 404 });
  }

  const fileUrl = await saveUploadedFile(file);

  await prisma.asset.update({
    where: { id: assetId },
    data: { fileUrls: [fileUrl] },
  });

  return NextResponse.json({ success: true, fileUrl });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")) {
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
  const aboutResource = (formData.get("aboutResource") as string | null)?.trim() || null;
  const whatIncludedRaw = (formData.get("whatIncluded") as string | null) || "[]";
  const contentsPreviewRaw = (formData.get("contentsPreview") as string | null) || "[]";
  const targetAudience = (formData.get("targetAudience") as string | null)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string | null) || "[]";
  const documentExcerpt = (formData.get("documentExcerpt") as string | null)?.trim() || null;
  const file = formData.get("file") as File | null;

  // Validate required fields
  if (!title || !tagline || !category || !format || !price || !aboutResource) {
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

  let whatIncluded: string[] = [];
  try {
    whatIncluded = JSON.parse(whatIncludedRaw);
    if (!Array.isArray(whatIncluded)) whatIncluded = [];
  } catch {
    whatIncluded = [];
  }

  let contentsPreview: string[] = [];
  try {
    contentsPreview = JSON.parse(contentsPreviewRaw);
    if (!Array.isArray(contentsPreview)) contentsPreview = [];
  } catch {
    contentsPreview = [];
  }

  // Handle file upload
  let fileUrl = "";
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
    fileUrl = await saveUploadedFile(file);
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
      description: aboutResource,
      aboutResource,
      whatIncluded,
      contentsPreview,
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
      documentExcerpt,
      status: "SUBMITTED",
      authorId: user.specialistProfile.id,
    },
  });

  return NextResponse.json({ success: true, assetId: asset.id });
}

// ─── PUT /api/specialist/assets — edit metadata on an existing asset ──────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== "SPECIALIST" && session.user?.role !== "SPECIALIST_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assetId = (body.assetId as string | undefined)?.trim();
  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { specialistProfile: { select: { id: true } } },
  });
  if (!user?.specialistProfile) {
    return NextResponse.json({ error: "Specialist profile not found" }, { status: 404 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, authorId: user.specialistProfile.id },
    select: { id: true, status: true },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found or not owned by you" }, { status: 404 });
  }

  // ── Action: recall (PUBLISHED → RECALLED) or resubmit (RECALLED → SUBMITTED) ──
  if (body.action === "recall") {
    if (asset.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Only published assets can be recalled." }, { status: 403 });
    }
    await prisma.asset.update({ where: { id: assetId }, data: { status: "RECALLED" } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "resubmit") {
    if (asset.status !== "RECALLED") {
      return NextResponse.json({ error: "Only recalled assets can be re-submitted." }, { status: 403 });
    }
    await prisma.asset.update({ where: { id: assetId }, data: { status: "SUBMITTED" } });
    return NextResponse.json({ success: true });
  }

  // Only allow field edits while asset is DRAFT, SUBMITTED, REJECTED, or RECALLED
  const editableStatuses = ["DRAFT", "SUBMITTED", "REJECTED", "RECALLED"];
  if (!editableStatuses.includes(asset.status as string)) {
    return NextResponse.json(
      { error: "This asset cannot be edited in its current status. Recall it first if it is published." },
      { status: 403 }
    );
  }

  // Build update payload from allowed fields only
  const updateData: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    updateData.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.tagline === "string") {
    updateData.description = body.tagline.trim().slice(0, 120); // tagline stored in description for backward compat
  }
  if (typeof body.price === "number" && body.price >= 0) {
    updateData.price = Math.round(body.price);
  }
  if (typeof body.aboutResource === "string") {
    updateData.aboutResource = body.aboutResource.trim();
    updateData.description = body.aboutResource.trim(); // keep description in sync
  }
  if (Array.isArray(body.whatIncluded)) {
    updateData.whatIncluded = (body.whatIncluded as unknown[])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 10);
  }
  if (Array.isArray(body.contentsPreview)) {
    updateData.contentsPreview = (body.contentsPreview as unknown[])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 10);
  }
  if (typeof body.targetAudience === "string") {
    updateData.targetAudience = body.targetAudience.trim().slice(0, 200);
  }
  if (Array.isArray(body.tags)) {
    updateData.tags = (body.tags as unknown[])
      .filter((s): s is string => typeof s === "string")
      .slice(0, 8);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await prisma.asset.update({ where: { id: assetId }, data: updateData });

  return NextResponse.json({ success: true });
}
