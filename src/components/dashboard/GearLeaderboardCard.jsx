"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ClassBadge } from "@/utils/classColors";
import { formatNumber } from "@/utils/formatters";

/**
 * Top Gear Rating Leaderboard Card
 *
 * Why this exists:
 * Lists the top 10 highest Gear Score players in the guild.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.members - Active members list
 */
export default function GearLeaderboardCard({ members = [] }) {
  const topMembers = useMemo(() => {
    return [...members]
      .filter((member) => Number(member.gearScore) > 0)
      .sort((a, b) => Number(b.gearScore) - Number(a.gearScore))
      .slice(0, 10);
  }, [members]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Top Gear Score</CardTitle>
          <CardDescription>Highest rating among active members</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="!p-0">
        {topMembers.length > 0 ? (
          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {topMembers.map((member, index) => (
              <div
                key={member.id || index}
                className="flex items-center gap-3 px-4 py-2.5 sm:px-5 hover:bg-zinc-50/70 transition-colors"
              >
                <span className="w-5 text-center text-xs font-mono font-medium text-zinc-400">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium text-zinc-900">
                      {member.nickname}
                    </span>
                    <ClassBadge className={member.className || member.class} size="xs" />
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Lv. {member.level || 0}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-semibold text-zinc-900">
                    {formatNumber(member.gearScore)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-400">
            No member gear scores recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
