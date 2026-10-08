"use client";

/**
  * Semantic comic pixel badge styling tokens.
  * Sharp rectangular chips reminiscent of retro RPG item labels and modern comic flags.
  */
const VARIANTS = {
  brand: "bg-brand-50 text-brand-950 border-brand-700",
  success: "bg-emerald-50 text-emerald-950 border-emerald-700",
  warning: "bg-amber-50 text-amber-950 border-amber-600",
  danger: "bg-red-50 text-red-950 border-red-700",
  info: "bg-sky-50 text-sky-950 border-sky-600",
  neutral: "bg-zinc-100 text-zinc-900 border-zinc-400",
  outline: "bg-white text-zinc-950 border-zinc-950",
};

const DOTS = {
  brand: "bg-brand-600",
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  danger: "bg-red-600",
  info: "bg-sky-600",
  neutral: "bg-zinc-600",
  outline: "bg-zinc-900",
};

const SIZES = {
  xs: "px-1.5 py-0.5 text-[10px] gap-1",
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

/**
 * Standard semantic comic badge primitive.
 *
 * Why this exists:
 * Delivers sharp, comic-bordered status chips, roles, and event tags that feel right at home
 * in a Ragnarok Online-inspired guild system without muddying information density.
 *
 * @param {Object} props - Badge props
 * @param {"brand"|"success"|"warning"|"danger"|"info"|"neutral"|"outline"} [props.variant="neutral"] - Variant
 * @param {"xs"|"sm"|"md"} [props.size="sm"] - Size scale
 * @param {boolean} [props.dot=false] - Optional status indicator dot
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element} Rendered badge
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
      className={`inline-flex items-center font-bold font-sans border select-none tracking-tight leading-none ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && <span className={`size-1.5 shrink-0 ${dotClass}`} />}
      {children}
    </span>
  );
}

