"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** "Tell me when agents go live". Saved on the same list as the newsletter, and the form says so. */
export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const r = await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState(r.ok ? "done" : "error");
    } catch { setState("error"); }
  }

  if (state === "done") return <p role="status" className="text-sm text-eccellere-cream">Thank you. We will email you as agents go live.</p>;
  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label htmlFor="notify-email" className="sr-only">Email address</label>
      <input
        id="notify-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
        className="min-w-0 flex-1 border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-eccellere-gold focus:outline-none"
      />
      <Button type="submit" disabled={state === "busy"}>{state === "busy" ? "Saving…" : "Notify me"}</Button>
      {state === "error" && <p role="alert" className="text-xs text-red-300 sm:basis-full">That did not work. Please try again.</p>}
    </form>
  );
}
