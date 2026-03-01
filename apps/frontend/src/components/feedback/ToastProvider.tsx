"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type ToastVariant = "success" | "error" | "info";

interface ToastInput {
  title?: string;
  description: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 3200,
  error: 6000,
  info: 3800,
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-emerald-300 bg-emerald-50/95 text-emerald-900",
  error: "border-red-300 bg-red-50/95 text-red-900",
  info: "border-slate-300 bg-white/95 text-slate-900",
};

function ToastCard(props: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { toast, onDismiss } = props;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.durationMs, toast.id]);

  return (
    <div
      className={`pointer-events-auto relative w-full rounded-md border p-3 shadow-lg ${variantClasses[toast.variant]}`}
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7"
        aria-label="Cerrar notificacion"
        onClick={() => onDismiss(toast.id)}
      >
        <X className="h-4 w-4" />
      </Button>

      {toast.title ? (
        <p className="mb-1 pr-8 text-sm font-semibold">{toast.title}</p>
      ) : null}
      <p className="pr-8 text-sm">{toast.description}</p>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput): string => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const variant = toast.variant ?? "info";
    const nextToast: ToastItem = {
      ...toast,
      id,
      variant,
      durationMs: toast.durationMs ?? DEFAULT_DURATION_MS[variant],
    };

    setToasts((current) => [...current, nextToast]);
    return id;
  }, []);

  const contextValue = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within ToastProvider");
  }
  return context;
}
