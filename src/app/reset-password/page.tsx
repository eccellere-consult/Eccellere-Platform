"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No reset token found. Please request a new password reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
        Account Recovery
      </p>
      <h1 className="mt-4 text-center font-display text-3xl font-light text-eccellere-ink">
        Choose a new <span className="italic">password</span>
      </h1>

      <div className="mt-10 rounded bg-white p-8 shadow-sm">
        {success ? (
          <div className="text-center">
            <p className="text-sm text-eccellere-ink">
              Your password has been reset successfully.
            </p>
            <p className="mt-2 text-xs text-ink-light">
              Redirecting you to sign in&hellip;
            </p>
            <div className="mt-6">
              <Link href="/login" className="text-sm text-eccellere-gold hover:underline">
                Sign in now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                minLength={8}
                className="w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
              />
            </div>

            {error && <p className="text-sm text-eccellere-error">{error}</p>}

            <Button type="submit" disabled={loading || !token} className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-xs text-ink-light hover:text-eccellere-gold"
              >
                Request a new reset link
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-6 py-20">
          <Suspense fallback={<div className="text-sm text-ink-light">Loading&hellip;</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
