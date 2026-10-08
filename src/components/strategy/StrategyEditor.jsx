"use client";

import { Save, Send, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

const STRATEGY_CATEGORIES = [
  "General",
  "Top Lane",
  "Mid Lane",
  "Bot Lane",
  "MVP Boss Timing",
  "Defensive Formation",
  "Siege & Barricade Push",
];

/**
 * Strategy Document Editor Panel
 *
 * Why this exists:
 * The authoring environment for match tactical directives, allowing live edits,
 * categorization, Discord channel push, and deletion in a retro pixel console style.
 *
 * @param {Object} props - Component props
 * @param {string|null} props.selectedId
 * @param {string} props.title
 * @param {string} props.category
 * @param {string} props.mapName
 * @param {string} props.content
 * @param {boolean} props.saving
 * @param {boolean} props.sendingDiscord
 * @param {(e: any) => void} props.onSave
 * @param {() => void} props.onSendDiscord
 * @param {() => void} props.onDelete
 * @param {(val: string) => void} props.setTitle
 * @param {(val: string) => void} props.setCategory
 * @param {(val: string) => void} props.setMapName
 * @param {(val: string) => void} props.setContent
 */
export default function StrategyEditor({
  selectedId,
  title,
  category,
  mapName,
  content,
  saving,
  sendingDiscord,
  onSave,
  onSendDiscord,
  onDelete,
  setTitle,
  setCategory,
  setMapName,
  setContent,
}) {
  return (
    <div className="flex flex-col border-2 border-zinc-900 bg-white overflow-hidden comic-shadow h-[680px]">
      {/* EDITOR TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-zinc-900 p-4 bg-zinc-50/80">
        <div>
          <h2 className="font-sans text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
            {selectedId ? "Edit Playbook" : "New Tactical Playbook"}
          </h2>
          <p className="text-xs font-sans text-zinc-500 mt-0.5">
            Configure battlefield plans and share with guild members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedId && (
            <>
              <Button
                variant="danger"
                size="xs"
                icon={Trash2}
                onClick={onDelete}
              >
                Delete
              </Button>

              <Button
                variant="discord"
                size="xs"
                icon={Send}
                loading={sendingDiscord}
                onClick={onSendDiscord}
              >
                {sendingDiscord ? "Pushing..." : "Push to Discord"}
              </Button>
            </>
          )}

          <Button
            variant="primary"
            size="xs"
            icon={Save}
            loading={saving}
            onClick={onSave}
          >
            {saving ? "Saving..." : "Save Playbook"}
          </Button>
        </div>
      </div>

      {/* EDITOR FIELDS */}
      <form onSubmit={onSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <Input
          label="Strategy Title"
          required
          placeholder="e.g. 18:00 MVP Portal Defense & Delay Routine"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-sans font-medium text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category / Battlefield Lane"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="font-sans text-xs sm:text-sm font-semibold"
          >
            {STRATEGY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>

          <Input
            label="Battlefield Map (Optional)"
            placeholder="e.g. Guild League Arena A"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="font-sans text-xs sm:text-sm"
          />
        </div>

        <Textarea
          label="Strategy Content & Tactical Notes"
          rows={14}
          required
          placeholder="Write detailed tactical instructions, rotation calls, team roles, voice channel reminders..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-sans text-xs sm:text-sm leading-relaxed"
        />
      </form>
    </div>
  );
}
