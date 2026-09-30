"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  ExternalLink,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";

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
        percentage:
          members.length > 0
            ? Math.round((count / members.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [members]);

  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-zinc-900">
          Class Composition
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          No member data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">
            Class Composition
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Distribution across {members.length} registered members
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
          <Shield className="size-4" />
        </div>
      </div>

      <div className="mt-6 space-y-3.5">
        {composition.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700">{item.name}</span>
              <span className="text-zinc-500">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-red-700 transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ guildLeague }) {
  const matchDate = guildLeague.matchDate || guildLeague.date || guildLeague.eventDate;
  const formattedDate = formatDate(matchDate);
  const rosterCount = guildLeague.assignedPlayers || guildLeague.rosterCount || 0;
  const maxRoster = guildLeague.maxRoster || 20;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {guildLeague.status?.toUpperCase() || "DRAFT"}
            </span>
            <h4 className="mt-2 text-base font-bold text-zinc-900">
              {guildLeague.name}
            </h4>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <Swords className="size-4" />
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-zinc-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-zinc-400" />
            <span>
              Roster: {rosterCount} / {maxRoster} players
            </span>
          </div>
          {guildLeague.opponent && (
            <div className="flex items-center gap-2 text-zinc-700 font-medium">
              <span>VS: {guildLeague.opponent}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-100">
        <Link
          href={`/roster/${guildLeague.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
        >
          <span>View Public Roster</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function PublicDashboard() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingGuildLeagues, setLoadingGuildLeagues] = useState(true);

  useEffect(() => {
    fetchMembers()
      .then((data) => setMembers(data))
      .catch((err) => console.error("Error fetching members:", err))
      .finally(() => setLoadingMembers(false));

    fetchGuildLeagues()
      .then((data) => setGuildLeagues(data))
      .catch((err) => console.error("Error fetching guild leagues:", err))
      .finally(() => setLoadingGuildLeagues(false));
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
    const upcoming = guildLeagues.filter(
      (gl) => gl.status !== "completed" && gl.status !== "cancelled"
    );
    return upcoming[0] || null;
  }, [guildLeagues]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-700">
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
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Official Guild Hub
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <span>Admin Portal</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-red-950 via-zinc-900 to-zinc-950 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/60 px-4 py-1.5 text-xs font-semibold text-red-300">
            <Crown className="size-3.5 text-red-400" />
            <span>Legend Army Guild Hub</span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl">
            LEGEND ARMY
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Portal resmi manajemen Guild League, data anggota guild, roster
            pertandingan, taktik, dan statistik guild secara terintegrasi.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {nextGuildLeague && (
              <Link
                href={`/roster/${nextGuildLeague.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
              >
                <Swords className="size-4" />
                <span>Next Match Roster</span>
              </Link>
            )}
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 text-sm font-semibold text-zinc-200 backdrop-blur transition hover:bg-zinc-700"
            >
              <span>Sign In Admin</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN STATS CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* STATS GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            value={loadingMembers ? "..." : formatNumber(members.length)}
            label="Total Members"
            description={`${activeMembers.length} active players`}
          />
          <StatCard
            icon={Shield}
            value={loadingMembers ? "..." : averageGearScore > 0 ? averageGearScore : "N/A"}
            label="Average Gear Score"
            description="Active guild roster average"
          />
          <StatCard
            icon={Swords}
            value={loadingGuildLeagues ? "..." : formatNumber(guildLeagues.length)}
            label="Guild League Matches"
            description="Matches recorded"
          />
          <StatCard
            icon={Trophy}
            value="Active"
            label="Guild Status"
            description="Competitive Roster"
          />
        </div>

        {/* SECTION: GUILD LEAGUE MATCHES & ROSTER */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* MATCHES LIST */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  Guild League Matches
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Public rosters and active team setups
                </p>
              </div>
            </div>

            {loadingGuildLeagues ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
                Loading matches...
              </div>
            ) : guildLeagues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
                No Guild League matches created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {guildLeagues.map((gl) => (
                  <MatchCard key={gl.id} guildLeague={gl} />
                ))}
              </div>
            )}
          </div>

          {/* CLASS COMPOSITION */}
          <div>
            <ClassComposition members={activeMembers} />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Legend Army. All rights reserved.</p>
          <p className="mt-1 font-medium text-zinc-600">Made by XKG</p>
        </div>
      </footer>
    </div>
  );
}
