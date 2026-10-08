"use client";

/**
 * Standard responsive Pixel Table primitives.
 *
 * Why this exists:
 * Delivers retro RPG data grids with crisp 2px solid boundaries, high-contrast headers,
 * and effortless scanning across members, attendance records, and tournament teams.
 */

/**
 * Table container wrapper
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function Table({ children, className = "", ...rest }) {
  return (
    <div className="w-full overflow-x-auto border-2 border-zinc-950 bg-white pixel-shadow-sm">
      <table className={`w-full text-left text-xs sm:text-sm border-collapse ${className}`} {...rest}>
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
      className={`border-b-2 border-zinc-950 bg-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-900 ${className}`}
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
    <tbody className={`divide-y divide-zinc-200 ${className}`} {...rest}>
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
      className={`transition-colors duration-100 hover:bg-zinc-50 ${className}`}
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
    <th className={`px-3.5 py-3 sm:px-4.5 font-bold select-none ${className}`} {...rest}>
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
    <td className={`px-3.5 py-2.5 sm:px-4.5 text-zinc-800 ${className}`} {...rest}>
      {children}
    </td>
  );
}
