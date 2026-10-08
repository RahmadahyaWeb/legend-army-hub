"use client";

import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { saveMember } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

/**
 * Edit Member Modal Dialog
 *
 * Why this exists:
 * Allows administrators to update character class, combat attributes (level, gear score),
 * guild role, and active status for a specific guild member.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Object|null} props.member - Member record being edited
 * @param {() => void} props.onClose - Close callback
 * @param {() => void} [props.onSuccess] - Refresh callback after successful save
 */
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

  // Populate form fields when member prop changes
  useEffect(() => {
    if (member && open) {
      setForm({
        nickname: member.nickname ?? "",
        level: member.level ? String(member.level) : "",
        gearScore: member.gearScore ? String(member.gearScore) : "",
        className: member.className ?? member.class ?? "",
        role: member.role ?? "Member",
        isActive: typeof member.isActive === "boolean" ? member.isActive : true,
        notes: member.notes ?? "",
      });
      setError("");
    }
  }, [member, open]);

  if (!open || !member) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const nickname = form.nickname.trim();
    const className = form.className.trim();
    const level = Number(form.level);
    const gearScore = Number(form.gearScore);

    if (!nickname) {
      setError("Character nickname is required.");
      return;
    }

    if (!className) {
      setError("Class / Job name is required.");
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

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Edit Guild Member"
      description="Update character details, class assignment, and combat attributes."
      icon={UserCheck}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Character Nickname"
          name="nickname"
          required
          value={form.nickname}
          onChange={handleChange}
          placeholder="e.g. ShadowKnight"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Base Level"
            name="level"
            type="number"
            min="1"
            value={form.level}
            onChange={handleChange}
            placeholder="e.g. 110"
          />

          <Input
            label="Gear Score (GS)"
            name="gearScore"
            type="number"
            min="0"
            value={form.gearScore}
            onChange={handleChange}
            placeholder="e.g. 450000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Class / Job"
            name="className"
            required
            value={form.className}
            onChange={handleChange}
            placeholder="e.g. Paladin, High Priest"
          />

          <Input
            label="Guild Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            placeholder="Member / Officer / Leader"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="size-4 rounded-none border-2 border-zinc-950 text-brand-600 focus:ring-0"
            />
            <span className="text-xs font-mono font-bold text-zinc-900">
              Active Member (Include in guild power calculations & roster)
            </span>
          </label>
        </div>

        {error && (
          <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono font-bold text-red-700 shadow-[2px_2px_0px_#b91c1c]">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
