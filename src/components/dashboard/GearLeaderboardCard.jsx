"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ClassBadge } from "@/utils/classColors";
import { formatNumber } from "@/utils/formatters";

/**
 * Top Gear Rating Leaderboard Card with Retro Pixel Styling
 *
 * Why this exists:
 * Lists the top 10 highest Gear Score combatants in Legend Army.
 * Features retro rank badges (#1 gold, #2 silver, #3 bronze accents) and clear mono stats.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.members - Active members list
 * @returns {JSX.Element} Rendered leaderboard card
 */
export default function GearLeaderboardCard({ members = [] }) {
  const topMembers = useMemo(() => {
    return [...members]
      .filter((member) => Number(member.gearScore) > 0)
      .sort((a, b) => Number(b.gearScore) - Number(a.gearScore))
      .slice(0, 10);
  }, [members]);

  return (
    <Card className="overflow-hidden bg-white">
      <CardHeader>
        <div>
          <CardTitle>Top Gear Score</CardTitle>
          <CardDescription>Highest rating among active combatants</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="!p-0">
        {topMembers.length > 0 ? (
          <div className="divide-y-2 divide-zinc-100 max-h-96 overflow-y-auto">
            {topMembers.map((member, index) => {
              const rank = index + 1;
              const rankBadgeClass =
                rank === 1
                  ? "bg-amber-100 border-amber-600 text-amber-900 font-bold"
                  : rank === 2
                  ? "bg-zinc-200 border-zinc-400 text-zinc-900 font-bold"
                  : rank === 3
                  ? "bg-amber-50 border-amber-500 text-amber-800 font-bold"
                  : "bg-zinc-100 border-zinc-300 text-zinc-600";

              return (
                <div
                  key={member.id || index}
                  className="flex items-center gap-3 px-4 py-2.5 sm:px-5 hover:bg-zinc-50 transition-colors"
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center border text-[11px] font-mono select-none ${rankBadgeClass}`}
                  >
                    #{rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs sm:text-sm font-bold text-zinc-950">
                        {member.nickname}
                      </span>
                      <ClassBadge className={member.className || member.class} size="xs" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Lv. {member.level || 0}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs sm:text-sm font-black text-brand-700">
                      {formatNumber(member.gearScore)} GS
                    </span>
                  </div>
                </div>
              );
            })}
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
