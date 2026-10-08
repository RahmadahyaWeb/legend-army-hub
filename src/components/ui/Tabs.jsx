"use client";

/**
 * Standard horizontal Comic Pixel Tab navigation list.
 *
 * Why this exists:
 * Standardizes tab styles across battlefield lanes, event filters, and category toggles
 * using crisp rectangular borders, comic pressed indicators, and clear numeric counters.
 *
 * @param {Object} props - Tabs props
 * @param {Array<{id: string, label: string, count?: number|string, icon?: React.ComponentType}>} props.tabs - Tabs definition
 * @param {string} props.activeTab - Currently active tab ID
 * @param {(tabId: string) => void} props.onChange - Tab change handler
 * @param {string} [props.className] - Custom container classes
 * @returns {JSX.Element} Rendered tabs navigation
 */
export default function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none font-sans ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 border-2 px-3 py-1.5 text-xs font-bold transition-[transform,background-color] cursor-pointer ${
              isActive
                ? "border-zinc-950 bg-zinc-950 text-white shadow-[1.5px_1.5px_0px_#18181b] translate-x-[1px] translate-y-[1px]"
                : "border-zinc-950 bg-white text-zinc-900 shadow-[1.5px_1.5px_0px_#18181b] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            }`}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-bold border ${
                  isActive
                    ? "border-white/30 bg-white/20 text-white"
                    : "border-zinc-400 bg-zinc-100 text-zinc-900"
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

