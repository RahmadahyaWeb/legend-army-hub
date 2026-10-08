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
  Trophy,
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
    name: "Valkyrie Cup",
    href: "/admin/valkyrie-cup",
    icon: Trophy,
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

/**
 * Brand Header for Admin Navigation
 * Features Legend Army sigil with clean typographic hierarchy.
 * @returns {JSX.Element}
 */
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-900 bg-brand-600 shadow-[1.5px_1.5px_0px_#18181b]">
        <img
          src="/logo.png"
          alt="Legend Army"
          className="size-7 object-contain"
        />
      </div>
      <div className="min-w-0">
        <span className="truncate font-sans text-xs font-black tracking-wider text-zinc-900 block leading-tight uppercase">
          LEGEND ARMY
        </span>
        <span className="truncate text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 block leading-tight">
          Command Hub
        </span>
      </div>
    </div>
  );
}

/**
 * Admin Navigation List
 * Clean comic-bordered nav buttons with active brand crimson accent in light mode.
 * @param {Object} props
 * @param {Function} [props.onNavigate]
 * @param {string} props.pathname
 * @returns {JSX.Element}
 */
function Navigation({ onNavigate, pathname }) {
  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
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
              "flex h-9.5 items-center gap-2.5 px-3 text-xs font-bold border-2 transition-transform select-none rounded-none",
              isActive
                ? "border-brand-800 bg-brand-50 text-brand-900 shadow-[2px_2px_0px_#b91c1c] translate-x-[1px] translate-y-[1px]"
                : "border-transparent text-zinc-700 hover:border-zinc-900 hover:bg-zinc-100 hover:text-zinc-950 active:translate-x-[1px] active:translate-y-[1px]",
            ].join(" ")}
          >
            <Icon className={[
              "size-4 shrink-0",
              isActive ? "text-brand-700" : "text-zinc-500",
            ].join(" ")} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Admin Application Shell Layout
 *
 * Why this exists:
 * The persistent master layout for administrative operations. Implements the
 * Ragnarok Online-inspired pixel command shell: 2px solid outlines, sharp navigation blocks,
 * tactile sign-out triggers, and responsive drawer navigation.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element} Rendered admin shell
 */
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
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 border-r-2 border-zinc-950 bg-white lg:flex lg:flex-col">
        <div className="flex h-14 shrink-0 items-center border-b-2 border-zinc-950 bg-zinc-100 px-4">
          <Brand />
        </div>

        <Navigation pathname={pathname} />

        <div className="shrink-0 border-t-2 border-zinc-950 bg-zinc-50 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2 border-2 border-zinc-900 bg-white px-3 text-xs font-semibold text-zinc-800 pixel-shadow-sm hover:bg-red-50 hover:text-red-700 hover:border-red-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors"
          >
            <LogOut className="size-3.5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      <div
        aria-hidden="true"
        onClick={closeMobileMenu}
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-150 lg:hidden",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* MOBILE DRAWER */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r-2 border-zinc-950 bg-white pixel-shadow-lg transition-transform duration-150 ease-out will-change-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b-2 border-zinc-950 bg-zinc-100 px-4">
          <Brand />

          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex size-7 shrink-0 items-center justify-center border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] transition-colors"
            aria-label="Close menu"
          >
            <X className="size-3.5 stroke-[2.5]" />
          </button>
        </div>

        <Navigation pathname={pathname} onNavigate={closeMobileMenu} />

        <div className="shrink-0 border-t-2 border-zinc-950 bg-zinc-50 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center gap-2 border-2 border-zinc-900 bg-white px-3 text-xs font-semibold text-zinc-800 pixel-shadow-sm hover:bg-red-50 hover:text-red-700 hover:border-red-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors"
          >
            <LogOut className="size-3.5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="min-h-screen lg:pl-60">
        {/* TOP BAR */}
        <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b-2 border-zinc-950 bg-white lg:left-60">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-900 pixel-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </button>
              <Brand />
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                Guild Command Deck
              </span>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 border-2 border-zinc-900 bg-white px-3 text-xs font-semibold text-zinc-900 pixel-shadow-sm hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>Public Portal</span>
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
