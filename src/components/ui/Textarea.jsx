"use client";

import { forwardRef } from "react";

/**
 * Standard pixel multiline textarea input component.
 *
 * Why this exists:
 * Provides retro RPG multiline text input styling with crisp 2px solid borders, sharp corners,
 * and high readability for tactical notes, rejection reasons, and strategy playbooks.
 *
 * @param {Object} props - Textarea props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or helpful tip
 * @param {number} [props.rows=3] - Default row count
 * @param {string} [props.className] - Textarea element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
 * @returns {JSX.Element} Rendered pixel textarea
 */
const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    rows = 3,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    ...rest
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-zinc-900 select-none uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full border-2 bg-white p-3 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed leading-relaxed ${
          error
            ? "border-red-600 focus:border-red-700 bg-red-50/20"
            : "border-zinc-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600/30"
        } ${className}`}
        {...rest}
      />

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

export default Textarea;
