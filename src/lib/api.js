// Lightweight, high-performance API Client with in-memory caching and auto-invalidation

const cache = new Map();
const CACHE_TTL_MS = 20_000; // 20 seconds cache TTL

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(pattern = null) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// MEMBERS
export async function fetchMembers(force = false) {
  const cacheKey = "members_list";
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch("/api/members", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch members");
  const data = await res.json();
  const members = data.members || [];
  setCached(cacheKey, members);
  return members;
}

export async function saveMember(member) {
  const isEdit = Boolean(member.id);
  const method = isEdit ? "PUT" : "POST";
  const res = await fetch("/api/members", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save member");
  }
  clearCache("members");
  clearCache("guild_league");
  return await res.json();
}

export async function deleteMember(id) {
  const res = await fetch(`/api/members?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete member");
  clearCache("members");
  clearCache("guild_league");
  return await res.json();
}

export async function resetAllMembers() {
  const res = await fetch("/api/members?all=true", {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reset member data");
  }
  clearCache("members");
  clearCache("guild_league");
  return await res.json();
}

export async function importMembers(membersList) {
  const res = await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members: membersList }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to import members");
  }
  clearCache("members");
  clearCache("guild_league");
  return await res.json();
}

// GUILD LEAGUES
export async function fetchGuildLeagues(force = false) {
  const cacheKey = "guild_leagues_list";
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch("/api/guild-leagues", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch guild leagues");
  const data = await res.json();
  const leagues = data.guildLeagues || [];
  setCached(cacheKey, leagues);
  return leagues;
}

export async function createGuildLeague(payload) {
  const res = await fetch("/api/guild-leagues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create guild league");
  }
  clearCache("guild_leagues");
  return await res.json();
}

export async function fetchGuildLeagueDetail(id, force = false) {
  const cacheKey = `guild_league_detail_${id}`;
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(`/api/guild-leagues/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch guild league detail");
  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

export async function updateGuildLeague(id, payload) {
  const res = await fetch(`/api/guild-leagues/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update guild league");
  clearCache(`guild_league_detail_${id}`);
  clearCache("guild_leagues");
  return await res.json();
}

export async function deleteGuildLeague(id) {
  const res = await fetch(`/api/guild-leagues/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete guild league");
  clearCache("guild_leagues");
  return await res.json();
}

export async function assignRosterMember(guildLeagueId, payload) {
  const res = await fetch(`/api/guild-leagues/${guildLeagueId}/roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to assign roster member");
  clearCache(`guild_league_detail_${guildLeagueId}`);
  clearCache("guild_leagues");
  return await res.json();
}

export async function removeRosterMember(guildLeagueId, teamNumber, slotNumber) {
  const res = await fetch(
    `/api/guild-leagues/${guildLeagueId}/roster?teamNumber=${teamNumber}&slotNumber=${slotNumber}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to remove roster member");
  clearCache(`guild_league_detail_${guildLeagueId}`);
  clearCache("guild_leagues");
  return await res.json();
}

export async function updateTeamInfo(guildLeagueId, teamNumber, name, lane) {
  const res = await fetch(`/api/guild-leagues/${guildLeagueId}/teams`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamNumber, name, lane }),
  });
  if (!res.ok) throw new Error("Failed to update team info");
  clearCache(`guild_league_detail_${guildLeagueId}`);
  return await res.json();
}

export async function copyRoster(targetLeagueId, sourceLeagueId, overwrite = true) {
  const res = await fetch(`/api/guild-leagues/${targetLeagueId}/copy-roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceLeagueId, overwrite }),
  });
  if (!res.ok) throw new Error("Failed to copy roster");
  clearCache(`guild_league_detail_${targetLeagueId}`);
  clearCache("guild_leagues");
  return await res.json();
}

// STRATEGIES
export async function fetchStrategies(force = false) {
  const cacheKey = "strategies_list";
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch("/api/strategies", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch strategies");
  const data = await res.json();
  const strategies = data.strategies || [];
  setCached(cacheKey, strategies);
  return strategies;
}

export async function saveStrategy(strategy) {
  const isEdit = Boolean(strategy.id);
  const method = isEdit ? "PUT" : "POST";
  const res = await fetch("/api/strategies", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(strategy),
  });
  if (!res.ok) throw new Error("Failed to save strategy");
  clearCache("strategies");
  return await res.json();
}

export async function deleteStrategy(id) {
  const res = await fetch(`/api/strategies?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete strategy");
  clearCache("strategies");
  return await res.json();
}

// ATTENDANCE
export async function fetchAttendance(guildLeagueId, force = false) {
  const cacheKey = `attendance_${guildLeagueId || "all"}`;
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const url = guildLeagueId
    ? `/api/attendance?guildLeagueId=${encodeURIComponent(guildLeagueId)}`
    : "/api/attendance";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  const list = data.attendances || [];
  setCached(cacheKey, list);
  return list;
}

export async function saveAttendance(payload) {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save attendance");
  clearCache("attendance");
  return await res.json();
}
