import React from 'react';
import { 
    History, Edit2, Trash2, Check, User as UserIcon, Calendar, Image, Beaker, Bug,
    AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { PestControlEntry } from '../../types';

// Helper to determine status style
const getDynamicStatus = (entry: PestControlEntry) => {
    if (entry.status === 'REALIZADO') return { status: 'REALIZADO', diff: 0 };
    const today = new Date();
    today.setHours(0,0,0,0);
    const [year, month, day] = entry.scheduledDate.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { status: diff < 0 ? 'ATRASADO' : 'PENDENTE', diff };
};

interface CardProps {
    entry: PestControlEntry;
    canEdit: boolean;
    onHistory: (item: PestControlEntry) => void;
    onEdit: (item: PestControlEntry) => void;
    onComplete: (item: PestControlEntry) => void;
    onDelete: (item: PestControlEntry, e: React.MouseEvent) => void;
}

export const PestExecutionCard: React.FC<CardProps> = ({ 
    entry, canEdit, onHistory, onEdit, onComplete, onDelete 
}) => {
    const { status: dynamicStatus, diff } = getDynamicStatus(entry);
    
    // Define Border Color
    let borderColor = 'border-l-slate-300 dark:border-l-slate-700';
    if (dynamicStatus === 'ATRASADO') borderColor = 'border-l-red-500';
    else if (dynamicStatus === 'REALIZADO') borderColor = 'border-l-emerald-500';
    else borderColor = 'border-l-amber-500';

    const renderStatusPill = () => {
        if (dynamicStatus === 'REALIZADO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><CheckCircle2 size={12}/> Concluído</span>;
        if (dynamicStatus === 'ATRASADO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse"><AlertTriangle size={12}/> Atrasado ({Math.abs(diff)}d)</span>;
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock size={12}/> Aguardando</span>;
    };

    return (
        <div className={`bg-white dark:bg-[#16161a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 border-l-[6px] ${borderColor} hover:shadow-md transition-all group relative overflow-hidden`}>
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                {/* Info Block */}
                <div className="flex items-start gap-4 flex-1">
                    {/* Date Box */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase">{new Date(entry.scheduledDate).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{new Date(entry.scheduledDate).getDate()}</span>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wide border border-slate-200 dark:border-slate-700">{entry.sedeId}</span>
                            {renderStatusPill()}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                            {entry.target}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded"><UserIcon size={12}/> {entry.technician}</span>
                            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded"><Calendar size={12}/> {entry.frequency}</span>
                            {entry.photoUrl && <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded"><Image size={12}/> Foto Anexada</span>}
                        </div>
                    </div>
                </div>

                {/* Actions Block */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                    <button onClick={() => onHistory(entry)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" title="Histórico">
                        <History size={20}/>
                    </button>
                    
                    {canEdit && (
                        <>
                            <button onClick={() => onEdit(entry)} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors" title="Editar">
                                <Edit2 size={20}/>
                            </button>
                            {dynamicStatus !== 'REALIZADO' && (
                                <button onClick={() => onComplete(entry)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20" title="Concluir Serviço">
                                    <Check size={16} /> Baixa
                                </button>
                            )}
                            <button onClick={(e) => onDelete(entry, e)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Excluir">
                                <Trash2 size={20}/>
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Footer Details (Methods) */}
            {(entry.method || entry.product) && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {entry.method && <span className="flex items-center gap-1.5"><Beaker size={12} className="text-purple-500"/> <strong className="text-slate-700 dark:text-slate-300">MET:</strong> {entry.method}</span>}
                    {entry.product && <span className="flex items-center gap-1.5"><Bug size={12} className="text-amber-500"/> <strong className="text-slate-700 dark:text-slate-300">PROD:</strong> {entry.product}</span>}
                </div>
            )}
        </div>
    );
};