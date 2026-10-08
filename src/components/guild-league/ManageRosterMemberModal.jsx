"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { assignRosterMember, removeRosterMember } from "@/lib/api";
import { ClassBadge } from "@/utils/classColors";
import Button from "@/components/ui/Button";

/**
 * ManageRosterMemberModal with Retro Pixel Styling
 *
 * Why this exists:
 * Allows guild officers to relocate a player to a new team/slot or perform
 * a mutual swap with another occupant, or cleanly remove the player from the lineup.
 * Styled after classic Ragnarok Online slot management windows.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal visibility
 * @param {string} props.guildLeagueId - Guild league ID
 * @param {Object} props.member - Selected member to manage
 * @param {number} [props.maxTeams=2]
 * @param {number} [props.membersPerTeam=10]
 * @param {Array<Object>} [props.rosterMembers=[]]
 * @param {() => void} props.onClose
 * @param {() => void} [props.onSuccess]
 * @param {(member: Object, targetTeam: number, targetSlot: number) => void} [props.onMove]
 * @param {(member: Object) => void} [props.onRemove]
 * @returns {JSX.Element|null}
 */
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
  const [targetTeam, setTargetTeam] = useState(1);
  const [targetSlot, setTargetSlot] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Synchronize target inputs when selected member changes or modal opens
  useEffect(() => {
    if (member) {
      setTargetTeam(Number(member.teamNumber) || 1);
      setTargetSlot(Number(member.slotNumber) || 1);
      setError("");
    }
  }, [member, open]);

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
        // Swap positions between current member and target slot occupant
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
        // Relocate to empty target slot
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-100 font-sans">
      <div className="w-full max-w-lg overflow-hidden border-2 border-zinc-950 bg-white pixel-shadow-lg">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-zinc-950 px-5 py-3.5 bg-zinc-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-950 text-xs font-mono font-bold text-white comic-shadow-sm">
              T{member.teamNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-sans text-zinc-950">
                  {member.nickname}
                </h3>
                <span className="border border-zinc-900 bg-white px-1.5 py-0.2 text-[10px] font-mono font-bold text-zinc-800">
                  Slot #{member.slotNumber}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <ClassBadge className={member.className} size="xs" />
                {Number(member.level) > 0 && <span className="font-mono font-bold">Lv. {member.level}</span>}
                <span>•</span>
                <span className="font-bold text-brand-700 font-mono">
                  {Number(member.gearScore || 0).toLocaleString()} GS
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-red-50 hover:text-red-700 active:translate-x-[1px] active:translate-y-[1px] transition-colors"
          >
            <X className="size-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="border-2 border-red-700 bg-red-50 p-3 text-xs font-bold text-red-900">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold font-sans uppercase tracking-wider text-zinc-950">
              Relocate or Mutual Swap
            </label>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Select destination team and slot. If the slot is occupied, players will swap places.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-zinc-900 uppercase">Target Team</span>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(Number(e.target.value))}
                  className="mt-1 h-9 w-full border-2 border-zinc-950 bg-white px-2.5 text-xs font-bold text-zinc-900 focus:outline-none"
                >
                  {Array.from({ length: maxTeams }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Team {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-900 uppercase">Target Slot</span>
                <select
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(Number(e.target.value))}
                  className="mt-1 h-9 w-full border-2 border-zinc-950 bg-white px-2.5 text-xs font-bold text-zinc-900 focus:outline-none"
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
            <div className="border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-600 font-mono text-center">
              Currently stationed here (Team {member.teamNumber}, Slot #{member.slotNumber}).
            </div>
          ) : targetOccupant ? (
            <div className="border-2 border-amber-600 bg-amber-50/80 p-3 text-xs text-amber-950 space-y-2 comic-shadow-sm">
              <div className="flex items-center gap-1.5 font-bold font-sans text-amber-950 uppercase">
                <ArrowRightLeft className="size-4 text-amber-800" />
                <span>Mutual Swap with Occupant</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-zinc-900">
                <span>Occupant: <strong className="font-bold">{targetOccupant.nickname}</strong></span>
                <ClassBadge className={targetOccupant.className} size="xs" />
                <span className="font-bold text-brand-700 font-mono">
                  {Number(targetOccupant.gearScore || 0).toLocaleString()} GS
                </span>
              </div>
              <div className="border border-amber-400 bg-white p-2 text-[11px] text-amber-950 leading-relaxed font-medium">
                <strong>{member.nickname}</strong> ➔ Team {targetTeam} #{targetSlot}, while <strong>{targetOccupant.nickname}</strong> ➔ Team {member.teamNumber} #{member.slotNumber}.
              </div>
            </div>
          ) : (
            <div className="border-2 border-emerald-700 bg-emerald-50/90 p-3 text-xs text-emerald-950 flex items-center gap-2 pixel-shadow-sm">
              <Check className="size-4 text-emerald-700 shrink-0" />
              <span>
                Target slot is vacant. <strong>{member.nickname}</strong> will relocate to <strong>Team {targetTeam} (Slot #{targetSlot})</strong>.
              </span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t-2 border-zinc-950 bg-zinc-50 px-5 py-3.5">
          <Button
            variant="dangerOutline"
            size="sm"
            disabled={saving}
            icon={Trash2}
            onClick={handleRemove}
          >
            Remove from Roster
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={saving || isSameSlot}
              loading={saving}
              icon={ArrowRightLeft}
              onClick={handleMove}
            >
              {targetOccupant ? "Confirm Swap" : "Confirm Move"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
