
import React, { useState } from 'react';
import { 
  ClipboardList, X, Clock, User as UserIcon, Settings, 
  Ruler, Gauge, AlertTriangle, Save, ArrowRight, ArrowLeft, AlertCircle 
} from 'lucide-react';
import { FichaPoco } from '../../types';

// Constants locally scoped to this modal component
const MATERIALS_LIST = ['CANO', 'LUVAS', 'CORDA', 'ELETRODO', 'QUADRO DE COMANDO', 'REFIL FILTRO'];
const EPI_LIST = ['Luva nitrílica', 'Bota de borracha', 'máscara respiratória PFF2', 'óculos de proteção'];
const STEPS_DIA_1 = [
    '1.1. Desmontar sistema de bomba e retirar canos',
    '1.2. Montar sistema de compressor',
    '1.3. Diluir 1 kg do produto AMC Easy Clean (Hexa T)',
    '1.4. Ligar compressor p/ homogeneização (30 min)',
    '1.5. Deixar produto agir (min 6 horas)'
];
const STEPS_DIA_2 = [
    '2.1. Ligar compressor p/ movimentar produto (30 min) e descarte',
    '2.2. Bombear água suja com compressor (Início limpeza)',
    '2.3. Limpeza dos canos com cloro puro e palha de aço'
];
const STEPS_DIA_3 = [
    '3.1. Continuar bombeando água suja até meio dia',
    '3.2. Desmontar sistema de compressor',
    '3.3. Montar sistema da bomba',
    '3.4. Iniciar função do poço'
];
const NECESSITIES_LIST = [
    '1. Substituição dos 3 eletrodos da encanação',
    '2. Verificação do estado das luvas galvanizadas',
    '3. Verificação do estado da corda de fixação',
    '4. Substituição do filtro do poço (se 6 meses uso)'
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editItem: any;
    fichaData: FichaPoco;
    setFichaData: React.Dispatch<React.SetStateAction<FichaPoco>>;
    onSave: () => void;
}

export const ReservoirFichaModal: React.FC<Props> = ({ 
    isOpen, onClose, editItem, fichaData, setFichaData, onSave 
}) => {
    const [activeFichaTab, setActiveFichaTab] = useState<'GERAL' | 'DADOS' | 'CHECKLIST'>('GERAL');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !editItem) return null;

    // Helper functions
    const updateFicha = (field: keyof FichaPoco, value: any) => {
        setErrorMsg(null); // Clear error on change
        setFichaData(prev => ({ ...prev, [field]: value }));
    };
    
    const updateNestedFicha = (section: 'preLimpeza' | 'posLimpeza', field: string, value: string) => {
        setFichaData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };
    
    const toggleCheck = (listName: keyof typeof fichaData.checklist, item: string) => {
        setFichaData(prev => {
            const list = prev.checklist[listName] as string[];
            const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
            return { ...prev, checklist: { ...prev.checklist, [listName]: newList } };
        });
    };
    
    const toggleNecessidade = (item: string) => {
        setFichaData(prev => ({
            ...prev,
            necessidades: prev.necessidades.includes(item) ? prev.necessidades.filter(i => i !== item) : [...prev.necessidades, item]
        }));
    };
    
    const updateMaterial = (idx: number, field: 'situacao' | 'obs', value: string) => {
        const newMats = [...fichaData.materiais];
        newMats[idx] = { ...newMats[idx], [field]: value };
        setFichaData(prev => ({ ...prev, materiais: newMats }));
    };

    // --- NAVIGATION & VALIDATION LOGIC ---
    const validateStep = (step: 'GERAL' | 'DADOS'): boolean => {
        setErrorMsg(null);
        if (step === 'GERAL') {
            if (!fichaData.inicioLimpeza || !fichaData.terminoLimpeza) {
                setErrorMsg("As datas de Início e término são obrigatérias.");
                return false;
            }
            if (!fichaData.supervisor || !fichaData.bombeiro) {
                setErrorMsg("Supervisor e Bombeiro são obrigatérios.");
                return false;
            }
        }
        if (step === 'DADOS') {
            // Check basic pump data presence
            if (!fichaData.potenciaBomba || !fichaData.marcaBomba) {
                setErrorMsg("Informe a Potência e Marca da bomba para prosseguir.");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (activeFichaTab === 'GERAL') {
            if (validateStep('GERAL')) setActiveFichaTab('DADOS');
        } else if (activeFichaTab === 'DADOS') {
            if (validateStep('DADOS')) setActiveFichaTab('CHECKLIST');
        }
    };

    const handleBack = () => {
        setErrorMsg(null);
        if (activeFichaTab === 'CHECKLIST') setActiveFichaTab('DADOS');
        else if (activeFichaTab === 'DADOS') setActiveFichaTab('GERAL');
    };

    const handleFinalSave = () => {
        // Final Validation (Optional Checklist Check)
        // Just ensuring logic flow is clean
        onSave();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4">
            <div className="bg-white dark:bg-[#111114] w-full max-w-5xl h-full md:h-auto md:max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 text-white rounded-lg"><ClipboardList size={20}/></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Ficha Operacional de Limpeza</h2>
                                <p className="text-xs text-slate-500 font-mono uppercase">{editItem.sedeId} // {editItem.local}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Stepper Indicator */}
                        <div className="hidden md:flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                            {['GERAL', 'DADOS', 'CHECKLIST'].map((t, idx) => (
                                <div 
                                    key={t}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${activeFichaTab === t ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                                >
                                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px]">{idx + 1}</span> {t}
                                </div>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
                    </div>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-[#0A0A0C]">
                    
                    {/* SECTION: GERAL & EQUIPE */}
                    <div className={activeFichaTab === 'GERAL' ? 'block space-y-6' : 'hidden'}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dates */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> Cronograma (Obrigatório)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">início Limpeza *</label><input type="date" className={`w-full p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm font-mono ${!fichaData.inicioLimpeza && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.inicioLimpeza} onChange={e => updateFicha('inicioLimpeza', e.target.value)} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">término Limpeza *</label><input type="date" className={`w-full p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm font-mono ${!fichaData.terminoLimpeza && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.terminoLimpeza} onChange={e => updateFicha('terminoLimpeza', e.target.value)} /></div>
                                </div>
                            </div>
                            {/* Team */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserIcon size={14}/> Equipe Responsável</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Supervisor*:</span><input className={`flex-1 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm ${!fichaData.supervisor && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.supervisor} onChange={e => updateFicha('supervisor', e.target.value)} /></div>
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Coord.:</span><input className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.coordenador} onChange={e => updateFicha('coordenador', e.target.value)} /></div>
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Bombeiro*:</span><input className={`flex-1 p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm ${!fichaData.bombeiro && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.bombeiro} onChange={e => updateFicha('bombeiro', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: DADOS técnicos (BOMBA/PRE/POS) */}
                    <div className={activeFichaTab === 'DADOS' ? 'block space-y-6' : 'hidden'}>
                        
                        {/* Pump Data - Moved Here */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={14}/> Especificações da Bomba (Obrigatório)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Marca *</label><input className={`w-full p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm ${!fichaData.marcaBomba && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.marcaBomba} onChange={e => updateFicha('marcaBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Potência (cv) *</label><input className={`w-full p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg text-sm font-mono ${!fichaData.potenciaBomba && errorMsg ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} value={fichaData.potenciaBomba} onChange={e => updateFicha('potenciaBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Modelo</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.modeloBomba} onChange={e => updateFicha('modeloBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Profundidade (m)</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.profundidadeBomba} onChange={e => updateFicha('profundidadeBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Nº Estágios</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.numEstagios} onChange={e => updateFicha('numEstagios', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Patrimônio</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono font-bold text-blue-600" value={fichaData.patrimonioBomba} onChange={e => updateFicha('patrimonioBomba', e.target.value)} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* PRE */}
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Ruler size={14}/> Pré-Limpeza</h3>
                                <div className="space-y-3">
                                    {['profundidade', 'nivelEstatico', 'tempo', 'vazao'].map(field => (
                                        <div key={field} className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <input className="w-24 p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-right font-mono text-sm" 
                                                value={(fichaData.preLimpeza as any)[field]} 
                                                onChange={e => updateNestedFicha('preLimpeza', field, e.target.value)} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* POS */}
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Gauge size={14}/> Pós-Limpeza</h3>
                                <div className="space-y-3">
                                    {['profundidade', 'nivelEstatico', 'tempo', 'vazao'].map(field => (
                                        <div key={field} className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <input className="w-24 p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-right font-mono text-sm" 
                                                value={(fichaData.posLimpeza as any)[field]} 
                                                onChange={e => updateNestedFicha('posLimpeza', field, e.target.value)} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* MATERIALS */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Materiais Utilizados</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950 text-[9px] font-bold text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3">Item</th>
                                            <th className="p-3">Situação</th>
                                            <th className="p-3">Observações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {fichaData.materiais.map((mat, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 font-bold text-xs uppercase">{mat.item}</td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        {['BOM', 'REGULAR', 'RUIM'].map(opt => (
                                                            <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                                                <input type="radio" name={`mat-${idx}`} checked={mat.situacao === opt} onChange={() => updateMaterial(idx, 'situacao', opt as any)} className="accent-blue-600"/>
                                                                <span className="text-[9px] font-bold">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3"><input className="w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs p-1 outline-none" value={mat.obs} onChange={e => updateMaterial(idx, 'obs', e.target.value)} placeholder="..." /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CHECKLIST & OBS */}
                    <div className={activeFichaTab === 'CHECKLIST' ? 'block space-y-6' : 'hidden'}>
                        {/* EPIs */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">EPIs Utilizados</h3>
                            <div className="flex flex-wrap gap-4">
                                {EPI_LIST.map(epi => (
                                    <label key={epi} className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-colors">
                                        <input type="checkbox" checked={fichaData.checklist.epis.includes(epi)} onChange={() => toggleCheck('epis', epi)} className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{epi}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: 'Dia 1: Retirada', steps: STEPS_DIA_1, key: 'dia1' },
                                { title: 'Dia 2: Limpeza', steps: STEPS_DIA_2, key: 'dia2' },
                                { title: 'Dia 3: Montagem', steps: STEPS_DIA_3, key: 'dia3' }
                            ].map((day, dIdx) => (
                                <div key={day.key} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">{day.title}</h3>
                                    <div className="space-y-3">
                                        {day.steps.map(step => (
                                            <label key={step} className="flex items-start gap-2 cursor-pointer group">
                                                <input type="checkbox" checked={(fichaData.checklist as any)[day.key].includes(step)} onChange={() => toggleCheck(day.key as any, step)} className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-blue-600 shrink-0" />
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight">{step}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Necessidades */}
                        <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                            <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14}/> Necessidades Identificadas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {NECESSITIES_LIST.map(nec => (
                                    <label key={nec} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={fichaData.necessidades.includes(nec)} onChange={() => toggleNecessidade(nec)} className="w-4 h-4 rounded border-red-300 accent-red-600" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{nec}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Obs */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Observações Gerais</h3>
                            <textarea className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 resize-none h-32" 
                                placeholder="Digite aqui..." 
                                value={fichaData.observacoes} 
                                onChange={e => updateFicha('observacoes', e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Dynamic Wizard Buttons) */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4 md:gap-0">
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {errorMsg && (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold animate-pulse">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}
                        {!errorMsg && <div className="text-xs text-slate-400 font-mono hidden md:block">Última atualização: {new Date().toLocaleDateString()}</div>}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                        
                        {activeFichaTab !== 'GERAL' && (
                            <button onClick={handleBack} className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        )}

                        {activeFichaTab === 'CHECKLIST' ? (
                            <button onClick={handleFinalSave} className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105">
                                <Save size={16} /> Salvar Ficha
                            </button>
                        ) : (
                            <button onClick={handleNext} className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105">
                                próximo <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
