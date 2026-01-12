
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Save, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, XCircle, Sliders, Droplets, Bug, Layout, Rat, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationRule } from '../types';
import { configService } from '../services/configService';
import { useToast } from './Shared/ToastContext';

type ModuleTab = 'hydrosys' | 'pestcontrol' | 'system';

export const AdminNotificationConfig: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ModuleTab>('hydrosys');
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const load = async () => {
        setRules(await configService.getNotificationRules());
    }
    load();
  }, []);

  const handleUpdate = (id: string, field: keyof NotificationRule, value: any) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setHasChanges(true);
    setSaveStatus('IDLE');
    setErrorMessage('');
  };

  const handleSave = async () => {
    // Validation Logic
    for (const r of rules) {
        if (r.enabled && r.warningDays <= r.criticalDays) {
            addToast(`Regra "${r.name}": Dias de Aviso deve ser MAIOR que Dias Críticos.`, "warning");
            return;
        }
        if (r.warningDays < 0 || r.criticalDays < 0) {
            addToast(`Regra "${r.name}": Os dias não podem ser negativos.`, "warning");
            return;
        }
    }

    setIsSaving(true);
    setSaveStatus('IDLE');
    setErrorMessage('');
    let errorFound = null;

    for (const r of rules) {
        const { error } = await configService.saveRule(r);
        if (error) {
            errorFound = error;
            break; // Stop on first error
        }
    }

    setIsSaving(false);
    if (errorFound) {
        setSaveStatus('ERROR');
        const msg = typeof errorFound === 'string' ? errorFound : JSON.stringify(errorFound);
        setErrorMessage(msg);
        addToast("Erro ao salvar regras.", "error");
    } else {
        setSaveStatus('SUCCESS');
        setHasChanges(false);
        addToast("Regras atualizadas com sucesso!", "success");
        setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleReset = async () => {
      if(confirm('Isso irá redefinir todas as regras para o padrão do sistema. Continuar?')) {
          setRules(await configService.resetDefaults());
          setHasChanges(false);
          addToast("Regras redefinidas para o padrão.", "info");
      }
  }

  // Filter Rules based on Active Tab
  const currentRules = rules.filter(r => {
      if (activeTab === 'hydrosys') return r.moduleId === 'hydrosys';
      if (activeTab === 'pestcontrol') return r.moduleId === 'pestcontrol';
      return r.moduleId !== 'hydrosys' && r.moduleId !== 'pestcontrol';
  });

  const TabButton = ({ id, label, icon: Icon }: { id: ModuleTab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-6 py-4 border-b-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors
            ${activeTab === id 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-slate-50 dark:bg-slate-800/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'}
        `}
      >
          <Icon size={16} /> {label}
      </button>
  );

  return (
    <div className="relative min-h-screen space-y-6 pb-20">
      
      {/* ARCHITECTURAL BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none -z-10 fixed">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] text-brand-600 dark:text-brand-500"
          style={{ backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.02] text-slate-900 dark:text-white"
          style={{ backgroundImage: `linear-gradient(currentColor 0.5px, transparent 0.5px), linear-gradient(90deg, currentColor 0.5px, transparent 0.5px)`, backgroundSize: '12px 12px' }}
        />
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Sliders className="text-brand-600 dark:text-brand-400" size={28} />
            SENSORES & ALERTAS
          </h1>
          <p className="text-sm text-slate-500 font-mono">Calibragem de notificações por módulo.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
                <RefreshCw size={16} className="mr-2" />
                PADRÕES
            </button>
            <button 
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`flex items-center justify-center px-6 py-3 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                    ${saveStatus === 'SUCCESS' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 
                      saveStatus === 'ERROR' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' :
                      'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'}
                `}
            >
                {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : saveStatus === 'SUCCESS' ? (
                    <CheckCircle2 size={16} className="mr-2" />
                ) : (
                    <Save size={16} className="mr-2" />
                )}
                {saveStatus === 'SUCCESS' ? 'SALVO' : saveStatus === 'ERROR' ? 'ERRO' : 'SALVAR CONFIG'}
            </button>
        </div>
      </div>

      {saveStatus === 'ERROR' && (
          <div className="p-4 bg-red-950/30 border border-red-900 text-red-400 font-mono text-xs flex items-center gap-3">
              <XCircle size={16} />
              <div>
                  <p className="font-bold uppercase">FALHA AO SALVAR</p>
                  <p>{errorMessage || 'ERRO DE CONEXÃO BD'}</p>
              </div>
          </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <TabButton id="hydrosys" label="Gestão Hídrica (HydroSys)" icon={Droplets} />
          <TabButton id="pestcontrol" label="Controle de Pragas" icon={Bug} />
          <TabButton id="system" label="Sistema Geral" icon={Layout} />
      </div>

      {/* RULES LIST */}
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4">
          
          {activeTab === 'pestcontrol' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                  <Info className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                  <div>
                      <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase">Configuração Granular</h4>
                      <p className="text-xs text-amber-600/80 dark:text-amber-500/70 mt-1">
                          Agora é possível definir prazos de alerta diferentes para tipos de pragas (Ex: Roedores requerem atenção mais rápida que insetos comuns).
                      </p>
                  </div>
              </div>
          )}

          {currentRules.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="font-mono text-xs uppercase">Nenhuma regra encontrada para este módulo.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-6">
                  {currentRules.map(rule => (
                      <div key={rule.id} className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                          {/* Decorative Side Bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.enabled ? (activeTab === 'pestcontrol' ? 'bg-amber-500' : 'bg-cyan-500') : 'bg-slate-700'}`}></div>

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pl-4 gap-4">
                              <div>
                                  <div className="flex items-center gap-3 mb-1">
                                      <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                          {rule.name}
                                      </h3>
                                      {/* Icon badge for pests */}
                                      {rule.id.includes('rodents') && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-amber-200">Alta Prioridade</span>}
                                  </div>
                                  <p className="text-slate-500 text-xs font-mono">{rule.description}</p>
                              </div>
                              <div className="flex items-center gap-3 self-end md:self-auto">
                                  <span className={`text-[10px] font-mono font-bold uppercase ${rule.enabled ? 'text-emerald-500' : 'text-slate-600'}`}>
                                      {rule.enabled ? 'MONITORAMENTO ATIVO' : 'SENSOR DESLIGADO'}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={rule.enabled}
                                        onChange={e => handleUpdate(rule.id, 'enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                  </label>
                              </div>
                          </div>

                          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800 pl-4 transition-opacity ${rule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                              {/* Warning Config */}
                              <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-amber-600 font-mono text-xs font-bold uppercase">
                                      <AlertTriangle size={14} />
                                      <span>AVISO DE PROXIMIDADE (WARNING)</span>
                                  </div>
                                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 w-fit rounded-lg">
                                      <span className="text-[10px] font-mono text-slate-400 pl-2">FALTANDO</span>
                                      <input 
                                        type="number"
                                        className="w-12 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white outline-none"
                                        value={rule.warningDays}
                                        onChange={e => handleUpdate(rule.id, 'warningDays', Number(e.target.value))}
                                      />
                                      <span className="text-[10px] font-mono text-slate-500 uppercase border-l border-slate-300 dark:border-slate-700 pl-3 pr-2">DIAS</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Gera notificação amarela no painel e sininho.</p>
                              </div>

                              {/* Critical Config */}
                              <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-red-600 font-mono text-xs font-bold uppercase">
                                      <AlertCircle size={14} />
                                      <span>LIMITE CRÍTICO / ATRASO (ERROR)</span>
                                  </div>
                                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 w-fit rounded-lg">
                                      <span className="text-[10px] font-mono text-slate-400 pl-2">APÓS</span>
                                      <input 
                                        type="number"
                                        className="w-12 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white outline-none"
                                        value={rule.criticalDays}
                                        onChange={e => handleUpdate(rule.id, 'criticalDays', Number(e.target.value))}
                                      />
                                      <span className="text-[10px] font-mono text-slate-500 uppercase border-l border-slate-300 dark:border-slate-700 pl-3 pr-2">DIAS</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Gera banner vermelho de alerta global (atraso).</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
