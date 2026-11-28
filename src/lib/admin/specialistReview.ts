/**
 * Specialist applicant review: the pure rules behind the admin "Review profile" screen.
 * No database here, so every rule is tested without one. Personal data stays admin-only: the API that
 * uses these functions checks the admin role first, and bank / PAN numbers are never sent to the screen.
 */

/** Roles that may review specialist applicants (same list the Specialists screen has always used). */
export const SPECIALIST_REVIEWERS = ["ADMIN", "SUPER_ADMIN", "CRM_ADMIN", "SPECIALIST_ADMIN"];
export const isSpecialistReviewer = (role?: string | null): boolean => !!role && SPECIALIST_REVIEWERS.includes(role);

/** How each stored status reads on the list. "needs info" is an application sent back for more detail. */
export function listStatus(raw: string): "pending" | "needs info" | "active" | "inactive" {
  if (raw === "APPROVED" || raw === "ACTIVE") return "active";
  if (raw === "SUSPENDED") return "inactive";
  if (raw === "REVISIONS_REQUESTED") return "needs info";
  return "pending";
}

/** Turns a stored list (JSON) into readable lines. Items may be plain text or small objects (degree, issuer, year, link...). */
export function readableList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") { if (item.trim()) out.push(item.trim()); continue; }
    if (typeof item === "number") { out.push(String(item)); continue; }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const parts = ["name", "title", "degree", "qualification", "institution", "issuer", "organisation", "year", "url", "fileName"]
        .map((k) => o[k])
        .filter((v): v is string | number => (typeof v === "string" && v.trim() !== "") || typeof v === "number")
        .map((v) => String(v).trim());
      if (parts.length) out.push([...new Set(parts)].join(" · "));
    }
  }
  return out;
}

/** The raw profile row the API reads from the database (only the fields the review needs). */
export interface ProfileRow {
  id: string;
  headline: string | null;
  bio: string | null;
  linkedinUrl: string;
  currentRole: string;
  organisation: string | null;
  experienceYears: string;
  education: unknown;
  certifications: unknown;
  serviceDomains: unknown;
  sectorExpertise: unknown;
  challengesAddressed: unknown;
  languages: unknown;
  engagementTypes: unknown;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  availability: string;
  monthlyHoursAvail: number | null;
  portfolioFiles: unknown;
  videoIntroUrl: string | null;
  status: string;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  bankAccountNumber: string | null;
  panNumber: string | null;
  gstNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string; email: string; phone: string | null; emailVerified: boolean; createdAt: Date; lastLoginAt: Date | null };
}

/** What the review screen shows. Bank and PAN numbers are reduced to "on file" yes/no. */
export interface ReviewProfile {
  id: string;
  isSample: boolean;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  appliedOn: string;
  lastLogin: string | null;
  headline: string | null;
  bio: string | null;
  currentRole: string;
  organisation: string | null;
  experienceYears: string;
  linkedinUrl: string;
  videoIntroUrl: string | null;
  serviceDomains: string[];
  sectorExpertise: string[];
  challengesAddressed: string[];
  languages: string[];
  engagementTypes: string[];
  availability: string;
  monthlyHoursAvail: number | null;
  hourlyRate: string | null;
  education: string[];
  certifications: string[];
  portfolio: string[];
  status: string;
  listStatus: ReturnType<typeof listStatus>;
  approvedAt: string | null;
  rejectionReason: string | null;
  payoutDetailsOnFile: { bank: boolean; pan: boolean; gst: boolean };
}

const day = (d: Date | null): string | null =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

export function rateText(min: number | null, max: number | null): string | null {
  const f = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (min && max) return `${f(min)} to ${f(max)} per hour`;
  if (min) return `From ${f(min)} per hour`;
  if (max) return `Up to ${f(max)} per hour`;
  return null;
}

export function toReviewProfile(p: ProfileRow, isSample = false): ReviewProfile {
  return {
    id: p.id,
    isSample,
    name: p.user.name || p.user.email,
    email: p.user.email,
    phone: p.user.phone,
    emailVerified: p.user.emailVerified,
    appliedOn: day(p.createdAt) ?? "",
    lastLogin: day(p.user.lastLoginAt),
    headline: p.headline,
    bio: p.bio,
    currentRole: p.currentRole,
    organisation: p.organisation,
    experienceYears: p.experienceYears,
    linkedinUrl: p.linkedinUrl,
    videoIntroUrl: p.videoIntroUrl,
    serviceDomains: readableList(p.serviceDomains),
    sectorExpertise: readableList(p.sectorExpertise),
    challengesAddressed: readableList(p.challengesAddressed),
    languages: readableList(p.languages),
    engagementTypes: readableList(p.engagementTypes),
    availability: p.availability,
    monthlyHoursAvail: p.monthlyHoursAvail,
    hourlyRate: rateText(p.hourlyRateMin, p.hourlyRateMax),
    education: readableList(p.education),
    certifications: readableList(p.certifications),
    portfolio: readableList(p.portfolioFiles),
    status: p.status,
    listStatus: listStatus(p.status),
    approvedAt: day(p.approvedAt),
    rejectionReason: p.rejectionReason,
    payoutDetailsOnFile: { bank: !!p.bankAccountNumber, pan: !!p.panNumber, gst: !!p.gstNumber },
  };
}

/* ── Validation checklist ─────────────────────────────────────────────── */

export type CheckStatus = "verified" | "not_verified" | "needs_info";
export const CHECK_STATUSES: CheckStatus[] = ["verified", "not_verified", "needs_info"];
export const CHECK_LABEL: Record<CheckStatus, string> = { verified: "Verified", not_verified: "Not verified", needs_info: "Needs info" };

export interface CheckItem { key: string; group: string; label: string; claim: string }

/** One line per thing the applicant claims, so the admin can mark each one before deciding. */
export function buildChecklist(p: ReviewProfile): CheckItem[] {
  const items: CheckItem[] = [];
  items.push({ key: "identity", group: "Identity", label: "Identity and contact", claim: [p.name, p.email, p.phone].filter(Boolean).join(" · ") });
  if (p.linkedinUrl) items.push({ key: "linkedin", group: "Identity", label: "LinkedIn profile matches the application", claim: p.linkedinUrl });
  items.push({ key: "role", group: "Experience", label: "Current role", claim: [p.currentRole, p.organisation].filter(Boolean).join(" at ") || "Not provided" });
  items.push({ key: "experience", group: "Experience", label: "Years of experience", claim: p.experienceYears || "Not provided" });
  p.serviceDomains.forEach((d) => items.push({ key: `domain:${d}`, group: "Skills", label: `Skill: ${d}`, claim: d }));
  p.sectorExpertise.forEach((s) => items.push({ key: `sector:${s}`, group: "Industries", label: `Industry: ${s}`, claim: s }));
  p.education.forEach((e, i) => items.push({ key: `education:${i}`, group: "Qualifications", label: "Qualification", claim: e }));
  p.certifications.forEach((c, i) => items.push({ key: `certification:${i}`, group: "Certifications", label: "Certification", claim: c }));
  p.portfolio.forEach((f, i) => items.push({ key: `portfolio:${i}`, group: "Sample work", label: "Sample work", claim: f }));
  return items;
}

export interface Validation { key: string; status: CheckStatus; note: string; by: string | null; at: string }

/** Audit rows (newest first or any order) → the latest mark for each checklist line. */
export function latestValidations(rows: { details: unknown; userId: string | null; createdAt: Date }[]): Record<string, Validation> {
  const sorted = [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const out: Record<string, Validation> = {};
  for (const r of sorted) {
    const d = r.details as { key?: unknown; status?: unknown; note?: unknown } | null;
    if (!d || typeof d.key !== "string" || !CHECK_STATUSES.includes(d.status as CheckStatus)) continue;
    out[d.key] = { key: d.key, status: d.status as CheckStatus, note: typeof d.note === "string" ? d.note : "", by: r.userId, at: new Date(r.createdAt).toISOString() };
  }
  return out;
}

/** Plain counts for the checklist (no score, no weighting). */
export function checklistCounts(items: CheckItem[], marks: Record<string, Validation>) {
  const c = { total: items.length, checked: 0, verified: 0, notVerified: 0, needsInfo: 0 };
  for (const it of items) {
    const m = marks[it.key];
    if (!m) continue;
    c.checked++;
    if (m.status === "verified") c.verified++;
    else if (m.status === "not_verified") c.notVerified++;
    else c.needsInfo++;
  }
  return c;
}

/** Checks a checklist mark sent by the screen. Returns the cleaned mark or an error in plain words. */
export function parseMark(body: { key?: unknown; status?: unknown; note?: unknown }, items: CheckItem[]):
  { ok: true; key: string; status: CheckStatus; note: string; label: string } | { ok: false; error: string } {
  const item = items.find((i) => i.key === body.key);
  if (!item) return { ok: false, error: "That item is not on this applicant's checklist" };
  if (!CHECK_STATUSES.includes(body.status as CheckStatus)) return { ok: false, error: "Mark must be Verified, Not verified or Needs info" };
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  return { ok: true, key: item.key, status: body.status as CheckStatus, note, label: item.label };
}

/* ── Decision ─────────────────────────────────────────────────────────── */

export type Decision = "approve" | "more_info" | "reject";

/**
 * What each decision does. There is no "rejected" status in the database, so a rejection is stored as SUSPENDED
 * with the reason (shown as "inactive" on the list). Asking for more info and rejecting both need a reason.
 */
export function planDecision(action: unknown, reason: unknown, adminId: string, now = new Date()):
  { ok: true; decision: Decision; data: Record<string, unknown>; auditAction: string; reason: string } | { ok: false; error: string } {
  const why = typeof reason === "string" ? reason.trim().slice(0, 1000) : "";
  if (action === "approve") {
    return { ok: true, decision: "approve", reason: why, auditAction: "specialist_approved", data: { status: "APPROVED", approvedAt: now, approvedBy: adminId, rejectionReason: null } };
  }
  if (action === "more_info" || action === "reject") {
    if (why.length < 5) return { ok: false, error: "Please write a short reason (at least 5 characters)" };
    return action === "more_info"
      ? { ok: true, decision: "more_info", reason: why, auditAction: "specialist_more_info_requested", data: { status: "REVISIONS_REQUESTED", rejectionReason: why } }
      : { ok: true, decision: "reject", reason: why, auditAction: "specialist_rejected", data: { status: "SUSPENDED", approvedAt: null, approvedBy: null, rejectionReason: why } };
  }
  return { ok: false, error: "Decision must be approve, more_info or reject" };
}

/* ── Fictional sample (demo only; never a real person) ────────────────── */

export const SAMPLE_ID = "SAMPLE";

export function sampleProfile(): ReviewProfile {
  const row: ProfileRow = {
    id: SAMPLE_ID,
    headline: "Operations Excellence Lead at Example Auto Components",
    bio: "Fifteen years improving shop-floor productivity for auto-component MSMEs. Led lean and quality programmes across three plants. (Fictional sample for the demo.)",
    linkedinUrl: "https://www.linkedin.com/in/sample-specialist",
    currentRole: "Operations Excellence Lead",
    organisation: "Example Auto Components (fictional)",
    experienceYears: "15+",
    education: [{ degree: "B.E. Mechanical Engineering", institution: "Sample Institute of Technology", year: 2009 }],
    certifications: ["Lean Six Sigma Black Belt (sample)", { name: "ISO 9001 Lead Auditor", issuer: "Sample Certification Body", year: 2018 }],
    serviceDomains: ["Operations", "Quality", "Lean manufacturing"],
    sectorExpertise: ["Manufacturing", "Automotive"],
    challengesAddressed: ["Low productivity", "Quality rejections"],
    languages: ["English", "Hindi"],
    engagementTypes: ["Assignments", "Training"],
    hourlyRateMin: 3000,
    hourlyRateMax: 6000,
    availability: "Part-time",
    monthlyHoursAvail: 40,
    portfolioFiles: [{ fileName: "Sample 8D case study.pdf" }],
    videoIntroUrl: null,
    status: "APPLIED",
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    bankAccountNumber: null,
    panNumber: null,
    gstNumber: null,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    updatedAt: new Date("2026-11-01T00:00:00Z"),
    user: { name: "Vikram Patel (sample)", email: "sample@example.com", phone: "+91 90000 00000", emailVerified: true, createdAt: new Date("2026-11-01T00:00:00Z"), lastLoginAt: null },
  };
  return toReviewProfile(row, true);
}
