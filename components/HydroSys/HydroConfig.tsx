
import React, { useState, useEffect } from 'react';
import { Settings, Save, Calendar, TestTube, Droplets, ArrowLeft, RefreshCw, Info, CheckCircle2, Box, Waves, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroSettings } from '../../types';
import { hydroService } from '../../services/hydroService';
import { useToast } from '../Shared/ToastContext';

export const HydroConfig: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaCaixa: 6,
    validadeLimpezaCisterna: 6,
    validadeLimpezaPoco: 6,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => setSettings(await hydroService.getSettings());
    load();
  }, []);

  const validateSettings = () => {
      // Logic Checks
      if (settings.cloroMin < 0 || settings.cloroMax < 0 || settings.phMin < 0 || settings.phMax < 0) {
          addToast("Os valores químicos devem ser positivos.", "warning");
          return false;
      }
      
      if (settings.cloroMin >= settings.cloroMax) {
          addToast("Cloro mínimo deve ser menor que o máximo.", "warning");
          return false;
      }

      if (settings.phMin >= settings.phMax) {
          addToast("pH mínimo deve ser menor que o máximo.", "warning");
          return false;
      }

      if (settings.phMin > 14 || settings.phMax > 14) {
          addToast("Valores de pH devem estar entre 0 e 14.", "warning");
          return false;
      }

      if (settings.validadeCertificadoMeses <= 0 || settings.validadeFiltroMeses <= 0 || 
          settings.validadeLimpezaCaixa <= 0 || settings.validadeLimpezaCisterna <= 0 || settings.validadeLimpezaPoco <= 0) {
          addToast("Ciclos de validade devem ser maiores que zero.", "warning");
          return false;
      }

      return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    await hydroService.saveSettings(settings);
    setSaved(true);
    addToast("CONFIGURAÇÕES atualizadas com sucesso.", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
      if(confirm('Restaurar configurações Padrão?')) {
          setSettings({ 
              validadeCertificadoMeses: 6, 
              validadeFiltroMeses: 6, 
              validadeLimpezaCaixa: 6,
              validadeLimpezaCisterna: 6,
              validadeLimpezaPoco: 6,
              cloroMin: 1.0, 
              cloroMax: 3.0, 
              phMin: 7.4, 
              phMax: 7.6 
          });
          addToast("Valores restaurados. Clique em Salvar para confirmar.", "info");
      }
  };

  const CycleItem = ({ label, icon: Icon, value, onChange }: any) => (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
              {Icon && <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-400"><Icon size={16}/></div>}
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">{label}</p>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={() => onChange(Math.max(1, value - 1))} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">-</button>
              <span className="w-8 text-center font-bold text-lg font-mono">{value}</span>
              <button onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">+</button>
              <span className="text-xs font-bold text-slate-400 uppercase">Meses</span>
          </div>
      </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0A0C]">
        {/* BACKGROUND */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0A0A0C] dark:via-[#0D0D10] dark:to-[#0A0A0C]" />
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] text-slate-400 dark:text-cyan-500" style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        </div>

        <div className="relative z-10 px-4 md:px-8 py-6 space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto">
            {/* HEADER */}
            <header className="relative overflow-hidden border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-sm rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-4 w-full md:w-auto">
                        <button onClick={() => navigate('/module/hydrosys')} className="group flex items-center gap-2 text-slate-500 dark:text-white/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-xs font-mono uppercase tracking-widest">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
                        </button>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 border-2 border-cyan-500/20 dark:border-cyan-500/50 flex items-center justify-center bg-cyan-50 dark:bg-cyan-500/5 rounded-xl">
                                <Settings size={28} className="text-cyan-600 dark:text-cyan-500" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                                    CONFIGURAÇÕES
                                </h1>
                                <p className="text-slate-500 dark:text-white/30 text-xs md:text-sm font-mono mt-0.5">
                                    Parâmetros e Automação.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={handleReset} className="px-4 py-3 text-slate-500 hover:text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors font-mono font-bold text-xs uppercase flex items-center gap-2">
                            <RefreshCw size={16} /> Restaurar
                        </button>
                        <button onClick={handleSave} className={`px-6 py-3 text-white rounded-xl font-bold font-mono text-xs uppercase shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-emerald-500' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {saved ? 'Salvo!' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
                {/* CYCLES */}
                <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                            <Calendar className="text-purple-500" size={20} /> CICLOS DE VALIDADE
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Geral</div>
                        <CycleItem 
                            label="Certificados Potabilidade" 
                            value={settings.validadeCertificadoMeses} 
                            onChange={(v: number) => setSettings({...settings, validadeCertificadoMeses: v})} 
                        />
                        <CycleItem 
                            label="Troca de Filtros" 
                            value={settings.validadeFiltroMeses} 
                            onChange={(v: number) => setSettings({...settings, validadeFiltroMeses: v})} 
                        />
                        
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2">reservatórios (Limpeza)</div>
                        <CycleItem 
                            label="Caixa D'água" 
                            icon={Box}
                            value={settings.validadeLimpezaCaixa} 
                            onChange={(v: number) => setSettings({...settings, validadeLimpezaCaixa: v})} 
                        />
                        <CycleItem 
                            label="Cisterna" 
                            icon={Waves}
                            value={settings.validadeLimpezaCisterna} 
                            onChange={(v: number) => setSettings({...settings, validadeLimpezaCisterna: v})} 
                        />
                        <CycleItem 
                            label="poço Artesiano" 
                            icon={Activity}
                            value={settings.validadeLimpezaPoco} 
                            onChange={(v: number) => setSettings({...settings, validadeLimpezaPoco: v})} 
                        />
                    </div>
                </div>

                {/* QUALITY STANDARDS */}
                <div className="bg-white/80 dark:bg-[#111114]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-fit">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                            <TestTube className="text-cyan-500" size={20} /> Padrões DE QUALIDADE
                        </h3>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"><Droplets size={18} className="text-cyan-500" /> Cloro (ppm)</span>
                                <span className="bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1 rounded-lg border border-cyan-100 dark:border-cyan-800 text-xs text-cyan-700 dark:text-cyan-300 font-mono font-bold">{settings.cloroMin} - {settings.cloroMax}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">mínimo</label><input type="number" step="0.1" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white font-mono" value={settings.cloroMin} onChange={e => setSettings({...settings, cloroMin: parseFloat(e.target.value)})} /></div>
                                <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">máximo</label><input type="number" step="0.1" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white font-mono" value={settings.cloroMax} onChange={e => setSettings({...settings, cloroMax: parseFloat(e.target.value)})} /></div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200"><TestTube size={18} className="text-blue-500" /> pH</span>
                                <span className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-mono font-bold">{settings.phMin} - {settings.phMax}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">mínimo</label><input type="number" step="0.1" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white font-mono" value={settings.phMin} onChange={e => setSettings({...settings, phMin: parseFloat(e.target.value)})} /></div>
                                <div className="flex-1"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">máximo</label><input type="number" step="0.1" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white font-mono" value={settings.phMax} onChange={e => setSettings({...settings, phMax: parseFloat(e.target.value)})} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
