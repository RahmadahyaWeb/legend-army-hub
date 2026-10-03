"use client";

/**
 * Visual badge tokens
 */
const VARIANTS = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  outline: "bg-transparent text-zinc-600 border-zinc-300",
};

const DOTS = {
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  indigo: "bg-indigo-500",
  neutral: "bg-zinc-400",
  outline: "bg-zinc-400",
};

const SIZES = {
  xs: "px-1.5 py-0.2 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

/**
 * Standard semantic badge primitive.
 *
 * Why this exists:
 * Standarizes status chips, role indicators, and lane tags across all interfaces.
 *
 * @param {Object} props - Badge props
 * @param {"brand"|"success"|"warning"|"danger"|"info"|"indigo"|"neutral"|"outline"} [props.variant="neutral"]
 * @param {"xs"|"sm"|"md"} [props.size="sm"]
 * @param {boolean} [props.dot=false] - Optional status dot indicator
 * @param {React.ReactNode} [props.children] - Badge content
 * @param {string} [props.className] - Additional classes
 */
export default function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  children,
  className = "",
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;
  const dotClass = DOTS[variant] || DOTS.neutral;
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold border transition select-none tracking-wide ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && <span className={`size-1.5 rounded-full shrink-0 ${dotClass}`} />}
      {children}
    </span>
  );
}
