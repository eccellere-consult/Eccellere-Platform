import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, unauthorized, loadOwnedKit, guard } from "@/lib/toolkit/server";
import { getStorage } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const uploadLimiter = rateLimit({ limit: 20, windowSeconds: 3600 });
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_KIT = 10;
const MAX_TEXT_CHARS = 60000;

const OFFICE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const TEXT_TYPES = new Set(["text/plain", "text/csv", "text/markdown"]);

/** Extension fallback: browsers sometimes send application/octet-stream for csv/md. */
function resolveType(name: string, type: string): string {
  if (OFFICE_TYPES.has(type) || TEXT_TYPES.has(type)) return type;
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "csv") return "text/csv";
  if (ext === "txt") return "text/plain";
  if (ext === "md") return "text/markdown";
  return type;
}

async function extractText(buffer: Buffer, type: string): Promise<string> {
  if (TEXT_TYPES.has(type)) return buffer.toString("utf8");
  // officeparser is in serverExternalPackages; require avoids bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const officeparser = require("officeparser");
  const ast = await officeparser.parseOffice(buffer);
  return ast.toText();
}

/** POST /api/toolkits/[id]/evidence - multipart upload with text extraction */
async function POST_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!uploadLimiter.check(userId).success) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }
  const count = await prisma.kitEvidence.count({ where: { kitId: id } });
  if (count >= MAX_FILES_PER_KIT) {
    return NextResponse.json({ error: `Up to ${MAX_FILES_PER_KIT} files per kit.` }, { status: 422 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

  const type = resolveType(file.name, file.type);
  if (!OFFICE_TYPES.has(type) && !TEXT_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Supported files: PDF, Word, PowerPoint, Excel, CSV, TXT. Scanned images are not supported yet." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "evidence";
  const stored = await getStorage().upload(buffer, safeName, type, `toolkits/${id}`);

  let text = "";
  let status = "EXTRACTED";
  try {
    text = (await extractText(buffer, type)).replace(/\u0000/g, "").trim().slice(0, MAX_TEXT_CHARS);
    if (text.length < 20) status = "UNREADABLE";
  } catch {
    status = "UNREADABLE";
  }

  const row = await prisma.kitEvidence.create({
    data: {
      kitId: id,
      fileName: safeName,
      fileKey: stored.key,
      contentType: type,
      size: file.size,
      extractedText: text || null,
      status,
    },
    select: { id: true, fileName: true, status: true, size: true },
  });
  return NextResponse.json(
    {
      ...row,
      chars: text.length,
      preview: text.slice(0, 500),
      note:
        status === "UNREADABLE"
          ? "We could not read text from this file. It is kept as a reference but AI cannot use it. Scanned pages need OCR (coming later)."
          : undefined,
    },
    { status: 201 },
  );
}

/** DELETE /api/toolkits/[id]/evidence?evidenceId=... */
async function DELETE_(req: NextRequest, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const kit = await loadOwnedKit(id, userId);
  if (!kit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const evidenceId = req.nextUrl.searchParams.get("evidenceId") ?? "";
  const row = await prisma.kitEvidence.findFirst({ where: { id: evidenceId, kitId: id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await getStorage().delete(row.fileKey);
  } catch {
    /* file already gone; still remove the record */
  }
  await prisma.kitEvidence.delete({ where: { id: evidenceId } });
  return NextResponse.json({ ok: true });
}

export const POST = guard(POST_);
export const DELETE = guard(DELETE_);
