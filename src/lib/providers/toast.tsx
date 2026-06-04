"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Check, X, Info, Loader2, ExternalLink } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "pending";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  txHash?: string;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id"> & { duration?: number }) => void;
  success: (title: string, message: string, txHash?: string) => void;
  error: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
  pending: (title: string, message: string, txHash?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, txHash, duration = 6000 }: Omit<Toast, "id"> & { duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      // Auto dismiss previous pending toast if a new success/error toast is pushed with the same txHash
      if (txHash && (type === "success" || type === "error")) {
        setToasts((prev) => prev.filter((t) => !(t.type === "pending" && t.txHash === txHash)));
      }

      setToasts((prev) => [...prev, { id, type, title, message, txHash }]);

      if (duration > 0 && type !== "pending") {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message: string, txHash?: string) => {
    addToast({ type: "success", title, message, txHash });
  }, [addToast]);

  const error = useCallback((title: string, message: string) => {
    addToast({ type: "error", title, message });
  }, [addToast]);

  const info = useCallback((title: string, message: string) => {
    addToast({ type: "info", title, message });
  }, [addToast]);

  const pending = useCallback((title: string, message: string, txHash?: string) => {
    addToast({ type: "pending", title, message, txHash, duration: 0 }); // pending has no auto-dismiss
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, pending, dismiss: removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4 md:px-0 pointer-events-none">
        {toasts.map((t) => {
          let Icon = Info;
          let iconClass = "text-blue-500 bg-blue-500/10";
          let borderClass = "border-blue-500/20";
          
          if (t.type === "success") {
            Icon = Check;
            iconClass = "text-[var(--color-sage-text)] bg-[var(--color-sage-light)]/40";
            borderClass = "border-[var(--color-sage)]/25";
          } else if (t.type === "error") {
            Icon = X;
            iconClass = "text-red-500 bg-red-500/10";
            borderClass = "border-red-500/20";
          } else if (t.type === "pending") {
            Icon = Loader2;
            iconClass = "text-amber-500 bg-amber-500/10 animate-spin";
            borderClass = "border-amber-500/20";
          }

          return (
            <div
              key={t.id}
              className={`p-4 rounded-xl border bg-[var(--glass-bg)] backdrop-blur-2xl shadow-xl flex gap-3 pointer-events-auto transition-all duration-300 relative overflow-hidden group ${borderClass}`}
              style={{ animation: "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            >
              <div className={`p-2 rounded-lg shrink-0 ${iconClass} flex items-center justify-center size-8`}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground leading-none mb-1.5">
                  {t.title}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-normal font-sans">
                  {t.message}
                </p>
                {t.txHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${t.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[9px] font-mono uppercase text-[var(--color-sage-text)] hover:underline mt-2.5 tracking-widest no-underline"
                  >
                    View Transaction <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="absolute top-3 right-3 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
