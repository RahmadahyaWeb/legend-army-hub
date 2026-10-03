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
import { SkeletonTable } from "@/components/ui/LoadingState";
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
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Match Attendance
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Track member roll call, standby check-ins, and match presence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {guildLeagues.length > 0 && (
            <Select
              value={selectedLeagueId}
              onChange={(e) => setSelectedLeagueId(e.target.value)}
              className="!h-8.5 !py-0 !text-xs font-bold"
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
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition"
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
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <Input
            icon={Search}
            placeholder="Search roster by nickname or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="w-full"
            className="!h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="!h-9 !py-0 text-xs font-semibold"
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
            className="!h-9 !py-0 text-xs font-semibold"
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
        <SkeletonTable rows={8} />
      ) : matchRoster.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No roster members in this match"
          description="Assign players to this guild league lineup to start recording attendance."
          action={
            <Link href={`/admin/guild-leagues/${selectedLeagueId}`}>
              <Button variant="primary" size="sm" icon={UserCheck}>
                Assign Lineup Roster
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Team</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Level</TableHead>
              <TableHead className="text-right">Gear Score</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
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
                    <span className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-black text-white shadow-2xs">
                      T{rosterItem.teamNumber}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                      {rosterItem.nickname}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      Slot #{rosterItem.slotNumber}
                    </div>
                  </TableCell>

                  <TableCell>
                    <ClassBadge className={rosterItem.className} size="xs" />
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-semibold text-zinc-700">
                    {rosterItem.level ? `Lv. ${rosterItem.level}` : "—"}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-bold text-zinc-900">
                    {rosterItem.gearScore > 0 ? formatNumber(rosterItem.gearScore) : "—"}
                  </TableCell>

                  <TableCell className="text-center">
                    {currentStatus === "present" ? (
                      <Badge variant="success" size="xs" dot>
                        PRESENT
                      </Badge>
                    ) : currentStatus === "absent" ? (
                      <Badge variant="danger" size="xs" dot>
                        ABSENT
                      </Badge>
                    ) : currentStatus === "late" ? (
                      <Badge variant="warning" size="xs" dot>
                        LATE
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400 italic">
                        Unrecorded
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "present")}
                        className={`size-7.5 rounded-lg border flex items-center justify-center text-xs font-bold transition shadow-2xs ${
                          currentStatus === "present"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                        title="Mark Present"
                      >
                        ✓
                      </button>

                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "late")}
                        className={`size-7.5 rounded-lg border flex items-center justify-center text-xs font-bold transition shadow-2xs ${
                          currentStatus === "late"
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                        title="Mark Late"
                      >
                        ⏱
                      </button>

                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleMarkStatus(rosterItem, "absent")}
                        className={`size-7.5 rounded-lg border flex items-center justify-center text-xs font-bold transition shadow-2xs ${
                          currentStatus === "absent"
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
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
