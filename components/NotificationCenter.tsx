
import React, { useState, useEffect } from 'react';
import { X, Check, Info, AlertTriangle, CheckCircle, AlertCircle, Bell, ArrowRight, Filter, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NotificationType, UserRole } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  activeFilter: NotificationType | 'ALL';
  onFilterChange: (filter: NotificationType | 'ALL') => void;
  userRole?: UserRole;
}

const IconMap = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  ERROR: AlertCircle
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  activeFilter,
  onFilterChange,
  userRole
}) => {
  const navigate = useNavigate();

  const handleLinkClick = (link: string, id: string) => {
      onMarkRead(id);
      onClose();
      navigate(link);
  };

  const handleConfigClick = () => {
      onClose();
      navigate('/admin/notifications');
  };

  const filteredNotifications = activeFilter === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  // Counts for tabs
  const counts = {
      ALL: notifications.filter(n => !n.read).length,
      ERROR: notifications.filter(n => n.type === 'ERROR' && !n.read).length,
      WARNING: notifications.filter(n => n.type === 'WARNING' && !n.read).length,
      INFO: notifications.filter(n => (n.type === 'INFO' || n.type === 'SUCCESS') && !n.read).length
  };

  const FilterTab = ({ type, label, count }: { type: NotificationType | 'ALL', label: string, count: number }) => (
      <button 
        onClick={() => onFilterChange(type)}
        className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeFilter === type 
            ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' 
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
        }`}
      >
          {label}
          {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === type ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
              </span>
          )}
      </button>
  );

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
        fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 dark:border-slate-800
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-slate-600 dark:text-slate-400" />
            <h2 className="font-bold text-slate-800 dark:text-white">NOTIFICAÇÕES</h2>
          </div>
          <div className="flex items-center gap-2">
            {userRole === UserRole.ADMIN && (
                <button 
                  onClick={handleConfigClick}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                  title="Configurar Regras de Alerta"
                >
                  <Settings size={18} />
                </button>
            )}
            <button 
              onClick={onMarkAllRead}
              className="text-xs font-medium text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 px-2 py-1 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
            >
              Ler tudo
            </button>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex px-2 pt-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <FilterTab type="ALL" label="Todas" count={counts.ALL} />
            <FilterTab type="ERROR" label="Críticos" count={counts.ERROR} />
            <FilterTab type="WARNING" label="Avisos" count={counts.WARNING} />
            <FilterTab type="INFO" label="Info" count={counts.INFO} />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/50">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                  <Filter size={24} className="opacity-40" />
              </div>
              <p className="text-sm">Nenhuma notificação neste filtro</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = IconMap[notification.type];
              
              // Custom Styles based on type
              let containerClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
              let iconClass = "text-slate-500 bg-slate-100 dark:bg-slate-700";
              
              if (notification.type === 'ERROR') {
                  containerClass = "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 ring-1 ring-red-300 dark:ring-red-900/50";
                  iconClass = "text-red-600 bg-red-100 dark:bg-red-900/30 animate-pulse";
              } else if (notification.type === 'WARNING') {
                  containerClass = "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30";
                  iconClass = "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
              } else if (notification.type === 'SUCCESS') {
                   containerClass = "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30";
                   iconClass = "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30";
              }
              
              if (notification.read) {
                  containerClass = "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 opacity-60";
                  iconClass = "text-slate-400 bg-slate-100 dark:bg-slate-700";
              }

              return (
                <div 
                  key={notification.id}
                  className={`relative p-4 rounded-xl border transition-all duration-200 group ${containerClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full flex-shrink-0 ${iconClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-sm font-bold mb-1 ${notification.read ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-sm leading-snug ${notification.read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.link && (
                          <button 
                            onClick={() => handleLinkClick(notification.link!, notification.id)}
                            className="mt-2 text-xs font-bold flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
                          >
                              Ver Detalhes <ArrowRight size={12} />
                          </button>
                      )}
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/5 rounded-full text-slate-500 transition-all"
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
