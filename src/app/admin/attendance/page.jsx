"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import {
  fetchGuildLeagues,
  fetchGuildLeagueDetail,
  fetchAttendance,
  saveAttendance,
} from "@/lib/api";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import AttendanceSummaryCards from "@/components/attendance/AttendanceSummaryCards";
import { ClassBadge } from "@/utils/classColors";
import { formatNumber } from "@/utils/formatters";

/**
 * Attendance Management Page
 *
 * Why this exists:
 * Officers mark roll-call status (Present, Absent, Late) for all rostered members
 * participating in a specific Guild League match, with quick batch-action controls.
 */
export default function AttendancePage() {
  const { success, error: toastError } = useToast();

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
      .catch((err) => {
        console.error("Error fetching matches:", err);
        toastError("Failed to load matches", err.message);
      })
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
      .catch((err) => {
        console.error("Error loading match attendance:", err);
        toastError("Failed to load attendance", err.message);
      })
      .finally(() => setLoadingMatch(false));
  }, [selectedLeagueId]);

  const currentMatch = leagueDetail?.guildLeague;
  const matchRoster = leagueDetail?.roster || [];
  const matchTeams = leagueDetail?.teams || [];

  /**
   * Updates attendance state for an individual player
   */
  const handleMarkStatus = async (rosterItem, status) => {
    const memberId = rosterItem.memberId || rosterItem.id;
    if (!memberId || !selectedLeagueId) return;

    // Optimistic state
    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: status,
    }));
    setSavingMemberId(memberId);

    try {
      await saveAttendance({
        guildLeagueId: selectedLeagueId,
        memberId,
        status,
      });
      success(
        "Attendance saved",
        `${rosterItem.nickname} marked as ${status.toUpperCase()}`
      );
    } catch (err) {
      console.error("Error saving attendance:", err);
      toastError("Failed to save status", err.message);
    } finally {
      setSavingMemberId(null);
    }
  };

  /**
   * Batch mark all active roster members as present
   */
  const handleMarkAllPresent = async () => {
    if (!selectedLeagueId || matchRoster.length === 0) return;
    if (!confirm("Mark all players in this roster as PRESENT?")) return;

    setBatchSaving(true);
    const updatedMap = { ...attendanceMap };
    matchRoster.forEach((r) => {
      const key = r.memberId || r.id;
      updatedMap[key] = "present";
    });
    setAttendanceMap(updatedMap);

    try {
      await Promise.all(
        matchRoster.map((r) =>
          saveAttendance({
            guildLeagueId: selectedLeagueId,
            memberId: r.memberId || r.id,
            status: "present",
          })
        )
      );
      success("All marked present", "All roster players have been checked in.");
    } catch (err) {
      console.error("Batch attendance error:", err);
      toastError("Failed batch attendance", err.message);
    } finally {
      setBatchSaving(false);
    }
  };

  // Roll-call counts calculation
  const summaryCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;

    matchRoster.forEach((r) => {
      const key = r.memberId || r.id;
      const status = attendanceMap[key];
      if (status === "present") present += 1;
      else if (status === "absent") absent += 1;
      else if (status === "late") late += 1;
    });

    return {
      present,
      absent,
      late,
      total: matchRoster.length,
    };
  }, [matchRoster, attendanceMap]);

  // Filtered roster for table
  const filteredRoster = useMemo(() => {
    return matchRoster.filter((item) => {
      const key = item.memberId || item.id;
      const status = attendanceMap[key] || "unrecorded";

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const nickname = (item.nickname || "").toLowerCase();
        const className = (item.className || "").toLowerCase();
        if (!nickname.includes(query) && !className.includes(query)) return false;
      }

      if (selectedTeam !== "all" && Number(item.teamNumber) !== Number(selectedTeam)) {
        return false;
      }

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [matchRoster, attendanceMap, search, selectedTeam, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b-2 border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-pixel uppercase tracking-widest bg-brand-100 text-brand-700 border border-brand-300">
              Roll Call
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight font-sans">
              Match Attendance
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-sans">
            Track member roll call, standby check-ins, and match presence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {guildLeagues.length > 0 && (
            <Select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="!h-9 !py-0 !text-xs font-sans font-semibold"
            >
              {guildLeagues.map((gl) => (
                <option key={gl.id} value={gl.id}>
                  {gl.name} ({gl.assignedPlayers || gl.rosterCount || 0} players)
                </option>
              ))}
            </Select>
          )}

          {currentMatch && (
            <Link
              href={`/admin/guild-leagues/${selectedLeagueId}`}
              className="inline-flex h-9 items-center gap-1.5 border-2 border-zinc-900 bg-white px-3 text-xs font-sans font-semibold text-zinc-900 hover:bg-zinc-50 comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] transition"
            >
              <ExternalLink className="size-3.5" />
              <span>Roster Editor</span>
            </Link>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            loading={batchSaving}
            disabled={loadingMatch || matchRoster.length === 0}
            onClick={handleMarkAllPresent}
          >
            Mark All Present
          </Button>
        </div>
      </div>

      {/* MATCH SUMMARY METRICS */}
      {currentMatch && (
        <AttendanceSummaryCards
          totalRoster={summaryCounts.total}
          presentCount={summaryCounts.present}
          absentCount={summaryCounts.absent}
          lateCount={summaryCounts.late}
        />
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-2 border-zinc-900 bg-white p-3.5 sm:p-4 comic-shadow">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <Input
            icon={Search}
            placeholder="Search roster by nickname or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="w-full"
            className="!h-9 text-xs sm:text-sm font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="!h-9 !py-0 text-xs sm:text-sm font-sans font-semibold"
          >
            <option value="all">All Teams</option>
            {matchTeams.map((team) => (
              <option key={team.teamNumber} value={team.teamNumber}>
                Team {team.teamNumber} ({team.name || `Team ${team.teamNumber}`})
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="!h-9 !py-0 text-xs sm:text-sm font-sans font-semibold"
          >
            <option value="all">All Status</option>
            <option value="present">Present ({summaryCounts.present})</option>
            <option value="absent">Absent ({summaryCounts.absent})</option>
            <option value="late">Late ({summaryCounts.late})</option>
            <option value="unrecorded">Unrecorded</option>
          </Select>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      {loadingLeagues || loadingMatch ? (
        <Loading message="Loading attendance records..." />
      ) : matchRoster.length === 0 ? (
        <EmptyState
          title="No players in this event"
          description="Assign players to this lineup to start tracking attendance."
          action={
            <Link href={`/admin/guild-leagues/${selectedLeagueId}`}>
              <Button variant="primary" size="sm">
                Assign Lineup
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Team</TableHead>
              <TableHead className="font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Player</TableHead>
              <TableHead className="font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Class</TableHead>
              <TableHead className="text-right font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Level</TableHead>
              <TableHead className="text-right font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Gear Score</TableHead>
              <TableHead className="text-center font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right font-sans text-xs font-bold text-zinc-900 uppercase tracking-wider">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoster.map((rosterItem) => {
              const memberId = rosterItem.memberId || rosterItem.id;
              const currentStatus = attendanceMap[memberId] || "unrecorded";
              const isSavingThis = savingMemberId === memberId;

              return (
                <TableRow key={`${rosterItem.teamNumber}-${rosterItem.slotNumber}`}>
                  <TableCell>
                    <span className="inline-flex items-center justify-center border-2 border-zinc-900 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-[1px_1px_0px_#18181b]">
                      T{rosterItem.teamNumber}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="font-bold text-zinc-900 font-sans text-sm">
                      {rosterItem.nickname}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Slot #{rosterItem.slotNumber}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ClassBadge className={rosterItem.className} size="xs" />
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-zinc-700">
                    {rosterItem.level ? `Lv. ${rosterItem.level}` : "—"}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-zinc-900">
                    {rosterItem.gearScore > 0 ? formatNumber(rosterItem.gearScore) : "—"}
                  </TableCell>

                  <TableCell className="text-center">
                    {currentStatus === "present" ? (
                      <span className="inline-block border-2 border-emerald-800 bg-emerald-100 px-2 py-0.5 text-[11px] font-sans font-bold text-emerald-900 comic-shadow-sm">
                        PRESENT
                      </span>
                    ) : currentStatus === "absent" ? (
                      <span className="inline-block border-2 border-red-800 bg-red-100 px-2 py-0.5 text-[11px] font-sans font-bold text-red-900 comic-shadow-sm">
                        ABSENT
                      </span>
                    ) : currentStatus === "late" ? (
                      <span className="inline-block border-2 border-amber-800 bg-amber-100 px-2 py-0.5 text-[11px] font-sans font-bold text-amber-900 comic-shadow-sm">
                        LATE
                      </span>
                    ) : (
                      <span className="text-[11px] font-sans text-zinc-400 italic">
                        Unrecorded
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "present")}
                        className={`size-7.5 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] ${
                          currentStatus === "present"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"
                        }`}
                        title="Mark Present"
                      >
                        ✓
                      </button>

                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "late")}
                        className={`size-7.5 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] ${
                          currentStatus === "late"
                            ? "bg-amber-600 text-white"
                            : "bg-white text-zinc-700 hover:bg-amber-50 hover:text-amber-900"
                        }`}
                        title="Mark Late"
                      >
                        ⏱
                      </button>

                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "absent")}
                        className={`size-7.5 border-2 border-zinc-900 flex items-center justify-center text-xs font-bold transition comic-shadow-sm active:translate-x-[1px] active:translate-y-[1px] ${
                          currentStatus === "absent"
                            ? "bg-red-600 text-white"
                            : "bg-white text-zinc-700 hover:bg-red-50 hover:text-red-900"
                        }`}
                        title="Mark Absent"
                      >
                        ✕
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
