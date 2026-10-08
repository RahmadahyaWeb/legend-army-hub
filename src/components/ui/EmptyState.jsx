"use client";

/**
 * Standard Minimal Pixel Empty State Component
 *
 * Why this exists:
 * Presents a calm, retro RPG-styled empty prompt with crisp rectangular borders
 * and clear actionable call-to-actions, avoiding oversized decorative graphics.
 *
 * @param {Object} props - Component props
 * @param {string} [props.title="No data found"] - Primary empty state message
 * @param {string} [props.description=""] - Optional brief secondary text
 * @param {React.ReactNode} [props.action] - Optional CTA button
 * @param {string} [props.className=""] - Additional custom classes
 * @returns {JSX.Element} Rendered empty state container
 */
export default function EmptyState({
  title = "No data found",
  description = "",
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed border-zinc-400 bg-white py-10 px-4 text-center pixel-shadow-sm ${className}`}
    >
      <p className="text-sm font-bold font-pixel uppercase tracking-wide text-zinc-900">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 text-xs text-zinc-600 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
