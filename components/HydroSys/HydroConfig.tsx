import React, { useState, useEffect } from 'react';
import { Settings, Save, Calendar, TestTube, Droplets, ArrowLeft, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, HydroSettings } from '../../types';
import { hydroService } from '../../services/hydroService';

export const HydroConfig: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<HydroSettings>({
    validadeCertificadoMeses: 6,
    validadeFiltroMeses: 6,
    validadeLimpezaMeses: 6,
    cloroMin: 1.0,
    cloroMax: 3.0,
    phMin: 7.4,
    phMax: 7.6
  });
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
        setSettings(await hydroService.getSettings());
    };
    load();
  }, []);

  const handleSave = async () => {
    await hydroService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
      if(confirm('Restaurar configurações padrão?')) {
          const defaults = {
            validadeCertificadoMeses: 6,
            validadeFiltroMeses: 6,
            validadeLimpezaMeses: 6,
            cloroMin: 1.0,
            cloroMax: 3.0,
            phMin: 7.4,
            phMax: 7.6
          };
          setSettings(defaults);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <button 
                onClick={() => navigate('/module/hydrosys')}
                className="flex items-center text-slate-500 hover:text-cyan-600 transition-colors text-sm font-medium mb-2"
            >
                <ArrowLeft size={16} className="mr-1" />
                Voltar ao Painel
            </button>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Settings className="text-cyan-600" size={32} />
                Parâmetros do Sistema
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
                Defina as regras de automação e padrões de qualidade globais.
            </p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={handleReset}
                className="px-4 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium flex items-center gap-2"
            >
                <RefreshCw size={18} /> Restaurar
            </button>
            <button 
                onClick={handleSave}
                className={`px-6 py-3 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-emerald-500' : 'bg-cyan-600 hover:bg-cyan-700 hover:shadow-cyan-500/20'}`}
            >
                {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                {saved ? 'Salvo!' : 'Salvar Alterações'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION 1: AUTOMATION DATES */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="text-purple-500" />
                      Ciclos de Validade
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                      Defina a duração padrão para cálculo automático de vencimentos.
                  </p>
              </div>
              
              <div className="p-6 space-y-6">
                  {/* Certificados */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                      <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">Certificados de Potabilidade</p>
                          <p className="text-xs text-slate-400">Renovação semestral ou anual?</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSettings({...settings, validadeCertificadoMeses: Math.max(1, settings.validadeCertificadoMeses - 1)})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >-</button>
                          <span className="w-12 text-center font-bold text-xl">{settings.validadeCertificadoMeses}</span>
                          <button 
                            onClick={() => setSettings({...settings, validadeCertificadoMeses: settings.validadeCertificadoMeses + 1})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >+</button>
                          <span className="text-xs font-bold text-slate-400 uppercase">Meses</span>
                      </div>
                  </div>

                  {/* Filtros */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                      <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">Troca de Elementos Filtrantes</p>
                          <p className="text-xs text-slate-400">Vida útil padrão dos refis</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSettings({...settings, validadeFiltroMeses: Math.max(1, settings.validadeFiltroMeses - 1)})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >-</button>
                          <span className="w-12 text-center font-bold text-xl">{settings.validadeFiltroMeses}</span>
                          <button 
                            onClick={() => setSettings({...settings, validadeFiltroMeses: settings.validadeFiltroMeses + 1})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >+</button>
                          <span className="text-xs font-bold text-slate-400 uppercase">Meses</span>
                      </div>
                  </div>

                  {/* Reservatórios */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                      <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">Higienização de Reservatórios</p>
                          <p className="text-xs text-slate-400">Ciclo de limpeza de caixas/cisternas</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSettings({...settings, validadeLimpezaMeses: Math.max(1, settings.validadeLimpezaMeses - 1)})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >-</button>
                          <span className="w-12 text-center font-bold text-xl">{settings.validadeLimpezaMeses}</span>
                          <button 
                            onClick={() => setSettings({...settings, validadeLimpezaMeses: settings.validadeLimpezaMeses + 1})}
                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                          >+</button>
                          <span className="text-xs font-bold text-slate-400 uppercase">Meses</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* SECTION 2: QUALITY STANDARDS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <TestTube className="text-cyan-500" />
                      Padrões de Qualidade
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                      Parâmetros físico-químicos aceitáveis (Zona Segura).
                  </p>
              </div>

              <div className="p-6 space-y-8">
                  {/* CLORO */}
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                              <Droplets size={18} className="text-cyan-500" /> Cloro Residual (ppm)
                          </span>
                          <div className="bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1 rounded-lg border border-cyan-100 dark:border-cyan-800 text-xs text-cyan-700 dark:text-cyan-300 font-mono">
                              Range Atual: <strong>{settings.cloroMin.toFixed(1)} - {settings.cloroMax.toFixed(1)}</strong>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínimo Aceitável</label>
                              <input 
                                  type="number" step="0.1"
                                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white"
                                  value={settings.cloroMin}
                                  onChange={e => setSettings({...settings, cloroMin: parseFloat(e.target.value)})}
                              />
                          </div>
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máximo Aceitável</label>
                              <input 
                                  type="number" step="0.1"
                                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white"
                                  value={settings.cloroMax}
                                  onChange={e => setSettings({...settings, cloroMax: parseFloat(e.target.value)})}
                              />
                          </div>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="h-2 w-full bg-gradient-to-r from-red-300 via-emerald-400 to-red-300 rounded-full opacity-50"></div>
                  </div>

                  {/* pH */}
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                              <TestTube size={18} className="text-blue-500" /> Potencial Hidrogeniônico (pH)
                          </span>
                          <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-mono">
                              Range Atual: <strong>{settings.phMin.toFixed(1)} - {settings.phMax.toFixed(1)}</strong>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mínimo Aceitável</label>
                              <input 
                                  type="number" step="0.1"
                                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white"
                                  value={settings.phMin}
                                  onChange={e => setSettings({...settings, phMin: parseFloat(e.target.value)})}
                              />
                          </div>
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Máximo Aceitável</label>
                              <input 
                                  type="number" step="0.1"
                                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-white"
                                  value={settings.phMax}
                                  onChange={e => setSettings({...settings, phMax: parseFloat(e.target.value)})}
                              />
                          </div>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="h-2 w-full bg-gradient-to-r from-red-300 via-blue-400 to-red-300 rounded-full opacity-50"></div>
                  </div>
              </div>
          </div>

      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
          <Info className="flex-shrink-0" />
          <p>
              <strong>Nota:</strong> As alterações nos ciclos de validade afetarão apenas novos registros ou renovações futuras. 
              As alterações nos parâmetros de qualidade atualizarão imediatamente os indicadores visuais no painel de controle de Cloro.
          </p>
      </div>

    </div>
  );
};