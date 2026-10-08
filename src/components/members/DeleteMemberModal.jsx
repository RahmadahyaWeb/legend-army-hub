"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteMember } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

/**
 * Delete Member Confirmation Dialog
 *
 * Why this exists:
 * Explicit confirmation safeguard preventing accidental permanent deletion of a guild member.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Object|null} props.member - Member record to delete
 * @param {() => void} props.onClose - Close callback
 * @param {() => void} [props.onSuccess] - Refresh callback after successful deletion
 */
export default function DeleteMemberModal({ open, member, onClose, onSuccess }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!open || !member) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      await deleteMember(member.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete member.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !deleting && onClose()}
      title="Delete Member"
      description="Permanent member removal confirmation"
      icon={AlertTriangle}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete Member
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Are you sure you want to remove{" "}
          <strong className="text-zinc-900">{member.nickname}</strong> from the
          guild member roster? This action cannot be undone.
        </p>

        {error && (
          <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
