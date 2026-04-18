"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  IndianRupee,
  User,
  BarChart3,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/specialist", icon: LayoutDashboard },
  { label: "My Assets", href: "/specialist/assets", icon: Package },
  { label: "Submit Asset", href: "/specialist/assets/new", icon: PlusCircle },
  { label: "Assignments", href: "/specialist/assignments", icon: ClipboardList },
  { label: "Earnings", href: "/specialist/payments", icon: IndianRupee },
  { label: "Profile", href: "/specialist/profile", icon: User },
  { label: "Analytics", href: "/specialist/analytics", icon: BarChart3 },
];

export default function SpecialistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't wrap the register page in the specialist layout
  if (pathname === "/specialist/register") {
    return <>{children}</>;
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-eccellere-ink text-white",
        mobile && "w-full"
      )}
    >
      {/* Brand */}
      <div className="flex h-[64px] items-center justify-between border-b border-white/10 px-5">
        <Link href="/" className="font-display text-lg font-semibold tracking-wide text-white">
          ECCELLERĒ
        </Link>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User pill */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eccellere-teal text-sm font-semibold text-white">
          SP
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">Specialist</p>
          <p className="truncate text-[11px] text-white/50">Active</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Specialist Portal
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-eccellere-gold/20 text-eccellere-gold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-eccellere-gold" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-eccellere-cream">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-eccellere-ink/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-[64px] items-center justify-between border-b border-eccellere-ink/10 bg-eccellere-cream/95 px-6 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-ink-mid hover:text-eccellere-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-ink-light">Specialist Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-ink-mid hover:text-eccellere-ink">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
