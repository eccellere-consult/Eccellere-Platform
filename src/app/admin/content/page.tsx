"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  Filter,
  Plus,
  Globe,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ContentItem = {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  status: "published" | "draft" | "scheduled";
  category: string;
  heroImage: string | null;
  readingTime: number | null;
  createdAt: string;
  publishedAt: string | null;
};

type ComposerState = {
  title: string;
  category: string;
  authorName: string;
  excerpt: string;
  content: string;
  tags: string;
  status: "draft" | "published" | "scheduled";
  scheduledAt: string;
};

const EMPTY_COMPOSER: ComposerState = {
  title: "",
  category: "Strategy",
  authorName: "Eccellere Team",
  excerpt: "",
  content: "",
  tags: "",
  status: "draft",
  scheduledAt: "",
};

const statusStyles: Record<string, string> = {
  published: "bg-eccellere-teal/10 text-eccellere-teal",
  draft: "bg-eccellere-ink/5 text-ink-mid",
  scheduled: "bg-eccellere-gold/10 text-eccellere-gold",
};

function fmtDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState<ComposerState>(EMPTY_COMPOSER);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load content");
      setItems(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.authorName.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, filterStatus]);

  const stats = useMemo(() => {
    return {
      published: items.filter((c) => c.status === "published").length,
      drafts: items.filter((c) => c.status === "draft").length,
      scheduled: items.filter((c) => c.status === "scheduled").length,
      total: items.length,
    };
  }, [items]);

  async function handleCreatePost() {
    setSaveError(null);
    setSaving(true);
    try {
      let heroImage: string | null = null;

      if (heroFile) {
        const fd = new FormData();
        fd.append("file", heroFile);
        fd.append("folder", "content");
        fd.append("category", "image");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        heroImage = uploadData.file?.url || null;
      }

      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          heroImage,
          tags: form.tags,
          scheduledAt: form.status === "scheduled" ? form.scheduledAt : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");

      setShowComposer(false);
      setForm(EMPTY_COMPOSER);
      setHeroFile(null);
      setHeroPreview(null);
      await fetchContent();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Content Management</h1>
          <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold">{items.length} items</span>
          <div className="flex-1" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowComposer(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Post
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Published", value: stats.published, color: "text-eccellere-teal" },
            { label: "Drafts", value: stats.drafts, color: "text-ink-mid" },
            { label: "Scheduled", value: stats.scheduled, color: "text-eccellere-gold" },
            { label: "Total Posts", value: stats.total.toLocaleString("en-IN"), color: "text-eccellere-ink" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-ink-light">{stat.label}</p>
              <p className={cn("mt-1 text-2xl font-light", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-light" />
            {["all", "published", "draft", "scheduled"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterStatus(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filterStatus === t ? "bg-eccellere-gold text-white" : "bg-white text-ink-mid hover:bg-eccellere-cream"
                )}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
          {loading && (
            <div className="flex items-center justify-center gap-2 border-b border-eccellere-ink/5 px-6 py-5 text-sm text-ink-light">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading content...
            </div>
          )}
          {error && !loading && (
            <div className="border-b border-eccellere-ink/5 px-6 py-5 text-sm text-eccellere-error">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-eccellere-ink/5">
                  <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Content</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Category</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Status</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Date</th>
                  <th className="px-6 py-3.5 text-left text-[10px] font-medium uppercase tracking-wider text-ink-light">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eccellere-ink/5">
                {filtered.map((item) => {
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-eccellere-cream/50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-eccellere-ink/5">
                            {item.heroImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.heroImage} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-ink-light" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-eccellere-ink">{item.title}</p>
                            <p className="text-xs text-ink-light">by {item.authorName} {item.readingTime ? `· ${item.readingTime} min read` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">{item.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider", statusStyles[item.status])}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-ink-mid">{fmtDate(item.publishedAt ?? item.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-ink-light">/{item.slug}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-light">No content matches your filters.</div>
          )}
        </div>
      </main>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-medium text-eccellere-ink">Create New Post</h2>
              <button
                onClick={() => {
                  setShowComposer(false);
                  setForm(EMPTY_COMPOSER);
                  setHeroFile(null);
                  setHeroPreview(null);
                  setSaveError(null);
                }}
                className="rounded p-1 text-ink-light hover:bg-eccellere-ink/5 hover:text-eccellere-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Category *</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Author</label>
                <input
                  value={form.authorName}
                  onChange={(e) => setForm((s) => ({ ...s, authorName: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Excerpt</label>
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((s) => ({ ...s, excerpt: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Content *</label>
                <textarea
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                  placeholder="Write the article content..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                  placeholder="Agentic AI, MSME, Strategy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ComposerState["status"] }))}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Schedule Date</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((s) => ({ ...s, scheduledAt: e.target.value }))}
                  disabled={form.status !== "scheduled"}
                  className="w-full rounded border border-eccellere-ink/10 px-3 py-2.5 text-sm focus:border-eccellere-gold focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-light">Hero Image</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-eccellere-ink/10 px-3 py-2 text-sm text-eccellere-ink hover:bg-eccellere-cream">
                    <Upload className="h-4 w-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setHeroFile(file);
                        if (!file) {
                          setHeroPreview(null);
                          return;
                        }
                        setHeroPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  {heroFile && <span className="text-xs text-ink-light">{heroFile.name}</span>}
                </div>
                {heroPreview && (
                  <div className="mt-3 h-40 w-full overflow-hidden rounded border border-eccellere-ink/10 bg-eccellere-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroPreview} alt="Hero preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {saveError && <p className="mt-4 text-sm text-eccellere-error">{saveError}</p>}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowComposer(false);
                  setForm(EMPTY_COMPOSER);
                  setHeroFile(null);
                  setHeroPreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={saving || !form.title.trim() || !form.content.trim() || !form.category.trim()}
                onClick={handleCreatePost}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Save Post
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
