"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Standard accessible Modal Dialog container.
 *
 * Why this exists:
 * Handles backdrop clicks, Escape keydown navigation, body scroll locking,
 * responsive max-width/height scaling, and unified header/footer structure.
 *
 * @param {Object} props - Modal props
 * @param {boolean} props.open - Modal visibility
 * @param {() => void} props.onClose - Close callback
 * @param {string} [props.title] - Modal heading
 * @param {string} [props.description] - Modal sub-description
 * @param {React.ReactNode} [props.icon] - Leading icon element
 * @param {"sm"|"md"|"lg"|"xl"|"2xl"} [props.size="md"] - Container width
 * @param {React.ReactNode} props.children - Modal body
 * @param {React.ReactNode} [props.footer] - Modal action buttons
 * @param {string} [props.className] - Additional classes
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon = null,
  size = "md",
  children,
  footer,
  className = "",
}) {
  // Lock body scroll when modal is active
  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
  };

  const maxWidthClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* MODAL DIALOG CONTAINER */}
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200 ${maxWidthClass} ${className}`}
      >
        {/* HEADER */}
        {(title || Icon) && (
          <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              {Icon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="truncate text-base font-bold text-zinc-900 tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-zinc-500 leading-normal">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

        {/* FOOTER */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:px-6 sm:py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
