"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { fetchGuildLeagues, copyRoster } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

/**
 * Copy Roster Modal Dialog
 *
 * Why this exists:
 * Allows duplicating the entire team formation and member slot positions
 * from a past Guild League match to the current target match.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal visibility
 * @param {string} props.targetLeagueId - Destination match ID
 * @param {() => void} props.onClose - Close callback
 * @param {() => void} [props.onSuccess] - Refresh callback after roster copied
 */
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
    <Modal
      open={open}
      onClose={() => !copying && onClose()}
      title="Copy Roster from Match"
      description="Duplicate team formations and player slot assignments from a previous match."
      icon={Copy}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            disabled={copying}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={copying}
            disabled={leagues.length === 0}
            icon={Copy}
            onClick={handleCopy}
          >
            Copy Roster
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500 font-medium">
            Loading previous matches...
          </div>
        ) : leagues.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No previous matches available to copy from.
          </div>
        ) : (
          <div>
            <Select
              label="Select Source Match"
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              helperText="Warning: This will overwrite existing roster positions in this match."
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.assignedPlayers || l.rosterCount || 0} players)
                </option>
              ))}
            </Select>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
