import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

// Public preview endpoint used by the marketplace slug page to stream the
// first file attached to a PUBLISHED asset, so the browser can render the
// first ~5 pages with docx-preview. No auth — only PUBLISHED assets are
// served, and the client-side renderer hides anything beyond page 5.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let asset: { title: string; fileUrls: unknown; status: string } | null;
  try {
    asset = await prisma.asset.findUnique({
      where: { slug },
      select: { title: true, fileUrls: true, status: true },
    });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 503 });
  }

  if (!asset || asset.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0] ?? null;
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
    return NextResponse.json({ error: "No previewable file" }, { status: 404 });
  }

  let absPath: string;
  try {
    absPath = resolveUploadPath(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  if (ext !== ".docx") {
    return NextResponse.json({ error: "Preview only available for .docx files" }, { status: 415 });
  }

  const stat = fs.statSync(absPath);
  const stream = fs.createReadStream(absPath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=300",
    },
  });
}
