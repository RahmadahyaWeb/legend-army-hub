"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Search,
  Shield,
  Swords,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  fetchGuildLeagues,
  fetchGuildLeagueDetail,
  fetchAttendance,
  saveAttendance,
} from "@/lib/api";

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString();
}

export default function AttendancePage() {
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [leagueDetail, setLeagueDetail] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [batchSaving, setBatchSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Load initial matches list
  useEffect(() => {
    fetchGuildLeagues()
      .then((leagues) => {
        setGuildLeagues(leagues);
        if (leagues.length > 0) {
          setSelectedLeagueId(leagues[0].id);
        }
      })
      .catch((err) => console.error("Error fetching matches:", err))
      .finally(() => setLoadingLeagues(false));
  }, []);

  // Load selected match roster and attendance records
  useEffect(() => {
    if (!selectedLeagueId) return;

    setLoadingMatch(true);
    Promise.all([
      fetchGuildLeagueDetail(selectedLeagueId),
      fetchAttendance(selectedLeagueId),
    ])
      .then(([detail, attendanceRecords]) => {
        setLeagueDetail(detail);

        const map = {};
        (attendanceRecords || []).forEach((r) => {
          const key = r.memberId || r.id;
          map[key] = r.status;
        });
        setAttendanceMap(map);
      })
      .catch((err) => console.error("Error loading match attendance:", err))
      .finally(() => setLoadingMatch(false));
  }, [selectedLeagueId]);

  const currentMatch = leagueDetail?.guildLeague;
  const matchRoster = leagueDetail?.roster || [];
  const matchTeams = leagueDetail?.teams || [];

  const handleMarkStatus = async (rosterItem, status) => {
    if (!selectedLeagueId) return;
    const memberKey = rosterItem.memberId || rosterItem.id;
    setSavingMemberId(memberKey);

    // Optimistic update
    setAttendanceMap((prev) => ({ ...prev, [memberKey]: status }));

    try {
      await saveAttendance({
        guildLeagueId: selectedLeagueId,
        memberId: memberKey,
        status,
      });
    } catch (err) {
      console.error("Save attendance error:", err);
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleMarkAll = async (status) => {
    if (!selectedLeagueId || matchRoster.length === 0) return;
    setBatchSaving(true);

    const newMap = { ...attendanceMap };
    matchRoster.forEach((m) => {
      const key = m.memberId || m.id;
      newMap[key] = status;
    });
    setAttendanceMap(newMap);

    try {
      await Promise.all(
        matchRoster.map((m) =>
          saveAttendance({
            guildLeagueId: selectedLeagueId,
            memberId: m.memberId || m.id,
            status,
          })
        )
      );
    } catch (err) {
      console.error("Batch attendance error:", err);
    } finally {
      setBatchSaving(false);
    }
  };

  // Assigned members calculations
  const totalAssigned = matchRoster.length;
  const maxRoster = currentMatch?.maxRoster || 20;

  const presentCount = matchRoster.filter(
    (m) => attendanceMap[m.memberId || m.id] === "present"
  ).length;

  const absentCount = matchRoster.filter(
    (m) => attendanceMap[m.memberId || m.id] === "absent"
  ).length;

  const lateCount = matchRoster.filter(
    (m) => attendanceMap[m.memberId || m.id] === "late"
  ).length;

  const unmarkedCount = totalAssigned - (presentCount + absentCount + lateCount);

  const presentRate =
    totalAssigned > 0 ? Math.round((presentCount / totalAssigned) * 100) : 0;

  // Filtered roster members
  const filteredRoster = useMemo(() => {
    return matchRoster.filter((m) => {
      const memberKey = m.memberId || m.id;
      const status = attendanceMap[memberKey] || "unmarked";

      // Team filter
      if (selectedTeam !== "all" && Number(m.teamNumber) !== Number(selectedTeam)) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      // Search filter
      if (search) {
        const term = search.toLowerCase().trim();
        const matchNick = m.nickname?.toLowerCase().includes(term);
        const matchClass = m.className?.toLowerCase().includes(term);
        if (!matchNick && !matchClass) return false;
      }

      return true;
    });
  }, [matchRoster, attendanceMap, selectedTeam, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Match Attendance
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Track live check-in and attendance for assigned roster members
          </p>
        </div>

        {/* MATCH SELECTOR DROPDOWN */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedLeagueId}
            onChange={(e) => setSelectedLeagueId(e.target.value)}
            disabled={loadingLeagues}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800 shadow-sm focus:border-red-600 focus:outline-none"
          >
            {guildLeagues.map((gl) => (
              <option key={gl.id} value={gl.id}>
                {gl.name} ({gl.status?.toUpperCase() || "DRAFT"})
              </option>
            ))}
          </select>

          {currentMatch && (
            <Link
              href={`/admin/guild-leagues/${selectedLeagueId}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <span>Edit Roster</span>
              <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* MATCH OVERVIEW & ATTENDANCE STATS BANNER */}
      {currentMatch && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                  {currentMatch.status || "DRAFT"}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatDate(currentMatch.matchDate || currentMatch.date)}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold text-zinc-900">
                {currentMatch.name}
              </h2>
              {currentMatch.opponent && (
                <p className="text-xs font-semibold text-zinc-600">
                  VS Opponent: {currentMatch.opponent}
                </p>
              )}
            </div>

            {/* QUICK BATCH ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={batchSaving || matchRoster.length === 0}
                onClick={() => handleMarkAll("present")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Mark All Present</span>
              </button>
              <button
                type="button"
                disabled={batchSaving || matchRoster.length === 0}
                onClick={() => handleMarkAll("unmarked")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* OVERVIEW STATS CARDS */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/75 p-4">
              <div className="text-[11px] font-semibold text-zinc-500">
                Assigned Roster
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900">
                {totalAssigned} <span className="text-xs text-zinc-400">/ {maxRoster}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400">
                Players in match teams
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="text-[11px] font-semibold text-emerald-700">
                Present Rate
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-800">
                {presentRate}%
              </div>
              <div className="mt-0.5 text-[10px] text-emerald-600 font-medium">
                {presentCount} of {totalAssigned} players checked in
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-emerald-600">
                Present
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {presentCount}
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400">Confirmed on site</div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-amber-600">
                Late / Excused
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-700">
                {lateCount}
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400">Delayed arrival</div>
            </div>

            <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-red-600">
                Absent / Unmarked
              </div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {absentCount + unmarkedCount}
              </div>
              <div className="mt-0.5 text-[10px] text-zinc-400">
                {absentCount} absent, {unmarkedCount} unmarked
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE ROSTER TABLE SECTION */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {/* FILTER BAR */}
        <div className="flex flex-col gap-3 p-4 border-b border-zinc-200 bg-zinc-50/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned player..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TEAM FILTER */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 focus:border-red-600 focus:outline-none"
            >
              <option value="all">All Teams</option>
              {matchTeams.map((t) => (
                <option key={t.teamNumber} value={t.teamNumber}>
                  {t.name || `Team ${t.teamNumber}`}
                </option>
              ))}
            </select>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 focus:border-red-600 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="present">Present ({presentCount})</option>
              <option value="late">Late ({lateCount})</option>
              <option value="absent">Absent ({absentCount})</option>
              <option value="unmarked">Unmarked ({unmarkedCount})</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Team & Slot</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Gear Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loadingMatch ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    Loading match roster...
                  </td>
                </tr>
              ) : matchRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                      <Users className="size-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-zinc-900">
                      No Players Assigned to this Match Roster
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                      Only players assigned to team slots for this match are tracked in attendance.
                    </p>
                    {currentMatch && (
                      <Link
                        href={`/admin/guild-leagues/${selectedLeagueId}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500"
                      >
                        <Swords className="size-3.5" />
                        <span>Assign Players to Roster</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No assigned players match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((m) => {
                  const memberKey = m.memberId || m.id;
                  const status = attendanceMap[memberKey] || "unmarked";

                  return (
                    <tr
                      key={`${m.teamNumber}_${m.slotNumber}_${m.id}`}
                      className="transition hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-6 items-center justify-center rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-700">
                            T{m.teamNumber}
                          </span>
                          <span className="text-zinc-400 font-mono text-[11px]">
                            #{m.slotNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-900">
                        {m.nickname}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{m.className || "—"}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900">
                        {m.gearScore ? `${formatNumber(m.gearScore)} GS` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            status === "present"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "absent"
                              ? "bg-red-50 text-red-700"
                              : status === "late"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={savingMemberId === memberKey}
                            onClick={() => handleMarkStatus(m, "present")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "present"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={savingMemberId === memberKey}
                            onClick={() => handleMarkStatus(m, "late")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "late"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-700 hover:bg-amber-50 hover:text-amber-700"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            disabled={savingMemberId === memberKey}
                            onClick={() => handleMarkStatus(m, "absent")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "absent"
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-700"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
