"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  Swords,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Members",
    href: "/admin/members",
    icon: Users,
  },
  {
    name: "Event Guild",
    href: "/admin/guild-leagues",
    icon: Swords,
  },
  {
    name: "Strategy",
    href: "/admin/strategy",
    icon: ScrollText,
  },
  {
    name: "Attendance",
    href: "/admin/attendance",
    icon: UserCheck,
  },
  {
    name: "Admins",
    href: "/admin/users",
    icon: ShieldCheck,
  },
];

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
        <img
          src="/logo.png"
          alt="Legend Army"
          className="size-9 object-contain"
        />
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-content-strong">
          LEGEND ARMY
        </div>

        <div className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-content-subtle">
          Guild Hub
        </div>
      </div>
    </div>
  );
}

function Navigation({ onNavigate, pathname }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-brand-50 text-brand-700 font-semibold"
                : "text-content-muted hover:bg-surface-100 hover:text-content-strong",
            ].join(" ")}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MadeBy() {
  return (
    <div className="px-6 py-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-content-subtle">
        Made by
      </p>
      <p className="mt-0.5 text-xs font-semibold text-content-muted">XKG</p>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        // If unauthenticated, allow redirect or check localStorage fallback
        const localAuth = typeof window !== "undefined" && localStorage.getItem("la_auth");
        if (!data.authenticated && !localAuth) {
          router.replace("/login");
          return;
        }
      } catch {
        // Safe bypass in case of network or setup
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("la_auth");
    }
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    router.replace("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-white"
            >
              <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z" />
            </svg>
          </div>
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-line bg-white lg:flex lg:flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
          <Brand />
        </div>

        <Navigation pathname={pathname} />

        <div className="shrink-0 border-t border-line bg-white">
          <MadeBy />

          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-content-muted transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      <div
        aria-hidden="true"
        onClick={closeMobileMenu}
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* MOBILE DRAWER */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-white shadow-xl transition-transform duration-200 ease-out will-change-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Brand />

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors duration-150 hover:bg-surface-100 hover:text-content-strong"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <Navigation pathname={pathname} onNavigate={closeMobileMenu} />

        <div className="shrink-0 border-t border-line bg-white">
          <MadeBy />

          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-content-muted transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ADMIN AREA */}
      <div className="min-h-screen lg:pl-64">
        {/* FIXED HEADER */}
        <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-line bg-white lg:left-64">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-white text-content-muted transition-colors duration-150 hover:bg-surface-100 hover:text-content-strong"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>

              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-content-strong">
                  LEGEND ARMY
                </div>

                <div className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-content-subtle">
                  Guild Hub
                </div>
              </div>
            </div>

            <div className="hidden lg:block" />

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-medium text-content-muted transition-colors duration-150 hover:bg-surface-100 hover:text-content-strong"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Public Site</span>
              <span className="sm:hidden">Public</span>
            </Link>
          </div>
        </header>

        {/* HEADER OFFSET */}
        <div className="h-16" />

        {/* PAGE CONTENT */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="border-t border-line px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-content-subtle">
              © {new Date().getFullYear()} Legend Army
            </p>

            <p className="text-xs text-content-subtle">
              Made by{" "}
              <span className="font-semibold text-content-muted">XKG</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
