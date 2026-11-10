import { prisma } from "@/lib/prisma";
import { describeAudit } from "./stats";

/** The filters the Audit log screen accepts, turned into a database filter. Pure, so it is tested without a database. */
export interface AuditQuery { q?: string; entityType?: string; action?: string; page?: number }
export const AUDIT_PAGE_SIZE = 50;

export function auditWhere(f: AuditQuery): Record<string, unknown> {
  const and: Record<string, unknown>[] = [];
  const q = (f.q ?? "").trim().slice(0, 100);
  if (q) and.push({ OR: [{ action: { contains: q } }, { entityType: { contains: q } }, { entityId: { contains: q } }, { userId: { equals: q } }] });
  if (f.entityType) and.push({ entityType: f.entityType });
  if (f.action) and.push({ action: f.action });
  return and.length ? { AND: and } : {};
}

export const auditPage = (n: unknown): number => { const p = Math.floor(Number(n)); return Number.isFinite(p) && p >= 1 && p <= 10_000 ? p : 1; };

export async function loadAuditLog(f: AuditQuery) {
  const page = auditPage(f.page);
  const where = auditWhere(f);
  const [rows, total, types, actions] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * AUDIT_PAGE_SIZE, take: AUDIT_PAGE_SIZE }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" }, take: 100 }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" }, take: 200 }),
  ]);
  const ids = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, role: true } }) : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  return {
    page, pageSize: AUDIT_PAGE_SIZE, total, pages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    entityTypes: types.map((t) => t.entityType), actions: actions.map((a) => a.action),
    entries: rows.map((r) => {
      const u = r.userId ? byId.get(r.userId) : undefined;
      const d = describeAudit(r.action, r.entityType, r.entityId);
      return { id: r.id, at: r.createdAt, who: u ? (u.name || u.email) : r.userId ? "Removed user" : "System", role: u?.role ?? null, action: d.action, rawAction: r.action, detail: d.detail, ip: r.ipAddress };
    }),
  };
}
