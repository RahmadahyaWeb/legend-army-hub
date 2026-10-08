"use client";

/**
 * Universal Pixel Loading Indicator Component
 *
 * Why this exists:
 * Provides a single, unified retro RPG-inspired loading state across all views,
 * tables, and dialogs. Avoids inconsistent custom spinners or heavy skeletons.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.fullScreen=false] - When true, centers across the full viewport
 * @param {string} [props.message="Loading..."] - Optional status caption
 * @param {"sm"|"md"|"lg"} [props.size="md"] - Scale of the indicator
 * @param {string} [props.className=""] - Additional class names
 * @returns {JSX.Element} Rendered loading indicator
 */
export default function Loading({
  fullScreen = false,
  message = "Loading...",
  size = "md",
  className = "",
}) {
  const containerClass = fullScreen
    ? "min-h-screen bg-zinc-50/80 flex items-center justify-center p-4"
    : "min-h-[35vh] flex items-center justify-center py-10 px-4";

  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      className={`${containerClass} ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-3 border-2 border-zinc-900 bg-white p-5 pixel-shadow">
        {/* Retro Pixel Spinning Block */}
        <div className="relative size-6">
          <div className="absolute inset-0 border-2 border-brand-600 animate-spin" />
          <div className="absolute inset-1.5 bg-zinc-900 animate-pulse" />
        </div>

        {message && (
          <span className="text-xs font-bold font-pixel text-zinc-900 uppercase tracking-wider select-none">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Small inline spinner for action buttons and micro-loading states
 * @param {Object} props
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
export function ActionSpinner({ className = "size-3.5" }) {
  return (
    <span
      className={`inline-block border-2 border-current border-t-transparent animate-spin ${className}`}
      role="status"
      aria-hidden="true"
    />
  );
}
