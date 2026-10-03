"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
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
  maxTeams: 2,
  membersPerTeam: 10,
  notes: "",
};

/**
 * Create Guild League Match Modal
 *
 * Why this exists:
 * Setup dialog for creating a new Guild League match, configuring opponent,
 * schedule, total teams, and player capacity per team.
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
      setError("Match name / title is required.");
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Guild League Match"
      description="Setup match schedule, opponent details, and lineup capacity."
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
            Create Match
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Match / Event Title"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Guild League Season 4 - Match 1"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Opponent Guild"
            name="opponent"
            value={form.opponent}
            onChange={handleChange}
            placeholder="e.g. Invictus / TBA"
          />

          <Input
            label="Match Date"
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
            label="Total Teams"
            name="maxTeams"
            type="number"
            min="1"
            max="12"
            value={form.maxTeams}
            onChange={handleChange}
          />

          <Input
            label="Players / Team"
            name="membersPerTeam"
            type="number"
            min="1"
            max="20"
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
