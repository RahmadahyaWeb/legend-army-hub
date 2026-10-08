"use client";

/**
 * Tactical Battlefield Directives Bar with Retro Pixel Styling
 *
 * Why this exists:
 * Displays standardized combat directives for the active match format:
 * - Guild League: MVP Strike timing, Lane Defense portal holding, Lane Assault siege.
 * - WOE: Emperium Strike, Castle Throne Defense, Chokepoint Intercept.
 * - Polarity: Polarity Attunement, 5-Man Squad Synergy, Sanctuary Node Control.
 * Styled after classic Ragnarok Online tactical notification bulletin boards.
 *
 * @param {Object} props
 * @param {string} [props.eventType="guild_league"]
 * @param {boolean} [props.isWoe=false]
 * @param {boolean} [props.isPolarity=false]
 * @returns {JSX.Element} Rendered directives bar
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
      <div className="border-2 border-zinc-950 bg-white pixel-shadow-sm">
        <div className="grid grid-cols-1 divide-y-2 divide-zinc-950 md:grid-cols-3 md:divide-x-2 md:divide-y-0 text-xs">
          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Polarity Attunement</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Buff Sync
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Coordinate light & dark polarity state, element shifts, and party buff cycles.
            </p>
          </div>

          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Squad Synergy</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Party Role
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Strict 5-player role balance: Frontline Tank, Priest/Support, and Burst DPS/CC.
            </p>
          </div>

          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Sanctuary Nodes</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Hold Shrines
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Capture arena crystals, maintain node dominance, and focus priority targets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentType === "woe") {
    return (
      <div className="border-2 border-zinc-950 bg-white pixel-shadow-sm">
        <div className="grid grid-cols-1 divide-y-2 divide-zinc-950 md:grid-cols-3 md:divide-x-2 md:divide-y-0 text-xs">
          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Emperium Strike</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Target Obj
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Focus fire to break the Emperium stone during vulnerability windows.
            </p>
          </div>

          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Castle Defense</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Hold Gate
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Hold the throne room & protect barricades against hostile rushes.
            </p>
          </div>

          <div className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
              <span>Frontline Intercept</span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
                Chokepoint
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-snug mt-1">
              Disrupt enemy guild charges at entrance portals and stairwells.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-zinc-950 bg-white pixel-shadow-sm">
      <div className="grid grid-cols-1 divide-y-2 divide-zinc-950 md:grid-cols-3 md:divide-x-2 md:divide-y-0 text-xs">
        <div className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
            <span>MVP Strike</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
              18:00 & 08:00
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-snug mt-1">
            Regroup at MVP spawn at 18:00 & 08:00 to secure boss kill.
          </p>
        </div>

        <div className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
            <span>Lane Defense</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
              Hold Portal
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-snug mt-1">
            Hold lane defense & delay enemy advance at the MVP portal.
          </p>
        </div>

        <div className="p-3 sm:p-3.5">
          <div className="flex items-center justify-between gap-2 font-bold font-pixel text-zinc-950">
            <span>Lane Assault</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 border border-zinc-900 uppercase font-bold">
              Siege
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 leading-snug mt-1">
            Push enemy lane and breach defensive barricades.
          </p>
        </div>
      </div>
    </div>
  );
}
