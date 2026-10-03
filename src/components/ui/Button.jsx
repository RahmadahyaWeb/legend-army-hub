"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Common button variants across Legend Army Guild Hub
 */
const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:scale-95 shadow-xs border border-brand-700/20",
  secondary:
    "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 active:scale-95 shadow-2xs",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-xs border border-red-700/20",
  dangerOutline:
    "bg-white text-red-600 border border-red-200 hover:bg-red-50 active:scale-95",
  outline:
    "bg-transparent text-zinc-700 border border-zinc-300 hover:bg-zinc-50 active:scale-95",
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95",
  discord:
    "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-xs border border-indigo-700/20",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-xs border border-emerald-700/20",
};

const SIZES = {
  xs: "h-7 px-2.5 text-[11px] rounded-lg gap-1.5",
  sm: "h-8.5 px-3 text-xs rounded-xl gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-base rounded-xl gap-2.5",
  iconSm: "size-8.5 rounded-xl justify-center p-0",
  iconXs: "size-7 rounded-lg justify-center p-0",
};

/**
 * Standard interactive button primitive for application consistency.
 *
 * Why this exists:
 * Standarizes button elevation, focus rings, hover transitions, and spinner animations
 * across public and admin interfaces to eliminate duplicate Tailwind string soup.
 *
 * @param {Object} props - Button props
 * @param {"primary"|"secondary"|"danger"|"dangerOutline"|"outline"|"ghost"|"discord"|"success"} [props.variant="secondary"]
 * @param {"xs"|"sm"|"md"|"lg"|"iconSm"|"iconXs"} [props.size="sm"]
 * @param {boolean} [props.loading=false] - Shows loading spinner and disables clicks
 * @param {React.ReactNode} [props.icon] - Leading icon element
 * @param {React.ReactNode} [props.children] - Button label
 * @param {string} [props.className] - Additional custom classes
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
      className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variantClass} ${sizeClass} ${className}`}
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
