import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error";

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  showSuccess: (text: string) => void;
  showError: (text: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastViewport({ items, remove }: { items: ToastMessage[]; remove: (id: number) => void }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`toast toast-${item.type}`}>
          <span>{item.text}</span>
          <button type="button" onClick={() => remove(item.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((type: ToastType, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, type, text }]);
    window.setTimeout(() => {
      remove(id);
    }, 3500);
  }, [remove]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (text: string) => show("success", text),
      showError: (text: string) => show("error", text)
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} remove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
