import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { resolveUploadPath } from "@/lib/uploads";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

/**
 * GET /api/marketplace/preview/[assetId]
 * Public endpoint — returns the first 5 "pages" of extracted text from an
 * asset's attached file. Used on the marketplace detail page as a document
 * preview. No auth required (published assets only).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  let asset;
  try {
    asset = await prisma.asset.findFirst({
      where: { id: assetId, status: { in: ["PUBLISHED", "APPROVED", "SUBMITTED"] } },
      select: { fileUrls: true, title: true },
    });
  } catch {
    return NextResponse.json({ pages: [] }, { status: 200 });
  }

  if (!asset) {
    return NextResponse.json({ pages: [] }, { status: 200 });
  }

  const fileUrls = Array.isArray(asset.fileUrls) ? (asset.fileUrls as string[]) : [];
  const fileUrl = fileUrls[0];

  if (!fileUrl) {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  // Skip ZIP files — no readable text
  if (fileUrl.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  // Resolve absolute path — fileUrl is like "/uploads/assets/filename.docx"
  let filePath: string;
  try {
    filePath = resolveUploadPath(fileUrl);
  } catch {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  let extractedText = "";
  try {
    const buffer = await readFile(filePath);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const officeparser = require("officeparser");
    const ast = await officeparser.parseOffice(buffer);
    extractedText = ast.toText() ?? "";
  } catch {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  const trimmed = extractedText.trim();
  if (trimmed.length < 50) {
    return NextResponse.json({ pages: [], title: asset.title });
  }

  const pages = splitIntoPages(trimmed);

  return NextResponse.json(
    { pages, title: asset.title },
    {
      headers: {
        // Cache at CDN/browser for 1 hour; serve stale for 24 h while revalidating
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}

/**
 * Split extracted text into logical "pages".
 * Priority order:
 * 1. Form-feed characters (\f) — real page breaks in Word/PDF exports
 * 2. Paragraph grouping — groups paragraphs until ~650 chars, then starts new page
 */
function splitIntoPages(text: string, charsPerPage = 650): string[] {
  // 1. Form-feed splits (real page boundaries)
  const ffPages = text
    .split("\f")
    .map((p) => p.trim())
    .filter((p) => p.length > 30);
  if (ffPages.length >= 2) {
    return ffPages.slice(0, 5);
  }

  // 2. Group paragraphs into page-sized chunks
  const paragraphs = text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);

  const pages: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > charsPerPage && current.length > 0) {
      pages.push(current.trim());
      current = para;
      if (pages.length >= 5) break;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }

  if (current.trim() && pages.length < 5) {
    pages.push(current.trim());
  }

  return pages.slice(0, 5);
}
