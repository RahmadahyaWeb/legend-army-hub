"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Trophy } from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatDate, formatNumber, isMemberActive } from "@/utils/formatters";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
 * 1. Retro Pixel Guild Portal Hero
 * 2. High-level Overview Metrics (Members, Active Combatants, Average GS, Event Count)
 * 3. Next Imminent Match Spotlight
 * 4. All Matches & Events List in a responsive retro pixel card grid
 * 5. Class Composition Breakdown & Top Gear Leaderboard
 *
 * @returns {JSX.Element} Rendered landing page
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
    return <Loading fullScreen message="Loading Guild Hub..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b-2 border-zinc-950 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-900 bg-brand-600 shadow-[1.5px_1.5px_0px_#18181b]">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-7 object-contain"
              />
            </div>
            <div>
              <span className="font-sans text-xs font-black tracking-wider text-zinc-950 block leading-tight uppercase">
                LEGEND ARMY
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 block leading-tight">
                Guild Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/valkyrie-cup">
              <Button variant="secondary" size="xs" icon={Trophy} className="!border-amber-600 !bg-amber-50 !text-amber-950">
                Valkyrie Cup
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="xs" icon={Lock}>
                Admin Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="border-b-2 border-zinc-950 bg-white comic-dots-bg relative">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 border-2 border-amber-600 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-950 mb-3 shadow-[1.5px_1.5px_0px_#d97706]">
                <Trophy className="size-3.5 text-amber-600 shrink-0" />
                <span>Active Tournament: Valkyrie Cup 8v8</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-zinc-950 leading-tight">
                Legend Army Hub
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                Ragnarok guild war rosters, class balance composition, tactical battle formations, and tournament management.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/valkyrie-cup">
                <Button variant="primary" size="md" icon={Trophy}>
                  Enter Valkyrie Cup
                </Button>
              </Link>
              <Link href="/valkyrie-cup/teams">
                <Button variant="secondary" size="md">
                  View Squads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 flex-1 w-full">
        {/* OVERVIEW STATS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-sans">
              Battle Readiness Overview
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
              description="Scheduled wars"
            />
          </div>
        </section>

        {/* NEXT MATCH HERO CARD */}
        <NextMatchCard guildLeague={nextGuildLeague} isAdmin={false} />

        {/* ALL MATCHES & EVENTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-sans">
              Matches & Guild Events
            </h2>

            <span className="text-xs font-mono font-bold text-zinc-600">
              {guildLeagues.length} {guildLeagues.length === 1 ? "event" : "events"}
            </span>
          </div>

          {guildLeagues.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-400 bg-white p-8 text-center text-xs text-zinc-500 comic-shadow-sm font-medium">
              No guild events scheduled at the moment.
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
                    className="flex flex-col justify-between h-full border-2 border-zinc-950 bg-white p-4 comic-shadow-sm hover:comic-shadow transition-all"
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

                        <span className="text-xs font-mono text-zinc-500 shrink-0">
                          {formatDate(matchDate)}
                        </span>
                      </div>

                      {/* EVENT TITLE */}
                      <h3 className="mt-3 text-sm font-bold text-zinc-950 leading-snug line-clamp-1 font-sans">
                        {gl.name}
                      </h3>

                      {/* OPPONENT / OBJECTIVE */}
                      <div className="mt-1 text-xs text-zinc-600 truncate">
                        {isWoe ? (
                          <span>Target: <strong className="text-zinc-950 font-bold">{gl.opponent || "TBA"}</strong></span>
                        ) : (
                          <span>Opponent: <strong className="text-zinc-950 font-bold">{gl.opponent || "TBA"}</strong></span>
                        )}
                      </div>

                      {/* RETRO ROSTER PROGRESS BAR */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-600 font-medium">
                          <span>Roster</span>
                          <span className="font-mono font-bold text-zinc-950">
                            {assigned} / {maxRoster} ({progress}%)
                          </span>
                        </div>
                        <div className="h-2 w-full border border-zinc-950 bg-zinc-100 p-0.2">
                          <div
                            className="h-full bg-brand-600 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PINNED ACTION FOOTER */}
                    <div className="mt-4 pt-3 border-t-2 border-zinc-950">
                      <Link href={`/roster/${gl.id}`} className="block w-full">
                        <Button variant="secondary" size="sm" className="w-full">
                          View Roster Lineup
                        </Button>
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
      <footer className="mt-12 border-t-2 border-zinc-950 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-6 shrink-0 items-center justify-center border border-zinc-950 bg-brand-600">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-5 object-contain"
              />
            </div>
            <span className="text-xs font-black tracking-wider text-zinc-950 font-sans uppercase">
              LEGEND ARMY GUILD HUB
            </span>
          </div>

          <div className="text-left sm:text-right text-xs font-mono text-zinc-500">
            Classic Ragnarok Online Guild Operations
          </div>
        </div>
      </footer>
    </div>
  );
}
