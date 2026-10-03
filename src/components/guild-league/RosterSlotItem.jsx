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
  readOnly = false,
  onAssign,
  onSelect,
  onRemove,
  teamNumber,
}) {
  // 1. EMPTY SLOT
  if (!member) {
    if (readOnly) {
      return (
        <div className="flex items-center justify-between px-3.5 sm:px-4.5 py-2.5 text-xs bg-zinc-50/20">
          <div className="flex items-center gap-2">
            <span className="w-5 text-zinc-300 font-mono text-[11px] font-bold">
              #{slotNumber}
            </span>
            <span className="text-[11px] italic text-zinc-400 font-medium">
              Open Slot
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => onAssign?.({ teamNumber, slotNumber })}
        className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-4.5 py-2 text-xs bg-zinc-50/20 hover:bg-red-50/30 transition select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-5 text-zinc-300 font-mono text-[11px] font-bold group-hover:text-zinc-500 transition">
            #{slotNumber}
          </span>
          <span className="text-[11px] italic text-zinc-400 group-hover:text-zinc-600 transition font-medium">
            Empty Slot
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssign?.({ teamNumber, slotNumber });
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-bold text-zinc-600 shadow-2xs group-hover:border-brand-300 group-hover:bg-brand-600 group-hover:text-white transition"
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
        if (!readOnly && onSelect) onSelect(member);
      }}
      className={`group flex items-center justify-between px-3.5 sm:px-4.5 py-2 text-xs transition select-none ${
        readOnly ? "hover:bg-zinc-50/50" : "cursor-pointer hover:bg-zinc-50/90"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-5 font-bold font-mono text-[11px] text-zinc-400 group-hover:text-zinc-700 transition">
          #{slotNumber}
        </span>
        <div className="min-w-0 pr-1.5">
          <div className="truncate font-bold text-zinc-900 text-xs sm:text-[13px] group-hover:text-brand-700 transition">
            {member.nickname}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ClassBadge className={member.className} size="xs" />
            {Number(member.level) > 0 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                Lv. {member.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-right">
        {Number(member.gearScore) > 0 && (
          <span className="font-bold text-zinc-900 font-mono text-[11px] sm:text-xs">
            {formatNumber(member.gearScore)} GS
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
                onSelect?.(member);
              }}
              className="flex size-6.5 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 transition"
            >
              <ArrowRightLeft className="size-3" />
            </button>
            <button
              type="button"
              title="Remove from roster"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(member);
              }}
              className="flex size-6.5 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
