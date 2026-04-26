import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// GET /api/dashboard/view/[assetId]
// Streams the purchased asset file for inline browser viewing (not forced download).
// Identical auth logic to download route; differs only in Content-Disposition header.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await params;

  const dbTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("DB timeout")), 8000)
  );

  let user: { id: string; orders: { id: string }[] } | null;
  let asset: { title: string; fileUrls: unknown } | null;

  try {
    [user, asset] = await Promise.race([
      Promise.all([
        prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            orders: {
              where: { status: "PAID", items: { some: { assetId } } },
              select: { id: true },
              take: 1,
            },
          },
        }),
        prisma.asset.findUnique({
          where: { id: assetId },
          select: { title: true, fileUrls: true },
        }),
      ]),
      dbTimeout,
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.orders.length === 0) {
    return NextResponse.json({ error: "You have not purchased this asset" }, { status: 403 });
  }
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;

  if (!fileUrl) {
    return NextResponse.json(
      { error: "No file is attached to this asset yet. Please contact support." },
      { status: 404 }
    );
  }

  // ── Files stored in /public/uploads/ (local / Hostinger disk) ──────────────
  if (fileUrl.startsWith("/uploads/")) {
    const relativePath = fileUrl.replace(/^\//, ""); // "uploads/assets/filename.docx"

    // APP_ROOT is set by start.mjs so the path is reliable regardless of cwd
    const appRoot = process.env.APP_ROOT ?? process.cwd();
    const absPath = path.join(appRoot, "public", relativePath);

    // Security: prevent path traversal
    const uploadsBase = path.normalize(path.join(appRoot, "public", "uploads"));
    if (!path.normalize(absPath).startsWith(uploadsBase)) {
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

    const safeTitle = asset.title.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_");
    const filename = `${safeTitle}${ext}`;

    const nodeStream = fs.createReadStream(absPath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) =>
          controller.enqueue(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
        );
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (e) => controller.error(e));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        // inline — browser renders PDFs natively; others prompt save or use viewer
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // ── External URLs (S3 / CDN) — redirect ────────────────────────────────────
  return NextResponse.redirect(fileUrl);
}
