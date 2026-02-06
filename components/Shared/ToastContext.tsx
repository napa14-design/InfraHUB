
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl bg-white dark:bg-[#1A1A1E] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-full duration-300"
          >
            <div className={`mt-0.5 flex-shrink-0 ${
              toast.type === 'success' ? 'text-emerald-500' :
              toast.type === 'error' ? 'text-red-500' :
              toast.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 font-mono leading-tight">
              {toast.message}
            </p>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
