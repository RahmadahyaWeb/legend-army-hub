"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatNumber, isMemberActive } from "@/utils/formatters";
import Loading from "@/components/ui/Loading";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import NextMatchCard from "@/components/dashboard/NextMatchCard";
import ClassCompositionCard from "@/components/dashboard/ClassCompositionCard";
import GearLeaderboardCard from "@/components/dashboard/GearLeaderboardCard";

/**
 * Admin Dashboard Overview with Retro Pixel Styling
 *
 * Why this exists:
 * The central overview for guild leadership displaying key metrics,
 * active combatants, class balance, and upcoming events.
 *
 * @returns {JSX.Element} Rendered admin overview dashboard
 */
export default function AdminDashboardPage() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, leaguesData] = await Promise.all([
        fetchMembers(),
        fetchGuildLeagues(),
      ]);
      setMembers(membersData);
      setGuildLeagues(leaguesData);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeMembers = useMemo(() => members.filter(isMemberActive), [members]);

  const averageGearScore = useMemo(() => {
    if (activeMembers.length === 0) return 0;
    const validMembers = activeMembers.filter((m) => Number(m.gearScore) > 0);
    if (validMembers.length === 0) return 0;
    const total = validMembers.reduce(
      (sum, m) => sum + Number(m.gearScore || 0),
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
    return <Loading message="Loading dashboard metrics..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-pixel text-zinc-950 tracking-tight">
            Command Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-zinc-600">
            Overview of guild combatants, battle readiness, and scheduled events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/members">
            <Button variant="secondary" size="sm">
              Manage Members
            </Button>
          </Link>

          <Link href="/admin/guild-leagues">
            <Button variant="primary" size="sm">
              Guild Events
            </Button>
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
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

      {/* NEXT MATCH HERO */}
      <NextMatchCard guildLeague={nextGuildLeague} isAdmin={true} />

      {/* CLASS COMPOSITION & TOP GEAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <ClassCompositionCard members={activeMembers} />
        <GearLeaderboardCard members={activeMembers} />
      </div>
    </div>
  );
}
