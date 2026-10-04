"use client";

import { formatNumber } from "@/utils/formatters";
import TeamCard from "./TeamCard";

/**
 * Lane Group Section
 *
 * Why this exists:
 * Groups teams stationed in a battlefield lane (Top, Mid, Bot, or Reserve/Unassigned)
 * and displays aggregated statistics (formation player count vs capacity, average GS).
 *
 * @param {Object} props - LaneGroupSection props
 * @param {string} props.id - Lane ID ('top', 'mid', 'bot', 'unassigned')
 * @param {string} props.name - Display name (e.g. 'Top Lane')
 * @param {React.ComponentType} props.icon - Lane icon
 * @param {Array<number>} props.teamNumbers - Array of team numbers in this lane
 * @param {Array<Object>} props.teams - Full teams array
 * @param {Array<Object>} props.roster - Full roster array
 * @param {Object} props.stat - Aggregated lane stats ({ assignedCount, capacity, avgGS })
 * @param {number} [props.membersPerTeam=10]
 * @param {boolean} [props.readOnly=false]
 * @param {(teamNumber: number, newLane: string) => void} [props.onLaneChange]
 * @param {(slot: { teamNumber: number, slotNumber: number }) => void} [props.onAssignSlot]
 * @param {(member: Object) => void} [props.onSelectMember]
 * @param {(member: Object) => void} [props.onRemoveMember]
 */
export default function LaneGroupSection({
  id,
  name,
  icon: Icon,
  teamNumbers = [],
  teams = [],
  roster = [],
  stat = { assignedCount: 0, capacity: 0, avgGS: 0 },
  membersPerTeam = 10,
  readOnly = false,
  onLaneChange,
  onAssignSlot,
  onSelectMember,
  onRemoveMember,
}) {
  return (
    <section id={`lane-${id}`} className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      {/* LANE HEADER */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800">
              <Icon className="size-4" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-900">
              {name}
            </h2>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-zinc-600">
            {teamNumbers.length} {teamNumbers.length === 1 ? "Team" : "Teams"}
          </span>
        </div>

        {/* FORMATION STATS */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] sm:text-xs">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
            <span>Formation: </span>
            <strong className="text-zinc-900 font-semibold">
              {stat.assignedCount || 0} / {stat.capacity || 0}
            </strong>
          </div>

          {stat.avgGS > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
              <span>Avg GS: </span>
              <strong className="text-zinc-900 font-semibold font-mono">
                {formatNumber(stat.avgGS)}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* TEAMS GRID */}
      {teamNumbers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 sm:p-8 text-center text-xs text-zinc-500">
          No teams currently positioned on {name}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teamNumbers.map((teamNumber) => {
            const team = teams.find((t) => Number(t.teamNumber) === teamNumber);
            const teamMembers = roster
              .filter((r) => Number(r.teamNumber) === teamNumber)
              .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

            return (
              <TeamCard
                key={teamNumber}
                teamNumber={teamNumber}
                team={team}
                teamMembers={teamMembers}
                membersPerTeam={membersPerTeam}
                readOnly={readOnly}
                onLaneChange={onLaneChange}
                onAssignSlot={onAssignSlot}
                onSelectMember={onSelectMember}
                onRemoveMember={onRemoveMember}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
