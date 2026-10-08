"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { fetchMembers } from "@/lib/api";
import { ClassBadge } from "@/utils/classColors";
import Button from "@/components/ui/Button";

let cachedMembersList = null;

/**
 * Modal dialog for assigning available guild members to specific team slots.
 * Includes instant optimistic state updates to prevent race conditions during rapid clicking,
 * and an auto-advance feature to cycle through consecutive vacant slots.
 * Styled after classic Ragnarok Online party roster management dialogs.
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
 * @returns {JSX.Element|null}
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
  const [sortBy, setSortBy] = useState("gs_desc");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [loading, setLoading] = useState(() => !cachedMembersList);
  const [error, setError] = useState("");

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

  const uniqueClasses = useMemo(() => {
    const set = new Set();
    members.forEach((m) => {
      if (m.className) set.add(m.className);
    });
    return Array.from(set).sort();
  }, [members]);

  const availableMembers = useMemo(() => {
    const term = search.toLowerCase().trim();
    const seenNicks = new Set();

    return members
      .filter((m) => {
        const nickKey = m.nickname?.toLowerCase().trim();
        if (!nickKey) return false;

        if (seenNicks.has(nickKey)) return false;
        seenNicks.add(nickKey);

        if (allAssignedIds.has(String(m.id))) return false;
        if (allAssignedNicks.has(nickKey)) return false;

        if (classFilter !== "all" && m.className !== classFilter) return false;

        if (term) {
          const nameMatch = nickKey.includes(term);
          const classMatch = (m.className || "").toLowerCase().includes(term);
          const roleMatch = (m.role || "").toLowerCase().includes(term);
          if (!nameMatch && !classMatch && !roleMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") {
          return (a.nickname || "").localeCompare(b.nickname || "");
        }
        if (sortBy === "level_desc") {
          return (Number(b.level) || 0) - (Number(a.level) || 0);
        }
        return (Number(b.gearScore) || 0) - (Number(a.gearScore) || 0);
      });
  }, [members, search, classFilter, sortBy, allAssignedIds, allAssignedNicks]);

  const findNextEmptySlot = (currentTeam, currentSlot) => {
    const isSlotOccupied = (t, s) => {
      const slotKey = `${t}_${s}`;
      if (sessionOccupiedSlots.has(slotKey)) return true;
      return (rosterMembers || []).some(
        (r) => Number(r.teamNumber) === Number(t) && Number(r.slotNumber) === Number(s)
      );
    };

    for (let s = currentSlot + 1; s <= membersPerTeam; s++) {
      if (!isSlotOccupied(currentTeam, s)) {
        return { teamNumber: currentTeam, slotNumber: s };
      }
    }

    for (let t = currentTeam + 1; t <= maxTeams; t++) {
      for (let s = 1; s <= membersPerTeam; s++) {
        if (!isSlotOccupied(t, s)) {
          return { teamNumber: t, slotNumber: s };
        }
      }
    }

    for (let t = 1; t <= currentTeam; t++) {
      const maxS = t === currentTeam ? currentSlot : membersPerTeam;
      for (let s = 1; s < maxS; s++) {
        if (!isSlotOccupied(t, s)) {
          return { teamNumber: t, slotNumber: s };
        }
      }
    }

    return null;
  };

  const handleSelectMember = (member) => {
    if (!member || !teamNumber || !slotNumber) return;

    const currentTeam = teamNumber;
    const currentSlot = slotNumber;
    const slotKey = `${currentTeam}_${currentSlot}`;

    setSessionAssignedIds((prev) => new Set(prev).add(member.id));
    if (member.nickname) {
      setSessionAssignedNicks((prev) =>
        new Set(prev).add(member.nickname.toLowerCase().trim())
      );
    }
    setSessionOccupiedSlots((prev) => new Set(prev).add(slotKey));

    if (onAssign) {
      const promise = onAssign(member, currentTeam, currentSlot);
      if (promise && typeof promise.then === "function") {
        promise.then(() => {
          if (autoAdvance && onSelectSlot) {
            const nextSlot = findNextEmptySlot(currentTeam, currentSlot);
            if (nextSlot) {
              onSelectSlot(nextSlot);
              return;
            }
          }
          onClose();
        }).catch((err) => {
          console.error("Assign error:", err);
          setError(err.message || "Failed to assign member.");
        });
        return;
      }
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 animate-in fade-in duration-100 font-sans">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden border-2 border-zinc-950 bg-white pixel-shadow-lg">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-zinc-950 px-4 sm:px-5 py-3 bg-zinc-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-950 text-xs font-mono font-bold text-white pixel-shadow-sm">
              T{teamNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-pixel text-zinc-950 truncate">
                  Deploy to Team {teamNumber}
                </h3>
                <span className="border border-brand-700 bg-brand-50 px-2 py-0.2 text-[10px] font-mono font-bold text-brand-900 shrink-0">
                  Slot #{slotNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 truncate">
                Select an available guild combatant to deploy to this slot
              </p>
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

        {/* CONTROLS (SEARCH, CLASS FILTER, SORT) */}
        <div className="p-3 sm:p-4 border-b-2 border-zinc-950 bg-white space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by nickname or class..."
                className="h-9 w-full border-2 border-zinc-950 bg-white pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-brand-600 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-950"
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
                className="h-9 border-2 border-zinc-950 bg-white px-2.5 text-xs font-bold text-zinc-900 focus:outline-none"
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
              className={`shrink-0 border-2 px-2.5 py-1 text-[11px] font-bold transition select-none ${
                classFilter === "all"
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
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
                  className={`shrink-0 inline-flex items-center gap-1 border-2 px-2.5 py-1 text-[11px] font-bold transition select-none ${
                    classFilter === cls
                      ? "border-brand-900 bg-brand-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-950"
                  }`}
                >
                  <span>{cls}</span>
                  <span
                    className={`px-1 text-[9px] font-mono font-bold ${
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
            <div className="border-2 border-red-700 bg-red-50 p-2.5 text-xs font-bold text-red-900">
              {error}
            </div>
          )}
        </div>

        {/* MEMBERS LIST */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-zinc-200 min-h-[260px] max-h-[420px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="size-6 animate-spin text-brand-600 mb-2" />
              <span className="text-xs font-bold font-pixel uppercase tracking-wide">Loading available combatants...</span>
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-xs text-zinc-500">
              <Users className="size-8 text-zinc-400 mb-2" />
              <p className="font-bold text-zinc-900 font-pixel uppercase">
                {search || classFilter !== "all"
                  ? "No matching guild combatants found"
                  : "All guild members are currently deployed"}
              </p>
              <p className="mt-0.5 text-zinc-500 text-[11px]">
                {search || classFilter !== "all"
                  ? "Try adjusting your search query or class filter tags."
                  : "Add more members in the Members management tab."}
              </p>
            </div>
          ) : (
            availableMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectMember(m)}
                className="group flex cursor-pointer items-center justify-between p-2.5 hover:bg-zinc-100 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-zinc-950 group-hover:text-brand-700 transition-colors truncate">
                      {m.nickname}
                    </span>
                    {m.role && m.role !== "Member" && (
                      <span className="border border-zinc-900 bg-zinc-100 px-1.5 py-0.2 text-[9px] font-bold text-zinc-900 uppercase">
                        {m.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                    <ClassBadge className={m.className} size="xs" />
                    {Number(m.level) > 0 && (
                      <span className="font-mono font-bold text-zinc-500">Lv. {m.level}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-brand-700 font-mono">
                      {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    icon={UserPlus}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMember(m);
                    }}
                  >
                    Deploy
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t-2 border-zinc-950 bg-zinc-50 px-4 sm:px-5 py-3">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="size-3.5 border-2 border-zinc-900 accent-zinc-950"
            />
            <span>Auto-advance to next empty slot</span>
          </label>

          <Button variant="secondary" size="xs" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
