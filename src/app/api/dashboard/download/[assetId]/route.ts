import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

// GET /api/dashboard/download/[assetId]
// Streams the purchased asset file to the client — only for users with a PAID order.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await params;

  // Wrap DB lookups in a timeout to prevent 503s on slow connections
  const dbTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("DB timeout")), 8000)
  );

  let user: { id: string; orders: { id: string }[] } | null;
  let asset: { title: string; fileUrls: unknown; downloadEnabled: boolean } | null;

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
          select: { title: true, fileUrls: true, downloadEnabled: true },
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
  if (!asset.downloadEnabled) {
    return NextResponse.json(
      { error: "Downloads for this asset are currently disabled by the administrator." },
      { status: 403 }
    );
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;

  if (!fileUrl) {
    return NextResponse.json(
      { error: "No file is attached to this asset yet. Please contact support." },
      { status: 404 }
    );
  }

  // ── Files stored in uploads dir (local / Hostinger persistent disk) ───────
  if (fileUrl.startsWith("/uploads/")) {
    let absPath: string;
    try {
      absPath = resolveUploadPath(fileUrl);
    } catch {
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

    // Sanitize filename for Content-Disposition header
    const safeTitle = asset.title.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_");
    const filename = `${safeTitle}${ext}`;

    // Stream the file instead of loading it all into memory
    const nodeStream = fs.createReadStream(absPath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) =>
          controller.enqueue(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
        );
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
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
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── External URLs (S3 / CDN) — redirect ────────────────────────────────────
  return NextResponse.redirect(fileUrl);
}

