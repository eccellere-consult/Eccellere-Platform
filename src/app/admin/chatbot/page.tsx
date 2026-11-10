"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Send, Bot, User, Settings, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
};

const sampleConversations = [
  {
    id: 1,
    user: "Rajesh Kumar",
    preview: "How can Eccellere help with warehouse automation?",
    messages: 6,
    date: "Today, 2:15 PM",
    resolved: true,
  },
  {
    id: 2,
    user: "Priya Sharma",
    preview: "I need help choosing a strategy playbook",
    messages: 4,
    date: "Today, 11:30 AM",
    resolved: true,
  },
  {
    id: 3,
    user: "Anonymous",
    preview: "What are your pricing plans for MSMEs?",
    messages: 3,
    date: "Yesterday",
    resolved: false,
  },
  {
    id: 4,
    user: "Amit Desai",
    preview: "Can I speak with a manufacturing specialist?",
    messages: 8,
    date: "Yesterday",
    resolved: true,
  },
  {
    id: 5,
    user: "Sneha Patel",
    preview: "AI readiness assessment — how does scoring work?",
    messages: 5,
    date: "Apr 10",
    resolved: true,
  },
];

const stats = [
  { label: "Total Conversations", value: "1,284", change: "+12%" },
  { label: "Avg Response Time", value: "1.2s", change: "-0.3s" },
  { label: "Resolution Rate", value: "87%", change: "+4%" },
  { label: "Escalated to Human", value: "13%", change: "-2%" },
];

const systemPromptDefault = `You are Eccellere AI Assistant, a knowledgeable consultant for Indian MSMEs. 
You help users with:
- Understanding Eccellere's consulting services
- Recommending marketplace assets
- Answering questions about AI readiness
- Guiding MSME clients through digital transformation
Always be professional, warm, and use Indian business context.`;

export default function AdminChatbot() {
  const [activeTab, setActiveTab] = useState<"conversations" | "playground" | "settings">("conversations");
  const [playgroundMessages, setPlaygroundMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "Hello! I'm the Eccellere AI Assistant. How can I help you today?", timestamp: "Just now" },
  ]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(systemPromptDefault);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [playgroundMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: input, timestamp: "Just now" };
    setPlaygroundMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      const responses = [
        "That's a great question! Based on what you've described, I'd recommend exploring our Strategy & Advisory services. Would you like me to share more details?",
        "For manufacturing MSMEs, our Lean Manufacturing Implementation Guide has been very popular. It covers process optimisation, waste reduction, and quality management.",
        "Our AI Readiness Assessment can help you understand where your business stands. It takes about 5 minutes and provides a detailed score with recommendations.",
        "I'd be happy to connect you with one of our specialists. Could you tell me more about your industry and the specific challenges you're facing?",
      ];
      const reply: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: "Just now",
      };
      setPlaygroundMessages((prev) => [...prev, reply]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Chatbot Management</h1>
          <div className="flex-1" />
          <div className="flex gap-1 rounded-md bg-eccellere-ink/5 p-0.5">
            {[
              { key: "conversations" as const, icon: MessageCircle, label: "Conversations" },
              { key: "playground" as const, icon: Bot, label: "Playground" },
              { key: "settings" as const, icon: Settings, label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.key ? "bg-white text-eccellere-ink shadow-sm" : "text-ink-light hover:text-ink-mid"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        <p role="note" className="mb-6 rounded border border-eccellere-gold/40 bg-eccellere-gold/10 p-4 text-sm text-eccellere-ink">
          <strong>Preview only.</strong> The website chatbot does not save conversations yet, so the figures, conversations and replies on this screen are
          examples, and the prompt below is not sent anywhere. They are not real customer data.
        </p>
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-ink-light">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-light text-eccellere-ink">{s.value}</span>
                <span className={cn("text-xs", s.change.startsWith("+") || s.change.startsWith("-0") ? "text-eccellere-teal" : "text-eccellere-gold")}>
                  {s.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Conversations tab */}
        {activeTab === "conversations" && (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="border-b border-eccellere-ink/5 px-6 py-3">
              <h2 className="text-sm font-medium text-eccellere-ink">Recent Conversations</h2>
            </div>
            <div className="divide-y divide-eccellere-ink/5">
              {sampleConversations.map((conv) => (
                <div key={conv.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-eccellere-cream/50">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", conv.user === "Anonymous" ? "bg-eccellere-ink/5" : "bg-eccellere-gold/10")}>
                    <User className={cn("h-4 w-4", conv.user === "Anonymous" ? "text-ink-light" : "text-eccellere-gold")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-eccellere-ink">{conv.user}</p>
                      <span className={cn("rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wider", conv.resolved ? "bg-eccellere-teal/10 text-eccellere-teal" : "bg-eccellere-gold/10 text-eccellere-gold")}>
                        {conv.resolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-ink-light">{conv.preview}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-light">{conv.date}</p>
                    <p className="text-[10px] text-ink-light">{conv.messages} msgs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playground tab */}
        {activeTab === "playground" && (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-3">
              <h2 className="text-sm font-medium text-eccellere-ink">Test Playground</h2>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs"
                onClick={() => setPlaygroundMessages([{ id: 1, role: "assistant", text: "Hello! I'm the Eccellere AI Assistant. How can I help you today?", timestamp: "Just now" }])}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <div className="flex h-[400px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {playgroundMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10">
                        <Bot className="h-4 w-4 text-eccellere-gold" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2.5 text-sm",
                      msg.role === "assistant" ? "bg-eccellere-cream text-eccellere-ink" : "bg-eccellere-gold text-white"
                    )}>
                      {msg.text}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eccellere-ink/5">
                        <User className="h-4 w-4 text-ink-mid" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-eccellere-ink/5 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a test message..."
                    className="flex-1 rounded-md border border-eccellere-ink/10 bg-eccellere-cream/50 px-4 py-2.5 text-sm placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                  <Button onClick={handleSend} size="sm" className="px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-eccellere-ink">System Prompt</h2>
              <p className="mt-1 text-xs text-ink-light">Configure the AI assistant&apos;s personality and capabilities.</p>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                className="mt-4 w-full rounded-md border border-eccellere-ink/10 bg-eccellere-cream/50 px-4 py-3 font-mono text-xs text-eccellere-ink placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSystemPrompt(systemPromptDefault)}>Reset to Default</Button>
                <Button size="sm">Save Changes</Button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-eccellere-ink">Configuration</h2>
              <div className="mt-4 space-y-4">
                {[
                  { label: "Auto-Greeting", desc: "Send welcome message when chat opens", enabled: true },
                  { label: "Escalation Trigger", desc: "Auto-escalate after 3 unresolved attempts", enabled: true },
                  { label: "Collect Email", desc: "Ask for email before starting conversation", enabled: false },
                  { label: "Business Hours Only", desc: "Show offline message outside 9 AM–6 PM IST", enabled: false },
                  { label: "Analytics Tracking", desc: "Track conversation metrics and user satisfaction", enabled: true },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between border-b border-eccellere-ink/5 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm text-eccellere-ink">{setting.label}</p>
                      <p className="text-xs text-ink-light">{setting.desc}</p>
                    </div>
                    <div className={cn(
                      "flex h-6 w-10 cursor-pointer items-center rounded-full px-0.5 transition-colors",
                      setting.enabled ? "bg-eccellere-gold" : "bg-eccellere-ink/10"
                    )}>
                      <div className={cn(
                        "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        setting.enabled && "translate-x-4"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
