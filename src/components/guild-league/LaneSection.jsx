import { MapPin } from "lucide-react";
import { LANE_CONFIG } from "../../utils/guildLeague";
import TeamCard from "./TeamCard";

/**
 * LaneSection component
 *
 * Why this exists:
 * Section container for a specific tactical battlefield lane.
 *
 * @param {Object} props
 * @returns {JSX.Element|null}
 */
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
  const title = laneConfig?.label ?? "Unassigned Formations";
  const description =
    laneConfig?.description ?? "Assign these teams to Top, Mid or Bot Lane.";

  return (
    <section className="border-2 border-zinc-900 bg-white comic-shadow-sm">
      <div
        className={[
          "border-b-2 border-zinc-900 px-4 py-3 sm:px-5",
          laneConfig ? laneConfig.headerClassName : "bg-zinc-100",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                "flex size-8 shrink-0 items-center justify-center border-2 border-zinc-900",
                laneConfig
                  ? laneConfig.iconClassName
                  : "bg-zinc-100 text-zinc-800",
              ].join(" ")}
            >
              <MapPin className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold font-sans uppercase tracking-wide text-zinc-900">
                {title}
              </h2>
              <p className="text-[11px] font-sans text-zinc-600">{description}</p>
            </div>
          </div>

          <div className="shrink-0 border-2 border-zinc-900 bg-white px-2 py-0.5 text-xs font-bold font-mono text-zinc-900 comic-shadow-sm">
            {teamNumbers.length} {teamNumbers.length === 1 ? "Formation" : "Formations"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
        {teamNumbers.map((teamNumber) => (
          <TeamCard
            key={teamNumber}
            teamNumber={teamNumber}
            membersPerTeam={membersPerTeam}
            teamMembers={rosterMembers}
            onLaneChange={onLaneChange}
            onAssignSlot={onEmptySlotClick}
            onSelectMember={onMemberClick}
            onRemoveMember={onRemoveMember}
          />
        ))}
      </div>
    </section>
  );
}
