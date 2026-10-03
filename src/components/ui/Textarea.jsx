"use client";

import { forwardRef } from "react";

/**
 * Standard multiline textarea input component.
 *
 * Why this exists:
 * Standarizes text input styling, auto-resize defaults, focus rings, and labels
 * across strategies, notes, and briefings.
 *
 * @param {Object} props - Textarea props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Subtitle or helpful tip
 * @param {number} [props.rows=3] - Default row count
 * @param {string} [props.className] - Textarea element custom class
 * @param {string} [props.containerClassName] - Wrapper div custom class
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
          className="block text-xs font-bold text-zinc-700 select-none"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white p-3 text-xs sm:text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed leading-relaxed ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-zinc-200 hover:border-zinc-300 focus:border-brand-600 focus:ring-brand-500/20"
        } ${className}`}
        {...rest}
      />

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

export default Textarea;
