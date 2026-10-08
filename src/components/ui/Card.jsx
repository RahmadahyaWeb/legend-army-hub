"use client";

/**
 * Standard Minimalist Comic Pixel Card Container and Subcomponents
 *
 * Why this exists:
 * Unifies dashboard cards and panels into a cohesive Ragnarok Online-inspired comic window aesthetic:
 * crisp solid 2px ink borders, subtle comic drop shadows, and clean off-white/white surfaces.
 * Eliminates ad-hoc floating card shapes across all public and admin views.
 */

/**
 * Main Card wrapper with comic border and subtle shadow
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`border-2 border-zinc-950 bg-white shadow-[2px_2px_0px_#18181b] transition-transform ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Card Header with crisp bottom border
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function CardHeader({ children, className = "", ...rest }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b-2 border-zinc-950 bg-zinc-50/90 p-3.5 sm:p-4.5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Card Title heading with clean sans-serif typography for readability
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function CardTitle({ children, className = "", as: Component = "h3", pixel = false, ...rest }) {
  return (
    <Component
      className={`text-sm sm:text-base font-bold text-zinc-950 tracking-tight font-sans ${
        pixel ? "font-pixel uppercase tracking-wide" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Card Description sub-caption
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function CardDescription({ children, className = "", ...rest }) {
  return (
    <p className={`mt-0.5 text-xs text-zinc-600 font-sans ${className}`} {...rest}>
      {children}
    </p>
  );
}

/**
 * Card Content body
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={`p-3.5 sm:p-4.5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

/**
 * Card Footer with crisp top border
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function CardFooter({ children, className = "", ...rest }) {
  return (
    <div
      className={`border-t-2 border-zinc-950 p-3.5 sm:p-4.5 bg-zinc-50 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

