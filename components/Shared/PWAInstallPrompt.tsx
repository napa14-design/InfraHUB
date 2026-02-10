
import React, { useState, useEffect } from 'react';
import { Download, Share } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
    collapsed?: boolean;
    className?: string;
}

export const PWAInstallPrompt: React.FC<Props> = ({ collapsed = false, className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado (Standalone mode)
    const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStand) {
      setIsStandalone(true);
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 1. Check if event was already captured globally (in index.tsx)
    // @ts-ignore
    if (window.deferredPrompt) {
        // @ts-ignore
        setDeferredPrompt(window.deferredPrompt);
    }

    // 2. Listen for future events (if not fired yet)
    const handler = (e: Event) => {
      // Do NOT prevent default here either, to respect native behavior
      // @ts-ignore
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    if (!promptEvent) return;

    // Mostra o prompt nativo
    promptEvent.prompt();
    
    // Aguarda a escolha do USUÁRIO
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      logger.log('User accepted the install prompt');
      setDeferredPrompt(null);
      // @ts-ignore
      window.deferredPrompt = null;
    }
  };

  // Se já estiver instalado, não mostra nada
  if (isStandalone) return null;

  // Android / Chrome Desktop / Edge
  if (deferredPrompt) {
    if (collapsed) {
        return (
            <button 
                onClick={handleInstallClick}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg animate-pulse"
                title="Instalar Aplicativo"
            >
                <Download size={18} />
            </button>
        );
    }

    return (
      <button 
        onClick={handleInstallClick}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all mb-2 animate-in fade-in ${className}`}
      >
        <Download size={16} /> Instalar App
      </button>
    );
  }

  // iOS Instructions (Sidebar only if space permits)
  if (isIOS && !isStandalone && !collapsed) {
      return (
        <div className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-slate-700 mb-2 ${className}`}>
            <Share size={12} /> 
            <span>Para instalar: Compartilhar {'>'} Tela de início</span>
        </div>
      );
  }

  return null;
};
