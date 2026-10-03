"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatNumber, isMemberActive } from "@/utils/formatters";
import { PublicDashboardSkeleton } from "@/components/ui/LoadingState";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import NextMatchCard from "@/components/dashboard/NextMatchCard";
import ClassCompositionCard from "@/components/dashboard/ClassCompositionCard";
import GearLeaderboardCard from "@/components/dashboard/GearLeaderboardCard";

/**
 * Public Landing & Guild Hub Portal
 *
 * Why this exists:
 * The public-facing entry point for Legend Army guild members, showing
 * active war status, class balance breakdown, top gear leaderboard, and direct links
 * to public match lineups.
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
      {/* PUBLIC NAVBAR */}
      <header className="border-b border-line bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-2xs">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">LEGEND ARMY</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Official Guild Hub
              </div>
            </div>
          </Link>

          <Link href="/login">
            <Button variant="secondary" size="sm" icon={Lock}>
              Admin Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="border-b border-line bg-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-brand-50 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700">
            <Shield className="size-3.5" />
            <span>Ragnarok Origin Guild Hub</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
            Legend Army <span className="text-brand-600">Guild League</span> Headquarters
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Welcome to the official tactical portal of Legend Army. Track battlefield rosters,
            tactical lane formations, combat strength, and roll-call readiness.
          </p>

          {nextGuildLeague && (
            <div className="mt-5">
              <Link href={`/roster/${nextGuildLeague.id}`}>
                <Button variant="primary" size="md" icon={Swords}>
                  <span>View Active War Lineup</span>
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* MAIN PUBLIC CONTENT */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 w-full">
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
            description="Guild power rating"
          />

          <StatCard
            icon={Trophy}
            value={guildLeagues.length}
            label="Matches"
            description="Guild League history"
          />
        </div>

        {/* UPCOMING MATCH SPOTLIGHT */}
        <NextMatchCard guildLeague={nextGuildLeague} isAdmin={false} />

        {/* CLASS COMPOSITION & LEADERBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ClassCompositionCard members={activeMembers} />
          <GearLeaderboardCard members={activeMembers} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-white py-6 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            © {new Date().getFullYear()} Legend Army Guild. All rights reserved.
          </div>
          <div>
            Created with dedication for <strong className="text-zinc-700">Legend Army</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
