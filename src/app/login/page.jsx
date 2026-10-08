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
 * Administrator Login Authentication Page with Retro Pixel Styling
 *
 * Why this exists:
 * Authenticates guild leadership against PostgreSQL hashed records or environment admin credentials.
 * Establishes standard session cookie (`la_session`) and redirects to `/admin`.
 * Features Ragnarok Online command console visual identity: sharp borders, retro branding, and tactile form controls.
 *
 * @returns {JSX.Element} Rendered admin login view
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
    return <Loading fullScreen message="Verifying session..." />;
  }

  return (
    <main className="min-h-screen bg-zinc-50 font-sans">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
        {/* Left Brand Section */}
        <section className="relative hidden bg-zinc-950 lg:flex lg:flex-col justify-between p-12 xl:p-16 border-r-2 border-zinc-950 pixel-grid-bg">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center border-2 border-white bg-brand-600 pixel-shadow-sm">
                <img
                  src="/logo.png"
                  alt="Legend Army"
                  className="size-8 object-contain"
                />
              </div>
              <div>
                <div className="font-pixel text-base font-bold text-white leading-tight">
                  LEGEND ARMY
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-400 leading-tight">
                  Guild Command Core
                </div>
              </div>
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="font-pixel text-3xl font-bold tracking-tight text-white xl:text-4xl leading-tight">
              Guild Operations Console
            </h1>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
              Access administrative controls for battlefield rosters, event deployment, tactical directives, and Discord automation.
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            © {new Date().getFullYear()} Legend Army. Classic Ragnarok Operations.
          </div>
        </section>

        {/* Right Form Section */}
        <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <Link href="/">
                <Button variant="secondary" size="xs" icon={ArrowLeft}>
                  Back to Public Portal
                </Button>
              </Link>
            </div>

            <div className="border-2 border-zinc-950 bg-white p-6 sm:p-8 pixel-shadow">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold font-pixel text-zinc-950 tracking-tight">
                  Officer Sign In
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Enter authorized administrator credentials.
                </p>
              </div>

              {error && (
                <div className="mb-5 border-2 border-red-700 bg-red-50 p-3 text-xs font-bold text-red-900 pixel-shadow-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-pixel uppercase tracking-wide text-zinc-950 mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-500">
                      <Mail className="size-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@legendarmy.com"
                      className="h-10 w-full border-2 border-zinc-950 bg-white pl-9 pr-3 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-pixel uppercase tracking-wide text-zinc-950 mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-500">
                      <LockKeyhole className="size-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 w-full border-2 border-zinc-950 bg-white pl-9 pr-10 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 flex items-center text-zinc-500 hover:text-zinc-900 p-0.5"
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
                    className="w-full !h-10"
                  >
                    Authenticate
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
