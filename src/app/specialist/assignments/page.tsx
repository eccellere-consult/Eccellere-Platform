"use client";

import { ClipboardList, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const assignments = [
  { client: "Arjun Textiles Pvt Ltd", project: "Process Transformation Assessment", status: "in-progress", dueDate: "Apr 28, 2026", value: "₹75,000" },
  { client: "FreshBasket D2C", project: "Omnichannel Strategy Workshop", status: "in-progress", dueDate: "May 5, 2026", value: "₹45,000" },
  { client: "SwiftShip Logistics", project: "AI Readiness Deep Dive", status: "in-progress", dueDate: "May 12, 2026", value: "₹60,000" },
  { client: "Precision Auto Components", project: "Lean Manufacturing Audit", status: "completed", dueDate: "Mar 15, 2026", value: "₹90,000" },
  { client: "GreenLeaf Organics", project: "Market Entry Strategy for North India", status: "completed", dueDate: "Feb 20, 2026", value: "₹55,000" },
];

export default function SpecialistAssignmentsPage() {
  const active = assignments.filter((a) => a.status === "in-progress");
  const completed = assignments.filter((a) => a.status === "completed");

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Assignments</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">My Assignments</h1>

      {/* Active */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-eccellere-ink">Active ({active.length})</h2>
        <div className="mt-3 space-y-3">
          {active.map((a) => (
            <div key={a.project} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-eccellere-ink">{a.project}</p>
                <p className="mt-0.5 text-xs text-ink-light">{a.client}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="rounded-sm bg-eccellere-info/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-info">
                  {a.status}
                </span>
                <div className="flex items-center gap-1 text-xs text-ink-light">
                  <Clock className="h-3 w-3" />
                  Due {a.dueDate}
                </div>
                <span className="font-mono text-sm text-eccellere-gold">{a.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed */}
      <div className="mt-10">
        <h2 className="text-sm font-medium text-eccellere-ink">Completed ({completed.length})</h2>
        <div className="mt-3 space-y-3">
          {completed.map((a) => (
            <div key={a.project} className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-eccellere-ink">{a.project}</p>
                <p className="mt-0.5 text-xs text-ink-light">{a.client}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1 rounded-sm bg-eccellere-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-teal">
                  <CheckCircle className="h-3 w-3" />
                  completed
                </span>
                <span className="font-mono text-sm text-eccellere-gold">{a.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
