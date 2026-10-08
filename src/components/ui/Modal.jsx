"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Accessible Comic Pixel Modal Dialog Container
 *
 * Why this exists:
 * Presents modal dialogs styled after classic Ragnarok Online windows and modern comic panels:
 * sharp rectangular silhouettes, 2px solid ink outlines, window headers,
 * and tactile close controls, while properly locking scroll and supporting Escape key dismissal.
 *
 * @param {Object} props - Modal configuration
 * @param {boolean} props.open - Visibility toggle
 * @param {() => void} props.onClose - Dismiss callback
 * @param {string} [props.title] - Window title
 * @param {string} [props.description] - Sub-caption
 * @param {React.ComponentType} [props.icon] - Window header icon
 * @param {"sm"|"md"|"lg"|"xl"|"2xl"} [props.size="md"] - Width tier
 * @param {React.ReactNode} props.children - Dialog body content
 * @param {React.ReactNode} [props.footer] - Action buttons
 * @param {string} [props.className] - Custom container classes
 * @returns {JSX.Element|null} Rendered modal dialog
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
  // Lock body scroll when modal is open
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100 font-sans"
    >
      {/* RETRO BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* PIXEL DIALOG CONTAINER */}
      <div
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden border-2 border-zinc-950 bg-white shadow-[4px_4px_0px_#18181b] animate-in zoom-in-95 duration-100 ${maxWidthClass} ${className}`}
      >
        {/* RETRO WINDOW HEADER */}
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b-2 border-zinc-950 bg-zinc-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5 min-w-0 pr-3">
              {Icon && <Icon className="size-4 shrink-0 text-zinc-950" />}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight leading-tight font-sans">
                  {title}
                </h2>
                {description && (
                  <p className="text-[11px] text-zinc-600 leading-tight mt-0.5 font-sans">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center border-2 border-zinc-950 bg-white text-zinc-950 hover:bg-red-50 hover:text-red-700 active:translate-x-[1px] active:translate-y-[1px] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-sans">{children}</div>

        {/* FOOTER */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t-2 border-zinc-950 bg-zinc-50 px-4 py-3 sm:px-5 font-sans">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

