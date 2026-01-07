
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Save, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
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
        // Handle if error is object or string
        const msg = typeof errorFound === 'string' ? errorFound : JSON.stringify(errorFound);
        setErrorMessage(msg);
    } else {
        setSaveStatus('SUCCESS');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const handleReset = async () => {
      if(confirm('Restaurar padrões?')) {
          setRules(await configService.resetDefaults());
          setHasChanges(false);
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors text-sm font-medium mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-brand-600" />
            Configuração de Notificações
          </h1>
          <p className="text-sm text-slate-500">
             Defina as regras de alerta e criticidade para cada módulo.
          </p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <RefreshCw size={18} className="mr-2" />
                Padrões
            </button>
            <button 
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-bold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                    ${saveStatus === 'SUCCESS' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                      saveStatus === 'ERROR' ? 'bg-red-500 hover:bg-red-600' :
                      'bg-brand-600 hover:bg-brand-700'}
                `}
            >
                {isSaving ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : saveStatus === 'SUCCESS' ? (
                    <CheckCircle2 size={18} className="mr-2" />
                ) : (
                    <Save size={18} className="mr-2" />
                )}
                {saveStatus === 'SUCCESS' ? 'Salvo!' : saveStatus === 'ERROR' ? 'Erro' : 'Salvar Alterações'}
            </button>
        </div>
      </div>

      {saveStatus === 'ERROR' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-3">
              <XCircle size={20} />
              <div>
                  <p className="font-bold">Erro ao salvar configurações</p>
                  <p className="text-sm">{errorMessage || 'Verifique a conexão ou permissões da tabela notification_rules.'}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-6">
          {rules.map(rule => (
              <div key={rule.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {rule.name}
                              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {rule.moduleId}
                              </span>
                          </h3>
                          <p className="text-slate-500 text-sm mt-1">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Ativo</label>
                          <input 
                            type="checkbox" 
                            checked={rule.enabled}
                            onChange={e => handleUpdate(rule.id, 'enabled', e.target.checked)}
                            className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {/* Warning Config */}
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 text-amber-600">
                              <AlertTriangle size={18} />
                              <span className="font-bold text-sm uppercase">Alerta de Vencimento</span>
                          </div>
                          <p className="text-xs text-slate-400">Gerar notificação amarela quando faltar:</p>
                          <div className="flex items-center gap-3">
                              <input 
                                type="number"
                                className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:bg-slate-800 dark:text-white"
                                value={rule.warningDays}
                                onChange={e => handleUpdate(rule.id, 'warningDays', Number(e.target.value))}
                              />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">dias para vencer</span>
                          </div>
                      </div>

                      {/* Critical Config */}
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle size={18} />
                              <span className="font-bold text-sm uppercase">Atraso Crítico (Destaque)</span>
                          </div>
                          <p className="text-xs text-slate-400">Gerar notificação vermelha quando faltar:</p>
                          <div className="flex items-center gap-3">
                              <input 
                                type="number"
                                className="w-20 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:bg-slate-800 dark:text-white"
                                value={rule.criticalDays}
                                onChange={e => handleUpdate(rule.id, 'criticalDays', Number(e.target.value))}
                              />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">dias (ou menos)</span>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
