"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const footerServices = [
  { label: "Strategy", href: "/services/strategy" },
  { label: "Process Transformation", href: "/services/process-transformation" },
  { label: "Agentic AI", href: "/services/agentic-ai" },
  { label: "Digital", href: "/services/digital" },
  { label: "Organisation Transformation", href: "/services/organisation-transformation" },
];

const footerCompany = [
  { label: "About", href: "/about" },
  { label: "For MSMEs", href: "/msme-hub" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Perspectives", href: "/perspectives" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Careers", href: "/careers" },
];

const footerGetInTouch = [
  { label: "Book a Call", href: "/contact?type=call" },
  { label: "Get a Quote", href: "/contact?type=quote" },
  { label: "Partner with Us", href: "/contact?type=partner" },
  { label: "Become a Specialist", href: "/specialist/register" },
];

const footerPortals = [
  { label: "Log In", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Client Dashboard", href: "/dashboard" },
  { label: "Specialist Portal", href: "/specialist" },
  { label: "Pricing", href: "/pricing" },
];

const footerLegal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Refund Policy", href: "/refund" },
];

export function Footer() {
  return (
    <footer className="bg-eccellere-ink text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:justify-between">
          <p className="font-display text-lg italic text-white/90">
            Get weekly insights for MSMEs
          </p>
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="you@company.com"
              required
              className="flex-1 rounded-none border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
            <Button type="submit" size="sm">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <span className="font-display text-xl font-semibold tracking-wide">
            ECCELLERĒ
          </span>
          <p className="text-sm leading-relaxed text-white/60">
            India&apos;s premier consulting platform for MSMEs and startups.
            Strategy, AI, and business frameworks for growth.
          </p>
          <div className="space-y-1 text-sm text-white/50">
            <p>contact@eccellere.in</p>
            <p>+91 9964694566</p>
            <p>Bengaluru, India</p>
          </div>
          {/* Social icons */}
          <div className="flex gap-4 pt-2">
            {["LinkedIn", "X", "YouTube", "Instagram"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="text-xs uppercase tracking-wider text-white/40 transition-colors hover:text-eccellere-gold"
                aria-label={platform}
              >
                {platform}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Services */}
        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-white/40">
            Services
          </h4>
          <ul className="space-y-2.5">
            {footerServices.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-eccellere-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Company */}
        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-white/40">
            Company
          </h4>
          <ul className="space-y-2.5">
            {footerCompany.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-eccellere-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Get in Touch */}
        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-white/40">
            Get in Touch
          </h4>
          <ul className="space-y-2.5">
            {footerGetInTouch.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-eccellere-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 5: Portals */}
        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-white/40">
            Portals
          </h4>
          <ul className="space-y-2.5">
            {footerPortals.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-eccellere-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-6 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Eccellere Consulting Pvt. Ltd.</p>
          <div className="flex gap-4">
            {footerLegal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white/60"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
