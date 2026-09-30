"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "There are currently no items to display.",
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center ${className}`}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 border border-zinc-100">
        <Icon className="size-6 text-zinc-500" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-zinc-900">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 max-w-sm">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
