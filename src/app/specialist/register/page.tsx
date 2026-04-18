import { redirect } from "next/navigation";

export default function SpecialistRegisterRedirect() {
  redirect("/register");
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const serviceDomainOptions = [
  "Strategy",
  "Process Transformation",
  "Agentic AI",
  "Digital",
  "Organisation Transformation",
];

const sectorOptions = [
  "Manufacturing",
  "Retail",
  "Consumer Products",
  "Logistics",
];

const engagementOptions = [
  "Framework contributions",
  "Assignments",
  "Training",
  "Peer reviews",
];

const availabilityOptions = [
  "Full-time",
  "Part-time",
  "Weekends",
  "Ad-hoc",
];

export default function SpecialistRegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    linkedinUrl: "",
    currentRole: "",
    organisation: "",
    experienceYears: "",
    bio: "",
    serviceDomains: [] as string[],
    sectorExpertise: [] as string[],
    engagementTypes: [] as string[],
    availability: "",
    hourlyRateMin: "",
    hourlyRateMax: "",
  });

  function update(field: string, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggle(field: "serviceDomains" | "sectorExpertise" | "engagementTypes", value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((x) => x !== value)
        : [...prev[field], value],
    }));
  }

  const inputClass =
    "w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold";
  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light";

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        <div className="mx-auto max-w-2xl px-6 py-20 lg:py-[120px]">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Specialist Application
          </p>
          <h1 className="mt-4 text-center font-display text-[clamp(28px,5vw,42px)] font-light text-eccellere-ink">
            Join as a <span className="italic">specialist</span>
          </h1>
          <p className="mt-3 text-center text-sm text-ink-mid">
            Monetise your expertise. 60% revenue share. Flexible engagement.
          </p>

          <div className="mt-10 rounded bg-white p-8 shadow-sm">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-eccellere-ink">
                  Your details
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => update("password", e.target.value)}
                    className={inputClass}
                    minLength={8}
                  />
                </div>
                <div>
                  <label className={labelClass}>LinkedIn Profile URL *</label>
                  <input
                    value={formData.linkedinUrl}
                    onChange={(e) => update("linkedinUrl", e.target.value)}
                    className={inputClass}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Current Role *</label>
                    <input
                      value={formData.currentRole}
                      onChange={(e) => update("currentRole", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Organisation</label>
                    <input
                      value={formData.organisation}
                      onChange={(e) => update("organisation", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Experience (years) *</label>
                  <input
                    value={formData.experienceYears}
                    onChange={(e) => update("experienceYears", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 10+"
                  />
                </div>
                <div>
                  <label className={labelClass}>Short Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="Your expertise in 2-3 sentences..."
                  />
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.email || !formData.linkedinUrl}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-eccellere-ink">
                  Expertise & availability
                </h2>

                <div>
                  <label className={labelClass}>Service Domains *</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceDomainOptions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggle("serviceDomains", d)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                          formData.serviceDomains.includes(d)
                            ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold"
                            : "border-eccellere-ink/10 text-ink-mid"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Sector Expertise *</label>
                  <div className="flex flex-wrap gap-2">
                    {sectorOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle("sectorExpertise", s)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                          formData.sectorExpertise.includes(s)
                            ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold"
                            : "border-eccellere-ink/10 text-ink-mid"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Engagement Types</label>
                  <div className="flex flex-wrap gap-2">
                    {engagementOptions.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => toggle("engagementTypes", e)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                          formData.engagementTypes.includes(e)
                            ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold"
                            : "border-eccellere-ink/10 text-ink-mid"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Availability *</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => update("availability", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    {availabilityOptions.map((a) => (
                      <option key={a} value={a.toLowerCase()}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Min Hourly Rate (₹)</label>
                    <input
                      type="number"
                      value={formData.hourlyRateMin}
                      onChange={(e) => update("hourlyRateMin", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Max Hourly Rate (₹)</label>
                    <input
                      type="number"
                      value={formData.hourlyRateMax}
                      onChange={(e) => update("hourlyRateMax", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.serviceDomains.length || !formData.sectorExpertise.length}
                    className="flex-1"
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eccellere-teal/10">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="mt-6 font-display text-2xl text-eccellere-ink">
                  Application submitted!
                </h2>
                <p className="mt-2 max-w-sm text-sm text-ink-mid">
                  Our team will review your application within 48 hours.
                  You&apos;ll receive an email once approved.
                </p>
                <Button asChild className="mt-8">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
