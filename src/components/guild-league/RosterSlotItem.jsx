"use client";

import { ArrowRightLeft, Trash2, UserPlus } from "lucide-react";
import { ClassBadge } from "@/utils/classColors";
import { formatNumber } from "@/utils/formatters";

/**
 * RosterSlotItem
 *
 * Why this exists:
 * Handles single roster slot display (either empty or assigned member),
 * supporting both Interactive Admin mode (swap, remove, quick assign)
 * and Read-Only Public mode.
 *
 * @param {Object} props - Component props
 * @param {number} props.slotNumber - 1-indexed slot number (1..10)
 * @param {Object|null} [props.member] - Assigned roster member if present
 * @param {boolean} [props.readOnly=false] - When true, disables interactive mutations
 * @param {(slot: { teamNumber: number, slotNumber: number }) => void} [props.onAssign]
 * @param {(member: Object) => void} [props.onSelect]
 * @param {(member: Object) => void} [props.onRemove]
 * @param {number} props.teamNumber - Parent team number
 */
export default function RosterSlotItem({
  slotNumber,
  member = null,
  occupant = null,
  readOnly = false,
  onAssign,
  onSelect,
  onManage,
  onRemove,
  teamNumber,
}) {
  const activeMember = member || occupant;
  const handleSelect = onSelect || onManage;

  // 1. EMPTY SLOT
  if (!activeMember) {
    if (readOnly) {
      return (
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 text-xs bg-zinc-50/20">
          <div className="flex items-center gap-2">
            <span className="w-5 text-zinc-300 font-mono text-[11px] font-medium">
              #{slotNumber}
            </span>
            <span className="text-[11px] italic text-zinc-400 font-normal">
              Open Slot
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => onAssign?.({ teamNumber, slotNumber })}
        className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-4 py-1.5 text-xs hover:bg-zinc-50 transition select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-5 text-zinc-300 font-mono text-[11px] font-medium group-hover:text-zinc-500 transition">
            #{slotNumber}
          </span>
          <span className="text-[11px] italic text-zinc-400 group-hover:text-zinc-600 transition font-normal">
            Empty Slot
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssign?.({ teamNumber, slotNumber });
          }}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 group-hover:border-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition"
        >
          <UserPlus className="size-3" />
          <span>Assign</span>
        </button>
      </div>
    );
  }

  // 2. OCCUPIED SLOT
  return (
    <div
      onClick={() => {
        if (!readOnly && handleSelect) handleSelect(activeMember);
      }}
      className={`group flex items-center justify-between px-3.5 sm:px-4 py-1.5 text-xs transition select-none ${
        readOnly ? "hover:bg-zinc-50/40" : "cursor-pointer hover:bg-zinc-50/80"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-5 font-medium font-mono text-[11px] text-zinc-400 group-hover:text-zinc-700 transition">
          #{slotNumber}
        </span>
        <div className="min-w-0 pr-1.5">
          <div className="truncate font-semibold text-zinc-900 text-xs sm:text-[13px] transition">
            {activeMember.nickname}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ClassBadge className={activeMember.className} size="xs" />
            {Number(activeMember.level) > 0 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                Lv. {activeMember.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-right">
        {Number(activeMember.gearScore) > 0 && (
          <span className="font-semibold text-zinc-900 font-mono text-[11px] sm:text-xs">
            {formatNumber(activeMember.gearScore)} GS
          </span>
        )}

        {/* QUICK ACTION BUTTONS (ADMIN ONLY) */}
        {!readOnly && (
          <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
            <button
              type="button"
              title="Relocate / Swap slot"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect?.(activeMember);
              }}
              className="flex size-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
            >
              <ArrowRightLeft className="size-3" />
            </button>
            <button
              type="button"
              title="Remove from roster"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(activeMember);
              }}
              className="flex size-6 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
