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
import Button from "@/components/ui/Button";

const NAV_LINKS = [
  {
    name: "Tournament",
    href: "/valkyrie-cup",
    exact: true,
    icon: Trophy,
  },
  {
    name: "Registered Squads",
    href: "/valkyrie-cup/teams",
    exact: false,
    icon: Users,
  },
  {
    name: "Register Squad",
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
 * Valkyrie Cup Public Navigation Header with Retro Pixel Styling
 *
 * Why this exists:
 * Provides a unified, accessible header across all Valkyrie Cup sub-pages (Tournament overview,
 * Registered Teams directory, Team Registration form, and My Registration)
 * with sharp 2px outlines, pixel shadows, and retro tab selectors.
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
    <header className="sticky top-0 z-40 border-b-2 border-zinc-950 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* BRAND */}
        <div className="flex items-center gap-6">
          <Link href="/valkyrie-cup" className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-amber-500 pixel-shadow-sm">
              <Trophy className="size-4.5 text-zinc-950" />
            </div>
            <div>
              <span className="font-pixel text-sm font-bold text-zinc-950 block leading-tight">
                VALKYRIE CUP
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 block leading-tight">
                8v8 Tournament
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV TABS */}
          <nav className="hidden md:flex items-center space-x-1.5 pl-4 border-l-2 border-zinc-950">
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
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 transition-transform select-none",
                    isActive
                      ? "border-zinc-950 bg-zinc-950 text-white pixel-shadow-sm translate-x-[1px] translate-y-[1px]"
                      : "border-transparent text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100 hover:text-zinc-950 active:translate-x-[1px] active:translate-y-[1px]",
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
          <Link href="/">
            <Button variant="secondary" size="xs" icon={ArrowLeft} className="hidden sm:inline-flex">
              Guild Hub
            </Button>
          </Link>

          <Link href="/login">
            <Button variant="outline" size="xs" icon={Lock}>
              Admin
            </Button>
          </Link>

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex size-8 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-900 pixel-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden border-b-2 border-zinc-950 bg-white px-4 py-3 pixel-shadow space-y-2 animate-in fade-in duration-100">
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
                    "flex items-center gap-2.5 px-3 py-2 text-xs font-bold border-2 transition-transform",
                    isActive
                      ? "border-zinc-950 bg-zinc-950 text-white pixel-shadow-sm"
                      : "border-transparent text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t-2 border-zinc-950">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-950"
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
