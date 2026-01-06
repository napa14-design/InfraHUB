import React from 'react';
import { X, Check, Info, AlertTriangle, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const IconMap = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  ERROR: AlertCircle
};

const ColorMap = {
  INFO: 'text-blue-500 bg-blue-50',
  WARNING: 'text-amber-500 bg-amber-50',
  SUCCESS: 'text-emerald-500 bg-emerald-50',
  ERROR: 'text-red-500 bg-red-50'
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-slate-600" />
            <h2 className="font-bold text-slate-800">Notificações</h2>
            <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {notifications.filter(n => !n.read).length} novas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onMarkAllRead}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 px-2 py-1 hover:bg-brand-50 rounded transition-colors"
            >
              Marcar lidas
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Bell size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação recente</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = IconMap[notification.type];
              const colors = ColorMap[notification.type];
              
              return (
                <div 
                  key={notification.id}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-200 group
                    ${notification.read ? 'bg-white border-slate-100 opacity-75' : 'bg-white border-slate-200 shadow-sm border-l-4 border-l-brand-500'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${colors} flex-shrink-0`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-sm font-semibold mb-1 ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-snug">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-full text-brand-600 transition-all"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};