
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
  close: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useConfirmation must be used within a ConfirmationProvider');
  return context;
};

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (options?.onCancel) options.onCancel();
    setTimeout(() => setOptions(null), 300); // Clear after animation
  }, [options]);

  const handleConfirm = () => {
    if (options?.onConfirm) options.onConfirm();
    setIsOpen(false);
    setTimeout(() => setOptions(null), 300);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, close }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`h-1.5 w-full ${options.type === 'danger' ? 'bg-red-500' : options.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
            
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${
                    options.type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500' : 
                    options.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500' : 
                    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-500'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    {options.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 dark:bg-black/20 p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
              <button 
                onClick={close}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button 
                onClick={handleConfirm}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95 ${
                    options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 
                    options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 
                    'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20'
                }`}
              >
                {options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};
