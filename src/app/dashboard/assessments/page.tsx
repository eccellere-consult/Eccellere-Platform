"use client";

import Link from "next/link";
import { BrainCircuit, ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const assessments = [
  {
    id: "ASS-004",
    date: "Apr 12, 2026",
    score: 72,
    label: "Developing",
    color: "text-eccellere-info",
    bg: "bg-eccellere-info/10",
    bar: "bg-eccellere-info",
    benchmark: 64,
    dimensions: [
      { name: "Data Infrastructure", score: 78 },
      { name: "Process Automation", score: 65 },
      { name: "AI Literacy", score: 82 },
      { name: "Digital Integration", score: 70 },
      { name: "Leadership Buy-in", score: 68 },
    ],
    recommendations: [
      "Invest in a unified data platform to break down silos across ops and finance.",
      "Automate repeat back-office tasks — AP processing and inventory reconciliation are quick wins.",
      "Run an internal AI awareness programme for middle management.",
    ],
  },
  {
    id: "ASS-003",
    date: "Jan 15, 2026",
    score: 64,
    label: "Developing",
    color: "text-eccellere-info",
    bg: "bg-eccellere-info/10",
    bar: "bg-eccellere-info",
    benchmark: 62,
    dimensions: [
      { name: "Data Infrastructure", score: 60 },
      { name: "Process Automation", score: 55 },
      { name: "AI Literacy", score: 74 },
      { name: "Digital Integration", score: 68 },
      { name: "Leadership Buy-in", score: 62 },
    ],
    recommendations: [
      "Establish a clean data governance policy before AI deployment.",
      "Pilot RPA in your procurement workflow.",
    ],
  },
  {
    id: "ASS-002",
    date: "Sep 20, 2025",
    score: 51,
    label: "Early Stage",
    color: "text-eccellere-gold",
    bg: "bg-eccellere-gold/10",
    bar: "bg-eccellere-gold",
    benchmark: 58,
    dimensions: [
      { name: "Data Infrastructure", score: 42 },
      { name: "Process Automation", score: 48 },
      { name: "AI Literacy", score: 60 },
      { name: "Digital Integration", score: 55 },
      { name: "Leadership Buy-in", score: 52 },
    ],
    recommendations: [
      "Start basic data collection and reporting before investing in AI tools.",
    ],
  },
  {
    id: "ASS-001",
    date: "May 5, 2025",
    score: 38,
    label: "Nascent",
    color: "text-eccellere-error",
    bg: "bg-eccellere-error/10",
    bar: "bg-eccellere-error",
    benchmark: 55,
    dimensions: [
      { name: "Data Infrastructure", score: 30 },
      { name: "Process Automation", score: 35 },
      { name: "AI Literacy", score: 44 },
      { name: "Digital Integration", score: 38 },
      { name: "Leadership Buy-in", score: 42 },
    ],
    recommendations: [],
  },
];

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#F5EDD8" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
        className={color}
      />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="middle" className="font-mono text-sm font-medium fill-current" style={{ fontSize: 16 }}>
        {score}%
      </text>
    </svg>
  );
}

export default function AssessmentsPage() {
  const latest = assessments[0];
  const prev = assessments[1];
  const delta = latest.score - prev.score;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Client Dashboard
          </p>
          <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">
            AI Readiness Assessments
          </h1>
          <p className="mt-1 text-sm text-ink-light">Track your organisation&apos;s AI maturity over time</p>
        </div>
        <Button asChild>
          <Link href="/assessment" className="flex items-center gap-1.5">
            <BrainCircuit className="h-4 w-4" />
            Take New Assessment
          </Link>
        </Button>
      </div>

      {/* Latest result highlight */}
      <div className="rounded-lg bg-eccellere-ink p-6 text-white">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex-shrink-0">
            <ScoreRing score={latest.score} color="text-eccellere-gold" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Latest Result — {latest.date}
            </p>
            <h2 className="mt-1 font-display text-2xl font-light text-white">
              {latest.label} — {latest.score}/100
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Industry benchmark: {latest.benchmark}/100 · You&apos;re{" "}
              <span className="text-eccellere-gold font-medium">{latest.score - latest.benchmark > 0 ? `+${latest.score - latest.benchmark}` : latest.score - latest.benchmark} pts</span> vs peers
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-eccellere-teal">
              <TrendingUp className="h-4 w-4" />
              <span>+{delta} pts since last assessment ({prev.date})</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="space-y-2">
              {latest.dimensions.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-36 text-right text-xs text-white/50">{d.name}</span>
                  <div className="h-1.5 w-28 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-eccellere-gold"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white/70">{d.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {latest.recommendations.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-eccellere-gold">
              Top Recommendations
            </p>
            <ul className="mt-3 space-y-2">
              {latest.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-eccellere-teal" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4">
          <h2 className="text-sm font-medium text-eccellere-ink">Assessment History</h2>
        </div>
        <div className="divide-y divide-eccellere-ink/5">
          {assessments.map((a) => (
            <div key={a.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-4">
                <div className={cn("rounded-full px-3 py-1 text-sm font-mono font-medium", a.bg, a.color)}>
                  {a.score}%
                </div>
                <div>
                  <p className="text-sm font-medium text-eccellere-ink">{a.label}</p>
                  <p className="text-xs text-ink-light">{a.date}</p>
                </div>
              </div>
              {/* Mini bar chart */}
              <div className="flex gap-1.5">
                {a.dimensions.map((d) => (
                  <div key={d.name} className="flex flex-col items-center gap-1" style={{ width: 24 }}>
                    <div className="w-full rounded-t bg-eccellere-cream" style={{ height: 40 }}>
                      <div
                        className={cn("w-full rounded-t", a.bar)}
                        style={{ height: `${(d.score / 100) * 40}px`, marginTop: `${40 - (d.score / 100) * 40}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {a.score < assessments[0].score && a.id !== assessments[0].id && (
                  <span className="flex items-center gap-1 text-xs text-ink-light">
                    <AlertTriangle className="h-3.5 w-3.5 text-eccellere-gold" />
                    {assessments[0].score - a.score} pts below current
                  </span>
                )}
                <Button variant="ghost" size="sm" className="text-xs text-eccellere-gold">
                  View Report <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
