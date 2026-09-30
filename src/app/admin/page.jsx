"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Shield,
  Swords,
  Users,
} from "lucide-react";
import { fetchMembers, fetchGuildLeagues } from "@/lib/api";
import {
  formatNumber,
  formatGearScore,
  formatDate,
  normalizeClassName,
  isMemberActive,
} from "@/utils/formatters";
import {
  PageLoading,
  SkeletonCard,
  AdminDashboardSkeleton,
} from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

function Stat({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="text-2xl font-bold tracking-tight text-content-strong sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-content-muted sm:text-sm">{label}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [members, setMembers] = useState([]);
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [membersData, leaguesData] = await Promise.all([
        fetchMembers(),
        fetchGuildLeagues(),
      ]);
      setMembers(membersData);
      setGuildLeagues(leaguesData);
      setError("");
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
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

  const classComposition = useMemo(() => {
    const classes = new Map();
    activeMembers.forEach((member) => {
      const className = normalizeClassName(member);
      classes.set(className, (classes.get(className) || 0) + 1);
    });

    return Array.from(classes.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeMembers]);

  const nextGuildLeague = useMemo(() => {
    const upcoming = guildLeagues.filter(
      (gl) => gl.status !== "completed" && gl.status !== "cancelled"
    );
    return upcoming[0] || null;
  }, [guildLeagues]);

  if (loading && members.length === 0 && guildLeagues.length === 0) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-brand-600">Legend Army</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-content-strong sm:text-3xl">
          Guild Hub Dashboard
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Manage guild members, events, rosters, and guild activities.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* STATS SECTION */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <Stat
          value={formatNumber(activeMembers.length)}
          label={`Active Members (${activePercentage}% of ${members.length})`}
        />
        <Stat
          value={averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
          label="Average Gear Score"
        />
        <Stat
          value={formatNumber(guildLeagues.length)}
          label="Guild League Events"
        />
      </section>

      {/* SPLIT SECTION: NEXT GUILD LEAGUE & CLASS COMPOSITION */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* NEXT GUILD LEAGUE CARD */}
        <section className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                NEXT EVENT
              </span>
              {nextGuildLeague && (
                <span className="text-xs text-content-subtle uppercase font-semibold">
                  {nextGuildLeague.status || "DRAFT"}
                </span>
              )}
            </div>

            {nextGuildLeague ? (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-content-strong">
                  {nextGuildLeague.name}
                </h3>
                <div className="mt-2 space-y-1 text-xs text-content-muted">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-content-subtle" />
                    <span>
                      {formatDate(nextGuildLeague.matchDate || nextGuildLeague.date)}
                    </span>
                  </div>
                  {nextGuildLeague.opponent && (
                    <div className="font-semibold text-content-strong">
                      Opponent: {nextGuildLeague.opponent}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Users className="size-3.5 text-content-subtle" />
                    <span>
                      Roster:{" "}
                      {nextGuildLeague.assignedPlayers ||
                        nextGuildLeague.rosterCount ||
                        0}{" "}
                      / {nextGuildLeague.maxRoster || 20} players
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-content-muted">
                No upcoming Guild League events scheduled.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-line">
            {nextGuildLeague ? (
              <Link
                href={`/admin/guild-leagues/${nextGuildLeague.id}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-800"
              >
                <span>Manage Event & Roster</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <Link
                href="/admin/guild-leagues"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-800"
              >
                <span>Create New Guild League</span>
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </section>

        {/* CLASS COMPOSITION */}
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-content-strong">
              Class Composition
            </h3>
            <span className="text-xs text-content-subtle">
              {activeMembers.length} Active Members
            </span>
          </div>

          {classComposition.length === 0 ? (
            <p className="mt-4 text-xs text-content-muted">
              No member classes recorded yet.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-2">
              {classComposition.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-content-strong">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-700">{item.count}</span>
                    <span className="text-content-subtle text-[11px]">
                      ({Math.round((item.count / activeMembers.length) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* QUICK LINKS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/members"
          className="flex items-center justify-between rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-300"
        >
          <div>
            <h4 className="text-sm font-bold text-content-strong">
              Manage Members
            </h4>
            <p className="mt-0.5 text-xs text-content-muted">
              Add, edit, or import members
            </p>
          </div>
          <ChevronRight className="size-4 text-content-subtle" />
        </Link>
        <Link
          href="/admin/guild-leagues"
          className="flex items-center justify-between rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-300"
        >
          <div>
            <h4 className="text-sm font-bold text-content-strong">
              Guild Leagues
            </h4>
            <p className="mt-0.5 text-xs text-content-muted">
              Matches & team assignments
            </p>
          </div>
          <ChevronRight className="size-4 text-content-subtle" />
        </Link>
        <Link
          href="/admin/strategy"
          className="flex items-center justify-between rounded-xl border border-line bg-white p-4 shadow-sm transition hover:border-brand-300"
        >
          <div>
            <h4 className="text-sm font-bold text-content-strong">
              Strategy & Guides
            </h4>
            <p className="mt-0.5 text-xs text-content-muted">
              Tactic plans & map setups
            </p>
          </div>
          <ChevronRight className="size-4 text-content-subtle" />
        </Link>
      </section>
    </div>
  );
}
