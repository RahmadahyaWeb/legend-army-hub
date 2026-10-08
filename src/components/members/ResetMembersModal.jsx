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
        <div className="border-2 border-amber-600 bg-amber-50 p-3.5 text-xs font-mono text-amber-950 flex items-start gap-2.5 shadow-[2px_2px_0px_#d97706]">
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
          className="font-mono font-bold"
        />

        {error && (
          <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
