"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Lock,
  Menu,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const NAV_LINKS = [
  {
    name: "Tournament",
    href: "/valkyrie-cup",
    exact: true,
    icon: Trophy,
  },
  {
    name: "Registered Teams",
    href: "/valkyrie-cup/teams",
    exact: false,
    icon: Users,
  },
  {
    name: "Register Team",
    href: "/valkyrie-cup/register",
    exact: true,
    icon: UserPlus,
  },
  {
    name: "My Registration",
    href: "/valkyrie-cup/my-registration",
    exact: true,
    icon: ClipboardList,
  },
];

/**
 * Valkyrie Cup Public Navigation Header
 *
 * Why this exists:
 * Provides a unified, accessible header across all Valkyrie Cup sub-pages (Tournament overview,
 * Registered Teams directory, Team Registration form, and My Registration).
 *
 * Tricky logic:
 * Handles desktop tab navigation with subtle active indicators, while supporting an accessible
 * mobile sliding drawer for smaller screen viewports.
 *
 * @returns {JSX.Element} Rendered Valkyrie Cup public header
 */
export default function ValkyrieHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* BRAND */}
        <div className="flex items-center gap-6">
          <Link href="/valkyrie-cup" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Legend Army"
              className="size-8 object-contain"
            />
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-900 block leading-tight">
                VALKYRIE CUP
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 block leading-tight">
                8v8 Guild Tournament
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV TABS */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-200">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white font-semibold shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  <Icon className="size-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="size-3 text-zinc-400" />
            <span>Guild Hub</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Lock className="size-3 text-zinc-400" />
            <span className="hidden xs:inline">Admin</span>
          </Link>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-3 shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Guild Hub</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
