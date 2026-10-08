"use client";

import { ArrowRightLeft, Trash2, UserPlus } from "lucide-react";
import { ClassBadge } from "@/utils/classColors";
import { formatNumber } from "@/utils/formatters";

/**
 * RosterSlotItem with Retro Pixel Styling
 *
 * Why this exists:
 * Handles single roster slot display (either empty or assigned member),
 * supporting both Interactive Admin mode (swap, remove, quick assign)
 * and Read-Only Public mode.
 * Adopts the classic Ragnarok Online party roster row aesthetic: clear slot indexing (#1..#10),
 * crisp player nickname contrast, color-coded class badge, and mono Gear Score values.
 *
 * @param {Object} props - Component props
 * @param {number} props.slotNumber - 1-indexed slot number (1..10)
 * @param {Object|null} [props.member] - Assigned roster member if present
 * @param {boolean} [props.readOnly=false] - When true, disables interactive mutations
 * @param {(slot: { teamNumber: number, slotNumber: number }) => void} [props.onAssign]
 * @param {(member: Object) => void} [props.onSelect]
 * @param {(member: Object) => void} [props.onRemove]
 * @param {number} props.teamNumber - Parent team number
 * @returns {JSX.Element} Rendered slot row
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
        <div className="flex items-center justify-between px-3 py-1.5 text-xs bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="w-5 text-zinc-400 font-mono text-[11px] font-bold">
              #{slotNumber}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono italic">
              [Empty Slot]
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => onAssign?.({ teamNumber, slotNumber })}
        className="group flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs hover:bg-zinc-50 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-5 text-zinc-400 font-mono text-[11px] font-bold group-hover:text-zinc-900 transition-colors">
            #{slotNumber}
          </span>
          <span className="text-[11px] text-zinc-400 group-hover:text-zinc-700 transition-colors font-mono italic">
            [Open Slot]
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssign?.({ teamNumber, slotNumber });
          }}
          className="inline-flex items-center gap-1 border border-dashed border-zinc-400 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-700 group-hover:border-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors"
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
      className={`group flex items-center justify-between px-3 py-1.5 text-xs transition-colors select-none ${
        readOnly ? "hover:bg-zinc-50" : "cursor-pointer hover:bg-zinc-100/70"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-5 font-bold font-mono text-[11px] text-zinc-500 group-hover:text-zinc-950 transition-colors">
          #{slotNumber}
        </span>
        <div className="min-w-0 pr-1.5">
          <div className="truncate font-bold text-zinc-950 text-xs sm:text-[13px] leading-tight">
            {activeMember.nickname}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ClassBadge className={activeMember.className} size="xs" />
            {Number(activeMember.level) > 0 && (
              <span className="text-[10px] font-mono text-zinc-600 font-bold">
                Lv. {activeMember.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-right">
        {Number(activeMember.gearScore) > 0 && (
          <span className="font-bold text-brand-700 font-mono text-[11px] sm:text-xs">
            {formatNumber(activeMember.gearScore)} GS
          </span>
        )}

        {/* QUICK ACTION BUTTONS (ADMIN ONLY) */}
        {!readOnly && (
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              title="Relocate / Swap slot"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect?.(activeMember);
              }}
              className="flex size-6 items-center justify-center border border-zinc-400 bg-white text-zinc-700 hover:border-zinc-900 hover:bg-zinc-100 transition-colors"
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
              className="flex size-6 items-center justify-center border border-zinc-400 bg-white text-zinc-700 hover:border-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
