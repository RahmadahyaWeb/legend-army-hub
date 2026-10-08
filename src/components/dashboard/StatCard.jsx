"use client";

import { Card } from "@/components/ui/Card";

/**
 * Metric Stat Card with Retro Pixel Styling
 *
 * Why this exists:
 * Presents core numerical metrics (Total Members, Active Lineup, Avg GS, Total Events)
 * using sharp rectangular borders, retro HP/SP icon badges, and mono-spaced values.
 *
 * @param {Object} props - Component props
 * @param {React.ComponentType} [props.icon] - Optional Lucide icon
 * @param {string|number} props.value - Display number or label
 * @param {string} props.label - Stat label
 * @param {string} [props.description] - Sub-caption
 * @returns {JSX.Element} Rendered stat card
 */
export default function StatCard({
  icon: Icon = null,
  value,
  label,
  description,
}) {
  return (
    <Card className="p-3.5 sm:p-4.5 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-950 truncate">
            {value}
          </div>
          <div className="mt-0.5 text-xs font-bold text-zinc-900 uppercase tracking-wide truncate">
            {label}
          </div>
          {description && (
            <div className="mt-0.5 text-[11px] text-zinc-500 truncate">
              {description}
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center border-2 border-zinc-900 bg-zinc-100 text-zinc-900 pixel-shadow-sm">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
