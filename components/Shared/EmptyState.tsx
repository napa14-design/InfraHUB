import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Icon size={40} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};