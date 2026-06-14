"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, ChevronLeft, Plus, Copy, Tag, Calendar,
  Percent, IndianRupee, X, ToggleLeft, ToggleRight, Trash2, Pencil, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number | null;
  applicableCategories: string[];
  applicableSectors: string[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
};

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxUses: "",
  minOrderAmount: "",
  applicableCategories: "",
  applicableSectors: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

type FormState = typeof EMPTY_FORM;

const statusLabel = (c: CouponRow) => {
  if (!c.isActive) return "inactive";
  const now = new Date();
  if (now < new Date(c.validFrom)) return "draft";
  if (now > new Date(c.validUntil)) return "expired";
  return "active";
};

const statusStyles: Record<string, string> = {
  active: "bg-eccellere-teal/10 text-eccellere-teal",
  expired: "bg-eccellere-ink/5 text-ink-light",
  draft: "bg-eccellere-gold/10 text-eccellere-gold",
  inactive: "bg-eccellere-ink/5 text-ink-light",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to load coupons");
      const data = await res.json();
      setCoupons(data.coupons);
    } catch {
      setError("Could not load coupons. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const filtered = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && statusLabel(c) === filterStatus;
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (c: CouponRow) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxUses: c.maxUses !== null ? String(c.maxUses) : "",
      minOrderAmount: c.minOrderAmount !== null ? String(c.minOrderAmount) : "",
      applicableCategories: (c.applicableCategories ?? []).join(", "),
      applicableSectors: (c.applicableSectors ?? []).join(", "),
      validFrom: c.validFrom.slice(0, 10),
      validUntil: c.validUntil.slice(0, 10),
      isActive: c.isActive,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue || !form.validFrom || !form.validUntil) {
      setFormError("Code, discount value, and validity dates are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      code: form.code,
      description: form.description || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      applicableCategories: form.applicableCategories
        ? form.applicableCategories.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      applicableSectors: form.applicableSectors
        ? form.applicableSectors.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      isActive: form.isActive,
    };
    try {
      const url = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Save failed"); return; }
      setShowModal(false);
      fetchCoupons();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: CouponRow) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchCoupons();
  };

  const handleDelete = async (c: CouponRow) => {
    if (!confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Delete failed");
    fetchCoupons();
  };

  const activeCoupons = coupons.filter((c) => statusLabel(c) === "active");
  const totalRedemptions = coupons.reduce((s, c) => s + c.usedCount, 0);

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Coupons & Discounts</h1>
          <span className="rounded-full bg-eccellere-gold/10 px-2 py-0.5 text-xs text-eccellere-gold">
            {activeCoupons.length} active
          </span>
          <div className="flex-1" />
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create Coupon
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active Coupons", value: activeCoupons.length, color: "text-eccellere-teal" },
            { label: "Total Redemptions", value: totalRedemptions.toLocaleString("en-IN"), color: "text-eccellere-ink" },
            { label: "Draft / Upcoming", value: coupons.filter((c) => statusLabel(c) === "draft").length, color: "text-eccellere-gold" },
            { label: "Expired", value: coupons.filter((c) => statusLabel(c) === "expired").length, color: "text-ink-light" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-ink-light">{stat.label}</p>
              <p className={cn("mt-1 text-2xl font-light", stat.color)}>
                {loading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-eccellere-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            {["all", "active", "draft", "expired", "inactive"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filterStatus === s ? "bg-eccellere-gold text-white" : "bg-white text-ink-mid hover:bg-eccellere-cream"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-eccellere-gold" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((coupon) => {
                const status = statusLabel(coupon);
                return (
                  <div key={coupon.id} className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="border-b border-dashed border-eccellere-ink/10 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-eccellere-ink/5 px-2 py-1 font-mono text-sm font-semibold text-eccellere-ink">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => copyCode(coupon.code)}
                              className="rounded p-1 text-ink-light hover:bg-eccellere-cream hover:text-eccellere-ink"
                              title="Copy code"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {copied === coupon.code && (
                              <span className="text-[10px] text-eccellere-teal">Copied!</span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-ink-mid">{coupon.description ?? "—"}</p>
                        </div>
                        <span className={cn("rounded-sm px-2 py-0.5 text-[9px] uppercase tracking-wider", statusStyles[status])}>
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-ink-light">
                          {coupon.discountType === "percentage" ? <Percent className="h-3 w-3" /> : <IndianRupee className="h-3 w-3" />}
                          Discount
                        </span>
                        <span className="font-mono text-sm font-semibold text-eccellere-gold">
                          {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </span>
                      </div>

                      {(coupon.applicableCategories?.length > 0) && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-ink-light">
                            <Tag className="h-3 w-3" /> Applies to
                          </span>
                          <span className="text-xs text-ink-mid">{coupon.applicableCategories.join(", ")}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-ink-light">
                          <Calendar className="h-3 w-3" /> Valid
                        </span>
                        <span className="text-xs text-ink-mid">
                          {new Date(coupon.validFrom).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} –{" "}
                          {new Date(coupon.validUntil).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-ink-light">Usage</span>
                          <span className="text-ink-mid">
                            {coupon.usedCount}{coupon.maxUses !== null ? `/${coupon.maxUses}` : ""}
                          </span>
                        </div>
                        {coupon.maxUses !== null && (
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-eccellere-ink/5">
                            <div
                              className={cn("h-full rounded-full transition-all",
                                coupon.usedCount >= coupon.maxUses ? "bg-eccellere-error" : "bg-eccellere-gold"
                              )}
                              style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {coupon.minOrderAmount != null && coupon.minOrderAmount > 0 && (
                        <p className="text-[10px] text-ink-light">
                          Min. order: ₹{coupon.minOrderAmount.toLocaleString("en-IN")}
                        </p>
                      )}

                      <div className="flex items-center gap-2 border-t border-eccellere-ink/5 pt-3">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-ink-mid hover:bg-eccellere-cream"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggle(coupon)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] text-ink-mid hover:bg-eccellere-cream"
                        >
                          {coupon.isActive
                            ? <><ToggleRight className="h-3 w-3 text-eccellere-teal" /> Deactivate</>
                            : <><ToggleLeft className="h-3 w-3" /> Activate</>}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-[10px] text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="mt-6 rounded-lg bg-white py-12 text-center text-sm text-ink-light shadow-sm">
                No coupons match your filters.
              </div>
            )}
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-4">
              <h2 className="font-medium text-eccellere-ink">{editId ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={() => setShowModal(false)} className="rounded p-1 text-ink-light hover:bg-eccellere-cream">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {formError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Coupon Code *">
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME20" className={inputCls} />
                </Field>
                <Field label="Discount Type *">
                  <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className={inputCls}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </Field>
                <Field label={`Discount Value * (${form.discountType === "percentage" ? "%" : "₹"})`}>
                  <input type="number" min="0" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 500"} className={inputCls} />
                </Field>
                <Field label="Max Uses (blank = unlimited)">
                  <input type="number" min="0" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="e.g. 500" className={inputCls} />
                </Field>
                <Field label="Min Order Amount ₹">
                  <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="e.g. 999" className={inputCls} />
                </Field>
                <Field label="Status">
                  <select value={form.isActive ? "active" : "inactive"} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "active" }))} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
                <Field label="Valid From *">
                  <input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Valid Until *">
                  <input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <Field label="Description">
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Welcome discount for new clients" className={inputCls} />
              </Field>
              <Field label="Applicable Categories (comma-separated, blank = all)">
                <input value={form.applicableCategories} onChange={(e) => setForm((f) => ({ ...f, applicableCategories: e.target.value }))} placeholder="e.g. Strategy, Agentic AI" className={inputCls} />
              </Field>
              <Field label="Applicable Sectors (comma-separated, blank = all)">
                <input value={form.applicableSectors} onChange={(e) => setForm((f) => ({ ...f, applicableSectors: e.target.value }))} placeholder="e.g. Manufacturing, MSME" className={inputCls} />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-eccellere-ink/5 px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="min-w-[80px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-eccellere-ink/10 bg-eccellere-cream/50 px-3 py-2 text-sm text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink-light">{label}</label>
      {children}
    </div>
  );
}
