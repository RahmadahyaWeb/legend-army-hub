// src/components/guild-league/CopyRosterModal.jsx

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CopyRosterModal({
  open,
  guildLeagueId,
  currentEventDate,
  onClose,
}) {
  const toast = useToast();

  const [guildLeagues, setGuildLeagues] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGuildLeagueId, setSelectedGuildLeagueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setLoading(true);
    setError("");

    const reference = collection(db, "guild_leagues");

    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .filter((event) => event.id !== guildLeagueId);

        data.sort((first, second) => {
          const firstDate =
            typeof first.eventDate?.toDate === "function"
              ? first.eventDate.toDate().getTime()
              : new Date(first.eventDate || 0).getTime();

          const secondDate =
            typeof second.eventDate?.toDate === "function"
              ? second.eventDate.toDate().getTime()
              : new Date(second.eventDate || 0).getTime();

          return secondDate - firstDate;
        });

        setGuildLeagues(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Failed to load Guild League events:", snapshotError);

        setError("Failed to load Guild League events.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [open, guildLeagueId]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedGuildLeagueId("");
      setError("");
      setCopying(false);
    }
  }, [open]);

  const filteredGuildLeagues = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return guildLeagues;
    }

    return guildLeagues.filter((event) => {
      const values = [
        event.name,
        event.notes,
        event.status,
        formatDate(event.eventDate),
      ];

      return values
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [guildLeagues, search]);

  const selectedEvent = useMemo(() => {
    return (
      guildLeagues.find(
        (event) => String(event.id) === String(selectedGuildLeagueId),
      ) || null
    );
  }, [guildLeagues, selectedGuildLeagueId]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (copying) {
      return;
    }

    onClose();
  };

  const handleCopy = async () => {
    if (
      copying ||
      !guildLeagueId ||
      !selectedGuildLeagueId ||
      selectedGuildLeagueId === guildLeagueId
    ) {
      return;
    }

    setCopying(true);
    setError("");

    try {
      const sourceRosterReference = collection(
        db,
        "guild_leagues",
        selectedGuildLeagueId,
        "roster",
      );

      const sourceTeamsReference = collection(
        db,
        "guild_leagues",
        selectedGuildLeagueId,
        "teams",
      );

      const targetRosterReference = collection(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster",
      );

      const targetSlotsReference = collection(
        db,
        "guild_leagues",
        guildLeagueId,
        "roster_slots",
      );

      const targetTeamsReference = collection(
        db,
        "guild_leagues",
        guildLeagueId,
        "teams",
      );

      const [
        sourceRosterSnapshot,
        sourceTeamsSnapshot,
        targetRosterSnapshot,
        targetSlotsSnapshot,
        targetTeamsSnapshot,
      ] = await Promise.all([
        getDocs(sourceRosterReference),
        getDocs(sourceTeamsReference),
        getDocs(targetRosterReference),
        getDocs(targetSlotsReference),
        getDocs(targetTeamsReference),
      ]);

      if (sourceRosterSnapshot.empty) {
        throw new Error("The selected Guild League does not have a roster.");
      }

      if (
        !targetRosterSnapshot.empty ||
        !targetSlotsSnapshot.empty ||
        !targetTeamsSnapshot.empty
      ) {
        throw new Error(
          "Current Guild League already contains roster or team data.",
        );
      }

      const batch = writeBatch(db);

      sourceTeamsSnapshot.docs.forEach((sourceTeamDocument) => {
        const sourceTeam = sourceTeamDocument.data();

        const teamNumber = Number(sourceTeam.teamNumber);

        if (!teamNumber) {
          return;
        }

        const targetTeamReference = doc(
          db,
          "guild_leagues",
          guildLeagueId,
          "teams",
          `team-${teamNumber}`,
        );

        batch.set(targetTeamReference, {
          ...sourceTeam,
          teamNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      sourceRosterSnapshot.docs.forEach((sourceRosterDocument) => {
        const sourceMember = sourceRosterDocument.data();

        const memberId = String(
          sourceMember.memberId || sourceRosterDocument.id,
        );

        const teamNumber = Number(sourceMember.teamNumber);
        const slotNumber = Number(sourceMember.slotNumber);

        if (!memberId || !teamNumber || !slotNumber) {
          return;
        }

        const slotId = `team-${teamNumber}-slot-${slotNumber}`;

        const targetRosterDocument = doc(
          db,
          "guild_leagues",
          guildLeagueId,
          "roster",
          memberId,
        );

        const targetSlotDocument = doc(
          db,
          "guild_leagues",
          guildLeagueId,
          "roster_slots",
          slotId,
        );

        batch.set(targetRosterDocument, {
          memberId,
          nickname: sourceMember.nickname ?? "",
          className: sourceMember.className ?? "",
          level: Number(sourceMember.level) || 0,
          gearScore: Number(sourceMember.gearScore) || 0,
          position: sourceMember.position ?? "",
          title: sourceMember.title ?? "",
          gender: sourceMember.gender ?? "",
          teamNumber,
          slotNumber,
          slotId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        batch.set(targetSlotDocument, {
          slotId,
          memberId,
          rosterId: memberId,
          nickname: sourceMember.nickname ?? "",
          teamNumber,
          slotNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const rosterCount = sourceRosterSnapshot.size;

      const activeTeams = new Set();

      sourceRosterSnapshot.docs.forEach((sourceRosterDocument) => {
        const teamNumber = Number(sourceRosterDocument.data().teamNumber);

        if (teamNumber) {
          activeTeams.add(teamNumber);
        }
      });

      batch.update(doc(db, "guild_leagues", guildLeagueId), {
        rosterCount,
        teamCount: activeTeams.size,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      onClose();

      toast.success(
        "Roster copied",
        `Roster from ${selectedEvent?.name || "the selected event"} has been copied successfully.`,
      );
    } catch (copyError) {
      console.error("Failed to copy Guild League roster:", copyError);

      let message = copyError?.message || "Failed to copy Guild League roster.";

      if (copyError?.code === "permission-denied") {
        message = "You do not have permission to copy this roster.";
      }

      setError(message);

      toast.error("Copy failed", message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-xl sm:max-w-xl sm:rounded-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-content-strong">
              Copy roster
            </h2>

            <p className="mt-0.5 text-sm text-content-muted">
              Copy roster and lane assignments from a previous Guild League.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={copying}
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
              placeholder="Search Guild League..."
              disabled={copying}
              className="h-10 w-full rounded-lg border border-line-strong bg-white pl-9 pr-4 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              autoFocus
            />
          </div>

          <div className="mt-3 text-xs text-content-muted">
            {filteredGuildLeagues.length} Guild League events available
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
          ) : filteredGuildLeagues.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-200">
                <Shield className="size-5 text-content-muted" />
              </div>

              <h3 className="mt-4 text-sm font-medium text-content-strong">
                No Guild League found
              </h3>

              <p className="mt-1 max-w-xs text-sm leading-5 text-content-muted">
                There are no previous Guild League events matching your search.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredGuildLeagues.map((event) => {
                const selected =
                  String(selectedGuildLeagueId) === String(event.id);

                const rosterCount = Number(event.rosterCount) || 0;
                const teamCount = Number(event.teamCount) || 0;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedGuildLeagueId(event.id)}
                    disabled={copying}
                    className={[
                      "flex w-full items-center gap-4 px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-5",
                      selected
                        ? "bg-brand-50"
                        : "bg-white hover:bg-surface-100",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        selected
                          ? "bg-brand-600 text-white"
                          : "bg-surface-200 text-content-muted",
                      ].join(" ")}
                    >
                      {selected ? (
                        <Check className="size-4" />
                      ) : (
                        <Shield className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={[
                          "truncate text-sm font-semibold",
                          selected ? "text-brand-700" : "text-content-strong",
                        ].join(" ")}
                      >
                        {event.name || "Guild League"}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />

                          {formatDate(event.eventDate)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" />
                          {rosterCount} Players
                        </span>

                        <span>{teamCount} Teams</span>
                      </div>

                      {event.notes && (
                        <p className="mt-1.5 truncate text-xs text-content-subtle">
                          {event.notes}
                        </p>
                      )}
                    </div>

                    <div
                      className={[
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-brand-600 bg-brand-600"
                          : "border-line-strong bg-white",
                      ].join(" ")}
                    >
                      {selected && <Check className="size-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedEvent && (
          <div className="shrink-0 border-t border-line bg-surface-100 px-5 py-3">
            <div className="text-xs text-content-muted">Copying from</div>

            <div className="mt-0.5 text-sm font-semibold text-content-strong">
              {selectedEvent.name || "Guild League"} ·{" "}
              {formatDate(selectedEvent.eventDate)}
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={copying}
            className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={copying || !selectedGuildLeagueId}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copying ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy Roster
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
