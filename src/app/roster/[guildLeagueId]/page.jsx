"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import { fetchGuildLeagueDetail } from "@/lib/api";
import { RosterDetailSkeleton } from "@/components/ui/LoadingState";
import GuildLeagueHeaderCard from "@/components/guild-league/GuildLeagueHeaderCard";
import TacticalDirectivesBar from "@/components/guild-league/TacticalDirectivesBar";
import LaneGroupSection from "@/components/guild-league/LaneGroupSection";
import Tabs from "@/components/ui/Tabs";
import { getBaseLane } from "@/utils/guildLeague";

const LANE_SECTIONS = [
  {
    id: "top",
    name: "Top Lane",
    icon: Swords,
  },
  {
    id: "mid",
    name: "Mid Lane",
    icon: Shield,
  },
  {
    id: "bot",
    name: "Bottom Lane",
    icon: Zap,
  },
];

/**
 * Public Guild League Lineup View
 *
 * Why this exists:
 * Shareable public roster link for guild members to review team slots,
 * tactical duties, and lane strategy before match kickoff without admin login.
 */
export default function PublicRosterPage() {
  const params = useParams();
  const guildLeagueId = params?.guildLeagueId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!guildLeagueId) return;

    fetchGuildLeagueDetail(guildLeagueId)
      .then((res) => {
        setData(res);
        setError("");
      })
      .catch((err) => {
        console.error("Public roster fetch error:", err);
        setError(err.message || "Failed to load guild league lineup.");
      })
      .finally(() => setLoading(false));
  }, [guildLeagueId]);

  const guildLeague = data?.guildLeague;
  const teams = data?.teams || [];
  const roster = data?.roster || [];

  const maxTeams = Number(guildLeague?.maxTeams) || 2;
  const membersPerTeam = Number(guildLeague?.membersPerTeam) || 10;
  const maxRoster = Number(guildLeague?.maxRoster) || maxTeams * membersPerTeam;
  const totalAssigned = roster.length;

  const averageGearScore = useMemo(() => {
    if (roster.length === 0) return 0;
    const total = roster.reduce(
      (sum, m) => sum + (Number(m.gearScore) || 0),
      0
    );
    return Math.round(total / roster.length);
  }, [roster]);

  const allTeamNumbers = useMemo(() => {
    return Array.from({ length: maxTeams }, (_, i) => i + 1);
  }, [maxTeams]);

  const laneGroups = useMemo(() => {
    const map = {
      top: [],
      mid: [],
      bot: [],
      unassigned: [],
    };

    allTeamNumbers.forEach((tNum) => {
      const team = teams.find((t) => Number(t.teamNumber) === tNum);
      const laneKey = String(team?.lane || "").toLowerCase().trim();
      const base = getBaseLane(laneKey);
      if (base && map[base]) map[base].push(tNum);
      else map.unassigned.push(tNum);
    });

    return map;
  }, [allTeamNumbers, teams]);

  const laneStats = useMemo(() => {
    const stats = {};
    ["top", "mid", "bot", "unassigned"].forEach((laneKey) => {
      const teamNumbers = laneGroups[laneKey] || [];
      const laneMembers = roster.filter((r) =>
        teamNumbers.includes(Number(r.teamNumber))
      );
      const capacity = teamNumbers.length * membersPerTeam;
      const totalGS = laneMembers.reduce(
        (acc, m) => acc + (Number(m.gearScore) || 0),
        0
      );
      const avgGS = laneMembers.length > 0 ? Math.round(totalGS / laneMembers.length) : 0;

      stats[laneKey] = {
        teamCount: teamNumbers.length,
        assignedCount: laneMembers.length,
        capacity,
        avgGS,
      };
    });
    return stats;
  }, [laneGroups, roster, membersPerTeam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <RosterDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !guildLeague) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xs">
          <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <Swords className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-zinc-900">
            Match Lineup Not Found
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {error || "The requested guild league roster could not be loaded."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabsList = [
    {
      id: "all",
      label: `All Lanes (${totalAssigned}/${maxRoster})`,
    },
    ...LANE_SECTIONS.map((l) => ({
      id: l.id,
      label: l.name,
      icon: l.icon,
      count: laneStats[l.id]?.assignedCount || 0,
    })),
    ...(laneGroups.unassigned.length > 0
      ? [
          {
            id: "unassigned",
            label: "Unassigned",
            icon: Layers,
            count: laneStats.unassigned?.assignedCount || 0,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-surface-100 text-content-strong pb-12">
      {/* PUBLIC HEADER */}
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
                Guild War Roster
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Hub</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* HERO MATCH SUMMARY */}
        <GuildLeagueHeaderCard
          guildLeague={guildLeague}
          totalAssigned={totalAssigned}
          maxRoster={maxRoster}
          averageGearScore={averageGearScore}
          maxTeams={maxTeams}
          actions={
            <div className="mt-4 border-t border-zinc-100 pt-3.5">
              <Tabs
                tabs={tabsList}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
          }
        />

        {/* TACTICAL DIRECTIVES BAR */}
        <TacticalDirectivesBar />

        {/* BATTLEFIELD LANE SECTIONS */}
        <div className="space-y-4 sm:space-y-6">
          {LANE_SECTIONS.map((lane) => {
            if (activeTab !== "all" && activeTab !== lane.id) return null;

            return (
              <LaneGroupSection
                key={lane.id}
                id={lane.id}
                name={lane.name}
                icon={lane.icon}
                teamNumbers={laneGroups[lane.id] || []}
                teams={teams}
                roster={roster}
                stat={laneStats[lane.id]}
                membersPerTeam={membersPerTeam}
                readOnly={true}
              />
            );
          })}

          {/* RESERVE / UNASSIGNED TEAMS SECTION */}
          {(activeTab === "all" || activeTab === "unassigned") &&
            laneGroups.unassigned.length > 0 && (
              <LaneGroupSection
                id="unassigned"
                name="Reserve / Unassigned Formations"
                icon={Layers}
                teamNumbers={laneGroups.unassigned}
                teams={teams}
                roster={roster}
                stat={laneStats.unassigned}
                membersPerTeam={membersPerTeam}
                readOnly={true}
              />
            )}
        </div>
      </main>
    </div>
  );
}
