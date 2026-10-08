"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Castle,
  Copy,
  ExternalLink,
  Layers,
  Send,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import {
  fetchGuildLeagueDetail,
  updateGuildLeague,
  updateTeamInfo,
  assignRosterMember,
  removeRosterMember,
} from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
import Loading from "@/components/ui/Loading";
import GuildLeagueHeaderCard from "@/components/guild-league/GuildLeagueHeaderCard";
import TacticalDirectivesBar from "@/components/guild-league/TacticalDirectivesBar";
import LaneGroupSection from "@/components/guild-league/LaneGroupSection";
import TeamCard from "@/components/guild-league/TeamCard";
import AssignRosterMemberModal from "@/components/guild-league/AssignRosterMemberModal";
import ManageRosterMemberModal from "@/components/guild-league/ManageRosterMemberModal";
import CopyRosterModal from "@/components/guild-league/CopyRosterModal";
import { sendGuildLeagueToDiscord } from "@/services/guild-league/guildLeagueDiscordService";
import { getBaseLane, getLaneConfig } from "@/utils/guildLeague";
import { formatDate } from "@/utils/formatters";

const LANE_SECTIONS = [
  {
    id: "top",
    name: "Top Lane",
    icon: Swords,
  },
  {
    id: "mid",
    name: "Mid Lane",
    icon: Shield,
  },
  {
    id: "bot",
    name: "Bottom Lane",
    icon: Zap,
  },
];

/**
 * Guild League Lineup & Roster Management Page
 *
 * Why this exists:
 * The command hub where Guild Leaders & Officers manage match lineups,
 * assign members to tactical lanes (Top/Mid/Bot/Reserve), adjust formations,
 * and push real-time broadcasts to the guild Discord server.
 */
export default function GuildLeagueDetailPage() {
  const params = useParams();
  const guildLeagueId = params?.guildLeagueId;
  const { success, error: toastError } = useToast();

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

  // In-flight mutations counter to prevent race conditions during rapid actions
  const inFlightOpsRef = useRef(0);

  /**
   * Fetches full match details, team definitions, and roster assignments.
   * @param {boolean} [silent=false] - Suppress full screen loading indicator
   */
  const loadDetail = async (silent = false) => {
    if (!guildLeagueId) return;

    try {
      if (!silent && !data) {
        setLoading(true);
      }
      const res = await fetchGuildLeagueDetail(guildLeagueId);
      // Only set full state if no rapid mutations are currently in flight
      if (inFlightOpsRef.current === 0) {
        setData(res);
      }
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

  const eventType = guildLeague?.eventType || "guild_league";
  const isWoe = eventType === "woe";
  // Why this exists: Polarity requires a unified 10-team structure without 3-lane division
  const isPolarity = eventType === "polarity";
  const isUnified = isWoe || isPolarity;
  const maxTeams = Number(guildLeague?.maxTeams) || (isPolarity ? 10 : 2);
  const membersPerTeam = Number(guildLeague?.membersPerTeam) || (isPolarity ? 5 : 10);
  const maxRoster = Number(guildLeague?.maxRoster) || maxTeams * membersPerTeam;
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

  // Compute aggregated stats per lane
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

  /**
   * Updates match status (Draft, Published, Completed, Cancelled)
   */
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
      success("Match status updated", `Status changed to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Status update error:", err);
      toastError("Failed to update status", err.message);
      loadDetail(true);
    }
  };

  /**
   * Changes tactical lane assignment for a team
   */
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
      success(
        "Lane assignment saved",
        `Team ${teamNumber} positioned on ${cfg ? cfg.label : "Unassigned"}`
      );
    } catch (err) {
      console.error("Lane change error:", err);
      toastError("Failed to update lane", err.message);
      loadDetail(true);
    }
  };

  /**
   * Assigns a player to a specific team slot with optimistic updates
   */
  const handleAssignMember = async (member, targetTeamArg, targetSlotArg) => {
    if (!member) return;
    const targetTeam = Number(targetTeamArg ?? assignSlot?.teamNumber);
    const targetSlot = Number(targetSlotArg ?? assignSlot?.slotNumber);
    if (!targetTeam || !targetSlot) return;

    const memberNickKey = member.nickname?.toLowerCase().trim();

    // 1. Instant functional state update (safeguard against stale closures)
    setData((prev) => {
      if (!prev) return prev;
      const currentRoster = prev.roster || [];
      const newEntry = {
        id: member.id,
        memberId: member.id,
        nickname: member.nickname,
        className: member.className,
        level: Number(member.level) || 0,
        gearScore: Number(member.gearScore) || 0,
        teamNumber: targetTeam,
        slotNumber: targetSlot,
      };

      // Remove previous occupant of this slot or this member anywhere else
      const updatedRoster = currentRoster.filter(
        (r) =>
          !(Number(r.teamNumber) === targetTeam && Number(r.slotNumber) === targetSlot) &&
          String(r.memberId || r.id) !== String(member.id) &&
          (!memberNickKey || r.nickname?.toLowerCase().trim() !== memberNickKey)
      );

      return {
        ...prev,
        roster: [...updatedRoster, newEntry],
      };
    });

    success(
      "Player assigned",
      `Assigned ${member.nickname} to Team ${targetTeam} (#${targetSlot})`
    );

    // 2. Async backend persistence without wiping newer in-flight states
    inFlightOpsRef.current += 1;
    try {
      await assignRosterMember(guildLeagueId, {
        memberId: member.id,
        nickname: member.nickname,
        className: member.className,
        level: member.level,
        gearScore: member.gearScore,
        teamNumber: targetTeam,
        slotNumber: targetSlot,
      });
    } catch (err) {
      console.error("Assign error:", err);
      toastError("Failed to assign player", err.message);
      loadDetail(true);
    } finally {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
    }
  };

  /**
   * Relocates or mutually swaps a player's position
   */
  const handleMoveMember = async (member, targetTeam, targetSlot) => {
    if (!member) return;
    const tTeam = Number(targetTeam);
    const tSlot = Number(targetSlot);
    const sTeam = Number(member.teamNumber);
    const sSlot = Number(member.slotNumber);

    let targetOccupant = null;

    setData((prev) => {
      if (!prev) return prev;
      const currentRoster = prev.roster || [];
      targetOccupant = currentRoster.find(
        (r) =>
          Number(r.teamNumber) === tTeam &&
          Number(r.slotNumber) === tSlot &&
          String(r.memberId || r.id) !== String(member.memberId || member.id)
      );

      if (targetOccupant) {
        // Swap positions
        const updated = currentRoster.map((r) => {
          if (Number(r.teamNumber) === sTeam && Number(r.slotNumber) === sSlot) {
            return { ...r, teamNumber: tTeam, slotNumber: tSlot };
          }
          if (Number(r.teamNumber) === tTeam && Number(r.slotNumber) === tSlot) {
            return { ...r, teamNumber: sTeam, slotNumber: sSlot };
          }
          return r;
        });
        return { ...prev, roster: updated };
      } else {
        // Move to empty slot
        const updated = currentRoster.map((r) => {
          if (Number(r.teamNumber) === sTeam && Number(r.slotNumber) === sSlot) {
            return { ...r, teamNumber: tTeam, slotNumber: tSlot };
          }
          return r;
        });
        return { ...prev, roster: updated };
      }
    });

    setSelectedMember(null);
    success(
      "Position updated",
      `Relocated ${member.nickname} to Team ${tTeam} (#${tSlot})`
    );

    inFlightOpsRef.current += 1;
    try {
      if (targetOccupant) {
        await Promise.all([
          assignRosterMember(guildLeagueId, {
            memberId: member.memberId || member.id,
            nickname: member.nickname,
            className: member.className,
            level: member.level,
            gearScore: member.gearScore,
            teamNumber: tTeam,
            slotNumber: tSlot,
          }),
          assignRosterMember(guildLeagueId, {
            memberId: targetOccupant.memberId || targetOccupant.id,
            nickname: targetOccupant.nickname,
            className: targetOccupant.className,
            level: targetOccupant.level,
            gearScore: targetOccupant.gearScore,
            teamNumber: sTeam,
            slotNumber: sSlot,
          }),
        ]);
      } else {
        await removeRosterMember(guildLeagueId, sTeam, sSlot);
        await assignRosterMember(guildLeagueId, {
          memberId: member.memberId || member.id,
          nickname: member.nickname,
          className: member.className,
          level: member.level,
          gearScore: member.gearScore,
          teamNumber: tTeam,
          slotNumber: tSlot,
        });
      }
    } catch (err) {
      console.error("Move error:", err);
      toastError("Failed to relocate player", err.message);
      loadDetail(true);
    } finally {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
    }
  };

  /**
   * Removes a member from the active roster
   */
  const handleRemoveMember = async (member) => {
    if (!member) return;
    const tTeam = Number(member.teamNumber);
    const tSlot = Number(member.slotNumber);

    setData((prev) => {
      if (!prev) return prev;
      const currentRoster = prev.roster || [];
      const updated = currentRoster.filter(
        (r) => !(Number(r.teamNumber) === tTeam && Number(r.slotNumber) === tSlot)
      );
      return { ...prev, roster: updated };
    });

    setSelectedMember(null);
    success("Player removed", `Removed ${member.nickname} from the roster.`);

    inFlightOpsRef.current += 1;
    try {
      await removeRosterMember(guildLeagueId, tTeam, tSlot);
    } catch (err) {
      console.error("Remove error:", err);
      toastError("Failed to remove player", err.message);
      loadDetail(true);
    } finally {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
    }
  };

  /**
   * Dispatches match roster embed to Discord webhook worker
   */
  const handleSendDiscord = async () => {
    if (!guildLeague) return;
    setSendingDiscord(true);
    setDiscordMsg("");

    const eventLabel =
      eventType === "woe"
        ? "War of Emperium"
        : eventType === "polarity"
        ? "Polarity (10 Teams)"
        : "Guild League";

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
      success("Discord broadcast sent", `${eventLabel} lineup pushed to Discord channel.`);
      setDiscordMsg(`Successfully pushed ${eventLabel} roster to Discord channel!`);
    } catch (err) {
      console.error("Discord error:", err);
      toastError("Discord push failed", err.message);
      setDiscordMsg("Discord push error: " + err.message);
    } finally {
      setSendingDiscord(false);
    }
  };

  if (loading && !data) {
    return <Loading message="Loading event details..." />;
  }

  if (error || !guildLeague) {
    return (
      <div className="border-2 border-red-600 bg-red-50 p-6 text-center text-sm font-mono text-red-700 shadow-[3px_3px_0px_#b91c1c]">
        <p className="font-bold">{error || "Guild League event not found."}</p>
        <Link
          href="/admin/guild-leagues"
          className="mt-4 inline-flex items-center gap-2 border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-sans font-bold text-white hover:bg-zinc-800 transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  // Define tab navigation elements
  const tabsList = [
    {
      id: "all",
      label: `All Lanes (${totalAssigned}/${maxRoster})`,
    },
    ...LANE_SECTIONS.map((l) => ({
      id: l.id,
      label: l.name,
      icon: l.icon,
      count: laneStats[l.id]?.assignedCount || 0,
    })),
    ...(laneGroups.unassigned.length > 0
      ? [
          {
            id: "unassigned",
            label: "Unassigned",
            icon: Layers,
            count: laneStats.unassigned?.assignedCount || 0,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* TOP HEADER / ACTION BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/guild-leagues"
            className="flex size-9 items-center justify-center border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50 transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
            title="Back to matches"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-sans text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                {guildLeague.name}
              </h1>
              <span className="border-2 border-zinc-950 px-2 py-0.5 text-[11px] font-mono uppercase font-bold tracking-wider bg-zinc-100 text-zinc-900 comic-shadow-sm">
                {guildLeague.status || "DRAFT"}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              Lineup formations, team coordination, and tactical assignments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/roster/${guildLeagueId}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 border-2 border-zinc-950 bg-white px-3 text-xs font-bold text-zinc-900 hover:bg-zinc-100 transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ExternalLink className="size-3.5" />
            <span>Public View</span>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCopyModalOpen(true)}
          >
            Copy Roster
          </Button>

          <Button
            variant="discord"
            size="sm"
            loading={sendingDiscord}
            onClick={handleSendDiscord}
          >
            {sendingDiscord ? "Broadcasting..." : "Push to Discord"}
          </Button>

          <Select
            value={guildLeague.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="!h-9 !py-0 !text-xs font-bold"
          >
            <option value="draft">Status: Draft</option>
            <option value="published">Status: Published</option>
            <option value="completed">Status: Completed</option>
            <option value="cancelled">Status: Cancelled</option>
          </Select>
        </div>
      </div>

      {discordMsg && (
        <div className="border-2 border-indigo-900 bg-indigo-50 p-3 text-xs font-bold text-indigo-950 comic-shadow-sm flex items-center justify-between">
          <span>{discordMsg}</span>
          <button
            type="button"
            onClick={() => setDiscordMsg("")}
            className="text-indigo-800 hover:text-indigo-950 text-xs font-bold px-1.5 py-0.5 border border-indigo-900 bg-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* HERO MATCH SUMMARY & STATS CARD */}
      <GuildLeagueHeaderCard
        guildLeague={guildLeague}
        totalAssigned={totalAssigned}
        maxRoster={maxRoster}
        averageGearScore={averageGearScore}
        maxTeams={maxTeams}
        actions={
          !isUnified && (
            <div className="mt-4 border-t-2 border-zinc-200 pt-3.5">
              <Tabs
                tabs={tabsList}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
          )
        }
      />

      {/* TACTICAL DIRECTIVES BAR (Guild League 3-lane format only) */}
      {!isUnified && <TacticalDirectivesBar eventType={eventType} />}

      {/* BATTLEFIELD TEAMS / LANE SECTIONS */}
      {isPolarity ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-4 comic-shadow">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 comic-shadow-sm">
                <Layers className="size-4.5" />
              </div>
              <div>
                <h2 className="font-sans text-base sm:text-lg font-black text-zinc-950 uppercase tracking-wide">
                  Polarity Battle Formations
                </h2>
                <p className="text-xs text-zinc-600">
                  Fixed 10 Squads (5 Players / Squad) • Coordinated 50-Player Lineup
                </p>
              </div>
            </div>
            <span className="border-2 border-zinc-950 bg-zinc-100 px-2.5 py-1 text-xs font-mono font-bold text-zinc-950 self-start sm:self-center comic-shadow-sm">
              {totalAssigned}/50 Players Deployed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allTeamNumbers.map((tNum) => {
              const team = teams.find((t) => Number(t.teamNumber) === tNum);
              const teamMembers = roster.filter(
                (r) => Number(r.teamNumber) === tNum
              );

              return (
                <TeamCard
                  key={tNum}
                  teamNumber={tNum}
                  team={team}
                  teamMembers={teamMembers}
                  membersPerTeam={membersPerTeam}
                  isPolarity={true}
                  onAssignSlot={(slot) => setAssignSlot(slot)}
                  onSelectMember={(member) => setSelectedMember(member)}
                  onRemoveMember={handleRemoveMember}
                />
              );
            })}
          </div>
        </div>
      ) : isWoe ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-950 bg-white p-4 comic-shadow">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-zinc-950 comic-shadow-sm">
                <Castle className="size-4.5" />
              </div>
              <div>
                <h2 className="font-sans text-base sm:text-lg font-black text-zinc-950 uppercase tracking-wide">
                  WOE Battle Formations
                </h2>
                <p className="text-xs text-zinc-600 font-mono">
                  {maxTeams} Squad Formations • Unified Team Formations (No 3-Lane Division)
                </p>
              </div>
            </div>
            <span className="border-2 border-zinc-900 bg-zinc-100 px-2.5 py-1 text-xs font-mono font-bold text-zinc-950 self-start sm:self-center comic-shadow-sm">
              {totalAssigned}/{maxRoster} Players Deployed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {allTeamNumbers.map((tNum) => {
              const team = teams.find((t) => Number(t.teamNumber) === tNum);
              const teamMembers = roster.filter(
                (r) => Number(r.teamNumber) === tNum
              );

              return (
                <TeamCard
                  key={tNum}
                  teamNumber={tNum}
                  team={team}
                  teamMembers={teamMembers}
                  membersPerTeam={membersPerTeam}
                  isWoe={true}
                  onAssignSlot={(slot) => setAssignSlot(slot)}
                  onSelectMember={(member) => setSelectedMember(member)}
                  onRemoveMember={handleRemoveMember}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {LANE_SECTIONS.map((lane) => {
            if (activeTab !== "all" && activeTab !== lane.id) return null;

            return (
              <LaneGroupSection
                key={lane.id}
                id={lane.id}
                name={lane.name}
                icon={lane.icon}
                teamNumbers={laneGroups[lane.id] || []}
                teams={teams}
                roster={roster}
                stat={laneStats[lane.id]}
                membersPerTeam={membersPerTeam}
                onLaneChange={handleLaneChange}
                onAssignSlot={(slot) => setAssignSlot(slot)}
                onSelectMember={(member) => setSelectedMember(member)}
                onRemoveMember={handleRemoveMember}
              />
            );
          })}

          {/* RESERVE / UNASSIGNED TEAMS SECTION */}
          {(activeTab === "all" || activeTab === "unassigned") &&
            laneGroups.unassigned.length > 0 && (
              <LaneGroupSection
                id="unassigned"
                name="Reserve / Unassigned Formations"
                icon={Layers}
                teamNumbers={laneGroups.unassigned}
                teams={teams}
                roster={roster}
                stat={laneStats.unassigned}
                membersPerTeam={membersPerTeam}
                onLaneChange={handleLaneChange}
                onAssignSlot={(slot) => setAssignSlot(slot)}
                onSelectMember={(member) => setSelectedMember(member)}
                onRemoveMember={handleRemoveMember}
              />
            )}
        </div>
      )}

      {/* ACTION MODALS */}
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
    </div>
  );
}
