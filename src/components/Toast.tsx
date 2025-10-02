import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            className={`
              fixed bottom-4 right-4 z-50 w-96 rounded-lg border p-4 shadow-lg
              ${
                toast.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : toast.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0
              data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
              data-[state=closed]:fade-out-80
              data-[state=closed]:slide-out-to-right-full
              data-[state=open]:slide-in-from-bottom-full
              data-[state=open]:sm:slide-in-from-bottom-full
            `}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <ToastPrimitive.Title
                  className={`
                    text-sm font-semibold
                    ${
                      toast.type === 'success'
                        ? 'text-green-900'
                        : toast.type === 'error'
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }
                  `}
                >
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description && (
                  <ToastPrimitive.Description
                    className={`
                      mt-1 text-sm
                      ${
                        toast.type === 'success'
                          ? 'text-green-700'
                          : toast.type === 'error'
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }
                    `}
                  >
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                className={`
                  rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity
                  ${
                    toast.type === 'success'
                      ? 'text-green-900'
                      : toast.type === 'error'
                      ? 'text-red-900'
                      : 'text-blue-900'
                  }
                `}
                aria-label="Close"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </ToastPrimitive.Close>
            </div>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
