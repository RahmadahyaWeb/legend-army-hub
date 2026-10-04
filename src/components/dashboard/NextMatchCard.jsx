"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";

/**
 * Next Match Highlight Card
 *
 * Why this exists:
 * Spotlights the imminent Guild Event with date, opponent/target, and lineup capacity progress.
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.guildLeague - Next match details
 * @param {boolean} [props.isAdmin=false] - When true, directs to admin roster manager
 */
export default function NextMatchCard({ guildLeague = null, isAdmin = false }) {
  if (!guildLeague) {
    return (
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          No Upcoming Events
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          There are currently no upcoming events scheduled.
        </p>
      </Card>
    );
  }

  const isWoe = guildLeague.eventType === "woe";
  const isPolarity = guildLeague.eventType === "polarity";
  const maxTeams = Number(guildLeague.maxTeams) || 2;
  const membersPerTeam = Number(guildLeague.membersPerTeam) || 10;
  const maxRoster = Number(guildLeague.maxRoster) || maxTeams * membersPerTeam;
  const rosterCount = Number(guildLeague.assignedPlayers || guildLeague.rosterCount) || 0;
  const percentage = maxRoster > 0 ? Math.min(100, Math.round((rosterCount / maxRoster) * 100)) : 0;
  const eventDate = guildLeague.matchDate || guildLeague.date;

  const targetUrl = isAdmin
    ? `/admin/guild-leagues/${guildLeague.id}`
    : `/roster/${guildLeague.id}`;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Next Event
            </span>
            {isWoe ? (
              <Badge variant="warning" size="xs">WOE</Badge>
            ) : isPolarity ? (
              <Badge variant="info" size="xs">Polarity</Badge>
            ) : (
              <Badge variant="neutral" size="xs">Guild League</Badge>
            )}
            {guildLeague.status && (
              <Badge
                variant={
                  guildLeague.status === "published"
                    ? "success"
                    : guildLeague.status === "completed"
                    ? "neutral"
                    : "brand"
                }
                size="xs"
              >
                {guildLeague.status.toUpperCase()}
              </Badge>
            )}
          </div>

          <h2 className="mt-2 text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            {guildLeague.name}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{formatDate(eventDate)}</span>
            {guildLeague.opponent && (
              <span>
                {isWoe ? "Target: " : "Opponent: "}
                <strong className="text-zinc-800 font-medium">{guildLeague.opponent}</strong>
              </span>
            )}
          </div>

          {guildLeague.notes && (
            <p className="mt-2 text-xs text-zinc-600 max-w-xl">
              {guildLeague.notes}
            </p>
          )}
        </div>

        <Link
          href={targetUrl}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          {isAdmin ? "Manage Lineup" : "View Roster"}
        </Link>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-100">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>Roster Lineup</span>
          <span className="font-medium text-zinc-800">
            {rosterCount} / {maxRoster} Players ({percentage}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full bg-zinc-800 rounded-full transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
