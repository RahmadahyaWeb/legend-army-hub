// API Client Helper for Neon Database endpoints

export async function fetchMembers() {
  const res = await fetch("/api/members", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch members");
  const data = await res.json();
  return data.members || [];
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
  return await res.json();
}

export async function deleteMember(id) {
  const res = await fetch(`/api/members?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete member");
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
  return await res.json();
}

export async function fetchGuildLeagues() {
  const res = await fetch("/api/guild-leagues", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch guild leagues");
  const data = await res.json();
  return data.guildLeagues || [];
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
  return await res.json();
}

export async function fetchGuildLeagueDetail(id) {
  const res = await fetch(`/api/guild-leagues/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch guild league detail");
  return await res.json();
}

export async function updateGuildLeague(id, payload) {
  const res = await fetch(`/api/guild-leagues/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update guild league");
  return await res.json();
}

export async function deleteGuildLeague(id) {
  const res = await fetch(`/api/guild-leagues/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete guild league");
  return await res.json();
}

export async function assignRosterMember(guildLeagueId, payload) {
  const res = await fetch(`/api/guild-leagues/${guildLeagueId}/roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to assign roster member");
  return await res.json();
}

export async function removeRosterMember(guildLeagueId, teamNumber, slotNumber) {
  const res = await fetch(
    `/api/guild-leagues/${guildLeagueId}/roster?teamNumber=${teamNumber}&slotNumber=${slotNumber}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to remove roster member");
  return await res.json();
}

export async function updateTeamInfo(guildLeagueId, teamNumber, name, lane) {
  const res = await fetch(`/api/guild-leagues/${guildLeagueId}/teams`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamNumber, name, lane }),
  });
  if (!res.ok) throw new Error("Failed to update team info");
  return await res.json();
}

export async function copyRoster(targetLeagueId, sourceLeagueId, overwrite = true) {
  const res = await fetch(`/api/guild-leagues/${targetLeagueId}/copy-roster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceLeagueId, overwrite }),
  });
  if (!res.ok) throw new Error("Failed to copy roster");
  return await res.json();
}

export async function fetchStrategies() {
  const res = await fetch("/api/strategies", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch strategies");
  const data = await res.json();
  return data.strategies || [];
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
  return await res.json();
}

export async function deleteStrategy(id) {
  const res = await fetch(`/api/strategies?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete strategy");
  return await res.json();
}

export async function fetchAttendance(guildLeagueId) {
  const url = guildLeagueId
    ? `/api/attendance?guildLeagueId=${encodeURIComponent(guildLeagueId)}`
    : "/api/attendance";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.attendances || [];
}

export async function saveAttendance(payload) {
  const res = await fetch("/api/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save attendance");
  return await res.json();
}
