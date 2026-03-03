import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ExternalLink, Eye, X } from 'lucide-react';
import { toEmbeddedDocumentUrl } from '../../utils/documentPreview';

type DocumentPreviewContextValue = {
  openDocument: (url: string, title?: string) => void;
  closeDocument: () => void;
  isOpen: boolean;
};

type PreviewState = {
  isOpen: boolean;
  title: string;
  originalUrl: string;
  embedUrl: string;
};

const DocumentPreviewContext = createContext<DocumentPreviewContextValue | undefined>(undefined);

export const DocumentPreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PreviewState>({
    isOpen: false,
    title: 'Visualiza??o de documento',
    originalUrl: '',
    embedUrl: ''
  });

  const openDocument = useCallback((url: string, title = 'Visualiza??o de documento') => {
    const originalUrl = (url || '').trim();
    if (!originalUrl) return;

    setState({
      isOpen: true,
      title,
      originalUrl,
      embedUrl: toEmbeddedDocumentUrl(originalUrl)
    });
  }, []);

  const closeDocument = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = useMemo(() => ({
    openDocument,
    closeDocument,
    isOpen: state.isOpen
  }), [openDocument, closeDocument, state.isOpen]);

  return (
    <DocumentPreviewContext.Provider value={value}>
      {children}

      {state.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-200">
          <div className="w-full h-full max-w-6xl flex flex-col bg-white dark:bg-[#111114] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <Eye size={18} className="text-cyan-400 shrink-0" />
                <h3 className="font-mono font-bold uppercase tracking-wider text-xs md:text-sm truncate">{state.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={state.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] md:text-xs font-bold uppercase transition-colors"
                >
                  <ExternalLink size={14} /> Abrir original
                </a>
                <button
                  type="button"
                  onClick={closeDocument}
                  className="p-1.5 bg-white/10 hover:bg-red-500/80 rounded-lg transition-colors text-white"
                  aria-label="Fechar visualiza??o"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200 dark:bg-slate-900 relative">
              <iframe
                src={state.embedUrl}
                className="w-full h-full absolute inset-0 border-0"
                allow="autoplay"
                title={state.title}
              />
            </div>
          </div>
        </div>
      )}
    </DocumentPreviewContext.Provider>
  );
};

export const useDocumentPreview = (): DocumentPreviewContextValue => {
  const context = useContext(DocumentPreviewContext);
  if (!context) {
    throw new Error('useDocumentPreview must be used within DocumentPreviewProvider');
  }
  return context;
};
