/**
 * Thin wrapper over WhatsApp Cloud API v21.0 for the WC diagnostic flow.
 *
 * Required env vars (read at call-time, never at import-time, so a missing
 * value can never crash a Next.js cold start):
 *   WA_PHONE_ID            — WhatsApp Business phone number ID
 *   WA_TOKEN               — preferred Cloud API access token
 *   FB_SYSTEM_USER_TOKEN   — fallback token (already in production)
 */

import type { Question } from "./questions";

const GRAPH_URL = "https://graph.facebook.com/v21.0";

function getToken(): string {
  const t = process.env.WA_TOKEN || process.env.FB_SYSTEM_USER_TOKEN;
  if (!t) throw new Error("WhatsApp token missing (WA_TOKEN / FB_SYSTEM_USER_TOKEN)");
  return t;
}

function getPhoneId(): string {
  const id = process.env.WA_PHONE_ID;
  if (!id) throw new Error("WA_PHONE_ID missing");
  return id;
}

type Json = Record<string, unknown>;

async function postMessage(payload: Json): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${GRAPH_URL}/${getPhoneId()}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    console.error("[wc-wa] send failed", res.status, body);
  }
  return { ok: res.ok, status: res.status, body };
}

export async function sendText(to: string, text: string) {
  return postMessage({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text.slice(0, 4096) },
  });
}

/** Two-button yes/no. Returns reply IDs `${questionId}:yes` / `${questionId}:no`. */
export async function sendYesNo(to: string, questionId: string, prompt: string) {
  return postMessage({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: prompt.slice(0, 1024) },
      action: {
        buttons: [
          { type: "reply", reply: { id: `${questionId}:yes`, title: "Yes" } },
          { type: "reply", reply: { id: `${questionId}:no`, title: "No" } },
        ],
      },
    },
  });
}

/** 1–5 rating list. Reply IDs: `${questionId}:1` ... `${questionId}:5`. */
export async function sendRating(
  to: string,
  questionId: string,
  prompt: string,
  lowLabel: string,
  highLabel: string,
) {
  const rows = [1, 2, 3, 4, 5].map((n) => {
    let suffix = "";
    if (n === 1) suffix = ` — ${lowLabel}`;
    else if (n === 5) suffix = ` — ${highLabel}`;
    const title = `${n}${suffix}`.slice(0, 24); // WhatsApp limit: 24 chars
    return { id: `${questionId}:${n}`, title };
  });

  return postMessage({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: prompt.slice(0, 1024) },
      footer: { text: "Tap a number — 1 = worst, 5 = best" },
      action: {
        button: "Rate 1–5",
        sections: [{ title: "Your rating", rows }],
      },
    },
  });
}

/** Render the next question by question shape. */
export async function sendQuestion(to: string, q: Question, total: number, idx: number) {
  const header = `Q${idx + 1}/${total} · ${q.dimension}`;
  const prompt = `${header}\n\n${q.prompt}`;
  if (q.scale.type === "yes_no") {
    return sendYesNo(to, q.id, prompt);
  }
  return sendRating(to, q.id, prompt, q.scale.lowLabel, q.scale.highLabel);
}

/** Opening menu — shown when a user with no active session messages in. */
export async function sendMenu(to: string) {
  return postMessage({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      header: { type: "text", text: "Eccellere · MSME Studio" },
      body: {
        text:
          "Hi! I help MSME owners turn cash & growth challenges into action.\n\n" +
          "Pick a quick diagnostic to get started:",
      },
      footer: { text: "Free · 5–7 minutes · 100% confidential" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "menu:wc", title: "Working Capital" } },
          { type: "reply", reply: { id: "menu:help", title: "What is this?" } },
        ],
      },
    },
  });
}
