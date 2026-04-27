"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "MSME", href: "/msme-hub" },
  { label: "Marketplace", href: "/marketplace" },
  {
    label: "Consulting",
    href: "/services",
    children: [
      { label: "Strategy", href: "/services/strategy" },
      { label: "Process Transformation", href: "/services/process-transformation" },
      { label: "Agentic AI", href: "/services/agentic-ai" },
      { label: "Digital", href: "/services/digital" },
      { label: "Organisation Transformation", href: "/services/organisation-transformation" },
    ],
  },
  {
    label: "More",
    href: "#",
    children: [
      { label: "About", href: "/about" },
      { label: "Perspectives", href: "/perspectives" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[rgba(250,248,244,0.95)] backdrop-blur-[12px] shadow-sm"
          : "bg-[rgba(26,20,40,0.95)] backdrop-blur-[12px]"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span
            className={cn(
              "font-display text-[22px] font-semibold tracking-wide transition-colors",
              scrolled ? "text-eccellere-ink" : "text-white"
            )}
          >
            ECCELLERĒ
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.children && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-ink-mid hover:text-eccellere-gold"
                    : "text-white/90 hover:text-eccellere-gold"
                )}
              >
                {link.label}
                {link.children && (
                  <span className="ml-1 inline-block text-[10px]">▾</span>
                )}
              </Link>

              {/* Dropdown */}
              {link.children && activeDropdown === link.label && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="min-w-[220px] rounded bg-white p-2 shadow-lg ring-1 ring-black/5">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded px-4 py-2.5 text-sm text-ink-mid transition-colors hover:bg-gold-pale hover:text-eccellere-gold"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right: Auth + CTA + Theme + Mobile toggle */}
        <div className="flex items-center gap-3">
          <NotificationBell scrolled={scrolled} />
          <ThemeToggle scrolled={scrolled} />
          <Link
            href="/login"
            className={cn(
              "hidden text-sm font-medium transition-colors lg:inline-flex",
              scrolled
                ? "text-ink-mid hover:text-eccellere-gold"
                : "text-white/90 hover:text-eccellere-gold"
            )}
          >
            Log in
          </Link>
          <Button
            asChild
            size="sm"
            className="hidden lg:inline-flex"
          >
            <Link href="/register">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "hidden lg:inline-flex",
              scrolled ? "text-ink-mid" : "text-white/90"
            )}
          >
            <Link href="/contact">Talk to Us</Link>
          </Button>
          <MobileNav links={navLinks} scrolled={scrolled} />
        </div>
      </div>
    </header>
  );
}
