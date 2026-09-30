"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import { PublicDashboardSkeleton } from "@/components/ui/LoadingState";

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString();
}

function formatDate(timestamp) {
  if (!timestamp) return "TBA";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "TBA";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDateValue(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function StatCard({ icon: Icon, value, label, description }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {value}
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-700">
            {label}
          </div>
          {description && (
            <div className="mt-1 text-xs text-zinc-400">{description}</div>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <Icon className="size-5 text-red-700" />
        </div>
      </div>
    </div>
  );
}

function NextGuildLeague({ guildLeague }) {
  if (!guildLeague) {
    return (
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100">
            <CalendarDays className="size-5 text-zinc-500" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-zinc-900">
            No Upcoming Guild League
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            There is currently no upcoming Guild League event scheduled.
          </p>
        </div>
      </section>
    );
  }

  const maxTeams = Number(guildLeague.maxTeams) || 2;
  const membersPerTeam = Number(guildLeague.membersPerTeam) || 10;
  const maxRoster = Number(guildLeague.maxRoster) || maxTeams * membersPerTeam;
  const rosterCount = Number(guildLeague.assignedPlayers || guildLeague.rosterCount) || 0;
  const percentage = maxRoster > 0 ? Math.min(100, (rosterCount / maxRoster) * 100) : 0;
  const eventDate = guildLeague.matchDate || guildLeague.date;

  return (
    <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="border-b border-red-100 bg-red-50 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700">
          <Swords className="size-4" />
          Next Guild League
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                {guildLeague.name}
              </h2>
              {guildLeague.status && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                  {guildLeague.status}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-zinc-400" />
                <span>{formatDate(eventDate)}</span>
              </div>
              {guildLeague.opponent && (
                <div className="font-semibold text-zinc-800">
                  Opponent: {guildLeague.opponent}
                </div>
              )}
            </div>

            {guildLeague.notes && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
                {guildLeague.notes}
              </p>
            )}
          </div>

          <Link
            href={`/roster/${guildLeague.id}`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800 shadow-sm"
          >
            <span>View Roster</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-zinc-500">
              Roster Progress
            </span>
            <span className="text-xs font-bold tabular-nums text-zinc-900">
              {rosterCount} / {maxRoster} Players
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-red-700 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ClassComposition({ members }) {
  const composition = useMemo(() => {
    const classes = new Map();
    members.forEach((member) => {
      const className = member.className?.trim() || "Unknown";
      classes.set(className, (classes.get(className) || 0) + 1);
    });

    return Array.from(classes.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name)
      );
  }, [members]);

  const maximum = composition.length > 0 ? composition[0].count : 1;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-red-50">
            <Swords className="size-4 text-red-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">
              Guild Composition
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Active members by class
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {composition.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {composition.map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <span className="truncate text-sm font-medium text-zinc-700">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-900">
                    {item.count}{" "}
                    <span className="font-normal text-zinc-400">
                      ({Math.round((item.count / members.length) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-red-700 transition-all duration-300"
                    style={{ width: `${(item.count / maximum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-zinc-400">
            No member data available.
          </div>
        )}
      </div>
    </section>
  );
}

function GearLeaderboard({ members }) {
  const topMembers = useMemo(() => {
    return [...members]
      .filter((member) => Number(member.gearScore) > 0)
      .sort((a, b) => Number(b.gearScore) - Number(a.gearScore))
      .slice(0, 10);
  }, [members]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50">
            <Trophy className="size-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Top Gear Rating</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Highest Gear Score among active members
            </p>
          </div>
        </div>
      </div>

      {topMembers.length > 0 ? (
        <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
          {topMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-5 py-3.5 sm:px-6 transition hover:bg-zinc-50"
            >
              <div
                className={[
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  index === 0
                    ? "bg-amber-100 text-amber-800"
                    : index === 1
                    ? "bg-zinc-200 text-zinc-800"
                    : index === 2
                    ? "bg-orange-100 text-orange-800"
                    : "bg-zinc-100 text-zinc-500",
                ].join(" ")}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-zinc-900">
                  {member.nickname}
                </div>
                <div className="mt-0.5 truncate text-xs text-zinc-500">
                  {member.className || "Unknown Class"} • Lv. {member.level || "—"}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-bold tabular-nums text-zinc-900">
                  {formatNumber(member.gearScore)}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  GS
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-zinc-400">
          No gear score data available.
        </div>
      )}
    </section>
  );
}

export default function PublicDashboard() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchMembers(), fetchGuildLeagues()])
      .then(([membersData, leaguesData]) => {
        setMembers(membersData);
        setGuildLeagues(leaguesData);
        setError("");
      })
      .catch((err) => {
        console.error("Public load error:", err);
        setError("Failed to load guild data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const activeMembers = useMemo(() => {
    return members.filter((member) => member.isActive !== false);
  }, [members]);

  const averageGearScore = useMemo(() => {
    const membersWithGear = activeMembers.filter(
      (member) => Number(member.gearScore) > 0
    );
    if (membersWithGear.length === 0) return 0;
    const total = membersWithGear.reduce(
      (sum, member) => sum + Number(member.gearScore),
      0
    );
    return Math.round(total / membersWithGear.length);
  }, [activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const now = new Date();
    const upcoming = guildLeagues
      .filter((gl) => {
        if (gl.status === "completed" || gl.status === "cancelled") return false;
        const d = getDateValue(gl.matchDate || gl.date);
        if (!d) return true;
        const endDay = new Date(d);
        endDay.setHours(23, 59, 59, 999);
        return endDay >= now;
      })
      .sort((a, b) => {
        const da = getDateValue(a.matchDate || a.date);
        const db = getDateValue(b.matchDate || b.date);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      });

    return upcoming[0] || guildLeagues[0] || null;
  }, [guildLeagues]);

  if (loading) {
    return <PublicDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-700">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-zinc-900">
                LEGEND ARMY
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Guild Portal
              </div>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <span>Admin</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main>
        {/* HERO SECTION */}
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                <Crown className="size-3.5" />
                Legend Army
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                Guild Portal
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
                Guild information, member composition, and Guild League rosters
                for Legend Army.
              </p>
            </div>
          </div>
        </section>

        {/* STATS & SECTIONS */}
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* OVERVIEW STATS */}
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-zinc-900">
                Guild Overview
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Current Legend Army statistics
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={Users}
                value={activeMembers.length}
                label="Active Members"
                description="Current guild members"
              />

              <StatCard
                icon={Trophy}
                value={averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
                label="Average Gear Score"
                description="Active member average"
              />

              <StatCard
                icon={CalendarDays}
                value={nextGuildLeague ? "Upcoming" : "None"}
                label="Guild League"
                description={
                  nextGuildLeague
                    ? formatDate(nextGuildLeague.matchDate || nextGuildLeague.date)
                    : "No scheduled event"
                }
              />
            </div>
          </section>

          {/* NEXT GUILD LEAGUE HERO CARD */}
          <NextGuildLeague guildLeague={nextGuildLeague} />

          {/* GRID: CLASS COMPOSITION + TOP GEAR LEADERBOARD */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ClassComposition members={activeMembers} />
            <GearLeaderboard members={activeMembers} />
          </div>

          {/* ALL MATCHES LIST (IF MORE THAN 1 MATCH) */}
          {guildLeagues.length > 1 && (
            <section className="pt-4">
              <div className="mb-4">
                <h2 className="text-base font-bold text-zinc-900">
                  All Matches & Events
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Scheduled and past Guild League events
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {guildLeagues.map((gl) => (
                  <div
                    key={gl.id}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                          {gl.status || "DRAFT"}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatDate(gl.matchDate || gl.date)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-zinc-900">
                        {gl.name}
                      </h3>

                      {gl.opponent && (
                        <p className="mt-1 text-xs font-semibold text-zinc-600">
                          VS: {gl.opponent}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-zinc-500">
                        Roster: {gl.assignedPlayers || gl.rosterCount || 0} /{" "}
                        {gl.maxRoster || 20} Players
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-100">
                      <Link
                        href={`/roster/${gl.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800"
                      >
                        <span>View Match Roster</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-700">
              <img
                src="/logo.png"
                alt="Legend Army"
                className="size-9 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">LEGEND ARMY</div>
              <div className="text-xs text-zinc-400">Guild Portal</div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-zinc-400">
              Legend Army · Guild Information
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              Made by <span className="font-semibold text-zinc-600">XKG</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
