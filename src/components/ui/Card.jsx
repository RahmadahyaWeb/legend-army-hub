"use client";

/**
 * Standard Card container and subcomponents.
 *
 * Why this exists:
 * Enforces unified border radiuses (rounded-xl), borders (border-zinc-200),
 * clean backgrounds, and padding to eliminate disparate custom cards across pages.
 */

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white transition-colors ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...rest }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-zinc-100 p-4 sm:p-5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", as: Component = "h3", ...rest }) {
  return (
    <Component
      className={`text-sm sm:text-base font-semibold text-zinc-900 tracking-tight ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = "", ...rest }) {
  return (
    <p className={`mt-0.5 text-xs text-zinc-500 ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...rest }) {
  return (
    <div
      className={`border-t border-zinc-100 p-4 sm:p-5 bg-zinc-50/50 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
