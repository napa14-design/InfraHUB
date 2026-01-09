
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Save, Clock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { User, PestControlSettings } from '../../types';
import { pestService } from '../../services/pestService';

export const PestControlConfig: React.FC<{ user: User }> = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PestControlSettings>({
      frequencyRato: 15,
      frequencyMuricoca: 15,
      frequencyBarata: 15,
      defaultTechnician: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
      const load = async () => {
          const s = await pestService.getSettings();
          setSettings(s);
      };
      load();
  }, []);

  const handleSave = async () => {
      await pestService.saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] p-4 md:p-8">
       {/* Background */}
       <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
       </div>

       <div className="max-w-4xl mx-auto space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
                            <ArrowLeft size={16} className="mr-2" /> Voltar
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3">
                        <Settings className="text-amber-600" /> CONFIGURAÇÃO GERAL
                    </h1>
                    <p className="text-slate-500 text-sm">Definição de automações e padrões do módulo.</p>
                </div>
                <button 
                    onClick={handleSave}
                    className={`flex items-center px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg ${saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}`}
                >
                    {saved ? <CheckCircle2 size={16} className="mr-2"/> : <Save size={16} className="mr-2"/>}
                    {saved ? 'SALVO!' : 'SALVAR ALTERAÇÕES'}
                </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Frequencies Card */}
               <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-6 text-amber-600 font-bold uppercase text-xs tracking-wider">
                       <Clock size={16} /> Frequência Automática (Dias)
                   </div>
                   
                   <div className="space-y-6">
                       <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Rato / Roedores</label>
                           <div className="flex items-center gap-3">
                               <input 
                                   type="range" min="1" max="90" 
                                   className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                   value={settings.frequencyRato}
                                   onChange={e => setSettings({...settings, frequencyRato: parseInt(e.target.value)})}
                               />
                               <div className="w-16 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono font-bold text-slate-900 dark:text-white">
                                   {settings.frequencyRato}
                               </div>
                           </div>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Muriçoca / Mosquitos</label>
                           <div className="flex items-center gap-3">
                               <input 
                                   type="range" min="1" max="90" 
                                   className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                   value={settings.frequencyMuricoca}
                                   onChange={e => setSettings({...settings, frequencyMuricoca: parseInt(e.target.value)})}
                               />
                               <div className="w-16 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono font-bold text-slate-900 dark:text-white">
                                   {settings.frequencyMuricoca}
                               </div>
                           </div>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Barata / Escorpião</label>
                           <div className="flex items-center gap-3">
                               <input 
                                   type="range" min="1" max="90" 
                                   className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                   value={settings.frequencyBarata}
                                   onChange={e => setSettings({...settings, frequencyBarata: parseInt(e.target.value)})}
                               />
                               <div className="w-16 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-mono font-bold text-slate-900 dark:text-white">
                                   {settings.frequencyBarata}
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Defaults Card */}
               <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 mb-6 text-amber-600 font-bold uppercase text-xs tracking-wider">
                       <UserIcon size={16} /> Dados Padrão
                   </div>
                   
                   <div className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Técnico Padrão</label>
                           <input 
                               className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm"
                               placeholder="Nome do Aplicador"
                               value={settings.defaultTechnician}
                               onChange={e => setSettings({...settings, defaultTechnician: e.target.value})}
                           />
                           <p className="text-[10px] text-slate-400 pt-1">Este nome será preenchido automaticamente em novos agendamentos.</p>
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
