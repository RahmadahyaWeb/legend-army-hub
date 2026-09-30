import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, MoveRight, X } from "lucide-react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function getMemberId(member) {
  if (!member) {
    return null;
  }

  return String(member.memberId || member.id);
}

export default function ManageRosterMemberModal({
  open,
  guildLeagueId,
  member,
  rosterMembers = [],
  maxTeams = 12,
  membersPerTeam = 5,
  onClose,
}) {
  const toast = useToast();

  const [targetTeam, setTargetTeam] = useState(1);
  const [targetSlot, setTargetSlot] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !member) {
      return;
    }

    setTargetTeam(Number(member.teamNumber));
    setTargetSlot(Number(member.slotNumber));
    setSaving(false);
    setError("");
  }, [open, member]);

  const currentMemberId = useMemo(() => getMemberId(member), [member]);

  const targetMember = useMemo(() => {
    if (!member) {
      return null;
    }

    return (
      rosterMembers.find((rosterMember) => {
        const rosterMemberId = getMemberId(rosterMember);

        return (
          rosterMemberId !== currentMemberId &&
          Number(rosterMember.teamNumber) === Number(targetTeam) &&
          Number(rosterMember.slotNumber) === Number(targetSlot)
        );
      }) ?? null
    );
  }, [member, rosterMembers, targetTeam, targetSlot, currentMemberId]);

  const isCurrentSlot =
    member &&
    Number(member.teamNumber) === Number(targetTeam) &&
    Number(member.slotNumber) === Number(targetSlot);

  if (!open || !member) {
    return null;
  }

  const handleClose = () => {
    if (saving) {
      return;
    }

    onClose();
  };

  const handleMove = async () => {
    if (saving || !guildLeagueId || !currentMemberId || isCurrentSlot) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const sourceTeam = Number(member.teamNumber);
      const sourceSlot = Number(member.slotNumber);

      const destinationTeam = Number(targetTeam);
      const destinationSlot = Number(targetSlot);

      const sourceSlotId =
        member.slotId || `team-${sourceTeam}-slot-${sourceSlot}`;

      const destinationSlotId = `team-${destinationTeam}-slot-${destinationSlot}`;

      const sourceRosterReference = doc(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster",
        currentMemberId,
      );

      const sourceSlotReference = doc(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster_slots",
        sourceSlotId,
      );

      const destinationSlotReference = doc(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster_slots",
        destinationSlotId,
      );

      await runTransaction(db, async (transaction) => {
        // FIRESTORE TRANSACTION:
        // lakukan seluruh READ sebelum WRITE.

        const sourceRosterSnapshot = await transaction.get(
          sourceRosterReference,
        );

        const sourceSlotSnapshot = await transaction.get(sourceSlotReference);

        const destinationSlotSnapshot = await transaction.get(
          destinationSlotReference,
        );

        if (!sourceRosterSnapshot.exists()) {
          throw new Error("The selected player is no longer in the roster.");
        }

        const currentSourceData = sourceRosterSnapshot.data();

        const storedSourceMemberId = String(
          currentSourceData.memberId || sourceRosterSnapshot.id,
        );

        if (storedSourceMemberId !== String(currentMemberId)) {
          throw new Error("The current roster data is inconsistent.");
        }

        // ============================
        // DESTINATION SLOT KOSONG
        // ============================

        if (!destinationSlotSnapshot.exists()) {
          transaction.update(sourceRosterReference, {
            memberId: currentMemberId,
            teamNumber: destinationTeam,
            slotNumber: destinationSlot,
            slotId: destinationSlotId,
            updatedAt: serverTimestamp(),
          });

          if (sourceSlotSnapshot.exists()) {
            transaction.delete(sourceSlotReference);
          }

          transaction.set(destinationSlotReference, {
            slotId: destinationSlotId,
            memberId: currentMemberId,
            rosterId: currentMemberId,
            nickname: currentSourceData.nickname ?? member.nickname ?? "",
            teamNumber: destinationTeam,
            slotNumber: destinationSlot,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          return;
        }

        // ============================
        // DESTINATION SLOT TERISI
        // SWAP
        // ============================

        const destinationSlotData = destinationSlotSnapshot.data();

        const destinationMemberIdRaw =
          destinationSlotData.memberId || destinationSlotData.rosterId;

        if (!destinationMemberIdRaw) {
          throw new Error("The destination slot contains invalid roster data.");
        }

        const destinationMemberId = String(destinationMemberIdRaw);

        if (destinationMemberId === currentMemberId) {
          throw new Error("The player is already assigned to this slot.");
        }

        const destinationRosterReference = doc(
          db,
          "guild_leagues",
          guildLeagueId,
          "roster",
          destinationMemberId,
        );

        const destinationRosterSnapshot = await transaction.get(
          destinationRosterReference,
        );

        if (!destinationRosterSnapshot.exists()) {
          throw new Error("The destination player could not be found.");
        }

        const destinationRosterData = destinationRosterSnapshot.data();

        transaction.update(sourceRosterReference, {
          memberId: currentMemberId,
          teamNumber: destinationTeam,
          slotNumber: destinationSlot,
          slotId: destinationSlotId,
          updatedAt: serverTimestamp(),
        });

        transaction.update(destinationRosterReference, {
          memberId: destinationMemberId,
          teamNumber: sourceTeam,
          slotNumber: sourceSlot,
          slotId: sourceSlotId,
          updatedAt: serverTimestamp(),
        });

        transaction.set(sourceSlotReference, {
          slotId: sourceSlotId,
          memberId: destinationMemberId,
          rosterId: destinationMemberId,
          nickname:
            destinationRosterData.nickname ??
            destinationSlotData.nickname ??
            "",
          teamNumber: sourceTeam,
          slotNumber: sourceSlot,
          createdAt: sourceSlotSnapshot.exists()
            ? (sourceSlotSnapshot.data().createdAt ?? serverTimestamp())
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(destinationSlotReference, {
          slotId: destinationSlotId,
          memberId: currentMemberId,
          rosterId: currentMemberId,
          nickname: currentSourceData.nickname ?? member.nickname ?? "",
          teamNumber: destinationTeam,
          slotNumber: destinationSlot,
          createdAt: destinationSlotData.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const message = targetMember
        ? `${member.nickname} and ${targetMember.nickname} have swapped positions.`
        : `${member.nickname} has been moved to Team ${targetTeam}, Slot ${targetSlot}.`;

      onClose();

      toast.success(targetMember ? "Players swapped" : "Player moved", message);
    } catch (moveError) {
      console.error("Failed to move roster member:", moveError);

      const message = moveError?.message || "Failed to move player.";

      setError(message);

      toast.error("Move failed", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="w-full overflow-hidden bg-white shadow-xl sm:max-w-md sm:rounded-xl">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-content-strong">
              Move player
            </h2>

            <p className="mt-0.5 text-sm text-content-muted">
              Change the player's team or slot.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-line bg-surface-100 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-content-strong">
                  {member.nickname}
                </div>

                <div className="mt-1 text-xs text-content-muted">
                  {member.className || "Unknown class"}
                  {" · "}
                  Lv. {member.level || "—"}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold tabular-nums text-content-strong">
                  {formatNumber(member.gearScore)}
                </div>

                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                  Gear Score
                </div>
              </div>
            </div>

            <div className="mt-3 border-t border-line pt-3 text-xs text-content-muted">
              Current position: Team {member.teamNumber} · Slot{" "}
              {member.slotNumber}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content">
                Destination team
              </label>

              <select
                value={targetTeam}
                onChange={(event) => setTargetTeam(Number(event.target.value))}
                disabled={saving}
                className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-content-strong outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {Array.from({ length: maxTeams }, (_, index) => {
                  const number = index + 1;

                  return (
                    <option key={number} value={number}>
                      Team {number}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-content">
                Destination slot
              </label>

              <select
                value={targetSlot}
                onChange={(event) => setTargetSlot(Number(event.target.value))}
                disabled={saving}
                className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-content-strong outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {Array.from(
                  {
                    length: membersPerTeam,
                  },
                  (_, index) => {
                    const number = index + 1;

                    return (
                      <option key={number} value={number}>
                        Slot {number}
                      </option>
                    );
                  },
                )}
              </select>
            </div>
          </div>

          {!isCurrentSlot && (
            <div
              className={[
                "rounded-lg border px-4 py-3",
                targetMember
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                {targetMember ? (
                  <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-amber-600" />
                ) : (
                  <MoveRight className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                )}

                <div>
                  <div
                    className={[
                      "text-sm font-medium",
                      targetMember ? "text-amber-800" : "text-emerald-800",
                    ].join(" ")}
                  >
                    {targetMember
                      ? "Occupied slot — players will swap"
                      : "Empty slot — player will move"}
                  </div>

                  <div
                    className={[
                      "mt-1 text-xs leading-5",
                      targetMember ? "text-amber-700" : "text-emerald-700",
                    ].join(" ")}
                  >
                    {targetMember
                      ? `${targetMember.nickname} will move to Team ${member.teamNumber}, Slot ${member.slotNumber}.`
                      : `Team ${targetTeam}, Slot ${targetSlot} is available.`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCurrentSlot && (
            <div className="rounded-lg border border-line bg-surface-100 px-4 py-3 text-sm text-content-muted">
              Select a different team or slot.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleMove}
            disabled={saving || isCurrentSlot}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : targetMember ? (
              <ArrowRightLeft className="size-4" />
            ) : (
              <MoveRight className="size-4" />
            )}

            {targetMember ? "Swap players" : "Move player"}
          </button>
        </div>
      </div>
    </div>
  );
}
