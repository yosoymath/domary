"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastInput = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: number;
  variant: ToastVariant;
  exiting?: boolean;
};

const TOAST_EXIT_DURATION = 260;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type RequiredField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function requiredFieldLabel(field: RequiredField) {
  const ariaLabel = field.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const label = field.labels?.[0];
  if (label) {
    let labelText = "";

    for (const node of label.childNodes) {
      if (node === field || (node instanceof HTMLElement && node.contains(field))) break;
      if (node instanceof HTMLElement && node.hasAttribute("data-required-mark")) continue;
      labelText += ` ${node.textContent ?? ""}`;
    }

    const normalizedLabel = labelText.replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();
    if (normalizedLabel) return normalizedLabel;
  }

  const placeholder = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
    ? field.placeholder
    : "";
  const fallback = placeholder || field.name || field.id || "obrigatório";
  return fallback
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character: string) => character.toUpperCase());
}

const defaultTitles: Record<ToastVariant, string> = {
  success: "Sucesso",
  error: "Não foi possível concluir",
  warning: "Atenção",
  info: "Informação",
};

const variantStyles: Record<ToastVariant, { border: string; icon: string; title: string }> = {
  success: {
    border: "border-emerald-200",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-700",
  },
  error: {
    border: "border-red-200",
    icon: "bg-red-100 text-red-700",
    title: "text-red-700",
  },
  warning: {
    border: "border-amber-300",
    icon: "bg-amber-100 text-amber-800",
    title: "text-amber-800",
  },
  info: {
    border: "border-black/10",
    icon: "bg-black/[0.05] text-black/60",
    title: "text-black/75",
  },
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return <path d="m6.5 12.5 3.4 3.4 7.6-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />;
  }
  if (variant === "error") {
    return <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />;
  }
  if (variant === "warning") {
    return <path d="M12 7.5v5m0 3.5v.01M4.5 19h15L12 4 4.5 19Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />;
  }
  return <path d="M12 11v6m0-10v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  const requiredToastLockRef = useRef(false);
  const autoDismissTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const removalTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    if (removalTimersRef.current.has(id)) return;

    const timer = autoDismissTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    autoDismissTimersRef.current.delete(id);

    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, exiting: true } : toast
    )));

    const removalTimer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      removalTimersRef.current.delete(id);
    }, TOAST_EXIT_DURATION);

    removalTimersRef.current.set(id, removalTimer);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    nextIdRef.current += 1;
    const id = nextIdRef.current;
    const toast: ToastItem = { ...input, id, variant: input.variant ?? "info" };
    setToasts((current) => [...current, toast]);
    const timer = setTimeout(() => dismissToast(id), input.duration ?? 5000);
    autoDismissTimersRef.current.set(id, timer);
  }, [dismissToast]);

  useEffect(() => {
    function handleInvalid(event: Event) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (!field.required || !field.validity.valueMissing) return;

      event.preventDefault();
      if (requiredToastLockRef.current) return;

      requiredToastLockRef.current = true;
      window.setTimeout(() => {
        requiredToastLockRef.current = false;
      }, 0);

      const fieldLabel = requiredFieldLabel(field);
      showToast({
        message: `Informe o campo “${fieldLabel}” para continuar.`,
        title: "Campo obrigatório",
        variant: "warning",
      });

      window.requestAnimationFrame(() => {
        const fieldRect = field.getBoundingClientRect();
        const isOutsideViewport = fieldRect.top < 0 || fieldRect.bottom > window.innerHeight;
        if (isOutsideViewport) field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus({ preventScroll: true });
      });
    }

    document.addEventListener("invalid", handleInvalid, true);
    return () => document.removeEventListener("invalid", handleInvalid, true);
  }, [showToast]);

  useEffect(() => () => {
    autoDismissTimersRef.current.forEach((timer) => clearTimeout(timer));
    autoDismissTimersRef.current.clear();
    removalTimersRef.current.forEach((timer) => clearTimeout(timer));
    removalTimersRef.current.clear();
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-label="Notificações" className="pointer-events-none fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-[300] flex w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-3" role="region">
        {toasts.map((toast) => {
          const styles = variantStyles[toast.variant];
          return (
            <div aria-atomic="true" className={`toast-item pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white p-3 text-black shadow-lg ${styles.border}`} data-exiting={toast.exiting ? "true" : "false"} key={toast.id} role={toast.variant === "error" || toast.variant === "warning" ? "alert" : "status"}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${styles.icon}`} data-toast-icon>
                <svg aria-hidden="true" className="size-4.5" fill="none" viewBox="0 0 24 24"><ToastIcon variant={toast.variant} /></svg>
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <strong className={`block text-sm font-black ${styles.title}`}>{toast.title ?? defaultTitles[toast.variant]}</strong>
                <span className="mt-0.5 block text-xs leading-5 text-black/55">{toast.message}</span>
              </span>
              <button aria-label="Fechar notificação" className="focus-ring grid size-7 shrink-0 place-items-center rounded-full text-black/35 hover:bg-black/[0.05] hover:text-black" onClick={() => dismissToast(toast.id)} type="button">×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}

export function ToastFeedback({ message, title, trigger, variant = "info" }: ToastInput & { trigger?: unknown }) {
  const { showToast } = useToast();
  const lastTriggerRef = useRef<unknown>(undefined);

  useEffect(() => {
    if (!message) return;
    const currentTrigger = trigger ?? `${variant}:${title ?? ""}:${message}`;
    if (Object.is(lastTriggerRef.current, currentTrigger)) return;
    lastTriggerRef.current = currentTrigger;
    showToast({ message, title, variant });
  }, [message, showToast, title, trigger, variant]);

  return null;
}
