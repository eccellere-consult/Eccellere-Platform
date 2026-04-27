import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";
import { ensurePreviewDocx } from "@/lib/preview-docx";

export const dynamic = "force-dynamic";

// Public preview endpoint — streams a 5-page-truncated copy of the asset's
// .docx file. The truncated `*.preview.docx` is generated at upload time;
// for legacy assets uploaded before that hook existed, it is generated on
// the first request and cached on disk. The full document is never exposed
// to unauthenticated callers.
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

  let absOriginal: string;
  try {
    absOriginal = resolveUploadPath(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  if (!fs.existsSync(absOriginal)) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const ext = path.extname(absOriginal).toLowerCase();
  if (ext !== ".docx") {
    return NextResponse.json({ error: "Preview only available for .docx files" }, { status: 415 });
  }

  // Sibling preview path: foo.docx → foo.preview.docx
  const dir = path.dirname(absOriginal);
  const base = path.basename(absOriginal, ext);
  let previewPath = path.join(dir, `${base}.preview.docx`);

  // Regenerate if missing OR if the source file is newer than the cached
  // preview (e.g. the truncation algorithm itself was updated and we want
  // existing assets to pick up the change on next access).
  let needsGenerate = !fs.existsSync(previewPath);
  if (!needsGenerate) {
    try {
      const srcMtime = fs.statSync(absOriginal).mtimeMs;
      const prevMtime = fs.statSync(previewPath).mtimeMs;
      // Treat preview as stale if it predates the source file at all.
      if (prevMtime < srcMtime) needsGenerate = true;
    } catch {
      needsGenerate = true;
    }
  }

  if (needsGenerate) {
    try {
      const generated = await ensurePreviewDocx(absOriginal, 5);
      if (!generated) {
        return NextResponse.json({ error: "Preview not available" }, { status: 415 });
      }
      previewPath = generated;
    } catch (err) {
      console.error("[preview-file] generation failed:", err);
      return NextResponse.json({ error: "Preview generation failed" }, { status: 500 });
    }
  }

  const stat = fs.statSync(previewPath);
  const stream = fs.createReadStream(previewPath);
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
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=300",
    },
  });
}
