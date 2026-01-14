
import React from 'react';
import { 
  ClipboardList, X, Clock, User as UserIcon, Settings, 
  Ruler, Gauge, AlertTriangle, Save 
} from 'lucide-react';
import { FichaPoco } from '../../types';

// Constants locally scoped to this modal component
const MATERIALS_LIST = ['CANO', 'LUVAS', 'CORDA', 'ELETRODO', 'QUADRO DE COMANDO', 'REFIL FILTRO'];
const EPI_LIST = ['Luva nitrílica', 'Bota de borracha', 'Máscara respiratória PFF2', 'Óculos de proteção'];
const STEPS_DIA_1 = [
    '1.1. Desmontar sistema de bomba e retirar canos',
    '1.2. Montar sistema de compressor',
    '1.3. Diluir 1 kg do produto AMC Easy Clean (Hexa T)',
    '1.4. Ligar compressor p/ homogenização (30 min)',
    '1.5. Deixar produto agir (min 6 horas)'
];
const STEPS_DIA_2 = [
    '2.1. Ligar compressor p/ movimentar produto (30 min) e descarte',
    '2.2. Bombear água suja com compressor (início limpeza)',
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
    const [activeFichaTab, setActiveFichaTab] = React.useState<'GERAL' | 'DADOS' | 'CHECKLIST'>('GERAL');

    if (!isOpen || !editItem) return null;

    // Helper functions
    const updateFicha = (field: keyof FichaPoco, value: any) => setFichaData(prev => ({ ...prev, [field]: value }));
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4">
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
                        <div className="hidden md:flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                            {['GERAL', 'DADOS', 'CHECKLIST'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setActiveFichaTab(t as any)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeFichaTab === t ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {t}
                                </button>
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
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> Cronograma</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Início Limpeza</label><input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.inicioLimpeza} onChange={e => updateFicha('inicioLimpeza', e.target.value)} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Término Limpeza</label><input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.terminoLimpeza} onChange={e => updateFicha('terminoLimpeza', e.target.value)} /></div>
                                </div>
                            </div>
                            {/* Team */}
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserIcon size={14}/> Equipe Responsável</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Supervisor:</span><input className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.supervisor} onChange={e => updateFicha('supervisor', e.target.value)} /></div>
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Coord.:</span><input className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.coordenador} onChange={e => updateFicha('coordenador', e.target.value)} /></div>
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase w-20 text-slate-500">Bombeiro:</span><input className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.bombeiro} onChange={e => updateFicha('bombeiro', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>

                        {/* Pump Data */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={14}/> Especificações da Bomba</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Profundidade (m)</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.profundidadeBomba} onChange={e => updateFicha('profundidadeBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Potência (cv)</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.potenciaBomba} onChange={e => updateFicha('potenciaBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Nº Estágios</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono" value={fichaData.numEstagios} onChange={e => updateFicha('numEstagios', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Patrimônio</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono font-bold text-blue-600" value={fichaData.patrimonioBomba} onChange={e => updateFicha('patrimonioBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Marca</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.marcaBomba} onChange={e => updateFicha('marcaBomba', e.target.value)} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500">Modelo</label><input className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" value={fichaData.modeloBomba} onChange={e => updateFicha('modeloBomba', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: DADOS TÉCNICOS (PRE/POS) */}
                    <div className={activeFichaTab === 'DADOS' ? 'block space-y-6' : 'hidden'}>
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

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-400 font-mono hidden md:block">Ultima atualização: {new Date().toLocaleDateString()}</div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                        <button onClick={onSave} className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all">
                            <Save size={16} /> Salvar Ficha
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
