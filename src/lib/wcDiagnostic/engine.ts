/**
 * Tree-of-Thought diagnostic engine.
 *
 * One inbound message → engine resolves session state, persists the answer,
 * and either sends the next question or kicks off the final analysis.
 *
 * Session.answers schema (JSON):
 *   { [questionId: string]: number | "yes" | "no" }
 *
 * Session.queue schema (JSON):
 *   string[]  — ordered list of question IDs still to ask.
 */

import { prisma } from "@/lib/prisma";
import {
  SCREENING,
  DRILLDOWNS,
  QUESTION_BY_ID,
  leverForScreeningId,
  type LeverId,
} from "./questions";
import { sendQuestion, sendText, sendMenu } from "./whatsapp";
import { runAnalysis } from "./analyze";

type AnswerValue = number | "yes" | "no";
type AnswerMap = Record<string, AnswerValue>;

const ACTIVE = "active";
const COMPLETED = "completed";

function parseAnswers(raw: unknown): AnswerMap {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as AnswerMap;
  return {};
}
function parseQueue(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string") as string[];
  return [];
}

async function findActive(phoneNumber: string) {
  return prisma.wcDiagnosticSession.findFirst({
    where: { phoneNumber, status: ACTIVE },
    orderBy: { startedAt: "desc" },
  });
}

async function startNewSession(phoneNumber: string) {
  // Abandon any prior active sessions for this phone.
  await prisma.wcDiagnosticSession.updateMany({
    where: { phoneNumber, status: ACTIVE },
    data: { status: "abandoned" },
  });
  const queue = SCREENING.map((q) => q.id);
  const session = await prisma.wcDiagnosticSession.create({
    data: {
      phoneNumber,
      status: ACTIVE,
      phase: "screening",
      queue,
      answers: {},
      totalPlanned: queue.length,
    },
  });
  return session;
}

/** After screening, enqueue drill-downs for every lever scored <= 3. */
function buildDrillQueue(answers: AnswerMap): string[] {
  const drill: string[] = [];
  for (const q of SCREENING) {
    const lever = leverForScreeningId(q.id);
    if (!lever) continue;
    const score = answers[q.id];
    if (typeof score === "number" && score <= 3) {
      drill.push(...DRILLDOWNS[lever].map((d) => d.id));
    }
  }
  return drill;
}

/** Public entry point: handle one inbound user event. */
export async function handleInbound(opts: {
  phoneNumber: string;
  text?: string;
  replyId?: string; // e.g. "s1:3" or "d1a:yes" or "menu:wc"
}): Promise<void> {
  const { phoneNumber, text, replyId } = opts;
  const lowered = (text || "").trim().toLowerCase();

  // 1. Menu / restart intents (text-driven).
  if (!replyId) {
    if (
      ["hi", "hello", "hey", "start", "menu", "namaste"].includes(lowered) ||
      lowered === ""
    ) {
      await sendMenu(phoneNumber);
      return;
    }
    if (lowered === "restart" || lowered === "reset") {
      const s = await startNewSession(phoneNumber);
      await sendText(
        phoneNumber,
        "Restarted. Let's run the Working Capital diagnostic — 5 quick questions, then a few follow-ups only where they matter.",
      );
      await askNext(s.id, phoneNumber);
      return;
    }
    // Fallback for free-text mid-flow: nudge to use buttons.
    const active = await findActive(phoneNumber);
    if (active) {
      await sendText(
        phoneNumber,
        "Please tap one of the options I sent above (or reply 'restart' to start over).",
      );
      return;
    }
    await sendMenu(phoneNumber);
    return;
  }

  // 2. Reply ID handling.
  if (replyId === "menu:wc") {
    const s = await startNewSession(phoneNumber);
    await sendText(
      phoneNumber,
      "Great. I'll ask 5 quick screening questions, then drill in only on the areas that need attention. Total time: ~5–7 min.",
    );
    await askNext(s.id, phoneNumber);
    return;
  }
  if (replyId === "menu:help") {
    await sendText(
      phoneNumber,
      "This is a free working-capital health check from Eccellere — built from our MSME Working Capital Improvement Kit.\n\n" +
        "You'll answer 5 screening questions, then a few follow-ups on weak spots. At the end you get:\n" +
        "• Your top strengths\n• Top 3 improvement actions\n• Metrics to baseline & track\n\n" +
        "Reply 'menu' to begin.",
    );
    return;
  }

  // Answer to a question: ID format `<qid>:<value>`
  const [qid, valueStr] = replyId.split(":");
  const question = QUESTION_BY_ID[qid];
  const session = await findActive(phoneNumber);
  if (!session || !question) {
    await sendText(phoneNumber, "Looks like this session has expired. Reply 'menu' to start again.");
    return;
  }

  // Parse value
  let value: AnswerValue;
  if (question.scale.type === "yes_no") {
    if (valueStr !== "yes" && valueStr !== "no") return;
    value = valueStr;
  } else {
    const n = parseInt(valueStr, 10);
    if (!Number.isFinite(n) || n < 1 || n > 5) return;
    value = n;
  }

  // Persist answer + advance queue
  const answers = parseAnswers(session.answers);
  const queue = parseQueue(session.queue);
  if (answers[qid] !== undefined) {
    // Idempotency: ignore duplicate taps.
    return;
  }
  answers[qid] = value;

  // Drop this question from the head of the queue (if present).
  const remainder = queue.filter((q) => q !== qid);

  // Phase transitions
  let phase = session.phase;
  let newQueue = remainder;
  let totalPlanned = session.totalPlanned;
  if (phase === "screening" && newQueue.length === 0) {
    const drill = buildDrillQueue(answers);
    if (drill.length > 0) {
      phase = "drill";
      newQueue = drill;
      totalPlanned = SCREENING.length + drill.length;
    } else {
      phase = "complete";
    }
  } else if (phase === "drill" && newQueue.length === 0) {
    phase = "complete";
  }

  await prisma.wcDiagnosticSession.update({
    where: { id: session.id },
    data: {
      answers,
      queue: newQueue,
      phase,
      totalPlanned,
      ...(phase === "complete" ? { status: COMPLETED, completedAt: new Date() } : {}),
    },
  });

  if (phase === "complete") {
    await finalize(session.id, phoneNumber, answers);
    return;
  }
  await askNext(session.id, phoneNumber);
}

async function askNext(sessionId: string, phoneNumber: string) {
  const s = await prisma.wcDiagnosticSession.findUnique({ where: { id: sessionId } });
  if (!s) return;
  const queue = parseQueue(s.queue);
  const next = queue[0];
  if (!next) return;
  const q = QUESTION_BY_ID[next];
  if (!q) return;
  const total = s.totalPlanned;
  const answered = Object.keys(parseAnswers(s.answers)).length;
  await sendQuestion(phoneNumber, q, total, answered);
}

async function finalize(sessionId: string, phoneNumber: string, answers: AnswerMap) {
  await sendText(
    phoneNumber,
    "Thanks — analysing your responses now. Your report will arrive in a few seconds.",
  );
  try {
    const report = await runAnalysis(answers);
    await sendText(phoneNumber, report);
    await sendText(
      phoneNumber,
      "Want a deeper review? Reply with your email and I'll send a PDF + 30-min specialist slot.",
    );
    await prisma.wcDiagnosticSession.update({
      where: { id: sessionId },
      data: { reportSent: true },
    });
  } catch (err) {
    console.error("[wc-engine] analysis failed", err);
    await sendText(
      phoneNumber,
      "Sorry — I hit a snag generating your report. Our team has been notified. Reply 'menu' to retry.",
    );
  }
}

/** Helper exposed for typing convenience. */
export type { LeverId };
