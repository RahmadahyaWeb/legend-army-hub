"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ClassBadge } from "@/utils/classColors";
import { normalizeClassName } from "@/utils/formatters";

/**
 * Class Composition Breakdown Card with Retro Pixel Styling
 *
 * Why this exists:
 * Displays distribution of character classes across active guild members using
 * crisp progress meters and Ragnarok Online job badge chips.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.members - Active member array
 * @returns {JSX.Element} Rendered composition card
 */
export default function ClassCompositionCard({ members = [] }) {
  const composition = useMemo(() => {
    const classes = new Map();
    members.forEach((member) => {
      const className = normalizeClassName(member);
      classes.set(className, (classes.get(className) || 0) + 1);
    });

    return Array.from(classes.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [members]);

  const maximum = composition.length > 0 ? composition[0].count : 1;

  return (
    <Card className="overflow-hidden bg-white">
      <CardHeader>
        <div>
          <CardTitle>Class Composition</CardTitle>
          <CardDescription>Active characters by Ragnarok job path</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {composition.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {composition.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <ClassBadge className={item.name} size="xs" />
                  </div>
                  <span className="shrink-0 text-xs font-mono font-bold text-zinc-950">
                    {item.count} {item.count === 1 ? "member" : "members"}
                  </span>
                </div>
                <div className="h-2 w-full border border-zinc-900 bg-zinc-100 p-0.2">
                  <div
                    className="h-full bg-zinc-900 transition-all duration-200"
                    style={{
                      width: `${Math.max(4, Math.round((item.count / maximum) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-400">
            No class data recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
