/**
 * Working Capital Diagnostic — Tree-of-Thought question bank.
 *
 * Phase 1 (screening): 5 questions, one per MECE lever.
 * Phase 2 (drill-down): asked ONLY for levers where screening score <= 3.
 * Source: Eccellere_Mfg_Working Capital improvement_Kit (Sections A-H).
 */

export type LeverId = 1 | 2 | 3 | 4 | 0; // 0 = cash gap symptom (cross-cutting)

export type RatingScale = {
  type: "rating";
  min: 1;
  max: 5;
  /** Label for the worst end (rating = 1). */
  lowLabel: string;
  /** Label for the best end (rating = 5). */
  highLabel: string;
};

export type YesNoScale = {
  type: "yes_no";
};

export type Question = {
  id: string;
  lever: LeverId;
  dimension: string;
  prompt: string;
  scale: RatingScale | YesNoScale;
};

export const LEVERS: Record<LeverId, string> = {
  0: "Cash Gap (symptom)",
  1: "Receivables — Cash coming in too slow",
  2: "Payables & Procurement — Cash going out too fast",
  3: "Inventory & Operations — Capital trapped in operations",
  4: "Financing & Tax — Cost amplification",
};

const ratingLowHigh = (low: string, high: string): RatingScale => ({
  type: "rating",
  min: 1,
  max: 5,
  lowLabel: low,
  highLabel: high,
});

/** Phase 1 — Screening (asked in order, always). */
export const SCREENING: Question[] = [
  {
    id: "s1",
    lever: 0,
    dimension: "Cash gap symptom",
    prompt:
      "How often is your business short of cash to pay payroll, suppliers, or statutory dues on time?",
    scale: ratingLowHigh("Very often", "Almost never"),
  },
  {
    id: "s2",
    lever: 1,
    dimension: "Receivables velocity",
    prompt:
      "Do your customers pay within the credit terms you agreed (e.g., 30 / 45 / 60 days)?",
    scale: ratingLowHigh("Mostly delayed", "Mostly on time"),
  },
  {
    id: "s3",
    lever: 2,
    dimension: "Supplier credit",
    prompt:
      "Can you secure 30–60 day credit from your key raw-material suppliers (without demands for advance)?",
    scale: ratingLowHigh("No, advance demanded", "Yes, comfortable credit"),
  },
  {
    id: "s4",
    lever: 3,
    dimension: "Inventory drag",
    prompt:
      "How much working capital is locked in raw material, WIP, and finished goods relative to your monthly sales?",
    scale: ratingLowHigh("Very high — months of stock", "Lean — well controlled"),
  },
  {
    id: "s5",
    lever: 4,
    dimension: "Financing & tax levers",
    prompt:
      "Are you actively using financing levers like TReDS, CGTMSE / SIDBI, Packing Credit and claiming full GST Input Tax Credit each month?",
    scale: ratingLowHigh("Not really", "Yes, all relevant levers"),
  },
];

/** Phase 2 — Drill-down. Asked only when screening for that lever <= 3. */
export const DRILLDOWNS: Record<Exclude<LeverId, 0>, Question[]> = {
  1: [
    {
      id: "d1a",
      lever: 1,
      dimension: "Credit discipline",
      prompt:
        "Do you have a written credit policy (limits per customer) and a regular dunning / follow-up calendar?",
      scale: { type: "yes_no" },
    },
    {
      id: "d1b",
      lever: 1,
      dimension: "Overdue concentration",
      prompt:
        "Roughly what share of your receivables is more than 60 days overdue?",
      scale: ratingLowHigh("More than 30%", "Less than 5%"),
    },
  ],
  2: [
    {
      id: "d2a",
      lever: 2,
      dimension: "Sourcing resilience",
      prompt:
        "For your top 3 raw materials, do you have at least 2 qualified vendors each?",
      scale: { type: "yes_no" },
    },
    {
      id: "d2b",
      lever: 2,
      dimension: "Written supplier terms",
      prompt:
        "Are payment terms with key suppliers documented in writing (PO / contract) — not just verbal?",
      scale: { type: "yes_no" },
    },
  ],
  3: [
    {
      id: "d3a",
      lever: 3,
      dimension: "Inventory norms",
      prompt:
        "Have you defined SKU-level inventory norms (target days of cover for RM, WIP, FG)?",
      scale: { type: "yes_no" },
    },
    {
      id: "d3b",
      lever: 3,
      dimension: "Slow-moving stock",
      prompt:
        "Do you review slow-moving and non-moving stock at least once a month and take action?",
      scale: { type: "yes_no" },
    },
  ],
  4: [
    {
      id: "d4a",
      lever: 4,
      dimension: "GST ITC capture",
      prompt:
        "Do you reconcile and claim 100% of eligible GST Input Tax Credit every month (GSTR-2B vs books)?",
      scale: { type: "yes_no" },
    },
    {
      id: "d4b",
      lever: 4,
      dimension: "Subsidised financing",
      prompt:
        "Have you onboarded onto TReDS (RXIL / M1 / Invoicemart) or used CGTMSE / SIDBI / Packing Credit in the last 12 months?",
      scale: { type: "yes_no" },
    },
  ],
};

export const QUESTION_BY_ID: Record<string, Question> = (() => {
  const map: Record<string, Question> = {};
  for (const q of SCREENING) map[q.id] = q;
  const leverIds: Array<Exclude<LeverId, 0>> = [1, 2, 3, 4];
  for (const lever of leverIds) {
    for (const q of DRILLDOWNS[lever]) map[q.id] = q;
  }
  return map;
})();

/** Map a screening question id back to its lever (for routing into drill-downs). */
export function leverForScreeningId(id: string): Exclude<LeverId, 0> | null {
  const q = QUESTION_BY_ID[id];
  if (!q || q.lever === 0) return null;
  return q.lever;
}
