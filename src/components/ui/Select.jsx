"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Standard dropdown select component.
 *
 * Why this exists:
 * Provides consistent styling, focus borders, label typography, and custom chevron
 * across status controls, filters, and modal selectors.
 *
 * @param {Object} props - Select props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or tip
 * @param {React.ReactNode} [props.children] - Option elements or groups
 * @param {string} [props.className] - Select element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    children,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    ...rest
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-zinc-700 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`h-10 w-full appearance-none rounded-xl border bg-white px-3.5 pr-9 text-xs sm:text-sm text-zinc-900 transition-all focus:outline-none focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-zinc-200 hover:border-zinc-300 focus:border-brand-600 focus:ring-brand-500/20"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>

        <div className="pointer-events-none absolute right-3 flex items-center justify-center text-zinc-400">
          <ChevronDown className="size-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-600 animate-in fade-in duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
