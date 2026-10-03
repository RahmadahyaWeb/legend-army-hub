"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Layers,
  Shield,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { fetchGuildLeagueDetail } from "@/lib/api";
import { RosterDetailSkeleton } from "@/components/ui/LoadingState";
import { ClassBadge } from "@/utils/classColors";
import { getBaseLane, getLaneConfig } from "@/utils/guildLeague";

const LANE_SECTIONS = [
  {
    id: "top",
    name: "Top Lane",
    icon: Swords,
    badgeBg: "bg-orange-50 border-orange-200 text-orange-800",
    pillActive: "bg-orange-600 text-white shadow-orange-600/25",
  },
  {
    id: "mid",
    name: "Mid Lane",
    icon: Shield,
    badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
    pillActive: "bg-blue-600 text-white shadow-blue-600/25",
  },
  {
    id: "bot",
    name: "Bottom Lane",
    icon: Zap,
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    pillActive: "bg-emerald-600 text-white shadow-emerald-600/25",
  },
];

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString();
}

function PublicTeamCard({ teamNumber, team, rosterMembers, membersPerTeam = 10 }) {
  const members = useMemo(
    () =>
      rosterMembers
        .filter((m) => Number(m.teamNumber) === Number(teamNumber))
        .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber)),
    [rosterMembers, teamNumber]
  );

  const averageGearScore = useMemo(() => {
    if (members.length === 0) return 0;
    const total = members.reduce(
      (sum, m) => sum + (Number(m.gearScore) || 0),
      0
    );
    return Math.round(total / members.length);
  }, [members]);

  const fillPercent = Math.round((members.length / (membersPerTeam || 1)) * 100);
  const laneConfig = getLaneConfig(team?.lane);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-200">
      {/* TEAM HEADER - ROW 1 */}
      <div className="flex items-center justify-between gap-2.5 border-b border-zinc-100 bg-zinc-50/80 px-3.5 py-3 sm:px-4.5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white shadow-xs">
            T{teamNumber}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs sm:text-sm font-bold text-zinc-900">
              {team?.name || `Team ${teamNumber}`}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
              <span className="text-zinc-700 font-semibold">
                {members.length}/{membersPerTeam} Players
              </span>
              <span>•</span>
              <span>{fillPercent}%</span>
            </div>
          </div>
        </div>

        {averageGearScore > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200/90 bg-white px-2 py-1 text-[11px] font-bold text-zinc-800 shadow-2xs font-mono">
            <Shield className="size-3 text-zinc-400" />
            <span>{formatNumber(averageGearScore)} GS</span>
          </div>
        )}
      </div>

      {/* TACTICAL ROLE BAR - ROW 2 */}
      {laneConfig && (
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/40 px-3.5 py-2 sm:px-4.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
            Battle Role
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold truncate ${
              laneConfig.badgeClassName || "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            {laneConfig.icon && <span>{laneConfig.icon}</span>}
            <span className="truncate">{laneConfig.label || laneConfig.shortLabel}</span>
          </span>
        </div>
      )}

      {/* PLAYER SLOTS */}
      <div className="flex-1 divide-y divide-zinc-100">
        {Array.from({ length: membersPerTeam }, (_, index) => {
          const slot = index + 1;
          const member = members.find((m) => Number(m.slotNumber) === slot);

          if (!member) {
            return (
              <div
                key={slot}
                className="flex items-center justify-between px-3.5 sm:px-4.5 py-2 text-xs text-zinc-400 bg-zinc-50/20"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-zinc-300 font-mono text-[11px] font-bold">
                    #{slot}
                  </span>
                  <span className="italic text-zinc-400 text-[11px] font-medium">
                    Empty Slot
                  </span>
                </div>
                <span className="text-[11px] text-zinc-300 font-mono">—</span>
              </div>
            );
          }

          return (
            <div
              key={slot}
              className="flex items-center justify-between px-3.5 sm:px-4.5 py-2 text-xs transition hover:bg-zinc-50/80"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-5 font-bold font-mono text-[11px] text-zinc-400">
                  #{slot}
                </span>
                <div className="min-w-0 pr-1.5">
                  <div className="truncate font-bold text-zinc-900 text-xs sm:text-[13px]">
                    {member.nickname}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <ClassBadge className={member.className} size="xs" />
                    {Number(member.level) > 0 && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Lv. {member.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 text-right">
                {Number(member.gearScore) > 0 && (
                  <span className="font-bold text-zinc-900 font-mono text-[11px] sm:text-xs">
                    {formatNumber(member.gearScore)} GS
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        console.error("Error loading roster:", err);
        setError("Failed to load guild league roster.");
      })
      .finally(() => setLoading(false));
  }, [guildLeagueId]);

  const guildLeague = data?.guildLeague;
  const teams = data?.teams || [];
  const roster = data?.roster || [];

  const maxTeams = guildLeague?.maxTeams || 2;
  const membersPerTeam = guildLeague?.membersPerTeam || 10;
  const maxRoster = guildLeague?.maxRoster || maxTeams * membersPerTeam;
  const totalAssigned = roster.length;

  const averageGearScore = useMemo(() => {
    if (roster.length === 0) return 0;
    const total = roster.reduce(
      (sum, m) => sum + (Number(m.gearScore) || 0),
      0
    );
    return Math.round(total / roster.length);
  }, [roster]);

  // Group all teams by lane (Top, Mid, Bot, or Unassigned)
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

  // Compute stats per lane
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
      <div className="min-h-screen bg-[#fafafa]">
        <div className="h-14 border-b border-zinc-200 bg-white" />
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <RosterDetailSkeleton isPublic={true} />
        </div>
      </div>
    );
  }

  if (error || !guildLeague) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <h2 className="text-xl font-bold text-zinc-900">Roster Not Found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          The requested Guild League roster does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  const matchDate = guildLeague.matchDate || guildLeague.date;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 uppercase tracking-wider">
              {guildLeague.status || "DRAFT"}
            </span>
          </div>
        </div>
      </header>

      {/* UNIFIED PAGE CONTAINER - PERFECT RESPONSIVE ALIGNMENT */}
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8 space-y-4 sm:space-y-6">
        {/* HERO MATCH CARD */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-red-700 uppercase tracking-widest">
                <Swords className="size-3.5 sm:size-4" />
                <span>Guild League Lineup & Roster</span>
              </div>
              <h1 className="mt-1 text-xl font-black text-zinc-900 sm:text-3xl lg:text-4xl tracking-tight">
                {guildLeague.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  <span>{formatDate(matchDate)}</span>
                </div>
                {guildLeague.opponent && (
                  <div className="flex items-center gap-1 font-bold text-zinc-900">
                    <span>Opponent: {guildLeague.opponent}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK STATS - FULL 3-COLUMN GRID ON MOBILE & DESKTOP */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                  Total Roster
                </div>
                <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                  {totalAssigned}/{maxRoster}
                </div>
                <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                  {Math.round((totalAssigned / (maxRoster || 1)) * 100)}% Deployed
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                  Average GS
                </div>
                <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                  {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
                </div>
                <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                  Guild Power
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                  Active Teams
                </div>
                <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                  {maxTeams} Teams
                </div>
                <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                  3 Lanes
                </div>
              </div>
            </div>
          </div>

          {guildLeague.notes && (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-700 border border-zinc-200 leading-relaxed">
              <strong className="text-zinc-900">Tactical Strategy / Briefing: </strong>
              {guildLeague.notes}
            </div>
          )}

          {/* LANE FILTER TABS - HORIZONTAL SMOOTH SCROLL BAR ON MOBILE */}
          <div className="mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-zinc-100 pt-3.5 -mx-1 px-1 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
                activeTab === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              All Lanes ({totalAssigned}/{maxRoster})
            </button>

            {LANE_SECTIONS.map((lane) => {
              const stat = laneStats[lane.id];
              const isActive = activeTab === lane.id;
              const Icon = lane.icon;

              return (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => setActiveTab(lane.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
                    isActive
                      ? lane.pillActive
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{lane.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {stat?.assignedCount || 0}
                  </span>
                </button>
              );
            })}

            {laneGroups.unassigned.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("unassigned")}
                className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
                  activeTab === "unassigned"
                    ? "bg-zinc-800 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Unassigned ({laneStats.unassigned?.assignedCount || 0})
              </button>
            )}
          </div>
        </div>

        {/* TACTICAL DIRECTIVES BAR - CLEAN RESPONSIVE 3-COLUMN */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
                👑
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                  <span>MVP Strike</span>
                  <span className="shrink-0 font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">18:00 & 08:00</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Regroup at MVP spawn at 18:00 & 08:00 to secure boss kill.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800 text-sm border border-orange-200">
                🛡️
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                  <span>Lane Defense</span>
                  <span className="shrink-0 text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 uppercase font-bold">Skip MVP</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Hold lane defense & delay enemy advance at the MVP portal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-800 text-sm border border-red-200">
                ⚔️
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                  <span>Lane Assault</span>
                  <span className="shrink-0 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 uppercase font-bold">Siege</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                  Push enemy lane and breach defensive barricades.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 BATTLEFIELD LANE SECTIONS */}
        <div className="space-y-4 sm:space-y-6">
          {LANE_SECTIONS.map((lane) => {
            if (activeTab !== "all" && activeTab !== lane.id) return null;

            const teamNumbers = laneGroups[lane.id] || [];
            const stat = laneStats[lane.id];
            const Icon = lane.icon;

            return (
              <section
                key={lane.id}
                id={`lane-${lane.id}`}
                className="space-y-3 sm:space-y-4 animate-in fade-in duration-200"
              >
                {/* CLEAN LANE HEADER */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800">
                        <Icon className="size-4" />
                      </div>
                      <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                        {lane.name}
                      </h2>
                    </div>
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-zinc-600">
                      {teamNumbers.length} {teamNumbers.length === 1 ? "Team" : "Teams"}
                    </span>
                  </div>

                  {/* FORMATION STATS */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] sm:text-xs">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
                      <span>Formation: </span>
                      <strong className="text-zinc-900 font-bold">{stat?.assignedCount || 0} / {stat?.capacity || 0}</strong>
                    </div>
                    {stat?.avgGS > 0 && (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
                        <span>Avg GS: </span>
                        <strong className="text-zinc-900 font-bold font-mono">{formatNumber(stat.avgGS)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* TEAMS GRID */}
                {teamNumbers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 sm:p-8 text-center text-xs text-zinc-500">
                    No teams currently assigned to {lane.name}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {teamNumbers.map((teamNumber) => {
                      const team = teams.find(
                        (t) => Number(t.teamNumber) === teamNumber
                      );

                      return (
                        <PublicTeamCard
                          key={teamNumber}
                          teamNumber={teamNumber}
                          team={team}
                          rosterMembers={roster}
                          membersPerTeam={membersPerTeam}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {/* UNASSIGNED TEAMS SECTION IF ANY */}
          {(activeTab === "all" || activeTab === "unassigned") &&
            laneGroups.unassigned.length > 0 && (
              <section className="space-y-3 sm:space-y-4 border-t border-zinc-200 pt-5 sm:pt-6">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700">
                      <Layers className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-zinc-900">
                        Reserve / Unassigned Formations
                      </h2>
                    </div>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-zinc-600">
                    {laneGroups.unassigned.length} Teams
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {laneGroups.unassigned.map((teamNumber) => {
                    const team = teams.find(
                      (t) => Number(t.teamNumber) === teamNumber
                    );

                    return (
                      <PublicTeamCard
                        key={teamNumber}
                        teamNumber={teamNumber}
                        team={team}
                        rosterMembers={roster}
                        membersPerTeam={membersPerTeam}
                      />
                    );
                  })}
                </div>
              </section>
            )}
        </div>
      </div>
    </div>
  );
}
