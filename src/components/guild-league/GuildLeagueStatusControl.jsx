import { CheckCircle2, RotateCcw } from "lucide-react";
import { STATUS_CONFIG } from "../../utils/guildLeague";

/**
 * Renders status tag badge with pixel styling
 */
export function GuildLeagueStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 border-2 border-zinc-950 px-2.5 py-0.5 text-xs font-mono font-bold uppercase shadow-[1px_1px_0px_#09090b]",
        config.className,
      ].join(" ")}
    >
      <span
        className={["size-2 rounded-none border border-zinc-950", config.dotClassName].join(" ")}
      />
      {config.label}
    </span>
  );
}

/**
 * Guild League Status Control
 * Why this exists: Quick status toggler for match event state
 */
export default function GuildLeagueStatusControl({
  status,
  updating,
  onChange,
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 shadow-[3px_3px_0px_#09090b]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-pixel text-sm font-bold text-zinc-950">
              Event Status
            </span>

            <GuildLeagueStatusBadge status={status} />
          </div>

          <p className="mt-1 text-xs font-mono text-zinc-600">
            {config.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status === "draft" && (
            <button
              type="button"
              onClick={() => onChange("open")}
              disabled={updating}
              className="inline-flex h-9 items-center justify-center gap-2 border-2 border-zinc-950 bg-emerald-600 px-3 text-xs font-mono font-bold text-white shadow-[2px_2px_0px_#09090b] transition hover:bg-emerald-700 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              Open Event
            </button>
          )}

          {status === "open" && (
            <>
              <button
                type="button"
                onClick={() => onChange("draft")}
                disabled={updating}
                className="inline-flex h-9 items-center justify-center gap-2 border-2 border-zinc-950 bg-white px-3 text-xs font-mono font-bold text-zinc-900 shadow-[2px_2px_0px_#09090b] transition hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" />
                Back to Draft
              </button>

              <button
                type="button"
                onClick={() => onChange("completed")}
                disabled={updating}
                className="inline-flex h-9 items-center justify-center gap-2 border-2 border-zinc-950 bg-blue-600 px-3 text-xs font-mono font-bold text-white shadow-[2px_2px_0px_#09090b] transition hover:bg-blue-700 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5" />
                Complete Event
              </button>
            </>
          )}

          {status === "completed" && (
            <button
              type="button"
              onClick={() => onChange("open")}
              disabled={updating}
              className="inline-flex h-9 items-center justify-center gap-2 border-2 border-zinc-950 bg-white px-3 text-xs font-mono font-bold text-zinc-900 shadow-[2px_2px_0px_#09090b] transition hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              Reopen Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
