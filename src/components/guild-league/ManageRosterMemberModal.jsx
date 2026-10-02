"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronRight,
  Loader2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { assignRosterMember, removeRosterMember } from "@/lib/api";
import { ClassBadge } from "@/utils/classColors";

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
  const [targetTeam, setTargetTeam] = useState(() => member?.teamNumber || 1);
  const [targetSlot, setTargetSlot] = useState(() => member?.slotNumber || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync when member changes
  useMemo(() => {
    if (member) {
      setTargetTeam(Number(member.teamNumber) || 1);
      setTargetSlot(Number(member.slotNumber) || 1);
    }
  }, [member]);

  const targetOccupant = useMemo(() => {
    if (!member) return null;
    return (
      rosterMembers.find(
        (r) =>
          Number(r.teamNumber) === Number(targetTeam) &&
          Number(r.slotNumber) === Number(targetSlot) &&
          String(r.memberId || r.id) !== String(member.memberId || member.id)
      ) || null
    );
  }, [rosterMembers, targetTeam, targetSlot, member]);

  if (!open || !member) return null;

  const isSameSlot =
    Number(targetTeam) === Number(member.teamNumber) &&
    Number(targetSlot) === Number(member.slotNumber);

  const handleMove = async () => {
    if (isSameSlot) {
      onClose();
      return;
    }

    if (onMove) {
      onMove(member, Number(targetTeam), Number(targetSlot));
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (targetOccupant) {
        // Swap positions
        await Promise.all([
          assignRosterMember(guildLeagueId, {
            memberId: member.memberId || member.id,
            nickname: member.nickname,
            className: member.className,
            level: member.level,
            gearScore: member.gearScore,
            teamNumber: Number(targetTeam),
            slotNumber: Number(targetSlot),
          }),
          assignRosterMember(guildLeagueId, {
            memberId: targetOccupant.memberId || targetOccupant.id,
            nickname: targetOccupant.nickname,
            className: targetOccupant.className,
            level: targetOccupant.level,
            gearScore: targetOccupant.gearScore,
            teamNumber: Number(member.teamNumber),
            slotNumber: Number(member.slotNumber),
          }),
        ]);
      } else {
        // Move to empty slot
        await removeRosterMember(guildLeagueId, member.teamNumber, member.slotNumber);
        await assignRosterMember(guildLeagueId, {
          memberId: member.memberId || member.id,
          nickname: member.nickname,
          className: member.className,
          level: member.level,
          gearScore: member.gearScore,
          teamNumber: Number(targetTeam),
          slotNumber: Number(targetSlot),
        });
      }

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
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-black text-white shadow-xs">
              T{member.teamNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  {member.nickname}
                </h3>
                <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-bold text-zinc-700">
                  Slot #{member.slotNumber}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <ClassBadge className={member.className} size="xs" />
                {Number(member.level) > 0 && <span>Lv. {member.level}</span>}
                <span>•</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {Number(member.gearScore || 0).toLocaleString()} GS
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Relocate or Swap Position
            </label>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Select destination team and slot. If the slot is occupied, players will swap places.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-zinc-700">Target Team</span>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-bold text-zinc-800 focus:border-red-600 focus:bg-white focus:outline-none"
                >
                  {Array.from({ length: maxTeams }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Team {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-semibold text-zinc-700">Target Slot</span>
                <select
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-bold text-zinc-800 focus:border-red-600 focus:bg-white focus:outline-none"
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

          {/* TARGET SLOT STATUS & SWAP PREVIEW */}
          {isSameSlot ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 text-center">
              Currently in this position (Team {member.teamNumber}, Slot #{member.slotNumber}).
            </div>
          ) : targetOccupant ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ArrowRightLeft className="size-4 text-amber-700" />
                <span>Mutual Swap with Occupant</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-zinc-800">
                <span>Occupied by: <strong className="text-zinc-900 font-bold">{targetOccupant.nickname}</strong></span>
                <ClassBadge className={targetOccupant.className} size="xs" />
                <span className="font-bold text-zinc-900 font-mono">
                  {Number(targetOccupant.gearScore || 0).toLocaleString()} GS
                </span>
              </div>
              <div className="rounded-lg bg-white/80 p-2.5 text-[11px] text-amber-950 border border-amber-200/70 leading-relaxed font-medium">
                🔄 <strong>{member.nickname}</strong> will move to Team {targetTeam} #{targetSlot}, and <strong>{targetOccupant.nickname}</strong> will move to Team {member.teamNumber} #{member.slotNumber}.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 flex items-center gap-2.5">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>
                Target slot is empty. <strong>{member.nickname}</strong> will be relocated to <strong>Team {targetTeam} (Slot #{targetSlot})</strong>.
              </span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 transition shadow-xs disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            <span>Remove from Roster</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || isSameSlot}
              onClick={handleMove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-500 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="size-3.5" />
              )}
              <span>
                {saving
                  ? "Saving..."
                  : targetOccupant
                  ? "Confirm Swap"
                  : "Confirm Move"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
