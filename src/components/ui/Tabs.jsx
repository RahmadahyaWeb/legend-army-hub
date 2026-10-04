"use client";

/**
 * Standard horizontal tab navigation list.
 *
 * Why this exists:
 * Standarizes tab styles across battlefield lanes, status filters, and category toggles.
 *
 * @param {Object} props - Tabs props
 * @param {Array<{id: string, label: string, count?: number|string, icon?: React.ComponentType}>} props.tabs - Tabs definition
 * @param {string} props.activeTab - Currently active tab ID
 * @param {(tabId: string) => void} props.onChange - Tab change handler
 * @param {string} [props.className] - Custom container classes
 */
export default function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition select-none ${
              isActive
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
