"use client";

import { useState } from "react";
import { User, Linkedin, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SpecialistProfilePage() {
  const [profile] = useState({
    name: "Dr. Priya Sharma",
    email: "testspecialist@eccellere.in",
    headline: "MSME Growth Strategist & Digital Transformation Expert",
    bio: "15+ years helping Indian MSMEs scale through strategic consulting, digital transformation, and operational excellence.",
    linkedinUrl: "https://linkedin.com/in/priya-sharma-consultant",
    currentRole: "Independent Management Consultant",
    organisation: "Sharma Consulting Partners",
    experienceYears: "15+",
    availability: "Part-time",
    hourlyRateMin: 3000,
    hourlyRateMax: 8000,
    serviceDomains: ["Strategy & Planning", "Digital Transformation", "Operations Excellence", "Financial Advisory"],
    sectorExpertise: ["Manufacturing", "Textiles", "FMCG", "IT Services", "Healthcare"],
    languages: ["English", "Hindi", "Tamil"],
    rating: 4.8,
    totalAssignments: 23,
  });

  const inputClass =
    "w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold";
  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light";

  return (
    <div className="mx-auto max-w-[900px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Profile</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">My Profile</h1>

      <div className="mt-8 space-y-6">
        {/* Profile header */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eccellere-teal/10">
              <User className="h-8 w-8 text-eccellere-teal" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl text-eccellere-ink">{profile.name}</h2>
              <p className="mt-1 text-sm text-ink-mid">{profile.headline}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-light">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
                <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" />LinkedIn</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{profile.currentRole}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl text-eccellere-gold">{profile.rating}</p>
              <p className="text-xs text-ink-light">{profile.totalAssignments} assignments</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-eccellere-ink">About</h3>
          <p className="mt-3 text-sm text-ink-mid leading-relaxed">{profile.bio}</p>
        </div>

        {/* Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-eccellere-ink">Professional Details</h3>
            <dl className="mt-4 space-y-3">
              <div><dt className="text-xs text-ink-light">Organisation</dt><dd className="text-sm text-eccellere-ink">{profile.organisation}</dd></div>
              <div><dt className="text-xs text-ink-light">Experience</dt><dd className="text-sm text-eccellere-ink">{profile.experienceYears} years</dd></div>
              <div><dt className="text-xs text-ink-light">Availability</dt><dd className="text-sm text-eccellere-ink">{profile.availability}</dd></div>
              <div><dt className="text-xs text-ink-light">Hourly Rate</dt><dd className="text-sm text-eccellere-ink">₹{profile.hourlyRateMin} – ₹{profile.hourlyRateMax}</dd></div>
              <div><dt className="text-xs text-ink-light">Languages</dt><dd className="text-sm text-eccellere-ink">{profile.languages.join(", ")}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-eccellere-ink">Expertise</h3>
            <div className="mt-4">
              <p className="text-xs text-ink-light">Service Domains</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.serviceDomains.map((d) => (
                  <span key={d} className="rounded border border-eccellere-gold/20 bg-eccellere-gold/5 px-2.5 py-1 text-xs text-eccellere-gold">{d}</span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-ink-light">Sector Expertise</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.sectorExpertise.map((s) => (
                  <span key={s} className="rounded border border-eccellere-teal/20 bg-eccellere-teal/5 px-2.5 py-1 text-xs text-eccellere-teal">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
