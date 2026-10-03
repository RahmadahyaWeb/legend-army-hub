"use client";

import { useState } from "react";
import { Castle, Swords } from "lucide-react";
import { createGuildLeague } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const INITIAL_FORM = {
  name: "",
  opponent: "",
  matchDate: "",
  status: "draft",
  eventType: "guild_league", // "guild_league" (default) or "woe"
  maxTeams: 2,
  membersPerTeam: 10,
  notes: "",
};

/**
 * Create Guild Event Modal
 *
 * Why this exists:
 * Setup dialog for creating a new Guild Event:
 * 1. Guild League (Default: divided into 3 tactical lanes: Top, Mid, Bot)
 * 2. WOE / War of Emperium (Unified team formation without 3-lane division)
 * Supports up to 30 teams and custom player capacity per team.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal visibility
 * @param {() => void} props.onClose - Close callback
 * @param {() => void} [props.onSuccess] - Refresh callback
 */
export default function CreateGuildLeagueModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectType = (type) => {
    setForm((prev) => ({
      ...prev,
      eventType: type,
      // If user hasn't typed a custom name, auto-suggest based on type
      name:
        !prev.name || prev.name.startsWith("Guild League") || prev.name.startsWith("WOE")
          ? type === "woe"
            ? "WOE Castle War"
            : "Guild League Match"
          : prev.name,
    }));
  };

  const handleClose = () => {
    if (saving) return;
    setForm(INITIAL_FORM);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      setError("Event name / title is required.");
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
        eventType: form.eventType || "guild_league",
        maxTeams: Number(form.maxTeams) || 2,
        membersPerTeam: Number(form.membersPerTeam) || 10,
        notes: form.notes.trim(),
      });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error("Create event error:", err);
      setError(err.message || "Failed to create Guild Event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Guild Event"
      description="Setup event type, schedule, opponent/objective, and lineup capacity."
      icon={Swords}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            icon={Swords}
            onClick={handleSubmit}
          >
            Create Event
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* EVENT TYPE SELECTOR (GUILD LEAGUE VS WOE) */}
        <div>
          <label className="text-xs font-bold text-zinc-900 mb-1.5 block">
            Event Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectType("guild_league")}
              className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer ${
                form.eventType === "guild_league"
                  ? "border-red-600 bg-red-50/50 ring-1 ring-red-600 text-red-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Swords className={`size-4 ${form.eventType === "guild_league" ? "text-red-600" : "text-zinc-500"}`} />
                <span className="text-xs font-bold">Guild League (Default)</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                3-lane tactical format (Top, Mid, Bot)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType("woe")}
              className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer ${
                form.eventType === "woe"
                  ? "border-red-600 bg-red-50/50 ring-1 ring-red-600 text-red-950"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Castle className={`size-4 ${form.eventType === "woe" ? "text-red-600" : "text-zinc-500"}`} />
                <span className="text-xs font-bold">WOE (War of Emperium)</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Unified team format (No lane division)
              </p>
            </button>
          </div>
        </div>

        <Input
          label="Event / Match Title"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          placeholder={form.eventType === "woe" ? "e.g. WOE Castle Defense - Saturday" : "e.g. Guild League Season 4 - Match 1"}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={form.eventType === "woe" ? "Target Castle / Objective" : "Opponent Guild"}
            name="opponent"
            value={form.opponent}
            onChange={handleChange}
            placeholder={form.eventType === "woe" ? "e.g. Prontera Castle 1 / TBA" : "e.g. Invictus / TBA"}
          />

          <Input
            label="Event Date"
            name="matchDate"
            type="date"
            value={form.matchDate}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Input
            label="Total Teams (Up to 30)"
            name="maxTeams"
            type="number"
            min="1"
            max="30"
            value={form.maxTeams}
            onChange={handleChange}
          />

          <Input
            label="Players / Team"
            name="membersPerTeam"
            type="number"
            min="1"
            max="50"
            value={form.membersPerTeam}
            onChange={handleChange}
          />
        </div>

        <Textarea
          label="Strategy & Notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Briefing notes, strategy instructions, voice channel..."
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
