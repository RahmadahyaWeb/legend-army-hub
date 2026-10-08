"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate } from "@/utils/formatters";

/**
 * Next Match Highlight Card with Retro Pixel Styling
 *
 * Why this exists:
 * Spotlights the imminent Guild Event with date, opponent/target, and lineup capacity progress.
 * Adopts the Ragnarok Online quest/event banner feel: sharp borders, retro HP-bar style roster meter,
 * and prominent action trigger.
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.guildLeague - Next match details
 * @param {boolean} [props.isAdmin=false] - When true, directs to admin roster manager
 * @returns {JSX.Element} Rendered next match banner card
 */
export default function NextMatchCard({ guildLeague = null, isAdmin = false }) {
  if (!guildLeague) {
    return (
      <Card className="p-5 sm:p-6 bg-white">
        <h2 className="text-sm font-bold font-pixel uppercase tracking-wide text-zinc-950">
          No Upcoming Events Scheduled
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          There are currently no active matches or guild wars planned.
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
    <Card className="p-4.5 sm:p-6 bg-white pixel-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs font-bold text-zinc-500 uppercase tracking-wide">
              Imminent War
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

          <h2 className="mt-2 text-lg sm:text-2xl font-bold font-pixel text-zinc-950 tracking-tight">
            {guildLeague.name}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            <span className="font-mono">{formatDate(eventDate)}</span>
            {guildLeague.opponent && (
              <span>
                {isWoe ? "Target Castle: " : "Opponent Guild: "}
                <strong className="text-zinc-950 font-bold">{guildLeague.opponent}</strong>
              </span>
            )}
          </div>

          {guildLeague.notes && (
            <p className="mt-2 text-xs text-zinc-600 max-w-xl leading-relaxed">
              {guildLeague.notes}
            </p>
          )}
        </div>

        <Link href={targetUrl} className="shrink-0">
          <Button variant="primary" size="md">
            {isAdmin ? "Manage Lineup" : "View Roster"}
          </Button>
        </Link>
      </div>

      {/* RETRO RPG METER (HP / ROSTER BAR) */}
      <div className="mt-5 pt-4 border-t-2 border-zinc-950">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-900 mb-1.5 uppercase">
          <span>Roster Deployment</span>
          <span className="font-mono">
            {rosterCount} / {maxRoster} Combatants ({percentage}%)
          </span>
        </div>
        <div className="h-3 w-full border-2 border-zinc-950 bg-zinc-100 p-0.5">
          <div
            className="h-full bg-brand-600 pixel-bar-pattern transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
