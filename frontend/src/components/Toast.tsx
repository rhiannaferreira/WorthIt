import { CheckCircle2, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

let nextId = 1;

/** Small confirmation messages, announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button type="button" className="icon-button small" onClick={() => dismiss(toast.id)} aria-label="Dismiss message">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
