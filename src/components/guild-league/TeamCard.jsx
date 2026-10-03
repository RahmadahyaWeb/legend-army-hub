"use client";

import { useMemo } from "react";
import { Shield } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getLaneConfig, LANE_SELECT_GROUPS } from "@/utils/guildLeague";
import RosterSlotItem from "./RosterSlotItem";

/**
 * Unified Team Card Component
 *
 * Why this exists:
 * Unifies the team card layout between public roster view and admin roster manager.
 * Supports lane assignment dropdown in admin mode, and static badge in read-only mode.
 *
 * @param {Object} props - TeamCard props
 * @param {number} props.teamNumber - 1-indexed team number
 * @param {Object} [props.team] - Team metadata (name, lane)
 * @param {Array<Object>} props.teamMembers - Members in this team
 * @param {number} [props.membersPerTeam=10] - Capacity per team
 * @param {boolean} [props.readOnly=false] - Whether in public view
 * @param {boolean} [props.isWoe=false] - Whether this is a War of Emperium event (no lanes)
 * @param {(teamNumber: number, newLane: string) => void} [props.onLaneChange]
 * @param {(slot: { teamNumber: number, slotNumber: number }) => void} [props.onAssignSlot]
 * @param {(member: Object) => void} [props.onSelectMember]
 * @param {(member: Object) => void} [props.onRemoveMember]
 */
export default function TeamCard({
  teamNumber,
  team = null,
  teamMembers = [],
  membersPerTeam = 10,
  readOnly = false,
  isWoe = false,
  onLaneChange,
  onAssignSlot,
  onSelectMember,
  onRemoveMember,
}) {
  const averageGearScore = useMemo(() => {
    if (teamMembers.length === 0) return 0;
    const total = teamMembers.reduce(
      (sum, m) => sum + (Number(m.gearScore) || 0),
      0
    );
    return Math.round(total / teamMembers.length);
  }, [teamMembers]);

  const fillPercent = Math.round(
    (teamMembers.length / (membersPerTeam || 1)) * 100
  );
  const laneConfig = getLaneConfig(team?.lane);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-200">
      {/* TEAM CARD HEADER - ROW 1 */}
      <div className="flex items-center justify-between gap-2.5 border-b border-zinc-100 bg-zinc-50/80 px-3.5 py-3 sm:px-4.5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white shadow-xs">
            T{teamNumber}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs sm:text-sm font-bold text-zinc-900">
              {team?.name || `Team ${teamNumber}`}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500 font-medium">
              <span className="text-zinc-700 font-semibold">
                {teamMembers.length}/{membersPerTeam} Players
              </span>
              <span>•</span>
              <span>{fillPercent}%</span>
            </div>
          </div>
        </div>

        {averageGearScore > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200/90 bg-white px-2 py-1 text-[11px] font-bold text-zinc-800 shadow-2xs font-mono">
            <Shield className="size-3 text-zinc-400" />
            <span>{formatNumber(averageGearScore)} GS</span>
          </div>
        )}
      </div>

      {/* LANE & ROLE SELECTOR - ROW 2 (Guild League only, hidden in WOE) */}
      {!isWoe && (
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/40 px-3.5 py-2 sm:px-4.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 shrink-0">
            Battle Role
          </span>

          {readOnly ? (
            laneConfig ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${laneConfig.badgeClassName}`}
              >
                {laneConfig.icon && <span>{laneConfig.icon}</span>}
                <span>{laneConfig.label || laneConfig.shortLabel}</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-zinc-400">
                Flexible / Unassigned
              </span>
            )
          ) : (
            <select
              value={team?.lane?.toLowerCase() || ""}
              onChange={(e) => onLaneChange?.(teamNumber, e.target.value)}
              className={`h-7.5 max-w-[210px] sm:max-w-[240px] truncate rounded-lg border px-2 text-[11px] font-semibold shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-400 transition ${
                laneConfig
                  ? laneConfig.badgeClassName
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              <option value="">Unassigned Lane</option>
              {LANE_SELECT_GROUPS.map((grp) => (
                <optgroup key={grp.group} label={grp.group}>
                  {grp.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>
      )}

      {/* PLAYER SLOTS */}
      <div className="flex-1 divide-y divide-zinc-100">
        {Array.from({ length: membersPerTeam }, (_, sIdx) => {
          const slotNumber = sIdx + 1;
          const member = teamMembers.find(
            (m) => Number(m.slotNumber) === slotNumber
          );

          return (
            <RosterSlotItem
              key={slotNumber}
              slotNumber={slotNumber}
              member={member}
              readOnly={readOnly}
              teamNumber={teamNumber}
              onAssign={onAssignSlot}
              onSelect={onSelectMember}
              onRemove={onRemoveMember}
            />
          );
        })}
      </div>
    </div>
  );
}
