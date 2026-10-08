"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { fetchGuildLeagues, deleteGuildLeague } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import Loading from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import CreateGuildLeagueModal from "@/components/guild-league/CreateGuildLeagueModal";

/**
 * Guild Events Index Page with Retro Pixel Styling
 *
 * Why this exists:
 * Lists all past and upcoming Guild Events (Guild League, War of Emperium, Polarity),
 * allowing officers to filter by status, schedule new events, or manage team lineups.
 *
 * @returns {JSX.Element} Rendered events index page
 */
export default function GuildLeaguesPage() {
  const { success, error: toastError } = useToast();

  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadMatches = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchGuildLeagues(silent);
      setGuildLeagues(data);
    } catch (err) {
      console.error("Guild Leagues error:", err);
      toastError("Failed to load events", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches(false);
  }, []);

  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setGuildLeagues((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteGuildLeague(id);
      success("Event deleted", `"${name}" removed successfully.`);
      loadMatches(true);
    } catch (err) {
      console.error("Delete error:", err);
      toastError("Failed to delete event", err.message);
      loadMatches(true);
    }
  };

  const filteredMatches = useMemo(() => {
    if (statusFilter === "all") return guildLeagues;
    return guildLeagues.filter((m) => m.status === statusFilter);
  }, [guildLeagues, statusFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-sans text-zinc-950 tracking-tight">
            Guild Events
          </h1>
          <p className="mt-0.5 text-xs text-zinc-600">
            Create events, organize tactical formations, and deploy member rosters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="!h-8.5 !py-0 !text-xs font-bold"
          >
            <option value="all">All Events ({guildLeagues.length})</option>
            <option value="draft">Draft Only</option>
            <option value="published">Published Only</option>
            <option value="completed">Completed Only</option>
          </Select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            New Event
          </Button>
        </div>
      </div>

      {/* MATCHES LIST */}
      {loading ? (
        <Loading message="Loading events..." />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          title="No events found"
          description={
            statusFilter !== "all"
              ? "No events match the selected status filter."
              : "Create an event to start assigning lineups."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Event
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((gl) => {
            const rosterCount = gl.assignedPlayers || gl.rosterCount || 0;
            const maxRoster = gl.maxRoster || 20;
            const statusVariant =
              gl.status === "completed"
                ? "neutral"
                : gl.status === "published"
                ? "success"
                : "brand";

            return (
              <Card
                key={gl.id}
                className="flex flex-col justify-between p-4 sm:p-5 bg-white comic-shadow-sm hover:comic-shadow transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={statusVariant} size="xs" dot>
                        {(gl.status || "DRAFT").toUpperCase()}
                      </Badge>
                      {gl.eventType === "woe" ? (
                        <Badge variant="warning" size="xs">
                          WOE
                        </Badge>
                      ) : gl.eventType === "polarity" ? (
                        <Badge variant="info" size="xs">
                          Polarity
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="xs">
                          Guild League
                        </Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(gl.id, gl.name, e)}
                      className="border border-zinc-400 bg-white p-1 text-zinc-500 hover:border-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-sm sm:text-base font-bold font-sans text-zinc-950 tracking-tight line-clamp-1">
                    {gl.name}
                  </h3>

                  <div className="mt-2.5 space-y-1 text-xs text-zinc-600 font-mono">
                    <div>{formatDate(gl.matchDate || gl.date)}</div>

                    {gl.opponent && (
                      <div className="text-zinc-800">
                        {gl.eventType === "woe" ? "Target: " : "Opponent: "}
                        <span className="font-bold text-zinc-950">{gl.opponent}</span>
                      </div>
                    )}

                    <div className="font-bold text-zinc-900">
                      Roster: {rosterCount} / {maxRoster} players
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t-2 border-zinc-950">
                  <Link
                    href={`/roster/${gl.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors"
                  >
                    <span>Public</span>
                    <ExternalLink className="size-3" />
                  </Link>

                  <Link href={`/admin/guild-leagues/${gl.id}`}>
                    <Button variant="primary" size="xs">
                      Manage Lineup
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateGuildLeagueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadMatches(true);
          success("Event created", "New guild event has been registered.");
        }}
      />
    </div>
  );
}
