"use client";

import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { fetchGuildLeagues, copyRoster } from "@/lib/api";

export default function CopyRosterModal({
  open,
  targetLeagueId,
  onClose,
  onSuccess,
}) {
  const [leagues, setLeagues] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");

    fetchGuildLeagues()
      .then((data) => {
        const available = data.filter((l) => l.id !== targetLeagueId);
        setLeagues(available);
        if (available.length > 0) setSelectedSourceId(available[0].id);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load matches for copy:", err);
        setError("Failed to load previous matches.");
        setLoading(false);
      });
  }, [open, targetLeagueId]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!selectedSourceId) {
      setError("Please select a source match to copy roster from.");
      return;
    }

    setCopying(true);
    setError("");

    try {
      await copyRoster(targetLeagueId, selectedSourceId, true);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Copy roster error:", err);
      setError(err.message || "Failed to copy roster.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Copy className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Copy Roster from Match
              </h3>
              <p className="text-xs text-zinc-500">
                Duplicate team and player assignments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              Loading previous matches...
            </div>
          ) : leagues.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No previous matches available to copy from.
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Select Source Match
              </label>
              <select
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-xs text-zinc-900"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.assignedPlayers || l.rosterCount || 0} players)
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-zinc-500">
                Warning: This will overwrite the current roster slots for this match.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={copying}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={copying || leagues.length === 0}
            onClick={handleCopy}
            className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50"
          >
            {copying ? "Copying..." : "Copy Roster"}
          </button>
        </div>
      </div>
    </div>
  );
}
