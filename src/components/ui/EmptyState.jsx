"use client";

/**
 * Standard Minimal Empty State Component
 *
 * Why this exists:
 * Presents a calm, uncluttered empty state without oversized illustrations
 * or decorative icons, keeping focus on clarity and actionable next steps.
 *
 * @param {Object} props - Component props
 * @param {string} [props.title="No data found"] - Primary empty state message
 * @param {string} [props.description=""] - Optional brief secondary text
 * @param {React.ReactNode} [props.action] - Optional CTA button
 * @param {string} [props.className=""] - Additional custom classes
 */
export default function EmptyState({
  title = "No data found",
  description = "",
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-12 px-4 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
