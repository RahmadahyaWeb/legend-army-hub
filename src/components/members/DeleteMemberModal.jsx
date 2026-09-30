"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { deleteMember } from "@/lib/api";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Delete Member</h3>
              <p className="text-xs text-zinc-500">Confirm member removal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-600">
            Are you sure you want to remove{" "}
            <span className="font-bold text-zinc-900">{member.nickname}</span> from
            the guild member roster? This action cannot be undone.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
