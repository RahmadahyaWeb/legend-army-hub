"use client";

import { useState } from "react";
import { CalendarDays, Swords, X } from "lucide-react";
import { createGuildLeague } from "@/lib/api";

const INITIAL_FORM = {
  name: "",
  opponent: "",
  matchDate: "",
  status: "draft",
  maxTeams: 2,
  membersPerTeam: 10,
  notes: "",
};

export default function CreateGuildLeagueModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (saving) return;
    setForm(INITIAL_FORM);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      setError("Event name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createGuildLeague({
        name: form.name.trim(),
        opponent: form.opponent.trim() || "TBA",
        matchDate: form.matchDate || new Date().toISOString(),
        status: form.status,
        maxTeams: Number(form.maxTeams) || 2,
        membersPerTeam: Number(form.membersPerTeam) || 10,
        notes: form.notes.trim(),
      });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error("Create match error:", err);
      setError(err.message || "Failed to create Guild League match.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-600 focus:ring-1 focus:ring-red-600";
  const labelClass = "text-xs font-semibold text-zinc-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Swords className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Create Guild League Match
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Setup match schedule and team roster slots
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            <div>
              <label htmlFor="gl-name" className={labelClass}>
                Match / Event Title
              </label>
              <input
                id="gl-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Guild League Season 4 - Match 1"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="gl-opponent" className={labelClass}>
                  Opponent Guild
                </label>
                <input
                  id="gl-opponent"
                  name="opponent"
                  type="text"
                  value={form.opponent}
                  onChange={handleChange}
                  placeholder="e.g. Invictus / TBA"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="gl-date" className={labelClass}>
                  Match Date
                </label>
                <input
                  id="gl-date"
                  name="matchDate"
                  type="date"
                  value={form.matchDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="gl-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="gl-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="gl-teams" className={labelClass}>
                  Total Teams
                </label>
                <input
                  id="gl-teams"
                  name="maxTeams"
                  type="number"
                  min="1"
                  max="12"
                  value={form.maxTeams}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="gl-members-per-team" className={labelClass}>
                  Players / Team
                </label>
                <input
                  id="gl-members-per-team"
                  name="membersPerTeam"
                  type="number"
                  min="1"
                  max="20"
                  value={form.membersPerTeam}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="gl-notes" className={labelClass}>
                Strategy & Notes
              </label>
              <textarea
                id="gl-notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Briefing notes, strategy instructions, voice channel..."
                className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-zinc-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Match"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
