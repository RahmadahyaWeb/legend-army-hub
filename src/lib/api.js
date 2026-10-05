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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to copy roster");
  }
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

// ==========================================
// VALKYRIE CUP TOURNAMENT API CLIENT
// ==========================================

/**
 * Fetches public registered teams and tournament summary metrics.
 *
 * Why this exists:
 * Provides client components with cached, filtered lists of tournament teams (pending & approved).
 *
 * @param {Object} [filters={}] - Optional filters (guild, status, search)
 * @param {boolean} [force=false] - Bypass client cache if true
 * @returns {Promise<{ teams: Array, summary: Object }>} List of teams and summary metrics
 */
export async function fetchValkyrieTeams(filters = {}, force = false) {
  const query = new URLSearchParams();
  if (filters.guild && filters.guild !== "all") query.set("guild", filters.guild);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);

  const queryString = query.toString();
  const cacheKey = `valkyrie_teams_${queryString || "all"}`;

  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const url = queryString
    ? `/api/valkyrie-cup/teams?${queryString}`
    : "/api/valkyrie-cup/teams";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch tournament teams");
  }

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Fetches public detail and sanitized roster of a single team.
 *
 * Why this exists:
 * Powers the public team roster inspection modal or detail page.
 *
 * @param {string} id - Team registration ID
 * @param {boolean} [force=false] - Bypass client cache if true
 * @returns {Promise<{ team: Object, roster: Array }>} Team details and member list
 */
export async function fetchValkyrieTeamDetail(id, force = false) {
  const cacheKey = `valkyrie_team_${id}`;
  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(`/api/valkyrie-cup/teams/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch team details");
  }

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Submits a new Valkyrie Cup team registration.
 *
 * Why this exists:
 * Sends the team details and 8-player roster to the server to establish a pending registration.
 * Automatically busts cached team lists.
 *
 * @param {Object} payload - Team name, guild, captain, and 7 members
 * @returns {Promise<Object>} Creation confirmation and registration ID
 */
export async function submitValkyrieRegistration(payload) {
  const res = await fetch("/api/valkyrie-cup/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit tournament registration");
  }

  clearCache("valkyrie_teams");
  clearCache("valkyrie_admin");
  clearCache("valkyrie_my");
  return data;
}

/**
 * Fetches user's own registration records including private Discord IDs and rejection feedback.
 *
 * Why this exists:
 * Supplies data to the "My Registration" tab.
 *
 * @param {Object} [params={}] - Optional lookup parameters (userId, teamName, captainDiscordId)
 * @param {boolean} [force=false] - Bypass client cache if true
 * @returns {Promise<Array>} List of registrations owned by the user
 */
export async function fetchMyValkyrieRegistrations(params = {}, force = false) {
  const query = new URLSearchParams();
  if (params.userId) query.set("userId", params.userId);
  if (params.teamName) query.set("teamName", params.teamName);
  if (params.captainDiscordId) query.set("captainDiscordId", params.captainDiscordId);

  const queryString = query.toString();
  const cacheKey = `valkyrie_my_${queryString || "self"}`;

  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const url = queryString
    ? `/api/valkyrie-cup/my-registration?${queryString}`
    : "/api/valkyrie-cup/my-registration";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch user registrations");
  }

  const data = await res.json();
  const registrations = data.registrations || [];
  setCached(cacheKey, registrations);
  return registrations;
}

/**
 * Admin: Fetches all tournament registrations across all statuses.
 *
 * Why this exists:
 * Powers the administrative management table with review audit data.
 *
 * @param {Object} [filters={}] - Optional filters (status, guild, search)
 * @param {boolean} [force=false] - Bypass client cache if true
 * @returns {Promise<{ registrations: Array, summary: Object }>} Registrations list and summary
 */
export async function fetchAdminValkyrieRegistrations(filters = {}, force = false) {
  const query = new URLSearchParams();
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.guild && filters.guild !== "all") query.set("guild", filters.guild);
  if (filters.search) query.set("search", filters.search);

  const queryString = query.toString();
  const cacheKey = `valkyrie_admin_${queryString || "all"}`;

  if (!force) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const url = queryString
    ? `/api/admin/valkyrie-cup/registrations?${queryString}`
    : "/api/admin/valkyrie-cup/registrations";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch tournament registrations");
  }

  const data = await res.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * Admin: Fetches full registration detail with complete roster and Discord IDs.
 *
 * Why this exists:
 * Supplies complete roster contact details inside the admin review drawer/modal.
 *
 * @param {string} id - Registration ID
 * @returns {Promise<{ registration: Object, roster: Array }>} Full registration record
 */
export async function fetchAdminValkyrieRegistrationDetail(id) {
  const res = await fetch(`/api/admin/valkyrie-cup/registrations/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch registration details");
  }
  return await res.json();
}

/**
 * Admin: Approves or rejects a team registration.
 *
 * Why this exists:
 * Dispatches administrative review decisions with reviewer attribution and optional feedback.
 *
 * @param {string} id - Registration ID
 * @param {Object} reviewData - { action: 'approve' | 'reject', rejectionReason?: string }
 * @returns {Promise<Object>} Updated registration confirmation
 */
export async function reviewValkyrieRegistration(id, reviewData) {
  const res = await fetch(
    `/api/admin/valkyrie-cup/registrations/${encodeURIComponent(id)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewData),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to process review");
  }

  clearCache("valkyrie_admin");
  clearCache("valkyrie_teams");
  clearCache(`valkyrie_team_${id}`);
  clearCache("valkyrie_my");
  return data;
}

/**
 * Admin: Deletes a team registration and its roster members.
 *
 * Why this exists:
 * Allows administrative cleanup of unwanted or invalid submissions.
 *
 * @param {string} id - Registration ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteValkyrieRegistration(id) {
  const res = await fetch(
    `/api/admin/valkyrie-cup/registrations/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete registration");
  }

  clearCache("valkyrie_admin");
  clearCache("valkyrie_teams");
  clearCache(`valkyrie_team_${id}`);
  clearCache("valkyrie_my");
  return data;
}

