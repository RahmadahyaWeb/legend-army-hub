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
    iconClass: "text-emerald-700",
    borderClass: "border-emerald-700",
    iconBackground: "bg-emerald-100",
    barColor: "bg-emerald-600",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-700",
    borderClass: "border-red-700",
    iconBackground: "bg-red-100",
    barColor: "bg-red-600",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "text-amber-700",
    borderClass: "border-amber-700",
    iconBackground: "bg-amber-100",
    barColor: "bg-amber-600",
  },
  info: {
    icon: Info,
    iconClass: "text-zinc-900",
    borderClass: "border-zinc-900",
    iconBackground: "bg-zinc-100",
    barColor: "bg-zinc-900",
  },
};

/**
 * Single Toast Notification Card with Retro Pixel Styling
 * @param {Object} props
 * @returns {JSX.Element}
 */
function ToastItem({ toast, onClose }) {
  const config = toastStyles[toast.type] ?? toastStyles.info;
  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto w-full overflow-hidden border-2 ${config.borderClass} bg-white pixel-shadow sm:w-[360px] animate-in slide-in-from-top-2 duration-150`}
    >
      <div className="flex gap-3 p-3.5">
        <div
          className={`flex size-8 shrink-0 items-center justify-center border border-zinc-900 ${config.iconBackground}`}
        >
          <Icon className={`size-4 ${config.iconClass}`} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-xs sm:text-sm font-bold text-zinc-950 tracking-tight leading-snug">
            {toast.title}
          </p>

          {toast.description && (
            <p className="mt-0.5 text-xs text-zinc-600 leading-snug">
              {toast.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="flex size-6 shrink-0 items-center justify-center border border-zinc-900 bg-white text-zinc-700 hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] transition-colors"
          aria-label="Close notification"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="h-1 w-full bg-zinc-200">
        <div
          className={`h-full origin-left animate-[toast-progress_4s_linear_forwards] ${config.barColor}`}
        />
      </div>
    </div>
  );
}

/**
 * Toast Provider Context wrapper
 *
 * Why this exists:
 * Manages toast lifecycle and displays stack in upper right corner with retro pixel aesthetics.
 *
 * @param {Object} props
 * @returns {JSX.Element}
 */
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
    [dismiss]
  );

  const success = useCallback(
    (title, description = "") =>
      showToast({
        type: "success",
        title,
        description,
      }),
    [showToast]
  );

  const error = useCallback(
    (title, description = "") =>
      showToast({
        type: "error",
        title,
        description,
      }),
    [showToast]
  );

  const warning = useCallback(
    (title, description = "") =>
      showToast({
        type: "warning",
        title,
        description,
      }),
    [showToast]
  );

  const info = useCallback(
    (title, description = "") =>
      showToast({
        type: "info",
        title,
        description,
      }),
    [showToast]
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
    [showToast, success, error, warning, info, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5"
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

/**
 * Hook to trigger toast notifications
 * @returns {{ toast, success, error, warning, info, dismiss }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
