import { CheckCircle2, RotateCcw } from "lucide-react";

import { STATUS_CONFIG } from "../../utils/guildLeague";

export function GuildLeagueStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
      ].join(" ")}
    >
      <span
        className={["size-1.5 rounded-full", config.dotClassName].join(" ")}
      />

      {config.label}
    </span>
  );
}

export default function GuildLeagueStatusControl({
  status,
  updating,
  onChange,
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-content-strong">
              Event Status
            </span>

            <GuildLeagueStatusBadge status={status} />
          </div>

          <p className="mt-1 text-xs leading-5 text-content-muted">
            {config.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status === "draft" && (
            <button
              type="button"
              onClick={() => onChange("open")}
              disabled={updating}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Open Event
            </button>
          )}

          {status === "open" && (
            <>
              <button
                type="button"
                onClick={() => onChange("draft")}
                disabled={updating}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="size-3.5" />
                Back to Draft
              </button>

              <button
                type="button"
                onClick={() => onChange("completed")}
                disabled={updating}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <div className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Complete Event
              </button>
            </>
          )}

          {status === "completed" && (
            <button
              type="button"
              onClick={() => onChange("open")}
              disabled={updating}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Reopen Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
