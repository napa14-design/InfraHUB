
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';
import { moduleService } from '../services/moduleService';

export const ModuleView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moduleInfo, setModuleInfo] = useState(() => moduleService.getAll().find(m => m.path.includes(id || '')));

  useEffect(() => {
    let active = true;

    const syncModuleInfo = async () => {
      try {
        const synced = await moduleService.sync();
        if (!active) return;
        setModuleInfo(synced.find(m => m.path.includes(id || '')));
      } catch {
        if (!active) return;
        setModuleInfo(moduleService.getAll().find(m => m.path.includes(id || '')));
      }
    };

    void syncModuleInfo();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="relative min-h-screen p-8 flex flex-col">
        {/* ARCHITECTURAL BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none -z-10 fixed">
            <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-brand-600 dark:text-brand-500"
            style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
            />
            {/* Diagonal Hazard Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
            <defs>
                <pattern id="hazard-lines" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                <rect width="20" height="40" fill="currentColor" className="text-yellow-500" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hazard-lines)" />
            </svg>
        </div>

      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-500 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-8 w-fit"
      >
        <ArrowLeft size={16} className="mr-2" />
        VOLTAR AO HUB
      </button>

      <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full bg-white dark:bg-[#0C0C0E] border-2 border-yellow-500/30 p-12 relative overflow-hidden shadow-2xl">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-500"></div>

              <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center mb-8 animate-pulse">
                      <Construction size={48} className="text-yellow-600 dark:text-yellow-500" />
                  </div>
                  
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                      {moduleInfo ? moduleInfo.title : 'Modulo Interno'}
                  </h1>
                  
                  <div className="bg-yellow-500 text-black px-4 py-1 font-mono font-bold text-sm uppercase mb-6">
                      EM DESENVOLVIMENTO
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 font-mono text-sm max-w-md leading-relaxed mb-10">
                      O modulo operacional <strong>[{id}]</strong> esta em fase de desenvolvimento.
                      A infraestrutura esta sendo preparada.
                  </p>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <button className="py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white transition-colors uppercase">
                          VER ESPECIFICACOES
                      </button>
                      <button className="py-3 bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors uppercase">
                          NOTIFICAR-ME
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

