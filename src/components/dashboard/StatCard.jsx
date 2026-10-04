"use client";

import { Card } from "@/components/ui/Card";

/**
 * Metric Stat Card
 *
 * Why this exists:
 * Clean numerical metric display (Total Members, Active Lineup, Avg GS, etc.)
 *
 * @param {Object} props - Component props
 * @param {React.ComponentType} [props.icon] - Optional Lucide icon
 * @param {string|number} props.value - Display number or label
 * @param {string} props.label - Stat label
 * @param {string} [props.description] - Sub-caption
 */
export default function StatCard({
  icon: Icon = null,
  value,
  label,
  description,
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight text-zinc-900 truncate">
            {value}
          </div>
          <div className="mt-0.5 text-xs font-medium text-zinc-600 truncate">
            {label}
          </div>
          {description && (
            <div className="mt-0.5 text-[11px] text-zinc-400 truncate">
              {description}
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
