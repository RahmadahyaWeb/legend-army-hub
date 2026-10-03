export const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    description: "Roster is in preparation.",
    className: "bg-zinc-100 text-zinc-600",
    dotClassName: "bg-zinc-400",
  },

  open: {
    label: "Open",
    description: "Guild League roster is published and active.",
    className: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },

  completed: {
    label: "Completed",
    description: "Guild League match is completed.",
    className: "bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },
};

export const TACTICAL_DUTIES = {
  mvp: {
    role: "MVP Strike",
    icon: "👑",
    short: "Regroup at 18:00 & 08:00",
    directive: "Regroup at MVP spawn at 18:00 & 08:00. Prioritize securing boss kill.",
    badgeBg: "bg-amber-50 text-amber-900 border-amber-200",
  },
  defend: {
    role: "Lane Defense",
    icon: "🛡️",
    short: "Hold Lane & Delay Portal (Skip MVP)",
    directive: "Hold lane defense (Do not join MVP). Delay enemy advance at the MVP portal.",
    badgeBg: "bg-orange-50 text-orange-900 border-orange-200",
  },
  attack: {
    role: "Lane Assault",
    icon: "⚔️",
    short: "Siege & Push Towers",
    directive: "Push enemy lane aggressively and breach defensive barricades.",
    badgeBg: "bg-red-50 text-red-900 border-red-200",
  },
  general: {
    role: "Balanced",
    icon: "⚖️",
    short: "Flexible Lane Control",
    directive: "Maintain tactical lane presence and follow raid leader calls.",
    badgeBg: "bg-zinc-50 text-zinc-700 border-zinc-200",
  },
};

export const LANE_CONFIG = {
  // TOP LANE
  top: {
    key: "top",
    baseLane: "top",
    label: "Top Lane",
    shortLabel: "TOP",
    subLabel: "General",
    badgeLabel: "TOP",
    tacticalType: "general",
    duty: "Maintain Top Lane stability",
    directive: "Hold lane control and react to enemy rotations.",
    headerClassName: "border-orange-200/80 bg-orange-50/50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    subBadgeClassName: "border-orange-200 bg-orange-100/60 text-orange-800",
  },
  top_attack: {
    key: "top_attack",
    baseLane: "top",
    label: "Top Lane • Attack",
    shortLabel: "TOP · ATK",
    subLabel: "Attack",
    badgeLabel: "TOP + ATK",
    icon: "⚔️",
    tacticalType: "attack",
    duty: "Push enemy barricades on Top Lane",
    directive: "Push aggressively and breach enemy Top Lane barricades.",
    headerClassName: "border-red-200/80 bg-red-50/50",
    iconClassName: "bg-red-100 text-red-700",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    subBadgeClassName: "border-red-200 bg-red-100/60 text-red-800",
  },
  top_defend: {
    key: "top_defend",
    baseLane: "top",
    label: "Top Lane • Defend",
    shortLabel: "TOP · DEF",
    subLabel: "Defend",
    badgeLabel: "TOP + DEF",
    icon: "🛡️",
    tacticalType: "defend",
    duty: "Hold Top Lane (Skip MVP) & delay enemy at portal",
    directive: "Hold lane defense (Do not join MVP). Delay enemy advance at Top MVP portal.",
    headerClassName: "border-orange-200/80 bg-orange-50/50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    subBadgeClassName: "border-orange-200 bg-orange-100/60 text-orange-800",
  },
  top_mvp: {
    key: "top_mvp",
    baseLane: "top",
    label: "Top Lane • MVP",
    shortLabel: "TOP · MVP",
    subLabel: "MVP",
    badgeLabel: "TOP + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Regroup at Top MVP at 18:00 & 08:00",
    directive: "Regroup at Top MVP spawn at 18:00 & 08:00. Prioritize securing boss kill.",
    headerClassName: "border-amber-200/80 bg-amber-50/50",
    iconClassName: "bg-amber-100 text-amber-700",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    subBadgeClassName: "border-amber-200 bg-amber-100/60 text-amber-800",
  },

  // MID LANE
  mid: {
    key: "mid",
    baseLane: "mid",
    label: "Mid Lane",
    shortLabel: "MID",
    subLabel: "General",
    badgeLabel: "MID",
    tacticalType: "general",
    duty: "Maintain Mid Lane stability",
    directive: "Control center battlefield and support objective rotations.",
    headerClassName: "border-blue-200/80 bg-blue-50/50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    subBadgeClassName: "border-blue-200 bg-blue-100/60 text-blue-800",
  },
  mid_attack: {
    key: "mid_attack",
    baseLane: "mid",
    label: "Mid Lane • Attack",
    shortLabel: "MID · ATK",
    subLabel: "Attack",
    badgeLabel: "MID + ATK",
    icon: "⚔️",
    tacticalType: "attack",
    duty: "Push enemy barricades on Mid Lane",
    directive: "Push aggressively and breach enemy Mid Lane barricades.",
    headerClassName: "border-blue-200/80 bg-blue-50/50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    subBadgeClassName: "border-blue-200 bg-blue-100/60 text-blue-800",
  },
  mid_defend: {
    key: "mid_defend",
    baseLane: "mid",
    label: "Mid Lane • Defend",
    shortLabel: "MID · DEF",
    subLabel: "Defend",
    badgeLabel: "MID + DEF",
    icon: "🛡️",
    tacticalType: "defend",
    duty: "Hold Mid Lane (Skip MVP) & delay enemy at portal",
    directive: "Hold lane defense (Do not join MVP). Delay enemy advance at Mid MVP portal.",
    headerClassName: "border-indigo-200/80 bg-indigo-50/50",
    iconClassName: "bg-indigo-100 text-indigo-700",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    subBadgeClassName: "border-indigo-200 bg-indigo-100/60 text-indigo-800",
  },
  mid_mvp: {
    key: "mid_mvp",
    baseLane: "mid",
    label: "Mid Lane • MVP",
    shortLabel: "MID · MVP",
    subLabel: "MVP",
    badgeLabel: "MID + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Regroup at Mid MVP at 18:00 & 08:00",
    directive: "Regroup at Mid MVP spawn at 18:00 & 08:00. Prioritize securing boss kill.",
    headerClassName: "border-purple-200/80 bg-purple-50/50",
    iconClassName: "bg-purple-100 text-purple-700",
    badgeClassName: "border-purple-200 bg-purple-50 text-purple-700",
    subBadgeClassName: "border-purple-200 bg-purple-100/60 text-purple-800",
  },

  // BOT LANE
  bot: {
    key: "bot",
    baseLane: "bot",
    label: "Bot Lane",
    shortLabel: "BOT",
    subLabel: "General",
    badgeLabel: "BOT",
    tacticalType: "general",
    duty: "Maintain Bot Lane stability",
    directive: "Control bottom lane and react to enemy rotations.",
    headerClassName: "border-emerald-200/80 bg-emerald-50/50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    subBadgeClassName: "border-emerald-200 bg-emerald-100/60 text-emerald-800",
  },
  bot_attack: {
    key: "bot_attack",
    baseLane: "bot",
    label: "Bot Lane • Attack",
    shortLabel: "BOT · ATK",
    subLabel: "Attack",
    badgeLabel: "BOT + ATK",
    icon: "⚔️",
    tacticalType: "attack",
    duty: "Push enemy barricades on Bot Lane",
    directive: "Push aggressively and breach enemy Bot Lane barricades.",
    headerClassName: "border-emerald-200/80 bg-emerald-50/50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    subBadgeClassName: "border-emerald-200 bg-emerald-100/60 text-emerald-800",
  },
  bot_defend: {
    key: "bot_defend",
    baseLane: "bot",
    label: "Bot Lane • Defend",
    shortLabel: "BOT · DEF",
    subLabel: "Defend",
    badgeLabel: "BOT + DEF",
    icon: "🛡️",
    tacticalType: "defend",
    duty: "Hold Bot Lane (Skip MVP) & delay enemy at portal",
    directive: "Hold lane defense (Do not join MVP). Delay enemy advance at Bot MVP portal.",
    headerClassName: "border-teal-200/80 bg-teal-50/50",
    iconClassName: "bg-teal-100 text-teal-700",
    badgeClassName: "border-teal-200 bg-teal-50 text-teal-700",
    subBadgeClassName: "border-teal-200 bg-teal-100/60 text-teal-800",
  },
  bot_mvp: {
    key: "bot_mvp",
    baseLane: "bot",
    label: "Bot Lane • MVP",
    shortLabel: "BOT · MVP",
    subLabel: "MVP",
    badgeLabel: "BOT + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Regroup at Bot MVP at 18:00 & 08:00",
    directive: "Regroup at Bot MVP spawn at 18:00 & 08:00. Prioritize securing boss kill.",
    headerClassName: "border-cyan-200/80 bg-cyan-50/50",
    iconClassName: "bg-cyan-100 text-cyan-700",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    subBadgeClassName: "border-cyan-200 bg-cyan-100/60 text-cyan-800",
  },
};

export const LANE_SELECT_GROUPS = [
  {
    group: "Top Lane",
    options: [
      { value: "top", label: "Top • General (Lane Control)" },
      { value: "top_attack", label: "Top • Attack ⚔️ (Push Barricades)" },
      { value: "top_defend", label: "Top • Defend 🛡️ (Delay MVP)" },
      { value: "top_mvp", label: "Top • MVP 👑 (18:00 & 08:00)" },
    ],
  },
  {
    group: "Mid Lane",
    options: [
      { value: "mid", label: "Mid • General (Lane Control)" },
      { value: "mid_attack", label: "Mid • Attack ⚔️ (Push Barricades)" },
      { value: "mid_defend", label: "Mid • Defend 🛡️ (Delay MVP)" },
      { value: "mid_mvp", label: "Mid • MVP 👑 (18:00 & 08:00)" },
    ],
  },
  {
    group: "Bot Lane",
    options: [
      { value: "bot", label: "Bot • General (Lane Control)" },
      { value: "bot_attack", label: "Bot • Attack ⚔️ (Push Barricades)" },
      { value: "bot_defend", label: "Bot • Defend 🛡️ (Delay MVP)" },
      { value: "bot_mvp", label: "Bot • MVP 👑 (18:00 & 08:00)" },
    ],
  },
];

export function getBaseLane(laneKey) {
  if (!laneKey || typeof laneKey !== "string") return null;
  const lower = laneKey.toLowerCase().trim();
  if (lower.startsWith("top")) return "top";
  if (lower.startsWith("mid")) return "mid";
  if (lower.startsWith("bot")) return "bot";
  return null;
}

export function getLaneConfig(laneKey) {
  if (!laneKey || typeof laneKey !== "string") return null;
  const lower = laneKey.toLowerCase().trim();
  if (LANE_CONFIG[lower]) return LANE_CONFIG[lower];

  // Partial match or fallback to base
  const base = getBaseLane(lower);
  if (base && LANE_CONFIG[base]) {
    return LANE_CONFIG[base];
  }

  return null;
}

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
    const lane = teamLaneMap.get(teamNumber) || "";
    const base = getBaseLane(lane);

    if (base && groups[base]) {
      groups[base].push(teamNumber);
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
