import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { resolveUploadPath } from "@/lib/uploads";
import { verifyAssetToken } from "@/lib/asset-token";
import { withDbTimeout } from "@/lib/db-timeout";

export const dynamic = "force-dynamic";

/**
 * Public file streaming endpoint for the Microsoft Office Online / Google
 * Docs viewer iframe. Auth is enforced via a short-lived HMAC-signed token
 * (see signAssetToken in @/lib/asset-token), so the URL is safe to expose
 * to third-party viewer servers.
 *
 * GET /api/files/asset/[token]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const verified = verifyAssetToken(token);
  if (!verified) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  // Re-validate purchase ownership and fetch asset metadata in parallel
  // (defence-in-depth). Both queries are bounded by a single 5 s timeout
  // so a stalled DB cannot leave the request hanging.
  const [order, asset] = await withDbTimeout(
    Promise.all([
      prisma.order.findFirst({
        where: {
          userId: verified.userId,
          status: "PAID",
          items: { some: { assetId: verified.assetId } },
        },
        select: { id: true },
      }),
      prisma.asset.findUnique({
        where: { id: verified.assetId },
        select: { title: true, fileUrls: true },
      }),
    ]),
    5000,
    "files.asset"
  );

  if (!order) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }

  let absPath: string;
  try {
    absPath = resolveUploadPath(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    ".doc":  "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls":  "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt":  "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pdf":  "application/pdf",
  };
  const contentType = contentTypeMap[ext] ?? "application/octet-stream";
  const stat = fs.statSync(absPath);

  const safeTitle = asset.title.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_") || "file";
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
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
