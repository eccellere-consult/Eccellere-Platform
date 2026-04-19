"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, PlusCircle, X, FileCheck, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  "Strategy & Planning",
  "Process Transformation",
  "Financial Management",
  "Digital & Technology",
  "Organisation Design",
  "Agentic AI",
  "Sales & Marketing",
  "Supply Chain",
  "HR & Talent",
  "Other",
];

const FORMATS = ["PDF", "Excel / Spreadsheet", "PowerPoint", "Word Document", "ZIP Bundle"];

export default function SubmitNewAssetPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    tagline: "",
    category: "",
    format: "",
    price: "",
    description: "",
    targetAudience: "",
    tags: [] as string[],
    tagInput: "",
    termsAccepted: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // AI file analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  // Fallback: manual text description modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  async function analyzeFile(file: File) {
    setIsAnalyzing(true);
    setAnalyzeError("");
    setAiFilled(false);
    try {
      const data = new FormData();
      data.set("file", file);
      const res = await fetch("/api/specialist/assets/analyze", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      setForm((prev) => ({
        ...prev,
        title: json.title || prev.title,
        tagline: json.tagline || prev.tagline,
        category: json.category || prev.category,
        format: json.format || prev.format,
        price: json.price || prev.price,
        description: json.description || prev.description,
        targetAudience: json.targetAudience || prev.targetAudience,
        tags: json.tags?.length ? json.tags : prev.tags,
      }));
      setAiFilled(true);
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : "Could not analyze file. Please fill the form manually.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAiGenerate() {
    setAiError("");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/specialist/assets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setForm((prev) => ({
        ...prev,
        title: json.title || prev.title,
        tagline: json.tagline || prev.tagline,
        category: json.category || prev.category,
        format: json.format || prev.format,
        price: json.price || prev.price,
        description: json.description || prev.description,
        targetAudience: json.targetAudience || prev.targetAudience,
        tags: json.tags?.length ? json.tags : prev.tags,
      }));
      setShowAiModal(false);
      setAiPrompt("");
      setAiFilled(true);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setAiFilled(false);
    setAnalyzeError("");
    if (file) analyzeFile(file);
  }

  function addTag() {
    const tag = form.tagInput.trim();
    if (tag && !form.tags.includes(tag) && form.tags.length < 8) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
    }
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.set("title", form.title);
      data.set("tagline", form.tagline);
      data.set("category", form.category);
      data.set("format", form.format);
      data.set("price", form.price);
      data.set("description", form.description);
      data.set("targetAudience", form.targetAudience);
      data.set("tags", JSON.stringify(form.tags));
      if (selectedFile) data.set("file", selectedFile);

      const res = await fetch("/api/specialist/assets", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <div>
          <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-6 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eccellere-teal/10">
              <PlusCircle className="h-8 w-8 text-eccellere-teal" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-light text-eccellere-ink">
              Asset Submitted for Review
            </h1>
            <p className="mt-3 text-sm text-ink-light">
              <span className="font-medium text-eccellere-ink">{form.title}</span> has been
              submitted and is pending review. Our team typically reviews new assets within
              3–5 business days.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild variant="outline">
                <Link href="/specialist">Back to Portal</Link>
              </Button>
              <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-[800px] px-6 py-12 lg:py-16">
          {/* Breadcrumb */}
          <Link
            href="/specialist"
            className="inline-flex items-center gap-1.5 text-sm text-ink-light transition-colors hover:text-eccellere-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Specialist Portal
          </Link>

          {/* Page heading */}
          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Specialist Portal
            </p>
            <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
              Submit New Asset
            </h1>
            <p className="mt-2 text-sm text-ink-light">
              Upload your file — AI will read it and fill in the details automatically. Review,
              adjust, and submit for quality review.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            {/* ── Section 1: File Upload (top) ── */}
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-eccellere-ink">
                Upload Your Asset
              </h2>
              <p className="mt-1 text-xs text-ink-light">
                PDF, Excel, PowerPoint or Word files will be read by AI to auto-fill the form
                below. ZIP files require manual description.
              </p>
              <div className="mt-4">
                <label className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-10 transition-colors ${isAnalyzing ? "border-eccellere-gold/50 bg-eccellere-gold/5" : selectedFile ? "border-eccellere-gold/40 bg-eccellere-cream hover:border-eccellere-gold/60" : "border-eccellere-ink/20 bg-eccellere-cream hover:border-eccellere-gold/50"}`}>
                  {isAnalyzing ? (
                    <Loader2 className="h-8 w-8 animate-spin text-eccellere-gold" />
                  ) : selectedFile ? (
                    <FileCheck className="h-8 w-8 text-eccellere-gold" />
                  ) : (
                    <Upload className="h-8 w-8 text-ink-light" />
                  )}
                  <div className="text-center">
                    {isAnalyzing ? (
                      <>
                        <p className="text-sm font-medium text-eccellere-ink">
                          AI is reading your file…
                        </p>
                        <p className="mt-1 text-xs text-ink-light">
                          Extracting content and filling in the form
                        </p>
                      </>
                    ) : selectedFile ? (
                      <>
                        <p className="text-sm font-medium text-eccellere-ink">{selectedFile.name}</p>
                        <p className="mt-1 text-xs text-ink-light">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-eccellere-ink">
                          Click to upload or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-ink-light">
                          PDF, Excel, PowerPoint, Word or ZIP — max 50 MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc,.zip"
                    onChange={handleFileChange}
                    disabled={isAnalyzing}
                  />
                </label>

                {/* AI filled success banner */}
                {aiFilled && !analyzeError && (
                  <div className="mt-3 flex items-start gap-2.5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>
                      AI has filled in the form based on your file.{" "}
                      <strong>Please review and edit below before submitting.</strong>
                    </p>
                  </div>
                )}

                {/* Analyze error */}
                {analyzeError && (
                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p>{analyzeError}</p>
                    <button
                      type="button"
                      onClick={() => { setAnalyzeError(""); setAiError(""); setShowAiModal(true); }}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-eccellere-gold underline-offset-2 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      Describe your asset manually instead →
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ── Section 2: Core Details ── */}
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-eccellere-ink">
                Core Details
              </h2>
              {aiFilled && (
                <p className="mt-1 text-xs text-eccellere-gold">
                  Review the AI-generated values below and adjust as needed.
                </p>
              )}
              <div className="mt-5 space-y-5">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                  >
                    Asset Title <span className="text-eccellere-error">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. MSME Growth Strategy Playbook"
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label
                    htmlFor="tagline"
                    className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                  >
                    Tagline / One-liner <span className="text-eccellere-error">*</span>
                  </label>
                  <input
                    id="tagline"
                    name="tagline"
                    type="text"
                    required
                    maxLength={120}
                    value={form.tagline}
                    onChange={handleChange}
                    placeholder="A short description shown on the marketplace card"
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                  <p className="mt-1 text-right text-[11px] text-ink-light">
                    {form.tagline.length}/120
                  </p>
                </div>

                {/* Category + Format */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                    >
                      Category <span className="text-eccellere-error">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={form.category}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="format"
                      className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                    >
                      File Format <span className="text-eccellere-error">*</span>
                    </label>
                    <select
                      id="format"
                      name="format"
                      required
                      value={form.format}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    >
                      <option value="" disabled>
                        Select format
                      </option>
                      {FORMATS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                  >
                    Listing Price (₹) <span className="text-eccellere-error">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-light">
                      ₹
                    </span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="e.g. 4999"
                      className="w-full rounded border border-eccellere-ink/15 bg-eccellere-cream py-2.5 pl-7 pr-3 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Section 3: Description ── */}
            <section className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-eccellere-ink">
                Description
              </h2>
              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="description"
                    className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                  >
                    Full Description <span className="text-eccellere-error">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={6}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe what this asset contains, what problem it solves, and who benefits most from it..."
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetAudience"
                    className="block text-xs font-medium uppercase tracking-wider text-ink-light"
                  >
                    Target Audience
                  </label>
                  <input
                    id="targetAudience"
                    name="targetAudience"
                    type="text"
                    value={form.targetAudience}
                    onChange={handleChange}
                    placeholder="e.g. MSME founders, CFOs, operations managers"
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                    Tags{" "}
                    <span className="normal-case tracking-normal text-ink-light/60">
                      (up to 8)
                    </span>
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      name="tagInput"
                      value={form.tagInput}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Type a tag and press Enter"
                      className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-sm bg-gold-pale px-2 py-0.5 text-xs text-eccellere-ink"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-ink-light hover:text-eccellere-error"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Terms + Submit ── */}
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={handleChange}
                  required
                  className="mt-0.5 h-4 w-4 accent-eccellere-gold"
                />
                <span className="text-sm text-ink-light">
                  I confirm this asset is my original work and I agree to the{" "}
                  <Link href="/legal/specialist-terms" className="text-eccellere-gold hover:underline">
                    Specialist Submission Terms
                  </Link>
                  .
                </span>
              </label>

              {submitError && (
                <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" disabled={!form.termsAccepted || isSubmitting || isAnalyzing}>
                  {isSubmitting ? "Submitting…" : "Submit for Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={() => router.push("/specialist")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── AI Fill Modal ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-eccellere-gold" />
                <h2 className="text-base font-semibold text-eccellere-ink">AI Fill</h2>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="rounded p-1 text-ink-light hover:text-eccellere-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-mid">
              Describe your asset in your own words — what it covers, who it&apos;s for, and
              what problem it solves. The AI will generate a complete draft for you to review
              before submitting.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={6}
              placeholder="e.g. A step-by-step playbook I built for MSME manufacturers looking to reduce waste on their production floor. It covers lean assessment, value stream mapping, and a 90-day implementation roadmap. Includes Excel templates for tracking OEE and a PowerPoint for team communication."
              className="mt-4 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
            <p className="mt-1 text-right text-[11px] text-ink-light">{aiPrompt.length}/2000</p>
            {aiError && (
              <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {aiError}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowAiModal(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={isGenerating || aiPrompt.trim().length < 20}
                className="gap-2"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Draft</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
