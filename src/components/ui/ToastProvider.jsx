"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    iconBackground: "bg-emerald-50",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-600",
    iconBackground: "bg-red-50",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "text-amber-600",
    iconBackground: "bg-amber-50",
  },
  info: {
    icon: Info,
    iconClass: "text-brand-600",
    iconBackground: "bg-brand-50",
  },
};

function ToastItem({ toast, onClose }) {
  const config = toastStyles[toast.type] ?? toastStyles.info;

  const Icon = config.icon;

  return (
    <div className="pointer-events-auto w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg sm:w-[380px]">
      <div className="flex gap-3 p-4">
        <div
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            config.iconBackground,
          ].join(" ")}
        >
          <Icon className={["size-4.5", config.iconClass].join(" ")} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-content-strong">
            {toast.title}
          </p>

          {toast.description && (
            <p className="mt-1 text-sm leading-5 text-content-muted">
              {toast.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-content-subtle transition hover:bg-surface-100 hover:text-content-strong"
          aria-label="Close notification"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="h-0.5 w-full bg-surface-200">
        <div
          className={[
            "h-full origin-left animate-[toast-progress_4s_linear_forwards]",
            toast.type === "success"
              ? "bg-emerald-500"
              : toast.type === "error"
                ? "bg-red-500"
                : toast.type === "warning"
                  ? "bg-amber-500"
                  : "bg-brand-500",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, description = "", duration = TOAST_DURATION }) => {
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

      const toast = {
        id,
        type,
        title,
        description,
      };

      setToasts((current) => [...current, toast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);

        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title, description = "") =>
      showToast({
        type: "success",
        title,
        description,
      }),
    [showToast],
  );

  const error = useCallback(
    (title, description = "") =>
      showToast({
        type: "error",
        title,
        description,
      }),
    [showToast],
  );

  const warning = useCallback(
    (title, description = "") =>
      showToast({
        type: "warning",
        title,
        description,
      }),
    [showToast],
  );

  const info = useCallback(
    (title, description = "") =>
      showToast({
        type: "info",
        title,
        description,
      }),
    [showToast],
  );

  const value = useMemo(
    () => ({
      toast: showToast,
      success,
      error,
      warning,
      info,
      dismiss,
    }),
    [showToast, success, error, warning, info, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-5"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
