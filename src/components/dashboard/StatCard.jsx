"use client";

import { Card } from "@/components/ui/Card";

/**
 * Metric Stat Card
 *
 * Why this exists:
 * High-impact numerical card showcasing key statistics (Total Members, Active Roster, Avg GS, etc.)
 *
 * @param {Object} props - Component props
 * @param {React.ComponentType} props.icon - Lucide icon
 * @param {string|number} props.value - Display number or label
 * @param {string} props.label - Stat label
 * @param {string} [props.description] - Sub-caption or trend
 */
export default function StatCard({
  icon: Icon,
  value,
  label,
  description,
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 truncate font-mono">
            {value}
          </div>
          <div className="mt-1 text-xs sm:text-sm font-bold text-zinc-700 truncate">
            {label}
          </div>
          {description && (
            <div className="mt-1 text-[11px] text-zinc-400 truncate">{description}</div>
          )}
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
