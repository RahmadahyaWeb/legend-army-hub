"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Flame,
  Layers,
  MapPin,
  Shield,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { fetchGuildLeagueDetail } from "@/lib/api";
import { RosterDetailSkeleton } from "@/components/ui/LoadingState";

const LANE_SECTIONS = [
  {
    id: "top",
    name: "Top Lane",
    tagline: "Assault & Frontline Engagements",
    icon: Swords,
    badgeBg: "bg-orange-50 border-orange-200 text-orange-800",
    headerBg: "bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-orange-200",
    pillActive: "bg-orange-600 text-white shadow-orange-600/25",
    accentColor: "text-orange-600",
    dotColor: "bg-orange-500",
  },
  {
    id: "mid",
    name: "Mid Lane",
    tagline: "Core Battlefield & Objective Control",
    icon: Shield,
    badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
    headerBg: "bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border-blue-200",
    pillActive: "bg-blue-600 text-white shadow-blue-600/25",
    accentColor: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  {
    id: "bot",
    name: "Bottom Lane",
    tagline: "Tactical Flank & Strategic Support",
    icon: Zap,
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    headerBg: "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200",
    pillActive: "bg-emerald-600 text-white shadow-emerald-600/25",
    accentColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
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

function PublicTeamCard({ teamNumber, team, rosterMembers, membersPerTeam = 10, laneInfo }) {
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

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs hover:shadow-md transition">
      {/* TEAM HEADER */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50/75 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white shadow-xs">
            T{teamNumber}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 truncate">
              {team?.name || `Team ${teamNumber}`}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-700">
                {members.length}/{membersPerTeam} players
              </span>
              <span>•</span>
              <span>{fillPercent}% filled</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {averageGearScore > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-xs">
              <Shield className="size-3 text-zinc-400" />
              <span>{formatNumber(averageGearScore)} GS</span>
            </span>
          )}
        </div>
      </div>

      {/* PLAYER SLOTS */}
      <div className="flex-1 divide-y divide-zinc-100">
        {Array.from({ length: membersPerTeam }, (_, index) => {
          const slot = index + 1;
          const member = members.find((m) => Number(m.slotNumber) === slot);

          if (!member) {
            return (
              <div
                key={slot}
                className="flex items-center justify-between px-5 py-3 text-xs text-zinc-400 bg-zinc-50/30"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-zinc-300 font-mono text-[11px]">
                    #{slot}
                  </span>
                  <span className="italic text-zinc-400">Empty Slot</span>
                </div>
                <span className="text-[11px] text-zinc-300">—</span>
              </div>
            );
          }

          return (
            <div
              key={slot}
              className="flex items-center justify-between px-5 py-3 text-xs transition hover:bg-zinc-50/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 font-bold font-mono text-[11px] text-zinc-400">
                  #{slot}
                </span>
                <div className="min-w-0 pr-2">
                  <div className="truncate font-bold text-zinc-900">
                    {member.nickname}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500">
                    {member.className || "Unknown Class"}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-right">
                {Number(member.level) > 0 && (
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Lv. {member.level}
                  </span>
                )}
                {Number(member.gearScore) > 0 && (
                  <span className="font-bold text-zinc-900 font-mono text-xs">
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
      if (laneKey === "top") map.top.push(tNum);
      else if (laneKey === "mid") map.mid.push(tNum);
      else if (laneKey === "bot") map.bot.push(tNum);
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
        <div className="h-16 border-b border-zinc-200 bg-white" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <RosterDetailSkeleton isPublic={true} />
        </div>
      </div>
    );
  }

  if (error || !guildLeague) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
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
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

      {/* HERO / EVENT OVERVIEW */}
      <section className="border-b border-zinc-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-widest">
                <Swords className="size-4" />
                <span>Guild League Lineup & Roster</span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl lg:text-4xl tracking-tight">
                {guildLeague.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  <span>{formatDate(matchDate)}</span>
                </div>
                {guildLeague.opponent && (
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <span>Opponent: {guildLeague.opponent}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/75 p-4 min-w-[130px]">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Total Roster
                </div>
                <div className="mt-0.5 text-xl font-black text-zinc-900">
                  {totalAssigned} / {maxRoster}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                  {Math.round((totalAssigned / (maxRoster || 1)) * 100)}% Deployed
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/75 p-4 min-w-[130px]">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Average GS
                </div>
                <div className="mt-0.5 text-xl font-black text-zinc-900">
                  {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                  Guild Power Score
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/75 p-4 min-w-[130px]">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Active Teams
                </div>
                <div className="mt-0.5 text-xl font-black text-zinc-900">
                  {maxTeams} Teams
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                  3 Battlefield Lanes
                </div>
              </div>
            </div>
          </div>

          {guildLeague.notes && (
            <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-700 border border-zinc-200 leading-relaxed">
              <span className="font-bold text-zinc-900">Tactical Strategy / Briefing: </span>
              {guildLeague.notes}
            </div>
          )}

          {/* LANE FILTER / JUMP TABS */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
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
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
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
                className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
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
      </section>

      {/* 3 BATTLEFIELD LANE SECTIONS */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {LANE_SECTIONS.map((lane) => {
          if (activeTab !== "all" && activeTab !== lane.id) return null;

          const teamNumbers = laneGroups[lane.id] || [];
          const stat = laneStats[lane.id];
          const Icon = lane.icon;

          return (
            <section
              key={lane.id}
              id={`lane-${lane.id}`}
              className="space-y-4 animate-in fade-in duration-200"
            >
              {/* LANE SECTION HEADER BANNER */}
              <div
                className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-5 ${lane.headerBg}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border ${lane.badgeBg}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-zinc-900 sm:text-xl tracking-tight">
                        {lane.name}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border uppercase tracking-wider ${lane.badgeBg}`}
                      >
                        {teamNumbers.length} Teams
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {lane.tagline}
                    </p>
                  </div>
                </div>

                {/* LANE STATS PILLS */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-3 py-1.5 shadow-2xs">
                    <span className="text-zinc-500">Formation: </span>
                    <span className="font-bold text-zinc-900">
                      {stat?.assignedCount || 0} / {stat?.capacity || 0} Players
                    </span>
                  </div>
                  {stat?.avgGS > 0 && (
                    <div className="rounded-xl border border-zinc-200/80 bg-white/90 px-3 py-1.5 shadow-2xs">
                      <span className="text-zinc-500">Lane Avg GS: </span>
                      <span className="font-bold text-zinc-900 font-mono">
                        {formatNumber(stat.avgGS)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TEAMS GRID FOR THIS LANE */}
              {teamNumbers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-xs text-zinc-500">
                  No teams currently assigned to {lane.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        laneInfo={lane}
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
            <section className="space-y-4 border-t border-zinc-200 pt-8">
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-100/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-zinc-300 text-zinc-700">
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">
                      Reserve / Unassigned Formations
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Teams awaiting battlefield lane assignment
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold text-zinc-700">
                  {laneGroups.unassigned.length} Teams
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Legend Army Guild Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
