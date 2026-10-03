"use client";

import { forwardRef } from "react";

/**
 * Standard text input component with built-in label and error handling.
 *
 * Why this exists:
 * Consolidates input styling, label typography, error states, and focus rings
 * across all modals and form screens.
 *
 * @param {Object} props - Input props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or helpful tip
 * @param {React.ReactNode} [props.icon] - Left-side icon
 * @param {string} [props.className] - Input element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon = null,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    ...rest
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-zinc-700 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-400">
            <Icon className="size-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`h-10 w-full rounded-xl border bg-white text-xs sm:text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed ${
            Icon ? "pl-9 pr-3.5" : "px-3.5"
          } ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-zinc-200 hover:border-zinc-300 focus:border-brand-600 focus:ring-brand-500/20"
          } ${className}`}
          {...rest}
        />
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

export default Input;
