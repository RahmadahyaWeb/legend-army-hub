import { useEffect, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { X } from "lucide-react";

import { db } from "../../lib/firebase";
import { useToast } from "../ui/ToastProvider";

export default function EditMemberModal({ open, member, onClose }) {
  const toast = useToast();

  const [form, setForm] = useState({
    nickname: "",
    level: "",
    gearScore: "",
    className: "",
    title: "",
    gender: "",
    position: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !member) {
      return;
    }

    setForm({
      nickname: member.nickname ?? "",
      level: member.level ?? "",
      gearScore: member.gearScore ?? "",
      className: member.className ?? "",
      title: member.title ?? "",
      gender: member.gender ?? "",
      position: member.position ?? "",
    });

    setError("");
  }, [open, member]);

  if (!open || !member) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (saving) {
      return;
    }

    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nickname = form.nickname.trim();
    const className = form.className.trim();
    const title = form.title.trim();
    const position = form.position.trim();
    const gender = form.gender.trim().toUpperCase();

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

    if (form.level === "" || Number.isNaN(level) || level < 1) {
      setError("Please enter a valid level.");
      return;
    }

    if (form.gearScore === "" || Number.isNaN(gearScore) || gearScore < 0) {
      setError("Please enter a valid gear score.");
      return;
    }

    if (gender && gender !== "M" && gender !== "F") {
      setError("Gender must be M or F.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateDoc(doc(db, "members", member.id), {
        nickname,
        nicknameNormalized: nickname.toLowerCase(),
        level,
        gearScore,
        className,
        title,
        gender,
        position,
        updatedAt: serverTimestamp(),
      });

      onClose();

      toast.success(
        "Member updated",
        `${nickname}'s information has been updated.`,
      );
    } catch (updateError) {
      console.error("Failed to update member:", updateError);

      setError("Failed to update member. Please try again.");

      toast.error("Update failed", "Member information could not be updated.");
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
              Edit member
            </h2>

            <p className="mt-0.5 text-sm text-content-muted">
              Update character information.
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
              <label htmlFor="edit-nickname" className={labelClass}>
                Nickname
              </label>

              <input
                id="edit-nickname"
                name="nickname"
                type="text"
                value={form.nickname}
                onChange={handleChange}
                className={inputClass}
                autoComplete="off"
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

            <div>
              <label htmlFor="edit-class" className={labelClass}>
                Class
              </label>

              <input
                id="edit-class"
                name="className"
                type="text"
                value={form.className}
                onChange={handleChange}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="edit-title" className={labelClass}>
                Title
              </label>

              <input
                id="edit-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-gender" className={labelClass}>
                  Gender
                </label>

                <select
                  id="edit-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Not specified</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-position" className={labelClass}>
                  Position
                </label>

                <input
                  id="edit-position"
                  name="position"
                  type="text"
                  value={form.position}
                  onChange={handleChange}
                  className={inputClass}
                  autoComplete="off"
                />
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
              className="h-10 min-w-28 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
