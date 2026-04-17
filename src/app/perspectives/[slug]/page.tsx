import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, User, Tag, ArrowLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { articles, type ContentBlock } from "@/lib/perspectives-data";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.teaser,
  };
}

const categoryColors: Record<string, string> = {
  "Agentic AI": "bg-eccellere-purple/10 text-eccellere-purple",
  Strategy: "bg-eccellere-gold/10 text-eccellere-gold",
  Manufacturing: "bg-eccellere-teal/10 text-eccellere-teal",
  Retail: "bg-eccellere-info/10 text-eccellere-info",
  Digital: "bg-eccellere-info/10 text-eccellere-info",
  Leadership: "bg-amber-100 text-amber-700",
};

function ContentBlock({ block }: { block: ContentBlock }) {
  if (block.type === "heading") {
    return (
      <h2 className="mt-10 font-display text-2xl font-light text-eccellere-ink">
        {block.text}
      </h2>
    );
  }
  if (block.type === "callout") {
    return (
      <blockquote className="my-8 border-l-4 border-eccellere-gold bg-eccellere-gold/5 px-6 py-5">
        <p className="font-display text-lg font-light italic text-eccellere-ink">
          {block.text}
        </p>
      </blockquote>
    );
  }
  return (
    <p className="mt-4 text-base leading-relaxed text-ink-mid">{block.text}</p>
  );
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = article.relatedSlugs
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter(Boolean)
    .slice(0, 3) as typeof articles;

  const catColor = categoryColors[article.category] ?? "bg-eccellere-ink/10 text-eccellere-ink";

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        {/* Breadcrumb */}
        <div className="border-b border-eccellere-ink/5 bg-white">
          <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-2 px-6 text-sm text-ink-light">
            <Link href="/perspectives" className="flex items-center gap-1 hover:text-eccellere-gold transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Perspectives
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${catColor}`}>{article.category}</span>
          </div>
        </div>

        {/* Article hero */}
        <section className="bg-eccellere-ink py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <span className={`inline-block rounded px-3 py-1 text-xs font-medium ${catColor} ring-1 ring-white/10`}>
              {article.category}
            </span>
            <h1 className="mt-6 font-display text-[clamp(24px,4vw,48px)] font-light leading-tight text-eccellere-cream">
              {article.title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/50">{article.teaser}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {article.readTime}
              </span>
              <span>{article.date}</span>
            </div>
          </div>
        </section>

        {/* Article body */}
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
            {/* Main content */}
            <article className="prose-sm max-w-none">
              <div className="rounded-lg bg-white p-8 shadow-sm lg:p-12">
                {article.content.map((block, i) => (
                  <ContentBlock key={i} block={block} />
                ))}

                {/* Article footer */}
                <div className="mt-12 border-t border-eccellere-ink/5 pt-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="h-4 w-4 text-ink-light" />
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm bg-eccellere-ink/5 px-2.5 py-1 text-xs text-ink-mid"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 rounded-lg bg-eccellere-purple p-8 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                  Ready to act on these insights?
                </p>
                <h3 className="mt-3 font-display text-2xl font-light text-white">
                  Take the free AI Readiness Assessment
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                  5 questions. 2 minutes. Get a personalised score and roadmap for your sector.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button asChild size="lg">
                    <Link href="/assessment">Start Assessment →</Link>
                  </Button>
                  <Button asChild variant="ghostLight" size="lg">
                    <Link href="/contact">Talk to Us</Link>
                  </Button>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Author card */}
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-light">Written by</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 text-sm font-medium text-eccellere-gold">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-eccellere-ink">{article.author}</p>
                    <p className="text-xs text-ink-light">{article.authorRole}</p>
                  </div>
                </div>
              </div>

              {/* Marketplace CTA */}
              <div className="rounded-lg border border-eccellere-gold/20 bg-eccellere-gold/5 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-eccellere-gold">
                  Related resources
                </p>
                <p className="mt-2 text-sm text-ink-mid">
                  Download frameworks and toolkits related to this topic from the Eccellere Marketplace.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>

              {/* Newsletter */}
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-eccellere-ink">Weekly MSME insights</p>
                <p className="mt-1 text-xs text-ink-light">
                  Strategy, AI, and transformation perspectives — every Monday.
                </p>
                <form className="mt-3 space-y-2">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    required
                    className="w-full rounded border border-eccellere-ink/10 bg-eccellere-cream px-3 py-2 text-xs text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none"
                  />
                  <Button size="sm" className="w-full" type="submit">
                    Subscribe
                  </Button>
                </form>
              </div>
            </aside>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-16 border-t border-eccellere-ink/5 pt-12">
              <h2 className="font-display text-2xl font-light text-eccellere-ink">Related perspectives</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => {
                  const rColor = categoryColors[r.category] ?? "bg-eccellere-ink/10 text-eccellere-ink";
                  return (
                    <Link
                      key={r.id}
                      href={`/perspectives/${r.slug}`}
                      className="group rounded-lg bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${rColor}`}>{r.category}</span>
                      <h3 className="mt-3 text-sm font-medium leading-snug text-eccellere-ink group-hover:text-eccellere-gold transition-colors">
                        {r.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-3 text-xs text-ink-light">
                        <span>{r.readTime}</span>
                        <span>·</span>
                        <span>{r.date}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
