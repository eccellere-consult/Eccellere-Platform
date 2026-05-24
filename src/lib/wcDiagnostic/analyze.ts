/**
 * Analysis & report generation for the WC diagnostic.
 *
 * Strategy:
 *  1. Deterministic scoring per lever (transparent + reproducible).
 *  2. GROQ llama-3.3-70b-versatile produces a crisp narrative — top 3
 *     strengths, top 3 actions, 5 metrics — grounded in the kit playbook.
 *  3. If GROQ fails or is unconfigured, we fall back to a clean
 *     template-based report so the user always gets value.
 */

import { LEVERS, SCREENING, DRILLDOWNS, QUESTION_BY_ID, type LeverId } from "./questions";

type AnswerValue = number | "yes" | "no";
type AnswerMap = Record<string, AnswerValue>;

type LeverScore = {
  lever: Exclude<LeverId, 0>;
  name: string;
  screeningScore: number | null;
  drillYesCount: number;
  drillTotal: number;
  classification: "Strength" | "Watch" | "Weakness";
  /** 0–100, higher is healthier. */
  health: number;
};

function classifyLever(screen: number | null, yesCount: number, total: number): {
  classification: "Strength" | "Watch" | "Weakness";
  health: number;
} {
  // Base = screening rating (default 3 if missing).
  const base = screen ?? 3;
  // Bonus: +1 per "yes" drill answer; penalty for "no".
  // No drill = base score unchanged.
  let adjusted = base;
  if (total > 0) {
    const yesRatio = yesCount / total; // 0..1
    adjusted = base * 0.6 + yesRatio * 5 * 0.4; // weighted blend
  }
  // Map adjusted (1..5) -> health (0..100)
  const health = Math.round(Math.max(0, Math.min(100, ((adjusted - 1) / 4) * 100)));
  let classification: "Strength" | "Watch" | "Weakness";
  if (adjusted >= 4) classification = "Strength";
  else if (adjusted >= 3) classification = "Watch";
  else classification = "Weakness";
  return { classification, health };
}

export function scoreAnswers(answers: AnswerMap): LeverScore[] {
  const scores: LeverScore[] = [];
  for (const lever of [1, 2, 3, 4] as Array<Exclude<LeverId, 0>>) {
    const screenQ = SCREENING.find((q) => q.lever === lever);
    const screen = screenQ ? answers[screenQ.id] : undefined;
    const screenScore = typeof screen === "number" ? screen : null;

    const drills = DRILLDOWNS[lever];
    let yesCount = 0;
    let total = 0;
    for (const d of drills) {
      const a = answers[d.id];
      if (a === undefined) continue;
      if (d.scale.type === "yes_no") {
        total += 1;
        if (a === "yes") yesCount += 1;
      } else if (typeof a === "number") {
        total += 1;
        // Convert numeric drill (overdue ratings) — treat 4/5 as "yes-like"
        if (a >= 4) yesCount += 1;
      }
    }
    const { classification, health } = classifyLever(screenScore, yesCount, total);
    scores.push({
      lever,
      name: LEVERS[lever],
      screeningScore: screenScore,
      drillYesCount: yesCount,
      drillTotal: total,
      classification,
      health,
    });
  }
  return scores.sort((a, b) => a.health - b.health); // worst first
}

/** Canonical action library (drawn from kit Section M). */
const ACTION_LIBRARY: Record<Exclude<LeverId, 0>, string[]> = {
  1: [
    "Publish a written credit policy (limits per customer, terms, escalation) and run a weekly dunning calendar",
    "Onboard onto TReDS (RXIL / M1 / Invoicemart) to discount approved invoices within 24–48 hrs",
    "Use MSME Samadhaan to formally claim against buyers > 45 days overdue (Section 15 of MSMED Act)",
    "Tighten new-customer credit checks; ask for advance / BG for non-rated buyers",
  ],
  2: [
    "Qualify a second vendor for top 3 raw materials to break single-source pricing power",
    "Move all key supplier terms into written POs / contracts with payment milestones",
    "Sync RM ordering cadence to vendor lead time × demand volatility — stop emergency buys",
    "Negotiate 30–45 day terms with top suppliers in exchange for volume commitment",
  ],
  3: [
    "Set SKU-level inventory norms (RM days, WIP days, FG days) and review weekly",
    "Run a monthly slow-/non-moving review with action: liquidate, repurpose, or write off",
    "Track WIP velocity (jobs in process vs. days) — surface bottleneck stations",
    "Implement a simple kanban / two-bin system for top-20 RM items",
  ],
  4: [
    "Reconcile GSTR-2B to books every month; chase missing ITC from vendors before 30-Nov cut-off",
    "Apply for a CGTMSE-backed WC limit or SIDBI MSME loan (collateral-free up to ₹5 Cr)",
    "Use Packing Credit (PCFC) for any export orders — 4–6% cheaper than CC",
    "File quarterly export refund claims (LUT route) — recover blocked working capital",
  ],
};

/** Metrics every MSME should baseline (drawn from kit Section I). */
const METRIC_LIBRARY: Record<Exclude<LeverId, 0>, string[]> = {
  1: ["DSO (Days Sales Outstanding)", "% Receivables > 60 days overdue", "Bad-debt write-off %"],
  2: ["DPO (Days Payable Outstanding)", "Advance-to-supplier as % of monthly purchases"],
  3: ["DIO (Days Inventory Outstanding) — split RM / WIP / FG", "Slow/non-moving stock as % of total inventory"],
  4: ["Effective interest cost on WC borrowing", "Unclaimed ITC as % of total ITC (last 6 mo)"],
};

const METRIC_CORE = ["Cash Conversion Cycle (CCC = DIO + DSO – DPO)"];

function templateReport(answers: AnswerMap, scores: LeverScore[]): string {
  const weak = scores.filter((s) => s.classification === "Weakness");
  const watch = scores.filter((s) => s.classification === "Watch");
  const strong = scores.filter((s) => s.classification === "Strength");

  const lines: string[] = [];
  lines.push("*Your Working Capital Health — Eccellere Diagnostic*");
  lines.push("");
  lines.push("*1. Lever-by-Lever Score*");
  for (const s of scores) {
    const bar = healthBar(s.health);
    lines.push(`${bar} ${s.health}/100 — ${s.name} (${s.classification})`);
  }

  // Cash gap symptom
  const cashGap = answers["s1"];
  if (typeof cashGap === "number" && cashGap <= 2) {
    lines.push("");
    lines.push("⚠️ You flagged frequent cash shortfalls. The 3 actions below target the root causes.");
  }

  lines.push("");
  lines.push("*2. Top 3 Actions (30–90 days)*");
  const targets = (weak.length > 0 ? weak : watch.length > 0 ? watch : scores).slice(0, 3);
  let n = 1;
  for (const t of targets) {
    const action = ACTION_LIBRARY[t.lever][0];
    lines.push(`${n}. *${t.name.split(" — ")[0]}* — ${action}`);
    n += 1;
  }

  lines.push("");
  lines.push("*3. Metrics to Baseline & Track Monthly*");
  const metrics = new Set<string>(METRIC_CORE);
  for (const t of targets) {
    for (const m of METRIC_LIBRARY[t.lever]) metrics.add(m);
  }
  let i = 1;
  for (const m of Array.from(metrics).slice(0, 6)) {
    lines.push(`${i}. ${m}`);
    i += 1;
  }

  if (strong.length > 0) {
    lines.push("");
    lines.push("*Strengths to protect:* " + strong.map((s) => s.name.split(" — ")[0]).join(", "));
  }

  lines.push("");
  lines.push("_Built from the Eccellere MSME Working Capital Improvement Kit._");
  return lines.join("\n");
}

function healthBar(health: number): string {
  // 5 blocks
  const filled = Math.round(health / 20);
  return "█".repeat(filled) + "░".repeat(5 - filled);
}

async function groqNarrative(scores: LeverScore[], answers: AnswerMap): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const summary = scores
    .map((s) => `- ${s.name}: health ${s.health}/100, screening ${s.screeningScore ?? "n/a"}/5, drill ${s.drillYesCount}/${s.drillTotal} yes, classification ${s.classification}`)
    .join("\n");

  const answersText = Object.entries(answers)
    .map(([id, v]) => {
      const q = QUESTION_BY_ID[id];
      return q ? `- [${id}] ${q.dimension}: ${v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a senior MSME working-capital consultant writing a WhatsApp report for an Indian MSME owner.

INPUT — diagnostic scores:
${summary}

INPUT — raw answers:
${answersText}

Write a crisp WhatsApp message (max 1800 chars, plain text, use *bold* sparingly). Structure EXACTLY:

*Your Working Capital Health*

*1. What's working*
- 1-2 short lines naming the strongest lever(s).

*2. What's hurting cash*
- 1-2 short lines naming the weakest lever(s) — be direct, India-specific.

*3. Top 3 Actions (next 30–90 days)*
1. <action — tied to the weakest lever — name a specific Indian instrument (TReDS / MSME Samadhaan / CGTMSE / SIDBI / GST ITC / Packing Credit) where relevant>
2. <second action>
3. <third action>

*4. Metrics to track monthly*
- CCC (DIO + DSO – DPO)
- <metric 2>
- <metric 3>
- <metric 4>

End with one short line: "Reply 'specialist' to book a 30-min review."

Rules:
- No emojis except check/warn at the start of sections.
- No generic platitudes. Every action must be do-this-by-Friday concrete.
- Use Indian terms (₹, lakh, crore) where amounts are mentioned.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: "system", content: "You write concise, India-aware MSME finance advice." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[wc-analyze] groq non-200", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.error("[wc-analyze] groq error", err);
    return null;
  }
}

export async function runAnalysis(answers: AnswerMap): Promise<string> {
  const scores = scoreAnswers(answers);
  const narrative = await groqNarrative(scores, answers);
  if (narrative && narrative.length > 100) return narrative;
  return templateReport(answers, scores);
}
