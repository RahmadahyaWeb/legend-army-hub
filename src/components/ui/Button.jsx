"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Visual variant tokens for buttons inspired by classic Ragnarok Online dialog and action buttons.
 * Uses crisp rectangular borders, bold contrast, and tactical pixel shadows.
 */
const VARIANTS = {
  primary:
    "bg-brand-600 text-white border-2 border-brand-950 pixel-shadow-sm hover:bg-brand-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-500 disabled:border-zinc-400 disabled:shadow-none",
  secondary:
    "bg-white text-zinc-900 border-2 border-zinc-900 pixel-shadow-sm hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300 disabled:shadow-none",
  danger:
    "bg-red-600 text-white border-2 border-red-950 pixel-shadow-sm hover:bg-red-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:shadow-none",
  dangerOutline:
    "bg-white text-red-700 border-2 border-red-600 pixel-shadow-sm hover:bg-red-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  outline:
    "bg-white text-zinc-800 border-2 border-zinc-400 pixel-shadow-sm hover:bg-zinc-100 hover:border-zinc-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  ghost:
    "bg-transparent text-zinc-700 border-2 border-transparent hover:bg-zinc-200 hover:text-zinc-900 active:bg-zinc-300",
  discord:
    "bg-[#5865F2] text-white border-2 border-[#2f3896] pixel-shadow-sm hover:bg-[#4752C4] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
  success:
    "bg-emerald-600 text-white border-2 border-emerald-950 pixel-shadow-sm hover:bg-emerald-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
};

const SIZES = {
  xs: "h-7 px-2 text-[11px] gap-1.5",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-xs font-semibold gap-2",
  lg: "h-10 px-5 text-sm font-semibold gap-2",
  iconSm: "size-8 justify-center p-0",
  iconXs: "size-7 justify-center p-0",
};

/**
 * Standard interactive Pixel Button component.
 *
 * Why this exists:
 * Implements the unified retro RPG pixel styling across all user-interactive actions.
 * Guarantees tactile feedback with retro stepped shadows and active state translation
 * while maintaining strict accessibility, focus visibility, and responsive touch targets.
 *
 * @param {Object} props - Button configuration
 * @param {"primary"|"secondary"|"danger"|"dangerOutline"|"outline"|"ghost"|"discord"|"success"} [props.variant="secondary"] - Color variant
 * @param {"xs"|"sm"|"md"|"lg"|"iconSm"|"iconXs"} [props.size="sm"] - Button dimensions
 * @param {boolean} [props.loading=false] - Display action spinner
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {React.ComponentType} [props.icon] - Leading icon element
 * @param {React.ReactNode} [props.children] - Button label
 * @param {string} [props.className] - Additional Tailwind classes
 * @param {"button"|"submit"|"reset"} [props.type="button"] - HTML button type
 * @returns {JSX.Element} Rendered pixel button
 */
const Button = forwardRef(function Button(
  {
    variant = "secondary",
    size = "sm",
    loading = false,
    disabled = false,
    icon: Icon = null,
    children,
    className = "",
    type = "button",
    ...rest
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.secondary;
  const sizeClass = SIZES[size] || SIZES.sm;
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium select-none focus:outline-none focus:ring-2 focus:ring-zinc-950/20 disabled:pointer-events-none transition-transform ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="size-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;
