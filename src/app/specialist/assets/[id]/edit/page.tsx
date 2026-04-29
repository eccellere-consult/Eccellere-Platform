"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CheckCircle2, X, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_SECTORS } from "@/lib/sectors";

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

interface FormState {
  title: string;
  price: string;
  aboutResource: string;
  whatIncluded: string[];
  contentsPreview: string[];
  whatIncludedInput: string;
  contentsPreviewInput: string;
  targetAudience: string;
  tags: string[];
  tagInput: string;
  category: string;
  format: string;
  targetSectors: string[];
}

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assetId = params.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [resubmitting, setResubmitting] = useState(false);
  const [assetStatus, setAssetStatus] = useState("");

  const [form, setForm] = useState<FormState>({
    title: "",
    price: "",
    aboutResource: "",
    whatIncluded: [],
    contentsPreview: [],
    whatIncludedInput: "",
    contentsPreviewInput: "",
    targetAudience: "",
    tags: [],
    tagInput: "",
    category: "",
    format: "",
    targetSectors: [],
  });

  const loadAsset = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/specialist/assets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const asset = (data.assets ?? []).find((a: { id: string }) => a.id === assetId);
      if (!asset) throw new Error("Asset not found");
      setAssetStatus(asset.status ?? "");
      setForm({
        title: asset.title ?? "",
        price: String(asset.price ?? ""),
        aboutResource: asset.aboutResource ?? "",
        whatIncluded: Array.isArray(asset.whatIncluded) ? asset.whatIncluded : [],
        contentsPreview: Array.isArray(asset.contentsPreview) ? asset.contentsPreview : [],
        whatIncludedInput: "",
        contentsPreviewInput: "",
        targetAudience: asset.targetAudience ?? "",
        tags: Array.isArray(asset.tags) ? asset.tags : [],
        tagInput: "",
        category: asset.serviceDomain ?? "",
        format: Array.isArray(asset.components) && asset.components.length > 0 ? asset.components[0] : "",
        targetSectors: Array.isArray(asset.targetSectors) ? asset.targetSectors : [],
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load asset");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => { loadAsset(); }, [loadAsset]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addListItem(field: "whatIncluded" | "contentsPreview", inputField: "whatIncludedInput" | "contentsPreviewInput") {
    const val = form[inputField].trim();
    if (val && form[field].length < 10) {
      setForm((prev) => ({ ...prev, [field]: [...prev[field], val], [inputField]: "" }));
    }
  }

  function removeListItem(field: "whatIncluded" | "contentsPreview", index: number) {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
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

  function toggleSector(sector: string) {
    setForm((prev) => ({
      ...prev,
      targetSectors: prev.targetSectors.includes(sector)
        ? prev.targetSectors.filter((s) => s !== sector)
        : [...prev.targetSectors, sector],
    }));
  }

  async function handleResubmit() {
    setSaveError("");
    setResubmitting(true);
    try {
      const res = await fetch("/api/specialist/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, action: "resubmit" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Re-submit failed");
      setAssetStatus("SUBMITTED");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setResubmitting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    try {
      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) throw new Error("Please enter a valid price.");
      if (form.targetSectors.length === 0) {
        throw new Error("Select at least one applicable sector.");
      }

      const res = await fetch("/api/specialist/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          title: form.title,
          price: priceNum,
          aboutResource: form.aboutResource,
          whatIncluded: form.whatIncluded,
          contentsPreview: form.contentsPreview,
          targetAudience: form.targetAudience,
          tags: form.tags,
          targetSectors: form.targetSectors,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const editableStatuses = ["DRAFT", "SUBMITTED", "REJECTED", "RECALLED"];
  const canEdit = editableStatuses.includes(assetStatus);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-eccellere-gold" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-16 text-center">
        <p className="text-sm text-eccellere-error">{loadError}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-[800px] px-6 py-12 lg:py-16">
        <Link
          href="/specialist/assets"
          className="inline-flex items-center gap-1.5 text-sm text-ink-light transition-colors hover:text-eccellere-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Assets
        </Link>

        <div className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Specialist Portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
            Edit Asset Listing
          </h1>
          <p className="mt-2 text-sm text-ink-light">
            Update the description, pricing and listing sections for this asset.
          </p>
        </div>

        {!canEdit && (
          <div className="mt-6 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              This asset is <strong>{assetStatus}</strong> and cannot be edited. Contact support if you need to make changes.
            </p>
          </div>
        )}

        {assetStatus === "RECALLED" && (
          <div className="mt-6 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              This asset has been <strong>recalled</strong> and is hidden from the marketplace. Edit the details below, then re-submit for review when ready.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-10 space-y-8">
          {/* Core Details */}
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-eccellere-ink">
              Core Details
            </h2>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="title" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Asset Title <span className="text-eccellere-error">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  disabled={!canEdit}
                  value={form.title}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    disabled={!canEdit}
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="format" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                    File Format
                  </label>
                  <select
                    id="format"
                    name="format"
                    disabled={!canEdit}
                    value={form.format}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                  >
                    <option value="" disabled>Select format</option>
                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Listing Price (₹) <span className="text-eccellere-error">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-light">₹</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    required
                    min="0"
                    step="100"
                    disabled={!canEdit}
                    value={form.price}
                    onChange={handleChange}
                    className="w-full rounded border border-eccellere-ink/15 bg-eccellere-cream py-2.5 pl-7 pr-3 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Marketplace Listing */}
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-eccellere-ink">
              Marketplace Listing
            </h2>
            <p className="mt-1 text-xs text-ink-light">
              These three sections appear on the asset detail page in the marketplace exactly as you write them.
            </p>
            <div className="mt-5 space-y-6">

              {/* About This Resource */}
              <div>
                <label htmlFor="aboutResource" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  About This Resource <span className="text-eccellere-error">*</span>
                </label>
                <p className="mt-0.5 text-[11px] text-ink-light/70">
                  2–4 sentences. What does this resource do and why does it matter for Indian businesses?
                </p>
                <textarea
                  id="aboutResource"
                  name="aboutResource"
                  required
                  rows={5}
                  disabled={!canEdit}
                  value={form.aboutResource}
                  onChange={handleChange}
                  placeholder="Save hours every week with 100+ business-ready prompts for ChatGPT, Claude, and Gemini..."
                  className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                />
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  What&apos;s Included{" "}
                  <span className="normal-case tracking-normal text-ink-light/60">(up to 10 items)</span>
                </label>
                <p className="mt-0.5 text-[11px] text-ink-light/70">
                  List each deliverable — PDF, template, checklist, access duration, etc.
                </p>
                {canEdit && (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      name="whatIncludedInput"
                      value={form.whatIncludedInput}
                      onChange={handleChange}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addListItem("whatIncluded", "whatIncludedInput"); } }}
                      placeholder="e.g. 100+ categorised business prompts (PDF)"
                      className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addListItem("whatIncluded", "whatIncludedInput")}>Add</Button>
                  </div>
                )}
                {form.whatIncluded.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {form.whatIncluded.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 rounded bg-eccellere-cream px-3 py-2 text-sm text-eccellere-ink">
                        <span className="flex-1">• {item}</span>
                        {canEdit && (
                          <button type="button" onClick={() => removeListItem("whatIncluded", i)} className="text-ink-light hover:text-eccellere-error">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Contents Preview */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Contents Preview{" "}
                  <span className="normal-case tracking-normal text-ink-light/60">(up to 10 sections)</span>
                </label>
                <p className="mt-0.5 text-[11px] text-ink-light/70">
                  List the main sections or chapters buyers will see before purchasing.
                </p>
                {canEdit && (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      name="contentsPreviewInput"
                      value={form.contentsPreviewInput}
                      onChange={handleChange}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addListItem("contentsPreview", "contentsPreviewInput"); } }}
                      placeholder="e.g. Section 1: Sales and business development prompts"
                      className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addListItem("contentsPreview", "contentsPreviewInput")}>Add</Button>
                  </div>
                )}
                {form.contentsPreview.length > 0 && (
                  <ol className="mt-2 space-y-1.5">
                    {form.contentsPreview.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 rounded bg-eccellere-cream px-3 py-2 text-sm text-eccellere-ink">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 text-[10px] font-medium text-eccellere-gold">
                          {i + 1}
                        </span>
                        <span className="flex-1">{item}</span>
                        {canEdit && (
                          <button type="button" onClick={() => removeListItem("contentsPreview", i)} className="text-ink-light hover:text-eccellere-error">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="targetAudience" className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Target Audience
                </label>
                <input
                  id="targetAudience"
                  name="targetAudience"
                  type="text"
                  disabled={!canEdit}
                  value={form.targetAudience}
                  onChange={handleChange}
                  placeholder="e.g. MSME founders, CFOs, operations managers"
                  className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold disabled:opacity-50"
                />
              </div>

              {/* Applicable Sectors */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Applicable Sectors <span className="text-eccellere-error">*</span>
                </label>
                <p className="mt-1 text-xs text-ink-light/70">
                  Tick every sector this asset is relevant to. Buyers in those sectors will see it in the marketplace.
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MARKETPLACE_SECTORS.map((sector) => {
                    const checked = form.targetSectors.includes(sector);
                    return (
                      <label
                        key={sector}
                        className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition ${
                          checked
                            ? "border-eccellere-gold bg-eccellere-gold/10 text-eccellere-ink"
                            : "border-eccellere-ink/15 bg-eccellere-cream text-eccellere-ink hover:border-eccellere-gold/60"
                        } ${!canEdit ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEdit}
                          onChange={() => toggleSector(sector)}
                          className="h-4 w-4 rounded border-eccellere-ink/30 text-eccellere-gold focus:ring-eccellere-gold"
                        />
                        <span>{sector}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                  Tags <span className="normal-case tracking-normal text-ink-light/60">(up to 8)</span>
                </label>
                {canEdit && (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      name="tagInput"
                      value={form.tagInput}
                      onChange={handleChange}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Type a tag and press Enter"
                      className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                  </div>
                )}
                {form.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-gold-pale px-2 py-0.5 text-xs text-eccellere-ink">
                        {tag}
                        {canEdit && (
                          <button type="button" onClick={() => removeTag(tag)} className="text-ink-light hover:text-eccellere-error">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Save */}
          {canEdit && (
            <div className="space-y-3">
              {saveError && (
                <p className="text-sm text-eccellere-error">{saveError}</p>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 text-sm text-eccellere-teal">
                  <CheckCircle2 className="h-4 w-4" />
                  {assetStatus === "SUBMITTED" ? "Re-submitted for review." : "Changes saved successfully."}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" type="button" onClick={() => router.push("/specialist/assets")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
                </Button>
                {assetStatus === "RECALLED" && (
                  <Button
                    type="button"
                    disabled={resubmitting}
                    onClick={handleResubmit}
                    className="bg-eccellere-teal hover:bg-eccellere-teal/90"
                  >
                    {resubmitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                      : <><Send className="mr-2 h-4 w-4" />Re-submit for Review</>
                    }
                  </Button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
