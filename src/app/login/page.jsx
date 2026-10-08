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
  Shield,
  ShieldCheck,
  Swords,
  Trophy,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";

/**
 * Administrator Login Authentication Page
 *
 * Why this exists:
 * Authenticates guild leadership against PostgreSQL hashed credentials or configured officer accounts.
 * Establishes the standard authenticated session and redirects to `/admin`.
 * Styled using the Minimalist Comic Pixel design system: 100% light mode, warm off-white tones,
 * crisp 2px ink outlines, tactile comic drop shadows, and modern readable typography.
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
    <main className="min-h-screen bg-[#faf9f6] font-sans text-zinc-950 flex flex-col justify-center">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Brand Showcase (Light Mode Only - Warm Canvas) */}
        <section className="relative hidden lg:flex lg:flex-col justify-between p-12 xl:p-16 border-r-2 border-zinc-950 bg-[#f7f6f2] comic-dots-bg">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex size-10 shrink-0 items-center justify-center border-2 border-zinc-950 bg-brand-600 shadow-[2px_2px_0px_#18181b] group-hover:bg-brand-700 transition">
                <img
                  src="/logo.png"
                  alt="Legend Army"
                  className="size-8 object-contain"
                />
              </div>
              <div>
                <span className="font-pixel text-base font-bold text-zinc-950 block leading-tight">
                  LEGEND ARMY
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 block leading-tight">
                  Officer Command Core
                </span>
              </div>
            </Link>
          </div>

          <div className="max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 border-2 border-zinc-950 bg-white px-3 py-1 text-xs font-bold text-zinc-900 shadow-[2px_2px_0px_#18181b]">
              <Shield className="size-3.5 text-brand-600" />
              <span>Administrative Operations Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black font-sans tracking-tight text-zinc-950 leading-[1.15]">
              Guild Operations & Strategic Command
            </h1>

            <p className="text-sm leading-relaxed text-zinc-700 font-normal">
              Authorize officer credentials to coordinate 60-player battlefield rosters,
              Valkyrie Cup tournament submissions, roll-call attendance, and tactical directives.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border-2 border-zinc-950 bg-white p-3 shadow-[2px_2px_0px_#18181b]">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-950">
                  <Swords className="size-3.5 text-brand-600" />
                  <span>War Rosters</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 leading-snug">
                  Top, Mid, and Bot lane positioning with Gear Score balancing.
                </p>
              </div>

              <div className="border-2 border-zinc-950 bg-white p-3 shadow-[2px_2px_0px_#18181b]">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-950">
                  <Trophy className="size-3.5 text-amber-600" />
                  <span>Valkyrie Cup</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600 leading-snug">
                  Manage 8-player squad approvals and bracket seeding.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-zinc-500">
            © {new Date().getFullYear()} Legend Army · Classic Ragnarok Guild Management
          </div>
        </section>

        {/* Right Form Section */}
        <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#faf9f6]">
          <div className="w-full max-w-sm">
            <div className="mb-6 flex items-center justify-between">
              <Link href="/">
                <Button variant="secondary" size="xs" icon={ArrowLeft}>
                  Public Hub
                </Button>
              </Link>

              <div className="lg:hidden flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center border-2 border-zinc-950 bg-brand-600 shadow-[1px_1px_0px_#18181b]">
                  <img
                    src="/logo.png"
                    alt="Legend Army"
                    className="size-5 object-contain"
                  />
                </div>
                <span className="font-pixel text-xs font-bold text-zinc-950">
                  LEGEND ARMY
                </span>
              </div>
            </div>

            <div className="border-2 border-zinc-950 bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#18181b]">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 border border-zinc-950 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-900 uppercase font-mono mb-2">
                  <ShieldCheck className="size-3 text-brand-600" />
                  <span>Officer Authentication</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-zinc-950 tracking-tight">
                  Sign In to Console
                </h2>
                <p className="mt-1 text-xs text-zinc-600 font-sans">
                  Enter authorized administrator credentials.
                </p>
              </div>

              {error && (
                <div className="mb-5 border-2 border-red-700 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-[2px_2px_0px_#b91c1c]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 font-sans">
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
                      className="h-10 w-full border-2 border-zinc-950 bg-white pl-9 pr-3 text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-colors font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-950 mb-1.5 font-sans">
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
                      className="h-10 w-full border-2 border-zinc-950 bg-white pl-9 pr-10 text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-colors font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 flex items-center text-zinc-500 hover:text-zinc-950 p-0.5 cursor-pointer"
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
                    className="w-full !h-10 text-sm"
                  >
                    Authenticate Session
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

