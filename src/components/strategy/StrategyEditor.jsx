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
 * categorization, Discord channel push, and deletion.
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
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs h-[680px]">
      {/* EDITOR TOOLBAR */}
      <div className="flex items-center justify-between border-b border-zinc-100 p-4 bg-zinc-50/50">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">
            {selectedId ? "Edit Playbook" : "New Tactical Playbook"}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Configure battlefield plans and share with guild members
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedId && (
            <>
              <Button
                variant="outline"
                size="xs"
                icon={Trash2}
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category / Battlefield Lane"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          />
        </div>

        <Textarea
          label="Strategy Content & Tactical Notes"
          rows={14}
          required
          placeholder="Write detailed tactical instructions, rotation calls, team roles, voice channel reminders..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-mono text-xs leading-relaxed"
        />
      </form>
    </div>
  );
}
