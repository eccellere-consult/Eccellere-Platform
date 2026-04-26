"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";

/* â”€â”€ Option lists â”€â”€ */
const businessTypes = ["Proprietorship", "Pvt Ltd", "LLP", "Partnership", "Startup", "Other"];
const sectorOptions = ["Manufacturing", "Retail", "Consumer Products", "Logistics", "IT Services", "Healthcare", "FMCG", "Other"];
const revenueRanges = ["< â‚¹50 Lakhs", "â‚¹50L â€“ â‚¹1 Crore", "â‚¹1Cr â€“ â‚¹5 Crore", "â‚¹5Cr â€“ â‚¹25 Crore", "â‚¹25Cr â€“ â‚¹100 Crore", "> â‚¹100 Crore"];
const employeeRanges = ["1-10", "11-50", "51-200", "201-500", "500+"];
const challengeOptions = ["Revenue growth", "Operational efficiency", "Digital transformation", "AI adoption", "Talent & retention", "Quality management", "Supply chain", "Market expansion", "Compliance & governance", "Cost reduction"];
const serviceDomainOptions = ["Strategy", "Process Transformation", "Agentic AI", "Digital", "Organisation Transformation", "Financial Advisory", "Operations Excellence"];
const specSectorOptions = ["Manufacturing", "Retail", "Consumer Products", "Logistics", "IT Services", "Healthcare", "FMCG"];
const engagementOptions = ["Framework contributions", "Assignments", "Training", "Peer reviews"];
const availabilityOptions = ["Full-time", "Part-time", "Weekends", "Ad-hoc"];

export default function RegisterPage() {
  const [role, setRole] = useState<"" | "CLIENT" | "SPECIALIST">("");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* â”€â”€ Client form state â”€â”€ */
  const [client, setClient] = useState({
    name: "", email: "", password: "", phone: "",
    companyName: "", businessType: "", sector: "", revenueRange: "", employeeRange: "",
    city: "", state: "", challenges: [] as string[], referralSource: "",
  });

  /* â”€â”€ Specialist form state â”€â”€ */
  const [spec, setSpec] = useState({
    name: "", email: "", password: "",
    linkedinUrl: "", currentRole: "", organisation: "", experienceYears: "", bio: "",
    serviceDomains: [] as string[], sectorExpertise: [] as string[],
    engagementTypes: [] as string[], availability: "", hourlyRateMin: "", hourlyRateMax: "",
  });

  function updateClient(field: string, value: string | string[]) {
    setClient((p) => ({ ...p, [field]: value }));
  }
  function updateSpec(field: string, value: string | string[]) {
    setSpec((p) => ({ ...p, [field]: value }));
  }
  function toggleChallenge(c: string) {
    setClient((p) => ({
      ...p,
      challenges: p.challenges.includes(c)
        ? p.challenges.filter((x) => x !== c)
        : p.challenges.length < 3 ? [...p.challenges, c] : p.challenges,
    }));
  }
  function toggleSpec(field: "serviceDomains" | "sectorExpertise" | "engagementTypes", v: string) {
    setSpec((p) => ({
      ...p,
      [field]: p[field].includes(v) ? p[field].filter((x) => x !== v) : [...p[field], v],
    }));
  }

  async function handleClientSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: client.email, password: client.password, name: client.name,
          phone: client.phone, role: "CLIENT",
          profile: {
            companyName: client.companyName, businessType: client.businessType,
            sector: client.sector, revenueRange: client.revenueRange,
            employeeRange: client.employeeRange, city: client.city, state: client.state,
            challenges: client.challenges, referralSource: client.referralSource,
          },
        }),
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Registration failed");
        } else {
          throw new Error(`Registration failed (${res.status}). Please try again.`);
        }
      }
      setStep(99);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSpecSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: spec.email, password: spec.password, name: spec.name, role: "SPECIALIST",
          profile: {
            linkedinUrl: spec.linkedinUrl, currentRole: spec.currentRole,
            organisation: spec.organisation, experienceYears: spec.experienceYears,
            bio: spec.bio, serviceDomains: spec.serviceDomains,
            sectorExpertise: spec.sectorExpertise, engagementTypes: spec.engagementTypes,
            availability: spec.availability,
            hourlyRateMin: spec.hourlyRateMin ? parseInt(spec.hourlyRateMin) : undefined,
            hourlyRateMax: spec.hourlyRateMax ? parseInt(spec.hourlyRateMax) : undefined,
          },
        }),
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Registration failed");
        } else {
          throw new Error(`Registration failed (${res.status}). Please try again.`);
        }
      }
      setStep(99);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold";
  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light";

  /* â”€â”€ Success screen â”€â”€ */
  if (step === 99) {
    return (
      <>
        <Header />
        <main className="bg-eccellere-cream pt-[72px]">
          <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-6 py-20">
            <div className="w-full text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-eccellere-teal/10">
                <svg className="h-8 w-8 text-eccellere-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="mt-6 font-display text-2xl text-eccellere-ink">
                {role === "SPECIALIST" ? "Application Submitted!" : "Account Created!"}
              </h2>
              <p className="mt-3 text-sm text-ink-light">
                {role === "SPECIALIST"
                  ? "Your specialist application is under review. We'll notify you once approved."
                  : "Your account is ready. Sign in to access your dashboard."}
              </p>
              <Button asChild className="mt-8">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* â”€â”€ Role selector â”€â”€ */
  if (!role) {
    return (
      <>
        <Header />
        <main className="bg-eccellere-cream pt-[72px]">
          <div className="mx-auto max-w-2xl px-6 py-20 lg:py-[120px]">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Join Eccellere
            </p>
            <h1 className="mt-4 text-center font-display text-[clamp(28px,5vw,42px)] font-light text-eccellere-ink">
              How would you like to <span className="italic">join?</span>
            </h1>
            <p className="mt-3 text-center text-sm text-ink-mid">
              Choose your path to get started
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <button
                onClick={() => { setRole("CLIENT"); setStep(1); }}
                className="group rounded-lg border-2 border-eccellere-ink/10 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-eccellere-gold hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eccellere-gold/10">
                  <Briefcase className="h-6 w-6 text-eccellere-gold" />
                </div>
                <h3 className="mt-5 font-display text-xl text-eccellere-ink">
                  I&apos;m a Business Owner
                </h3>
                <p className="mt-2 text-sm text-ink-light">
                  Get expert consulting, access frameworks, and scale your MSME with Eccellere&apos;s specialist network.
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-eccellere-gold group-hover:underline">
                  Register as Client â†’
                </span>
              </button>

              <button
                onClick={() => { setRole("SPECIALIST"); setStep(1); }}
                className="group rounded-lg border-2 border-eccellere-ink/10 bg-white p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-eccellere-gold hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eccellere-teal/10">
                  <Users className="h-6 w-6 text-eccellere-teal" />
                </div>
                <h3 className="mt-5 font-display text-xl text-eccellere-ink">
                  I&apos;m a Consultant / Expert
                </h3>
                <p className="mt-2 text-sm text-ink-light">
                  Monetise your expertise with 60% revenue share. Publish frameworks, take assignments, and grow your practice.
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-eccellere-teal group-hover:underline">
                  Apply as Specialist â†’
                </span>
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-ink-light">
              Already have an account?{" "}
              <Link href="/login" className="text-eccellere-gold hover:underline">Sign in</Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* â”€â”€ CLIENT REGISTRATION FORM â”€â”€ */
  if (role === "CLIENT") {
    const clientSteps = [
      { number: 1, label: "Account" },
      { number: 2, label: "Business" },
      { number: 3, label: "Priorities" },
    ];

    return (
      <>
        <Header />
        <main className="bg-eccellere-cream pt-[72px]">
          <div className="mx-auto max-w-2xl px-6 py-20 lg:py-[120px]">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Client Registration
            </p>
            <h1 className="mt-4 text-center font-display text-[clamp(28px,5vw,42px)] font-light text-eccellere-ink">
              Get started with <span className="italic">Eccellere</span>
            </h1>

            <div className="mt-10 flex items-center justify-center gap-2">
              {clientSteps.map((s) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= s.number ? "bg-eccellere-gold text-white" : "border border-eccellere-ink/10 text-ink-light"}`}>
                    {step > s.number ? "âœ“" : s.number}
                  </div>
                  <span className="hidden text-xs text-ink-light sm:block">{s.label}</span>
                  {s.number < clientSteps.length && <div className="mx-2 h-px w-8 bg-eccellere-ink/10" />}
                </div>
              ))}
            </div>

            <div className="mt-12 rounded bg-white p-8 shadow-sm">
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display text-xl text-eccellere-ink">Create your account</h2>
                  <div><label className={labelClass}>Full Name *</label><input value={client.name} onChange={(e) => updateClient("name", e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Email *</label><input type="email" value={client.email} onChange={(e) => updateClient("email", e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Password *</label><input type="password" value={client.password} onChange={(e) => updateClient("password", e.target.value)} className={inputClass} minLength={8} /><p className="mt-1 text-xs text-ink-light">Minimum 8 characters</p></div>
                  <div><label className={labelClass}>Phone</label><input type="tel" value={client.phone} onChange={(e) => updateClient("phone", e.target.value)} className={inputClass} /></div>
                  <Button onClick={() => setStep(2)} disabled={!client.name || !client.email || client.password.length < 8} className="w-full">Continue</Button>
                  <p className="text-center text-xs text-ink-light">
                    <button onClick={() => { setRole(""); setStep(1); }} className="text-eccellere-gold hover:underline">â† Choose a different role</button>
                    {" Â· "}
                    <Link href="/login" className="text-eccellere-gold hover:underline">Sign in</Link>
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="font-display text-xl text-eccellere-ink">Tell us about your business</h2>
                  <div><label className={labelClass}>Company Name *</label><input value={client.companyName} onChange={(e) => updateClient("companyName", e.target.value)} className={inputClass} /></div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Business Type *</label>
                      <select value={client.businessType} onChange={(e) => updateClient("businessType", e.target.value)} className={inputClass}>
                        <option value="">Select</option>
                        {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Sector *</label>
                      <select value={client.sector} onChange={(e) => updateClient("sector", e.target.value)} className={inputClass}>
                        <option value="">Select</option>
                        {sectorOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Annual Revenue *</label>
                      <select value={client.revenueRange} onChange={(e) => updateClient("revenueRange", e.target.value)} className={inputClass}>
                        <option value="">Select</option>
                        {revenueRanges.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Employees *</label>
                      <select value={client.employeeRange} onChange={(e) => updateClient("employeeRange", e.target.value)} className={inputClass}>
                        <option value="">Select</option>
                        {employeeRanges.map((e) => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><label className={labelClass}>City *</label><input value={client.city} onChange={(e) => updateClient("city", e.target.value)} className={inputClass} /></div>
                    <div><label className={labelClass}>State *</label><input value={client.state} onChange={(e) => updateClient("state", e.target.value)} className={inputClass} /></div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)} disabled={!client.companyName || !client.businessType || !client.sector || !client.revenueRange || !client.employeeRange || !client.city || !client.state} className="flex-1">Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-display text-xl text-eccellere-ink">Your priorities</h2>
                  <div>
                    <label className={labelClass}>Top challenges (pick up to 3)</label>
                    <div className="flex flex-wrap gap-2">
                      {challengeOptions.map((c) => (
                        <button key={c} type="button" onClick={() => toggleChallenge(c)}
                          className={`rounded border px-3 py-1.5 text-sm transition-colors ${client.challenges.includes(c) ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold" : "border-eccellere-ink/10 text-ink-mid"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>How did you hear about us?</label>
                    <select value={client.referralSource} onChange={(e) => updateClient("referralSource", e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      <option value="google">Google Search</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="referral">Referral</option>
                      <option value="social">Social Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {error && <p className="text-sm text-eccellere-error">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={handleClientSubmit} disabled={submitting} className="flex-1">
                      {submitting ? "Creating accountâ€¦" : "Create Account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* â”€â”€ SPECIALIST REGISTRATION FORM â”€â”€ */
  const specSteps = [
    { number: 1, label: "Details" },
    { number: 2, label: "Expertise" },
  ];

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

          <div className="mt-10 flex items-center justify-center gap-2">
            {specSteps.map((s) => (
              <div key={s.number} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step >= s.number ? "bg-eccellere-gold text-white" : "border border-eccellere-ink/10 text-ink-light"}`}>
                  {step > s.number ? "âœ“" : s.number}
                </div>
                <span className="hidden text-xs text-ink-light sm:block">{s.label}</span>
                {s.number < specSteps.length && <div className="mx-2 h-px w-8 bg-eccellere-ink/10" />}
              </div>
            ))}
          </div>

          <div className="mt-12 rounded bg-white p-8 shadow-sm">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-eccellere-ink">Your details</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className={labelClass}>Full Name *</label><input value={spec.name} onChange={(e) => updateSpec("name", e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Email *</label><input type="email" value={spec.email} onChange={(e) => updateSpec("email", e.target.value)} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Password *</label><input type="password" value={spec.password} onChange={(e) => updateSpec("password", e.target.value)} className={inputClass} minLength={8} /><p className="mt-1 text-xs text-ink-light">Minimum 8 characters</p></div>
                <div><label className={labelClass}>LinkedIn Profile URL *</label><input value={spec.linkedinUrl} onChange={(e) => updateSpec("linkedinUrl", e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." /></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className={labelClass}>Current Role *</label><input value={spec.currentRole} onChange={(e) => updateSpec("currentRole", e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Organisation</label><input value={spec.organisation} onChange={(e) => updateSpec("organisation", e.target.value)} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Experience (years) *</label><input value={spec.experienceYears} onChange={(e) => updateSpec("experienceYears", e.target.value)} className={inputClass} placeholder="e.g. 10+" /></div>
                <div><label className={labelClass}>Short Bio</label><textarea value={spec.bio} onChange={(e) => updateSpec("bio", e.target.value)} className={inputClass} rows={3} placeholder="Your expertise in 2-3 sentences..." /></div>
                <Button onClick={() => setStep(2)} disabled={!spec.name || !spec.email || spec.password.length < 8 || !spec.linkedinUrl || !spec.currentRole || !spec.experienceYears} className="w-full">Continue</Button>
                <p className="text-center text-xs text-ink-light">
                  <button onClick={() => { setRole(""); setStep(1); }} className="text-eccellere-gold hover:underline">â† Choose a different role</button>
                  {" Â· "}
                  <Link href="/login" className="text-eccellere-gold hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-eccellere-ink">Expertise & availability</h2>
                <div>
                  <label className={labelClass}>Service Domains *</label>
                  <div className="flex flex-wrap gap-2">
                    {serviceDomainOptions.map((d) => (
                      <button key={d} type="button" onClick={() => toggleSpec("serviceDomains", d)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${spec.serviceDomains.includes(d) ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold" : "border-eccellere-ink/10 text-ink-mid"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Sector Expertise *</label>
                  <div className="flex flex-wrap gap-2">
                    {specSectorOptions.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSpec("sectorExpertise", s)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${spec.sectorExpertise.includes(s) ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold" : "border-eccellere-ink/10 text-ink-mid"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Engagement Types</label>
                  <div className="flex flex-wrap gap-2">
                    {engagementOptions.map((e) => (
                      <button key={e} type="button" onClick={() => toggleSpec("engagementTypes", e)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${spec.engagementTypes.includes(e) ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold" : "border-eccellere-ink/10 text-ink-mid"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Availability *</label>
                  <div className="flex flex-wrap gap-2">
                    {availabilityOptions.map((a) => (
                      <button key={a} type="button" onClick={() => updateSpec("availability", a)}
                        className={`rounded border px-3 py-1.5 text-sm transition-colors ${spec.availability === a ? "border-eccellere-gold bg-eccellere-gold/5 text-eccellere-gold" : "border-eccellere-ink/10 text-ink-mid"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className={labelClass}>Min Hourly Rate (â‚¹)</label><input type="number" value={spec.hourlyRateMin} onChange={(e) => updateSpec("hourlyRateMin", e.target.value)} className={inputClass} placeholder="e.g. 3000" /></div>
                  <div><label className={labelClass}>Max Hourly Rate (â‚¹)</label><input type="number" value={spec.hourlyRateMax} onChange={(e) => updateSpec("hourlyRateMax", e.target.value)} className={inputClass} placeholder="e.g. 8000" /></div>
                </div>
                {error && <p className="text-sm text-eccellere-error">{error}</p>}
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={handleSpecSubmit} disabled={submitting || !spec.serviceDomains.length || !spec.sectorExpertise.length || !spec.availability} className="flex-1">
                    {submitting ? "Submittingâ€¦" : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}