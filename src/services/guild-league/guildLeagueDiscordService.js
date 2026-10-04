const DISCORD_WORKER_URL = "https://legend-army-discord.legendarmy.workers.dev";

export function getPublicRosterUrl(guildLeagueId) {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/roster/${guildLeagueId}`;
  }
  const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://legend-army-hub.vercel.app";
  return `${fallbackUrl.replace(/\/$/, "")}/roster/${guildLeagueId}`;
}

function getTeamMembers(rosterMembers, teamNumber) {
  return rosterMembers
    .filter((member) => Number(member.teamNumber) === Number(teamNumber))
    .sort(
      (first, second) => Number(first.slotNumber) - Number(second.slotNumber),
    );
}

/**
 * Dispatches guild event lineup and formations to Discord Webhook Worker
 *
 * Why this exists:
 * Sends an interactive and customized Discord notification for:
 * 1. Guild League (3-Lane formations & MVP timings)
 * 2. War of Emperium (Castle siege, throne room defense, and squads)
 * 3. Polarity (Fixed 10-party formation with 5 players each = 50 capacity)
 *
 * @param {Object} params
 * @param {string} params.guildLeagueId - Guild event ID
 * @param {Object} params.guildLeague - Guild event record
 * @param {Array<Object>} [params.rosterMembers] - Assigned roster members
 * @param {Array<Object>} [params.teams] - Custom team metadata
 * @param {number} [params.maxTeams] - Total teams count
 * @param {number} [params.membersPerTeam] - Players per team capacity
 * @param {number} [params.maxRoster] - Overall player capacity
 * @param {number} [params.rosterCount] - Current player count
 * @param {number} [params.teamCount] - Active teams count
 * @param {string} [params.formattedDate] - Formatted match date string
 * @returns {Promise<{ data: any, payload: any, rosterUrl: string }>}
 */
export async function sendGuildLeagueToDiscord({
  guildLeagueId,
  guildLeague,
  rosterMembers,
  teams,
  maxTeams,
  membersPerTeam,
  maxRoster,
  rosterCount,
  teamCount,
  formattedDate,
}) {
  if (!guildLeagueId) {
    throw new Error("Guild League ID is required.");
  }

  if (!guildLeague) {
    throw new Error("Guild League data is required.");
  }

  const rosterUrl = getPublicRosterUrl(guildLeagueId);
  const eventType = String(guildLeague.eventType || "guild_league").toLowerCase().trim();
  const isPolarity = eventType === "polarity";
  const isWoe = eventType === "woe";

  // Why this exists: Polarity is strictly fixed at 10 teams of 5 players (50 total)
  const effectiveMaxTeams = isPolarity ? 10 : (Number(maxTeams) || Number(guildLeague.maxTeams) || 2);
  const effectiveMembersPerTeam = isPolarity ? 5 : (Number(membersPerTeam) || Number(guildLeague.membersPerTeam) || 10);

  const discordTeams = Array.from(
    {
      length: effectiveMaxTeams,
    },
    (_, index) => {
      const teamNumber = index + 1;
      const teamData = teams?.find(
        (team) => Number(team.teamNumber) === teamNumber,
      );

      const members = getTeamMembers(rosterMembers || [], teamNumber);

      return {
        teamNumber,
        name: teamData?.name || (isPolarity ? `Party ${teamNumber}` : isWoe ? `Squad ${teamNumber}` : `Team ${teamNumber}`),
        lane: teamData?.lane || "",
        memberCount: members.length,
        members: members.map((member) => ({
          id: member.id,
          memberId: member.memberId || member.id,
          nickname: member.nickname || "Unknown",
          className: member.className || "",
          level: Number(member.level) || 0,
          gearScore: Number(member.gearScore) || 0,
          slotNumber: Number(member.slotNumber) || 0,
        })),
      };
    },
  );

  const defaultName = isPolarity
    ? "Polarity Battle"
    : isWoe
    ? "WOE Castle War"
    : "Guild League Match";

  const payload = {
    guildLeagueId,
    eventType,
    name: guildLeague.name || defaultName,
    opponent: guildLeague.opponent || "",
    notes: guildLeague.notes || "",
    date: formattedDate || "TBA",
    status: guildLeague.status || "draft",
    rosterUrl,
    assignedPlayers: Number(rosterCount) || (rosterMembers ? rosterMembers.length : 0),
    maxPlayers: Number(maxRoster) || effectiveMaxTeams * effectiveMembersPerTeam,
    activeTeams: Number(teamCount) || effectiveMaxTeams,
    maxTeams: effectiveMaxTeams,
    membersPerTeam: effectiveMembersPerTeam,
    teams: discordTeams,
    roster: (rosterMembers || []).map((member) => ({
      id: member.id,
      memberId: member.memberId || member.id,
      nickname: member.nickname || "Unknown",
      className: member.className || "",
      level: Number(member.level) || 0,
      gearScore: Number(member.gearScore) || 0,
      teamNumber: Number(member.teamNumber) || 0,
      slotNumber: Number(member.slotNumber) || 0,
    })),
  };

  const response = await fetch(DISCORD_WORKER_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const responseText = await response.text().catch(() => "");

    data = responseText
      ? {
          message: responseText,
        }
      : null;
  }

  if (!response.ok) {
    console.error("Discord Worker Error:", {
      status: response.status,
      statusText: response.statusText,
      data,
      payload,
    });

    throw new Error(
      data?.message ||
        data?.error ||
        `Worker returned HTTP ${response.status} ${response.statusText}`,
    );
  }

  return {
    data,
    payload,
    rosterUrl,
  };
}
