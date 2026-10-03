"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Swords } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";

/**
 * Next Match Highlight Card
 *
 * Why this exists:
 * Spotlights the imminent Guild League match with date, opponent, and lineup capacity progress.
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.guildLeague - Next match details
 * @param {boolean} [props.isAdmin=false] - When true, directs to admin roster manager
 */
export default function NextMatchCard({ guildLeague = null, isAdmin = false }) {
  if (!guildLeague) {
    return (
      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
          <CalendarDays className="size-5" />
        </div>
        <h2 className="mt-4 text-base font-bold text-zinc-900">
          No Upcoming Guild Event
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          There is currently no upcoming event scheduled on the calendar.
        </p>
      </Card>
    );
  }

  const maxTeams = Number(guildLeague.maxTeams) || 2;
  const membersPerTeam = Number(guildLeague.membersPerTeam) || 10;
  const maxRoster = Number(guildLeague.maxRoster) || maxTeams * membersPerTeam;
  const rosterCount = Number(guildLeague.assignedPlayers || guildLeague.rosterCount) || 0;
  const percentage = maxRoster > 0 ? Math.min(100, (rosterCount / maxRoster) * 100) : 0;
  const eventDate = guildLeague.matchDate || guildLeague.date;

  const targetUrl = isAdmin
    ? `/admin/guild-leagues/${guildLeague.id}`
    : `/roster/${guildLeague.id}`;

  return (
    <Card className="overflow-hidden border-brand-200">
      <div className="border-b border-brand-100 bg-brand-50/70 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          <Swords className="size-4" />
          <span>Next Guild Event</span>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                {guildLeague.name}
              </h2>
              {guildLeague.status && (
                <Badge variant="brand" size="xs">
                  {guildLeague.status.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-zinc-400" />
                <span>{formatDate(eventDate)}</span>
              </div>
              {guildLeague.opponent && (
                <div className="font-bold text-zinc-800">
                  Opponent: {guildLeague.opponent}
                </div>
              )}
            </div>

            {guildLeague.notes && (
              <p className="mt-3.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-600">
                {guildLeague.notes}
              </p>
            )}
          </div>

          <Link
            href={targetUrl}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white transition hover:bg-brand-700 shadow-xs active:scale-95"
          >
            <span>{isAdmin ? "Manage Lineup" : "View Roster"}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between gap-4 text-xs font-semibold">
            <span className="text-zinc-500">Roster Progress</span>
            <span className="font-mono text-zinc-900">
              {rosterCount} / {maxRoster} Players ({Math.round(percentage)}%)
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
