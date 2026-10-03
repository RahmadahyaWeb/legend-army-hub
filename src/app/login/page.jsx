"use client";

import { useEffect, useState } from "react";
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
import Button from "@/components/ui/Button";

/**
 * Administrator Login Authentication Page
 *
 * Why this exists:
 * Authenticates guild leadership against PostgreSQL hashed records or environment admin credentials.
 * Establishes standard session cookie (`la_session`) and redirects to `/admin`.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, redirect immediately to /admin
  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) {
          router.replace("/admin");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

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
      console.error("Login authentication error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-700/20 border border-brand-500/30">
            <ShieldCheck className="size-6 text-brand-500" />
          </div>
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-700 border-t-brand-600" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT BRAND SECTION */}
        <section className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-brand-700/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-48 -right-32 size-[520px] rounded-full bg-brand-700/10 blur-3xl pointer-events-none" />

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
                <ShieldCheck className="size-5 text-brand-500" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
                Command Administration
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                Legend Army
                <br />
                Guild Hub
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400">
                Manage members, Guild League rosters, tactical strategies, and guild
                operations from one unified command center.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <p>© {new Date().getFullYear()} Legend Army</p>
                <p>
                  Made by <span className="font-semibold text-zinc-400">XKG</span>
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
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Hub</span>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Sign in to Guild Hub
              </h2>
              <p className="mt-1.5 text-xs text-zinc-500">
                Enter your administrative credentials to access command settings.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Email Address
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-400">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@legendarmy.com"
                    className="h-10 w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 text-xs sm:text-sm placeholder:text-zinc-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Password
                </label>
                <div className="relative mt-1.5 flex items-center">
                  <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-400">
                    <LockKeyhole className="size-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-xl border border-zinc-200 pl-10 pr-10 text-xs sm:text-sm placeholder:text-zinc-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 flex items-center text-zinc-400 hover:text-zinc-600 p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="w-full !h-11"
                >
                  Sign in to Dashboard
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
