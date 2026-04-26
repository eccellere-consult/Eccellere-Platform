import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";
import { signAssetToken } from "@/lib/asset-token";

export const dynamic = "force-dynamic";

// GET /api/dashboard/view/[assetId]
// Streams the purchased asset file for inline browser viewing (not forced download).
// Identical auth logic to download route; differs only in Content-Disposition header.
export async function GET(
  request: NextRequest,
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

    const ext = path.extname(absPath).toLowerCase();

    // ── Office docs (DOCX/DOC/XLSX/XLS/PPTX/PPT) → embed Microsoft Office  ──
    // Online viewer in an iframe. Gives pixel-perfect rendering with original
    // formatting. Microsoft's servers fetch the file via a short-lived
    // HMAC-signed public URL, so the file stays auth-protected.
    const officeExts = new Set([".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt"]);
    if (officeExts.has(ext)) {
      const token = signAssetToken(assetId, user.id);

      // Determine origin for the public file URL Microsoft will fetch.
      // Prefer NEXT_PUBLIC_SITE_URL; fall back to the request's host.
      const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
      const reqUrl = new URL(request.url);
      const reqOrigin =
        request.headers.get("x-forwarded-host")
          ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
          : `${reqUrl.protocol}//${reqUrl.host}`;
      const origin = envOrigin || reqOrigin;

      const publicFileUrl = `${origin}/api/files/asset/${token}`;
      const viewerUrl =
        `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(publicFileUrl)}`;

      const safeTitle = asset.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #f3f4f6; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    .viewer-frame { width: 100%; height: 100vh; border: 0; display: block; }
    .fallback { padding: 24px; max-width: 720px; margin: 40px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
    .fallback h2 { margin-top: 0; color: #1f3864; }
    .fallback a { color: #0563c1; }
  </style>
</head>
<body>
  <iframe class="viewer-frame" src="${viewerUrl}" allowfullscreen></iframe>
  <noscript>
    <div class="fallback">
      <h2>${safeTitle}</h2>
      <p>JavaScript is required to view this document inline.
      You can still <a href="/api/dashboard/download/${assetId}">download the file</a> if downloading is enabled for your purchase.</p>
    </div>
  </noscript>
</body>
</html>`;
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
          // Override the global strict CSP so the Google Docs viewer iframe loads.
          "Content-Security-Policy":
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https:; " +
            "frame-src https://docs.google.com https://*.google.com https://view.officeapps.live.com https://*.officeapps.live.com; " +
            "connect-src 'self' https:; " +
            "frame-ancestors 'self';",
        },
      });
    }

    // ── PDF → serve inline (browsers render natively) ────────────────────────
    const stat = fs.statSync(absPath);
    const contentTypeMap: Record<string, string> = {
      ".pdf":  "application/pdf",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls":  "application/vnd.ms-excel",
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
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // ── External URLs (S3 / CDN) — redirect ────────────────────────────────────
  return NextResponse.redirect(fileUrl);
}
