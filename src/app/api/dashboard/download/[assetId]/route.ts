import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// GET /api/dashboard/download/[assetId]
// Returns the asset file — only if the logged-in user has a PAID order for it.
// Redirects to the public file URL (for files stored in /public/uploads/assets/).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await params;

  // Verify the user has a paid order for this asset
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      orders: {
        where: {
          status: "PAID",
          items: { some: { assetId } },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.orders.length === 0) {
    return NextResponse.json({ error: "You have not purchased this asset" }, { status: 403 });
  }

  // Fetch the asset's file URLs
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { title: true, fileUrls: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;

  if (!fileUrl) {
    return NextResponse.json(
      { error: "No file attached to this asset yet. Please contact support." },
      { status: 404 }
    );
  }

  // For files stored in /public/uploads/assets/ — read & stream directly
  // so they are protected (not accessible without this auth check).
  if (fileUrl.startsWith("/uploads/")) {
    const relativePath = fileUrl.replace(/^\//, "");
    const absPath = path.join(process.cwd(), "public", relativePath);

    // Security: prevent path traversal
    const uploadsBase = path.join(process.cwd(), "public", "uploads");
    if (!absPath.startsWith(uploadsBase)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (!fs.existsSync(absPath)) {
      return NextResponse.json(
        { error: "File not found on server. Please contact support." },
        { status: 404 }
      );
    }

    const stat = fs.statSync(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".pdf":  "application/pdf",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls":  "application/vnd.ms-excel",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc":  "application/msword",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".ppt":  "application/vnd.ms-powerpoint",
      ".zip":  "application/zip",
    };
    const contentType = contentTypeMap[ext] ?? "application/octet-stream";

    // Sanitize the filename for the Content-Disposition header
    const safeTitle = asset.title.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_");
    const filename = `${safeTitle}${ext}`;

    const fileBuffer = fs.readFileSync(absPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // For external URLs (S3/CDN) — redirect to the URL
  return NextResponse.redirect(fileUrl);
}
