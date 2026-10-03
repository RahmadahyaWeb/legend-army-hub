import { Shield } from "lucide-react";

/**
 * Standard branded page loading state with shield icon
 */
export function PageLoading({ message = "Loading...", fullScreen = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3.5 py-16 animate-in fade-in duration-300 ${
        fullScreen ? "min-h-screen bg-zinc-50" : "min-h-[50vh]"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 shadow-sm border border-red-100">
          <Shield className="size-6 text-red-600" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-red-600/30 border-t-red-600 animate-spin" />
      </div>
      <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">
        {message}
      </p>
    </div>
  );
}

/**
 * Small inline spinner for buttons or interactive elements
 */
export function InlineSpinner({ size = "size-4", className = "" }) {
  return (
    <div
      className={`inline-block ${size} animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}

/**
 * Public Dashboard Skeleton matching the public home page layout
 */
export function PublicDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="h-16 border-b border-zinc-200 bg-white" />

      {/* HERO BANNER SKELETON */}
      <div className="border-b border-zinc-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-6 w-32 rounded-full bg-zinc-100" />
          <div className="h-10 w-96 max-w-full rounded-2xl bg-zinc-200" />
          <div className="h-5 w-80 max-w-full rounded-lg bg-zinc-100" />
        </div>
      </div>

      {/* CONTENT SKELETON */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8">
        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3"
            >
              <div className="h-8 w-24 rounded-lg bg-zinc-200" />
              <div className="h-4 w-32 rounded bg-zinc-100" />
              <div className="h-3 w-40 rounded bg-zinc-50" />
            </div>
          ))}
        </div>

        {/* NEXT MATCH CARD */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="h-5 w-40 rounded-full bg-zinc-100" />
          <div className="h-7 w-64 rounded-lg bg-zinc-200" />
          <div className="h-4 w-48 rounded bg-zinc-100" />
          <div className="h-3 w-full rounded-full bg-zinc-100" />
        </div>

        {/* 2-COLUMN BOTTOM GRID */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="h-6 w-40 rounded-lg bg-zinc-200" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-7 w-full rounded-xl bg-zinc-100" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="h-6 w-40 rounded-lg bg-zinc-200" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-7 w-full rounded-xl bg-zinc-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Skeleton matching the admin home page
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-red-100" />
        <div className="h-8 w-64 rounded-xl bg-zinc-200" />
        <div className="h-4 w-80 rounded bg-zinc-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 rounded-2xl border border-zinc-200 bg-white p-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-24 rounded-lg bg-zinc-200" />
            <div className="h-4 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="h-5 w-32 rounded-full bg-zinc-100" />
          <div className="h-6 w-48 rounded-lg bg-zinc-200" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-40 rounded bg-zinc-100" />
            <div className="h-4 w-32 rounded bg-zinc-100" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="h-5 w-40 rounded-lg bg-zinc-200" />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-6 w-full rounded-lg bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full Roster Detail Skeleton for public roster and admin roster manager
 */
export function RosterDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* HEADER INFO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-red-100" />
          <div className="h-8 w-64 rounded-xl bg-zinc-200" />
          <div className="h-4 w-48 rounded bg-zinc-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-zinc-200" />
          <div className="h-10 w-28 rounded-xl bg-zinc-200" />
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-zinc-200 bg-white p-5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-zinc-100" />
            <div className="h-7 w-32 rounded-lg bg-zinc-200" />
          </div>
        ))}
      </div>

      {/* LANE SECTIONS */}
      {Array.from({ length: 3 }, (_, lIndex) => (
        <div key={lIndex} className="space-y-4 pt-2">
          {/* LANE HEADER */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-zinc-200" />
              <div className="space-y-1">
                <div className="h-5 w-32 rounded bg-zinc-200" />
                <div className="h-3 w-48 rounded bg-zinc-100" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-200" />
          </div>

          {/* TEAMS IN LANE */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }, (_, tIndex) => (
              <div
                key={tIndex}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 p-4 bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-zinc-200" />
                    <div className="h-4 w-28 rounded bg-zinc-200" />
                  </div>
                  <div className="h-6 w-20 rounded bg-zinc-200" />
                </div>
                <div className="divide-y divide-zinc-100 p-2">
                  {Array.from({ length: 5 }, (_, sIndex) => (
                    <div
                      key={sIndex}
                      className="flex items-center justify-between py-2.5 px-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-4 rounded bg-zinc-200 font-mono" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-24 rounded bg-zinc-200" />
                          <div className="h-2.5 w-16 rounded bg-zinc-100" />
                        </div>
                      </div>
                      <div className="h-3.5 w-16 rounded bg-zinc-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton rows for tables (Members, Attendance, Users, etc.)
 */
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-pulse divide-y divide-zinc-100">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center justify-between px-4 py-3.5 gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="h-4 rounded-md bg-zinc-100"
              style={{
                width: c === 0 ? "25%" : c === cols - 1 ? "15%" : "18%",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton grid for Guild League matches cards
 */
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded-full bg-zinc-100" />
              <div className="h-4 w-20 rounded bg-zinc-100" />
            </div>
            <div className="h-6 w-3/4 rounded-lg bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-4 w-1/2 rounded bg-zinc-100" />
              <div className="h-4 w-2/3 rounded bg-zinc-100" />
            </div>
          </div>
          <div className="h-9 w-full rounded-xl bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

