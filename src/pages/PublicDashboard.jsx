import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "TBA";
  }

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDateValue(timestamp) {
  if (!timestamp) {
    return null;
  }

  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

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
      }))
      .sort(
        (first, second) =>
          second.count - first.count || first.name.localeCompare(second.name),
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
          <div className="space-y-5">
            {composition.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="truncate text-sm font-medium text-zinc-700">
                    {item.name}
                  </span>

                  <span className="shrink-0 text-sm font-bold tabular-nums text-zinc-900">
                    {item.count}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-red-700"
                    style={{
                      width: `${(item.count / maximum) * 100}%`,
                    }}
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
      .sort(
        (first, second) => Number(second.gearScore) - Number(first.gearScore),
      )
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
              Highest GR among active members
            </p>
          </div>
        </div>
      </div>

      {topMembers.length > 0 ? (
        <div className="divide-y divide-zinc-100">
          {topMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
            >
              <div
                className={[
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  index === 0
                    ? "bg-amber-100 text-amber-700"
                    : index === 1
                      ? "bg-zinc-200 text-zinc-700"
                      : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-zinc-100 text-zinc-500",
                ].join(" ")}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900">
                  {member.nickname}
                </div>

                <div className="mt-0.5 truncate text-xs text-zinc-500">
                  {member.className || "Unknown class"}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-bold tabular-nums text-zinc-900">
                  {formatNumber(member.gearScore)}
                </div>

                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  GR
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-zinc-400">
          No gear rating data available.
        </div>
      )}
    </section>
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
            There is currently no upcoming Guild League event.
          </p>
        </div>
      </section>
    );
  }

  const maxTeams = Number(guildLeague.maxTeams) || 12;

  const membersPerTeam = Number(guildLeague.membersPerTeam) || 5;

  const maxRoster = Number(guildLeague.maxRoster) || maxTeams * membersPerTeam;

  const rosterCount = Number(guildLeague.rosterCount) || 0;

  const percentage =
    maxRoster > 0 ? Math.min(100, (rosterCount / maxRoster) * 100) : 0;

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
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              {guildLeague.name}
            </h2>

            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
              <CalendarDays className="size-4" />

              {formatDate(guildLeague.eventDate)}
            </div>

            {guildLeague.notes && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
                {guildLeague.notes}
              </p>
            )}
          </div>

          <Link
            to={`/roster/${guildLeague.id}`}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            View Roster
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-zinc-500">
              Roster Progress
            </span>

            <span className="text-xs font-bold tabular-nums text-zinc-900">
              {rosterCount} / {maxRoster}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-red-700 transition-all"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PublicDashboard() {
  const [members, setMembers] = useState([]);

  const [guildLeagues, setGuildLeagues] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(true);

  const [loadingGuildLeagues, setLoadingGuildLeagues] = useState(true);

  const [membersError, setMembersError] = useState("");

  const [guildLeaguesError, setGuildLeaguesError] = useState("");

  useEffect(() => {
    const reference = collection(db, "members");

    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setMembers(data);
        setMembersError("");
        setLoadingMembers(false);
      },
      (snapshotError) => {
        console.error("Failed to load public members:", snapshotError);

        setMembersError("Failed to load guild member data.");

        setLoadingMembers(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const reference = collection(db, "guild_leagues");

    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setGuildLeagues(data);
        setGuildLeaguesError("");
        setLoadingGuildLeagues(false);
      },
      (snapshotError) => {
        console.error(
          "Failed to load public Guild League data:",
          snapshotError,
        );

        setGuildLeaguesError("Failed to load Guild League data.");

        setLoadingGuildLeagues(false);
      },
    );

    return unsubscribe;
  }, []);

  const activeMembers = useMemo(() => {
    return members.filter((member) => member.isActive !== false);
  }, [members]);

  const averageGearScore = useMemo(() => {
    const membersWithGear = activeMembers.filter(
      (member) => Number(member.gearScore) > 0,
    );

    if (membersWithGear.length === 0) {
      return 0;
    }

    const total = membersWithGear.reduce(
      (sum, member) => sum + Number(member.gearScore),
      0,
    );

    return Math.round(total / membersWithGear.length);
  }, [activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const now = new Date();

    const upcoming = guildLeagues
      .filter((guildLeague) => {
        if (guildLeague.status === "completed") {
          return false;
        }

        const eventDate = getDateValue(guildLeague.eventDate);

        if (!eventDate) {
          return false;
        }

        const endOfEventDay = new Date(eventDate);

        endOfEventDay.setHours(23, 59, 59, 999);

        return endOfEventDay >= now;
      })
      .sort((first, second) => {
        const firstDate = getDateValue(first.eventDate);

        const secondDate = getDateValue(second.eventDate);

        return firstDate - secondDate;
      });

    return upcoming[0] || null;
  }, [guildLeagues]);

  const loading = loadingMembers || loadingGuildLeagues;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-red-700 shadow-sm">
            <Shield className="size-5 text-white" />
          </div>

          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
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
            to="/login"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Admin
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main>
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
                Guild information, member composition and Guild League roster
                for Legend Army.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {(membersError || guildLeaguesError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {membersError || guildLeaguesError}
            </div>
          )}

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
                value={
                  averageGearScore > 0 ? formatNumber(averageGearScore) : "—"
                }
                label="Average GR"
                description="Active member average"
              />

              <StatCard
                icon={CalendarDays}
                value={nextGuildLeague ? "Upcoming" : "None"}
                label="Guild League"
                description={
                  nextGuildLeague
                    ? formatDate(nextGuildLeague.eventDate)
                    : "No scheduled event"
                }
              />
            </div>
          </section>

          <NextGuildLeague guildLeague={nextGuildLeague} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ClassComposition members={activeMembers} />

            <GearLeaderboard members={activeMembers} />
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-zinc-200 bg-white">
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
