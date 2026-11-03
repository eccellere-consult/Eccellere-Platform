import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/toolkit/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { driveClient, serviceAccount } from "@/lib/advisor/drive";
import { syncDrive } from "@/lib/advisor/sync";
import { driveRepo } from "@/lib/advisor/driveStore";
import { DRIVE_KEY, driveConfig, protectedNames, resetCorpus } from "@/lib/advisor/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** A folder link or a bare id, reduced to the id. */
const folderId = (s: string) => (s.match(/folders\/([\w-]+)/)?.[1] ?? s.match(/[?&]id=([\w-]+)/)?.[1] ?? s).trim();

const save = (value: object, userId: string) =>
  prisma.aiSetting.upsert({ where: { key: DRIVE_KEY }, create: { key: DRIVE_KEY, value: value as never, updatedBy: userId }, update: { value: value as never, updatedBy: userId } });

/** GET: set-up state, folders, counts and the file list (titles are the client-safe ones; names stay in the database). GET ?preview=<id>: the anonymised text of one file. */
async function GET_(req: NextRequest) {
  const auth = await requirePermission("admin:settings:read");
  if (auth.error) return auth.error;
  const preview = req.nextUrl.searchParams.get("preview");
  if (preview) {
    const chunks = await prisma.advChunk.findMany({ where: { fileId: preview }, orderBy: { seq: "asc" }, take: 60, select: { text: true } });
    return NextResponse.json({ text: chunks.map((c) => c.text).join("\n\n") });
  }
  const key = serviceAccount();
  const cfg = await driveConfig();
  let files: { id: string; title: string; status: string; reason: string | null; redactions: number; mime: string; syncedAt: Date; chunks: number }[] = [];
  let tablesReady = true;
  try {
    const rows = await prisma.advFile.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 500, include: { _count: { select: { chunks: true } } } });
    files = rows.map((r) => ({ id: r.id, title: r.title, status: r.status, reason: r.reason, redactions: r.redactions, mime: r.mime, syncedAt: r.syncedAt, chunks: r._count.chunks }));
  } catch { tablesReady = false; }
  return NextResponse.json({ keyConfigured: !!key, serviceAccountEmail: key?.client_email ?? null, tablesReady, ...cfg, files });
}

/** PUT { folders: string[], autoPublishClean: boolean } */
async function PUT_(req: NextRequest) {
  const auth = await requirePermission("admin:settings:write");
  if (auth.error) return auth.error;
  let body: { folders?: unknown; autoPublishClean?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const cur = await driveConfig();
  const folderIds = Array.isArray(body.folders) ? [...new Set(body.folders.filter((f): f is string => typeof f === "string").map(folderId).filter((f) => /^[\w-]{10,}$/.test(f)))].slice(0, 50) : cur.folderIds;
  await save({ ...cur, folderIds, autoPublishClean: typeof body.autoPublishClean === "boolean" ? body.autoPublishClean : cur.autoPublishClean }, auth.user.id);
  return NextResponse.json({ ok: true, folderIds });
}

/** POST { action: "sync" } or { action: "approve" | "exclude", fileId } */
async function POST_(req: NextRequest) {
  const auth = await requirePermission("admin:settings:write");
  if (auth.error) return auth.error;
  let body: { action?: unknown; fileId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.action === "sync") {
    const key = serviceAccount();
    if (!key) return NextResponse.json({ error: "The Google key is not set up yet. Add GOOGLE_SERVICE_ACCOUNT_JSON in Hostinger and redeploy." }, { status: 400 });
    const cfg = await driveConfig();
    if (!cfg.folderIds.length) return NextResponse.json({ error: "Add at least one Drive folder first." }, { status: 400 });
    const result = await syncDrive({ drive: driveClient(key), repo: driveRepo, folderIds: cfg.folderIds, protectedNames: await protectedNames(), autoPublishClean: cfg.autoPublishClean });
    const summary = `${result.added} new, ${result.updated} changed, ${result.removed} removed, ${result.quarantined} waiting for approval${result.remaining ? `, ${result.remaining} left (run again)` : ""}`;
    await save({ ...cfg, lastSync: { at: new Date().toISOString(), summary } }, auth.user.id);
    resetCorpus();
    await prisma.auditLog.create({ data: { userId: auth.user.id, action: "advisor.drive.sync", entityType: "AiSetting", entityId: DRIVE_KEY, details: result as never } }).catch(() => {});
    return NextResponse.json({ ok: true, result, summary });
  }

  if ((body.action === "approve" || body.action === "exclude") && typeof body.fileId === "string") {
    const file = await prisma.advFile.findUnique({ where: { id: body.fileId } });
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
    if (body.action === "approve" && !["QUARANTINED", "EXCLUDED"].includes(file.status)) return NextResponse.json({ error: "Only files waiting for approval can be approved." }, { status: 400 });
    await prisma.advFile.update({ where: { id: file.id }, data: body.action === "approve" ? { status: "PUBLISHED", reason: "Approved by an administrator." } : { status: "EXCLUDED", reason: "Withdrawn by an administrator." } });
    resetCorpus();
    await prisma.auditLog.create({ data: { userId: auth.user.id, action: `advisor.drive.${body.action}`, entityType: "AdvFile", entityId: file.id } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export const GET = guard(GET_);
export const PUT = guard(PUT_);
export const POST = guard(POST_);
