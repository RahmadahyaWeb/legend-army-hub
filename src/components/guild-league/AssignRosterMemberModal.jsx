"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { fetchMembers, assignRosterMember } from "@/lib/api";
import { ClassBadge } from "@/utils/classColors";

let cachedMembersList = null;

/**
 * Modal dialog for assigning available guild members to specific team slots.
 * Includes instant optimistic state updates to prevent race conditions during rapid clicking,
 * and an auto-advance feature to cycle through consecutive vacant slots.
 *
 * @param {object} props
 * @param {boolean} props.open - Visibility state
 * @param {string} props.guildLeagueId - Target league ID
 * @param {number} props.teamNumber - Target team index (1-based)
 * @param {number} props.slotNumber - Target slot index (1-based)
 * @param {number} [props.maxTeams=2] - Total teams in league
 * @param {number} [props.membersPerTeam=10] - Slots per team
 * @param {Array} [props.rosterMembers=[]] - Existing assigned roster entries
 * @param {Array} [props.assignedMemberIds=[]] - IDs already in roster
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} [props.onSuccess] - Callback when assignment succeeds
 * @param {Function} [props.onAssign] - Optimistic assign callback
 * @param {Function} [props.onSelectSlot] - Callback to switch active slot for auto-advance
 */
export default function AssignRosterMemberModal({
  open,
  guildLeagueId,
  teamNumber,
  slotNumber,
  maxTeams = 2,
  membersPerTeam = 10,
  rosterMembers = [],
  assignedMemberIds = [],
  onClose,
  onSuccess,
  onAssign,
  onSelectSlot,
}) {
  const [members, setMembers] = useState(() => cachedMembersList || []);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState("gs_desc"); // "gs_desc", "name_asc", "level_desc"
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [loading, setLoading] = useState(() => !cachedMembersList);
  const [error, setError] = useState("");

  // Local optimistic tracking during rapid fire clicks in this modal session
  const [sessionAssignedIds, setSessionAssignedIds] = useState(() => new Set());
  const [sessionAssignedNicks, setSessionAssignedNicks] = useState(() => new Set());
  const [sessionOccupiedSlots, setSessionOccupiedSlots] = useState(() => new Set());

  useEffect(() => {
    if (!open) {
      setSessionAssignedIds(new Set());
      setSessionAssignedNicks(new Set());
      setSessionOccupiedSlots(new Set());
      return;
    }
    setError("");
    setSearch("");

    let isMounted = true;
    if (!cachedMembersList) {
      setLoading(true);
    }

    fetchMembers()
      .then((data) => {
        if (!isMounted) return;
        cachedMembersList = data;
        setMembers(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load members:", err);
        setError("Failed to load guild members.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Combined assigned member IDs and Nicknames (from props + this rapid session)
  const { allAssignedIds, allAssignedNicks } = useMemo(() => {
    const ids = new Set((assignedMemberIds || []).filter(Boolean).map(String));
    const nicks = new Set();

    (rosterMembers || []).forEach((r) => {
      if (r.memberId || r.id) {
        ids.add(String(r.memberId || r.id));
      }
      if (r.nickname) {
        nicks.add(r.nickname.toLowerCase().trim());
      }
    });

    sessionAssignedIds.forEach((id) => ids.add(String(id)));
    sessionAssignedNicks.forEach((nick) => nicks.add(nick.toLowerCase().trim()));

    return { allAssignedIds: ids, allAssignedNicks: nicks };
  }, [assignedMemberIds, rosterMembers, sessionAssignedIds, sessionAssignedNicks]);

  // Extract unique classes for quick filter tags
  const uniqueClasses = useMemo(() => {
    const set = new Set();
    members.forEach((m) => {
      if (m.className) set.add(m.className);
    });
    return Array.from(set).sort();
  }, [members]);

  // Filter & sort members with nickname deduplication
  const availableMembers = useMemo(() => {
    const term = search.toLowerCase().trim();
    const seenNicks = new Set();

    return members
      .filter((m) => {
        const nickKey = m.nickname?.toLowerCase().trim();
        if (!nickKey) return false;

        // Prevent duplicates within the members list itself
        if (seenNicks.has(nickKey)) return false;
        seenNicks.add(nickKey);

        // Exclude members already assigned
        if (allAssignedIds.has(String(m.id))) return false;
        if (allAssignedNicks.has(nickKey)) return false;

        // Class filter
        if (classFilter !== "all" && m.className !== classFilter) {
          return false;
        }

        // Search term
        if (!term) return true;
        const matchNick = nickKey.includes(term);
        const matchClass = m.className?.toLowerCase().includes(term);
        return matchNick || matchClass;
      })
      .sort((a, b) => {
        if (sortBy === "gs_desc") {
          return (Number(b.gearScore) || 0) - (Number(a.gearScore) || 0);
        }
        if (sortBy === "name_asc") {
          return (a.nickname || "").localeCompare(b.nickname || "");
        }
        if (sortBy === "level_desc") {
          return (Number(b.level) || 0) - (Number(a.level) || 0);
        }
        return 0;
      });
  }, [members, allAssignedIds, allAssignedNicks, search, classFilter, sortBy]);

  // Find next empty slot for auto-advance considering session state
  const findNextEmptySlot = (currentTeam, currentSlot) => {
    const isSlotOccupied = (t, s) => {
      const slotKey = `t${t}_s${s}`;
      if (sessionOccupiedSlots.has(slotKey)) return true;
      return rosterMembers.some(
        (r) => Number(r.teamNumber) === t && Number(r.slotNumber) === s
      );
    };

    // 1. Check remaining slots in current team
    for (let s = currentSlot + 1; s <= membersPerTeam; s++) {
      if (!isSlotOccupied(Number(currentTeam), s)) {
        return { teamNumber: Number(currentTeam), slotNumber: s };
      }
    }
    // 2. Check next teams
    for (let t = 1; t <= maxTeams; t++) {
      for (let s = 1; s <= membersPerTeam; s++) {
        if (!isSlotOccupied(t, s)) {
          return { teamNumber: t, slotNumber: s };
        }
      }
    }
    return null;
  };

  if (!open) return null;

  const handleSelectMember = (member) => {
    const currentTeam = Number(teamNumber);
    const currentSlot = Number(slotNumber);
    const nickKey = member.nickname?.toLowerCase().trim();

    // 1. Instant local session update to prevent double-click or race condition
    const slotKey = `t${currentTeam}_s${currentSlot}`;
    setSessionAssignedIds((prev) => new Set([...prev, String(member.id)]));
    if (nickKey) {
      setSessionAssignedNicks((prev) => new Set([...prev, nickKey]));
    }
    setSessionOccupiedSlots((prev) => new Set([...prev, slotKey]));

    // 2. Fire assign handler with explicit coordinates
    if (onAssign) {
      onAssign(member, currentTeam, currentSlot);

      if (autoAdvance && onSelectSlot) {
        const nextSlot = findNextEmptySlot(currentTeam, currentSlot);
        if (nextSlot) {
          onSelectSlot(nextSlot);
          return;
        }
      }
      onClose();
      return;
    }

    // Direct fallback
    assignRosterMember(guildLeagueId, {
      memberId: member.id,
      nickname: member.nickname,
      className: member.className,
      level: member.level,
      gearScore: member.gearScore,
      teamNumber: currentTeam,
      slotNumber: currentSlot,
    })
      .then(() => {
        if (onSuccess) onSuccess();
        if (autoAdvance && onSelectSlot) {
          const nextSlot = findNextEmptySlot(currentTeam, currentSlot);
          if (nextSlot) {
            onSelectSlot(nextSlot);
            return;
          }
        }
        onClose();
      })
      .catch((err) => {
        console.error("Assign error:", err);
        setError(err.message || "Failed to assign member.");
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 sm:px-6 py-3.5 bg-zinc-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-xs font-black text-white shadow-xs">
              T{teamNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                  Assign to Team {teamNumber}
                </h3>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 shrink-0">
                  Slot #{slotNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">
                Pick an available guild member to deploy to this slot
              </p>
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

        {/* CONTROLS (SEARCH, CLASS FILTER, SORT, AUTO-ADVANCE) */}
        <div className="p-3 sm:p-4 border-b border-zinc-200 bg-white space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by nickname or class..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* SORT SELECTOR */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 text-xs font-semibold text-zinc-700 focus:border-red-600 focus:outline-none"
              >
                <option value="gs_desc">Highest GS</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="level_desc">Highest Level</option>
              </select>
            </div>
          </div>

          {/* CLASS FILTER PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setClassFilter("all")}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                classFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All Classes ({members.filter((m) => !allAssignedIds.has(String(m.id))).length})
            </button>

            {uniqueClasses.map((cls) => {
              const count = members.filter(
                (m) => m.className === cls && !allAssignedIds.has(String(m.id))
              ).length;
              if (count === 0) return null;

              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setClassFilter(cls)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    classFilter === cls
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <span>{cls}</span>
                  <span
                    className={`rounded-full px-1 text-[9px] font-mono ${
                      classFilter === cls ? "bg-white/20 text-white" : "text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* MEMBERS LIST */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-zinc-100 min-h-[260px] max-h-[420px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="size-6 animate-spin text-red-600 mb-2" />
              <span className="text-xs font-medium">Loading available members...</span>
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-xs text-zinc-500">
              <Users className="size-8 text-zinc-300 mb-2" />
              <p className="font-semibold text-zinc-700">
                {search || classFilter !== "all"
                  ? "No matching guild members found"
                  : "All guild members are currently deployed"}
              </p>
              <p className="mt-0.5 text-zinc-400 text-[11px]">
                {search || classFilter !== "all"
                  ? "Try adjusting your search query or filter tags."
                  : "Add more members in the Members management tab."}
              </p>
            </div>
          ) : (
            availableMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectMember(m)}
                className="group flex cursor-pointer items-center justify-between p-2.5 hover:bg-red-50/40 rounded-xl transition active:scale-[0.99]"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-red-700 transition truncate">
                      {m.nickname}
                    </span>
                    {m.role && m.role !== "Member" && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-bold text-zinc-600">
                        {m.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                    <ClassBadge className={m.className} size="xs" />
                    {Number(m.level) > 0 && (
                      <span className="font-medium text-zinc-400">Lv. {m.level}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-zinc-900 font-mono">
                      {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMember(m);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-500 active:scale-95 transition"
                  >
                    <UserPlus className="size-3.5" />
                    <span>Assign</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 sm:px-6 py-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="size-3.5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              <span>Auto-advance to next empty slot</span>
            </span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
