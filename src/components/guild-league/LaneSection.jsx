import { MapPin } from "lucide-react";

import { LANE_CONFIG } from "../../utils/guildLeague";

import TeamCard from "./TeamCard";

export default function LaneSection({
  lane,
  teamNumbers,
  membersPerTeam,
  rosterMembers,
  teamLaneMap,
  onLaneChange,
  changingLaneTeam,
  onEmptySlotClick,
  onMemberClick,
  onRemoveMember,
  removingMemberId,
}) {
  if (teamNumbers.length === 0) {
    return null;
  }

  const laneConfig = lane === "unassigned" ? null : LANE_CONFIG[lane];

  const title = laneConfig?.label ?? "Unassigned Teams";

  const description =
    laneConfig?.description ?? "Assign these teams to Top, Mid or Bot Lane.";

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface-100">
      <div
        className={[
          "border-b px-5 py-4 sm:px-6",
          laneConfig ? laneConfig.headerClassName : "border-line bg-zinc-50",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                laneConfig
                  ? laneConfig.iconClassName
                  : "bg-zinc-200 text-zinc-600",
              ].join(" ")}
            >
              <MapPin className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-content-strong">
                {title}
              </h2>

              <p className="mt-1 text-xs text-content-muted">{description}</p>
            </div>
          </div>

          <div className="shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-content">
            {teamNumbers.length} {teamNumbers.length === 1 ? "Team" : "Teams"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
        {teamNumbers.map((teamNumber) => (
          <TeamCard
            key={teamNumber}
            teamNumber={teamNumber}
            membersPerTeam={membersPerTeam}
            rosterMembers={rosterMembers}
            teamLane={teamLaneMap.get(teamNumber) || ""}
            onLaneChange={onLaneChange}
            changingLaneTeam={changingLaneTeam}
            onEmptySlotClick={onEmptySlotClick}
            onMemberClick={onMemberClick}
            onRemoveMember={onRemoveMember}
            removingMemberId={removingMemberId}
          />
        ))}
      </div>
    </section>
  );
}
