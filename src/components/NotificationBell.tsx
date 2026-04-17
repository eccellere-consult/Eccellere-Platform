"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, ShoppingBag, ClipboardList, Info, AlertTriangle, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "order" | "assignment" | "system";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  order: ShoppingBag,
  assignment: ClipboardList,
  system: Bell,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell({ scrolled }: { scrolled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-full transition-colors ${
          scrolled
            ? "text-eccellere-ink/70 hover:text-eccellere-ink"
            : "text-white/70 hover:text-white"
        }`}
        aria-label="Notifications"
        title={`${unreadCount} unread notifications`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-eccellere-gold text-eccellere-ink text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a18] rounded-xl shadow-xl border border-black/5 dark:border-white/10 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
            <h3 className="font-semibold text-sm text-eccellere-ink dark:text-eccellere-cream">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-eccellere-purple hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-eccellere-ink/40 hover:text-eccellere-ink dark:text-eccellere-cream/40"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-eccellere-ink/50 dark:text-eccellere-cream/50">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 transition-colors cursor-pointer hover:bg-eccellere-cream/50 dark:hover:bg-white/5 ${
                      !notif.isRead ? "bg-eccellere-purple/5 dark:bg-eccellere-purple/10" : ""
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !notif.isRead) markAsRead(notif.id);
                    }}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      notif.isRead
                        ? "bg-eccellere-ink/5 dark:bg-white/5"
                        : "bg-eccellere-purple/10"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        notif.isRead
                          ? "text-eccellere-ink/40 dark:text-eccellere-cream/40"
                          : "text-eccellere-purple"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${
                          notif.isRead
                            ? "text-eccellere-ink/60 dark:text-eccellere-cream/60"
                            : "text-eccellere-ink dark:text-eccellere-cream font-medium"
                        }`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-eccellere-purple" />
                        )}
                      </div>
                      <p className="text-xs text-eccellere-ink/50 dark:text-eccellere-cream/50 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-eccellere-ink/30 dark:text-eccellere-cream/30 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
