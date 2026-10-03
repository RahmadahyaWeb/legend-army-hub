"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { resetAllMembers } from "@/lib/api";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Reset Semua Member</h3>
              <p className="text-xs text-zinc-500">Kosongkan & mulai data dari awal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={resetting}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">
              Tindakan ini akan menghapus <strong>{memberCount} data member</strong> yang tersimpan di database. Setelah di-reset, Anda dapat mengimpor atau menambahkan ulang daftar member yang bersih dari awal.
            </p>
          </div>

          <p className="text-xs text-zinc-600">
            Ketik <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">RESET</span> di bawah untuk konfirmasi:
          </p>

          <input
            type="text"
            placeholder="Ketik RESET untuk konfirmasi"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            disabled={resetting}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-mono font-semibold text-zinc-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={resetting}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || confirmationInput.trim().toUpperCase() !== "RESET"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <RotateCcw className={`size-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Mereset Data..." : "Reset Semua Member"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
