"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, UserPlus, Users, X } from "lucide-react";
import { fetchMembers, assignRosterMember } from "@/lib/api";

let cachedMembersList = null;

export default function AssignRosterMemberModal({
  open,
  guildLeagueId,
  teamNumber,
  slotNumber,
  assignedMemberIds = [],
  onClose,
  onSuccess,
  onAssign,
}) {
  const [members, setMembers] = useState(() => cachedMembersList || []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(() => !cachedMembersList);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setAssigningId(null);
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
        setError("Failed to load members.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const assignedSet = useMemo(() => {
    return new Set(assignedMemberIds.filter(Boolean).map(String));
  }, [assignedMemberIds]);

  const availableMembers = useMemo(() => {
    const term = search.toLowerCase().trim();
    return members.filter((m) => {
      if (assignedSet.has(String(m.id))) return false;
      if (!term) return true;
      const matchNick = m.nickname?.toLowerCase().includes(term);
      const matchClass = m.className?.toLowerCase().includes(term);
      return matchNick || matchClass;
    });
  }, [members, assignedSet, search]);

  if (!open) return null;

  const handleSelectMember = (member) => {
    setAssigningId(member.id);
    if (onAssign) {
      // Instant optimistic execution
      onAssign(member);
      return;
    }

    // Fallback if no optimistic handler provided
    assignRosterMember(guildLeagueId, {
      memberId: member.id,
      nickname: member.nickname,
      className: member.className,
      level: member.level,
      gearScore: member.gearScore,
      teamNumber: Number(teamNumber),
      slotNumber: Number(slotNumber),
    })
      .then(() => {
        if (onSuccess) onSuccess();
        onClose();
      })
      .catch((err) => {
        console.error("Assign error:", err);
        setError(err.message || "Failed to assign member.");
        setAssigningId(null);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200">
        <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                Team {teamNumber} • Slot #{slotNumber}
              </span>
              <h3 className="text-base font-bold text-zinc-900">
                Assign Guild Member
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Select an available member to deploy to this battle formation
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

        <div className="p-4 border-b border-zinc-200 bg-white">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by nickname or class..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-600 transition"
            />
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 divide-y divide-zinc-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Loader2 className="size-6 animate-spin text-red-600 mb-2" />
              <span className="text-xs">Loading available guild members...</span>
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              {search ? "No members match your search." : "All guild members are currently assigned."}
            </div>
          ) : (
            availableMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectMember(m)}
                className="group flex cursor-pointer items-center justify-between p-2.5 hover:bg-red-50/40 rounded-xl transition"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-bold text-zinc-900 group-hover:text-red-700 transition truncate">
                    {m.nickname}
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500 flex items-center gap-2">
                    <span className="font-medium text-zinc-700">{m.className || "Unknown Class"}</span>
                    <span>•</span>
                    <span>Lv. {m.level || "—"}</span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-900">
                      {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={assigningId === m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMember(m);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-500 active:scale-95 transition disabled:opacity-50"
                >
                  {assigningId === m.id ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3" />
                      <span>Assign</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3">
          <span className="text-xs text-zinc-500">
            {availableMembers.length} available {availableMembers.length === 1 ? "member" : "members"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
