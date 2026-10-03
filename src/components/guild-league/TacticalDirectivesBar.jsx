"use client";

/**
 * Tactical Battlefield Directives Bar
 *
 * Why this exists:
 * Communicates the standard 3-tier guild war assignment protocols
 * (MVP Strike timing, Lane Defense portal holding, Lane Assault siege).
 */
export default function TacticalDirectivesBar() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
      <div className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0 text-xs">
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
            👑
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
              <span>MVP Strike</span>
              <span className="shrink-0 font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                18:00 & 08:00
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
              Regroup at MVP spawn at 18:00 & 08:00 to secure boss kill.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 sm:p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800 text-sm border border-orange-200">
            🛡️
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
              <span>Lane Defense</span>
              <span className="shrink-0 text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 uppercase font-bold">
                Skip MVP
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
              Hold lane defense & delay enemy advance at the MVP portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 sm:p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-800 text-sm border border-red-200">
            ⚔️
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 font-bold text-zinc-900">
              <span>Lane Assault</span>
              <span className="shrink-0 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 uppercase font-bold">
                Siege
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">
              Push enemy lane and breach defensive barricades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
