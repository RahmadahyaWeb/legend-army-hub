"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";

/**
 * Strategy List Sidebar/Panel
 *
 * Why this exists:
 * Lists all existing tactics and playbooks with category badges and dates,
 * allowing instant selection and switching between strategy documents.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.strategies - List of strategies
 * @param {string|null} props.selectedId - Currently selected strategy ID
 * @param {(strategy: Object) => void} props.onSelect - Selection callback
 * @param {() => void} props.onNew - New strategy callback
 */
export default function StrategyList({
  strategies = [],
  selectedId = null,
  onSelect,
  onNew,
}) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs h-[680px]">
      <div className="flex items-center justify-between border-b border-zinc-100 p-4 bg-zinc-50/50">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Battle Playbooks</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {strategies.length} documents
          </p>
        </div>

        <Button
          variant="primary"
          size="xs"
          icon={Plus}
          onClick={onNew}
        >
          New Strategy
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 space-y-1">
        {strategies.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No strategies recorded. Click "New Strategy" to write your first playbook.
          </div>
        ) : (
          strategies.map((strat) => {
            const isSelected = selectedId === strat.id;

            return (
              <div
                key={strat.id}
                onClick={() => onSelect(strat)}
                className={`group flex cursor-pointer flex-col gap-1.5 rounded-xl p-3 text-xs transition select-none ${
                  isSelected
                    ? "bg-brand-50 border border-brand-200 text-brand-950"
                    : "hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`font-bold text-xs truncate ${
                      isSelected
                        ? "text-brand-900"
                        : "text-zinc-900 group-hover:text-brand-700"
                    }`}
                  >
                    {strat.title || "Untitled Strategy"}
                  </span>

                  <Badge
                    variant={isSelected ? "brand" : "neutral"}
                    size="xs"
                    className="shrink-0"
                  >
                    {strat.category || "General"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{strat.mapName ? `Map: ${strat.mapName}` : "All Maps"}</span>
                  <span>{formatDate(strat.updatedAt || strat.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
