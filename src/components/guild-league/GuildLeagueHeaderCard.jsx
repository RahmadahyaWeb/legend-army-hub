"use client";

import { formatDate, formatNumber } from "@/utils/formatters";
import Badge from "@/components/ui/Badge";

/**
 * Guild Event Header & Summary Card
 *
 * Why this exists:
 * Presents core match information, opponent status, countdown/date,
 * and key formation metrics (deployed roster %, average gear score, active teams)
 * uniformly in both admin and public roster views.
 *
 * @param {Object} props - Component props
 * @param {Object} props.guildLeague - Guild League match data
 * @param {number} props.totalAssigned - Number of currently deployed players
 * @param {number} props.maxRoster - Maximum allowed roster slots
 * @param {number} props.averageGearScore - Computed average gear score
 * @param {number} props.maxTeams - Number of teams
 * @param {React.ReactNode} [props.actions] - Optional actions (e.g. tabs or filter bar)
 */
export default function GuildLeagueHeaderCard({
  guildLeague,
  totalAssigned = 0,
  maxRoster = 0,
  averageGearScore = 0,
  maxTeams = 2,
  actions = null,
}) {
  if (!guildLeague) return null;

  const matchDate = guildLeague.matchDate || guildLeague.date;
  const deploymentPercentage =
    maxRoster > 0 ? Math.round((totalAssigned / maxRoster) * 100) : 0;
  const isWoe = guildLeague.eventType === "woe";
  const isPolarity = guildLeague.eventType === "polarity";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <span>Event Lineup</span>
            {isWoe ? (
              <Badge variant="warning" size="xs">
                WOE
              </Badge>
            ) : isPolarity ? (
              <Badge variant="info" size="xs">
                Polarity (10 Teams)
              </Badge>
            ) : (
              <Badge variant="neutral" size="xs">
                Guild League (3 Lanes)
              </Badge>
            )}
          </div>

          <h1 className="mt-1.5 text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {guildLeague.name}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{formatDate(matchDate)}</span>
            {guildLeague.opponent && (
              <span>
                {isWoe ? "Target: " : "Opponent: "}
                <strong className="text-zinc-800 font-medium">{guildLeague.opponent}</strong>
              </span>
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
        </div>

        {/* METRICS ROW */}
        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 lg:border-t-0 lg:pt-0">
          <div className="min-w-24">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase">
              Roster
            </span>
            <span className="text-base font-bold text-zinc-900 font-mono">
              {totalAssigned} / {maxRoster}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              {deploymentPercentage}% filled
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-200 hidden sm:block" />

          <div className="min-w-24">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase">
              Average GS
            </span>
            <span className="text-base font-bold text-zinc-900 font-mono">
              {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              Active combatants
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-200 hidden sm:block" />

          <div className="min-w-20">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase">
              Teams
            </span>
            <span className="text-base font-bold text-zinc-900 font-mono">
              {maxTeams}
            </span>
            <span className="text-[11px] text-zinc-500 block">
              {isPolarity ? "Parties" : "Formations"}
            </span>
          </div>
        </div>
      </div>

      {actions && (
        <div className="mt-5 pt-4 border-t border-zinc-100">{actions}</div>
      )}
    </div>
  );
}
