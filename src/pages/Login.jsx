import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { auth } from "../lib/firebase";

export default function Login() {
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error(error);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT */}
        <section className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col">
          <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-red-700/20 blur-3xl" />

          <div className="absolute -bottom-48 -right-32 size-[520px] rounded-full bg-red-700/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
            <Link to="/" className="flex w-fit items-center gap-3">
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
                Manage members, Guild League rosters, events, and guild
                activities from one place.
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

        {/* RIGHT */}
        <section className="flex min-h-screen flex-col bg-surface-100">
          {/* MOBILE HEADER */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 rounded-lg object-contain"
              />

              <div>
                <div className="text-xs font-bold text-content-strong">
                  LEGEND ARMY
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-content-subtle">
                  Guild Hub
                </div>
              </div>
            </Link>

            <Link
              to="/"
              className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-white text-content-muted"
              aria-label="Back to public site"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </header>

          {/* LOGIN */}
          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 hidden lg:block">
                  <img
                    src="/logo.png"
                    alt="Legend Army"
                    className="size-14 rounded-xl object-contain"
                  />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Admin Panel
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-content-strong">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-content-muted">
                  Sign in to manage Legend Army Guild Hub.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-content-strong"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      autoFocus
                      required
                      className="h-12 w-full rounded-lg border border-line-strong bg-white pl-11 pr-4 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-content-strong"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-lg border border-line-strong bg-white pl-11 pr-12 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-content-subtle transition hover:bg-surface-100 hover:text-content-strong"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-line pt-6">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-content-muted transition hover:text-brand-600"
                >
                  <ArrowLeft className="size-4" />
                  Back to Guild Portal
                </Link>
              </div>

              <div className="mt-10 text-center lg:hidden">
                <p className="text-xs text-content-subtle">
                  © {new Date().getFullYear()} Legend Army
                  <span className="mx-2">·</span>
                  Made by{" "}
                  <span className="font-semibold text-content-muted">XKG</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
