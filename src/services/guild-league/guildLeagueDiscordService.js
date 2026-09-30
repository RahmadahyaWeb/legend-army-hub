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

  const discordTeams = Array.from(
    {
      length: maxTeams,
    },
    (_, index) => {
      const teamNumber = index + 1;
      const teamData = teams?.find(
        (team) => Number(team.teamNumber) === teamNumber,
      );

      const members = getTeamMembers(rosterMembers || [], teamNumber);

      return {
        teamNumber,
        name: teamData?.name || `Team ${teamNumber}`,
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

  const payload = {
    guildLeagueId,
    name: guildLeague.name || "Guild League Match",
    opponent: guildLeague.opponent || "",
    notes: guildLeague.notes || "",
    date: formattedDate || "TBA",
    status: guildLeague.status || "draft",
    rosterUrl,
    assignedPlayers: Number(rosterCount) || (rosterMembers ? rosterMembers.length : 0),
    maxPlayers: Number(maxRoster) || 60,
    activeTeams: Number(teamCount) || maxTeams,
    maxTeams: Number(maxTeams) || 12,
    membersPerTeam: Number(membersPerTeam) || 5,
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

  let data = null;

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
