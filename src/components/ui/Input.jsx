"use client";

import { forwardRef } from "react";

/**
 * Standard pixel text input component with built-in label and error handling.
 *
 * Why this exists:
 * Delivers retro RPG input styling with crisp 2px solid borders, sharp rectangular corners,
 * and high-contrast typography, ensuring seamless readability for numbers, nicknames, and Discord tags.
 *
 * @param {Object} props - Input props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or helpful tip
 * @param {React.ReactNode} [props.icon] - Left-side icon
 * @param {string} [props.className] - Input element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
 * @returns {JSX.Element} Rendered pixel text input
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
          className="block text-xs font-bold text-zinc-900 select-none uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-zinc-500">
            <Icon className="size-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`h-9.5 w-full border-2 bg-white text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
            Icon ? "pl-9 pr-3" : "px-3"
          } ${
            error
              ? "border-red-600 focus:border-red-700 bg-red-50/20"
              : "border-zinc-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600/30"
          } ${className}`}
          {...rest}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
