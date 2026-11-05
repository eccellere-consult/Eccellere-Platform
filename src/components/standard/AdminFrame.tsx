"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ADMIN_GROUPS, activeItem } from "@/lib/admin/menu";

/**
 * The standard frame for EVERY admin screen (Eccellere Product Standard, sections 2 to 4). It lives in the admin layout, so it is mounted
 * once and stays put while the person moves between screens: the side menu is fixed to the left edge, never re-drawn, never different from
 * one screen to the next. The menu, breadcrumb and Stage strip all come from `lib/admin/menu.ts`.
 */
function SideMenu({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const current = activeItem(pathname);
  return (
    <nav aria-label="Admin" className="flex min-h-full flex-col text-sm">
      <div className="flex-1">
        {ADMIN_GROUPS.map((g) => (
          <div key={g.id} className="border-t border-eccellere-border first:border-t-0">
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">{g.label}</p>
            <ul className="m-0 mb-2 list-none p-0">
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={current?.href === i.href ? "page" : undefined}
                    className={cn("block border-l-2 px-3 py-1.5 leading-snug", current?.href === i.href ? "border-eccellere-gold-deep bg-eccellere-cream font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-eccellere-border py-2">
        <Link href="/" onClick={onNavigate} className="block px-3 py-1.5 text-ink-mid hover:text-eccellere-gold-deep">Back to site</Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-3 py-1.5 text-left text-ink-mid hover:text-eccellere-gold-deep">Sign out</button>
      </div>
    </nav>
  );
}

export default function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [drawer, setDrawer] = useState(false);
  const current = activeItem(pathname);
  const staged = current?.group.stages ? current.group : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm">Skip to the work</a>
      {/* fixed to the left edge: it does not move, shrink or vanish when the person clicks around */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-eccellere-border bg-white md:block">
        <SideMenu pathname={pathname} />
      </aside>
      {drawer && (
        <div className="no-print fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white py-2">
            <button type="button" className="mb-1 ml-3 p-1 text-ink-mid" aria-label="Close menu" onClick={() => setDrawer(false)}><X className="h-5 w-5" /></button>
            <SideMenu pathname={pathname} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="min-w-0 md:pl-64">
        <div className="no-print sticky top-0 z-30 border-b border-eccellere-border bg-white">
          <div className="flex h-12 items-center gap-3 px-4 md:px-6">
            <button type="button" className="p-1 text-ink-mid md:hidden" aria-label="Open the admin menu" onClick={() => setDrawer(true)}><Menu className="h-5 w-5" /></button>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate text-xs text-ink-mid">
              <Link href="/admin" className="hover:text-eccellere-gold-deep">Admin</Link>
              {current && current.href !== "/admin" && (
                <>
                  <span aria-hidden="true"> › </span><span>{current.group.label}</span>
                  <span aria-hidden="true"> › </span><span className="font-medium text-eccellere-ink">{current.label}</span>
                </>
              )}
            </nav>
          </div>
          {staged && (
            <ol className="m-0 flex list-none gap-1 overflow-x-auto px-4 md:px-6" aria-label="Stages">
              {staged.items.map((s, idx) => {
                const on = current?.href === s.href;
                return (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      aria-current={on ? "step" : undefined}
                      className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", on ? "border-eccellere-gold-deep font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
                    >
                      <span className={cn("flex h-5 w-5 items-center justify-center text-[11px]", on ? "bg-eccellere-gold-deep text-white" : "border border-eccellere-border")}>{idx + 1}</span>
                      Stage {idx + 1} <span className="hidden sm:inline">· {s.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
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
