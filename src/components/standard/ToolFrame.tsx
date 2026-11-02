"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The standard frame for a signed-in tool (Eccellere Product Standard, sections 2 and 3): a side menu always on the left, the tool on its
 * right under a slim top bar whose breadcrumb is also the way back, and one numbered "Stage" strip. On a phone the menu is a drawer.
 * The menu is drawn from the published tools, so a new tool appears in it by itself.
 */
export interface MenuGroup { category: string; tools: { slug: string; name: string }[] }

/** The three stages every tool page shares; each is an anchor on the page. */
export const TOOL_STAGES = [
  { n: 1, label: "Understand", id: "stage-1" },
  { n: 2, label: "Fill in", id: "stage-2" },
  { n: 3, label: "Analyse & act", id: "stage-3" },
] as const;

/** Where the menu points: the client tools by default; the consulting library passes its own. */
export interface FrameBase { base: string; rootLabel: string; homeHref: string; homeLabel: string }
const CLIENT_BASE: FrameBase = { base: "/tools", rootLabel: "Tools", homeHref: "/dashboard", homeLabel: "Dashboard" };

function Menu_({ groups, slug, onNavigate, where }: { groups: MenuGroup[]; slug: string; onNavigate?: () => void; where: FrameBase }) {
  return (
    <nav aria-label="Tools" className="text-sm">
      <Link href={where.homeHref} onClick={onNavigate} className="mb-1 block px-3 py-2 text-ink-mid hover:text-eccellere-gold-deep">{where.homeLabel}</Link>
      <Link href={where.base} onClick={onNavigate} className="mb-3 block px-3 py-2 font-medium text-eccellere-ink hover:text-eccellere-gold-deep">All tools</Link>
      {groups.map((g) => {
        const open = g.tools.some((t) => t.slug === slug);
        return (
          <details key={g.category} open={open} className="border-t border-eccellere-border">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">{g.category}</summary>
            <ul className="m-0 mb-2 list-none p-0">
              {g.tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`${where.base}/${t.slug}`}
                    onClick={onNavigate}
                    aria-current={t.slug === slug ? "page" : undefined}
                    className={cn("block border-l-2 px-3 py-1.5 text-sm leading-snug", t.slug === slug ? "border-eccellere-gold-deep bg-eccellere-cream font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}

export default function ToolFrame({ groups, slug, name, category, where = CLIENT_BASE, children }: { groups: MenuGroup[]; slug: string; name: string; category: string; where?: FrameBase; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [active, setActive] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const seen = new Map<number, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(Number(e.target.id.replace("stage-", "")), e.isIntersecting);
      const first = TOOL_STAGES.find((s) => seen.get(s.n));
      if (first) setActive(first.n);
    }, { rootMargin: "-120px 0px -50% 0px" });
    for (const s of TOOL_STAGES) { const el = document.getElementById(s.id); if (el) io.observe(el); }
    return () => io.disconnect();
  }, [slug]);

  return (
    <div className="flex min-h-screen bg-eccellere-cream">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-sm">Skip to the tool</a>

      <aside className="no-print hidden w-64 shrink-0 border-r border-eccellere-border bg-white md:block">
        <div className="sticky top-0 max-h-screen overflow-y-auto py-4">
          <Menu_ groups={groups} slug={slug} where={where} />
        </div>
      </aside>

      {drawer && (
        <div className="no-print fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Tools menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white py-4">
            <button type="button" className="mb-2 ml-3 p-1 text-ink-mid" aria-label="Close menu" onClick={() => setDrawer(false)}><X className="h-5 w-5" /></button>
            <Menu_ groups={groups} slug={slug} where={where} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="no-print sticky top-0 z-30 border-b border-eccellere-border bg-white">
          <div className="flex h-12 items-center gap-3 px-4 md:px-6">
            <button type="button" className="p-1 text-ink-mid md:hidden" aria-label="Open the tools menu" onClick={() => setDrawer(true)}><Menu className="h-5 w-5" /></button>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate text-xs text-ink-mid">
              <Link href={where.base} className="hover:text-eccellere-gold-deep">{where.rootLabel}</Link>
              <span aria-hidden="true"> › </span>
              <span>{category}</span>
              <span aria-hidden="true"> › </span>
              <span className="font-medium text-eccellere-ink">{name}</span>
            </nav>
          </div>
          <ol className="m-0 flex list-none gap-1 overflow-x-auto px-4 md:px-6" aria-label="Stages">
            {TOOL_STAGES.map((s) => (
              <li key={s.n}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.n ? "step" : undefined}
                  className={cn("flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", active === s.n ? "border-eccellere-gold-deep font-medium text-eccellere-ink" : "border-transparent text-ink-mid hover:text-eccellere-gold-deep")}
                >
                  <span className={cn("flex h-5 w-5 items-center justify-center text-[11px]", active === s.n ? "bg-eccellere-gold-deep text-white" : "border border-eccellere-border")}>{s.n}</span>
                  Stage {s.n} <span className="hidden sm:inline">· {s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
