"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface MobileNavProps {
  links: NavLink[];
  scrolled: boolean;
}

export function MobileNav({ links, scrolled }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "p-2 transition-colors",
          scrolled ? "text-eccellere-ink" : "text-white"
        )}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed inset-0 top-[72px] z-40 bg-eccellere-ink/95 backdrop-blur-lg">
          <nav className="flex flex-col gap-1 p-6">
            {/* Highlighted first item */}
            <Button asChild className="mb-4 w-full">
              <Link href="/assessment" onClick={() => setOpen(false)}>
                Take AI Assessment
              </Link>
            </Button>

            {links.map((link) => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <button
                      onClick={() =>
                        setExpandedGroup(
                          expandedGroup === link.label ? null : link.label
                        )
                      }
                      className="flex w-full items-center justify-between py-3 text-lg font-medium text-white/90"
                    >
                      {link.label}
                      <span
                        className={cn(
                          "text-sm transition-transform",
                          expandedGroup === link.label && "rotate-180"
                        )}
                      >
                        ▾
                      </span>
                    </button>
                    {expandedGroup === link.label && (
                      <div className="ml-4 flex flex-col gap-1 border-l border-white/10 pl-4">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="py-2 text-base text-white/70 transition-colors hover:text-eccellere-gold"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-lg font-medium text-white/90 transition-colors hover:text-eccellere-gold"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}

            <div className="mt-6 border-t border-white/10 pt-6">
              <Button asChild variant="ghostLight" className="w-full">
                <Link href="/contact" onClick={() => setOpen(false)}>
                  Talk to Us
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
