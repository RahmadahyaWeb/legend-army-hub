"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Standard button variants adhering to clean, calm visual hierarchy
 */
const VARIANTS = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 disabled:bg-zinc-200 disabled:text-zinc-400",
  secondary:
    "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-zinc-200 disabled:text-zinc-400",
  dangerOutline:
    "bg-white text-red-600 border border-red-200 hover:bg-red-50 active:bg-red-100",
  outline:
    "bg-transparent text-zinc-700 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100",
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  discord:
    "bg-[#5865F2] text-white hover:bg-[#4752C4] active:bg-[#3c45a5]",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  sm: "h-8.5 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9.5 px-4 text-sm rounded-lg gap-2",
  lg: "h-10.5 px-5 text-sm rounded-lg gap-2",
  iconSm: "size-8.5 rounded-lg justify-center p-0",
  iconXs: "size-7 rounded-md justify-center p-0",
};

/**
 * Standard interactive button primitive for application consistency.
 *
 * Why this exists:
 * Standardizes button hierarchy (primary, secondary, danger, ghost), focus rings,
 * hover transitions, and action loading state across all views.
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
      className={`inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:pointer-events-none ${variantClass} ${sizeClass} ${className}`}
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
