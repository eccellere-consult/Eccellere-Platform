import { NextResponse } from "next/server";
import { apiLimiter, getClientIp } from "@/lib/rate-limit";

// In-memory store for notifications (replaces DB when DB not deployed)
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "order" | "assignment" | "system";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

const notifications: Notification[] = [
  {
    id: "notif-1",
    userId: "demo-user",
    title: "Welcome to Eccellere",
    message: "Your account has been created successfully. Complete your profile to get started.",
    type: "info",
    isRead: false,
    actionUrl: "/dashboard",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-2",
    userId: "demo-user",
    title: "Order Confirmed — ORD-2051",
    message: "Your purchase of 'MSME Growth Strategy Playbook' is confirmed. Download it from your assets.",
    type: "order",
    isRead: false,
    actionUrl: "/dashboard",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "notif-3",
    userId: "demo-user",
    title: "AI Assessment Complete",
    message: "Your AI Readiness Assessment has been scored. View your results and recommendations.",
    type: "success",
    isRead: true,
    actionUrl: "/assessment",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "notif-4",
    userId: "demo-user",
    title: "New Framework Available",
    message: "A new 'Supply Chain Optimisation Toolkit' is available in the marketplace.",
    type: "info",
    isRead: true,
    actionUrl: "/marketplace",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "notif-5",
    userId: "demo-user",
    title: "Assignment Update",
    message: "Your specialist has submitted deliverables for 'Digital Strategy Roadmap'. Please review.",
    type: "assignment",
    isRead: false,
    actionUrl: "/dashboard",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = apiLimiter.check(ip);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  const filtered = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return NextResponse.json({
    notifications: filtered,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    total: notifications.length,
  });
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const limit = apiLimiter.check(ip);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { id, action } = body;

    if (action === "mark-all-read") {
      notifications.forEach((n) => (n.isRead = true));
      return NextResponse.json({
        message: "All notifications marked as read",
        unreadCount: 0,
      });
    }

    if (id) {
      const notif = notifications.find((n) => n.id === id);
      if (!notif) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      notif.isRead = true;
      return NextResponse.json({ message: "Notification marked as read", notification: notif });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
