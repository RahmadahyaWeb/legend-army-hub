import { useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Shield, Trash2 } from "lucide-react";

import {
  formatNumber,
  getTeamMembers,
  LANE_CONFIG,
  LANE_SELECT_GROUPS,
  getLaneConfig,
} from "../../utils/guildLeague";
import { ClassBadge } from "@/utils/classColors";

export default function TeamCard({
  teamNumber,
  membersPerTeam,
  rosterMembers,
  teamLane,
  onLaneChange,
  changingLaneTeam,
  onEmptySlotClick,
  onMemberClick,
  onRemoveMember,
  removingMemberId,
}) {
  const teamMembers = useMemo(
    () => getTeamMembers(rosterMembers, teamNumber),
    [rosterMembers, teamNumber],
  );

  const teamMembersBySlot = useMemo(() => {
    const map = new Map();

    teamMembers.forEach((member) => {
      map.set(Number(member.slotNumber), member);
    });

    return map;
  }, [teamMembers]);

  const averageGearScore = useMemo(() => {
    if (teamMembers.length === 0) {
      return 0;
    }

    const total = teamMembers.reduce(
      (sum, member) => sum + (Number(member.gearScore) || 0),
      0,
    );

    return Math.round(total / teamMembers.length);
  }, [teamMembers]);

  const laneConfig = getLaneConfig(teamLane);

  const changingLane = changingLaneTeam === teamNumber;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                laneConfig
                  ? laneConfig.iconClassName
                  : "bg-brand-50 text-brand-600",
              ].join(" ")}
            >
              <Shield className="size-4" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-content-strong">
                  Team {teamNumber}
                </h3>

                {laneConfig && (
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider",
                      laneConfig.badgeClassName,
                    ].join(" ")}
                  >
                    {laneConfig.icon && <span>{laneConfig.icon}</span>}
                    <span>{laneConfig.shortLabel}</span>
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-content-muted">
                {teamMembers.length} / {membersPerTeam} players
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold tabular-nums text-content-strong">
              {averageGearScore > 0 ? formatNumber(averageGearScore) : "—"}
            </div>

            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-subtle">
              Avg. GR
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <select
            value={teamLane || ""}
            onChange={(event) => onLaneChange(teamNumber, event.target.value)}
            disabled={changingLane}
            className={[
              "h-9 w-full appearance-none rounded-lg border px-3 pr-9 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-red-500/10 disabled:cursor-wait disabled:opacity-60",
              laneConfig
                ? laneConfig.badgeClassName
                : "border-line-strong bg-white text-content-muted",
            ].join(" ")}
          >
            <option value="">Unassigned</option>
            {LANE_SELECT_GROUPS.map((grp) => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-content-subtle" />
        </div>
      </div>

      {/* TACTICAL DUTY BANNER */}
      {laneConfig?.tacticalType === "mvp" && (
        <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/80 px-4 py-2 text-xs text-amber-950 font-medium">
          <span className="shrink-0 text-sm">👑</span>
          <div className="min-w-0 truncate">
            <span className="font-bold text-amber-900">MVP Directive: </span>
            <span>Regroup at MVP spawn at <strong>18:00</strong> & <strong>08:00</strong></span>
          </div>
        </div>
      )}

      {laneConfig?.tacticalType === "defend" && (
        <div className="flex items-center gap-2 border-b border-orange-200/70 bg-orange-50/80 px-4 py-2 text-xs text-orange-950 font-medium">
          <span className="shrink-0 text-sm">🛡️</span>
          <div className="min-w-0 truncate">
            <span className="font-bold text-orange-900">Defend Directive: </span>
            <span>Hold lane defense (Skip MVP) & delay enemy at portal</span>
          </div>
        </div>
      )}

      {laneConfig?.tacticalType === "attack" && (
        <div className="flex items-center gap-2 border-b border-red-200/70 bg-red-50/80 px-4 py-2 text-xs text-red-950 font-medium">
          <span className="shrink-0 text-sm">⚔️</span>
          <div className="min-w-0 truncate">
            <span className="font-bold text-red-900">Attack Directive: </span>
            <span>Push enemy lane and breach defensive barricades</span>
          </div>
        </div>
      )}

      <div className="divide-y divide-line">
        {Array.from(
          {
            length: membersPerTeam,
          },
          (_, index) => {
            const slotNumber = index + 1;

            const member = teamMembersBySlot.get(slotNumber);

            if (!member) {
              return (
                <button
                  key={slotNumber}
                  type="button"
                  onClick={() => onEmptySlotClick(teamNumber, slotNumber)}
                  className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-100"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-medium text-content-muted transition group-hover:bg-brand-50 group-hover:text-brand-600">
                      {slotNumber}
                    </div>

                    <div>
                      <div className="text-sm text-content-muted transition group-hover:text-content-strong">
                        Empty slot
                      </div>

                      <div className="mt-0.5 text-xs text-content-subtle">
                        Add player
                      </div>
                    </div>
                  </div>

                  <Plus className="size-4 shrink-0 text-content-subtle transition group-hover:text-brand-600" />
                </button>
              );
            }

            const removing = removingMemberId === member.id;

            return (
              <div
                key={slotNumber}
                className="flex items-center gap-2 px-4 py-2"
              >
                <button
                  type="button"
                  onClick={() => onMemberClick(member)}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                    {slotNumber}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-content-strong transition group-hover:text-brand-600">
                      {member.nickname}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
                      <ClassBadge className={member.className} size="xs" />

                      <span className="text-content-subtle">·</span>

                      <span>Lv. {member.level || "—"}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold tabular-nums text-content-strong">
                      {formatNumber(member.gearScore)}
                    </div>

                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-content-subtle">
                      GR
                    </div>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-content-subtle transition group-hover:text-brand-600" />
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveMember(member)}
                  disabled={removing}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-content-subtle transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Remove ${member.nickname}`}
                >
                  {removing ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-red-600" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
