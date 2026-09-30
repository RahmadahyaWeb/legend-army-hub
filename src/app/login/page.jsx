"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("la_auth", JSON.stringify(data.user));
      }

      router.replace("/admin");
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT BRAND SECTION */}
        <section className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-red-700/20 blur-3xl" />
          <div className="absolute -bottom-48 -right-32 size-[520px] rounded-full bg-red-700/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
            <Link href="/" className="flex w-fit items-center gap-3">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-12 rounded-xl object-contain"
              />
              <div>
                <div className="text-sm font-bold tracking-wide text-white">
                  LEGEND ARMY
                </div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Guild Hub
                </div>
              </div>
            </Link>

            <div className="my-auto max-w-xl">
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <ShieldCheck className="size-5 text-red-500" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
                Administration
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                Legend Army
                <br />
                Guild Hub
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400">
                Manage members, Guild League rosters, strategies, and guild
                operations with real-time PostgreSQL database support.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600">
                  © {new Date().getFullYear()} Legend Army
                </p>
                <p className="text-xs text-zinc-600">
                  Made by{" "}
                  <span className="font-semibold text-zinc-400">XKG</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM SECTION */}
        <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Sign in to Guild Hub
              </h2>
              <p className="mt-1.5 text-xs text-zinc-500">
                Enter your administrative credentials to access the hub.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@legendarmy.com"
                    className="block w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <LockKeyhole className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in to Dashboard"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
