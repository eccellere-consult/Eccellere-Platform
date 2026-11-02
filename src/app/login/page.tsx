"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      const session = await getSession();
      const role = (session?.user as { role?: string })?.role;
      // Coming from a tool page: go back to it (only to a /tools/ path on this site, never to an outside address).
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      if (next && /^\/tools(\/[a-z0-9-]+)?$/.test(next)) {
        router.push(next);
      } else if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_ADMIN") {
        router.push("/admin");
      } else if (role === "SPECIALIST") {
        router.push("/specialist");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-6 py-20">
          <div className="w-full">
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Welcome Back
            </p>
            <h1 className="mt-4 text-center font-display text-3xl font-light text-eccellere-ink">
              Sign in to <span className="italic">Eccellere</span>
            </h1>

            <div className="mt-10 rounded bg-white p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-light">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-eccellere-ink/10 bg-transparent px-4 py-2.5 text-sm text-eccellere-ink focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                  />
                </div>

                {error && (
                  <p className="text-sm text-eccellere-error">{error}</p>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 space-y-3 border-t border-eccellere-ink/5 pt-6">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => signIn("google", { callbackUrl: "/login" })}
                >
                  Continue with Google
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-ink-light">
                <Link
                  href="/forgot-password"
                  className="hover:text-eccellere-gold"
                >
                  Forgot password?
                </Link>
                <Link
                  href="/register"
                  className="text-eccellere-gold hover:underline"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
