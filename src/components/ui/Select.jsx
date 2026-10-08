"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Standard comic pixel dropdown select component.
 *
 * Why this exists:
 * Delivers minimalist comic select styling with crisp 2px solid ink borders, sharp rectangular corners,
 * and high-contrast typography across filters, status selectors, and team lane pickers.
 *
 * @param {Object} props - Select props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or tip
 * @param {React.ReactNode} [props.children] - Option elements or groups
 * @param {string} [props.className] - Select element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
 * @returns {JSX.Element} Rendered select input
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
          className="block text-xs font-bold text-zinc-950 select-none uppercase tracking-wider font-sans"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`h-9.5 w-full appearance-none border-2 bg-white px-3 pr-8 text-xs sm:text-sm text-zinc-950 font-sans focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors ${
            error
              ? "border-red-600 focus:border-red-700 bg-red-50/20"
              : "border-zinc-950 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>

        <div className="pointer-events-none absolute right-2.5 flex items-center justify-center text-zinc-700">
          <ChevronDown className="size-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-red-600 font-sans">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-zinc-500 font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;

