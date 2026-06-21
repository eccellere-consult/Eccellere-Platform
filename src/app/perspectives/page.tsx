"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Clock, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { articles } from "@/lib/perspectives-data";

type PerspectiveItem = {
  id: string;
  slug: string;
  title: string;
  teaser: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  heroImage: string | null;
  featured?: boolean;
};

type LivePerspectivePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  authorName: string;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  readingTime: number | null;
  heroImage: string | null;
};

type LivePerspectiveResponse = {
  posts?: LivePerspectivePost[];
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function mapStaticArticle(article: (typeof articles)[number]): PerspectiveItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    teaser: article.teaser,
    category: article.category,
    author: article.author,
    date: article.date,
    readTime: article.readTime,
    heroImage: article.heroImage || null,
    featured: article.featured,
  };
}

const categories = [
  "All",
  "Agentic AI",
  "Strategy",
  "Manufacturing",
  "Retail",
  "Digital",
  "Leadership",
];

export default function PerspectivesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [livePosts, setLivePosts] = useState<PerspectiveItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      try {
        const res = await fetch("/api/perspectives", { cache: "no-store" });
        const data = (await res.json()) as LivePerspectiveResponse;
        if (!res.ok) return;
        if (!active) return;

        const mapped = Array.isArray(data.posts)
          ? data.posts.map((post) => ({
              id: post.id,
              slug: post.slug,
              title: post.title,
              teaser: post.excerpt || "",
              category: post.category,
              author: post.authorName || "Eccellere Team",
              date: formatDate(post.publishedAt || post.createdAt),
              readTime: post.readingTime ? `${post.readingTime} min read` : "",
              heroImage: post.heroImage || null,
            }))
          : [];

        setLivePosts(mapped);
      } catch {
        // Keep static seed content if live fetch fails.
      }
    }

    loadPosts();
    return () => {
      active = false;
    };
  }, []);

  const allArticles = useMemo(() => {
    const merged = new Map<string, PerspectiveItem>();

    articles.map(mapStaticArticle).forEach((item) => {
      merged.set(item.slug, item);
    });

    livePosts.forEach((item) => {
      const existing = merged.get(item.slug);
      merged.set(item.slug, {
        ...item,
        heroImage: item.heroImage || existing?.heroImage || null,
        featured: existing?.featured ?? item.featured,
      });
    });

    return Array.from(merged.values());
  }, [livePosts]);

  const filtered = allArticles.filter((a) => {
    const matchCategory =
      selectedCategory === "All" || a.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.teaser.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featured = filtered.find((a) => a.featured);
  const rest = filtered.filter((a) => !a.featured);

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        {/* Hero */}
        <section className="bg-eccellere-ink py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Perspectives
            </p>
            <h1 className="mt-4 font-display text-[clamp(32px,6vw,64px)] font-light leading-tight text-eccellere-cream">
              Insights for the{" "}
              <span className="italic text-eccellere-gold">growth-minded</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/50">
              Strategy, AI, and transformation perspectives — written for
              Indian MSMEs, founders, and operators.
            </p>

            {/* Search */}
            <div className="mx-auto mt-10 flex max-w-lg items-center gap-2 rounded bg-white/10 px-4">
              <Search className="h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-[1280px] px-6 py-12">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 border-b border-eccellere-ink/10 pb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === cat
                    ? "bg-eccellere-ink text-white"
                    : "text-ink-mid hover:bg-eccellere-ink/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {/* Featured article */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
              >
                <Link
                  href={`/perspectives/${featured.slug}`}
                  className="group block rounded bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:p-10"
                >
                  {featured.heroImage && (
                    <div className="mb-6 aspect-[3/2] overflow-hidden rounded-md bg-eccellere-cream">
                      <Image
                        src={featured.heroImage}
                        alt={featured.title}
                        width={1536}
                        height={1024}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <span className="inline-block rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-eccellere-gold">
                    Featured · {featured.category}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-light leading-snug text-eccellere-ink lg:text-4xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-mid">
                    {featured.teaser}
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-xs text-ink-light">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {featured.author}
                    </span>
                    <span>{featured.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featured.readTime}
                    </span>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Article grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={`/perspectives/${article.slug}`}
                    className="group block h-full rounded bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {article.heroImage && (
                      <div className="mb-4 aspect-[3/2] overflow-hidden rounded bg-eccellere-cream">
                        <Image
                          src={article.heroImage}
                          alt={article.title}
                          width={1536}
                          height={1024}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <span className="text-[10px] font-medium uppercase tracking-wider text-eccellere-gold">
                      {article.category}
                    </span>
                    <h3 className="mt-3 text-base font-medium leading-snug text-eccellere-ink">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-mid">
                      {article.teaser}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-ink-light">
                      <span>{article.date}</span>
                      <span>·</span>
                      <span>{article.readTime}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-lg text-ink-mid">No articles found.</p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="mt-4 text-sm text-eccellere-gold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-eccellere-ink py-16">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h2 className="font-display text-2xl font-light text-eccellere-cream lg:text-3xl">
              Get weekly insights{" "}
              <span className="italic text-eccellere-gold">
                delivered to your inbox
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
              Strategy, AI, and transformation perspectives curated for Indian
              MSMEs and founders. No spam. Unsubscribe anytime.
            </p>
            <form
              className="mx-auto mt-8 flex max-w-md gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@company.com"
                required
                className="flex-1 rounded-none border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
              />
              <button
                type="submit"
                className="bg-eccellere-gold px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-light"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
