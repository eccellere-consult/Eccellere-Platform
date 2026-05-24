/**
 * WhatsApp Cloud API webhook for the Working Capital diagnostic.
 *
 *   GET  /api/whatsapp/wc-webhook  → verification handshake
 *   POST /api/whatsapp/wc-webhook  → inbound messages
 *
 * Configure in Meta Business Manager → WhatsApp → Configuration → Webhooks
 *   Callback URL: https://eccellere.co.in/api/whatsapp/wc-webhook
 *   Verify Token: value of WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *   Subscribed fields: messages
 */

import { NextRequest, NextResponse } from "next/server";
import { handleInbound } from "@/lib/wcDiagnostic/engine";

export const runtime = "nodejs";
// Webhook ingest is per-request stateful (DB writes); never cache.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

type InboundMessage = {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
};

export async function POST(req: NextRequest) {
  // ACK fast: Meta retries aggressively if we don't 200 within ~20s.
  // We parse, kick off processing asynchronously, and return 200 immediately.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Fire-and-forget — but await within an isolated try so we still log.
  processInbound(body).catch((err) => {
    console.error("[wc-webhook] processing error", err);
  });

  return NextResponse.json({ ok: true });
}

async function processInbound(body: unknown): Promise<void> {
  // Meta payload shape: entry[].changes[].value.messages[]
  const entries = (body as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: unknown })?.value as
        | { messages?: InboundMessage[] }
        | undefined;
      const messages = value?.messages;
      if (!Array.isArray(messages)) continue;
      for (const msg of messages) {
        if (!msg.from) continue;
        try {
          if (msg.type === "text") {
            await handleInbound({
              phoneNumber: msg.from,
              text: msg.text?.body,
            });
          } else if (msg.type === "interactive") {
            const reply =
              msg.interactive?.button_reply?.id ||
              msg.interactive?.list_reply?.id;
            if (reply) {
              await handleInbound({ phoneNumber: msg.from, replyId: reply });
            }
          }
        } catch (err) {
          console.error("[wc-webhook] handle error", err, "msg:", msg.id);
        }
      }
    }
  }
}
