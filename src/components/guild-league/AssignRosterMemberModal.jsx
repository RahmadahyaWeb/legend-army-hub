"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users, X } from "lucide-react";
import { fetchMembers, assignRosterMember } from "@/lib/api";

export default function AssignRosterMemberModal({
  open,
  guildLeagueId,
  teamNumber,
  slotNumber,
  assignedMemberIds = [],
  onClose,
  onSuccess,
}) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");

    fetchMembers()
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load members:", err);
        setError("Failed to load members.");
        setLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setError("");
      setSavingMemberId(null);
    }
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

  const handleAssign = async (member) => {
    setSavingMemberId(member.id);
    setError("");

    try {
      await assignRosterMember(guildLeagueId, {
        memberId: member.id,
        nickname: member.nickname,
        className: member.className,
        level: member.level,
        gearScore: member.gearScore,
        teamNumber: Number(teamNumber),
        slotNumber: Number(slotNumber),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Assign error:", err);
      setError(err.message || "Failed to assign member.");
    } finally {
      setSavingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Assign Player to Team {teamNumber} - Slot #{slotNumber}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Select an available guild member for this match slot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 border-b border-zinc-200">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by nickname or class..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100">
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Loading available members...
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No available members found.
            </div>
          ) : (
            availableMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-zinc-50 rounded-xl transition"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-900 truncate">
                    {m.nickname}
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                    <span>{m.className || "Unknown Class"}</span>
                    <span>•</span>
                    <span>Lv. {m.level || "—"}</span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-700">
                      {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingMemberId === m.id}
                  onClick={() => handleAssign(m)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  {savingMemberId === m.id ? "Assigning..." : "Assign"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-zinc-200 bg-zinc-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
