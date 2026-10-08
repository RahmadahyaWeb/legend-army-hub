"use client";

import { useMemo } from "react";
import { formatNumber } from "@/utils/formatters";
import { getLaneConfig, LANE_SELECT_GROUPS } from "@/utils/guildLeague";
import RosterSlotItem from "./RosterSlotItem";

/**
 * Unified Pixel Team Card Component
 *
 * Why this exists:
 * Unifies the team card layout between public roster view and admin roster manager.
 * Presents a Ragnarok Online-inspired party card: 2px solid outlines, retro party header,
 * slot occupancy counter, and average Gear Score badge.
 * Supports lane assignment dropdown in admin mode, and static badge in read-only mode.
 *
 * @param {Object} props - TeamCard props
 * @param {number} props.teamNumber - 1-indexed team number
 * @param {Object} [props.team] - Team metadata (name, lane)
 * @param {Array<Object>} props.teamMembers - Members in this team
 * @param {number} [props.membersPerTeam=10] - Capacity per team
 * @param {boolean} [props.readOnly=false] - Whether in public view
 * @param {boolean} [props.isWoe=false] - Whether this is a War of Emperium event (no lanes)
 * @param {boolean} [props.isPolarity=false] - Whether this is a Polarity event (10 squads, 5 players, no lanes)
 * @param {boolean} [props.hideLane=false] - Whether to hide lane selector
 * @param {(teamNumber: number, newLane: string) => void} [props.onLaneChange]
 * @param {(slot: { teamNumber: number, slotNumber: number }) => void} [props.onAssignSlot]
 * @param {(member: Object) => void} [props.onSelectMember]
 * @param {(member: Object) => void} [props.onRemoveMember]
 * @returns {JSX.Element} Rendered party card
 */
export default function TeamCard({
  teamNumber,
  team = null,
  teamMembers = [],
  membersPerTeam = 10,
  readOnly = false,
  isWoe = false,
  isPolarity = false,
  hideLane = false,
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

  const laneConfig = getLaneConfig(team?.lane);
  const shouldHideLane = isWoe || isPolarity || hideLane;

  const defaultTeamLabel = isPolarity
    ? `Party ${teamNumber}`
    : isWoe
    ? `Squad ${teamNumber}`
    : `Team ${teamNumber}`;

  const displayName = team?.name?.trim() || defaultTeamLabel;

  const slots = Array.from(
    { length: membersPerTeam || 10 },
    (_, i) => i + 1
  );

  return (
    <div className="flex flex-col border-2 border-zinc-950 bg-white pixel-shadow-sm transition-transform">
      {/* TEAM HEADER */}
      <div className="flex items-center justify-between gap-2.5 border-b-2 border-zinc-950 bg-zinc-100 px-3.5 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-xs font-bold font-pixel text-zinc-950">
            {displayName}
          </span>
          <span className="shrink-0 text-[11px] text-zinc-600 font-mono font-bold">
            ({teamMembers.length}/{membersPerTeam})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {averageGearScore > 0 && (
            <span className="text-[11px] font-mono font-bold text-brand-700">
              Avg {formatNumber(averageGearScore)}
            </span>
          )}

          {!shouldHideLane && (
            readOnly ? (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold border ${laneConfig.bg} ${laneConfig.color} ${laneConfig.border}`}
              >
                {laneConfig.label}
              </span>
            ) : (
              <select
                value={team?.lane || ""}
                onChange={(e) => onLaneChange?.(teamNumber, e.target.value)}
                className="h-6 border border-zinc-900 bg-white px-1 text-[11px] font-bold text-zinc-900 focus:outline-none"
              >
                <option value="">No Lane</option>
                {LANE_SELECT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )
          )}
        </div>
      </div>

      {/* ROSTER SLOTS */}
      <div className="divide-y divide-zinc-200 p-0.5 flex-1 bg-white">
        {slots.map((slotNum) => {
          const occupant = teamMembers.find(
            (m) => Number(m.slotNumber) === Number(slotNum)
          );

          return (
            <RosterSlotItem
              key={slotNum}
              slotNumber={slotNum}
              teamNumber={teamNumber}
              member={occupant}
              occupant={occupant}
              readOnly={readOnly}
              onAssign={(slot) => onAssignSlot?.(slot || { teamNumber, slotNumber: slotNum })}
              onSelect={() => onSelectMember?.(occupant)}
              onManage={() => onSelectMember?.(occupant)}
              onRemove={() => onRemoveMember?.(occupant)}
            />
          );
        })}
      </div>
    </div>
  );
}
