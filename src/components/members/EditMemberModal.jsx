"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { saveMember } from "@/lib/api";

export default function EditMemberModal({ open, member, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nickname: "",
    level: "",
    gearScore: "",
    className: "",
    role: "Member",
    isActive: true,
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !member) return;

    setForm({
      nickname: member.nickname ?? "",
      level: member.level ?? "",
      gearScore: member.gearScore ?? "",
      className: member.className ?? member.class ?? "",
      role: member.role ?? "Member",
      isActive: typeof member.isActive === "boolean" ? member.isActive : true,
      notes: member.notes ?? "",
    });

    setError("");
  }, [open, member]);

  if (!open || !member) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleClose = () => {
    if (saving) return;
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const nickname = form.nickname.trim();
    const className = form.className.trim();
    const level = Number(form.level);
    const gearScore = Number(form.gearScore);

    if (!nickname) {
      setError("Nickname is required.");
      return;
    }

    if (!className) {
      setError("Class is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await saveMember({
        id: member.id,
        nickname,
        className,
        level: Number.isNaN(level) ? 0 : level,
        gearScore: Number.isNaN(gearScore) ? 0 : gearScore,
        role: form.role,
        isActive: form.isActive,
        notes: form.notes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (updateError) {
      console.error("Failed to update member:", updateError);
      setError(updateError.message || "Failed to update member.");
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
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Edit Guild Member
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Update character details and combat attributes.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            <div>
              <label htmlFor="edit-nickname" className={labelClass}>
                Character Nickname
              </label>
              <input
                id="edit-nickname"
                name="nickname"
                type="text"
                required
                value={form.nickname}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-level" className={labelClass}>
                  Level
                </label>
                <input
                  id="edit-level"
                  name="level"
                  type="number"
                  min="1"
                  value={form.level}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-gear-score" className={labelClass}>
                  Gear Score
                </label>
                <input
                  id="edit-gear-score"
                  name="gearScore"
                  type="number"
                  min="0"
                  value={form.gearScore}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-class" className={labelClass}>
                  Class / Job
                </label>
                <input
                  id="edit-class"
                  name="className"
                  type="text"
                  required
                  value={form.className}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-role" className={labelClass}>
                  Guild Role
                </label>
                <input
                  id="edit-role"
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Member / Officer / Leader"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="size-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-semibold text-zinc-700">
                  Active Member (Include in average stats and guild roster)
                </span>
              </label>
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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
