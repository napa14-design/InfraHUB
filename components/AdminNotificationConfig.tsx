
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Save, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, XCircle, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationRule } from '../types';
import { configService } from '../services/configService';

export const AdminNotificationConfig: React.FC = () => {
  const navigate = useNavigate();
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
    } else {
        setSaveStatus('SUCCESS');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleReset = async () => {
      if(confirm('RESET TO DEFAULTS?')) {
          setRules(await configService.resetDefaults());
          setHasChanges(false);
      }
  }

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-xs font-mono uppercase tracking-widest mb-2">
            <ArrowLeft size={14} className="mr-1" /> Voltar
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Sliders className="text-brand-600 dark:text-brand-400" size={28} />
            REGRAS DE ALERTA
          </h1>
          <p className="text-sm text-slate-500 font-mono">Calibragem de sensores e notificações.</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
                <RefreshCw size={16} className="mr-2" />
                DEFAULTS
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
                {saveStatus === 'SUCCESS' ? 'SAVED' : saveStatus === 'ERROR' ? 'ERROR' : 'APPLY_CONFIG'}
            </button>
        </div>
      </div>

      {saveStatus === 'ERROR' && (
          <div className="p-4 bg-red-950/30 border border-red-900 text-red-400 font-mono text-xs flex items-center gap-3">
              <XCircle size={16} />
              <div>
                  <p className="font-bold uppercase">WRITE_FAILURE</p>
                  <p>{errorMessage || 'DATABASE_CONNECTION_ERROR'}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-6">
          {rules.map(rule => (
              <div key={rule.id} className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  {/* Decorative Side Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.enabled ? 'bg-brand-500' : 'bg-slate-700'}`}></div>

                  <div className="flex justify-between items-start mb-6 pl-4">
                      <div>
                          <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                  {rule.name}
                              </h3>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 uppercase">
                                  MOD: {rule.moduleId}
                              </span>
                          </div>
                          <p className="text-slate-500 text-xs font-mono">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono font-bold uppercase ${rule.enabled ? 'text-brand-500' : 'text-slate-600'}`}>
                              {rule.enabled ? 'ONLINE' : 'OFFLINE'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={rule.enabled}
                                onChange={e => handleUpdate(rule.id, 'enabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                          </label>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800 pl-4 opacity-100 transition-opacity">
                      {/* Warning Config */}
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-600 font-mono text-xs font-bold uppercase">
                              <AlertTriangle size={14} />
                              <span>THRESHOLD_WARNING</span>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 w-fit">
                              <input 
                                type="number"
                                className="w-16 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white outline-none"
                                value={rule.warningDays}
                                onChange={e => handleUpdate(rule.id, 'warningDays', Number(e.target.value))}
                              />
                              <span className="text-[10px] font-mono text-slate-500 uppercase border-l border-slate-700 pl-3">DIAS</span>
                          </div>
                      </div>

                      {/* Critical Config */}
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-600 font-mono text-xs font-bold uppercase">
                              <AlertCircle size={14} />
                              <span>THRESHOLD_CRITICAL</span>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 w-fit">
                              <input 
                                type="number"
                                className="w-16 bg-transparent text-center font-mono font-bold text-slate-900 dark:text-white outline-none"
                                value={rule.criticalDays}
                                onChange={e => handleUpdate(rule.id, 'criticalDays', Number(e.target.value))}
                              />
                              <span className="text-[10px] font-mono text-slate-500 uppercase border-l border-slate-700 pl-3">DIAS</span>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
