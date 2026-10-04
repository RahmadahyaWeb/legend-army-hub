"use client";

/**
 * Standard responsive Table primitives.
 *
 * Why this exists:
 * Standarizes border colors, header typography, row hover transitions,
 * and horizontal overflow handling across members, attendance, and admin user tables.
 */

export function Table({ children, className = "", ...rest }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs">
      <table className={`w-full text-left text-xs sm:text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...rest }) {
  return (
    <thead
      className={`border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 ${className}`}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...rest }) {
  return (
    <tbody className={`divide-y divide-zinc-100 ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...rest }) {
  return (
    <tr
      className={`transition-colors duration-150 hover:bg-zinc-50/70 ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...rest }) {
  return (
    <th className={`px-4 py-3.5 sm:px-5 font-bold ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...rest }) {
  return (
    <td className={`px-4 py-3 sm:px-5 text-zinc-700 ${className}`} {...rest}>
      {children}
    </td>
  );
}
