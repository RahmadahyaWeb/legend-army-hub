import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Search,
  Users,
} from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "../lib/firebase";
import CreateGuildLeagueModal from "../components/guild-league/CreateGuildLeagueModal";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    className: "bg-zinc-100 text-zinc-600",
    dotClassName: "bg-zinc-400",
  },
  open: {
    label: "Open",
    className: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },
};

function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }) {
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

function EventCard({ event }) {
  const rosterCount = Number(event.rosterCount) || 0;

  const maxRoster = Number(event.maxRoster) || 60;

  const teamCount = Number(event.teamCount) || 0;

  const percentage = Math.min(
    100,
    maxRoster > 0 ? (rosterCount / maxRoster) * 100 : 0,
  );

  return (
    <Link
      to={`/admin/guild-leagues/${event.id}`}
      className="group block w-full rounded-xl border border-line bg-white p-4 text-left transition hover:border-brand-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="hidden size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:flex">
          <CalendarDays className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-content-strong sm:text-base">
                  {event.name}
                </h2>

                <StatusBadge status={event.status} />
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-content-muted sm:text-sm">
                <CalendarDays className="size-3.5 shrink-0" />

                <span>{formatDate(event.eventDate)}</span>
              </div>
            </div>

            <ChevronRight className="mt-0.5 size-5 shrink-0 text-content-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-600" />
          </div>

          {event.notes && (
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-content-muted">
              {event.notes}
            </p>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-content-muted">
                <Users className="size-3.5" />
                Roster
              </span>

              <span className="font-medium tabular-nums text-content-strong">
                {rosterCount} / {maxRoster}
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-5 border-t border-line pt-3">
            <div>
              <span className="text-sm font-semibold tabular-nums text-content-strong">
                {teamCount}
              </span>

              <span className="ml-1.5 text-xs text-content-muted">teams</span>
            </div>

            <div>
              <span className="text-sm font-semibold tabular-nums text-content-strong">
                {rosterCount}
              </span>

              <span className="ml-1.5 text-xs text-content-muted">players</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GuildLeagues() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const guildLeagueQuery = query(
      collection(db, "guild_leagues"),
      orderBy("eventDate", "desc"),
    );

    const unsubscribe = onSnapshot(
      guildLeagueQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setEvents(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Failed to load Guild League events:", snapshotError);

        setError("Failed to load Guild League events.");

        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return events;
    }

    return events.filter((event) => {
      const searchableValues = [event.name, event.status, event.notes];

      return searchableValues
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [events, search]);

  const openEvents = useMemo(
    () => events.filter((event) => event.status === "open").length,
    [events],
  );

  const totalRoster = useMemo(
    () =>
      events.reduce(
        (total, event) => total + (Number(event.rosterCount) || 0),
        0,
      ),
    [events],
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">Legend Army</p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-content-strong sm:text-3xl">
              Guild League
            </h1>

            <p className="mt-1 text-sm text-content-muted">
              Manage events, rosters and Guild League preparation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <CirclePlus className="size-4" />
            Create event
          </button>
        </div>

        <div className="grid grid-cols-3 border-y border-line py-4">
          <div>
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {events.length}
            </div>

            <div className="mt-1 text-xs text-content-muted">Total events</div>
          </div>

          <div className="border-x border-line px-4 sm:px-6">
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {openEvents}
            </div>

            <div className="mt-1 text-xs text-content-muted">Open events</div>
          </div>

          <div className="pl-4 sm:pl-6">
            <div className="text-xl font-semibold tabular-nums text-content-strong">
              {totalRoster}
            </div>

            <div className="mt-1 text-xs text-content-muted">
              Roster entries
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events..."
              className="h-10 w-full rounded-lg border border-line-strong bg-white pl-9 pr-4 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center border-y border-line px-5 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
              <CalendarDays className="size-5 text-brand-600" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-content-strong">
              No Guild League events yet
            </h2>

            <p className="mt-1 max-w-sm text-sm leading-6 text-content-muted">
              Create your first event to start building the roster and preparing
              your teams.
            </p>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <CirclePlus className="size-4" />
              Create event
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center border-y border-line px-5 text-center">
            <Search className="size-5 text-content-subtle" />

            <h2 className="mt-3 text-sm font-medium text-content-strong">
              No events found
            </h2>

            <p className="mt-1 text-sm text-content-muted">
              Try a different search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <CreateGuildLeagueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
