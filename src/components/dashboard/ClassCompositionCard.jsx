"use client";

import { useMemo } from "react";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { normalizeClassName } from "@/utils/formatters";

/**
 * Class Composition Breakdown Card
 *
 * Why this exists:
 * Displays distribution of character classes with horizontal fill meters
 * across active guild members.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.members - Active member array
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
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Swords className="size-4.5" />
          </div>
          <div>
            <CardTitle>Guild Class Composition</CardTitle>
            <CardDescription>Active combat characters by job class</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {composition.length > 0 ? (
          <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
            {composition.map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <span className="truncate text-xs sm:text-sm font-bold text-zinc-800">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-xs font-mono font-bold text-zinc-900">
                    {item.count}{" "}
                    <span className="font-normal text-zinc-400">
                      ({Math.round((item.count / members.length) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${(item.count / maximum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-zinc-400">
            No member class data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
