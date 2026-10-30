import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { FloatingToast, ToastData, ToastType } from '../components/FloatingToast';

interface ToastContextType {
  toast: ToastData | null;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration: number = 4000) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToast({ id, type, message });

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, duration);
      }
    },
    []
  );

  // Keyboard Escape listener to dismiss active toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toast) {
        dismissToast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast, dismissToast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
      <FloatingToast toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

