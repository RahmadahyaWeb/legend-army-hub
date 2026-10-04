"use client";

/**
 * Tactical Battlefield Directives Bar
 *
 * Why this exists:
 * Displays standardized combat directives for the active match format:
 * - Guild League: MVP Strike timing, Lane Defense portal holding, Lane Assault siege.
 * - WOE: Emperium Strike, Castle Throne Defense, Chokepoint Intercept.
 * - Polarity: Polarity Attunement, 5-Man Squad Synergy, Sanctuary Node Control.
 *
 * @param {Object} props
 * @param {string} [props.eventType="guild_league"]
 * @param {boolean} [props.isWoe=false]
 * @param {boolean} [props.isPolarity=false]
 */
export default function TacticalDirectivesBar({
  eventType = "guild_league",
  isWoe = false,
  isPolarity = false,
}) {
  const currentType =
    isPolarity || eventType === "polarity"
      ? "polarity"
      : isWoe || eventType === "woe"
      ? "woe"
      : "guild_league";

  if (currentType === "polarity") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Polarity Attunement</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Buff Sync
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Coordinate light & dark polarity state, element shifts, and party buff cycles.
            </p>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Squad Synergy</span>
              <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Party Role
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Strict 5-player role balance: Frontline Tank, Priest/Support, and Burst DPS/CC.
            </p>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Sanctuary Nodes</span>
              <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Hold Shrines
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Capture arena crystals, maintain node dominance, and focus priority targets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentType === "woe") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Emperium Strike</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Target Obj
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Focus fire to break the Emperium stone during vulnerability windows.
            </p>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Castle Defense</span>
              <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Hold Gate
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Hold the throne room & protect barricades against hostile rushes.
            </p>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
              <span>Frontline Intercept</span>
              <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
                Chokepoint
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-1">
              Disrupt enemy guild charges at entrance portals and stairwells.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
            <span>MVP Strike</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
              18:00 & 08:00
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug mt-1">
            Regroup at MVP spawn at 18:00 & 08:00 to secure boss kill.
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
            <span>Lane Defense</span>
            <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
              Skip MVP
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug mt-1">
            Hold lane defense & delay enemy advance at the MVP portal.
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 font-semibold text-zinc-900">
            <span>Lane Assault</span>
            <span className="shrink-0 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 uppercase font-medium">
              Siege
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug mt-1">
            Push enemy lane and breach defensive barricades.
          </p>
        </div>
      </div>
    </div>
  );
}
