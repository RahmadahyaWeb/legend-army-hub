"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Send,
  Shield,
  Swords,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
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
import { RosterDetailSkeleton } from "@/components/ui/LoadingState";
import { ClassBadge } from "@/utils/classColors";
import {
  getBaseLane,
  getLaneConfig,
  LANE_SELECT_GROUPS,
} from "@/utils/guildLeague";

const LANE_SECTIONS = [
  {
    id: "top",
    name: "Top Lane",
    icon: Swords,
    badgeBg: "bg-orange-50 border-orange-200 text-orange-800",
    pillActive: "bg-orange-600 text-white shadow-orange-600/25",
  },
  {
    id: "mid",
    name: "Mid Lane",
    icon: Shield,
    badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
    pillActive: "bg-blue-600 text-white shadow-blue-600/25",
  },
  {
    id: "bot",
    name: "Bottom Lane",
    icon: Zap,
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    pillActive: "bg-emerald-600 text-white shadow-emerald-600/25",
  },
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
  const [activeTab, setActiveTab] = useState("all");

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
  const totalAssigned = roster.length;
  const assignedMemberIds = roster.map((r) => r.memberId || r.id).filter(Boolean);

  const averageGearScore = useMemo(() => {
    if (roster.length === 0) return 0;
    const total = roster.reduce(
      (sum, m) => sum + (Number(m.gearScore) || 0),
      0
    );
    return Math.round(total / roster.length);
  }, [roster]);

  // Group all teams by lane (Top, Mid, Bot, or Unassigned)
  const allTeamNumbers = useMemo(() => {
    return Array.from({ length: maxTeams }, (_, i) => i + 1);
  }, [maxTeams]);

  const laneGroups = useMemo(() => {
    const map = {
      top: [],
      mid: [],
      bot: [],
      unassigned: [],
    };

    allTeamNumbers.forEach((tNum) => {
      const team = teams.find((t) => Number(t.teamNumber) === tNum);
      const laneKey = String(team?.lane || "").toLowerCase().trim();
      const base = getBaseLane(laneKey);
      if (base && map[base]) map[base].push(tNum);
      else map.unassigned.push(tNum);
    });

    return map;
  }, [allTeamNumbers, teams]);

  // Compute stats per lane
  const laneStats = useMemo(() => {
    const stats = {};
    ["top", "mid", "bot", "unassigned"].forEach((laneKey) => {
      const teamNumbers = laneGroups[laneKey] || [];
      const laneMembers = roster.filter((r) =>
        teamNumbers.includes(Number(r.teamNumber))
      );
      const capacity = teamNumbers.length * membersPerTeam;
      const totalGS = laneMembers.reduce(
        (acc, m) => acc + (Number(m.gearScore) || 0),
        0
      );
      const avgGS = laneMembers.length > 0 ? Math.round(totalGS / laneMembers.length) : 0;

      stats[laneKey] = {
        teamCount: teamNumbers.length,
        assignedCount: laneMembers.length,
        capacity,
        avgGS,
      };
    });
    return stats;
  }, [laneGroups, roster, membersPerTeam]);

  const handleStatusChange = async (newStatus) => {
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
      showToast(`Match status updated to ${newStatus.toUpperCase()}`);
      loadDetail(true);
    } catch (err) {
      console.error("Status update error:", err);
      showToast(err.message || "Failed to update status.", "error");
      loadDetail(true);
    }
  };

  const handleLaneChange = async (teamNumber, newLane) => {
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
      const cfg = getLaneConfig(newLane);
      showToast(
        `Team ${teamNumber} assigned to ${cfg ? cfg.label : "Unassigned"}`
      );
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

    const prevRoster = [...roster];

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

    // Filter out previous occupant of this slot or same player elsewhere in roster
    const filteredRoster = prevRoster.filter(
      (r) =>
        !(
          Number(r.teamNumber) === Number(targetTeam) &&
          Number(r.slotNumber) === Number(targetSlot)
        ) && String(r.memberId || r.id) !== String(member.id)
    );

    // Instant optimistic update
    setData((prev) =>
      prev ? { ...prev, roster: [...filteredRoster, newEntry] } : prev
    );
    showToast(`Assigned ${member.nickname} to Team ${targetTeam} (#${targetSlot})`);

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

    const targetOccupant = prevRoster.find(
      (r) =>
        Number(r.teamNumber) === Number(targetTeam) &&
        Number(r.slotNumber) === Number(targetSlot) &&
        String(r.memberId || r.id) !== String(member.memberId || member.id)
    );

    if (targetOccupant) {
      // SWAP POSITIONS
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
        if (
          Number(r.teamNumber) === Number(targetTeam) &&
          Number(r.slotNumber) === Number(targetSlot)
        ) {
          return {
            ...r,
            teamNumber: Number(member.teamNumber),
            slotNumber: Number(member.slotNumber),
          };
        }
        return r;
      });

      setData((prev) => (prev ? { ...prev, roster: updatedRoster } : prev));
      setSelectedMember(null);
      showToast(
        `Swapped ${member.nickname} with ${targetOccupant.nickname}`
      );

      try {
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
        loadDetail(true);
      } catch (err) {
        console.error("Swap error:", err);
        setData((prev) => (prev ? { ...prev, roster: prevRoster } : prev));
        showToast(err.message || "Failed to swap members.", "error");
      }
    } else {
      // MOVE TO EMPTY SLOT
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
      showToast(`Moved ${member.nickname} to Team ${targetTeam} (#${targetSlot})`);

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
    showToast(`Removed ${member.nickname} from Team ${member.teamNumber} (#${member.slotNumber})`);

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

  if (loading && !data) {
    return <RosterDetailSkeleton />;
  }

  if (error || !guildLeague) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        <p>{error || "Guild League event not found."}</p>
        <Link
          href="/admin/guild-leagues"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Guild Leagues</span>
        </Link>
      </div>
    );
  }

  const matchDate = guildLeague.matchDate || guildLeague.date;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* TOP BAR / ACTIONS */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/guild-leagues"
            className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 shadow-xs transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Guild League Admin
              </span>
              <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.2 text-[10px] font-black text-red-700 uppercase">
                {guildLeague.status || "DRAFT"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Manage lineup formations, battlefield lanes, and tactical assignments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link
            href={`/roster/${guildLeagueId}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
          >
            <ExternalLink className="size-3.5" />
            <span>Public View</span>
          </Link>

          <button
            type="button"
            onClick={() => setCopyModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
          >
            <Copy className="size-3.5" />
            <span>Copy Roster</span>
          </button>

          <button
            type="button"
            disabled={sendingDiscord}
            onClick={handleSendDiscord}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 active:scale-95 transition disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>{sendingDiscord ? "Pushing..." : "Push to Discord"}</span>
          </button>

          <select
            value={guildLeague.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800 shadow-xs focus:border-red-600 focus:outline-none"
          >
            <option value="draft">Status: Draft</option>
            <option value="published">Status: Published</option>
            <option value="completed">Status: Completed</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>
        </div>
      </div>

      {discordMsg && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-medium text-indigo-900 flex items-center justify-between">
          <span>{discordMsg}</span>
          <button
            type="button"
            onClick={() => setDiscordMsg("")}
            className="text-indigo-600 hover:text-indigo-800 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* HERO MATCH CARD - EXACT MATCH WITH PUBLIC ROSTER */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-red-700 uppercase tracking-widest">
              <Swords className="size-3.5 sm:size-4" />
              <span>Guild League Lineup & Roster</span>
            </div>
            <h1 className="mt-1 text-xl font-black text-zinc-900 sm:text-3xl lg:text-4xl tracking-tight">
              {guildLeague.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <span>{formatDate(matchDate)}</span>
              </div>
              {guildLeague.opponent && (
                <div className="flex items-center gap-1 font-bold text-zinc-900">
                  <span>Opponent: {guildLeague.opponent}</span>
                </div>
              )}
            </div>
          </div>

          {/* QUICK STATS - EXACT 3-COLUMN GRID AS PUBLIC ROSTER */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                Total Roster
              </div>
              <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                {totalAssigned}/{maxRoster}
              </div>
              <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                {Math.round((totalAssigned / (maxRoster || 1)) * 100)}% Deployed
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                Average GS
              </div>
              <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
              </div>
              <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                Guild Power
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-zinc-200 bg-zinc-50/75 p-2.5 sm:p-4 text-center sm:text-left min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                Active Teams
              </div>
              <div className="mt-0.5 text-sm sm:text-xl font-black text-zinc-900 truncate">
                {maxTeams} Teams
              </div>
              <div className="text-[9px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
                3 Lanes
              </div>
            </div>
          </div>
        </div>

        {guildLeague.notes && (
          <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-700 border border-zinc-200 leading-relaxed">
            <strong className="text-zinc-900">Tactical Strategy / Briefing: </strong>
            {guildLeague.notes}
          </div>
        )}

        {/* LANE FILTER TABS */}
        <div className="mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-zinc-100 pt-3.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
              activeTab === "all"
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            All Lanes ({totalAssigned}/{maxRoster})
          </button>

          {LANE_SECTIONS.map((lane) => {
            const stat = laneStats[lane.id];
            const isActive = activeTab === lane.id;
            const Icon = lane.icon;

            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => setActiveTab(lane.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
                  isActive
                    ? lane.pillActive
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{lane.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {stat?.assignedCount || 0}
                </span>
              </button>
            );
          })}

          {laneGroups.unassigned.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("unassigned")}
              className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition shadow-xs ${
                activeTab === "unassigned"
                  ? "bg-zinc-800 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Unassigned ({laneStats.unassigned?.assignedCount || 0})
            </button>
          )}
        </div>
      </div>

      {/* TACTICAL DIRECTIVES BAR - MATCH PUBLIC ROSTER */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
          <div className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
              👑
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                <span>MVP Strike</span>
                <span className="shrink-0 font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">18:00 & 08:00</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                Regroup at MVP spawn at 18:00 & 08:00 to secure boss kill.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800 text-sm border border-orange-200">
              🛡️
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                <span>Lane Defense</span>
                <span className="shrink-0 text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 uppercase font-bold">Skip MVP</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                Hold lane defense & delay enemy advance at the MVP portal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-800 text-sm border border-red-200">
              ⚔️
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
                <span>Lane Assault</span>
                <span className="shrink-0 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 uppercase font-bold">Siege</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                Push enemy lane and breach defensive barricades.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 BATTLEFIELD LANE SECTIONS */}
      <div className="space-y-4 sm:space-y-6">
        {LANE_SECTIONS.map((lane) => {
          if (activeTab !== "all" && activeTab !== lane.id) return null;

          const teamNumbers = laneGroups[lane.id] || [];
          const stat = laneStats[lane.id];
          const Icon = lane.icon;

          return (
            <section
              key={lane.id}
              id={`lane-${lane.id}`}
              className="space-y-3 sm:space-y-4 animate-in fade-in duration-200"
            >
              {/* LANE HEADER */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800">
                      <Icon className="size-4" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                      {lane.name}
                    </h2>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-zinc-600">
                    {teamNumbers.length} {teamNumbers.length === 1 ? "Team" : "Teams"}
                  </span>
                </div>

                {/* FORMATION STATS */}
                <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] sm:text-xs">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
                    <span>Formation: </span>
                    <strong className="text-zinc-900 font-bold">
                      {stat?.assignedCount || 0} / {stat?.capacity || 0}
                    </strong>
                  </div>
                  {stat?.avgGS > 0 && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1 text-zinc-600 font-medium">
                      <span>Avg GS: </span>
                      <strong className="text-zinc-900 font-bold font-mono">
                        {formatNumber(stat.avgGS)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* TEAMS GRID */}
              {teamNumbers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 sm:p-8 text-center text-xs text-zinc-500">
                  No teams currently assigned to {lane.name}. Select a team's lane dropdown to position them here.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:gap-5 lg:grid-cols-2">
                  {teamNumbers.map((teamNumber) => {
                    const team = teams.find(
                      (t) => Number(t.teamNumber) === teamNumber
                    );
                    const laneConfig = getLaneConfig(team?.lane);
                    const teamMembers = roster
                      .filter((r) => Number(r.teamNumber) === teamNumber)
                      .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

                    const teamAvgGS =
                      teamMembers.length > 0
                        ? Math.round(
                            teamMembers.reduce(
                              (s, m) => s + (Number(m.gearScore) || 0),
                              0
                            ) / teamMembers.length
                          )
                        : 0;

                    return (
                      <div
                        key={teamNumber}
                        className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs hover:shadow-md transition"
                      >
                        {/* TEAM CARD HEADER */}
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/75 p-3.5 sm:px-5 sm:py-4">
                          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white shadow-xs">
                              T{teamNumber}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                  {team?.name || `Team ${teamNumber}`}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500">
                                <span className="font-semibold text-zinc-700">
                                  {teamMembers.length}/{membersPerTeam} Players
                                </span>
                                <span>•</span>
                                <span>
                                  {Math.round(
                                    (teamMembers.length / (membersPerTeam || 1)) * 100
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {teamAvgGS > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-bold text-zinc-800 shadow-xs">
                                <Shield className="size-3 text-zinc-400" />
                                <span>{formatNumber(teamAvgGS)} GS</span>
                              </span>
                            )}

                            {/* LANE SELECTOR DROPDOWN */}
                            <select
                              value={team?.lane?.toLowerCase() || ""}
                              onChange={(e) =>
                                handleLaneChange(teamNumber, e.target.value)
                              }
                              className={`h-8 rounded-xl border px-2.5 text-xs font-bold shadow-xs focus:outline-none ${
                                laneConfig
                                  ? laneConfig.badgeClassName
                                  : "border-zinc-300 bg-white text-zinc-700"
                              }`}
                            >
                              <option value="">Unassigned Lane</option>
                              {LANE_SELECT_GROUPS.map((grp) => (
                                <optgroup key={grp.group} label={grp.group}>
                                  {grp.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* TACTICAL DUTY BANNER */}
                        {laneConfig?.tacticalType === "mvp" && (
                          <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/80 px-3.5 sm:px-5 py-2 text-[11px] sm:text-xs text-amber-950 font-medium">
                            <span className="shrink-0 text-sm">👑</span>
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-amber-900">MVP: </span>
                              <span>Regroup at MVP spawn at <strong>18:00</strong> & <strong>08:00</strong></span>
                            </div>
                          </div>
                        )}

                        {laneConfig?.tacticalType === "defend" && (
                          <div className="flex items-center gap-2 border-b border-orange-200/70 bg-orange-50/80 px-3.5 sm:px-5 py-2 text-[11px] sm:text-xs text-orange-950 font-medium">
                            <span className="shrink-0 text-sm">🛡️</span>
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-orange-900">Defend: </span>
                              <span>Hold lane (Skip MVP) & delay enemy at portal</span>
                            </div>
                          </div>
                        )}

                        {laneConfig?.tacticalType === "attack" && (
                          <div className="flex items-center gap-2 border-b border-red-200/70 bg-red-50/80 px-3.5 sm:px-5 py-2 text-[11px] sm:text-xs text-red-950 font-medium">
                            <span className="shrink-0 text-sm">⚔️</span>
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-red-900">Attack: </span>
                              <span>Push enemy lane and breach defensive barricades</span>
                            </div>
                          </div>
                        )}

                        {/* PLAYER SLOTS */}
                        <div className="flex-1 divide-y divide-zinc-100">
                          {Array.from({ length: membersPerTeam }, (_, sIdx) => {
                            const slotNumber = sIdx + 1;
                            const member = teamMembers.find(
                              (m) => Number(m.slotNumber) === slotNumber
                            );

                            if (!member) {
                              return (
                                <div
                                  key={slotNumber}
                                  onClick={() =>
                                    setAssignSlot({ teamNumber, slotNumber })
                                  }
                                  className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-5 py-2 text-xs text-zinc-400 bg-zinc-50/20 hover:bg-red-50/30 transition"
                                >
                                  <div className="flex items-center gap-2.5 sm:gap-3">
                                    <span className="w-4 sm:w-5 text-zinc-300 font-mono text-[10px] sm:text-[11px]">
                                      #{slotNumber}
                                    </span>
                                    <span className="italic text-zinc-400 text-[11px] group-hover:text-zinc-600 transition">
                                      Empty Slot
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssignSlot({ teamNumber, slotNumber });
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 shadow-xs group-hover:border-red-300 group-hover:bg-red-600 group-hover:text-white transition"
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
                                className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-5 py-2 text-xs transition hover:bg-zinc-50/90"
                              >
                                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                  <span className="w-4 sm:w-5 font-bold font-mono text-[10px] sm:text-[11px] text-zinc-400 group-hover:text-zinc-700">
                                    #{slotNumber}
                                  </span>
                                  <div className="min-w-0 pr-2">
                                    <div className="truncate font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-red-700 transition">
                                      {member.nickname}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                      <ClassBadge
                                        className={member.className}
                                        size="xs"
                                      />
                                      {Number(member.level) > 0 && (
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                          Lv. {member.level}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 text-right">
                                  {Number(member.gearScore) > 0 && (
                                    <span className="font-bold text-zinc-900 font-mono text-[11px] sm:text-xs">
                                      {formatNumber(member.gearScore)} GS
                                    </span>
                                  )}

                                  {/* QUICK ACTION BUTTONS */}
                                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      title="Relocate / Swap slot"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMember(member);
                                      }}
                                      className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 transition"
                                    >
                                      <ArrowRightLeft className="size-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Remove from roster"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveMember(member);
                                      }}
                                      className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* UNASSIGNED TEAMS SECTION */}
        {(activeTab === "all" || activeTab === "unassigned") &&
          laneGroups.unassigned.length > 0 && (
            <section className="space-y-3 sm:space-y-4 border-t border-zinc-200 pt-5 sm:pt-6">
              <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-zinc-900">
                      Reserve / Unassigned Formations
                    </h2>
                  </div>
                </div>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-zinc-600">
                  {laneGroups.unassigned.length} Teams
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:gap-5 lg:grid-cols-2">
                {laneGroups.unassigned.map((teamNumber) => {
                  const team = teams.find(
                    (t) => Number(t.teamNumber) === teamNumber
                  );
                  const laneConfig = getLaneConfig(team?.lane);
                  const teamMembers = roster
                    .filter((r) => Number(r.teamNumber) === teamNumber)
                    .sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

                  const teamAvgGS =
                    teamMembers.length > 0
                      ? Math.round(
                          teamMembers.reduce(
                            (s, m) => s + (Number(m.gearScore) || 0),
                            0
                          ) / teamMembers.length
                        )
                      : 0;

                  return (
                    <div
                      key={teamNumber}
                      className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/75 p-3.5 sm:px-5 sm:py-4">
                        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                          <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-black text-white shadow-xs">
                            T{teamNumber}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                              {team?.name || `Team ${teamNumber}`}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500">
                              <span className="font-semibold text-zinc-700">
                                {teamMembers.length}/{membersPerTeam} Players
                              </span>
                            </div>
                          </div>
                        </div>

                        <select
                          value={team?.lane?.toLowerCase() || ""}
                          onChange={(e) =>
                            handleLaneChange(teamNumber, e.target.value)
                          }
                          className="h-8 rounded-xl border border-zinc-300 bg-white px-2.5 text-xs font-bold text-zinc-700 shadow-xs focus:outline-none"
                        >
                          <option value="">Unassigned Lane</option>
                          {LANE_SELECT_GROUPS.map((grp) => (
                            <optgroup key={grp.group} label={grp.group}>
                              {grp.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 divide-y divide-zinc-100">
                        {Array.from({ length: membersPerTeam }, (_, sIdx) => {
                          const slotNumber = sIdx + 1;
                          const member = teamMembers.find(
                            (m) => Number(m.slotNumber) === slotNumber
                          );

                          if (!member) {
                            return (
                              <div
                                key={slotNumber}
                                onClick={() =>
                                  setAssignSlot({ teamNumber, slotNumber })
                                }
                                className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-5 py-2 text-xs text-zinc-400 bg-zinc-50/20 hover:bg-red-50/30 transition"
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                  <span className="w-4 sm:w-5 text-zinc-300 font-mono text-[10px] sm:text-[11px]">
                                    #{slotNumber}
                                  </span>
                                  <span className="italic text-zinc-400 text-[11px]">
                                    Empty Slot
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignSlot({ teamNumber, slotNumber });
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 shadow-xs group-hover:bg-red-600 group-hover:text-white transition"
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
                              className="group flex cursor-pointer items-center justify-between px-3.5 sm:px-5 py-2 text-xs transition hover:bg-zinc-50"
                            >
                              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                <span className="w-4 sm:w-5 font-bold font-mono text-[10px] sm:text-[11px] text-zinc-400 group-hover:text-zinc-700">
                                  #{slotNumber}
                                </span>
                                <div className="min-w-0 pr-2">
                                  <div className="truncate font-bold text-zinc-900 text-xs sm:text-sm group-hover:text-red-700 transition">
                                    {member.nickname}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <ClassBadge
                                      className={member.className}
                                      size="xs"
                                    />
                                    {Number(member.level) > 0 && (
                                      <span className="text-[10px] text-zinc-400 font-medium">
                                        Lv. {member.level}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 text-right">
                                {Number(member.gearScore) > 0 && (
                                  <span className="font-bold text-zinc-900 font-mono text-[11px] sm:text-xs">
                                    {formatNumber(member.gearScore)} GS
                                  </span>
                                )}

                                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMember(member);
                                    }}
                                    className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 transition"
                                  >
                                    <ArrowRightLeft className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMember(member);
                                    }}
                                    className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
      </div>

      {/* MODALS */}
      <AssignRosterMemberModal
        open={Boolean(assignSlot)}
        guildLeagueId={guildLeagueId}
        teamNumber={assignSlot?.teamNumber}
        slotNumber={assignSlot?.slotNumber}
        maxTeams={maxTeams}
        membersPerTeam={membersPerTeam}
        rosterMembers={roster}
        assignedMemberIds={assignedMemberIds}
        onClose={() => setAssignSlot(null)}
        onSuccess={() => loadDetail(true)}
        onAssign={handleAssignMember}
        onSelectSlot={(slot) => setAssignSlot(slot)}
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
      {toast && !assignSlot && !selectedMember && !copyModalOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl border border-zinc-900/10 bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-200">
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
