"use client";

/**
 * Standard responsive Comic Pixel Table primitives.
 *
 * Why this exists:
 * Delivers retro-inspired data grids with crisp 2px solid ink boundaries, high-contrast headers,
 * clean sans-serif typography (no hard-to-read pixel fonts in tables), and effortless scanning
 * across members, attendance records, and tournament teams.
 */

/**
 * Table container wrapper
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function Table({ children, className = "", ...rest }) {
  return (
    <div className="w-full overflow-x-auto border-2 border-zinc-950 bg-white shadow-[2px_2px_0px_#18181b]">
      <table className={`w-full text-left text-xs sm:text-sm border-collapse font-sans ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

/**
 * Table header container
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function TableHeader({ children, className = "", ...rest }) {
  return (
    <thead
      className={`border-b-2 border-zinc-950 bg-zinc-100/90 text-[11px] font-bold uppercase tracking-wider text-zinc-950 font-sans select-none ${className}`}
      {...rest}
    >
      {children}
    </thead>
  );
}

/**
 * Table body container
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function TableBody({ children, className = "", ...rest }) {
  return (
    <tbody className={`divide-y divide-zinc-200 font-sans ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

/**
 * Table row
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function TableRow({ children, className = "", ...rest }) {
  return (
    <tr
      className={`transition-colors duration-100 hover:bg-zinc-50/80 ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

/**
 * Table header cell
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function TableHead({ children, className = "", ...rest }) {
  return (
    <th className={`px-3.5 py-3 sm:px-4.5 font-bold select-none text-zinc-950 ${className}`} {...rest}>
      {children}
    </th>
  );
}

/**
 * Table data cell
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function TableCell({ children, className = "", ...rest }) {
  return (
    <td className={`px-3.5 py-2.5 sm:px-4.5 text-zinc-900 font-sans ${className}`} {...rest}>
      {children}
    </td>
  );
}

