import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Copy, ExternalLink } from "lucide-react";

import AssignRosterMemberModal from "../components/guild-league/AssignRosterMemberModal";
import ManageRosterMemberModal from "../components/guild-league/ManageRosterMemberModal";
import CopyRosterModal from "../components/guild-league/CopyRosterModal";
import LaneSection from "../components/guild-league/LaneSection";
import GuildLeagueStatusControl, {
  GuildLeagueStatusBadge,
} from "../components/guild-league/GuildLeagueStatusControl";

import { useToast } from "../components/ui/ToastProvider";

import useGuildLeagueDetail from "../hooks/guild-league/useGuildLeagueDetail";

import {
  removeRosterMember,
  updateGuildLeagueStatus,
  updateTeamLane,
} from "../services/guild-league/guildLeagueRosterService";

import { sendGuildLeagueToDiscord } from "../services/guild-league/guildLeagueDiscordService";

import { LANE_CONFIG, STATUS_CONFIG } from "../utils/guildLeague";

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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function GuildLeagueDetail() {
  const { guildLeagueId } = useParams();

  const toast = useToast();

  const {
    guildLeague,
    rosterMembers,
    teams,

    maxTeams,
    membersPerTeam,
    maxRoster,

    teamLaneMap,
    teamGroups,

    rosterCount,
    teamCount,
    assignedMemberIds,
    rosterPercentage,
    openSlots,

    loading,
    notFound,

    eventError,
    rosterError,
    teamsError,
  } = useGuildLeagueDetail(guildLeagueId);

  const [assignSlot, setAssignSlot] = useState(null);

  const [selectedMember, setSelectedMember] = useState(null);

  const [copyRosterOpen, setCopyRosterOpen] = useState(false);

  const [removingMemberId, setRemovingMemberId] = useState(null);

  const [changingLaneTeam, setChangingLaneTeam] = useState(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [sendingDiscord, setSendingDiscord] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async (newStatus) => {
    if (
      updatingStatus ||
      !guildLeague ||
      !STATUS_CONFIG[newStatus] ||
      newStatus === guildLeague.status
    ) {
      return;
    }

    setUpdatingStatus(true);

    try {
      await updateGuildLeagueStatus(guildLeagueId, newStatus);

      toast.success(
        "Status updated",
        `Guild League status changed to ${STATUS_CONFIG[newStatus].label}.`,
      );
    } catch (statusError) {
      console.error("Failed to update Guild League status:", statusError);

      toast.error("Update failed", "Guild League status could not be updated.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Roster Slot
  |--------------------------------------------------------------------------
  */

  const handleEmptySlotClick = (teamNumber, slotNumber) => {
    setAssignSlot({
      teamNumber,
      slotNumber,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Lane
  |--------------------------------------------------------------------------
  */

  const handleLaneChange = async (teamNumber, lane) => {
    if (changingLaneTeam) {
      return;
    }

    setChangingLaneTeam(teamNumber);

    try {
      await updateTeamLane(guildLeagueId, teamNumber, lane);

      toast.success(
        "Lane updated",
        lane
          ? `Team ${teamNumber} has been assigned to ${
              LANE_CONFIG[lane]?.label || lane
            }.`
          : `Team ${teamNumber} is now unassigned.`,
      );
    } catch (laneError) {
      console.error("Failed to update team lane:", laneError);

      toast.error(
        "Update failed",
        `Team ${teamNumber} lane could not be updated.`,
      );
    } finally {
      setChangingLaneTeam(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Member
  |--------------------------------------------------------------------------
  */

  const handleRemoveMember = async (member) => {
    if (removingMemberId) {
      return;
    }

    const memberId = String(member?.memberId || member?.id || "");

    if (!memberId) {
      return;
    }

    setRemovingMemberId(member.id);

    try {
      await removeRosterMember(guildLeagueId, member);

      if (
        selectedMember &&
        String(selectedMember.memberId || selectedMember.id) === memberId
      ) {
        setSelectedMember(null);
      }

      toast.success(
        "Player removed",
        `${member.nickname} has been removed from Team ${member.teamNumber}.`,
      );
    } catch (removeError) {
      console.error("Failed to remove roster member:", removeError);

      toast.error(
        "Remove failed",
        `${member.nickname} could not be removed from the roster.`,
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Discord
  |--------------------------------------------------------------------------
  */

  const handleSendDiscord = async () => {
    if (sendingDiscord || !guildLeague) {
      return;
    }

    setSendingDiscord(true);

    try {
      await sendGuildLeagueToDiscord({
        guildLeagueId,
        guildLeague,
        rosterMembers,
        teams,
        maxTeams,
        membersPerTeam,
        maxRoster,
        rosterCount,
        teamCount,
        formattedDate: formatDate(guildLeague.eventDate),
      });

      toast.success(
        "Sent to Discord",
        "Guild League announcement has been sent to Discord.",
      );
    } catch (discordError) {
      console.error("Failed to send Discord announcement:", discordError);

      toast.error(
        "Discord failed",
        discordError?.message ||
          "Guild League announcement could not be sent to Discord.",
      );
    } finally {
      setSendingDiscord(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Public Roster
  |--------------------------------------------------------------------------
  */

  const publicRosterUrl = `/roster/${guildLeagueId}`;

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (eventError) {
    return (
      <div className="space-y-5">
        <Link
          to="/admin/guild-leagues"
          className="inline-flex items-center gap-2 text-sm font-medium text-content-muted transition hover:text-brand-600"
        >
          <ArrowLeft className="size-4" />
          Guild League
        </Link>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {eventError}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Not Found
  |--------------------------------------------------------------------------
  */

  if (notFound || !guildLeague) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CalendarDays className="size-6 text-content-muted" />

        <h1 className="mt-4 text-base font-semibold text-content-strong">
          Event not found
        </h1>

        <Link
          to="/admin/guild-leagues"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
        >
          <ArrowLeft className="size-4" />
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-7">
        {/* HEADER */}

        <div>
          <Link
            to="/admin/guild-leagues"
            className="inline-flex items-center gap-2 text-sm font-medium text-content-muted transition hover:text-brand-600"
          >
            <ArrowLeft className="size-4" />
            Guild League
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
                  {guildLeague.name}
                </h1>

                <GuildLeagueStatusBadge
                  status={guildLeague.status || "draft"}
                />
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-content-muted">
                <CalendarDays className="size-4" />

                {formatDate(guildLeague.eventDate)}
              </div>

              {guildLeague.notes && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-content-muted">
                  {guildLeague.notes}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCopyRosterOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100"
              >
                <Copy className="size-4" />
                Copy Roster
              </button>

              <Link
                to={publicRosterUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100"
              >
                <ExternalLink className="size-4" />
                Preview
              </Link>

              <button
                type="button"
                onClick={handleSendDiscord}
                disabled={sendingDiscord}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingDiscord ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-4" />
                    Send to Discord
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* STATUS */}

        <GuildLeagueStatusControl
          status={guildLeague.status || "draft"}
          updating={updatingStatus}
          onChange={handleStatusChange}
        />

        {/* FIRESTORE ERRORS */}

        {(rosterError || teamsError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {rosterError || teamsError}
          </div>
        )}

        {/* STATISTICS */}

        <div className="grid grid-cols-3 border-y border-line py-4">
          <div>
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {rosterCount}
            </div>

            <div className="mt-1 text-xs text-content-muted">Players</div>
          </div>

          <div className="border-x border-line px-4 sm:px-6">
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {teamCount}
            </div>

            <div className="mt-1 text-xs text-content-muted">Active teams</div>
          </div>

          <div className="pl-4 sm:pl-6">
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {openSlots}
            </div>

            <div className="mt-1 text-xs text-content-muted">Open slots</div>
          </div>
        </div>

        {/* ROSTER HEADER */}

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-content-strong">
                Roster
              </h2>

              <p className="mt-1 text-sm text-content-muted">
                Organize teams by battlefield lane.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold tabular-nums text-content-strong">
                {rosterCount} / {maxRoster}
              </div>

              <div className="mt-0.5 text-xs text-content-muted">
                players assigned
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{
                width: `${rosterPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* UNASSIGNED */}

        <LaneSection
          lane="unassigned"
          teamNumbers={teamGroups.unassigned}
          membersPerTeam={membersPerTeam}
          rosterMembers={rosterMembers}
          teamLaneMap={teamLaneMap}
          onLaneChange={handleLaneChange}
          changingLaneTeam={changingLaneTeam}
          onEmptySlotClick={handleEmptySlotClick}
          onMemberClick={setSelectedMember}
          onRemoveMember={handleRemoveMember}
          removingMemberId={removingMemberId}
        />

        {/* TOP */}

        <LaneSection
          lane="top"
          teamNumbers={teamGroups.top}
          membersPerTeam={membersPerTeam}
          rosterMembers={rosterMembers}
          teamLaneMap={teamLaneMap}
          onLaneChange={handleLaneChange}
          changingLaneTeam={changingLaneTeam}
          onEmptySlotClick={handleEmptySlotClick}
          onMemberClick={setSelectedMember}
          onRemoveMember={handleRemoveMember}
          removingMemberId={removingMemberId}
        />

        {/* MID */}

        <LaneSection
          lane="mid"
          teamNumbers={teamGroups.mid}
          membersPerTeam={membersPerTeam}
          rosterMembers={rosterMembers}
          teamLaneMap={teamLaneMap}
          onLaneChange={handleLaneChange}
          changingLaneTeam={changingLaneTeam}
          onEmptySlotClick={handleEmptySlotClick}
          onMemberClick={setSelectedMember}
          onRemoveMember={handleRemoveMember}
          removingMemberId={removingMemberId}
        />

        {/* BOT */}

        <LaneSection
          lane="bot"
          teamNumbers={teamGroups.bot}
          membersPerTeam={membersPerTeam}
          rosterMembers={rosterMembers}
          teamLaneMap={teamLaneMap}
          onLaneChange={handleLaneChange}
          changingLaneTeam={changingLaneTeam}
          onEmptySlotClick={handleEmptySlotClick}
          onMemberClick={setSelectedMember}
          onRemoveMember={handleRemoveMember}
          removingMemberId={removingMemberId}
        />
      </div>

      {/* ASSIGN MEMBER */}

      <AssignRosterMemberModal
        open={Boolean(assignSlot)}
        guildLeagueId={guildLeagueId}
        teamNumber={assignSlot?.teamNumber}
        slotNumber={assignSlot?.slotNumber}
        assignedMemberIds={assignedMemberIds}
        onClose={() => setAssignSlot(null)}
      />

      {/* MANAGE MEMBER */}

      <ManageRosterMemberModal
        open={Boolean(selectedMember)}
        guildLeagueId={guildLeagueId}
        member={selectedMember}
        rosterMembers={rosterMembers}
        maxTeams={maxTeams}
        membersPerTeam={membersPerTeam}
        onClose={() => setSelectedMember(null)}
      />

      {/* COPY ROSTER */}

      <CopyRosterModal
        open={copyRosterOpen}
        guildLeagueId={guildLeagueId}
        currentEventDate={guildLeague.eventDate}
        onClose={() => setCopyRosterOpen(false)}
      />
    </>
  );
}
