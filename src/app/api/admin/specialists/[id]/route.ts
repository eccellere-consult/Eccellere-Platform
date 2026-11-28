import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SAMPLE_ID, buildChecklist, checklistCounts, isSpecialistReviewer, latestValidations, parseMark, planDecision,
  sampleProfile, toReviewProfile, type ProfileRow,
} from "@/lib/admin/specialistReview";

export const dynamic = "force-dynamic";

const CHECK_ACTION = "specialist_credential_checked";
const DECISION_ACTIONS = ["specialist_approved", "specialist_more_info_requested", "specialist_rejected"];

/** The admin who is signed in, or null. Specialist data is personal data: admins only. */
async function reviewer(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  const who = session?.user as { id?: string; role?: string } | undefined;
  return who?.id && isSpecialistReviewer(who.role) ? { id: who.id } : null;
}

const PROFILE_SELECT = {
  id: true, headline: true, bio: true, linkedinUrl: true, currentRole: true, organisation: true, experienceYears: true,
  education: true, certifications: true, serviceDomains: true, sectorExpertise: true, challengesAddressed: true,
  languages: true, engagementTypes: true, hourlyRateMin: true, hourlyRateMax: true, availability: true,
  monthlyHoursAvail: true, portfolioFiles: true, videoIntroUrl: true, status: true, approvedAt: true, approvedBy: true,
  rejectionReason: true, bankAccountNumber: true, panNumber: true, gstNumber: true, createdAt: true, updatedAt: true,
  user: { select: { name: true, email: true, phone: true, emailVerified: true, createdAt: true, lastLoginAt: true } },
} as const;

async function loadProfile(id: string): Promise<ProfileRow | null> {
  return (await prisma.specialistProfile.findUnique({ where: { id }, select: PROFILE_SELECT })) as ProfileRow | null;
}

async function names(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map();
  const users = await prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, email: true } });
  return new Map(users.map((u) => [u.id, u.name || u.email]));
}

/** GET: everything the applicant submitted, the checklist with the latest marks, and the decision history. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await reviewer())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (id === SAMPLE_ID) {
    const profile = sampleProfile();
    const checklist = buildChecklist(profile);
    return NextResponse.json({ profile, checklist, marks: {}, counts: checklistCounts(checklist, {}), history: [] });
  }

  const row = await loadProfile(id);
  if (!row) return NextResponse.json({ error: "Specialist not found" }, { status: 404 });
  const profile = toReviewProfile(row);
  const checklist = buildChecklist(profile);

  const audit = await prisma.auditLog.findMany({
    where: { entityType: "SpecialistProfile", entityId: id, action: { in: [CHECK_ACTION, ...DECISION_ACTIONS] } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const who = await names([row.approvedBy, ...audit.map((a) => a.userId)]);
  const rawMarks = latestValidations(audit.filter((a) => a.action === CHECK_ACTION));
  const marks = Object.fromEntries(Object.entries(rawMarks).map(([k, m]) => [k, { ...m, by: m.by ? who.get(m.by) ?? "Removed user" : null }]));
  const history = audit
    .filter((a) => DECISION_ACTIONS.includes(a.action))
    .map((a) => {
      const d = (a.details ?? {}) as { reason?: string };
      return { action: a.action, reason: d.reason ?? "", by: a.userId ? who.get(a.userId) ?? "Removed user" : "System", at: a.createdAt.toISOString() };
    });

  return NextResponse.json({
    profile: { ...profile, approvedBy: row.approvedBy ? who.get(row.approvedBy) ?? "Removed user" : null },
    checklist, marks, counts: checklistCounts(checklist, rawMarks), history,
  });
}

/**
 * POST { kind: "mark", key, status, note }: record a check on one claimed skill or credential.
 * POST { kind: "decide", action: "approve" | "more_info" | "reject", reason }: record the decision.
 * Every change is written to the audit log with the admin who made it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await reviewer();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (id === SAMPLE_ID) return NextResponse.json({ error: "The sample is for the demo only and is not saved" }, { status: 400 });

  let body: { kind?: string; key?: unknown; status?: unknown; note?: unknown; action?: unknown; reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const row = await loadProfile(id);
  if (!row) return NextResponse.json({ error: "Specialist not found" }, { status: 404 });

  if (body.kind === "mark") {
    const mark = parseMark(body, buildChecklist(toReviewProfile(row)));
    if (!mark.ok) return NextResponse.json({ error: mark.error }, { status: 400 });
    await prisma.auditLog.create({
      data: { userId: admin.id, action: CHECK_ACTION, entityType: "SpecialistProfile", entityId: id, details: { key: mark.key, label: mark.label, status: mark.status, note: mark.note } },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "decide") {
    const plan = planDecision(body.action, body.reason, admin.id);
    if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 });
    await prisma.specialistProfile.update({ where: { id }, data: plan.data as never });
    await prisma.auditLog.create({
      data: { userId: admin.id, action: plan.auditAction, entityType: "SpecialistProfile", entityId: id, details: { reason: plan.reason, previousStatus: row.status } },
    });
    return NextResponse.json({ ok: true, status: plan.data.status });
  }

  return NextResponse.json({ error: "kind must be mark or decide" }, { status: 400 });
}
