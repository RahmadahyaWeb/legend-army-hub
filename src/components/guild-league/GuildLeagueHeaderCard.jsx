"use client";

import { CalendarDays, Swords } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";

/**
 * Guild League Header & Stats Hero Card
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-brand-600 uppercase tracking-widest">
            <Swords className="size-3.5 sm:size-4" />
            <span>Event Lineup & Roster</span>
          </div>

          <h1 className="mt-1 text-xl font-black text-zinc-900 sm:text-3xl lg:text-4xl tracking-tight">
            {guildLeague.name}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              <span>{formatDate(matchDate)}</span>
            </div>

            {guildLeague.opponent && (
              <div className="flex items-center gap-1 font-bold text-zinc-900">
                <span>Opponent: {guildLeague.opponent}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3-COLUMN METRICS GRID */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
              Total Roster
            </div>
            <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
              {totalAssigned}/{maxRoster}
            </div>
            <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
              {deploymentPercentage}% Deployed
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
              Average GS
            </div>
            <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate font-mono">
              {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
            </div>
            <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
              Guild Power
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
              Active Teams
            </div>
            <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
              {maxTeams} Teams
            </div>
            <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
              3 Lanes
            </div>
          </div>
        </div>
      </div>

      {guildLeague.notes && (
        <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-700 border border-zinc-200 leading-relaxed">
          <strong className="text-zinc-900">Tactical Strategy / Briefing: </strong>
          {guildLeague.notes}
        </div>
      )}

      {actions}
    </div>
  );
}
