"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "What services do you offer?",
  "How does the marketplace work?",
  "What is Agentic AI?",
  "How do I get started?",
  "Tell me about pricing",
];

function generateResponse(input: string): string {
  const q = input.toLowerCase();

  if (q.includes("price") || q.includes("cost") || q.includes("pricing") || q.includes("₹")) {
    return "Our marketplace has assets starting from ₹799 — like the Prompt Engineering Playbook. Premium toolkits range from ₹1,499 to ₹4,499. We also offer subscription plans for ongoing access. Want me to recommend something for your budget?";
  }
  if (q.includes("agentic ai") || q.includes("ai strategy") || q.includes("artificial intelligence")) {
    return "Agentic AI is our flagship service. We help you identify where AI genuinely creates value in your business — then design and implement it. Our AI Readiness Assessment (free, 5 questions) is a great starting point. Would you like to take it now?";
  }
  if (q.includes("assessment") || q.includes("ai readiness")) {
    return "Our free AI Readiness Assessment takes about 2 minutes. You'll answer 5 questions about your AI strategy, data infrastructure, and processes — and receive a personalised score with sector benchmarks. 👉 Visit /assessment to start.";
  }
  if (q.includes("service") || q.includes("what do you") || q.includes("what does eccellere")) {
    return "Eccellere offers five core services:\n\n• **Strategy** — Growth plans, market entry, fundraising readiness\n• **Process Transformation** — Lean ops, SOPs, KPI frameworks\n• **Agentic AI** — AI strategy, agent design, implementation\n• **Digital** — D2C enablement, tech stack advisory\n• **Organisation Transformation** — Org design, OKRs, change management\n\nWhich area are you most interested in?";
  }
  if (q.includes("marketplace") || q.includes("framework") || q.includes("toolkit") || q.includes("playbook")) {
    return "Our marketplace has 200+ business frameworks, toolkits, and playbooks — all designed for Indian MSMEs. Categories include Strategy, Agentic AI, Process Transformation, Digital, and Organisation. Bestsellers start from ₹799. Visit /marketplace to browse.";
  }
  if (q.includes("manufacturing") || q.includes("factory") || q.includes("lean")) {
    return "We specialise in Manufacturing transformation. Our top resources for manufacturers include:\n\n• Lean Manufacturing Implementation Guide (₹3,499)\n• Supply Chain Optimisation Toolkit (₹4,499)\n• Quality Management System Template Pack (₹3,999)\n\nWould you like more details on any of these?";
  }
  if (q.includes("retail") || q.includes("d2c") || q.includes("ecommerce") || q.includes("e-commerce")) {
    return "For Retail and D2C businesses, we offer specialised resources:\n\n• E-Commerce Launch Checklist (₹999)\n• Pricing Strategy Workshop Kit (₹2,499)\n• MSME Growth Strategy Playbook (₹2,499)\n\nWe also offer D2C strategy consultations. Want to book a call?";
  }
  if (q.includes("logistics") || q.includes("supply chain") || q.includes("warehouse")) {
    return "For Logistics businesses, our Supply Chain Optimisation Toolkit (₹4,499) is our most popular resource. It includes end-to-end diagnostics, KPI dashboards, and improvement roadmaps. We also offer specialist consulting for 3PL and last-mile operators.";
  }
  if (q.includes("specialist") || q.includes("consultant") || q.includes("expert") || q.includes("hire")) {
    return "You can hire vetted specialist consultants directly through Eccellere. All specialists have 3+ years of domain experience and have been reviewed by our team. Visit the Specialist Portal or book a matching call with our team at /contact.";
  }
  if (q.includes("get started") || q.includes("how to start") || q.includes("new") || q.includes("begin")) {
    return "The best way to get started with Eccellere:\n\n1. **Take the free AI Readiness Assessment** → /assessment\n2. **Browse the Marketplace** → /marketplace\n3. **Book a discovery call** → /contact\n\nMost clients start with the assessment — it gives a personalised score and recommendations in under 2 minutes.";
  }
  if (q.includes("contact") || q.includes("call") || q.includes("talk") || q.includes("speak")) {
    return "You can reach the Eccellere team at:\n\n📧 hello@eccellere.in\n📞 +91 98000 00000\n📍 Bengaluru, India\n\nOr book a discovery call at /contact. We typically respond within 4 business hours.";
  }
  if (q.includes("msme") || q.includes("small business") || q.includes("startup")) {
    return "Eccellere is purpose-built for India's 63 million MSMEs. We've designed every framework, pricing point, and engagement model for the realities of Indian businesses doing ₹1Cr–₹200Cr in revenue. Our MSME Hub at /msme-hub is a great starting point.";
  }
  if (q.includes("hello") || q.includes("hi ") || q.includes("hey") || q.includes("namaste")) {
    return "Hello! 👋 I'm Eccellere's AI advisor. I can help you explore our services, find the right framework for your business, or guide you to the right specialist.\n\nWhat's the biggest challenge your business is facing right now?";
  }
  if (q.includes("thank") || q.includes("thanks")) {
    return "You're welcome! Have more questions anytime — I'm here to help. You can also reach our team at hello@eccellere.in or visit /contact to book a call.";
  }

  // Default
  return "That's a great question. To give you the most relevant answer, could you tell me a bit more about your business? For example:\n\n• What sector are you in? (Manufacturing, Retail, Logistics, Consumer Products)\n• What's your main challenge right now?\n\nOr, explore our services at /services or browse frameworks at /marketplace.";
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm Eccellere's AI advisor. I can help you find the right strategy, framework, or specialist for your business.\n\nWhat can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  function handleSend(text?: string) {
    const content = text ?? input.trim();
    if (!content) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: generateResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  }

  function handleReset() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm Eccellere's AI advisor. I can help you find the right strategy, framework, or specialist for your business.\n\nWhat can I help you with today?",
        timestamp: new Date(),
      },
    ]);
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/(\/\S+)/g, '<a href="$1" class="text-eccellere-gold underline hover:text-amber-400">$1</a>');
      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-eccellere-gold text-white shadow-lg transition-transform hover:scale-105 hover:bg-amber-500"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-eccellere-ink px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eccellere-gold">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Eccellere Advisor</p>
                  <p className="text-[11px] text-white/50">AI-powered · Always on</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  aria-label="Reset conversation"
                  className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-eccellere-cream/50 p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                      msg.role === "assistant"
                        ? "bg-eccellere-gold text-white"
                        : "bg-eccellere-ink text-white"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "assistant"
                        ? "bg-white text-eccellere-ink shadow-sm"
                        : "bg-eccellere-ink text-white"
                    )}
                  >
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-gold text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-white px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-eccellere-gold/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies (only when one message) */}
            {messages.length === 1 && (
              <div className="border-t border-eccellere-ink/5 bg-white px-3 pt-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSend(r)}
                    className="rounded-full border border-eccellere-gold/30 px-3 py-1 text-xs text-eccellere-gold transition-colors hover:bg-eccellere-gold hover:text-white"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-eccellere-ink/5 bg-white px-3 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-eccellere-ink/10 bg-eccellere-cream px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent text-sm text-eccellere-ink placeholder:text-ink-light focus:outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-eccellere-gold text-white transition-opacity disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-ink-light">
                AI advisor · Not a substitute for professional advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
