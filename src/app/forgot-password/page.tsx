"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-6 py-20">
          <div className="w-full">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Account Recovery
            </p>
            <h1 className="mt-4 text-center font-display text-3xl font-light text-eccellere-ink">
              Reset your <span className="italic">password</span>
            </h1>

            <div className="mt-10 rounded bg-white p-8 shadow-sm">
              {submitted ? (
                <div className="text-center">
                  <p className="text-sm text-eccellere-ink">
                    If an account exists for <strong>{email}</strong>, you will
                    receive a password reset link shortly.
                  </p>
                  <p className="mt-3 text-xs text-ink-light">
                    Check your spam folder if you don&apos;t see it within a few minutes.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/login"
                      className="text-sm text-eccellere-gold hover:underline"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <p className="text-sm text-ink-light">
                    Enter the email address associated with your account and we&apos;ll
                    send you a link to reset your password.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                    />
                  </div>

                  {error && <p className="text-sm text-eccellere-error">{error}</p>}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-xs text-ink-light hover:text-eccellere-gold"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
