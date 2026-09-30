import { Clock3 } from "lucide-react";

export default function Attendance() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Clock3 className="size-6" />
        </div>

        <div className="mt-5 inline-flex items-center rounded-full bg-surface-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-content-muted">
          Coming Soon
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-content-strong">
          Attendance
        </h1>

        <p className="mt-2 text-sm leading-6 text-content-muted">
          Guild League attendance management is currently under development.
        </p>
      </div>
    </div>
  );
}
