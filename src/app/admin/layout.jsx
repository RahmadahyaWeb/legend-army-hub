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
import Loading from "@/components/ui/Loading";

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
    name: "Guild Events",
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
    <div className="flex min-w-0 items-center gap-2.5">
      <img
        src="/logo.png"
        alt="Legend Army"
        className="size-8 object-contain"
      />
      <div className="min-w-0">
        <span className="truncate text-sm font-bold tracking-tight text-zinc-900 block leading-tight">
          LEGEND ARMY
        </span>
        <span className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-400 block leading-tight">
          Guild Hub
        </span>
      </div>
    </div>
  );
}

function Navigation({ onNavigate, pathname }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
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
              "flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-medium transition-colors",
              isActive
                ? "bg-zinc-100 text-zinc-900 font-semibold"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            <Icon className="size-4 shrink-0 text-zinc-500" />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
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
    return <Loading fullScreen message="Authenticating..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-4">
          <Brand />
        </div>

        <Navigation pathname={pathname} />

        <div className="shrink-0 border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      <div
        aria-hidden="true"
        onClick={closeMobileMenu}
        className={[
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-150 lg:hidden",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* MOBILE DRAWER */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-zinc-200 bg-white shadow-lg transition-transform duration-150 ease-out will-change-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
          <Brand />

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <Navigation pathname={pathname} onNavigate={closeMobileMenu} />

        <div className="shrink-0 border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="min-h-screen lg:pl-60">
        {/* TOP BAR */}
        <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b border-zinc-200 bg-white/95 backdrop-blur-xs lg:left-60">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </button>
              <Brand />
            </div>

            <div className="hidden lg:block" />

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>Public Site</span>
            </Link>
          </div>
        </header>

        {/* TOP BAR OFFSET */}
        <div className="h-14" />

        {/* PAGE BODY */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
