"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Castle,
  Layers,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import { fetchGuildLeagueDetail } from "@/lib/api";
import Loading from "@/components/ui/Loading";
import Button from "@/components/ui/Button";
import GuildLeagueHeaderCard from "@/components/guild-league/GuildLeagueHeaderCard";
import TacticalDirectivesBar from "@/components/guild-league/TacticalDirectivesBar";
import LaneGroupSection from "@/components/guild-league/LaneGroupSection";
import TeamCard from "@/components/guild-league/TeamCard";
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
 * Public Guild League Lineup View with Retro Pixel Styling
 *
 * Why this exists:
 * Shareable public roster link for guild members to review team slots,
 * tactical duties, and lane strategy before match kickoff without admin login.
 * Styled after classic Ragnarok Online guild roster charts.
 *
 * @returns {JSX.Element} Rendered public roster lineup
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

  const eventType = guildLeague?.eventType || "guild_league";
  const isWoe = eventType === "woe";
  // Why this exists: Polarity requires a unified 10-team structure without 3-lane division
  const isPolarity = eventType === "polarity";
  const isUnified = isWoe || isPolarity;
  const maxTeams = Number(guildLeague?.maxTeams) || (isPolarity ? 10 : 2);
  const membersPerTeam = Number(guildLeague?.membersPerTeam) || (isPolarity ? 5 : 10);
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
    return <Loading fullScreen message="Loading roster lineup..." />;
  }

  if (error || !guildLeague) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-sm border-2 border-zinc-950 bg-white p-6 text-center pixel-shadow">
          <h2 className="text-base font-bold font-pixel text-zinc-950">
            Event Not Found
          </h2>
          <p className="mt-1.5 text-xs text-zinc-600">
            {error || "The requested event lineup could not be found."}
          </p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="primary" size="sm" icon={ArrowLeft}>
                Return to Hub
              </Button>
            </Link>
          </div>
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
            label: "Reserve",
            icon: Layers,
            count: laneStats.unassigned?.assignedCount || 0,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 pb-12 font-sans">
      {/* PUBLIC HEADER */}
      <header className="border-b-2 border-zinc-950 bg-white sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-brand-600 pixel-shadow-sm">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-7 object-contain"
              />
            </div>
            <div>
              <div className="font-pixel text-sm font-bold text-zinc-950 leading-tight">
                LEGEND ARMY
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-700 leading-tight">
                War Roster
              </div>
            </div>
          </Link>

          <Link href="/">
            <Button variant="secondary" size="xs" icon={ArrowLeft}>
              Back to Hub
            </Button>
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
            !isUnified && (
              <div className="mt-4 border-t-2 border-zinc-950 pt-3.5">
                <Tabs
                  tabs={tabsList}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
              </div>
            )
          }
        />

        {/* TACTICAL DIRECTIVES BAR */}
        {!isUnified && <TacticalDirectivesBar eventType={eventType} />}

        {/* BATTLEFIELD TEAMS / LANE SECTIONS */}
        {isPolarity ? (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-3.5 sm:p-4 pixel-shadow-sm">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-pixel text-zinc-950 uppercase tracking-wide">
                    Polarity Battle Formations
                  </h2>
                  <p className="text-[11px] text-zinc-600">
                    Fixed 10 Parties (5 Players / Party) • Coordinated 50-Player Lineup
                  </p>
                </div>
              </div>
              <span className="border border-zinc-900 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold text-zinc-800 self-start sm:self-center">
                {totalAssigned}/50 Players Deployed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {allTeamNumbers.map((tNum) => {
                const team = teams.find((t) => Number(t.teamNumber) === tNum);
                const teamMembers = roster.filter(
                  (r) => Number(r.teamNumber) === tNum
                );

                return (
                  <TeamCard
                    key={tNum}
                    teamNumber={tNum}
                    team={team}
                    teamMembers={teamMembers}
                    membersPerTeam={membersPerTeam}
                    readOnly={true}
                    isPolarity={true}
                  />
                );
              })}
            </div>
          </div>
        ) : isWoe ? (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-3.5 sm:p-4 pixel-shadow-sm">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950">
                  <Castle className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-pixel text-zinc-950 uppercase tracking-wide">
                    WOE Battle Formations
                  </h2>
                  <p className="text-[11px] text-zinc-600">
                    {maxTeams} Squad Formations • Unified Castle Formations
                  </p>
                </div>
              </div>
              <span className="border border-zinc-900 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold text-zinc-800 self-start sm:self-center">
                {totalAssigned}/{maxRoster} Players Deployed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {allTeamNumbers.map((tNum) => {
                const team = teams.find((t) => Number(t.teamNumber) === tNum);
                const teamMembers = roster.filter(
                  (r) => Number(r.teamNumber) === tNum
                );

                return (
                  <TeamCard
                    key={tNum}
                    teamNumber={tNum}
                    team={team}
                    teamMembers={teamMembers}
                    membersPerTeam={membersPerTeam}
                    readOnly={true}
                    isWoe={true}
                  />
                );
              })}
            </div>
          </div>
        ) : (
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
                  name="Reserve Formations"
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
        )}
      </main>
    </div>
  );
}
