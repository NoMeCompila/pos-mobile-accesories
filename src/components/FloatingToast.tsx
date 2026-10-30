import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface FloatingToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const FloatingToast: React.FC<FloatingToastProps> = ({ toast, onDismiss }) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center w-full px-4">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.92 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="alert"
            aria-live="assertive"
            className={`pointer-events-auto inline-flex items-center gap-3 px-5 py-2.5 rounded-full shadow-xl backdrop-blur-sm select-none max-w-[calc(100vw-2rem)] ${
              toast.type === 'error'
                ? 'bg-[#eb4444] text-white shadow-red-500/30'
                : toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-white shadow-slate-900/30'
            }`}
          >
            {/* Left Circular Icon Badge */}
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-white" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-white" />}
            </div>

            {/* Toast Message */}
            <span className="text-sm font-medium tracking-wide leading-none text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {toast.message}
            </span>

            {/* Manual Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar notificación"
              className="text-white/80 hover:text-white p-0.5 ml-1 transition-opacity cursor-pointer shrink-0 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

