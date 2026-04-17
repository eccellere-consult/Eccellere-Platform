"use client";

import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, BrainCircuit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
  ts: string;
}

const SUGGESTIONS = [
  "How can I improve my working capital cycle?",
  "What AI tools are right for my manufacturing MSME?",
  "How do I build a 12-month growth plan?",
  "What's the best way to reduce supply chain costs?",
  "How do I prepare for investor due diligence?",
];

const INITIAL: Message[] = [
  {
    role: "assistant",
    text: "Hello Rahul! I'm your Eccellere AI Advisor — trained on MSME strategy, operations, finance, and digital transformation insights.\n\nAsk me anything about growing your business, improving processes, or understanding our marketplace assets. How can I help you today?",
    ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "That's a great question. Based on best practices for Indian MSMEs, I'd recommend starting with a structured assessment of your current processes before making any investment decisions. Our Specialist network can also provide a tailored engagement — would you like me to summarise the relevant marketplace assets on this topic?",
  working:
    "Working capital optimisation typically focuses on three levers: **receivables (debtor days)**, **payables (creditor days)**, and **inventory days**. The goal is to reduce your Cash Conversion Cycle.\n\nFor a manufacturing MSME, 30-day receivables and 60-day payables is a common target. Our *Working Capital Optimisation Framework* by Meera Iyer covers this with a ready-to-use Excel model — you already own that asset in your library!",
  ai: "For manufacturing MSMEs at your readiness level (72%), I'd recommend starting with **process automation** before jumping to machine learning.\n\nQuick wins:\n• AP/AR automation using tools like Zoho Books or Tally integrations\n• Demand forecasting using our Excel-based model (you own the *Demand Forecasting Model* in your library)\n• Chatbot for customer FAQs\n\nShall I explain how to build a 6-month AI adoption roadmap?",
  growth:
    "A solid 12-month growth plan for an MSME covers five pillars: Market, Operations, Finance, People, and Digital. I'd suggest:\n\n1. **Month 1–2:** Diagnose — our MSME Growth Strategy Playbook (in your library) has a structured template\n2. **Month 3–4:** Prioritise 2–3 high-impact initiatives\n3. **Month 5–10:** Execute with quarterly reviews\n4. **Month 11–12:** Measure outcomes and plan the next cycle\n\nWould you like a recommendation for a Strategy specialist engagement?",
};

function getResponse(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("working capital") || t.includes("cash flow") || t.includes("receivable")) return MOCK_RESPONSES.working;
  if (t.includes("ai") || t.includes("automation") || t.includes("digital")) return MOCK_RESPONSES.ai;
  if (t.includes("growth") || t.includes("12-month") || t.includes("plan")) return MOCK_RESPONSES.growth;
  return MOCK_RESPONSES.default;
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: msg, ts }]);
    setLoading(true);
    setTimeout(() => {
      const replyTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: getResponse(msg), ts: replyTs },
      ]);
      setLoading(false);
    }, 900);
  }

  function reset() {
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages([{ ...INITIAL[0], ts }]);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-64px-4rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Client Dashboard
          </p>
          <h1 className="mt-0.5 font-display text-3xl font-light text-eccellere-ink">AI Advisor</h1>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                  m.role === "assistant"
                    ? "bg-eccellere-ink text-eccellere-gold"
                    : "bg-eccellere-gold text-white"
                )}
              >
                {m.role === "assistant" ? (
                  <BrainCircuit className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              {/* Bubble */}
              <div className={cn("max-w-[75%]", m.role === "user" && "items-end flex flex-col")}>
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-eccellere-cream text-eccellere-ink"
                      : "bg-eccellere-ink text-white"
                  )}
                >
                  {m.text.split("\n").map((line, li) => (
                    <p key={li} className={li > 0 ? "mt-2" : ""}>
                      {line.split(/\*\*(.*?)\*\*/).map((part, pi) =>
                        pi % 2 === 1 ? (
                          <strong key={pi}>{part}</strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-ink-light">{m.ts}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-ink text-eccellere-gold">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-eccellere-cream px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-eccellere-gold [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-eccellere-gold [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-eccellere-gold [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (only show when only initial message) */}
        {messages.length === 1 && (
          <div className="border-t border-eccellere-ink/5 px-6 py-3">
            <p className="mb-2 text-[11px] text-ink-light">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-sm border border-eccellere-ink/10 bg-eccellere-cream px-3 py-1.5 text-xs text-ink-mid transition-colors hover:border-eccellere-gold/40 hover:text-eccellere-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-eccellere-ink/5 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-4 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="flex items-center gap-1.5">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] text-ink-light">
            AI Advisor responses are for guidance only. Consult a specialist for binding advice.
          </p>
        </div>
      </div>
    </div>
  );
}
