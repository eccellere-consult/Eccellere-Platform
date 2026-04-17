"use client";

import { useState } from "react";
import { User, Building2, CreditCard, Bell, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

const SECTORS = [
  "Manufacturing",
  "Retail & Consumer",
  "Logistics & Supply Chain",
  "Financial Services",
  "Healthcare",
  "Technology",
  "Other",
];

const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-light">Manage your profile, billing, and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Tab nav */}
        <nav className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-eccellere-ink/5 px-4 py-3.5 text-left text-sm transition-colors last:border-0",
                  activeTab === tab.id
                    ? "bg-eccellere-gold/5 text-eccellere-gold font-medium"
                    : "text-ink-mid hover:bg-eccellere-cream"
                )}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile */}
          {activeTab === "profile" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">Personal Information</h2>
                {/* Avatar */}
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eccellere-gold text-xl font-semibold text-white">
                    RK
                  </div>
                  <Button type="button" variant="outline" size="sm" className="text-xs">
                    Change Photo
                  </Button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { id: "firstName", label: "First Name", value: "Rahul" },
                    { id: "lastName", label: "Last Name", value: "Kumar" },
                    { id: "email", label: "Email Address", value: "rahul.kumar@example.com", type: "email" },
                    { id: "phone", label: "Phone", value: "+91 98765 43210" },
                    { id: "city", label: "City", value: "Bengaluru" },
                    { id: "state", label: "State", value: "Karnataka" },
                  ].map((f) => (
                    <div key={f.id}>
                      <label htmlFor={f.id} className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                        {f.label}
                      </label>
                      <input
                        id={f.id}
                        type={f.type ?? "text"}
                        defaultValue={f.value}
                        className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Save Changes</Button>
                {saved && <span className="text-sm text-eccellere-teal">✓ Saved successfully</span>}
              </div>
            </form>
          )}

          {/* Business */}
          {activeTab === "business" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">Business Details</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      Company Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Kumar Manufacturing Pvt Ltd"
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      Sector
                    </label>
                    <div className="relative mt-1.5">
                      <select className="w-full appearance-none rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold">
                        {SECTORS.map((s) => (
                          <option key={s} selected={s === "Manufacturing"}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      Company Size
                    </label>
                    <div className="relative mt-1.5">
                      <select className="w-full appearance-none rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold">
                        {SIZES.map((s) => (
                          <option key={s} selected={s === "51–200"}>{s} employees</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-light" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      placeholder="29ABCDE1234F1Z5"
                      defaultValue="29AKMPK4321B1Z3"
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Save Changes</Button>
                {saved && <span className="text-sm text-eccellere-teal">✓ Saved successfully</span>}
              </div>
            </form>
          )}

          {/* Billing */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              {/* Current plan */}
              <div className="rounded-lg bg-eccellere-ink p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-eccellere-gold">
                      Current Plan
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-light text-white">Growth Plan</h2>
                    <p className="mt-1 text-sm text-white/60">
                      ₹4,999/month · Renews May 14, 2026
                    </p>
                  </div>
                  <span className="rounded-sm bg-eccellere-gold/20 px-3 py-1 text-xs font-medium text-eccellere-gold">
                    Active
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-white/70">
                  {["Unlimited marketplace downloads", "2 specialist consultations/month", "AI Advisor access", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-eccellere-teal">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 text-xs">
                    Upgrade to Accelerator
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/50 hover:text-white text-xs">
                    Cancel Plan
                  </Button>
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">Payment Method</h2>
                <div className="mt-4 flex items-center justify-between rounded border border-eccellere-ink/10 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-12 items-center justify-center rounded bg-eccellere-ink/5 text-[10px] font-bold text-ink-mid">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm text-eccellere-ink">•••• •••• •••• 4242</p>
                      <p className="text-xs text-ink-light">Expires 09/2028</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-eccellere-gold">Update</Button>
                </div>
                <Button variant="outline" size="sm" className="mt-3 text-xs">
                  + Add Payment Method
                </Button>
              </div>

              {/* Billing history */}
              <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-eccellere-ink/5 px-6 py-4">
                  <h2 className="text-sm font-medium text-eccellere-ink">Billing History</h2>
                </div>
                <div className="divide-y divide-eccellere-ink/5">
                  {[
                    { date: "Apr 14, 2026", desc: "Growth Plan — April", amount: "₹4,999" },
                    { date: "Mar 14, 2026", desc: "Growth Plan — March", amount: "₹4,999" },
                    { date: "Feb 14, 2026", desc: "Growth Plan — February", amount: "₹4,999" },
                  ].map((b) => (
                    <div key={b.date} className="flex items-center justify-between px-6 py-3.5">
                      <div>
                        <p className="text-sm text-eccellere-ink">{b.desc}</p>
                        <p className="text-xs text-ink-light">{b.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-eccellere-ink">{b.amount}</span>
                        <Button variant="ghost" size="sm" className="text-xs text-eccellere-gold">Invoice</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">Notification Preferences</h2>
                <div className="mt-5 space-y-5">
                  {[
                    { id: "order", label: "Order confirmations", desc: "Get notified when a purchase is confirmed", default: true },
                    { id: "asset", label: "New assets in your categories", desc: "Weekly digest of new marketplace assets", default: true },
                    { id: "assignment", label: "Assignment updates", desc: "Specialist messages and milestone completions", default: true },
                    { id: "newsletter", label: "Eccellere Perspectives newsletter", desc: "Fortnightly business insights and articles", default: false },
                    { id: "promo", label: "Promotions and offers", desc: "Discount codes and seasonal offers", default: false },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-eccellere-ink">{item.label}</p>
                        <p className="text-xs text-ink-light">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                        <div className="h-5 w-9 rounded-full bg-eccellere-ink/20 peer-checked:bg-eccellere-gold transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit">Save Preferences</Button>
                {saved && <span className="text-sm text-eccellere-teal">✓ Saved successfully</span>}
              </div>
            </form>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <form onSubmit={handleSave} className="rounded-lg bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-medium text-eccellere-ink">Change Password</h2>
                {[
                  { id: "current", label: "Current Password" },
                  { id: "new", label: "New Password" },
                  { id: "confirm", label: "Confirm New Password" },
                ].map((f) => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="block text-xs font-medium uppercase tracking-wider text-ink-light">
                      {f.label}
                    </label>
                    <input
                      id={f.id}
                      type="password"
                      placeholder="••••••••"
                      className="mt-1.5 w-full rounded border border-eccellere-ink/15 bg-eccellere-cream px-3 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>
                ))}
                <Button type="submit">Update Password</Button>
              </form>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">Two-Factor Authentication</h2>
                <p className="mt-1 text-sm text-ink-light">Add an extra layer of security to your account.</p>
                <Button variant="outline" size="sm" className="mt-4 text-xs">
                  Enable 2FA
                </Button>
              </div>

              <div className="rounded-lg border border-eccellere-error/20 bg-eccellere-error/5 p-5">
                <h2 className="text-sm font-medium text-eccellere-error">Danger Zone</h2>
                <p className="mt-1 text-xs text-ink-light">
                  Deleting your account is permanent and cannot be undone.
                </p>
                <Button variant="ghost" size="sm" className="mt-3 text-xs text-eccellere-error hover:bg-eccellere-error/10">
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
