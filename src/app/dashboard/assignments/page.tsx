"use client";

import { useState } from "react";
import { Calendar, Clock, MessageCircle, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "In Progress", "Completed", "Scheduled"];

const assignments = [
  {
    id: "ASG-301",
    project: "Digital Transformation Roadmap",
    specialist: "Vikram Nair",
    specialistTitle: "Digital & Technology Lead",
    initials: "VN",
    status: "in-progress",
    dueDate: "Apr 28, 2026",
    startDate: "Mar 20, 2026",
    value: "₹85,000",
    progress: 65,
    deliverables: [
      { title: "As-Is Process Mapping", done: true },
      { title: "Technology Gap Analysis", done: true },
      { title: "Digital Roadmap Document", done: false },
      { title: "Implementation Plan", done: false },
    ],
  },
  {
    id: "ASG-298",
    project: "Process Audit — Manufacturing Unit",
    specialist: "Dr. Priya Malhotra",
    specialistTitle: "Strategy & Operations",
    initials: "PM",
    status: "in-progress",
    dueDate: "May 5, 2026",
    startDate: "Apr 1, 2026",
    value: "₹1,20,000",
    progress: 35,
    deliverables: [
      { title: "Site Visit & Observations", done: true },
      { title: "Waste & Inefficiency Report", done: false },
      { title: "SOP Recommendations", done: false },
      { title: "Final Audit Report", done: false },
    ],
  },
  {
    id: "ASG-271",
    project: "Working Capital Review",
    specialist: "Meera Iyer",
    specialistTitle: "CFO Advisory",
    initials: "MI",
    status: "completed",
    dueDate: "Mar 10, 2026",
    startDate: "Feb 1, 2026",
    value: "₹60,000",
    progress: 100,
    deliverables: [
      { title: "Cash Flow Analysis", done: true },
      { title: "Receivables Optimisation Plan", done: true },
      { title: "Inventory Rationalisation", done: true },
      { title: "Final Recommendations Report", done: true },
    ],
  },
  {
    id: "ASG-255",
    project: "HR Policy Alignment",
    specialist: "Sanjay Kulkarni",
    specialistTitle: "HR & Organisation Design",
    initials: "SK",
    status: "completed",
    dueDate: "Feb 15, 2026",
    startDate: "Jan 10, 2026",
    value: "₹40,000",
    progress: 100,
    deliverables: [
      { title: "Policy Gap Assessment", done: true },
      { title: "Labour Law Compliance Check", done: true },
      { title: "Updated Policy Manual", done: true },
    ],
  },
  {
    id: "ASG-320",
    project: "AI & Automation Readiness Assessment",
    specialist: "Rohan Desai",
    specialistTitle: "Agentic AI Specialist",
    initials: "RD",
    status: "scheduled",
    dueDate: "Jun 15, 2026",
    startDate: "May 15, 2026",
    value: "₹95,000",
    progress: 0,
    deliverables: [
      { title: "Process Mapping for Automation", done: false },
      { title: "AI Tool Evaluation", done: false },
      { title: "ROI Model", done: false },
      { title: "Pilot Rollout Plan", done: false },
    ],
  },
];

const statusStyles: Record<string, { badge: string; icon: typeof CheckCircle }> = {
  "in-progress": { badge: "bg-eccellere-info/10 text-eccellere-info", icon: Clock },
  completed: { badge: "bg-eccellere-teal/10 text-eccellere-teal", icon: CheckCircle },
  scheduled: { badge: "bg-eccellere-gold/10 text-eccellere-gold", icon: Calendar },
};

export default function AssignmentsPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>("ASG-301");

  const filtered = assignments.filter(
    (a) => filter === "All" || a.status === filter.toLowerCase().replace(" ", "-")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">Assignments</h1>
        <p className="mt-1 text-sm text-ink-light">
          Expert consulting sessions booked through Eccellere
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f
                ? "bg-eccellere-gold text-white"
                : "bg-white text-ink-light hover:text-eccellere-ink"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Assignment cards */}
      <div className="space-y-4">
        {filtered.map((a) => {
          const isOpen = expanded === a.id;
          const StatusIcon = statusStyles[a.status].icon;

          return (
            <div key={a.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
              {/* Card header */}
              <button
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
                onClick={() => setExpanded(isOpen ? null : a.id)}
              >
                {/* Specialist avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-ink text-sm font-semibold text-white">
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-eccellere-ink">{a.project}</h3>
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        statusStyles[a.status].badge
                      )}
                    >
                      {a.status.replace("-", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-light">
                    {a.specialist} · {a.specialistTitle}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-sm text-eccellere-ink">{a.value}</p>
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-ink-light">
                    <StatusIcon className="h-3 w-3" />
                    Due {a.dueDate}
                  </p>
                </div>
              </button>

              {/* Progress bar */}
              {a.status !== "scheduled" && (
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-xs text-ink-light mb-1">
                    <span>Progress</span>
                    <span>{a.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-eccellere-cream">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        a.progress === 100 ? "bg-eccellere-teal" : "bg-eccellere-gold"
                      )}
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-eccellere-ink/5 px-6 py-5">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Deliverables */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-light">
                        Deliverables
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {a.deliverables.map((d, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            {d.done ? (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-eccellere-teal" />
                            ) : (
                              <AlertCircle className="h-4 w-4 flex-shrink-0 text-ink-light/40" />
                            )}
                            <span className={cn(d.done ? "text-eccellere-ink" : "text-ink-light")}>
                              {d.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-ink-light">Start Date</p>
                        <p className="mt-0.5 text-sm text-eccellere-ink">{a.startDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-light">Due Date</p>
                        <p className="mt-0.5 text-sm text-eccellere-ink">{a.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-light">Engagement Value</p>
                        <p className="mt-0.5 font-mono text-sm text-eccellere-gold">{a.value}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs">
                          <FileText className="h-3.5 w-3.5" />
                          Brief
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
