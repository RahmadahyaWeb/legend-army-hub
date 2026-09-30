"use client";

import { Shield } from "lucide-react";

/**
 * Full page or major section loading state with subtle branding and spinner
 */
export function PageLoading({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3.5 py-12 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 shadow-sm border border-red-100">
          <Shield className="size-6 text-red-600" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-red-600/30 border-t-red-600 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
}

/**
 * Small inline spinner for buttons or cards
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
 * Skeleton pulse card for dashboard stat cards
 */
export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-7 w-24 rounded-lg bg-zinc-200" />
              <div className="h-4 w-32 rounded bg-zinc-100" />
              <div className="h-3 w-40 rounded bg-zinc-50" />
            </div>
            <div className="size-10 rounded-xl bg-zinc-100" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton rows for tables (Members, Attendance, etc.)
 */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse divide-y divide-zinc-100">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center justify-between px-4 py-3.5 gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="h-4 rounded bg-zinc-100"
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
 * Skeleton grid for Guild League matches
 */
export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
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
