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

export const TACTICAL_DUTIES = {
  mvp: {
    role: "MVP Focus",
    icon: "👑",
    short: "Regroup MVP (18:00 & 08:00)",
    directive: "Wajib fokus regroup untuk MVP di menit 18:00 & 08:00. Prioritas penuh amankan boss monster.",
    badgeBg: "bg-amber-50 text-amber-900 border-amber-300",
  },
  defend: {
    role: "Defend Lane",
    icon: "🛡️",
    short: "Defend Lane & Delay Portal MVP",
    directive: "Fokus defend lane (tidak ikut MVP) & delay pergerakan musuh di portal menuju MVP.",
    badgeBg: "bg-orange-50 text-orange-900 border-orange-300",
  },
  attack: {
    role: "Attack Push",
    icon: "⚔️",
    short: "Push Lane & Siege Tower",
    directive: "Fokus serang & push pertahanan lawan di lane untuk merusak tower/barricade musuh.",
    badgeBg: "bg-red-50 text-red-900 border-red-300",
  },
  general: {
    role: "General",
    icon: "⚖️",
    short: "Balance Lane Control",
    directive: "Menjaga stabilitas lane dan fleksibel mengikuti arahan ketua/leader.",
    badgeBg: "bg-zinc-50 text-zinc-800 border-zinc-300",
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
    duty: "Menjaga stabilitas Top Lane",
    directive: "Kontrol lane dan fleksibel merespons rotasi musuh.",
    headerClassName: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    subBadgeClassName: "border-orange-200 bg-orange-100 text-orange-800",
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
    duty: "Fokus push & serang tower musuh di Top Lane",
    directive: "Fokus serang & push pertahanan lawan di Top Lane untuk hancurkan tower/barricade musuh.",
    headerClassName: "border-red-200 bg-red-50",
    iconClassName: "bg-red-100 text-red-700",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    subBadgeClassName: "border-red-200 bg-red-100 text-red-800",
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
    duty: "Defend Top Lane (TIDAK IKUT MVP) & delay pergerakan musuh di portal",
    directive: "Fokus defend lane (tidak ikut MVP) & delay pergerakan musuh di portal menuju MVP.",
    headerClassName: "border-orange-200 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    subBadgeClassName: "border-orange-200 bg-orange-100 text-orange-800",
  },
  top_mvp: {
    key: "top_mvp",
    baseLane: "top",
    label: "Top Lane • MVP / Boss",
    shortLabel: "TOP · MVP",
    subLabel: "MVP",
    badgeLabel: "TOP + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Fokus regroup untuk MVP di menit 18:00 dan 08:00",
    directive: "Wajib fokus regroup untuk MVP di menit 18:00 & 08:00. Prioritas penuh amankan boss monster.",
    headerClassName: "border-amber-200 bg-amber-50",
    iconClassName: "bg-amber-100 text-amber-700",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    subBadgeClassName: "border-amber-200 bg-amber-100 text-amber-800",
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
    duty: "Menjaga stabilitas Mid Lane",
    directive: "Kontrol lane tengah dan fleksibel merespons rotasi musuh.",
    headerClassName: "border-blue-200 bg-blue-50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    subBadgeClassName: "border-blue-200 bg-blue-100 text-blue-800",
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
    duty: "Fokus push & serang tower musuh di Mid Lane",
    directive: "Fokus serang & push pertahanan lawan di Mid Lane untuk hancurkan tower/barricade musuh.",
    headerClassName: "border-blue-200 bg-blue-50",
    iconClassName: "bg-blue-100 text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    subBadgeClassName: "border-blue-200 bg-blue-100 text-blue-800",
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
    duty: "Defend Mid Lane (TIDAK IKUT MVP) & delay pergerakan musuh di portal",
    directive: "Fokus defend lane (tidak ikut MVP) & delay pergerakan musuh di portal menuju MVP.",
    headerClassName: "border-indigo-200 bg-indigo-50",
    iconClassName: "bg-indigo-100 text-indigo-700",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    subBadgeClassName: "border-indigo-200 bg-indigo-100 text-indigo-800",
  },
  mid_mvp: {
    key: "mid_mvp",
    baseLane: "mid",
    label: "Mid Lane • MVP / Boss",
    shortLabel: "MID · MVP",
    subLabel: "MVP",
    badgeLabel: "MID + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Fokus regroup untuk MVP di menit 18:00 dan 08:00",
    directive: "Wajib fokus regroup untuk MVP di menit 18:00 & 08:00. Prioritas penuh amankan boss monster.",
    headerClassName: "border-purple-200 bg-purple-50",
    iconClassName: "bg-purple-100 text-purple-700",
    badgeClassName: "border-purple-200 bg-purple-50 text-purple-700",
    subBadgeClassName: "border-purple-200 bg-purple-100 text-purple-800",
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
    duty: "Menjaga stabilitas Bot Lane",
    directive: "Kontrol lane bawah dan fleksibel merespons rotasi musuh.",
    headerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    subBadgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
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
    duty: "Fokus push & serang tower musuh di Bot Lane",
    directive: "Fokus serang & push pertahanan lawan di Bot Lane untuk hancurkan tower/barricade musuh.",
    headerClassName: "border-emerald-200 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    subBadgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
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
    duty: "Defend Bot Lane (TIDAK IKUT MVP) & delay pergerakan musuh di portal",
    directive: "Fokus defend lane (tidak ikut MVP) & delay pergerakan musuh di portal menuju MVP.",
    headerClassName: "border-teal-200 bg-teal-50",
    iconClassName: "bg-teal-100 text-teal-700",
    badgeClassName: "border-teal-200 bg-teal-50 text-teal-700",
    subBadgeClassName: "border-teal-200 bg-teal-100 text-teal-800",
  },
  bot_mvp: {
    key: "bot_mvp",
    baseLane: "bot",
    label: "Bot Lane • MVP / Boss",
    shortLabel: "BOT · MVP",
    subLabel: "MVP",
    badgeLabel: "BOT + MVP",
    icon: "👑",
    tacticalType: "mvp",
    duty: "Fokus regroup untuk MVP di menit 18:00 dan 08:00",
    directive: "Wajib fokus regroup untuk MVP di menit 18:00 & 08:00. Prioritas penuh amankan boss monster.",
    headerClassName: "border-cyan-200 bg-cyan-50",
    iconClassName: "bg-cyan-100 text-cyan-700",
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    subBadgeClassName: "border-cyan-200 bg-cyan-100 text-cyan-800",
  },
};

export const LANE_SELECT_GROUPS = [
  {
    group: "Top Lane",
    options: [
      { value: "top", label: "Top Lane (General)" },
      { value: "top_attack", label: "Top + Attack ⚔️ (Push Tower)" },
      { value: "top_defend", label: "Top + Defend 🛡️ (Delay Portal MVP)" },
      { value: "top_mvp", label: "Top + MVP 👑 (Regroup 18:00 & 08:00)" },
    ],
  },
  {
    group: "Mid Lane",
    options: [
      { value: "mid", label: "Mid Lane (General)" },
      { value: "mid_attack", label: "Mid + Attack ⚔️ (Push Tower)" },
      { value: "mid_defend", label: "Mid + Defend 🛡️ (Delay Portal MVP)" },
      { value: "mid_mvp", label: "Mid + MVP 👑 (Regroup 18:00 & 08:00)" },
    ],
  },
  {
    group: "Bot Lane",
    options: [
      { value: "bot", label: "Bot Lane (General)" },
      { value: "bot_attack", label: "Bot + Attack ⚔️ (Push Tower)" },
      { value: "bot_defend", label: "Bot + Defend 🛡️ (Delay Portal MVP)" },
      { value: "bot_mvp", label: "Bot + MVP 👑 (Regroup 18:00 & 08:00)" },
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
