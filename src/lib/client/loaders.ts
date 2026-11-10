import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { milestoneProgress, orderTimeline, toAssessmentView, groupOfAssignment } from "./summary";

export async function signedInUser(): Promise<{ id: string } | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return u;
}

/** One order, only if it belongs to this person. Anyone else's order is "not found". */
export async function loadOrder(userId: string, orderId: string) {
  const o = await prisma.order.findFirst({
    where: { userId, OR: [{ id: orderId }, { orderNumber: orderId }] },
    select: {
      id: true, orderNumber: true, status: true, subtotal: true, gstAmount: true, discountAmount: true, totalAmount: true, couponCode: true, paymentGateway: true, paymentMethod: true,
      gatewayPaymentId: true, invoiceUrl: true, createdAt: true, refundedAt: true, refundReason: true,
      items: { select: { quantity: true, unitPrice: true, totalPrice: true, asset: { select: { id: true, title: true, category: true, description: true, author: { select: { user: { select: { name: true } } } } } } } },
    },
  });
  if (!o) return null;
  return { ...o, timeline: orderTimeline(o), canDownload: o.status === "PAID" };
}

export async function loadAssessments(userId: string) {
  const rows = await prisma.assessment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return rows.map(toAssessmentView);
}

export async function loadClientAssignments(userId: string) {
  const profile = await prisma.clientProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) return [];
  const rows = await prisma.assignment.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, title: true, status: true, startDate: true, dueDate: true, agreedFee: true, createdAt: true,
      specialist: { select: { user: { select: { name: true } } } },
      milestones: { select: { id: true, title: true, isCompleted: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map((r) => ({
    id: r.id, title: r.title, status: r.status, group: groupOfAssignment(r.status), startDate: r.startDate, dueDate: r.dueDate, agreedFee: r.agreedFee,
    specialistName: r.specialist?.user?.name ?? null, milestones: r.milestones, progress: milestoneProgress(r.milestones),
  }));
}
