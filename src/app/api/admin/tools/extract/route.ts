import { NextRequest, NextResponse } from "next/server";
import { ExtractError, MAX_UPLOAD_BYTES, extractDocumentText } from "@/lib/tools/extract";
import { aiReady, toolsGuard, writeAuth } from "@/lib/tools/server";
import { labelled } from "@/lib/ai/gateway";
import { makeScannedPdfReader } from "@/lib/tools/scannedPdf";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const limiter = rateLimit({ limit: 40, windowSeconds: 3600 });

/**
 * POST /api/admin/tools/extract  (multipart: file)
 * Reads the text out of a PDF, Word, PowerPoint, Excel or text file so an administrator can use it as a tool's content or as the list of
 * tools. The file itself is not kept; only the text goes back to the page, where the administrator can read and edit it before using it.
 */
export const POST = toolsGuard(async (req: NextRequest) => {
  const auth = await writeAuth();
  if (auth.error) return auth.error;
  if (!limiter.check(auth.user.id).success) return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "No file received." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That file is larger than 10 MB. Use a smaller file, or split it." }, { status: 413 });
  try {
    // a scanned PDF has no text inside; when AI is on, a model that can see pages reads it (the page then says it was read by AI)
    const readScanned = (await aiReady()) ? makeScannedPdfReader(labelled("scanned_pdf_reading", "tool_builder")) : undefined;
    const out = await extractDocumentText(file.name, Buffer.from(await file.arrayBuffer()), undefined, { readScanned });
    return NextResponse.json({ ...out, fileName: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) });
  } catch (e) {
    if (e instanceof ExtractError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.code === "TOO_LARGE" ? 413 : e.code === "UNSUPPORTED" ? 415 : 422 });
    throw e;
  }
});
