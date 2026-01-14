
import React, { useState, useEffect } from 'react';
import { Download, Share, Smartphone, Terminal } from 'lucide-react';

interface Props {
    collapsed?: boolean;
    debug?: boolean; // New prop to show debug info on screen
    className?: string;
}

export const PWAInstallPrompt: React.FC<Props> = ({ collapsed = false, debug = false, className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
      if (!debug) return;
      setLogs(prev => [...prev, `${new Date().toLocaleTimeString().split(' ')[0]} - ${msg}`]);
  };

  useEffect(() => {
    addLog("Component Mounted");

    // Verifica se já está instalado (Standalone mode)
    const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStand) {
      setIsStandalone(true);
      addLog("Mode: Standalone (Installed)");
    } else {
      addLog("Mode: Browser (Not Installed)");
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);
    if(ios) addLog("OS: iOS");

    // 1. Check if event was already captured globally (in index.tsx)
    // @ts-ignore
    if (window.deferredPrompt) {
        addLog("Global Event Found immediately");
        // @ts-ignore
        setDeferredPrompt(window.deferredPrompt);
    } else {
        addLog("No Global Event yet. Waiting...");
    }

    // 2. Listen for future events (if not fired yet)
    const handler = (e: Event) => {
      e.preventDefault();
      // @ts-ignore
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      addLog("Event 'beforeinstallprompt' Fired & Captured!");
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPrompt;
    if (!promptEvent) {
        addLog("Error: No prompt event found on click");
        return;
    }

    addLog("Prompt triggered");
    // Mostra o prompt nativo
    promptEvent.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await promptEvent.userChoice;
    
    addLog(`User choice: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      // @ts-ignore
      window.deferredPrompt = null;
    }
  };

  // Render Debug Panel if requested
  const renderDebug = () => {
      if (!debug) return null;
      return (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-green-400 p-4 font-mono text-[10px] z-[9999] max-h-40 overflow-y-auto border-t-2 border-green-500 opacity-90">
              <div className="flex items-center gap-2 mb-2 border-b border-green-900 pb-1">
                  <Terminal size={12} /> <span>PWA DEBUGGER</span>
              </div>
              <div>Standalone: {isStandalone ? 'YES' : 'NO'}</div>
              <div>iOS: {isIOS ? 'YES' : 'NO'}</div>
              <div>Has Prompt: {deferredPrompt ? 'YES (Ready)' : 'NO'}</div>
              <div className="mt-2 text-white">Log:</div>
              {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
      );
  };

  // Se já estiver instalado, não mostra nada (apenas o debug se ativo)
  if (isStandalone) return renderDebug();

  // Android / Chrome Desktop / Edge
  if (deferredPrompt) {
    if (collapsed) {
        return (
            <>
                <button 
                    onClick={handleInstallClick}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg animate-pulse"
                    title="Instalar Aplicativo"
                >
                    <Download size={18} />
                </button>
                {renderDebug()}
            </>
        );
    }

    return (
      <>
        <button 
            onClick={handleInstallClick}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${className}`}
        >
            <Download size={16} /> Instalar Aplicativo
        </button>
        {renderDebug()}
      </>
    );
  }

  // iOS Instructions
  if (isIOS && !isStandalone) {
      return (
        <>
            <div className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-slate-700 ${className}`}>
                <Share size={12} /> 
                <span>Para instalar: Compartilhar {'>'} Tela de Início</span>
            </div>
            {renderDebug()}
        </>
      );
  }

  // Se nada acontecer, mas debug estiver ativo, mostra o painel
  return renderDebug();
};
