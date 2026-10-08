"use client";

/**
 * Standard Minimal Comic Pixel Empty State Component
 *
 * Why this exists:
 * Presents a calm, retro comic RPG-styled empty prompt with crisp rectangular borders
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
      className={`flex flex-col items-center justify-center border-2 border-dashed border-zinc-400 bg-white py-10 px-4 text-center shadow-[2px_2px_0px_#18181b] font-sans ${className}`}
    >
      <p className="text-sm font-bold uppercase tracking-wider text-zinc-950 font-sans">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 text-xs text-zinc-600 max-w-sm font-sans leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

