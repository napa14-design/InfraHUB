
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Settings, Save, Clock, User as UserIcon, CheckCircle2, 
    Plus, Trash2, Bug, Building2, MapPin, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { User, PestControlSettings, Sede } from '../../types';
import { pestService } from '../../services/pestService';
import { orgService } from '../../services/orgService';

type ConfigTab = 'GLOBAL' | 'LISTS' | 'SEDES';

export const PestControlConfig: React.FC<{ user: User }> = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConfigTab>('GLOBAL');
  const [settings, setSettings] = useState<PestControlSettings>({
      pestTypes: [],
      technicians: [],
      globalFrequencies: {},
      sedeFrequencies: {}
  });
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState('');
  const [saved, setSaved] = useState(false);

  // Aux state for adding to lists
  const [newPest, setNewPest] = useState('');
  const [newTech, setNewTech] = useState('');

  useEffect(() => {
      const load = async () => {
          const [s, sedes] = await Promise.all([
              pestService.getSettings(),
              orgService.getSedes()
          ]);
          setSettings(s);
          setAvailableSedes(sedes);
          if (sedes.length > 0) setSelectedSedeId(sedes[0].id);
      };
      load();
  }, []);

  const handleSave = async () => {
      await pestService.saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  };

  const addPest = () => {
      if (newPest && !settings.pestTypes.includes(newPest)) {
          setSettings({
              ...settings,
              pestTypes: [...settings.pestTypes, newPest],
              globalFrequencies: { ...settings.globalFrequencies, [newPest]: 15 }
          });
          setNewPest('');
      }
  };

  const removePest = (p: string) => {
      setSettings({
          ...settings,
          pestTypes: settings.pestTypes.filter(x => x !== p)
      });
  };

  const addTech = () => {
      if (newTech && !settings.technicians.includes(newTech)) {
          setSettings({ ...settings, technicians: [...settings.technicians, newTech] });
          setNewTech('');
      }
  };

  const removeTech = (t: string) => {
      setSettings({ ...settings, technicians: settings.technicians.filter(x => x !== t) });
  };

  const updateGlobalFreq = (pest: string, days: number) => {
      setSettings({
          ...settings,
          globalFrequencies: { ...settings.globalFrequencies, [pest]: days }
      });
  };

  const updateSedeFreq = (pest: string, days: number) => {
      if (!selectedSedeId) return;
      const currentSede = settings.sedeFrequencies[selectedSedeId] || {};
      setSettings({
          ...settings,
          sedeFrequencies: {
              ...settings.sedeFrequencies,
              [selectedSedeId]: { ...currentSede, [pest]: days }
          }
      });
  };

  const removeSedeOverride = (pest: string) => {
      if (!selectedSedeId || !settings.sedeFrequencies[selectedSedeId]) return;
      const newSedeFreqs = { ...settings.sedeFrequencies[selectedSedeId] };
      delete newSedeFreqs[pest];
      
      const newAllSedes = { ...settings.sedeFrequencies };
      if (Object.keys(newSedeFreqs).length === 0) delete newAllSedes[selectedSedeId];
      else newAllSedes[selectedSedeId] = newSedeFreqs;

      setSettings({ ...settings, sedeFrequencies: newAllSedes });
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0A0A0C] p-4 md:p-8">
       <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
       </div>

       <div className="max-w-5xl mx-auto space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button onClick={() => navigate('/module/pestcontrol')} className="flex items-center text-slate-500 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
                            <ArrowLeft size={16} className="mr-2" /> Voltar
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-3 uppercase tracking-tighter">
                        <Settings className="text-amber-600" size={32} /> PAINEL DE CONFIGURAÇÃO
                    </h1>
                </div>
                <button onClick={handleSave} className={`flex items-center px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'}`}>
                    {saved ? <CheckCircle2 size={18} className="mr-2"/> : <Save size={18} className="mr-2"/>}
                    {saved ? 'DADOS SALVOS!' : 'SALVAR MATRIZ'}
                </button>
           </div>

           {/* TABS MENU */}
           <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800">
               {[
                   { id: 'GLOBAL', label: 'Ciclos Globais', icon: Clock },
                   { id: 'LISTS', label: 'Cadastros Base', icon: Bug },
                   { id: 'SEDES', label: 'Exceções por Sede', icon: MapPin }
               ].map(tab => (
                   <button key={tab.id} onClick={() => setActiveTab(tab.id as ConfigTab)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                       <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                   </button>
               ))}
           </div>
           
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'GLOBAL' && (
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <Clock className="text-amber-600" size={24} />
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Intervalos Padrão</h3>
                                <p className="text-xs text-slate-500">Defina o ciclo de retorno automático para cada praga.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {settings.pestTypes.map(pest => (
                                <div key={pest} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">{pest}</label>
                                        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg font-mono font-black text-xs">{settings.globalFrequencies[pest] || 15} DIAS</div>
                                    </div>
                                    <input type="range" min="1" max="90" className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600" value={settings.globalFrequencies[pest] || 15} onChange={e => updateGlobalFreq(pest, parseInt(e.target.value))} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'LISTS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* PRAGAS */}
                        <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Bug size={20} className="text-amber-600"/> Tipos de Pragas</h3>
                            </div>
                            <div className="flex gap-2">
                                <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" placeholder="Nova Praga (Ex: Formiga)" value={newPest} onChange={e => setNewPest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPest()} />
                                <button onClick={addPest} className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700"><Plus size={20}/></button>
                            </div>
                            <div className="space-y-2">
                                {settings.pestTypes.map(p => (
                                    <div key={p} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl group">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p}</span>
                                        <button onClick={() => removePest(p)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* TECNICOS */}
                        <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><UserIcon size={20} className="text-cyan-600"/> Equipe / Técnicos</h3>
                            </div>
                            <div className="flex gap-2">
                                <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" placeholder="Nome do Técnico" value={newTech} onChange={e => setNewTech(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTech()} />
                                <button onClick={addTech} className="p-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700"><Plus size={20}/></button>
                            </div>
                            <div className="space-y-2">
                                {settings.technicians.map(t => (
                                    <div key={t} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl group">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t}</span>
                                        <button onClick={() => removeTech(t)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'SEDES' && (
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Building2 size={20} className="text-purple-600"/> Exceções por Unidade</h3>
                                <p className="text-xs text-slate-500">Ajuste o ciclo para unidades com maior risco de infestação.</p>
                            </div>
                            <select className="w-full md:w-64 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-amber-500 transition-all" value={selectedSedeId} onChange={e => setSelectedSedeId(e.target.value)}>
                                {availableSedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {selectedSedeId ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {settings.pestTypes.map(pest => {
                                    const hasOverride = settings.sedeFrequencies[selectedSedeId] && settings.sedeFrequencies[selectedSedeId][pest] !== undefined;
                                    const currentVal = hasOverride ? settings.sedeFrequencies[selectedSedeId][pest] : settings.globalFrequencies[pest] || 15;

                                    return (
                                        <div key={pest} className={`p-5 rounded-3xl border transition-all ${hasOverride ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-800 shadow-md' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/50'}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{pest}</span>
                                                    <h4 className={`text-lg font-black ${hasOverride ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                        {currentVal} DIAS
                                                    </h4>
                                                </div>
                                                {hasOverride ? (
                                                    <button onClick={() => removeSedeOverride(pest)} className="p-2 bg-white dark:bg-slate-900 text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm"><Trash2 size={16}/></button>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><Clock size={12}/> Padrão Global</div>
                                                )}
                                            </div>
                                            <input type="range" min="1" max="90" className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${hasOverride ? 'accent-amber-600' : 'accent-slate-400'}`} value={currentVal} onChange={e => updateSedeFreq(pest, parseInt(e.target.value))} />
                                            <p className="text-[10px] text-slate-400 mt-2 font-mono italic">
                                                {hasOverride ? '* Ignorando regra global para esta unidade.' : 'Mova o controle para criar uma regra específica.'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-20 text-center text-slate-400 uppercase font-black tracking-widest text-xs">Selecione uma sede para continuar</div>
                        )}
                    </div>
                )}
           </div>
           
           <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl border border-slate-800 flex items-start gap-4">
                <Info size={24} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    <strong>NOTA DE SEGURANÇA:</strong> Alterar as frequências por sede afetará apenas os **novos** agendamentos gerados automaticamente após a conclusão da tarefa atual. Registros já agendados permanecem com suas datas originais.
                </p>
           </div>
       </div>
    </div>
  );
};
