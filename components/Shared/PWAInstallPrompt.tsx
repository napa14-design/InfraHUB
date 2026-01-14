
import React, { useState, useEffect } from 'react';
import { Download, Share } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Captura o evento de instalação
    const handler = (e: Event) => {
      // IMPORTANTE: Não chamamos e.preventDefault() aqui.
      // Isso permite que o Android mostre o "Mini-infobar" automaticamente
      // baseado nas heurísticas do navegador (frequência de uso, etc).
      // Apenas salvamos o evento caso o usuário queira clicar no botão manual depois.
      setDeferredPrompt(e);
      console.log("PWA Install Event captured (Native prompt allowed)");
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  // Android / Chrome Desktop - Botão de Backup
  // (O Android deve mostrar o banner automático, mas mantemos o botão caso o usuário feche o banner)
  if (deferredPrompt) {
    return (
      <button 
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all animate-pulse"
      >
        <Download size={16} /> Instalar App
      </button>
    );
  }

  // iOS Instructions (iOS não suporta instalação automática nem via botão)
  if (isIOS && !isStandalone) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-slate-700">
            <Share size={12} /> <span>Adicione à Tela de Início</span>
        </div>
      );
  }

  return null;
};
