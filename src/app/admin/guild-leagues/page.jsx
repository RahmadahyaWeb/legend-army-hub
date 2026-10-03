"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Plus,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import { fetchGuildLeagues, deleteGuildLeague } from "@/lib/api";
import { formatDate } from "@/utils/formatters";
import { SkeletonGrid } from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/ToastProvider";
import CreateGuildLeagueModal from "@/components/guild-league/CreateGuildLeagueModal";

/**
 * Guild League Matches Index Page
 *
 * Why this exists:
 * Lists all past and upcoming Guild League battle events, allowing guild leaders
 * to filter by status, initiate new matches, or jump to match lineup management.
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
      toastError("Failed to load matches", err.message);
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

    // Optimistic removal
    setGuildLeagues((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteGuildLeague(id);
      success("Match deleted", `"${name}" removed successfully.`);
      loadMatches(true);
    } catch (err) {
      console.error("Delete error:", err);
      toastError("Failed to delete match", err.message);
      loadMatches(true);
    }
  };

  const filteredMatches = useMemo(() => {
    if (statusFilter === "all") return guildLeagues;
    return guildLeagues.filter((m) => m.status === statusFilter);
  }, [guildLeagues, statusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Guild Events
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Create guild events & matches, organize up to 30 teams, and assign tactical lineups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="!h-8.5 !py-0 !text-xs font-semibold"
          >
            <option value="all">All Events ({guildLeagues.length})</option>
            <option value="draft">Draft Only</option>
            <option value="published">Published Only</option>
            <option value="completed">Completed Only</option>
          </Select>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            New Event
          </Button>
        </div>
      </div>

      {/* MATCHES LIST */}
      {loading && guildLeagues.length === 0 ? (
        <SkeletonGrid count={6} />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No Guild Events found"
          description={
            statusFilter !== "all"
              ? "No events match the selected status filter."
              : "Create your first guild event to start organizing teams and assigning rosters."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
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
                ? "info"
                : gl.status === "published"
                ? "success"
                : "brand";

            return (
              <Card
                key={gl.id}
                className="flex flex-col justify-between p-4 sm:p-5 hover:border-zinc-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={statusVariant} size="xs" dot>
                        {(gl.status || "DRAFT").toUpperCase()}
                      </Badge>
                      {gl.eventType === "woe" ? (
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          🏰 WOE
                        </span>
                      ) : (
                        <span className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                          ⚔️ Guild League
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(gl.id, gl.name, e)}
                      className="text-zinc-400 hover:text-red-600 transition p-1"
                      title="Delete match"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                    {gl.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs text-zinc-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-zinc-400" />
                      <span>{formatDate(gl.matchDate || gl.date)}</span>
                    </div>

                    {gl.opponent && (
                      <div className="font-semibold text-zinc-800">
                        VS: {gl.opponent}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-zinc-400" />
                      <span>
                        Roster: {rosterCount} / {maxRoster} players
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 pt-3.5 border-t border-zinc-100">
                  <Link
                    href={`/roster/${gl.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
                  >
                    <span>Public</span>
                    <ExternalLink className="size-3" />
                  </Link>

                  <Link
                    href={`/admin/guild-leagues/${gl.id}`}
                    className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-zinc-800"
                  >
                    <span>Manage Roster</span>
                    <ChevronRight className="size-3.5" />
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
