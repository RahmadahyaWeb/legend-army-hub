import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { Search, UserPlus, Users, X } from "lucide-react";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

export default function AssignRosterMemberModal({
  open,
  guildLeagueId,
  teamNumber,
  slotNumber,
  assignedMemberIds = [],
  onClose,
}) {
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setLoading(true);
    setError("");

    // Ambil SEMUA member.
    // Jangan filter isActive karena data lama belum tentu
    // memiliki struktur field isActive yang konsisten.
    const membersReference = collection(db, "members");

    const unsubscribe = onSnapshot(
      membersReference,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        data.sort((first, second) =>
          String(first.nickname ?? "").localeCompare(
            String(second.nickname ?? ""),
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            },
          ),
        );

        setMembers(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Failed to load members:", snapshotError);

        setError("Failed to load members.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setError("");
      setSavingMemberId(null);
    }
  }, [open]);

  const normalizedAssignedMemberIds = useMemo(() => {
    return new Set(
      assignedMemberIds.filter(Boolean).map((memberId) => String(memberId)),
    );
  }, [assignedMemberIds]);

  const availableMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return members.filter((member) => {
      const memberId = String(member.id);

      // Jangan tampilkan member yang sudah ada di roster.
      if (normalizedAssignedMemberIds.has(memberId)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const values = [
        member.nickname,
        member.className,
        member.position,
        member.title,
        member.level,
        member.gearScore,
      ];

      return values
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [members, normalizedAssignedMemberIds, search]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (savingMemberId) {
      return;
    }

    onClose();
  };

  const handleAssign = async (member) => {
    if (
      savingMemberId ||
      !guildLeagueId ||
      !member?.id ||
      !teamNumber ||
      !slotNumber
    ) {
      return;
    }

    const memberId = String(member.id);
    const numericTeamNumber = Number(teamNumber);
    const numericSlotNumber = Number(slotNumber);

    setSavingMemberId(memberId);
    setError("");

    try {
      const guildLeagueReference = doc(db, "guild_leagues", guildLeagueId);

      // PENTING:
      // ID document roster = ID master member.
      const rosterReference = doc(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster",
        memberId,
      );

      const slotId = `team-${numericTeamNumber}-slot-${numericSlotNumber}`;

      const slotReference = doc(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster_slots",
        slotId,
      );

      await runTransaction(db, async (transaction) => {
        // Semua READ harus dilakukan sebelum WRITE.
        const guildLeagueSnapshot = await transaction.get(guildLeagueReference);

        const rosterSnapshot = await transaction.get(rosterReference);

        const slotSnapshot = await transaction.get(slotReference);

        if (!guildLeagueSnapshot.exists()) {
          throw new Error("Guild League event does not exist.");
        }

        // Proteksi utama member double.
        // Karena document ID roster = memberId,
        // satu member hanya bisa punya satu document roster.
        if (rosterSnapshot.exists()) {
          throw new Error(
            "This player is already assigned to this Guild League.",
          );
        }

        // Proteksi slot double.
        if (slotSnapshot.exists()) {
          throw new Error("This roster slot is already occupied.");
        }

        transaction.set(rosterReference, {
          memberId,
          nickname: member.nickname ?? "",
          className: member.className ?? "",
          level: Number(member.level) || 0,
          gearScore: Number(member.gearScore) || 0,
          position: member.position ?? "",
          title: member.title ?? "",
          gender: member.gender ?? "",
          teamNumber: numericTeamNumber,
          slotNumber: numericSlotNumber,
          slotId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(slotReference, {
          slotId,
          memberId,
          rosterId: memberId,
          nickname: member.nickname ?? "",
          teamNumber: numericTeamNumber,
          slotNumber: numericSlotNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      onClose();

      toast.success(
        "Player assigned",
        `${member.nickname} has been assigned to Team ${numericTeamNumber}.`,
      );
    } catch (assignError) {
      console.error("Failed to assign roster member:", assignError);

      let message = assignError?.message || "Failed to assign player.";

      if (assignError?.code === "permission-denied") {
        message = "You do not have permission to assign this player.";
      }

      setError(message);

      toast.error("Assignment failed", message);
    } finally {
      setSavingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-xl sm:max-w-xl sm:rounded-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-content-strong">
              Assign player
            </h2>

            <p className="mt-0.5 text-sm text-content-muted">
              Team {teamNumber} · Slot {slotNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(savingMemberId)}
            className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-line p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search player, class or gear score..."
              className="h-10 w-full rounded-lg border border-line-strong bg-white pl-9 pr-4 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              autoFocus
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-content-muted">
            <span>{availableMembers.length} available players</span>

            <span>{normalizedAssignedMemberIds.size} already assigned</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:m-5">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-200">
                <Users className="size-5 text-content-muted" />
              </div>

              <h3 className="mt-4 text-sm font-medium text-content-strong">
                No players available
              </h3>

              <p className="mt-1 max-w-xs text-sm leading-5 text-content-muted">
                All matching members are already assigned or no member matches
                your search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {availableMembers.map((member) => {
                const isSaving = savingMemberId === String(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleAssign(member)}
                    disabled={Boolean(savingMemberId)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                      {String(member.nickname ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-content-strong">
                        {member.nickname || "Unknown player"}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-muted">
                        <span>{member.className || "Unknown class"}</span>

                        <span className="text-content-subtle">·</span>

                        <span>Lv. {member.level ?? "—"}</span>

                        {member.position && (
                          <>
                            <span className="text-content-subtle">·</span>

                            <span>{member.position}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-content-strong">
                        {Number(member.gearScore || 0).toLocaleString()}
                      </div>

                      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                        Gear Score
                      </div>
                    </div>

                    <div className="flex size-8 shrink-0 items-center justify-center">
                      {isSaving ? (
                        <div className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
                      ) : (
                        <UserPlus className="size-4 text-content-subtle" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(savingMemberId)}
            className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
