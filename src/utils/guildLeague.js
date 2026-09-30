export const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    description: "Roster is still being prepared.",
    className: "bg-zinc-100 text-zinc-600",
    dotClassName: "bg-zinc-400",
  },

  open: {
    label: "Open",
    description: "Guild League roster is active and published.",
    className: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },

  completed: {
    label: "Completed",
    description: "Guild League event has been completed.",
    className: "bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },
};

export const LANE_CONFIG = {
  top: {
    key: "top",
    label: "Top Lane",
    shortLabel: "TOP",
    description: "Teams assigned to the top lane.",
    headerClassName: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
  },

  mid: {
    key: "mid",
    label: "Mid Lane",
    shortLabel: "MID",
    description: "Teams assigned to the middle lane.",
    headerClassName: "border-blue-200 bg-blue-50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },

  bot: {
    key: "bot",
    label: "Bot Lane",
    shortLabel: "BOT",
    description: "Teams assigned to the bottom lane.",
    headerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function formatGuildLeagueDate(timestamp) {
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

export function formatGuildLeagueShortDate(timestamp) {
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
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return number.toLocaleString();
}

export function getTeamMembers(rosterMembers, teamNumber) {
  return rosterMembers
    .filter((member) => Number(member.teamNumber) === Number(teamNumber))
    .sort(
      (first, second) => Number(first.slotNumber) - Number(second.slotNumber),
    );
}

export function buildTeamLaneMap(teams) {
  const map = new Map();

  teams.forEach((team) => {
    map.set(Number(team.teamNumber), team.lane || "");
  });

  return map;
}

export function buildTeamGroups(maxTeams, teamLaneMap) {
  const groups = {
    unassigned: [],
    top: [],
    mid: [],
    bot: [],
  };

  for (let teamNumber = 1; teamNumber <= maxTeams; teamNumber += 1) {
    const lane = teamLaneMap.get(teamNumber);

    if (lane === "top" || lane === "mid" || lane === "bot") {
      groups[lane].push(teamNumber);
    } else {
      groups.unassigned.push(teamNumber);
    }
  }

  return groups;
}

export function getAssignedMemberIds(rosterMembers) {
  return [
    ...new Set(
      rosterMembers
        .map((member) => member.memberId || member.id)
        .filter(Boolean)
        .map((memberId) => String(memberId)),
    ),
  ];
}

export function getActiveTeamCount(rosterMembers) {
  const activeTeams = new Set(
    rosterMembers.map((member) => Number(member.teamNumber)).filter(Boolean),
  );

  return activeTeams.size;
}

export function getRosterPercentage(rosterCount, maxRoster) {
  if (maxRoster <= 0) {
    return 0;
  }

  return Math.min(100, (rosterCount / maxRoster) * 100);
}

export function buildRosterSlotId(teamNumber, slotNumber) {
  return `team-${Number(teamNumber)}-slot-${Number(slotNumber)}`;
}
