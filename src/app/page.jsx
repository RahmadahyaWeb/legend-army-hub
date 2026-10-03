"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Crown,
  Lock,
  Shield,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatDate, formatNumber, isMemberActive } from "@/utils/formatters";
import { PublicDashboardSkeleton } from "@/components/ui/LoadingState";
import StatCard from "@/components/dashboard/StatCard";
import NextMatchCard from "@/components/dashboard/NextMatchCard";
import ClassCompositionCard from "@/components/dashboard/ClassCompositionCard";
import GearLeaderboardCard from "@/components/dashboard/GearLeaderboardCard";

/**
 * Public Landing & Guild Hub Portal
 *
 * Why this exists:
 * The single public-facing entry point for Legend Army guild members and visitors.
 * Displays:
 * 1. Clean Guild Portal Hero
 * 2. High-level Overview Metrics (Members, Active Combatants, Average GS, Event Count)
 * 3. Next Imminent Match Spotlight
 * 4. All Matches & Events List (Daftar Event) in a responsive, perfectly aligned card grid
 * 5. Class Composition Breakdown & Top Gear Leaderboard
 */
export default function PublicDashboard() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMembers(), fetchGuildLeagues()])
      .then(([membersData, leaguesData]) => {
        setMembers(membersData);
        setGuildLeagues(leaguesData);
      })
      .catch((err) => {
        console.error("Public load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeMembers = useMemo(() => members.filter(isMemberActive), [members]);

  const averageGearScore = useMemo(() => {
    const validMembers = activeMembers.filter(
      (member) => Number(member.gearScore) > 0
    );
    if (validMembers.length === 0) return 0;
    const total = validMembers.reduce(
      (sum, member) => sum + Number(member.gearScore),
      0
    );
    return Math.round(total / validMembers.length);
  }, [activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const upcoming = guildLeagues.filter(
      (gl) => gl.status !== "completed" && gl.status !== "cancelled"
    );
    return upcoming.length > 0 ? upcoming[0] : guildLeagues[0] || null;
  }, [guildLeagues]);

  if (loading) {
    return <PublicDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-surface-100 text-content-strong flex flex-col">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-700 shadow-2xs">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-zinc-900">
                LEGEND ARMY
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Guild Portal
              </div>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <Lock className="size-3.5 text-zinc-400" />
            <span>Admin Sign In</span>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
              <Crown className="size-3.5" />
              Legend Army
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-zinc-950">
              Guild Portal
            </h1>

            <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-500 sm:text-base">
              Guild information, member composition, and Guild League rosters
              for Legend Army.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 flex-1 w-full">
        {/* OVERVIEW STATS (RESPONSIVE & SEJAJAR) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Guild Overview
              </h2>
              <p className="text-xs text-zinc-500">
                Current Legend Army statistics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch">
            <StatCard
              icon={Users}
              value={members.length}
              label="Total Members"
              description="Registered adventurers"
            />

            <StatCard
              icon={Shield}
              value={activeMembers.length}
              label="Active Lineup"
              description="War combatants"
            />

            <StatCard
              icon={Zap}
              value={averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
              label="Average GS"
              description="Guild combat rating"
            />

            <StatCard
              icon={Trophy}
              value={guildLeagues.length}
              label="Guild Events"
              description="Recorded events & matches"
            />
          </div>
        </section>

        {/* NEXT MATCH HERO CARD */}
        <NextMatchCard guildLeague={nextGuildLeague} isAdmin={false} />

        {/* ALL MATCHES & EVENTS (DAFTAR EVENT - RESPONSIVE & SEJAJAR) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                All Matches & Events
              </h2>
              <p className="text-xs text-zinc-500">
                Scheduled and past Guild League & War of Emperium events
              </p>
            </div>

            <span className="rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-700 self-start sm:self-center">
              {guildLeagues.length} {guildLeagues.length === 1 ? "Event" : "Events"}
            </span>
          </div>

          {guildLeagues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-xs text-zinc-500">
              No guild events or matches created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
              {guildLeagues.map((gl) => {
                const isWoe = gl.eventType === "woe";
                const maxTeams = Number(gl.maxTeams) || 2;
                const membersPerTeam = Number(gl.membersPerTeam) || 10;
                const maxRoster = Number(gl.maxRoster) || maxTeams * membersPerTeam;
                const assigned = Number(gl.assignedPlayers || gl.rosterCount) || 0;
                const progress = maxRoster > 0 ? Math.min(100, Math.round((assigned / maxRoster) * 100)) : 0;
                const matchDate = gl.matchDate || gl.date;

                return (
                  <div
                    key={gl.id}
                    className="flex flex-col justify-between h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div>
                      {/* TOP BADGES ROW */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isWoe ? (
                            <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              🏰 WOE
                            </span>
                          ) : (
                            <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              ⚔️ Guild League
                            </span>
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              gl.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : gl.status === "completed"
                                ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            }`}
                          >
                            {gl.status || "DRAFT"}
                          </span>
                        </div>

                        <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                          {formatDate(matchDate)}
                        </span>
                      </div>

                      {/* EVENT TITLE */}
                      <h3 className="mt-3.5 text-base font-bold text-zinc-900 leading-snug line-clamp-1">
                        {gl.name}
                      </h3>

                      {/* OPPONENT / OBJECTIVE */}
                      <div className="mt-1 text-xs text-zinc-600 font-medium truncate">
                        {isWoe ? (
                          <span>Target: <strong className="text-zinc-900">{gl.opponent || "TBA"}</strong></span>
                        ) : (
                          <span>VS: <strong className="text-zinc-900">{gl.opponent || "TBA"}</strong></span>
                        )}
                      </div>

                      {/* ROSTER PROGRESS BAR */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>Roster Lineup</span>
                          <span className="font-bold font-mono text-zinc-800">
                            {assigned}/{maxRoster} Players ({progress}%){" "}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full bg-red-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PINNED ACTION FOOTER */}
                    <div className="mt-5 pt-4 border-t border-zinc-100">
                      <Link
                        href={`/roster/${gl.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition active:scale-98"
                      >
                        <span>View Match Roster</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CLASS COMPOSITION & LEADERBOARD GRID (RESPONSIVE & SEJAJAR) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <ClassCompositionCard members={activeMembers} />
          <GearLeaderboardCard members={activeMembers} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-700">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">LEGEND ARMY</div>
              <div className="text-xs text-zinc-400">Guild Portal</div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-zinc-400">
              Legend Army · Guild Information
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Made by <span className="font-semibold text-zinc-600">XKG</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
