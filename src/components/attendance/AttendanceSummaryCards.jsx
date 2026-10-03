"use client";

import { CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * Attendance Summary Metric Cards
 *
 * Why this exists:
 * Displays real-time breakdown of roll call counts (Total Roster, Present, Absent, Late)
 * and computed attendance rate for the chosen match.
 *
 * @param {Object} props - Component props
 * @param {number} props.totalRoster - Total players deployed in this match
 * @param {number} props.presentCount - Present count
 * @param {number} props.absentCount - Absent count
 * @param {number} props.lateCount - Late count
 */
export default function AttendanceSummaryCards({
  totalRoster = 0,
  presentCount = 0,
  absentCount = 0,
  lateCount = 0,
}) {
  const attendanceRate =
    totalRoster > 0 ? Math.round((presentCount / totalRoster) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">
            Total Lineup
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
            <Users className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 font-mono">
          {totalRoster}
        </div>
        <div className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 font-medium">
          Deployed players
        </div>
      </Card>

      <Card className="p-4 bg-white border-emerald-200/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
            Present
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 font-mono">
          {presentCount}
        </div>
        <div className="text-[10px] sm:text-[11px] text-emerald-600 mt-0.5 font-medium">
          {attendanceRate}% Attendance Rate
        </div>
      </Card>

      <Card className="p-4 bg-white border-red-200/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-700">
            Absent
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-red-700 font-mono">
          {absentCount}
        </div>
        <div className="text-[10px] sm:text-[11px] text-red-600 mt-0.5 font-medium">
          Unconfirmed / Out
        </div>
      </Card>

      <Card className="p-4 bg-white border-amber-200/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
            Late / Standby
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Clock3 className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-black text-amber-800 font-mono">
          {lateCount}
        </div>
        <div className="text-[10px] sm:text-[11px] text-amber-700 mt-0.5 font-medium">
          Arriving late
        </div>
      </Card>
    </div>
  );
}
