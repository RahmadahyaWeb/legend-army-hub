"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { resetAllMembers } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

/**
 * Reset Members Confirmation Dialog
 *
 * Why this exists:
 * High-impact destructive operation requiring explicit uppercase 'RESET' string
 * confirmation before wiping all guild member data.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {number} [props.memberCount=0] - Number of members to be purged
 * @param {() => void} props.onClose - Close callback
 * @param {() => void} [props.onSuccess] - Refresh callback after reset
 */
export default function ResetMembersModal({ open, memberCount = 0, onClose, onSuccess }) {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");

  if (!open) return null;

  const handleReset = async () => {
    setResetting(true);
    setError("");

    try {
      await resetAllMembers();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Reset members error:", err);
      setError(err.message || "Failed to reset member data.");
    } finally {
      setResetting(false);
    }
  };

  const isConfirmed = confirmationInput.trim().toUpperCase() === "RESET";

  return (
    <Modal
      open={open}
      onClose={() => !resetting && onClose()}
      title="Reset All Members"
      description="Clear and start member data from scratch"
      icon={RotateCcw}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            disabled={resetting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={resetting}
            disabled={!isConfirmed}
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reset All Members
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            This action will permanently delete <strong>{memberCount} member records</strong> stored in the database. After resetting, you can import or re-add a clean member roster from scratch.
          </p>
        </div>

        <Input
          label="Type RESET below to confirm:"
          placeholder="Type RESET to confirm"
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          disabled={resetting}
          className="font-mono font-semibold"
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
