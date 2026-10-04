"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatDate, formatNumber, isMemberActive } from "@/utils/formatters";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
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
 * 4. All Matches & Events List in a responsive, clean card grid
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
    return <Loading fullScreen message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Legend Army"
              className="size-8 object-contain"
            />
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-900 block leading-tight">
                LEGEND ARMY
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 block leading-tight">
                Guild Portal
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Lock className="size-3.5 text-zinc-400" />
            <span>Admin Sign In</span>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-950">
              Legend Army Hub
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Guild roster lineups, class balance, and tactical battle preparations.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 flex-1 w-full">
        {/* OVERVIEW STATS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
              Overview
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch">
            <StatCard
              value={members.length}
              label="Total Members"
              description="Registered characters"
            />

            <StatCard
              value={activeMembers.length}
              label="Active Lineup"
              description="Combat ready"
            />

            <StatCard
              value={averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
              label="Average GS"
              description="Active combatants"
            />

            <StatCard
              value={guildLeagues.length}
              label="Total Events"
              description="Scheduled matches"
            />
          </div>
        </section>

        {/* NEXT MATCH HERO CARD */}
        <NextMatchCard guildLeague={nextGuildLeague} isAdmin={false} />

        {/* ALL MATCHES & EVENTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
                All Matches & Events
              </h2>
            </div>

            <span className="text-xs text-zinc-500">
              {guildLeagues.length} {guildLeagues.length === 1 ? "event" : "events"}
            </span>
          </div>

          {guildLeagues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
              No guild events scheduled yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {guildLeagues.map((gl) => {
                const isWoe = gl.eventType === "woe";
                const isPolarity = gl.eventType === "polarity";
                const maxTeams = Number(gl.maxTeams) || 2;
                const membersPerTeam = Number(gl.membersPerTeam) || 10;
                const maxRoster = Number(gl.maxRoster) || maxTeams * membersPerTeam;
                const assigned = Number(gl.assignedPlayers || gl.rosterCount) || 0;
                const progress = maxRoster > 0 ? Math.min(100, Math.round((assigned / maxRoster) * 100)) : 0;
                const matchDate = gl.matchDate || gl.date;

                return (
                  <div
                    key={gl.id}
                    className="flex flex-col justify-between h-full rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300"
                  >
                    <div>
                      {/* TOP BADGES ROW */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isWoe ? (
                            <Badge variant="warning" size="xs">
                              WOE
                            </Badge>
                          ) : isPolarity ? (
                            <Badge variant="info" size="xs">
                              Polarity
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="xs">
                              Guild League
                            </Badge>
                          )}
                          <Badge
                            variant={
                              gl.status === "published"
                                ? "success"
                                : gl.status === "completed"
                                ? "neutral"
                                : "brand"
                            }
                            size="xs"
                          >
                            {(gl.status || "DRAFT").toUpperCase()}
                          </Badge>
                        </div>

                        <span className="text-xs text-zinc-400 shrink-0">
                          {formatDate(matchDate)}
                        </span>
                      </div>

                      {/* EVENT TITLE */}
                      <h3 className="mt-3 text-sm font-semibold text-zinc-900 leading-snug line-clamp-1">
                        {gl.name}
                      </h3>

                      {/* OPPONENT / OBJECTIVE */}
                      <div className="mt-1 text-xs text-zinc-500 truncate">
                        {isWoe ? (
                          <span>Target: <strong className="text-zinc-800 font-medium">{gl.opponent || "TBA"}</strong></span>
                        ) : (
                          <span>Opponent: <strong className="text-zinc-800 font-medium">{gl.opponent || "TBA"}</strong></span>
                        )}
                      </div>

                      {/* ROSTER PROGRESS BAR */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>Roster</span>
                          <span className="font-medium text-zinc-800">
                            {assigned} / {maxRoster} ({progress}%)
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full bg-zinc-800 rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PINNED ACTION FOOTER */}
                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      <Link
                        href={`/roster/${gl.id}`}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-white transition-colors"
                      >
                        View Roster
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CLASS COMPOSITION & LEADERBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <ClassCompositionCard members={activeMembers} />
          <GearLeaderboardCard members={activeMembers} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Legend Army"
              className="size-7 object-contain"
            />
            <span className="text-xs font-semibold text-zinc-900">
              Legend Army Hub
            </span>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-400">
            Legend Army · Guild Management
          </div>
        </div>
      </footer>
    </div>
  );
}
