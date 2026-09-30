"use client";

import { useEffect, useState } from "react";
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
import CreateGuildLeagueModal from "@/components/guild-league/CreateGuildLeagueModal";

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function GuildLeaguesPage() {
  const [guildLeagues, setGuildLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await fetchGuildLeagues();
      setGuildLeagues(data);
      setError("");
    } catch (err) {
      console.error("Guild Leagues error:", err);
      setError(err.message || "Failed to load guild leagues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleDelete = async (id, name, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteGuildLeague(id);
      loadMatches();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete: " + err.message);
    }
  };

  const filteredMatches = guildLeagues.filter((m) => {
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Guild League Matches
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Create match events, manage team lanes, and assign player rosters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-red-600 focus:outline-none"
          >
            <option value="all">All Matches ({guildLeagues.length})</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-500"
          >
            <Plus className="size-3.5" />
            <span>New Match</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* MATCHES LIST */}
      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500">
          Loading matches...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <Swords className="size-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-900">
            No Guild League matches found
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Create your first guild league event to start organizing teams.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500"
          >
            <Plus className="size-3.5" />
            <span>Create Match</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((gl) => {
            const rosterCount = gl.assignedPlayers || gl.rosterCount || 0;
            const maxRoster = gl.maxRoster || 20;

            return (
              <div
                key={gl.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 uppercase">
                      {gl.status || "DRAFT"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(gl.id, gl.name, e)}
                      className="text-zinc-400 hover:text-red-600"
                      title="Delete match"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-zinc-900">
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

                <div className="mt-6 flex items-center justify-between gap-2 pt-4 border-t border-zinc-100">
                  <Link
                    href={`/roster/${gl.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                  >
                    <span>Public</span>
                    <ExternalLink className="size-3" />
                  </Link>

                  <Link
                    href={`/admin/guild-leagues/${gl.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800"
                  >
                    <span>Manage Roster</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateGuildLeagueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadMatches}
      />
    </div>
  );
}
