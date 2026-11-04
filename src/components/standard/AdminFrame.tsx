"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The standard frame for the admin tools-marketplace work (Eccellere Product Standard, sections 2 to 4): the same side menu on the left, the
 * work on its right under a slim top bar whose breadcrumb is the way back, and the same numbered "Stage" strip as the client tools.
 * Used by the Form Builder, the classification screen and the tools marketplace so they look and behave like every other tool.
 */
export const ADMIN_STAGES = [
  { n: 1, label: "Build", href: "/admin/forms", title: "Form Builder" },
  { n: 2, label: "Classify & deepen", href: "/admin/forms/classify", title: "Classify and deepen" },
  { n: 3, label: "Review & publish", href: "/admin/tools", title: "Tools marketplace" },
] as const;

const MENU = [
  { label: "Admin home", href: "/admin" },
  { label: "AI providers", href: "/admin/ai-settings" },
  { label: "Content", href: "/admin/content" },
  { label: "Users", href: "/admin/users" },
  { label: "Audit log", href: "/admin/audit-log" },
];

/** Which stage a path belongs to (the longest matching address wins). */
export function stageFor(pathname: string): (typeof ADMIN_STAGES)[number] {
  return [...ADMIN_STAGES].sort((a, b) => b.href.length - a.href.length).find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`)) ?? ADMIN_STAGES[0];
}

function SideMenu({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={onNavigate}
      aria-current={pathname === href ? "page" : undefined}
      className={cn("block border-l-2 px-3 py-1.5 text-sm leading-snug", pathname === href ? "border-eccellere-gold-deep bg-eccellere-cream font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Admin" className="text-sm">
      <p className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">Tools marketplace</p>
      <div className="mb-2">{ADMIN_STAGES.map((s) => link(s.href, `${s.n}. ${s.title}`))}</div>
      <p className="border-t border-eccellere-border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">Admin</p>
      <div>{MENU.map((m) => link(m.href, m.label))}</div>
    </nav>
  );
}

export default function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [drawer, setDrawer] = useState(false);
  const stage = stageFor(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-eccellere-cream">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm">Skip to the work</a>
      <aside className="no-print hidden w-64 shrink-0 border-r border-eccellere-border bg-white md:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto py-4"><SideMenu pathname={pathname} /></div>
      </aside>
      {drawer && (
        <div className="no-print fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white py-4">
            <button type="button" className="mb-2 ml-3 p-1 text-ink-mid" aria-label="Close menu" onClick={() => setDrawer(false)}><X className="h-5 w-5" /></button>
            <SideMenu pathname={pathname} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="no-print sticky top-0 z-30 border-b border-eccellere-border bg-white">
          <div className="flex h-12 items-center gap-3 px-4 md:px-6">
            <button type="button" className="p-1 text-ink-mid md:hidden" aria-label="Open the admin menu" onClick={() => setDrawer(true)}><Menu className="h-5 w-5" /></button>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate text-xs text-ink-mid">
              <Link href="/admin" className="hover:text-eccellere-gold-deep">Admin</Link>
              <span aria-hidden="true"> › </span>
              <span>Tools marketplace</span>
              <span aria-hidden="true"> › </span>
              <span className="font-medium text-eccellere-ink">{stage.title}</span>
            </nav>
          </div>
          <ol className="m-0 flex list-none gap-1 overflow-x-auto px-4 md:px-6" aria-label="Stages">
            {ADMIN_STAGES.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  aria-current={stage.n === s.n ? "step" : undefined}
                  className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", stage.n === s.n ? "border-eccellere-gold-deep font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
                >
                  <span className={cn("flex h-5 w-5 items-center justify-center text-[11px]", stage.n === s.n ? "bg-eccellere-gold-deep text-white" : "border border-eccellere-border")}>{s.n}</span>
                  Stage {s.n} <span className="hidden sm:inline">· {s.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}

/** The one title block every page opens with: a small kicker, the title, one sentence of purpose. */
export function TitleBlock({ kicker, title, purpose }: { kicker: string; title: string; purpose: React.ReactNode }) {
  return (
    <header className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">{kicker}</p>
      <h1 className="mt-1 font-display text-3xl font-light leading-tight text-eccellere-ink md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-mid">{purpose}</p>
    </header>
  );
}
