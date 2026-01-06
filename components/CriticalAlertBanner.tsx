import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, List } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { AppNotification } from '../types';

interface Props {
    onViewCritical: () => void;
}

export const CriticalAlertBanner: React.FC<Props> = ({ onViewCritical }) => {
  const [criticalNotifs, setCriticalNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Check immediately and then every 5 seconds
    const checkCriticals = () => {
      const all = notificationService.getAll();
      // Filter only unread ERRORS (Critical/Delays)
      const critical = all.filter(n => n.type === 'ERROR' && !n.read);
      setCriticalNotifs(critical);
    };

    checkCriticals();
    const interval = setInterval(checkCriticals, 5000);
    return () => clearInterval(interval);
  }, []);

  if (criticalNotifs.length === 0) return null;

  return (
    <div className="w-full mb-6 rounded-xl overflow-hidden shadow-md border border-red-200 dark:border-red-900 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between relative overflow-hidden">
        
        {/* Left Icon Block - Simplified */}
        <div className="flex items-center gap-3 z-20 bg-red-500 pr-4">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <AlertTriangle className="text-white" size={20} />
          </div>
          <div className="hidden md:block">
            <p className="font-bold text-xs uppercase tracking-wider text-red-100">Atenção Necessária</p>
          </div>
        </div>

        {/* Scrolling Ticker Text */}
        <div className="flex-1 overflow-hidden relative h-6 mx-4">
             <div className="absolute whitespace-nowrap animate-[marquee_25s_linear_infinite] flex gap-16 items-center h-full">
                 {criticalNotifs.map((notif, idx) => (
                     <span key={notif.id} className="flex items-center gap-2 font-medium text-sm">
                         <span className="font-bold text-red-100">PENDENTE:</span> 
                         {notif.title} - {notif.message}
                         {idx < criticalNotifs.length - 1 && <span className="w-1.5 h-1.5 rounded-full bg-white/50 ml-8"></span>}
                     </span>
                 ))}
                 {/* Duplicate for seamless loop */}
                 {criticalNotifs.map((notif, idx) => (
                     <span key={`dup-${notif.id}`} className="flex items-center gap-2 font-medium text-sm">
                         <span className="font-bold text-red-100">PENDENTE:</span> 
                         {notif.title} - {notif.message}
                         {idx < criticalNotifs.length - 1 && <span className="w-1.5 h-1.5 rounded-full bg-white/50 ml-8"></span>}
                     </span>
                 ))}
             </div>
        </div>

        {/* Action Button - Changed to Open List */}
        <div className="z-20 bg-red-500 pl-4 shadow-[-5px_0_10px_rgba(220,38,38,0.5)]">
            <button 
                onClick={onViewCritical}
                className="whitespace-nowrap flex items-center gap-2 px-3 py-1 bg-white text-red-600 rounded-lg font-bold text-xs uppercase hover:bg-red-50 transition-colors shadow-sm"
            >
                Ver Lista <List size={14} />
            </button>
        </div>
      </div>
      
      {/* Tailwind Config for Marquee needs to be added globally or inline style used. 
          Using inline style for keyframes to ensure it works without tailwind.config changes 
      */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};