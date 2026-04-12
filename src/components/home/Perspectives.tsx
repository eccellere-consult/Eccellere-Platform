"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const articles = [
  {
    category: "Agentic AI",
    title: "Why Indian MSMEs Should Adopt Agentic AI Before Their Competitors Do",
    teaser:
      "The window of advantage is narrow. Here's how early movers are gaining 30% efficiency improvements.",
    author: "Eccellere Research",
    date: "Jan 2025",
    readTime: "6 min read",
    featured: true,
    href: "/perspectives/agentic-ai-msme-advantage",
  },
  {
    category: "Strategy",
    title: "5 Growth Frameworks Every MSME Founder Should Know",
    teaser: "From Ansoff to Blue Ocean — applied to the Indian context.",
    author: "Eccellere Editorial",
    date: "Dec 2024",
    readTime: "4 min read",
    featured: false,
    href: "/perspectives/growth-frameworks-msme",
  },
  {
    category: "Manufacturing",
    title: "Lean Manufacturing in 2025: What's Changed for Indian Factories",
    teaser: "Digital twins, IoT sensors, and the new lean playbook.",
    author: "Eccellere Research",
    date: "Dec 2024",
    readTime: "5 min read",
    featured: false,
    href: "/perspectives/lean-manufacturing-2025",
  },
];

export function Perspectives() {
  const [featured, ...rest] = articles;

  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Perspectives
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
              Insights for the{" "}
              <span className="italic">growth-minded</span>
            </h2>
          </div>
          <Link
            href="/perspectives"
            className="hidden text-sm font-medium text-eccellere-gold hover:underline sm:block"
          >
            All perspectives →
          </Link>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {/* Featured article — 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Link
              href={featured.href}
              className="group block rounded bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:p-10"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-eccellere-gold">
                {featured.category}
              </span>
              <h3 className="mt-3 font-display text-2xl font-light leading-snug text-eccellere-ink lg:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-mid">
                {featured.teaser}
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs text-ink-light">
                <span>{featured.author}</span>
                <span>·</span>
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
              <span className="mt-4 inline-block text-sm text-eccellere-gold opacity-0 transition-opacity group-hover:opacity-100">
                Read →
              </span>
            </Link>
          </motion.div>

          {/* Smaller articles */}
          <div className="flex flex-col gap-6">
            {rest.map((article, i) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1, duration: 0.5 }}
              >
                <Link
                  href={article.href}
                  className="group block rounded bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider text-eccellere-gold">
                    {article.category}
                  </span>
                  <h3 className="mt-2 text-base font-medium leading-snug text-eccellere-ink">
                    {article.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-light">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/perspectives"
            className="text-sm font-medium text-eccellere-gold hover:underline"
          >
            All perspectives →
          </Link>
        </div>
      </div>
    </section>
  );
}
