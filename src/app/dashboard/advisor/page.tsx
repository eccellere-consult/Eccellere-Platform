"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, RotateCcw, BrainCircuit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Source { n: number; title: string; href: string; kind: string; ref?: string }
interface Message {
  role: "user" | "assistant";
  text: string;
  ts: string;
  sources?: Source[];
  mode?: string;
}

const SUGGESTIONS = [
  "Our manufacturing rejection rate is rising. How do I find the cause?",
  "How can I improve my working capital cycle?",
  "Should we invest in automation or fix our process first?",
  "How do I build a 12-month growth plan?",
  "Which Eccellere tool helps me prioritise projects?",
];

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const greeting = (name?: string): Message => ({
  role: "assistant",
  text: `Hello${name ? ` ${name.split(" ")[0]}` : ""}! I'm your Eccellere Advisor.\n\nTell me about a business problem and I will structure it, look at what Eccellere's tools, services and resources say, and recommend practical next steps. Add as much context as you can: your business type, size and what you have already tried.`,
  ts: now(),
});

const KIND: Record<string, string> = { tool: "Tool", service: "Service", resource: "Resource", knowledge: "Eccellere knowledge" };

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([greeting()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user?.name) setMessages((m) => (m.length === 1 ? [greeting(d.user.name)] : m)); })
      .catch(() => {});
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const history = messages.slice(1).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: msg, ts: now() }]);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, history }) });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok ? data.reply : data.error || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply, ts: now(), sources: res.ok ? data.sources : undefined, mode: res.ok ? data.mode : undefined }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I could not reach the Advisor. Please check your connection and try again.", ts: now() }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages((m) => [{ ...m[0], ts: now() }]);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-64px-4rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">
            Client Dashboard
          </p>
          <h1 className="mt-0.5 font-display text-3xl font-light text-eccellere-ink">Eccellere AI Advisor</h1>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" aria-live="polite">
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
                    : "bg-eccellere-gold-deep text-white"
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
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 border border-eccellere-border bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eccellere-gold-deep">From Eccellere</p>
                    <ul className="m-0 mt-1 list-none space-y-1 p-0 text-xs text-ink-mid">
                      {m.sources.map((s) => (
                        <li key={s.n}>
                          [S{s.n}] {s.href ? <Link href={s.href} className="text-eccellere-ink underline hover:text-eccellere-gold-deep">{s.title}</Link> : <span className="text-eccellere-ink">{s.title}</span>} · {KIND[s.kind] ?? s.kind}{s.ref ? `, ${s.ref}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-ink-light">{m.ts}{m.mode ? ` · ${m.mode === "deep" ? "Deep analysis" : m.mode === "quick" ? "Quick answer" : "Advisory answer"}` : ""}</p>
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
              maxLength={2000}
              aria-label="Ask the Advisor"
              placeholder="Describe your business problem or ask a question..."
              className="flex-1 rounded border border-eccellere-ink/15 bg-eccellere-cream px-4 py-2.5 text-sm text-eccellere-ink placeholder:text-ink-light/60 focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
            />
            <Button type="submit" disabled={!input.trim() || loading} className="flex items-center gap-1.5">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-ink-light">
            AI-drafted guidance from Eccellere content and general knowledge. It never names companies or individuals. Consult a specialist for binding advice.
          </p>
        </div>
      </div>
    </div>
  );
}
