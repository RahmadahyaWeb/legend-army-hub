import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";

function Stat({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
        {value}
      </div>

      <div className="mt-1 text-xs text-content-muted sm:text-sm">{label}</div>
    </div>
  );
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatGearScore(value) {
  const number = Number(value);

  if (!number || Number.isNaN(number)) {
    return "0";
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(".0", "")}K`;
  }

  return formatNumber(number);
}

function getDate(timestamp) {
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

function formatEventDate(timestamp) {
  const date = getDate(timestamp);

  if (!date) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeClassName(member) {
  return member.className || member.class || member.job || "Unknown";
}

function isMemberActive(member) {
  if (typeof member.isActive === "boolean") {
    return member.isActive;
  }

  if (typeof member.active === "boolean") {
    return member.active;
  }

  if (typeof member.status === "string") {
    return member.status.toLowerCase() === "active";
  }

  return true;
}

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(true);

  const [loadingGuildLeagues, setLoadingGuildLeagues] = useState(true);

  const [membersError, setMembersError] = useState("");

  const [guildLeaguesError, setGuildLeaguesError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "members"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setMembers(data);
        setMembersError("");
        setLoadingMembers(false);
      },
      (error) => {
        console.error("Failed to load members:", error);

        setMembersError("Failed to load member data.");

        setLoadingMembers(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "guild_leagues"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setGuildLeagues(data);
        setGuildLeaguesError("");
        setLoadingGuildLeagues(false);
      },
      (error) => {
        console.error("Failed to load Guild League events:", error);

        setGuildLeaguesError("Failed to load Guild League data.");

        setLoadingGuildLeagues(false);
      },
    );

    return unsubscribe;
  }, []);

  const activeMembers = useMemo(
    () => members.filter(isMemberActive),
    [members],
  );

  const averageGearScore = useMemo(() => {
    if (activeMembers.length === 0) {
      return 0;
    }

    const validMembers = activeMembers.filter(
      (member) => Number(member.gearScore) > 0,
    );

    if (validMembers.length === 0) {
      return 0;
    }

    const totalGearScore = validMembers.reduce(
      (total, member) => total + Number(member.gearScore || 0),
      0,
    );

    return Math.round(totalGearScore / validMembers.length);
  }, [activeMembers]);

  const activePercentage = useMemo(() => {
    if (members.length === 0) {
      return 0;
    }

    return (activeMembers.length / members.length) * 100;
  }, [members, activeMembers]);

  const classComposition = useMemo(() => {
    const classes = new Map();

    activeMembers.forEach((member) => {
      const className = normalizeClassName(member);

      classes.set(className, (classes.get(className) || 0) + 1);
    });

    return Array.from(classes.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((first, second) => {
        if (second.count !== first.count) {
          return second.count - first.count;
        }

        return first.name.localeCompare(second.name);
      });
  }, [activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const openEvents = guildLeagues
      .filter((event) => event.status === "open")
      .map((event) => {
        const parsedDate = getDate(event.eventDate);

        if (!parsedDate) {
          return {
            ...event,
            parsedDate: null,
          };
        }

        const eventDate = new Date(parsedDate);

        eventDate.setHours(0, 0, 0, 0);

        return {
          ...event,
          parsedDate,
          comparisonDate: eventDate,
        };
      })
      .filter((event) => event.comparisonDate && event.comparisonDate >= today)
      .sort(
        (first, second) =>
          first.comparisonDate.getTime() - second.comparisonDate.getTime(),
      );

    return openEvents[0] || null;
  }, [guildLeagues]);

  const nextRosterCount = Number(nextGuildLeague?.rosterCount) || 0;

  const nextMaxRoster =
    Number(nextGuildLeague?.maxRoster) ||
    (Number(nextGuildLeague?.maxTeams) || 12) *
      (Number(nextGuildLeague?.membersPerTeam) || 5);

  const nextRosterPercentage =
    nextMaxRoster > 0
      ? Math.min(100, (nextRosterCount / nextMaxRoster) * 100)
      : 0;

  const loading = loadingMembers || loadingGuildLeagues;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-brand-600">Legend Army</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
          Guild Hub
        </h1>

        <p className="mt-1 text-sm text-content-muted">
          Manage guild members, events, rosters, and activities.
        </p>
      </div>

      {(membersError || guildLeaguesError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {membersError || guildLeaguesError}
        </div>
      )}

      <section className="grid grid-cols-3 border-y border-line py-5">
        <Stat value={formatNumber(members.length)} label="Members" />

        <div className="border-x border-line px-5 sm:px-8">
          <Stat value={formatNumber(activeMembers.length)} label="Active" />
        </div>

        <div className="pl-5 sm:pl-8">
          <Stat value={formatGearScore(averageGearScore)} label="Avg. GR" />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-content-strong">
                  Next Guild League
                </h2>

                <p className="mt-1 text-sm text-content-muted">
                  Upcoming published battle.
                </p>
              </div>

              <CalendarDays className="size-5 text-content-subtle" />
            </div>

            {nextGuildLeague ? (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-50">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-2 rounded-full bg-emerald-500" />

                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                          Open
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-content-strong">
                        {nextGuildLeague.name || "Guild League"}
                      </h3>

                      <p className="mt-1 text-sm text-content-muted">
                        {formatEventDate(nextGuildLeague.eventDate)}
                      </p>

                      {nextGuildLeague.notes && (
                        <p className="mt-3 max-w-lg text-sm leading-6 text-content-muted">
                          {nextGuildLeague.notes}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <div className="text-2xl font-semibold text-content-strong">
                        {nextRosterCount}

                        <span className="text-base font-normal text-content-subtle">
                          {" "}
                          / {nextMaxRoster}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-content-muted">
                        roster assigned
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-300">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{
                          width: `${nextRosterPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  to={`/admin/guild-leagues/${nextGuildLeague.id}`}
                  className="flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-medium text-content transition hover:bg-surface-100 hover:text-content-strong sm:px-6"
                >
                  Manage roster
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-line bg-surface-50 px-5 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-surface-200">
                  <CalendarDays className="size-5 text-content-muted" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-content-strong">
                  No upcoming Guild League
                </h3>

                <p className="mt-1 max-w-sm text-sm leading-6 text-content-muted">
                  There is currently no upcoming event with Open status.
                </p>

                <Link
                  to="/admin/guild-leagues"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700"
                >
                  View Guild League
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-content-strong">
                Guild League Events
              </h2>

              <p className="mt-1 text-sm text-content-muted">
                Current event summary.
              </p>
            </div>

            <div className="grid grid-cols-3 border-y border-line py-5">
              <div>
                <div className="text-xl font-semibold tabular-nums text-content-strong">
                  {guildLeagues.length}
                </div>

                <div className="mt-1 text-xs text-content-muted">Total</div>
              </div>

              <div className="border-x border-line px-5">
                <div className="text-xl font-semibold tabular-nums text-emerald-600">
                  {
                    guildLeagues.filter((event) => event.status === "open")
                      .length
                  }
                </div>

                <div className="mt-1 text-xs text-content-muted">Open</div>
              </div>

              <div className="pl-5">
                <div className="text-xl font-semibold tabular-nums text-content-strong">
                  {
                    guildLeagues.filter((event) => event.status === "completed")
                      .length
                  }
                </div>

                <div className="mt-1 text-xs text-content-muted">Completed</div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-content-strong">
                Class composition
              </h2>

              <p className="mt-1 text-sm text-content-muted">
                Active member distribution.
              </p>
            </div>

            {classComposition.length > 0 ? (
              <div className="divide-y divide-line border-y border-line">
                {classComposition.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-3.5"
                  >
                    <span className="text-sm text-content">{item.name}</span>

                    <span className="text-sm font-medium tabular-nums text-content-strong">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-y border-line py-6 text-sm text-content-muted">
                No active members.
              </div>
            )}

            <Link
              to="/admin/members"
              className="mt-3 flex items-center gap-1 text-sm font-medium text-content-muted transition hover:text-brand-600"
            >
              View all members
              <ChevronRight className="size-4" />
            </Link>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-content-strong">
                Guild status
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="size-4 text-content-muted" />

                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <span className="text-sm text-content-muted">
                    Total members
                  </span>

                  <span className="text-sm font-medium text-content-strong">
                    {formatNumber(members.length)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-content-muted" />

                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <span className="text-sm text-content-muted">
                    Active members
                  </span>

                  <span className="text-sm font-medium text-emerald-600">
                    {activePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-content-muted" />

                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <span className="text-sm text-content-muted">
                    Open GL events
                  </span>

                  <span className="text-sm font-medium text-content-strong">
                    {
                      guildLeagues.filter((event) => event.status === "open")
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
