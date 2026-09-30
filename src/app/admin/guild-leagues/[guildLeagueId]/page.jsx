"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Send,
  Shield,
  Swords,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  fetchGuildLeagueDetail,
  updateGuildLeague,
  updateTeamInfo,
  assignRosterMember,
  removeRosterMember,
} from "@/lib/api";
import AssignRosterMemberModal from "@/components/guild-league/AssignRosterMemberModal";
import ManageRosterMemberModal from "@/components/guild-league/ManageRosterMemberModal";
import CopyRosterModal from "@/components/guild-league/CopyRosterModal";
import { sendGuildLeagueToDiscord } from "@/services/guild-league/guildLeagueDiscordService";

const LANES = [
  { id: "top", label: "Top Lane" },
  { id: "mid", label: "Mid Lane" },
  { id: "bot", label: "Bot Lane" },
];

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString();
}

export default function GuildLeagueDetailPage() {
  const params = useParams();
  const guildLeagueId = params?.guildLeagueId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & action states
  const [assignSlot, setAssignSlot] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [sendingDiscord, setSendingDiscord] = useState(false);
  const [discordMsg, setDiscordMsg] = useState("");

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDetail = async (silent = false) => {
    if (!guildLeagueId) return;
    try {
      if (!silent && !data) {
        setLoading(true);
      }
      const res = await fetchGuildLeagueDetail(guildLeagueId);
      setData(res);
      setError("");
    } catch (err) {
      console.error("Detail error:", err);
      if (!data) {
        setError(err.message || "Failed to load guild league detail.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail(false);
  }, [guildLeagueId]);

  const guildLeague = data?.guildLeague;
  const teams = data?.teams || [];
  const roster = data?.roster || [];

  const maxTeams = guildLeague?.maxTeams || 2;
  const membersPerTeam = guildLeague?.membersPerTeam || 10;
  const maxRoster = guildLeague?.maxRoster || maxTeams * membersPerTeam;
  const assignedMemberIds = roster.map((r) => r.memberId || r.id).filter(Boolean);

  const handleStatusChange = async (newStatus) => {
    // Optimistic status update
    setData((prev) =>
      prev
        ? {
            ...prev,
            guildLeague: { ...prev.guildLeague, status: newStatus },
          }
        : prev
    );

    try {
      await updateGuildLeague(guildLeagueId, { status: newStatus });
      showToast(`Match status updated to ${newStatus}`);
      loadDetail(true);
    } catch (err) {
      console.error("Status update error:", err);
      showToast(err.message || "Failed to update status.", "error");
      loadDetail(true);
    }
  };

  const handleLaneChange = async (teamNumber, newLane) => {
    // Optimistic lane update
    setData((prev) => {
      if (!prev) return prev;
      const updatedTeams = (prev.teams || []).map((t) =>
        Number(t.teamNumber) === Number(teamNumber)
          ? { ...t, lane: newLane }
          : t
      );
      return { ...prev, teams: updatedTeams };
    });

    try {
      const currentTeam = teams.find(
        (t) => Number(t.teamNumber) === Number(teamNumber)
      );
      await updateTeamInfo(
        guildLeagueId,
        teamNumber,
        currentTeam?.name || `Team ${teamNumber}`,
        newLane
      );
      showToast(`Team ${teamNumber} lane set to ${newLane ? newLane.toUpperCase() : "None"}`);
      loadDetail(true);
    } catch (err) {
      console.error("Lane change error:", err);
      showToast(err.message || "Failed to update team lane.", "error");
      loadDetail(true);
    }
  };

  const handleAssignMember = async (member) => {
    if (!assignSlot || !member) return;
    const targetTeam = assignSlot.teamNumber;
    const targetSlot = assignSlot.slotNumber;

    // Save previous roster snapshot
    const prevRoster = [...roster];

    // Optimistically create new roster entry
    const newEntry = {
      id: member.id,
      memberId: member.id,
      nickname: member.nickname,
      className: member.className,
      level: Number(member.level) || 0,
      gearScore: Number(member.gearScore) || 0,
      teamNumber: Number(targetTeam),
      slotNumber: Number(targetSlot),
    };

    // Filter out any previous occupant of this slot or same player elsewhere
    const filteredRoster = prevRoster.filter(
      (r) =>
        !(
          Number(r.teamNumber) === Number(targetTeam) &&
          Number(r.slotNumber) === Number(targetSlot)
        ) && String(r.memberId || r.id) !== String(member.id)
    );

    // Instant UI update
    setData((prev) =>
      prev ? { ...prev, roster: [...filteredRoster, newEntry] } : prev
    );
    setAssignSlot(null);
    showToast(`Assigned ${member.nickname} to Team ${targetTeam} (Slot #${targetSlot})`);

    // Async server persistence
    try {
      await assignRosterMember(guildLeagueId, {
        memberId: member.id,
        nickname: member.nickname,
        className: member.className,
        level: member.level,
        gearScore: member.gearScore,
        teamNumber: Number(targetTeam),
        slotNumber: Number(targetSlot),
      });
      loadDetail(true);
    } catch (err) {
      console.error("Assign error:", err);
      setData((prev) => (prev ? { ...prev, roster: prevRoster } : prev));
      showToast(err.message || "Failed to assign member.", "error");
    }
  };

  const handleMoveMember = async (member, targetTeam, targetSlot) => {
    if (!member) return;
    const prevRoster = [...roster];

    // Optimistically update roster
    const updatedRoster = prevRoster.map((r) => {
      if (
        Number(r.teamNumber) === Number(member.teamNumber) &&
        Number(r.slotNumber) === Number(member.slotNumber)
      ) {
        return {
          ...r,
          teamNumber: Number(targetTeam),
          slotNumber: Number(targetSlot),
        };
      }
      return r;
    });

    setData((prev) => (prev ? { ...prev, roster: updatedRoster } : prev));
    setSelectedMember(null);
    showToast(`Moved ${member.nickname} to Team ${targetTeam} (Slot #${targetSlot})`);

    try {
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
      loadDetail(true);
    } catch (err) {
      console.error("Move error:", err);
      setData((prev) => (prev ? { ...prev, roster: prevRoster } : prev));
      showToast(err.message || "Failed to move member.", "error");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!member) return;
    const prevRoster = [...roster];

    const updatedRoster = prevRoster.filter(
      (r) =>
        !(
          Number(r.teamNumber) === Number(member.teamNumber) &&
          Number(r.slotNumber) === Number(member.slotNumber)
        )
    );

    setData((prev) => (prev ? { ...prev, roster: updatedRoster } : prev));
    setSelectedMember(null);
    showToast(`Removed ${member.nickname} from roster`);

    try {
      await removeRosterMember(guildLeagueId, member.teamNumber, member.slotNumber);
      loadDetail(true);
    } catch (err) {
      console.error("Remove error:", err);
      setData((prev) => (prev ? { ...prev, roster: prevRoster } : prev));
      showToast(err.message || "Failed to remove member.", "error");
    }
  };

  const handleSendDiscord = async () => {
    if (!guildLeague) return;
    setSendingDiscord(true);
    setDiscordMsg("");

    try {
      await sendGuildLeagueToDiscord({
        guildLeagueId,
        guildLeague,
        rosterMembers: roster,
        teams,
        maxTeams,
        membersPerTeam,
        maxRoster,
        rosterCount: roster.length,
        teamCount: maxTeams,
        formattedDate: formatDate(guildLeague.matchDate || guildLeague.date),
      });
      showToast("Successfully broadcasted roster to Discord channel!");
      setDiscordMsg("Successfully pushed roster to Discord channel!");
    } catch (err) {
      console.error("Discord error:", err);
      showToast("Discord broadcast failed: " + err.message, "error");
      setDiscordMsg("Discord push error: " + err.message);
    } finally {
      setSendingDiscord(false);
    }
  };

  // Only show full loading spinner on initial page visit before any data is loaded
  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-red-700" />
      </div>
    );
  }

  if (error || !guildLeague) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        <p>{error || "Guild League event not found."}</p>
        <Link
          href="/admin/guild-leagues"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Guild Leagues</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP NAV & ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/guild-leagues"
            className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                {guildLeague.name}
              </h1>
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 uppercase">
                {guildLeague.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatDate(guildLeague.matchDate || guildLeague.date)} • VS:{" "}
              {guildLeague.opponent || "TBA"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/roster/${guildLeagueId}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <ExternalLink className="size-3.5" />
            <span>Public View</span>
          </Link>

          <button
            type="button"
            onClick={() => setCopyModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <Copy className="size-3.5" />
            <span>Copy Roster</span>
          </button>

          <button
            type="button"
            disabled={sendingDiscord}
            onClick={handleSendDiscord}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>{sendingDiscord ? "Pushing..." : "Push to Discord"}</span>
          </button>

          <select
            value={guildLeague.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800"
          >
            <option value="draft">Status: Draft</option>
            <option value="published">Status: Published</option>
            <option value="completed">Status: Completed</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>
        </div>
      </div>

      {discordMsg && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-medium text-indigo-900">
          {discordMsg}
        </div>
      )}

      {/* QUICK SUMMARY CARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-medium text-zinc-500">Roster Capacity</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {roster.length} / {maxRoster} Players
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500">Teams Configured</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {maxTeams} Teams ({membersPerTeam} slots each)
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500">Average Roster GS</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {roster.length > 0
              ? formatNumber(
                  Math.round(
                    roster.reduce(
                      (s, r) => s + (Number(r.gearScore) || 0),
                      0
                    ) / roster.length
                  )
                )
              : "—"}
          </div>
        </div>
      </div>

      {/* TEAMS AND SLOTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: maxTeams }, (_, index) => {
          const teamNumber = index + 1;
          const team = teams.find((t) => Number(t.teamNumber) === teamNumber);
          const teamMembers = roster
            .filter((r) => Number(r.teamNumber) === teamNumber)
            .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

          return (
            <div
              key={teamNumber}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              {/* TEAM HEADER */}
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/75 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                    T{teamNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {team?.name || `Team ${teamNumber}`}
                    </h3>
                    <span className="text-[11px] text-zinc-500">
                      {teamMembers.length} / {membersPerTeam} players assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={team?.lane?.toLowerCase() || ""}
                    onChange={(e) =>
                      handleLaneChange(teamNumber, e.target.value)
                    }
                    className="h-8 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-700"
                  >
                    <option value="">Select Lane</option>
                    {LANES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SLOTS LIST */}
              <div className="divide-y divide-zinc-100">
                {Array.from({ length: membersPerTeam }, (_, sIndex) => {
                  const slotNumber = sIndex + 1;
                  const member = teamMembers.find(
                    (m) => Number(m.slotNumber) === slotNumber
                  );

                  if (!member) {
                    return (
                      <div
                        key={slotNumber}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-zinc-50"
                      >
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span className="w-5 font-mono">#{slotNumber}</span>
                          <span className="italic">Empty Slot</span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setAssignSlot({ teamNumber, slotNumber })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-red-600 shadow-sm"
                        >
                          <UserPlus className="size-3" />
                          <span>Assign</span>
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slotNumber}
                      onClick={() => setSelectedMember(member)}
                      className="flex cursor-pointer items-center justify-between px-5 py-2.5 transition hover:bg-zinc-50"
                    >
                      <div className="flex min-w-0 items-center gap-3 text-xs">
                        <span className="w-5 font-mono font-bold text-zinc-400">
                          #{slotNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 truncate">
                            {member.nickname}
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                            <span>{member.className || "Unknown Class"}</span>
                            <span>•</span>
                            <span>Lv. {member.level || "—"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-900">
                          {formatNumber(member.gearScore)} GS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      <AssignRosterMemberModal
        open={Boolean(assignSlot)}
        guildLeagueId={guildLeagueId}
        teamNumber={assignSlot?.teamNumber}
        slotNumber={assignSlot?.slotNumber}
        assignedMemberIds={assignedMemberIds}
        onClose={() => setAssignSlot(null)}
        onSuccess={() => loadDetail(true)}
        onAssign={handleAssignMember}
      />

      <ManageRosterMemberModal
        open={Boolean(selectedMember)}
        guildLeagueId={guildLeagueId}
        member={selectedMember}
        maxTeams={maxTeams}
        membersPerTeam={membersPerTeam}
        rosterMembers={roster}
        onClose={() => setSelectedMember(null)}
        onSuccess={() => loadDetail(true)}
        onMove={handleMoveMember}
        onRemove={handleRemoveMember}
      />

      <CopyRosterModal
        open={copyModalOpen}
        targetLeagueId={guildLeagueId}
        onClose={() => setCopyModalOpen(false)}
        onSuccess={() => loadDetail(true)}
      />

      {/* FLOATING TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-zinc-900/10 bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === "error" ? (
            <AlertCircle className="size-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded-lg p-0.5 text-zinc-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
