"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Visual variant tokens for buttons inspired by classic Ragnarok Online dialogs and modern comic UI.
 * Uses crisp 2px rectangular borders, high-contrast ink lines, and restrained comic drop shadows.
 */
const VARIANTS = {
  primary:
    "bg-brand-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] hover:bg-brand-700 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-500 disabled:border-zinc-400 disabled:shadow-none",
  secondary:
    "bg-white text-zinc-950 border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] hover:bg-zinc-100 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300 disabled:shadow-none",
  danger:
    "bg-red-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] hover:bg-red-700 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:shadow-none",
  dangerOutline:
    "bg-white text-red-700 border-2 border-red-700 shadow-[2px_2px_0px_#b91c1c] hover:bg-red-50 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300",
  outline:
    "bg-white text-zinc-900 border-2 border-zinc-400 shadow-[1.5px_1.5px_0px_#18181b] hover:border-zinc-950 hover:bg-zinc-50 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-300",
  ghost:
    "bg-transparent text-zinc-700 border-2 border-transparent hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 active:bg-zinc-200",
  discord:
    "bg-[#5865F2] text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] hover:bg-[#4752C4] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-400",
  success:
    "bg-emerald-600 text-white border-2 border-zinc-950 shadow-[2px_2px_0px_#18181b] hover:bg-emerald-700 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:bg-zinc-200 disabled:text-zinc-400",
};

const SIZES = {
  xs: "h-7 px-2.5 text-[11px] font-semibold gap-1.5",
  sm: "h-8.5 px-3.5 text-xs font-semibold gap-1.5",
  md: "h-9.5 px-4 text-xs font-bold gap-2",
  lg: "h-10.5 px-5 text-sm font-bold gap-2",
  iconSm: "size-8.5 justify-center p-0",
  iconXs: "size-7 justify-center p-0",
};

/**
 * Standard interactive Comic Pixel Button component.
 *
 * Why this exists:
 * Implements the unified minimalist comic RPG pixel styling across all user-interactive actions.
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
 * @returns {JSX.Element} Rendered button
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
      className={`inline-flex items-center justify-center select-none font-sans cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-950/20 disabled:cursor-not-allowed disabled:pointer-events-none transition-[transform,background-color,border-color,box-shadow] ${variantClass} ${sizeClass} ${className}`}
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

