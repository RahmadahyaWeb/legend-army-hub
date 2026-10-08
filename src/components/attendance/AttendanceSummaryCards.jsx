"use client";

import { CheckCircle2, Clock3, Users, XCircle } from "lucide-react";

/**
 * Attendance Summary Metric Cards
 *
 * Why this exists:
 * Displays real-time tactical breakdown of roll call counts (Total Roster, Present, Absent, Late)
 * and computed attendance rate for the chosen match with pixel-inspired gaming cards.
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 font-sans">
      {/* TOTAL LINEUP */}
      <div className="border-2 border-zinc-900 bg-white p-3.5 sm:p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-700">
            Total Lineup
          </span>
          <div className="flex size-7 items-center justify-center border-2 border-zinc-900 bg-zinc-100 text-zinc-950 comic-shadow-sm">
            <Users className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-zinc-950">
          {totalRoster}
        </div>
        <div className="text-[11px] font-sans text-zinc-500 mt-1">
          Deployed combatants
        </div>
      </div>

      {/* PRESENT */}
      <div className="border-2 border-emerald-800 bg-emerald-50/60 p-3.5 sm:p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-emerald-900">
            Present
          </span>
          <div className="flex size-7 items-center justify-center border-2 border-emerald-800 bg-emerald-100 text-emerald-900 comic-shadow-sm">
            <CheckCircle2 className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-900">
          {presentCount}
        </div>
        <div className="text-[11px] font-sans text-emerald-800 font-bold mt-1">
          {attendanceRate}% Check-in Rate
        </div>
      </div>

      {/* ABSENT */}
      <div className="border-2 border-red-800 bg-red-50/60 p-3.5 sm:p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-red-900">
            Absent
          </span>
          <div className="flex size-7 items-center justify-center border-2 border-red-800 bg-red-100 text-red-900 comic-shadow-sm">
            <XCircle className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-red-900">
          {absentCount}
        </div>
        <div className="text-[11px] font-sans text-red-700 font-bold mt-1">
          Unconfirmed / Out
        </div>
      </div>

      {/* LATE / STANDBY */}
      <div className="border-2 border-amber-800 bg-amber-50/60 p-3.5 sm:p-4 comic-shadow">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-950">
            Late / Standby
          </span>
          <div className="flex size-7 items-center justify-center border-2 border-amber-800 bg-amber-100 text-amber-950 comic-shadow-sm">
            <Clock3 className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-amber-950">
          {lateCount}
        </div>
        <div className="text-[11px] font-sans text-amber-800 font-bold mt-1">
          Arriving late
        </div>
      </div>
    </div>
  );
}
