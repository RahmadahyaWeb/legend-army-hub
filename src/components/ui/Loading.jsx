"use client";

/**
 * Universal Global & Inline Loading Component
 *
 * Why this exists:
 * Provides a single, unified, minimal loading system across all pages,
 * modals, and asynchronous content containers. Avoids inconsistent custom
 * spinners, redundant skeleton implementations, and visual clutter.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.fullScreen=false] - When true, centers across the full viewport
 * @param {string} [props.message="Loading..."] - Optional minimal status caption
 * @param {"sm"|"md"|"lg"} [props.size="md"] - Scale of the spinner indicator
 * @param {string} [props.className=""] - Additional class names for layout customization
 */
export default function Loading({
  fullScreen = false,
  message = "Loading...",
  size = "md",
  className = "",
}) {
  const spinnerSizes = {
    sm: "size-4 border-[2px]",
    md: "size-5 border-[2px]",
    lg: "size-7 border-[2.5px]",
  };

  const spinnerClass = spinnerSizes[size] || spinnerSizes.md;

  const containerClass = fullScreen
    ? "min-h-screen bg-zinc-50 flex items-center justify-center p-4"
    : "min-h-[40vh] flex items-center justify-center py-12 px-4";

  return (
    <div
      role="status"
      aria-label={message || "Loading"}
      className={`${containerClass} ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={`${spinnerClass} animate-spin rounded-full border-zinc-200 border-t-zinc-800`}
        />
        {message && (
          <span className="text-xs font-medium text-zinc-500 tracking-normal select-none">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Small inline spinner for action buttons and micro-loading states
 */
export function ActionSpinner({ className = "size-3.5" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-hidden="true"
    />
  );
}
