"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
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
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Trophy className="size-4.5" />
          </div>
          <div>
            <CardTitle>Top Gear Rating</CardTitle>
            <CardDescription>Highest Gear Score among active members</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="!p-0">
        {topMembers.length > 0 ? (
          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {topMembers.map((member, index) => (
              <div
                key={member.id || index}
                className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-zinc-50/70 transition"
              >
                <div
                  className={`flex size-6.5 shrink-0 items-center justify-center rounded-full text-[11px] font-black font-mono select-none ${
                    index === 0
                      ? "bg-amber-100 text-amber-800"
                      : index === 1
                      ? "bg-zinc-200 text-zinc-800"
                      : index === 2
                      ? "bg-orange-100 text-orange-800"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm font-bold text-zinc-900">
                    {member.nickname}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <ClassBadge className={member.className} size="xs" />
                    {Number(member.level) > 0 && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Lv. {member.level}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs sm:text-sm font-bold tabular-nums font-mono text-zinc-900">
                    {formatNumber(member.gearScore)}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    GS
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-xs text-zinc-400">
            No gear score data recorded.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
