"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";
import { fetchGuildLeagues, fetchMembers, fetchAttendance, saveAttendance } from "@/lib/api";

export default function AttendancePage() {
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [members, setMembers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchGuildLeagues(), fetchMembers()])
      .then(([leagues, membersList]) => {
        setGuildLeagues(leagues);
        setMembers(membersList.filter((m) => m.isActive !== false));
        if (leagues.length > 0) {
          setSelectedLeagueId(leagues[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Attendance load error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedLeagueId) return;

    fetchAttendance(selectedLeagueId)
      .then((records) => {
        const map = {};
        records.forEach((r) => {
          map[r.memberId] = r.status;
        });
        setAttendanceMap(map);
      })
      .catch((err) => console.error("Fetch attendance map error:", err));
  }, [selectedLeagueId]);

  const handleMarkStatus = async (memberId, status) => {
    if (!selectedLeagueId) return;
    setSavingMemberId(memberId);

    try {
      await saveAttendance({
        guildLeagueId: selectedLeagueId,
        memberId,
        status,
      });
      setAttendanceMap((prev) => ({ ...prev, [memberId]: status }));
    } catch (err) {
      console.error("Save attendance error:", err);
    } finally {
      setSavingMemberId(null);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      m.nickname?.toLowerCase().includes(term) ||
      m.className?.toLowerCase().includes(term)
    );
  });

  const presentCount = Object.values(attendanceMap).filter((s) => s === "present").length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === "late").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Attendance & Presence Tracking
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Record member attendance for Guild League matches and events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLeagueId}
            onChange={(e) => setSelectedLeagueId(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-800 focus:border-red-600 focus:outline-none"
          >
            {guildLeagues.map((gl) => (
              <option key={gl.id} value={gl.id}>
                {gl.name} ({gl.status?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-medium text-zinc-500">Total Active Members</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">{members.length}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-emerald-600 font-semibold">Present</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{presentCount}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-red-600 font-semibold">Absent</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{absentCount}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-amber-600 font-semibold">Late / Excused</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{lateCount}</div>
        </div>
      </div>

      {/* SEARCH AND LIST */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs focus:border-red-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Gear Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Quick Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Loading attendance list...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const status = attendanceMap[m.id] || "unmarked";

                  return (
                    <tr key={m.id} className="transition hover:bg-zinc-50">
                      <td className="px-4 py-3 font-bold text-zinc-900">{m.nickname}</td>
                      <td className="px-4 py-3 text-zinc-600">{m.className || "—"}</td>
                      <td className="px-4 py-3 font-bold text-zinc-900">
                        {m.gearScore ? `${Number(m.gearScore).toLocaleString()} GS` : "—"}
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
                            disabled={savingMemberId === m.id}
                            onClick={() => handleMarkStatus(m.id, "present")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "present"
                                ? "bg-emerald-600 text-white"
                                : "bg-zinc-100 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={savingMemberId === m.id}
                            onClick={() => handleMarkStatus(m.id, "late")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "late"
                                ? "bg-amber-600 text-white"
                                : "bg-zinc-100 text-zinc-700 hover:bg-amber-50 hover:text-amber-700"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            disabled={savingMemberId === m.id}
                            onClick={() => handleMarkStatus(m.id, "absent")}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              status === "absent"
                                ? "bg-red-600 text-white"
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
