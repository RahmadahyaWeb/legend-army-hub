import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { CalendarDays, X } from "lucide-react";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

const INITIAL_FORM = {
  name: "",
  eventDate: "",
  status: "draft",
  notes: "",
};

export default function CreateGuildLeagueModal({ open, onClose }) {
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) {
      return;
    }

    reset();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name = form.name.trim();
    const notes = form.notes.trim();

    if (!name) {
      setError("Event name is required.");

      return;
    }

    if (!form.eventDate) {
      setError("Event date is required.");

      return;
    }

    if (!["draft", "open", "completed"].includes(form.status)) {
      setError("Invalid event status.");

      return;
    }

    const selectedDate = new Date(`${form.eventDate}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Invalid event date.");

      return;
    }

    setSaving(true);
    setError("");

    try {
      await addDoc(collection(db, "guild_leagues"), {
        name,
        eventDate: Timestamp.fromDate(selectedDate),
        status: form.status,
        notes,

        rosterCount: 0,
        teamCount: 0,
        maxTeams: 12,
        membersPerTeam: 5,
        maxRoster: 60,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      reset();
      onClose();

      toast.success(
        "Guild League created",
        `${name} has been created successfully.`,
      );
    } catch (createError) {
      console.error("Failed to create Guild League:", createError);

      setError("Failed to create Guild League. Please try again.");

      toast.error(
        "Creation failed",
        "Guild League event could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";

  const labelClass = "text-xs font-medium text-content-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-xl sm:max-w-lg sm:rounded-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-content-strong">
              Create Guild League
            </h2>

            <p className="mt-0.5 text-sm text-content-muted">
              Create a new Guild League event.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex size-9 items-center justify-center rounded-lg text-content-muted transition hover:bg-surface-200 hover:text-content-strong disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <label htmlFor="guild-league-name" className={labelClass}>
                Event name
              </label>

              <input
                id="guild-league-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Guild League - Week 1"
                className={inputClass}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="guild-league-date" className={labelClass}>
                Event date
              </label>

              <div className="relative mt-1.5">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-subtle" />

                <input
                  id="guild-league-date"
                  name="eventDate"
                  type="date"
                  value={form.eventDate}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-line-strong bg-white pl-9 pr-3 text-sm text-content-strong outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="guild-league-status" className={labelClass}>
                Status
              </label>

              <select
                id="guild-league-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="draft">Draft</option>

                <option value="open">Open</option>

                <option value="completed">Completed</option>
              </select>

              <p className="mt-1.5 text-xs leading-5 text-content-subtle">
                Draft events are still being prepared. Open events are ready for
                roster management.
              </p>
            </div>

            <div>
              <label htmlFor="guild-league-notes" className={labelClass}>
                Notes
              </label>

              <textarea
                id="guild-league-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Optional notes about this Guild League..."
                className="mt-1.5 w-full resize-none rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm leading-5 text-content-strong outline-none transition placeholder:text-content-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>

            <div className="rounded-lg border border-line bg-surface-100 px-4 py-3">
              <div className="grid grid-cols-3 divide-x divide-line">
                <div className="pr-3">
                  <p className="text-lg font-semibold text-content-strong">
                    12
                  </p>

                  <p className="mt-0.5 text-xs text-content-muted">Teams</p>
                </div>

                <div className="px-3">
                  <p className="text-lg font-semibold text-content-strong">5</p>

                  <p className="mt-0.5 text-xs text-content-muted">Per team</p>
                </div>

                <div className="pl-3">
                  <p className="text-lg font-semibold text-content-strong">
                    60
                  </p>

                  <p className="mt-0.5 text-xs text-content-muted">
                    Max roster
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-line px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-content transition hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-10 min-w-32 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
