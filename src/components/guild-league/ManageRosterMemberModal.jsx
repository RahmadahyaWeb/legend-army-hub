"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, Trash2, X } from "lucide-react";
import { assignRosterMember, removeRosterMember } from "@/lib/api";

export default function ManageRosterMemberModal({
  open,
  guildLeagueId,
  member,
  maxTeams = 2,
  membersPerTeam = 10,
  rosterMembers = [],
  onClose,
  onSuccess,
  onMove,
  onRemove,
}) {
  const [targetTeam, setTargetTeam] = useState(member?.teamNumber || 1);
  const [targetSlot, setTargetSlot] = useState(member?.slotNumber || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open || !member) return null;

  const handleMove = async () => {
    if (
      Number(targetTeam) === Number(member.teamNumber) &&
      Number(targetSlot) === Number(member.slotNumber)
    ) {
      onClose();
      return;
    }

    if (onMove) {
      // Instant optimistic execution
      onMove(member, Number(targetTeam), Number(targetSlot));
      return;
    }

    setSaving(true);
    setError("");

    try {
      // First remove from old slot
      await removeRosterMember(guildLeagueId, member.teamNumber, member.slotNumber);

      // Assign to new slot
      await assignRosterMember(guildLeagueId, {
        memberId: member.memberId || member.id,
        nickname: member.nickname,
        className: member.className,
        level: member.level,
        gearScore: member.gearScore,
        teamNumber: Number(targetTeam),
        slotNumber: Number(targetSlot),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Move error:", err);
      setError(err.message || "Failed to move member.");
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      // Instant optimistic execution
      onRemove(member);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await removeRosterMember(guildLeagueId, member.teamNumber, member.slotNumber);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Remove error:", err);
      setError(err.message || "Failed to remove member.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/50">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Manage {member.nickname}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Current: Team {member.teamNumber} • Slot #{member.slotNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-700">
              Reassign to Team & Slot
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-500">Team</span>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs focus:border-red-600 focus:outline-none"
                >
                  {Array.from({ length: maxTeams }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Team {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-zinc-500">Slot</span>
                <select
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs focus:border-red-600 focus:outline-none"
                >
                  {Array.from({ length: membersPerTeam }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Slot #{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 active:scale-95 transition disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            <span>Remove</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleMove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="size-3.5" />
              )}
              <span>{saving ? "Saving..." : "Move Slot"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
