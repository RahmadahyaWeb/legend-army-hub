"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Crown,
  MapPin,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import { fetchGuildLeagueDetail } from "@/lib/api";

const LANE_CONFIG = {
  top: {
    label: "Top Lane",
    shortLabel: "TOP",
    headerClassName: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
  },
  mid: {
    label: "Mid Lane",
    shortLabel: "MID",
    headerClassName: "border-blue-200 bg-blue-50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  bot: {
    label: "Bot Lane",
    shortLabel: "BOT",
    headerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

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

  const laneKey = team?.lane?.toLowerCase();
  const laneConfig = LANE_CONFIG[laneKey];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-700">
            T{teamNumber}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              {team?.name || `Team ${teamNumber}`}
            </h3>
            <p className="text-xs text-zinc-500">
              {members.length} / {membersPerTeam} players
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {laneConfig ? (
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${laneConfig.badgeClassName}`}
            >
              <MapPin className="size-3" />
              <span>{laneConfig.label}</span>
            </span>
          ) : team?.lane ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              <MapPin className="size-3" />
              <span>{team.lane}</span>
            </span>
          ) : null}

          {averageGearScore > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              <Shield className="size-3 text-zinc-500" />
              <span>Avg GS: {formatNumber(averageGearScore)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {Array.from({ length: membersPerTeam }, (_, index) => {
          const slot = index + 1;
          const member = members.find((m) => Number(m.slotNumber) === slot);

          if (!member) {
            return (
              <div
                key={slot}
                className="flex items-center justify-between px-4 py-3 text-xs text-zinc-400 sm:px-5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-zinc-300 font-mono">#{slot}</span>
                  <span>Empty Slot</span>
                </div>
                <span>—</span>
              </div>
            );
          }

          return (
            <div
              key={slot}
              className="flex items-center justify-between px-4 py-3 text-xs transition hover:bg-zinc-50 sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 font-bold font-mono text-zinc-400">
                  #{slot}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-bold text-zinc-900">
                    {member.nickname}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500">
                    {member.className || "Unknown Class"}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-right">
                {Number(member.level) > 0 && (
                  <span className="text-zinc-500">Lv. {member.level}</span>
                )}
                {Number(member.gearScore) > 0 && (
                  <span className="font-bold text-zinc-900">
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
          <p className="text-xs text-zinc-500 font-medium">Loading Roster...</p>
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
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 uppercase">
              {guildLeague.status || "DRAFT"}
            </span>
          </div>
        </div>
      </header>

      {/* HERO / EVENT INFO */}
      <section className="border-b border-zinc-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                <Swords className="size-4" />
                <span>Guild League Roster</span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
                {guildLeague.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  <span>{formatDate(matchDate)}</span>
                </div>
                {guildLeague.opponent && (
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <span>Opponent: {guildLeague.opponent}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">
                  Total Players
                </div>
                <div className="text-base font-bold text-zinc-900">
                  {totalAssigned} / {maxRoster}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">
                  Average GS
                </div>
                <div className="text-base font-bold text-zinc-900">
                  {averageGearScore > 0 ? `${formatNumber(averageGearScore)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {guildLeague.notes && (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-600 border border-zinc-200">
              <span className="font-bold text-zinc-700">Notes / Strategy: </span>
              {guildLeague.notes}
            </div>
          )}
        </div>
      </section>

      {/* TEAMS ROSTER GRID */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: maxTeams }, (_, index) => {
            const teamNumber = index + 1;
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
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Legend Army. Made by XKG</p>
      </footer>
    </div>
  );
}
