"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { formatNumber, isMemberActive } from "@/utils/formatters";
import { AdminDashboardSkeleton } from "@/components/ui/LoadingState";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import NextMatchCard from "@/components/dashboard/NextMatchCard";
import ClassCompositionCard from "@/components/dashboard/ClassCompositionCard";
import GearLeaderboardCard from "@/components/dashboard/GearLeaderboardCard";

/**
 * Admin Dashboard Overview
 *
 * Why this exists:
 * The central command dashboard for Guild Master and Officers displaying
 * high-level metrics, battle readiness, class balance, and quick access to roster actions.
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

  const activePercentage = useMemo(() => {
    if (members.length === 0) return 0;
    return Math.round((activeMembers.length / members.length) * 100);
  }, [members, activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const upcoming = guildLeagues.filter(
      (gl) => gl.status !== "completed" && gl.status !== "cancelled"
    );
    return upcoming.length > 0 ? upcoming[0] : guildLeagues[0] || null;
  }, [guildLeagues]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* WELCOME / ACTIONS HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Guild Hub Overview
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Real-time guild power metrics, active lineups, and battle preparation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link href="/admin/members">
            <Button variant="secondary" size="sm" icon={Users}>
              Manage Members
            </Button>
          </Link>

          <Link href="/admin/guild-leagues">
            <Button variant="primary" size="sm" icon={Swords}>
              Guild Leagues
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 HIGH-LEVEL STAT METRICS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          icon={Users}
          value={members.length}
          label="Total Members"
          description="Registered characters"
        />

        <StatCard
          icon={Shield}
          value={`${activePercentage}%`}
          label="Active Rate"
          description={`${activeMembers.length} active players`}
        />

        <StatCard
          icon={Zap}
          value={averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
          label="Average GS"
          description="Guild combat rating"
        />

        <StatCard
          icon={Swords}
          value={guildLeagues.length}
          label="Guild Leagues"
          description="Events scheduled"
        />
      </div>

      {/* UPCOMING MATCH HIGHLIGHT */}
      <NextMatchCard guildLeague={nextGuildLeague} isAdmin={true} />

      {/* CLASS COMPOSITION & LEADERBOARD 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ClassCompositionCard members={activeMembers} />
        <GearLeaderboardCard members={activeMembers} />
      </div>
    </div>
  );
}
