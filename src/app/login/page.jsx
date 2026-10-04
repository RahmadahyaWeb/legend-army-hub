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
import Loading from "@/components/ui/Loading";

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
    return <Loading fullScreen message="Checking authentication..." />;
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
        {/* Left Brand Section */}
        <section className="relative hidden bg-zinc-950 lg:flex lg:flex-col justify-between p-12 xl:p-16 border-r border-zinc-900">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-10 rounded-lg object-contain"
              />
              <div>
                <div className="text-sm font-bold tracking-tight text-white">
                  LEGEND ARMY
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Command Hub
                </div>
              </div>
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-semibold tracking-tight text-white xl:text-4xl">
              Guild Operations Management
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Access administrative tools for member rosters, event setups, strategic planning, and automated Discord integrations.
            </p>
          </div>

          <div className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Legend Army. All rights reserved.
          </div>
        </section>

        {/* Right Form Section */}
        <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Hub</span>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Sign in
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Enter your administrative credentials to continue.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Email
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
                    className="h-10 w-full rounded-lg border border-zinc-200 pl-10 pr-3.5 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">
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
                    className="h-10 w-full rounded-lg border border-zinc-200 pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
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
                  className="w-full !h-10 font-medium"
                >
                  Sign in
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
