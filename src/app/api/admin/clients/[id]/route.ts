import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forgetAccess } from "@/lib/access";
import { sendEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const ADMINS = ["ADMIN", "SUPER_ADMIN", "CRM_ADMIN"];
const ACTIONS = { approve: "APPROVED", unblock: "APPROVED", block: "BLOCKED" } as const;

const approvedEmail = (name: string) =>
  `<p>Hello ${name.replace(/[<>&]/g, "")},</p><p>Your Eccellere account has been approved. You can now <a href="https://eccellere.co.in/login">sign in</a> and use your dashboard.</p><p>Eccellere Management Consulting</p>`;

/** POST { action: "approve" | "block" | "unblock" }: the Eccellere team lets a client login in, blocks it, or lets it back in. Clients only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const who = session?.user as { id?: string; role?: string } | undefined;
  if (!who?.id || !ADMINS.includes(who.role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const next = body.action && body.action in ACTIONS ? ACTIONS[body.action as keyof typeof ACTIONS] : null;
  if (!next) return NextResponse.json({ error: "Action must be approve, block or unblock" }, { status: 400 });

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, accountStatus: true } });
  if (!target || target.role !== "CLIENT") return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await prisma.user.update({
    where: { id },
    data: { accountStatus: next, ...(next === "APPROVED" ? { approvedAt: new Date(), approvedBy: who.id } : {}) },
  });
  forgetAccess(id);

  // Tell the client the good news; a failed email never undoes the approval.
  let emailed = false;
  if (next === "APPROVED" && target.accountStatus === "PENDING") {
    try { await sendEmail({ to: target.email, subject: "Your Eccellere account is approved", html: approvedEmail(target.name) }); emailed = true; } catch { emailed = false; }
  }
  return NextResponse.json({ ok: true, accountStatus: next, emailed });
}
