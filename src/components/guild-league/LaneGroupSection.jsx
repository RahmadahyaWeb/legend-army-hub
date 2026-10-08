"use client";

import { formatNumber } from "@/utils/formatters";
import TeamCard from "./TeamCard";

/**
 * Lane Group Section with Retro Pixel Styling
 *
 * Why this exists:
 * Groups teams stationed in a battlefield lane (Top, Mid, Bot, or Reserve/Unassigned)
 * and displays aggregated statistics (formation player count vs capacity, average GS).
 * Adopts the Ragnarok Online battlefield zone header styling with crisp 2px borders.
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
 * @returns {JSX.Element} Rendered lane group section
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
    <section id={`lane-${id}`} className="space-y-3 sm:space-y-4 animate-in fade-in duration-100">
      {/* LANE HEADER */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-3 sm:p-4 pixel-shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 comic-shadow-sm">
              <Icon className="size-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black font-sans text-zinc-950 uppercase tracking-wide">
              {name}
            </h2>
          </div>
          <span className="border border-zinc-900 bg-zinc-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold text-zinc-800">
            {teamNumbers.length} {teamNumbers.length === 1 ? "Formation" : "Formations"}
          </span>
        </div>

        {/* FORMATION STATS */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] sm:text-xs">
          <div className="border border-zinc-900 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-700 font-bold">
            <span>Deployed: </span>
            <strong className="text-zinc-950 font-mono">
              {stat.assignedCount || 0} / {stat.capacity || 0}
            </strong>
          </div>

          {stat.avgGS > 0 && (
            <div className="border border-zinc-900 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-700 font-bold">
              <span>Avg GS: </span>
              <strong className="text-brand-700 font-mono">
                {formatNumber(stat.avgGS)}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* TEAMS GRID */}
      {teamNumbers.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-400 bg-white p-6 sm:p-8 text-center text-xs text-zinc-500 font-mono">
          No formations positioned on {name}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
